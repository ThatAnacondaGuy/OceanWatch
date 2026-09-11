import os
import rasterio
import pandas as pd
import numpy as np
import cv2
import shutil

import sys
sys.path.append(os.getcwd())
from backend.app.worker.stages.cfar import CFARDetector

def normalize_sar_crop(crop, min_db=-30.0, max_db=0.0):
    crop_clipped = np.clip(crop, min_db, max_db)
    crop_norm = (crop_clipped - min_db) / (max_db - min_db)
    crop_8bit = (crop_norm * 255.0).astype(np.uint8)
    if len(crop_8bit.shape) == 2:
        return np.stack([crop_8bit]*3, axis=-1)
    return crop_8bit[..., :3] if len(crop_8bit.shape) == 3 else crop_8bit

def main():
    print("Preparing YOLO dataset V2...")
    tiff_path = "data/raw/xview3/scene_1.tif"
    csv_path = "data/raw/xview3/labels.csv"
    
    out_dir = "data/yolo_dataset"
    if os.path.exists(out_dir):
        shutil.rmtree(out_dir)
        
    os.makedirs(f"{out_dir}/images/train", exist_ok=True)
    os.makedirs(f"{out_dir}/images/val", exist_ok=True)
    os.makedirs(f"{out_dir}/labels/train", exist_ok=True)
    os.makedirs(f"{out_dir}/labels/val", exist_ok=True)
    
    with open(f"{out_dir}/dataset.yaml", "w") as f:
        f.write(f"path: {os.path.abspath(out_dir)}\n")
        f.write("train: images/train\n")
        f.write("val: images/val\n")
        f.write("names:\n  0: vessel\n")
        
    df = pd.read_csv(csv_path)
    
    with rasterio.open(tiff_path) as src:
        img_array = src.read(1)
        transform = src.transform
        
        gt_pixels = []
        for _, row in df.iterrows():
            if row['scene_id'] == 'scene_1' and row['is_vessel']:
                try:
                    py, px = rasterio.transform.rowcol(transform, row['lon'], row['lat'])
                    gt_pixels.append((px, py))
                except Exception as e:
                    pass
                    
        # Find candidates (lower K to get false alarms)
        cfar = CFARDetector(window_size=51, guard_size=11, k=2.0)
        mask = cfar.detect(img_array)
        rois = cfar.extract_rois(img_array.shape, mask, transform, padding=20)
        
        crop_size = 128
        h, w = img_array.shape
        
        # Add random offsets to the positive sample to create train/val splits
        if len(gt_pixels) > 0:
            gx, gy = gt_pixels[0]
            
            # Train Crop
            x1 = max(0, gx - crop_size//2)
            y1 = max(0, gy - crop_size//2)
            crop_img = normalize_sar_crop(img_array[y1:y1+crop_size, x1:x1+crop_size])
            cv2.imwrite(f"{out_dir}/images/train/pos_train.jpg", crop_img)
            with open(f"{out_dir}/labels/train/pos_train.txt", "w") as f:
                nx, ny = 0.5, 0.5
                f.write(f"0 {nx} {ny} 0.1 0.1\n")
                
            # Val Crop (shifted by 20 pixels)
            x1 = max(0, gx - crop_size//2 + 20)
            y1 = max(0, gy - crop_size//2 - 20)
            crop_img = normalize_sar_crop(img_array[y1:y1+crop_size, x1:x1+crop_size])
            cv2.imwrite(f"{out_dir}/images/val/pos_val.jpg", crop_img)
            with open(f"{out_dir}/labels/val/pos_val.txt", "w") as f:
                nx = (gx - x1) / crop_size
                ny = (gy - y1) / crop_size
                f.write(f"0 {nx} {ny} 0.1 0.1\n")
        
        for i, roi in enumerate(rois):
            cx, cy = int(roi['center'][0]), int(roi['center'][1])
            x1 = max(0, cx - crop_size//2)
            y1 = max(0, cy - crop_size//2)
            if x1+crop_size > w or y1+crop_size > h: continue
            
            # check if it contains GT
            contains_gt = False
            for gx, gy in gt_pixels:
                if x1 <= gx <= x1+crop_size and y1 <= gy <= y1+crop_size:
                    contains_gt = True
            
            if not contains_gt:
                split = "train" if i % 2 == 0 else "val"
                crop_img = normalize_sar_crop(img_array[y1:y1+crop_size, x1:x1+crop_size])
                cv2.imwrite(f"{out_dir}/images/{split}/neg_{i}.jpg", crop_img)
                with open(f"{out_dir}/labels/{split}/neg_{i}.txt", "w") as f:
                    pass

    print("YOLO dataset prepared.")

if __name__ == "__main__":
    main()
