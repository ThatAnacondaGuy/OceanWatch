import os
import glob
import cv2
import numpy as np

img_dir = "data/raw/zenodo/images"
mask_dir = "data/raw/zenodo/masks"

# Note: Zenodo images might be in subfolders or directly there.
imgs = sorted(glob.glob(os.path.join(img_dir, "**/*.*"), recursive=True))
masks = sorted(glob.glob(os.path.join(mask_dir, "**/*.*"), recursive=True))

imgs = [f for f in imgs if f.lower().endswith(('.jpg', '.png', '.tif'))]
masks = [f for f in masks if f.lower().endswith(('.png', '.tif', '.jpg'))]

img_names = {os.path.splitext(os.path.basename(f))[0] for f in imgs}
mask_names = {os.path.splitext(os.path.basename(f))[0] for f in masks}

# Handle name mismatch if masks have _mask or similar
# Standardize names if necessary
common_names = img_names.intersection(mask_names)
missing_masks = img_names - mask_names
missing_imgs = mask_names - img_names

print(f"Total Images: {len(imgs)}")
print(f"Total Masks: {len(masks)}")
print(f"Valid Pairs (Exact Name Match): {len(common_names)}")
if missing_masks: print(f"Sample Missing Masks: {list(missing_masks)[:5]}")

if not common_names:
    print("WARNING: No exact name matches. Analyzing prefix matches...")
    # Attempt to find prefix matching
    for i in range(min(5, len(imgs))):
        print("Img:", os.path.basename(imgs[i]))
        print("Mask:", os.path.basename(masks[i]))

# If pairs found, analyze dimensions and balance
fg_pixels = 0
bg_pixels = 0
dims = set()
dtypes = set()
channels = set()

# Analyze a sample of up to 200 images for speed
sample_names = list(common_names)[:200]
for name in sample_names:
    img_path = [f for f in imgs if name in os.path.basename(f)][0]
    mask_path = [f for f in masks if name in os.path.basename(f)][0]
    
    img = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)
    mask = cv2.imread(mask_path, cv2.IMREAD_UNCHANGED)
    
    dims.add((img.shape[0], img.shape[1]))
    dtypes.add((img.dtype, mask.dtype))
    ch = 1 if len(img.shape) == 2 else img.shape[2]
    channels.add(ch)
    
    # Class balance (mask)
    if mask is not None:
        mask_bool = (mask > 0)
        fg_pixels += np.sum(mask_bool)
        bg_pixels += np.sum(~mask_bool)

print(f"Sampled {len(sample_names)} pairs.")
print(f"Dimensions found: {dims}")
print(f"Channels found: {channels}")
print(f"Data types (img, mask): {dtypes}")
if (fg_pixels + bg_pixels) > 0:
    print(f"Foreground (Oil): {fg_pixels / (fg_pixels + bg_pixels):.2%}")
    print(f"Background (Water/Land): {bg_pixels / (fg_pixels + bg_pixels):.2%}")
else:
    print("No pixels analyzed.")
