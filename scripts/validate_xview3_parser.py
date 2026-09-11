import os
import sys

sys.path.append(os.getcwd())
from ml.datasets.xview3 import XView3DatasetParser

def main():
    print("--- PHASE G: REAL XVIEW3 DATASET AUDIT ---")
    tiff_path = "data/raw/xview3/scene_1.tif"
    csv_path = "data/raw/xview3/labels.csv"
    
    if not os.path.exists(tiff_path) or not os.path.exists(csv_path):
        print(f"[BLOCKED] Real xView3 files missing.")
        return
        
    print("1. Validating Dataset Schema...")
    parser = XView3DatasetParser(tiff_path, csv_path)
    is_valid, msg = parser.validate_schema()
    print(f"   Schema valid: {is_valid} ({msg})")
    
    if is_valid:
        print("2. Testing YOLO format projection...")
        try:
            out_path, count = parser.convert_to_yolo_format("data/raw/xview3/yolo_out")
            print(f"   Successfully parsed {count} real vessel detections.")
            
            with open(out_path, 'r') as f:
                output = f.read().strip()
                print(f"   Sample output:\n   {output}")
        except Exception as e:
            print(f"   [ERROR] Projection failed: {e}")
            
    print("--- XVIEW3 AUDIT COMPLETE ---")

if __name__ == "__main__":
    main()
