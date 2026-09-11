# Phase L: Acquire and Validate Real Gulf Data

This document logs the data provenance, structural validation, and preprocessing pipeline execution for the Galveston Offshore Fairway candidate on January 1, 2023. As instructed, no inference or attribution was executed, and zero data points were fabricated or "faked".

## 1. Environmental Data Provenance & Verification

### ERA5 Wind Forcing
- **Status:** **ACQUIRED SUCCESSFULLY**
- **Source URL:** `https://cds.climate.copernicus.eu/`
- **Product ID:** `reanalysis-era5-single-levels`
- **Variables:** `10m_u_component_of_wind`, `10m_v_component_of_wind`
- **Time Window:** 2023-01-01 (00:00 to 23:00 UTC)
- **Geographic Bounds:** `[29.5 N, -95.5 W, 28.8 N, -94.5 W]`
- **Format:** NetCDF (`era5_wind.nc`)
- **File Size:** 34.2 KB
- **Integrity:** Valid array containing physical wind vectors.

### CMEMS Surface Currents (GLORYS12V1)
- **Status:** **ACQUIRED SUCCESSFULLY**
- **Source URL:** `https://data.marine.copernicus.eu/`
- **Product ID:** `cmems_mod_glo_phy_my_0.083deg_P1D-m` (Dataset version 202311)
- **Variables:** `uo`, `vo` (at surface layer `0.494 m`)
- **Time Window:** 2023-01-01
- **Geographic Bounds:** `[29.5 N, -95.5 W, 28.8 N, -94.5 W]`
- **Format:** NetCDF (`cmems_currents.nc`)
- **File Size:** 13.77 KB
- **Integrity:** Valid array containing ocean velocity vectors.

## 2. Sentinel-1 SAR Provenance & Verification
- **Expected Product ID:** `S1A_IW_GRDH_1SDV_20230101T122318_20230101T122348_046590_05955B_4039.SAFE`
- **Source URL:** `https://catalogue.dataspace.copernicus.eu/odata/v1/Products`
- **Acquisition Time:** 2023-01-01 12:23:18 UTC
- **Expected Size:** ~1.3 - 2.0 GB

### Verification Status: BLOCKED (FAIL)
A scripted download using the Copernicus Data Space Ecosystem (CDSE) OData API successfully queried the product metadata. However, initiating the binary payload download resulted in a `401 Unauthorized` exception. CDSE strictly requires a valid Keycloak OAuth2 token for `.SAFE` archive extraction. The active workspace (`~/.copernicusmarine`, `~/.cdsapirc`) contains keys for Climate/Marine endpoints but **lacks authorized CDSE credentials**. 

## 3. SAR Preprocessing & Visual QA

### Preprocessing Execution: BLOCKED
As directed ("*Do not silently fake coordinates*"), the SAR pipeline execution was halted. Because the physical `.SAFE` archive could not be downloaded, the following steps could not be executed:
- Measurement extraction
- Radiometric calibration (sigma0)
- SNAP-based Range-Doppler Terrain Correction / Georeferencing
- VV/VH feature derivation
- Visual QA image generation (calibrated backscatter, land mask)

## 4. Known Limitations
The local environment is currently missing the CDSE API credentials required to download the massive Sentinel-1 SAR binaries. Because the primary sensor data cannot be acquired, **the structural validation fails at Task 1**.

**Next Phase Readiness:** We cannot begin real ML inference on this case until the Sentinel-1 archive is successfully downloaded and georeferenced.
