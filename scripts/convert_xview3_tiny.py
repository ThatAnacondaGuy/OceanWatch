import os
import pandas as pd
import rasterio
import numpy as np

def convert_scene(scene_id, tiff_path, df, out_dir):
    scene_df = df[(df['scene_id'] == scene_id) & (df['is_vessel'] == True)].copy()
    initial_count = len(scene_df)
    
    # Keep rows that have EITHER vessel_length_m OR top/left/bottom/right
    has_length = scene_df['vessel_length_m'].notna()
    has_bbox = scene_df['top'].notna() & scene_df['left'].notna() & scene_df['bottom'].notna() & scene_df['right'].notna()
    
    scene_df = scene_df[has_length | has_bbox]
    dropped = initial_count - len(scene_df)
    
    os.makedirs(out_dir, exist_ok=True)
    out_txt = os.path.join(out_dir, f"{scene_id}.txt")
    
    with rasterio.open(tiff_path) as src:
        width = src.width
        height = src.height
        transform = src.transform
        
        if src.crs and src.crs.is_geographic:
            center_lat = transform[5] + (height/2)*transform[4]
            m_per_deg_lat = 111320.0
            m_per_deg_lon = 111320.0 * np.cos(np.radians(center_lat))
            dx_m = abs(transform[0]) * m_per_deg_lon
            dy_m = abs(transform[4]) * m_per_deg_lat
        else:
            dx_m = abs(transform[0])
            dy_m = abs(transform[4])
            
        if dx_m == 0 or dy_m == 0:
            dx_m, dy_m = 10.0, 10.0 
            
        with open(out_txt, "w") as f:
            valid_boxes = 0
            for _, row in scene_df.iterrows():
                if pd.notna(row.get('top')) and pd.notna(row.get('bottom')) and pd.notna(row.get('left')) and pd.notna(row.get('right')):
                    ymin = row['top']
                    ymax = row['bottom']
                    xmin = row['left']
                    xmax = row['right']
                    w_px = xmax - xmin
                    h_px = ymax - ymin
                    cx_px = xmin + w_px / 2.0
                    cy_px = ymin + h_px / 2.0
                else:
                    cx_px = row['detect_scene_column']
                    cy_px = row['detect_scene_row']
                    v_len_m = max(row['vessel_length_m'], 5.0)
                    w_px = v_len_m / dx_m
                    h_px = v_len_m / dy_m
                
                x_norm = cx_px / width
                y_norm = cy_px / height
                w_norm = w_px / width
                h_norm = h_px / height
                
                if (0.0 <= x_norm <= 1.0) and (0.0 <= y_norm <= 1.0):
                    f.write(f"0 {x_norm:.6f} {y_norm:.6f} {w_norm:.6f} {h_norm:.6f}\n")
                    valid_boxes += 1
                else:
                    dropped += 1
                    
    return initial_count, valid_boxes, dropped

def main():
    print("--- PHASE I-1 (CORRECTED): XVIEW3 CFAR -> YOLO CONVERSION ---")
    train_csv = pd.read_csv("data/raw/xview3/train.csv")
    val_csv = pd.read_csv("data/raw/xview3/validation.csv")
    
    train_dir = "data/raw/xview3/tiny/train"
    val_dir = "data/raw/xview3/tiny/validation"
    out_dir_train = "data/yolo_tiny/labels/train"
    out_dir_val = "data/yolo_tiny/labels/val"
    
    # Process Train
    print("1. Processing Training Scenes:")
    train_scenes = [d for d in os.listdir(train_dir) if os.path.isdir(os.path.join(train_dir, d))]
    
    t_initial = t_converted = t_dropped = 0
    for scene in train_scenes:
        tiff_path = os.path.join(train_dir, scene, "VV_dB.tif")
        i, c, d = convert_scene(scene, tiff_path, train_csv, out_dir_train)
        t_initial += i; t_converted += c; t_dropped += d
    print(f"   Train Totals: {t_initial} initial, {t_converted} converted, {t_dropped} dropped.")
    
    # Process Val
    print("\n2. Processing Validation Scenes:")
    val_scenes = [d for d in os.listdir(val_dir) if os.path.isdir(os.path.join(val_dir, d))]
    
    v_initial = v_converted = v_dropped = 0
    for scene in val_scenes:
        tiff_path = os.path.join(val_dir, scene, "VV_dB.tif")
        i, c, d = convert_scene(scene, tiff_path, val_csv, out_dir_val)
        v_initial += i; v_converted += c; v_dropped += d
    print(f"   Validation Totals: {v_initial} initial, {v_converted} converted, {v_dropped} dropped.")

if __name__ == "__main__":
    main()
