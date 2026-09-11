import os
import pandas as pd
import rasterio
import numpy as np

class XView3DatasetParser:
    def __init__(self, tiff_path, csv_path):
        self.tiff_path = tiff_path
        self.csv_path = csv_path
        self.scene_id = os.path.splitext(os.path.basename(tiff_path))[0]

    def validate_schema(self):
        """
        Validates against the documented real xView3 schema.
        Note: Real xView3 compatibility is pending until actual files are parsed.
        """
        if not os.path.exists(self.csv_path):
            return False, "CSV missing"
        if not os.path.exists(self.tiff_path):
            return False, "TIFF missing"
            
        df = pd.read_csv(self.csv_path)
        expected_cols = ['scene_id', 'lat', 'lon', 'is_vessel', 'vessel_length_m']
        missing = [c for c in expected_cols if c not in df.columns]
        if missing:
            return False, f"Missing columns: {missing}"
            
        return True, "Valid"

    def convert_to_yolo_format(self, output_dir, crop_size=800):
        """
        Converts xView3 target metadata to normalized YOLOv8 bounding boxes.
        Replaces hardcoded bounds with a dynamic conversion based on physical 
        vessel lengths and the raster's true spatial resolution.
        """
        df = pd.read_csv(self.csv_path)
        
        # Strict filter for confirmed vessels in this scene
        scene_df = df[(df['scene_id'] == self.scene_id) & (df['is_vessel'] == True)].copy()
        
        # Strict enforcement: Do not fabricate missing dimensions
        if 'vessel_length_m' not in scene_df.columns:
            raise ValueError("Real xView3 schema violated: 'vessel_length_m' missing.")
            
        initial_len = len(scene_df)
        scene_df = scene_df.dropna(subset=['vessel_length_m'])
        if len(scene_df) < initial_len:
            print(f"[WARNING] Dropped {initial_len - len(scene_df)} detections lacking physical dimensions.")
            
        os.makedirs(output_dir, exist_ok=True)
        yolo_txt_path = os.path.join(output_dir, f"{self.scene_id}.txt")
        
        with rasterio.open(self.tiff_path) as src:
            transform = src.transform
            width = src.width
            height = src.height
            crs = src.crs
            
            xs = scene_df['lon'].values
            ys = scene_df['lat'].values
            
            if len(xs) > 0:
                rows, cols = rasterio.transform.rowcol(transform, xs, ys)
                scene_df['px_x'] = cols
                scene_df['px_y'] = rows
            else:
                scene_df['px_x'] = []
                scene_df['px_y'] = []
                
            is_geographic = crs is not None and crs.is_geographic
            if is_geographic:
                dx_deg = abs(transform[0])
                dy_deg = abs(transform[4])
            else:
                dx_m = abs(transform[0])
                dy_m = abs(transform[4])
                
            with open(yolo_txt_path, 'w') as f:
                for _, row in scene_df.iterrows():
                    x_norm = row['px_x'] / width
                    y_norm = row['px_y'] / height
                    
                    v_len = max(row['vessel_length_m'], 5.0) # Ensure physically non-zero for math stability
                    
                    if is_geographic:
                        lat = row['lat']
                        # Approximate meters per degree using latitude
                        m_per_deg_lon = 111320.0 * np.cos(np.radians(lat))
                        m_per_deg_lat = 111320.0
                        
                        w_px = v_len / (dx_deg * m_per_deg_lon + 1e-7)
                        h_px = v_len / (dy_deg * m_per_deg_lat + 1e-7)
                    else:
                        w_px = v_len / (dx_m + 1e-7)
                        h_px = v_len / (dy_m + 1e-7)
                        
                    w_norm = w_px / width
                    h_norm = h_px / height
                    
                    # Ensure normalized bounds are strictly [0, 1]
                    x_norm = np.clip(x_norm, 0.0, 1.0)
                    y_norm = np.clip(y_norm, 0.0, 1.0)
                    w_norm = np.clip(w_norm, 0.0, 1.0)
                    h_norm = np.clip(h_norm, 0.0, 1.0)
                    
                    f.write(f"0 {x_norm:.6f} {y_norm:.6f} {w_norm:.6f} {h_norm:.6f}\n")
                    
        return yolo_txt_path, len(scene_df)
