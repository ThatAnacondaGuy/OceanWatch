# Phase M: Real Sentinel-1 SAR Preprocessing

## 1. Product Inspection
- **Source:** `S1A_IW_GRDH_1SDV_20230101T122318_20230101T122348_046590_05955B_4039.SAFE`
- **Native Dimensions:** 25183 x 19949 pixels
- **GCPs:** 231 tie-points extracted directly from the product metadata.
- **CRS:** EPSG:4326

## 2. Radiometric Calibration
- **Method:** `sigma0 = DN^2 / sigmaNought^2` (Linear backscatter), converted to Decibels (`10 * log10(sigma0)`).
- **Data Source:** Actual product metadata from `calibration-s1a-iw-grd-vv-*.xml` and `vh` equivalent. The `sigmaNought` calibration vector was parsed, averaged across azimuth time, and interpolated across the range dimension.
- **Statistics (VV dB):** Min = -34.05, Max = 10.00, Mean = -11.75

## 3. Georeferencing & Land Mask
- **Terrain-Correction Status:** Full Range-Doppler Terrain Correction is UNAVAILABLE (Requires ESA SNAP engine / external high-res DEM).
- **Georeferencing Method:** Linear Affine Transform approximation via least-squares fit of the 231 native product GCPs (`rasterio.transform.from_gcps`). 
- **Limitation Documented:** A linear affine approximation over a 250km SAR swath introduces significant geometric distortion, particularly near the edges, because it cannot model orbital curvature or incidence-angle projection variations. As a result, the land mask alignment exhibits shifting. **This output is NOT operationally georeferenced for strict targeting.**
- **Land Mask:** `Natural Earth 10m` vector data rasterized against the affine grid. On the scaled pipeline verification grid, this yielded 4,802,535 land pixels and 218,357 offshore pixels.

## 4. Visual QA
Seven diagnostic images were generated and saved to the QA artifacts (`phase_m_qa_full.png`):
1. Raw VV (DN)
2. Calibrated Sigma0 VV (dB)
3. Calibrated Sigma0 VH (dB)
4. Feature Composite (RGB)
5. Affine Land Mask
6. Georeferenced Footprint (Offshore Boolean)
7. Offshore Only (VV dB)

## 5. Model Input Preparation
- **Input Channels:** 2 (Ch1: VV dB, Ch2: VH dB).
- **Spatial Dimensions:** Downsampled (Factor 10) to 2518 x 1994 for baseline pipeline validation and memory safety.
- **Normalization:** Values transformed to dB space; no arbitrary bounds applied beyond physical constraints.
- **Nodata Treatment:** Land pixels explicitly replaced with `-999.0` float values.
- **Format:** 32-bit Float GeoTIFF (`qa_output/model_ready_full.tif`).
- **ML Status:** HALTED. No inference has been executed on this array.

---

PREPROCESSING VERIFIED
