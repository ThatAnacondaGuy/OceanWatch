import os
import rasterio
import pandas as pd
import cv2
import numpy as np
import matplotlib.pyplot as plt

def normalize_sar_crop(crop, min_db=-30.0, max_db=0.0):
    crop_clipped = np.clip(crop, min_db, max_db)
    crop_norm = (crop_clipped - min_db) / (max_db - min_db)
    crop_8bit = (crop_norm * 255.0).astype(np.uint8)
    if len(crop_8bit.shape) == 2:
        return np.stack([crop_8bit]*3, axis=-1)
    return crop_8bit[..., :3] if len(crop_8bit.shape) == 3 else crop_8bit

def generate_overlays():
    print("Generating visual overlays for conversion validation...")
    
    scenes_to_check = [
        ("data/raw/xview3/tiny/train/05bc615a9b0e1159t/VV_dB.tif", "data/yolo_tiny/labels/train/05bc615a9b0e1159t.txt"),
        ("data/raw/xview3/tiny/validation/b1844cde847a3942v/VV_dB.tif", "data/yolo_tiny/labels/val/b1844cde847a3942v.txt")
    ]
    
    fig, axes = plt.subplots(1, 2, figsize=(10, 5))
    
    for i, (tiff_path, txt_path) in enumerate(scenes_to_check):
        with rasterio.open(tiff_path) as src:
            width = src.width
            height = src.height
            
            # Read bounding boxes
            with open(txt_path, "r") as f:
                boxes = f.readlines()
                
            if not boxes:
                continue
                
            # Take the first valid bounding box to crop around
            cls, nx, ny, nw, nh = map(float, boxes[0].strip().split())
            
            cx = int(nx * width)
            cy = int(ny * height)
            w_px = int(nw * width)
            h_px = int(nh * height)
            
            # Crop 200x200 around center
            crop_size = 200
            x1 = max(0, cx - crop_size//2)
            y1 = max(0, cy - crop_size//2)
            x2 = min(width, x1 + crop_size)
            y2 = min(height, y1 + crop_size)
            
            crop = src.read(1, window=rasterio.windows.Window(x1, y1, x2-x1, y2-y1))
            crop_vis = normalize_sar_crop(crop)
            
            # Draw all boxes that fall in this crop
            for box in boxes:
                _, bx, by, bw, bh = map(float, box.strip().split())
                bcx = int(bx * width)
                bcy = int(by * height)
                b_w = int(bw * width)
                b_h = int(bh * height)
                
                # Top left of the box in the crop
                bx1 = (bcx - b_w//2) - x1
                by1 = (bcy - b_h//2) - y1
                bx2 = (bcx + b_w//2) - x1
                by2 = (bcy + b_h//2) - y1
                
                if 0 <= bx1 <= crop_size and 0 <= by1 <= crop_size:
                    cv2.rectangle(crop_vis, (int(bx1), int(by1)), (int(bx2), int(by2)), (0, 255, 0), 1)
                    
            axes[i].imshow(crop_vis)
            axes[i].set_title(f"Scene: {os.path.basename(txt_path)}")
            axes[i].axis('off')
            
    plt.tight_layout()
    out_path = "/Users/devopsdreamer/.gemini/antigravity/brain/f82eb8e5-4ff2-4905-818e-2a4a966a3104/phase_i1_overlays.png"
    plt.savefig(out_path)
    print(f"Visual overlays saved to {out_path}")

if __name__ == "__main__":
    generate_overlays()
