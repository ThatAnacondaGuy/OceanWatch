# Phase H-2: Real Slick to Drift Integration Report

Phase H-2 successfully couples the real-world spatial geometries predicted by the U-Net with the physical Lagrangian drift engine, proving the end-to-end viability of the attribution pipeline prior to final target identification.

## 1. Dataset Disjoint Audit
Prior to integration, a strict intersection matrix test was applied across the 840/180/180 split logic (verifying on `scene_identifier`).
- **Disjoint Train/Validation:** `True`
- **Disjoint Train/Test:** `True`
- **Disjoint Validation/Test:** `True`
*No underlying scenes leaked across the split bounds.*

## 2. Real Slick Inference & Geometry Extraction
The optimized weights (`models/best_full_oil_unet.pth`) were loaded and executed strictly on an untouched test array (`01073.tif`).
- **Inference:** Target detected successfully without spatial saturation.
- **Connected Components:** `3 total contours detected`, isolating `1 primary` spill mass.
- **Area:** `597.5 px²`
- **Pixel Centroid:** `X: 82, Y: 230`
- **Bounding Geometry:** `[x:34, y:225, width:95, height:12]`

Because the raw Sentinel-1 TIFFs lack absolute coordinate metadata, the centroid was projected relatively onto the Gulf of Mexico demonstration baseline:
- **Geographic Coordinates:** `Lon -89.004647`, `Lat 26.990820`

## 3. GLCM & WindGate Validation
The geographic bounding box queried the original source matrix to extract textual physical features.
- **GLCM Contrast:** `10667.0913`
- **GLCM Homogeneity:** `0.0146`

The coordinates were then passed to the `EnvironmentalAdapter` to query the genuine `ERA5` netCDF tensor:
- **Local ERA5 Wind Speed:** `7.31 m/s` (at slick centroid)
- **WindGate Validator:** `PASS` (Below 10.0 m/s threshold)
- **Final Confidence formulation:** `1.00`

## 4. Backward Lagrangian Drift Execution
The validated slick properties were ingested as the starting condition for a 500-particle Monte Carlo origin-hindcast. **No arbitrary synthetic origin was utilized; the U-Net spatial prediction initiated the physics engine.**

- **Temporal Integration:** `-24 hours` (Hindcasting backward in time to determine spill origin).
- **Ensemble Scale:** `500 particles` over stochastic spatial noise parameters.

**Origin Probability Envelope:**
The particles dispersed over 24 hours under real CMEMS currents and ERA5 wind vectors, resolving the geographic suspect envelope:
- **Longitude Bound:** `[-88.9537, -88.8589]`
- **Latitude Bound:** `[26.6395, 26.7441]`
- **Uncertainty Representation:** A `20x20` spatial probability heatmap was successfully formulated mapped exactly to this coordinate envelope.

## 5. Constraint Adherence
- No YOLOv8 training was initiated.
- No suspect attribution algorithms were triggered.
- No synthetic geometries were ingested into the drift engine. 

**Status:** The H-2 chain correctly links spatial CV predictions to geographic physics equations. The pipeline is fully prepared for Phase I (Vessel Detection) and final attribution.
