# OceanWatch AI — Indian Dataset Validation Audit Report

**Audit Date:** 2026-09-14  
**Audit Scope:** Verification and structural audit of newly acquired sovereign Indian datasets in `data/raw/`.  
**Execution Mode:** Read-only inspection via GDAL, Rasterio, H5Py, and NetCDF4. No files modified.

---

## 1. Executive Summary & Dataset Overview

Three sovereign Indian remote sensing and oceanographic datasets were ingested into `data/raw/` for the Ennore / Chennai maritime region:
1. **EOS-04 (RISAT-1B)** C-band SAR geocoded Level-2B CEOS Analysis Ready Data (ARD) from NRSC / Bhoonidhi.
2. **NISAR (NASA-ISRO SAR)** S-band (S-SAR) Geocoded Covariance Matrix (GCOV) Level-2 product from ISRO.
3. **INCOIS RSMC HYCOM** Operational Indian Ocean hydrodynamic surface current forecast model from INCOIS.
4. **OOSA Mass Budget**: Reference mass-balance assessment from the INCOIS Online Oil Spill Advisory platform.

All three scientific datasets (**EOS-04**, **NISAR**, **INCOIS**) successfully cover the common verification coordinates (**Latitude: 13.23° N, Longitude: 80.36° E**, Kamarajar Port / Ennore).

| Dataset | Primary File | Spatial Coverage | Spatial Resolution | Polarization / Variables | Native CRS | Validation Status |
|---|---|---|---|---|---|---|
| **EOS-04** | `data/raw/satellite/eos04/E04_SAR_MRS_07SEP2026_250002927260_25187_STUC00ZTD_1748_19_DH_D_R_N13608_E080342.zip` | Lat: 12.63°N to 14.33°N<br>Lon: 79.38°E to 81.14°E | 18.0 m × 18.0 m | Dual Pol: **HH**, **HV**<br>(+ LIA, Area, Mask) | EPSG:32644<br>(WGS 84 / UTM 44N) | **VERIFIED**<br>(Full Ennore coverage) |
| **NISAR S-SAR** | `data/raw/satellite/nisar/NISAR_S2_PR_GCOV_029_156_A_008_3700_DHNA_A_20260905T000822_20260905T000843_P00500_M_P_I_001.h5` | Lat: 11.37°N to 14.31°N<br>Lon: 79.53°E to 82.64°E | 10.0 m × 10.0 m | Dual Pol GCOV:<br>**HHHH**, **HVHV**, **HHHV** | EPSG:32644<br>(WGS 84 / UTM 44N) | **VERIFIED**<br>(Full Ennore coverage) |
| **INCOIS RSMC** | `data/raw/ocean/incois/RSMC_hycom_20260914.nc` | Lat: -44.93°S to +30.95°N<br>Lon: 20.00°E to 119.84°E | ~0.055° lat × 0.06° lon<br>(~6 km × ~6 km) | Surface currents:<br>**UVEL** (eastward), **VVEL** (northward), **SSH**, **TEMP**, **SALN** | EPSG:4326<br>(Geographic WGS 84) | **VERIFIED**<br>(Full Indian Ocean) |
| **INCOIS OOSA** | `data/raw/oosa/mass-budget-tons.pdf` | Ennore coastal cell | Point / Time Series | Evaporated, Dispersed, Floating, Beached mass budget | N/A | **VERIFIED**<br>(Advisory Reference) |

---

## 2. EOS-04 Detailed Technical Profile

### File & Path Information
- **Archive Path:** `data/raw/satellite/eos04/E04_SAR_MRS_07SEP2026_250002927260_25187_STUC00ZTD_1748_19_DH_D_R_N13608_E080342.zip`
- **File Size:** 1,117,756,114 bytes (~1.12 GB)
- **Internal Directory Prefix:** `E04_SAR_MRS_07SEP2026_250002927260_25187_STUC00ZTD_1748_19_DH_D_R_N13608_E080342`

### Mission & Acquisition Metadata
- **Satellite:** EOS-04 (Earth Observation Satellite 04 / RISAT-1B)
- **Sensor:** Synthetic Aperture Radar (SAR), C-band (5.35 GHz center frequency)
- **Generating Agency:** National Remote Sensing Centre (NRSC), ISRO / Bhoonidhi
- **Beam Mode:** Medium Resolution ScanSAR (MRS)
- **Product Type:** `L2B-ARD-PRODUCT` (CEOS Analysis Ready Data)
- **Acquisition Timestamp:** 07-SEP-2026 00:29:27 to 00:29:49 UTC (Orbit: 25187)
- **Processing Facility:** NRSC Data Processing Facility, generated 10-SEP-2026 11:29:18 UTC

