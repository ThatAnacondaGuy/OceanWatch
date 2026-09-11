# Real Data Acquisition Guide
*For Phase C Training and Inference pipelines.*

This document details the exact specifications, URLs, formats, and procedures to acquire the real, non-synthetic datasets required for OceanWatch AI. 

---

## 1. Zenodo Sentinel-1 Oil Spill Dataset
*Used for training the Attention U-Net oil spill segmentation model.*

- **Exact Dataset URL:** https://zenodo.org/record/4322585
- **Available Splits:**
  - `Images.zip` (~400 MB) - 8-bit JPEG/PNG SAR chips.
  - `Labels.zip` (~5 MB) - 1D arrays of classifications.
  - `Labels_2D.zip` / `Masks.zip` (~5 MB) - 2D binary segmentation masks.
- **Files Required for Attention U-Net:** `Images.zip` (inputs) and `Labels_2D.zip` (ground truth masks).
- **Recommended Minimum Subset:** 100 images and their corresponding 100 masks for the initial epoch validation.
- **Expected Folder Structure:**
  ```text
  data/raw/zenodo/
  ├── images/
  │   ├── img_0001.jpg
  │   └── ...
  └── masks/
      ├── mask_0001.png
      └── ...
  ```
- **Format:** 8-bit RGB/Grayscale images (0-255). 
- **Download Script/Command (Automated):**
  ```bash
  mkdir -p data/raw/zenodo
  wget https://zenodo.org/record/4322585/files/Images.zip -O data/raw/zenodo/Images.zip
  wget https://zenodo.org/record/4322585/files/Labels_2D.zip -O data/raw/zenodo/Labels_2D.zip
  unzip data/raw/zenodo/Images.zip -d data/raw/zenodo/images/
  unzip data/raw/zenodo/Labels_2D.zip -d data/raw/zenodo/masks/
  ```
- **Validation Method:** Ensure the count of images exactly matches the count of masks. Ensure image dimensions match mask dimensions exactly (typically 256x256 or 512x512).

---

## 2. xView3 SAR Ship Detection
*Used for training the YOLOv8 vessel detection model.*

- **Exact Access Page:** https://iuu.xview.us/ (Defense Innovation Unit)
- **User Action Required:** **Manual Registration.** You must create an account, accept the challenge terms of use, and log in to view the dataset download links (often hosted on AWS S3 with signed URLs).
- **Required Components:** 
  - GeoTIFF files (VV and VH polarizations).
  - Validation/Train CSV label files containing bounding boxes or center points + vessel lengths.
- **Recommended Minimum Subset:** 1 full scene (GeoTIFF) from the `validation` split and the corresponding rows from the label CSV. (~1-2 GB).
- **Expected Format:** `.tif` (float32 or uint16 arrays) and `.csv`.
- **Import Procedure:** 
  - Download manually from the portal.
  - Place the `.tif` in `data/raw/xview3/scene_id.tif`.
  - Place the labels in `data/raw/xview3/labels.csv`.
- **Validation:** Run `gdalinfo` on the TIFF to ensure VV/VH bands exist. Parse the CSV to ensure `scene_id`, `lat`, `lon`, and `is_vessel` columns match the downloaded TIFF name.

---

## 3. ERA5 Wind Forcing
*Used for generating physical drift modeling and environment context.*

- **Copernicus CDS Registration:** Register at https://cds.climate.copernicus.eu/. Retrieve your UID and API Key and place them in `~/.cdsapirc`:
  ```text
  url: https://cds.climate.copernicus.eu/api/v2
  key: {uid}:{api-key}
  ```
- **Exact Variables Needed:** `10m_u_component_of_wind` (u10), `10m_v_component_of_wind` (v10).
- **Spatial/Temporal for Demo:** 
  - Extent: Gulf of Mexico [30°N, -98°W, 24°N, -80°W].
  - Temporal: January 1, 2023 (Matching the AIS demo data).
- **Minimal Download Size:** ~5 MB (single day, regional bounding box).
- **Local Directory Structure:** `data/cached/era5/era5_wind_20230101.nc`
- **Verification:** Run `ncdump -h data/cached/era5/era5_wind_20230101.nc` to verify `u10`, `v10`, `latitude`, `longitude`, and `time` dimensions.

---

## 4. CMEMS Ocean Currents (HYCOM/NEMO)
*Used for oil slick drift forecasting.*

- **Account Requirements:** Register at https://data.marine.copernicus.eu/.
- **Exact Product/Variables:** Global Ocean Physics Analysis and Forecast (`GLOBAL_ANALYSISFORECAST_PHY_001_024`). Variables: `uo` (Eastward velocity), `vo` (Northward velocity).
- **Minimal Subset:** Same as ERA5. Gulf of Mexico [30°N, -98°W, 24°N, -80°W] on January 1, 2023. Surface depth (0m).
- **Download Procedure:** Use the Copernicus Marine Toolbox (`pip install copernicusmarine`) or the web GUI to subset and download the NetCDF.
- **Verification:** Check valid values (not just NaNs). `python3 -c "import xarray as xr; print(xr.open_dataset('data/cached/cmems_20230101.nc').uo.max())"`

---

## 5. Sentinel-1 SAFE Product
*Used for full physical radiometric calibration and pipeline validation.*

- **Official Source:** Copernicus Data Space Ecosystem (https://dataspace.copernicus.eu/) or ASF DAAC (https://search.asf.alaska.edu/).
- **Recommended Scene for Demo:** A scene over the Gulf of Mexico on January 1, 2023 (to align with the AIS data).
- **Characteristics:** Sentinel-1A or Sentinel-1B, Ground Range Detected (GRD), Interferometric Wide (IW), Dual Polarization (VV+VH).
- **Expected Structure:** 
  ```text
  data/demo/scenes/S1A_IW_GRDH_1SDV_20230101T...SAFE/
  ├── manifest.safe
  ├── measurement/
  │   ├── s1a-iw-grd-vv-...tiff
  │   └── s1a-iw-grd-vh-...tiff
  └── annotation/
      └── calibration/
          ├── calibration-s1a-iw-grd-vv-...xml
          └── calibration-s1a-iw-grd-vh-...xml
  ```
- **Required Calibration XMLs:** Both VV and VH calibration XMLs must exist to apply the true Sigma0 transform.
- **Validation Command:** Once placed, update the paths in `tests/unit/test_preprocessing_real.py` to point to the `.SAFE` directory and run:
  `python3 tests/unit/test_preprocessing_real.py` to execute the true LUT interpolation.
