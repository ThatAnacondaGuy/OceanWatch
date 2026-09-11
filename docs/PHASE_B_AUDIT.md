# Phase B Technical Audit

This document provides a strict technical audit of all Phase B (Data Ingestion & Preprocessing) components prior to Phase C. Each component is explicitly classified to differentiate between real algorithms, synthetic data, and pass-through placeholders.

## 1. Zenodo Dataset Acquisition
- **Classification:** SYNTHETIC TEST IMPLEMENTATION
- **Implementation File:** `scripts/dataset_manager.py` (via `create_synthetic_zenodo()`)
- **Test File:** None explicitly, verified visually via log output.
- **Real External Data Used:** No.
- **Synthetic Implementation:** Yes. Generates 256x256 random noise matrices with geometric OpenCV ellipses.
- **Limitations:** Completely synthetic. The dataset is not the actual Krestenitis Zenodo dataset and contains no real oil slick features.
- **Evidence of Execution:** Console log `"-> Created 5 Zenodo-like chips"` during `dataset_manager.py` run.

## 2. xView3 Dataset Acquisition
- **Classification:** SYNTHETIC TEST IMPLEMENTATION
- **Implementation File:** `scripts/dataset_manager.py` (via `create_synthetic_xview3()`)
- **Test File:** None explicitly, verified visually via log output.
- **Real External Data Used:** No.
- **Synthetic Implementation:** Yes. Generates a 1024x1024 GeoTIFF with random Gaussian noise and one bright pixel cluster.
- **Limitations:** Does not reflect real SAR ship signatures, sea clutter, or actual xView3 distributions.
- **Evidence of Execution:** Console log `"-> Created xView3 synthetic GeoTIFF and labels"`.

## 3. MarineCadastre AIS Acquisition
- **Classification:** SYNTHETIC TEST IMPLEMENTATION
- **Implementation File:** `scripts/dataset_manager.py` (via `create_synthetic_ais()`)
- **Test File:** None explicitly, parsed successfully by `seed_demo_data.py`.
- **Real External Data Used:** No.
- **Synthetic Implementation:** Yes. Generates a 10-row CSV mimicking the MarineCadastre column format for a single vessel.
- **Limitations:** Lacks real regional vessel density, gaps, or noise.
- **Evidence of Execution:** Extracted and parsed successfully by PostgreSQL seeder.

## 4. ERA5 Acquisition
- **Classification:** SYNTHETIC TEST IMPLEMENTATION
- **Implementation File:** `scripts/dataset_manager.py` (via `create_synthetic_forcing()`)
- **Test File:** None explicitly.
- **Real External Data Used:** No.
- **Synthetic Implementation:** Yes. Writes a NetCDF file with a uniform -3.5 m/s u/v vector field.
- **Limitations:** Completely static and uniform, does not use CDS API.
- **Evidence of Execution:** Log `"-> Created synthetic NetCDF caches"`.

## 5. CMEMS Acquisition
- **Classification:** SYNTHETIC TEST IMPLEMENTATION
- **Implementation File:** `scripts/dataset_manager.py` (via `create_synthetic_forcing()`)
- **Test File:** None explicitly.
- **Real External Data Used:** No.
- **Synthetic Implementation:** Yes. Writes a NetCDF file with a uniform 0.5 m/s eastward current.
- **Limitations:** Static, uniform, does not use Copernicus Marine credentials.
- **Evidence of Execution:** Log `"-> Created synthetic NetCDF caches"`.

## 6. Dataset Provenance/Manifest
- **Classification:** SYNTHETIC TEST IMPLEMENTATION
- **Implementation File:** `scripts/update_manifest.py`
- **Test File:** None.
- **Real External Data Used:** No.
- **Synthetic Implementation:** Yes. Hardcoded JSON payload injected into `data/manifests/datasets.json`.
- **Limitations:** Does not dynamically calculate checksums of actual downloaded files.
- **Evidence of Execution:** `datasets.json` exists with hardcoded `synthetic_smoke_test_subset` status.

## 7. Demo Data Seeding
- **Classification:** REAL IMPLEMENTATION
- **Implementation File:** `scripts/seed_demo_data.py`
- **Test File:** Run inherently during execution.
- **Real External Data Used:** No (ingests synthetic data).
- **Synthetic Implementation:** The script logic is real; the data it ingests is synthetic.
- **Limitations:** Currently deletes all existing demo data before seeding. Relies on hardcoded bounding box logic instead of full dynamic parsing for footprints.
- **Evidence of Execution:** Script exited 0 with log `"Database seeding completed."` Database tables successfully populated.

