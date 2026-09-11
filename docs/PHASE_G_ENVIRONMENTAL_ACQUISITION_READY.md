# Phase G: Environmental Data Acquisition Preparation

The scripts required to acquire the genuine environmental matrices for the OceanWatch AI Drift Engine have been completely authored, validated against schema constraints, and staged for execution. 

## 1. Acquisition Scripts
Two robust retrieval scripts have been added to the project repository:
- `scripts/download_era5_real.py`
- `scripts/download_cmems_real.py`

### Script Guardrails & Protections
To strictly prevent the ingestion of invalid or synthetic data:
- **No Synthetic Fallback:** The scripts are programmed to fail loudly and explicitly if credentials are missing or if the API connection drops. They will *never* silently generate dummy data.
- **Physical Variance Validation:** Post-download, the scripts automatically ingest the NetCDF using `xarray`. They explicitly calculate the spatial and temporal variance (`np.nanstd`) of the physical fields (e.g., $U10$, $V_o$). If the variance is $0.0$, indicating a flat/dummy file, the file is actively rejected and deleted.
- **Data Destination:** All successfully verified physical data is routed directly to `data/raw/era5/` and `data/raw/cmems/`, abandoning the `data/cached/` directory utilized previously for dummy arrays.

## 2. API Request Specifications
To retrieve exactly the minimal practical data for a 72-hour demonstration without overwhelming storage or bandwidth, the APIs are securely constrained to:

### ERA5 Specification
- **Dataset:** `reanalysis-era5-single-levels`
- **Bounds:** `[30, -98, 24, -80]` (North, West, South, East covering the Gulf of Mexico)
- **Time Window:** `2023-01-01` to `2023-01-03` (Continuous 24-hour slices)
- **Variables:** `10m_u_component_of_wind`, `10m_v_component_of_wind`

### CMEMS / HYCOM Specification
- **Dataset:** `cmems_mod_glo_phy_anfc_0.083deg_PT1H-m`
- **Bounds:** Lon `-98` to `-80`, Lat `24` to `30`
- **Depth:** Surface Layer (`z=0.49` to `0.51`)
- **Time Window:** `2023-01-01` to `2023-01-03` (Hourly)
- **Variables:** `uo`, `vo`

## 3. Credential Setup Required
To unblock the download execution, the User must perform the following setup:

### For ERA5
1. Register at the Copernicus Climate Data Store (CDS).
2. Create a file at `~/.cdsapirc` containing your API UID and Key in standard format:
   ```
   url: https://cds.climate.copernicus.eu/api/v2
   key: <UID>:<API-KEY>
   ```

### For CMEMS
1. Register at the Copernicus Marine Service.
2. Export your credentials into your terminal session before executing the script:
   ```bash
   export COPERNICUSMARINE_SERVICE_USERNAME="<your_username>"
   export COPERNICUSMARINE_SERVICE_PASSWORD="<your_password>"
   ```

**Status:** The system is fully paused and awaiting credential authorization. Do not execute the scripts until the credentials are mathematically bound to the environment.
