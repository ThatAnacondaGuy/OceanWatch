# Phase D: Technical Correction Report

A technical correction pass was executed over the Phase D Ship Detection logic to eliminate arbitrary hardcoding, improve physical parameter determinism, and formally distinguish genuine implementations from synthetic fixtures.

## 1. Corrections Implemented

### xView3 YOLO Label Conversion
- **Status:** **REAL IMPLEMENTATION**
- Removed the hardcoded 20x20 pixel bounding box logic. The `ml/datasets/xview3.py` parser now computes physical vessel pixel dimensions dynamically by reading `vessel_length_m` from the real metadata schema and translating it via the GeoTIFF's spatial affine transform (calculating approximate meters-per-pixel natively whether the CRS is Geographic or Projected). Bounding box dimensions are physically accurate and strictly normalized to `[0.0, 1.0]`.

### CFAR Documentation Update
- **Status:** **REAL IMPLEMENTATION**
- Updated docstrings in `cfar.py` to correctly describe the mathematical logic. It is explicitly documented as a computationally fast 2D CA-CFAR *approximation* mapping uniform-filter sliding averages (full-window minus guard-window) over rectangular grids, rather than exact Euclidean annuli.

### Deterministic SAR Crop Normalization
- **Status:** **REAL IMPLEMENTATION**
- Replaced the arbitrary `crop / max(crop)` localized scaling in `ship_detection.py` with a fixed deterministic physical mapping (`normalize_sar_crop`). It maps a standardized radar amplitude/dB range (e.g., `-30.0` to `0.0`) linearly to `[0, 255]`. 
- Multi-channel support handles Dual-Pol (VV, VH) natively by assigning VV to Red, VH to Green, and a (VV+VH) combination to Blue, ensuring Ultralytics YOLOv8 receives correctly scaled 3-channel pseudo-RGB tensors without destroying relative polarization intensities.

## 2. Validation and Tests

### Parsing and Coordinates
- **Status:** **SYNTHETIC TEST ONLY**
- A new test suite was written covering the coordinate projection, normalization clipping `[0,1]`, and dynamic `vessel_length_m` translation. Evaluated strictly on synthetic schema-valid test fixtures.

### Crop Normalization Test
- **Status:** **SYNTHETIC TEST ONLY**
- Validated that a `-15 dB` flat tensor accurately scales to `127` in an 8-bit space, and that dual-channel tensors split natively into the required RGB pseudo-color components.

### Final xView3 Parser Target
- **Status:** **WAITING FOR REAL xView3 DATA**
- While the software pipelines are validated via schema fixtures, genuine xView3 compatibility and final end-to-end model training remain strictly suspended pending the user's manual supply of the real DIU-downloaded dataset.