### Exact File / Band Mapping
| Purpose | Internal Path within ZIP | Format / Dtype | Dimensions | Resolution | NoData |
|---|---|---|---|---|---|
| **HH Co-pol Amplitude** | `scene_HH/imagery_HH.tif` | GeoTIFF (`uint16`) | 10,501 × 10,401 | 18.0 m × 18.0 m | `0.0` |
| **HV Cross-pol Amplitude** | `scene_HV/imagery_HV.tif` | GeoTIFF (`uint16`) | 10,501 × 10,401 | 18.0 m × 18.0 m | `0.0` |
| **Local Incidence Angle** | `..._lia.tif` | GeoTIFF (`float32`) | 10,501 × 10,401 | 18.0 m × 18.0 m | `0.0` |
| **Contributing Area** | `..._area.tif` | GeoTIFF (`float32`) | 10,501 × 10,401 | 18.0 m × 18.0 m | `0.0` |
| **Data Mask** | `..._mask.tif` | GeoTIFF (`uint8`) | 10,501 × 10,401 | 18.0 m × 18.0 m | `0` |
| **XML Product Specification** | `product.xml` | XML (CEOS ARD schema) | — | — | — |
| **Metadata Key-Values** | `BAND_META.txt` / `*.meta` | Plain text | — | — | — |
| **Tie Point Grids** | `..._HH_level_2B_grid.txt` | Tabular text grid | — | — | — |

### Spatial Extent & Projection
- **Coordinate Reference System:** `EPSG:32644` (`WGS 84 / UTM zone 44N`)
- **UTM Bounding Box:**
  - Easting ($X$): 325,800.0 m to 514,818.0 m
  - Northing ($Y$): 1,396,782.0 m to 1,584,000.0 m
- **Geographic Bounding Box (WGS 84):**
  - Longitude: `[79.3848° E, 81.1374° E]`
  - Latitude: `[12.6303° N, 14.3280° N]`
- **Scene Center:** 13.4806° N, 80.2635° E

### Calibration & Radiometric Transformation
According to `product.xml` under `<BackscatterMeasurementData>`:
- **Measurement:** $\gamma^0$ (Gamma-Nought) in linear power convention
- **Calibration Constant:** $K = 67.139999$ ($\beta^0$ base) / $68.238594$ ($\gamma^0$) / $69.263191$ ($\sigma^0$)
- **Official Conversion Equation:**
  $$\gamma^0_{\text{dB}} = 10 \cdot \log_{10}(\text{DN}^2) - 67.139999 = 20 \cdot \log_{10}(\text{DN}) - 67.139999$$

---

## 3. NISAR S-SAR GCOV Detailed Technical Profile

### File & Path Information
- **File Path:** `data/raw/satellite/nisar/NISAR_S2_PR_GCOV_029_156_A_008_3700_DHNA_A_20260905T000822_20260905T000843_P00500_M_P_I_001.h5`
- **File Size:** 7,606,686,000 bytes (~7.61 GB)
- **File Format:** Hierarchical Data Format 5 (HDF5 / NetCDF4 compatible)

### Mission & Acquisition Metadata
- **Mission:** NISAR (NASA-ISRO SAR Mission)
- **Sensor:** S-band Synthetic Aperture Radar (S-SAR, ~3.2 GHz, provided by ISRO)
- **Product:** Level-2 Geocoded Covariance (GCOV), Observation Mode `DHNA` (Dual Polarization HH/HV)
- **Pass Direction:** Ascending (A)
- **Acquisition Timestamp:** 2026-09-05T00:08:22 to 2026-09-05T00:08:43 UTC
- **Orbit Track / Frame:** Track 029, Frame 156

### Exact HDF5 Dataset Hierarchy
All scientific arrays are located in `/science/SSAR/GCOV/grids/frequencyA/`:

