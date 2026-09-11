import os
import subprocess
import glob
import pandas as pd

def get_archive_contents(archive_path):
    print("Scanning archive contents...")
    result = subprocess.run(['7z', 'l', archive_path], capture_output=True, text=True)
    lines = result.stdout.split('\n')
    
    archive_files = []
    # parse 7z output
    for line in lines:
        if 'Oil/' in line and line.strip().endswith('.tif'):
            parts = line.split()
            filename = parts[-1]
            size = parts[-3] if len(parts) >= 3 else 0
            archive_files.append(os.path.basename(filename))
            
    return archive_files

def main():
    print("--- PHASE H-1.5: DATA CORRESPONDENCE REPORT ---")
    
    archive_path = "data/raw/zenodo/01_Train_Val_Oil_Spill_images.7z"
    mask_dir = "data/raw/zenodo/masks_real/Mask_oil"
    
    archive_images = get_archive_contents(archive_path)
    existing_masks = [os.path.basename(p) for p in glob.glob(os.path.join(mask_dir, "*.tif"))]
    
    archive_images_set = set(archive_images)
    existing_masks_set = set(existing_masks)
    
    matched = archive_images_set.intersection(existing_masks_set)
    unmatched_images = archive_images_set - existing_masks_set
    unmatched_masks = existing_masks_set - archive_images_set
    
    print(f"Total Images in Archive: {len(archive_images)}")
    print(f"Total Masks Extracted: {len(existing_masks)}")
    print(f"Exact Matched Pairs: {len(matched)}")
    print(f"Unmatched Images: {len(unmatched_images)}")
    print(f"Unmatched Masks: {len(unmatched_masks)}")
    
    # Save the index
    records = []
    for m in sorted(list(matched)):
        records.append({
            "image_path": f"data/raw/zenodo/images_real/{m}",
            "mask_path": f"data/raw/zenodo/masks_real/Mask_oil/{m}",
            "scene_identifier": m.replace('.tif', '')
        })
        
    df = pd.DataFrame(records)
    df.to_csv("data/raw/zenodo/dataset_index.csv", index=False)
    print("Saved deterministic dataset index to data/raw/zenodo/dataset_index.csv")

if __name__ == "__main__":
    main()
