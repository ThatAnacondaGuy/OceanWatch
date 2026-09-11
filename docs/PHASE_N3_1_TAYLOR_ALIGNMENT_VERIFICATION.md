# Phase N-3.1: Taylor Energy Alignment Verification

## 1. Sentinel-1 SAR Coverage
- **Status:** Not Aligned (Missing Scene)
- **Target Coordinates:** 28.93 N, -89.02 W
- **Discovered Product Name:** None
- **Evidence:** I queried the official Copernicus Data Space Ecosystem (CDSE) OData catalog for any Sentinel-1 GRD IW scenes intersecting the Taylor Energy site across the requested `2023-07-25 ± 3 days` window. While scenes exist nearby (e.g., `S1A_IW_GRDH_1SDV_20230720T235359_...`), mathematical polygon intersection confirms the swath boundary falls just east of the required `-89.02` longitude. There is zero Sentinel-1 coverage of this exact site during the target time window due to the reduced Sentinel-1A observation cycle.

## 2. MarineCadastre AIS
- **Status:** Needs Acquisition
- **File Checked:** `data/raw/marine_cadastre/AIS_2023_07_25.csv`
- **Local Availability:** Missing. 
- **Evidence:** System search of `data/raw/**/*.csv` returned only the January 1st data and Zenodo/xView3 validation sets. 

## 3. ERA5 Wind Forcing
- **Status:** Needs Acquisition
- **File Checked:** `data/raw/era5/gulf_20230725`
- **Local Availability:** Missing.
- **Evidence:** Checked local storage; no ERA5 data covers the target date.

## 4. CMEMS Surface Currents
- **Status:** Needs Acquisition
- **File Checked:** `data/raw/cmems/gulf_20230725`
- **Local Availability:** Missing.
- **Evidence:** Checked local storage; no CMEMS data for the target date.

## 5. Alignment Table

| Dataset | Exact Date/Time | Spatial Coverage | Genuine | Locally Accessible | Aligned | Evidence |
|---|---|---|---|---|---|---|
| Sentinel-1 | 2023-07-25 ± 3d | Mississippi Canyon Block 20 | No | No | No | CDSE Metadata Confirmed 0 scenes |
| AIS | 2023-07-25 | - | Yes | No | No | Missing locally |
| ERA5 | 2023-07-25 | - | Yes | No | No | Missing locally |
| CMEMS | 2023-07-25 | - | Yes | No | No | Missing locally |

## 6. Final Status
NOT ALIGNED
