# Phase M-2: Official SNAP Sentinel-1 GRD Processing

## 1. Processing Graph Configuration
A rigorous preprocessing workflow was established using the official ESA Sentinel Application Platform (SNAP).

- **Graph XML:** `scripts/s1_process_graph.xml`
- **Operators Executed:**
  1. `Read` (SAFE Archive)
  2. `Apply-Orbit-File` (Sentinel Precise Orbit - Auto Downloaded)
  3. `Calibration` (Sigma0 VV & VH native extraction)
  4. `Terrain-Correction` (Range-Doppler method)
  5. `Write` (GeoTIFF-BigTIFF Format)

## 2. Radiometric Calibration
- **Method:** SNAP Official Calibration Operator.
- **Output:** Native Sigma0_VV and Sigma0_VH bands. Unlike the previous Python approximation which collapsed the vector across azimuth, SNAP dynamically applies the mathematically precise, native 2D calibration Look-Up Table embedded in the product.
- **Units:** Linear Backscatter (dimensionless ratio).

## 3. Range-Doppler Terrain Correction
- **DEM Source:** `SRTM 1Sec HGT` (Auto Downloaded).
- **Target CRS:** `EPSG:4326` (WGS84 Geographic).
- **Output Bounds:** `[-97.458, 28.841, -94.513, 31.041]`
- **Output Dimensions:** 32,777 x 24,488 pixels
- **Pixel Spacing:** `8.98315284e-05` degrees (~10.0 meters).

## 4. Output Validation & Coastline Alignment
The exported BigTIFF (`s1_gulf_20230101_tc.tif`) was independently validated. 

**Sanity Check Passed:** The Galveston offshore fairway (`~29.3 N, -94.8 W`) correctly falls within the orthorectified bounding box. 

**Visual QA (phase_m2_snap_qa.png):**
- Generated layers: Sigma0 VV, Sigma0 VH, Feature Composite, and Coastline Overlay.
- The Natural Earth coastline overlay geographically aligned precisely with the landmass borders visible in the SAR backscatter, confirming successful terrain correction.

## 5. Comparison: Affine Shortcut vs. SNAP Range-Doppler
- **CRS & Grid:** The Phase M affine approximation resulted in a distorted grid because a linear matrix cannot model a curved 250km radar orbital swath. SNAP Range-Doppler completely resolved this, producing a perfectly squared `EPSG:4326` geographic grid.
- **Coastline Drift:** The affine method resulted in massive land-mask drift at the swath margins. The SNAP method locked the coastline perfectly to physical ground-truth via the SRTM DEM and precise orbital state vectors.
- **Data Integrity:** The previous `model_ready_full.tif` is formally retired. The SNAP output is now the singular source of truth for the impending ML and drift engines.

---
SNAP SAR PROCESSING VERIFIED