| Dataset Name | HDF5 Internal Path | Array Shape | Data Type | Units / Range | Fill Value |
|---|---|---|---|---|---|
| **HH Co-pol Power ($\gamma^0$)** | `/science/SSAR/GCOV/grids/frequencyA/HHHH` | `(32544, 33768)` | `float32` | Linear power `DN`<br>[0.0, 13396.4] | `NaN` |
| **HV Cross-pol Power ($\gamma^0$)** | `/science/SSAR/GCOV/grids/frequencyA/HVHV` | `(32544, 33768)` | `float32` | Linear power `DN`<br>[0.0, 618.6] | `NaN` |
| **Cross-term Covariance** | `/science/SSAR/GCOV/grids/frequencyA/HHHV` | `(32544, 33768)` | `complex64` | Complex covariance | `NaN` |
| **RTC Correction Factor** | `/science/SSAR/GCOV/grids/frequencyA/rtcGammaToSigmaFactor` | `(32544, 33768)` | `float32` | Ratio $\gamma^0 \to \sigma^0$ | `NaN` |
| **Subswath Validity Mask** | `/science/SSAR/GCOV/grids/frequencyA/mask` | `(32544, 33768)` | `uint8` | Mask code (0=invalid, 255=fill) | `255` |
| **Number of Looks** | `/science/SSAR/GCOV/grids/frequencyA/numberOfLooks` | `(32544, 33768)` | `float32` | Range looks count | `NaN` |
| **X Coordinates (Easting)** | `/science/SSAR/GCOV/grids/frequencyA/xCoordinates` | `(33768,)` | `float64` | Meters in UTM44N | None |
| **Y Coordinates (Northing)** | `/science/SSAR/GCOV/grids/frequencyA/yCoordinates` | `(32544,)` | `float64` | Meters in UTM44N | None |
| **Grid Projection Definition** | `/science/SSAR/GCOV/grids/frequencyA/projection` | Scalar | `uint32` | EPSG 32644 attributes | None |

### Spatial Extent & Resolution
- **Pixel Spacing:** $\Delta x = 10.0\text{ m}$, $\Delta y = -10.0\text{ m}$ (Regular 10m grid)
- **Raster Dimensions:** 33,768 columns × 32,544 rows
- **Easting Range:** 339,125.0 m to 676,795.0 m
- **Northing Range:** 1,257,125.0 m to 1,582,555.0 m
- **Geographic Extent (WGS 84):**
  - Longitude: `[79.5257° E, 82.6391° E]`
  - Latitude: `[11.3684° N, 14.3093° N]`
- **Official Bounding Polygon:**
  `POLYGON ((79.6565 13.6491, 81.9172 14.1893, 82.2193 12.9500, 79.9697 12.4154, 79.6565 13.6491))`

### Calibration & Radiometric Characteristics
- Datasets `HHHH` and `HVHV` store radiometrically calibrated radar backscatter in **linear $\gamma^0$ power units**.
- Conversion to decibels ($\text{dB}$):
  $$\gamma^0_{\text{dB}} = 10 \cdot \log_{10}(\text{HHHH})$$
- Optional conversion to $\sigma^0$ (Sigma-Nought):
  $$\sigma^0 = \gamma^0 \cdot \text{rtcGammaToSigmaFactor}$$

---

## 4. INCOIS RSMC HYCOM Ocean Currents Detailed Technical Profile

### File & Path Information
- **File Path:** `data/raw/ocean/incois/RSMC_hycom_20260914.nc`
- **File Size:** 10,581,647,292 bytes (~10.58 GB)
- **Format:** NetCDF-4 / HDF5, Conventions: `CF-1.6`
- **Origin:** Indian National Centre for Ocean Information Services (INCOIS), Hyderabad / RSMC New Delhi

### Grid Dimensions
- `LON`: 1,665 points, uniform grid spacing $\Delta \lambda = 0.060000^\circ$ (~6.6 km)
  - Range: `[20.0000° E, 119.8400° E]` (Entire Northern & Tropical Indian Ocean, Bay of Bengal, Arabian Sea)
- `LAT`: 1,384 points, uneven Mercator grid spacing $\Delta \phi \approx 0.0425^\circ \text{ to } 0.0600^\circ$ (~4.7 to 6.6 km)
  - Range: `[-44.9300° S, +30.9541° N]`
- `DEPTH`: 6 vertical levels: `[0.0, 10.0, 50.0, 100.0, 250.0, 500.0]` meters (surface at index 0)
- `TIME`: 28 time steps at 6-hour intervals
  - Start: `2026-09-13 06:00:00 UTC`
  - End: `2026-09-20 00:00:00 UTC` (7-day operational hydrodynamic forecast)

