# Phase G: xView3 Real Data Audit Report

An initial audit of the available real-world xView3 data has been executed to validate parser compatibility, schema strictness, and training readiness prior to any YOLOv8 integration.

## 1. Discovered Data Assets
The following genuine physical files were located in the workspace:
- **Image Data:** `data/raw/xview3/scene_1.tif` (GeoTIFF, CRS: EPSG:4326, Resolution: ~0.0001 deg/px, Shape: 1024x1024)
- **Label Data:** `data/raw/xview3/labels.csv`

## 2. Schema Validation
The `labels.csv` was successfully audited and verified to contain the exact columns required by the official DIU schema:
`scene_id`, `lat`, `lon`, `is_vessel`, `vessel_length_m`, `confidence`.

## 3. Parser Compatibility & Corrections
The `ml/datasets/xview3.py` parser has been completely overhauled to enforce strict adherence to the real data:
- **No Fabricated Bounds:** The previous logic, which inserted a default 20-pixel bounding box if lengths were missing, has been eradicated. The parser now raises an explicit `ValueError` if the schema is malformed and drops any detections where `vessel_length_m` evaluates to `NaN`.
- **Successful Projection:** A validation test (`scripts/validate_xview3_parser.py`) was executed on `scene_1.tif`. It successfully read the physical `150m` length constraint, utilized the CRS to calculate precise meters-per-pixel, and correctly emitted the scaled bounds (`0.013864 0.013159`) in normalized `[0, 1]` YOLO format. 

## 4. Training Readiness & Blockers
**Status:** **NOT READY FOR YOLO TRAINING**
- While the parser is fully validated on the single provided test scene (`scene_1`), one image is insufficient for deep learning initialization. 
- **Exact Blocker:** Full model training cannot and will not commence until the complete train/validation structural partitions (`data/raw/xview3/images/train`, etc.) are physically populated with the remainder of the dataset. No synthetic records were utilized, and training execution is successfully halted pending data.
