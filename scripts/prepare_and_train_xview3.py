import os
import shutil
import pandas as pd
import rasterio
from rasterio.windows import Window
import numpy as np
import cv2
from ultralytics import YOLO

def normalize_sar_crop(crop, min_db=-30.0, max_db=0.0):
    crop_clipped = np.clip(crop, min_db, max_db)
    crop_norm = (crop_clipped - min_db) / (max_db - min_db)
    crop_8bit = (crop_norm * 255.0).astype(np.uint8)
    if len(crop_8bit.shape) == 2:
        return np.stack([crop_8bit]*3, axis=-1)
    return crop_8bit[..., :3] if len(crop_8bit.shape) == 3 else crop_8bit

def build_dataset():
    print("1. Preparing YOLO Crop Dataset (Non-Overlapping Grid)...")
    out_dir = "data/yolo_real"
    if os.path.exists(out_dir):
        shutil.rmtree(out_dir)
        
    for split in ['train', 'val', 'val_ais', 'val_manual']:
        os.makedirs(f"{out_dir}/images/{split}", exist_ok=True)
        os.makedirs(f"{out_dir}/labels/{split}", exist_ok=True)
        
    train_csv = pd.read_csv("data/raw/xview3/train.csv")
    val_csv = pd.read_csv("data/raw/xview3/validation.csv")
    
    tile_size = 640
    
    def process_split(split_name, scenes_dir, csv_df):
        scenes = [d for d in os.listdir(scenes_dir) if os.path.isdir(os.path.join(scenes_dir, d))]
        
        for scene in scenes:
            scene_df = csv_df[(csv_df['scene_id'] == scene) & (csv_df['is_vessel'] == True)].copy()
            # Retain only convertible targets
            has_len = scene_df['vessel_length_m'].notna()
            has_bbox = scene_df['top'].notna() & scene_df['left'].notna()
            scene_df = scene_df[has_len | has_bbox].copy()
            
            tiff_path = os.path.join(scenes_dir, scene, "VV_dB.tif")
            if not os.path.exists(tiff_path):
                continue
                
            with rasterio.open(tiff_path) as src:
                transform = src.transform
                width, height = src.width, src.height
                
                # Spatial res
                if src.crs and src.crs.is_geographic:
                    center_lat = transform[5] + (height/2)*transform[4]
                    dx_m = abs(transform[0]) * 111320.0 * np.cos(np.radians(center_lat))
                    dy_m = abs(transform[4]) * 111320.0
                else:
                    dx_m = abs(transform[0])
                    dy_m = abs(transform[4])
                if dx_m == 0: dx_m, dy_m = 10.0, 10.0
                
                # Pre-calculate pixel centers and boxes for all targets
                targets = []
                for _, row in scene_df.iterrows():
                    is_manual = pd.notna(row.get('top')) and pd.notna(row.get('bottom'))
                    if is_manual:
                        ymin, ymax = row['top'], row['bottom']
                        xmin, xmax = row['left'], row['right']
                        cx = xmin + (xmax - xmin)/2.0
                        cy = ymin + (ymax - ymin)/2.0
                        w_px = xmax - xmin
                        h_px = ymax - ymin
                        cls_type = "manual"
                    else:
                        cx = row['detect_scene_column']
                        cy = row['detect_scene_row']
                        v_len = max(row['vessel_length_m'], 5.0)
                        w_px = v_len / dx_m
                        h_px = v_len / dy_m
                        cls_type = "ais"
                        
                    targets.append({
                        'cx': cx, 'cy': cy, 'w': w_px, 'h': h_px, 'type': cls_type
                    })
                
                # Assign to non-overlapping tiles
                tiles = {}
                for t in targets:
                    gx = int(t['cx'] // tile_size)
                    gy = int(t['cy'] // tile_size)
                    tiles.setdefault((gx, gy), []).append(t)
                    
                for (gx, gy), t_list in tiles.items():
                    x0 = gx * tile_size
                    y0 = gy * tile_size
                    
                    # Ensure tile fits in image
                    if x0 + tile_size > width or y0 + tile_size > height:
                        continue
                        
                    # Extract tile
                    window = Window(x0, y0, tile_size, tile_size)
                    crop = src.read(1, window=window)
                    crop_img = normalize_sar_crop(crop)
                    
                    # Create labels
                    boxes = []
                    has_manual = False
                    has_ais = False
                    
                    for t in t_list:
                        # Convert to tile-relative YOLO format
                        rel_cx = (t['cx'] - x0) / tile_size
                        rel_cy = (t['cy'] - y0) / tile_size
                        rel_w = t['w'] / tile_size
                        rel_h = t['h'] / tile_size
                        
                        # Clip to tile bounds
                        if 0 <= rel_cx <= 1 and 0 <= rel_cy <= 1:
                            boxes.append(f"0 {rel_cx:.6f} {rel_cy:.6f} {rel_w:.6f} {rel_h:.6f}")
                            if t['type'] == 'manual': has_manual = True
                            if t['type'] == 'ais': has_ais = True
                            
                    if not boxes:
                        continue
                        
                    tile_name = f"{scene}_{gx}_{gy}"
                    
                    # Save into main split
                    cv2.imwrite(f"{out_dir}/images/{split_name}/{tile_name}.jpg", crop_img)
                    with open(f"{out_dir}/labels/{split_name}/{tile_name}.txt", "w") as f:
                        f.write("\n".join(boxes) + "\n")
                        
                    # Save into specialized validation splits if applicable
                    if split_name == "val":
                        if has_manual:
                            cv2.imwrite(f"{out_dir}/images/val_manual/{tile_name}.jpg", crop_img)
                            with open(f"{out_dir}/labels/val_manual/{tile_name}.txt", "w") as f:
                                f.write("\n".join(boxes) + "\n")
                        if has_ais:
                            cv2.imwrite(f"{out_dir}/images/val_ais/{tile_name}.jpg", crop_img)
                            with open(f"{out_dir}/labels/val_ais/{tile_name}.txt", "w") as f:
                                f.write("\n".join(boxes) + "\n")

    process_split("train", "data/raw/xview3/tiny/train", train_csv)
    process_split("val", "data/raw/xview3/tiny/validation", val_csv)
    
    # Create YAMLs
    base_yaml = f"path: {os.path.abspath(out_dir)}\nnames:\n  0: vessel\n"
    with open(f"{out_dir}/dataset.yaml", "w") as f:
        f.write(base_yaml + "train: images/train\nval: images/val\n")
    with open(f"{out_dir}/dataset_ais.yaml", "w") as f:
        f.write(base_yaml + "train: images/train\nval: images/val_ais\n")
    with open(f"{out_dir}/dataset_manual.yaml", "w") as f:
        f.write(base_yaml + "train: images/train\nval: images/val_manual\n")
        
    print("Dataset construction complete.")

def train_and_eval():
    print("\n2. Training YOLOv8n on Real xView3 Tiny...")
    model = YOLO("models/yolov8n.pt")
    out_dir = "data/yolo_real"
    
    model.train(
        data=f"{out_dir}/dataset.yaml",
        epochs=5,
        imgsz=640,
        batch=4,
        device="mps",
        project="runs/xview3",
        name="full_train",
        exist_ok=True,
        verbose=False
    )
    
    print("\n3. Evaluating on Main Validation Set...")
    metrics_all = model.val(data=f"{out_dir}/dataset.yaml", split="val", verbose=False)
    
    print("\n4. Evaluating on AIS-Only Targets...")
    metrics_ais = model.val(data=f"{out_dir}/dataset_ais.yaml", split="val", verbose=False)
    
    print("\n5. Evaluating on Manual-Only Targets...")
    metrics_manual = model.val(data=f"{out_dir}/dataset_manual.yaml", split="val", verbose=False)
    
    def print_m(name, m):
        try:
            p = m.results_dict.get('metrics/precision(B)', 0.0)
            r = m.results_dict.get('metrics/recall(B)', 0.0)
            map50 = m.results_dict.get('metrics/mAP50(B)', 0.0)
            map50_95 = m.results_dict.get('metrics/mAP50-95(B)', 0.0)
        except:
            p, r, map50, map50_95 = 0, 0, 0, 0
        print(f"--- {name} ---")
        print(f"  Precision: {p:.4f} | Recall: {r:.4f}")
        print(f"  mAP50: {map50:.4f} | mAP50-95: {map50_95:.4f}")

    print_m("ALL TARGETS", metrics_all)
    print_m("AIS (INFERRED SQUARES)", metrics_ais)
    print_m("MANUAL (NATIVE BOXES)", metrics_manual)
    
    speed = metrics_all.speed.get("inference", 0.0) if hasattr(metrics_all, "speed") else 0.0
    print(f"\nInference Speed: {speed:.2f} ms/img")

def main():
    build_dataset()
    train_and_eval()

if __name__ == "__main__":
    main()
