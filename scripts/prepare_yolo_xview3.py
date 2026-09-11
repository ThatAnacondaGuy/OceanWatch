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
    print("Preparing YOLO dataset...")
    tiff_path = "data/raw/xview3/scene_1.tif"
    csv_path = "data/raw/xview3/labels.csv"
    
    out_dir = "data/yolo_dataset"
    os.makedirs(f"{out_dir}/images/train", exist_ok=True)
    os.makedirs(f"{out_dir}/images/val", exist_ok=True)
    os.makedirs(f"{out_dir}/labels/train", exist_ok=True)
    os.makedirs(f"{out_dir}/labels/val", exist_ok=True)
    
    # Generate YAML
    with open(f"{out_dir}/dataset.yaml", "w") as f:
        f.write(f"path: {os.path.abspath(out_dir)}\n")
        f.write("train: images/train\n")
        f.write("val: images/val\n")
        f.write("names:\n  0: vessel\n")
        
    df = pd.read_csv(csv_path)
    
    with rasterio.open(tiff_path) as src:
        img_array = src.read(1)
        transform = src.transform
        
        # Get GT pixels
        gt_pixels = []
        for _, row in df.iterrows():
            if row['scene_id'] == 'scene_1' and row['is_vessel']:
                try:
                    py, px = rasterio.transform.rowcol(transform, row['lon'], row['lat'])
                    gt_pixels.append((px, py))
                except Exception as e:
                    print("Error getting pixel coords:", e)
                    
        print(f"GT Pixels found: {gt_pixels}")
        
        cfar = CFARDetector(window_size=51, guard_size=11, k=3.5)
        print("Running CFAR...")
        mask = cfar.detect(img_array)
        rois = cfar.extract_rois(img_array.shape, mask, transform, padding=20)
        
        print(f"CFAR found {len(rois)} candidates.")
        
        # We will make 128x128 crops around each ROI center
        crop_size = 128
        h, w = img_array.shape
        
        for i, roi in enumerate(rois):
            cx, cy = int(roi['center'][0]), int(roi['center'][1])
            
            x1 = max(0, cx - crop_size//2)
            y1 = max(0, cy - crop_size//2)
            x2 = min(w, cx + crop_size//2)
            y2 = min(h, cy + crop_size//2)
            
            if x2 - x1 != crop_size or y2 - y1 != crop_size:
                continue
                
            crop = img_array[y1:y2, x1:x2]
            crop_img = normalize_sar_crop(crop)
            
            # Check if any GT is inside this crop
            has_gt = False
            gt_boxes = []
            for gx, gy in gt_pixels:
                if x1 <= gx <= x2 and y1 <= gy <= y2:
                    has_gt = True
                    # Assume 10x10 box around point
                    nx = (gx - x1) / crop_size
                    ny = (gy - y1) / crop_size
                    nw = 10.0 / crop_size
                    nh = 10.0 / crop_size
                    gt_boxes.append(f"0 {nx} {ny} {nw} {nh}")
            
            # Put the one with GT in train, and some background in train/val
            if has_gt:
                split = "train"
                name = f"pos_{i}"
            else:
                split = "val" if i % 2 == 0 else "train"
                name = f"neg_{i}"
                
            cv2.imwrite(f"{out_dir}/images/{split}/{name}.jpg", crop_img)
            with open(f"{out_dir}/labels/{split}/{name}.txt", "w") as f:
                if has_gt:
                    f.write("\n".join(gt_boxes))
                    
    print("YOLO dataset prepared.")

if __name__ == "__main__":
    main()