### Exact NetCDF Variable Names & Specifications
| Variable Name | Shape | Dimensions | Data Type | Physical Units | Fill Value / Interpretation |
|---|---|---|---|---|---|
| `LON` | `(1665,)` | `(LON,)` | `float32` | `degrees_east` | Longitude coordinates |
| `LAT` | `(1384,)` | `(LAT,)` | `float32` | `degrees_north` | Latitude coordinates |
| `TIME` | `(28,)` | `(TIME,)` | `float64` | `days since 1900-12-31` | 6-hourly operational forecast steps |
| `DEPTH` | `(6,)` | `(DEPTH,)` | `float32` | `m` (positive down) | Depth layers (0.0 m is surface) |
| **`UVEL`** | `(28, 6, 1384, 1665)` | `(TIME, DEPTH, LAT, LON)` | `float32` | `m/s` | **Eastward ocean current velocity** (`_FillValue: 1.2676506e+30`) |
| **`VVEL`** | `(28, 6, 1384, 1665)` | `(TIME, DEPTH, LAT, LON)` | `float32` | `m/s` | **Northward ocean current velocity** (`_FillValue: 1.2676506e+30`) |
| `SSH` | `(28, 1384, 1665)` | `(TIME, LAT, LON)` | `float32` | `m` | Sea Surface Height |
| `TEMP` | `(28, 6, 1384, 1665)` | `(TIME, DEPTH, LAT, LON)` | `float32` | `degC` | Sea Water Temperature |
| `SALN` | `(28, 6, 1384, 1665)` | `(TIME, DEPTH, LAT, LON)` | `float32` | `psu` | Salinity |
| `MLD` | `(28, 1384, 1665)` | `(TIME, LAT, LON)` | `float64` | `m` | Mixed Layer Depth |

---

## 5. Common Ennore Test Location Coverage Check

**Verification Target:**
- **Latitude:** `13.23° N`
- **Longitude:** `80.36° E`
- **Location:** Ennore / Kamarajar Port approach channel, Tamil Nadu, India

### Verification Results Matrix
| Data Source | Target Pixel / Coordinate Index | Coverage Status | Pixel / Cell Sample Values at Target |
|---|---|---|---|
| **EOS-04** | Row 6,741, Col 5,825 in (10401, 10501) | **CONFIRMED** | `HH`: 299 DN (~ -17.6 dB $\gamma^0$)<br>`HV`: 153 DN (~ -23.4 dB $\gamma^0$) |
| **NISAR S-SAR** | Row 11,990, Col 9,154 in (32544, 33768) | **CONFIRMED** | `HHHH`: 0.0305 linear (~ -15.1 dB $\gamma^0$)<br>`HVHV`: 0.0123 linear (~ -19.1 dB $\gamma^0$) |
| **INCOIS HYCOM** | Lat idx 1,062 (13.2016°N), Lon idx 1,006 (80.3600°E) | **CONFIRMED** | `UVEL` (surface): +0.049 m/s (East)<br>`VVEL` (surface): +0.194 m/s (North) |
| **ERA5 Wind** | `data/demo/ennore/wind/wind_field.nc` (Lat: [13.0, 13.5], Lon: [80.2, 80.6]) | **CONFIRMED** | `u10`: -5.0 m/s, `v10`: -2.0 m/s (speed: 5.39 m/s) |

---

## 6. Format, Scaling, & Dimensional Conversions Required

1. **EOS-04 GeoTIFF Conversion**:
   - Stored as `uint16` Digital Numbers (DN).
   - Must be converted to decibels using calibration formula:
     $$\gamma^0_{\text{dB}} = 20 \cdot \log_{10}(\text{DN}) - 67.14$$
   - Values below 0 or equal to 0 are nodata and should be masked before logarithmic conversion.

2. **NISAR HDF5 Extraction**:
   - Stored in HDF5 format under dataset `/science/SSAR/GCOV/grids/frequencyA/HHHH`.
   - Data type is `float32` representing linear power.
   - Decibel conversion is straightforward:
     $$\gamma^0_{\text{dB}} = 10 \cdot \log_{10}(\text{clip}(\text{HHHH}, 10^{-5}, \infty))$$
   - The file is 7.6 GB; opening the whole array into RAM at once requires ~4.4 GB per channel. Block/windowed reading (e.g. 512×512 tiles) is mandatory.