## 8. SAR Radiometric Calibration
- **Classification:** SYNTHETIC TEST IMPLEMENTATION
- **Implementation File:** `backend/app/worker/stages/preprocessing.py` (via `radiometric_calibration()`)
- **Test File:** `tests/unit/test_preprocessing.py`
- **Real External Data Used:** No.
- **Synthetic Implementation:** Yes. Merely applies `np.clip` array clipping instead of applying Sentinel-1 calibration LUT vectors.
- **Limitations:** Does not convert digital numbers (DN) to accurate Sigma Naught ($\sigma_0$) backscatter values.
- **Evidence of Execution:** Test passed, function executes during pipeline.

## 9. Thermal Noise Removal
- **Classification:** REAL IMPLEMENTATION (Basic)
- **Implementation File:** `backend/app/worker/stages/preprocessing.py` (via `thermal_noise_removal()`)
- **Test File:** `tests/unit/test_preprocessing.py`
- **Real External Data Used:** No.
- **Synthetic Implementation:** No (the function implements a real, albeit naive, threshold).
- **Limitations:** Uses a flat threshold rather than utilizing the Sentinel-1 thermal noise polynomial vectors over the swath.
- **Evidence of Execution:** Test passed.

## 10. Terrain Correction
- **Classification:** PASS-THROUGH/PLACEHOLDER
- **Implementation File:** `backend/app/worker/stages/preprocessing.py` (via `terrain_correction()`)
- **Test File:** `tests/unit/test_preprocessing.py`
- **Real External Data Used:** No.
- **Synthetic Implementation:** N/A (Does nothing).
- **Limitations:** Function explicitly returns the input array `return img` unmodified. Does not use a Digital Elevation Model (DEM) or perform orthorectification.
- **Evidence of Execution:** Test passed because the function is a pass-through.

## 11. Natural Earth Land Masking
- **Classification:** PASS-THROUGH/PLACEHOLDER
- **Implementation File:** `backend/app/worker/stages/preprocessing.py` (via `land_masking()`)
- **Test File:** `tests/unit/test_preprocessing.py`
- **Real External Data Used:** No (Natural Earth shapefiles not downloaded).
- **Synthetic Implementation:** N/A (Does nothing).
- **Limitations:** Function explicitly returns the input array `return img` unmodified. No geospatial intersection is performed to mask land pixels to NaN/zero.
- **Evidence of Execution:** Test passed because the function is a pass-through.

## 12. Refined Lee Speckle Filtering
- **Classification:** REAL IMPLEMENTATION
- **Implementation File:** `backend/app/worker/stages/preprocessing.py` (via `lee_filter()`)
- **Test File:** `tests/unit/test_preprocessing.py`
- **Real External Data Used:** No (applied to synthetic noise).
- **Synthetic Implementation:** No (algorithm logic is real).
- **Limitations:** None natively; uses standard local variance weighting via `scipy.ndimage`.
- **Evidence of Execution:** Test asserts `not np.array_equal(in_vv, out_vv)`, confirming the filter altered the pixel values by smoothing variance.

## 13. CRS/Georeferencing Preservation
- **Classification:** REAL IMPLEMENTATION
- **Implementation File:** `backend/app/worker/stages/preprocessing.py`
- **Test File:** `tests/unit/test_preprocessing.py`
- **Real External Data Used:** No.
- **Synthetic Implementation:** No (the logic is real).
- **Limitations:** Assumes input rasterio metadata is perfectly compliant.
- **Evidence of Execution:** Test asserts `src_in.crs == src_out.crs` and `src_in.transform == src_out.transform`.

## 14. Unit Tests
- **Classification:** REAL IMPLEMENTATION
- **Implementation File:** `tests/unit/test_preprocessing.py`
- **Test File:** Self
- **Real External Data Used:** No.
- **Synthetic Implementation:** No.
- **Limitations:** Relies entirely on synthetic TIFF fixture; doesn't test boundary conditions like extreme edge noise or NaN presence.
- **Evidence of Execution:** `pytest tests/unit/test_preprocessing.py -v` exited with `1 passed in 2.80s`.

## 15. Inspectable Preprocessing Artifact
- **Classification:** REAL IMPLEMENTATION
- **Implementation File:** `backend/app/worker/stages/preprocessing.py`
- **Test File:** `tests/unit/test_preprocessing.py`
- **Real External Data Used:** No.
- **Synthetic Implementation:** No (output file is genuinely written).
- **Limitations:** Artifact contains synthetic data.
- **Evidence of Execution:** Test asserts `os.path.exists(res)` explicitly checking for `data/processed/scene_1_preprocessed.tif`.