3. **INCOIS Current Vector Grid Interpolation**:
   - NetCDF variables `UVEL` and `VVEL` have 4 dimensions `(TIME, DEPTH, LAT, LON)`.
   - For surface drift advection, must slice `DEPTH = 0` (`DEPTH[0] = 0.0m`).
   - Fill value `1.2676506e+30` must be converted to `np.nan`.
   - Unlike CMEMS (which has a uniform grid), INCOIS `LAT` is an uneven Mercator grid. Interpolators must take 1D coordinate vectors rather than uniform step increments.

---

## 7. Pipeline Incompatibilities & Constraints

1. **Polarization Mismatch with Existing U-Net Model**:
   - **Existing Model:** Trained on Sentinel-1 C-band SAR with channel input `[VH, VV, 0]`.
   - **EOS-04 & NISAR:** Dual-polarization products are **`[HH, HV]`** (or `[HV, HH]`), **NOT `[VV, VH]`**.
   - **Physics Constraint:** Copolarized backscatter over water differs fundamentally between horizontal (HH) and vertical (VV) transmits: VV has higher sea clutter and Brewster-angle sensitivity, whereas HH has lower sea clutter and different oil slick damping ratios.
   - **Action:** Do **NOT** feed HH directly into a network trained on VV without fine-tuning or explicit polarization-transfer calibration.

2. **Frequency Band Disparity**:
   - **Sentinel-1 / EOS-04:** C-band (~5.4 GHz, $\lambda \approx 5.5\text{ cm}$). Capillary waves ($2\text{ cm} \le \lambda \le 10\text{ cm}$) are directly damped by thin oil films, producing strong dark signatures.
   - **NISAR S-SAR:** S-band (~3.2 GHz, $\lambda \approx 9.3\text{ cm}$). Longer wavelength interacts with larger gravity-capillary waves. Oil damping response in S-band differs from C-band.

3. **Current Ingestion Schema Discrepancy**:
   - The existing `CMEMSNetCDFCurrentAdapter` in `backend/app/worker/stages/drift.py` hardcodes variable names `uo` and `vo`, and expects dimensions `(time, depth, latitude, longitude)`.
   - INCOIS HYCOM uses `UVEL` and `VVEL` with dimensions `(TIME, DEPTH, LAT, LON)`.
   - Direct drop-in without an adapter class will raise a `KeyError: 'uo'`.

---

## 8. Recommendations for Next Adapter Implementations

### Adapter 1: `INCOISCurrentAdapter` (`backend/app/worker/stages/drift.py`)
- **Status:** **Ready for immediate implementation.**
- **Implementation Strategy:**
  - Create `class INCOISCurrentAdapter(EnvironmentalDataAdapter)` alongside `CMEMSNetCDFCurrentAdapter`.
  - Map `UVEL` to $u$ and `VVEL` to $v$.
  - Automatically select `depth_idx = 0`.
  - Use `scipy.interpolate.RegularGridInterpolator` over `(times, lats, lons)` to support the uneven Mercator latitude spacing.
  - Convert `TIME` (days since 1900-12-31) to UNIX epoch seconds.

### Adapter 2: `EOS04Reader` (`scripts/` / `backend/`)
- **Status:** **Ready for adapter ingestion development.**
- **Implementation Strategy:**
  - Use `rasterio` with `/vsizip/` virtual file system to access `imagery_HH.tif` and `imagery_HV.tif` without extracting the 1.1 GB ZIP archive to disk.
  - Automatically extract UTM zone (44N) and reproject bounding coordinates to WGS 84.
  - Apply calibration formula $\text{dB} = 20 \log_{10}(\text{DN}) - 67.14$.

### Adapter 3: `NISARReader` (`scripts/` / `backend/`)
- **Status:** **Ready for adapter ingestion development.**
- **Implementation Strategy:**
  - Read via `h5py` in windowed chunks or through GDAL subdataset string `HDF5:"...":/science/SSAR/GCOV/grids/frequencyA/HHHH`.
  - Convert linear power to dB: $10 \log_{10}(\text{HHHH})$.
  - Extract spatial bounding box from `xCoordinates` and `yCoordinates`.
