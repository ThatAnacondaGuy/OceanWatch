# Indian Sovereign Data Adapters

This document details the adapters and readers implemented to natively ingest Indian sovereign datasets (INCOIS, ISRO EOS-04, ISRO-NASA NISAR) into the OceanWatch AI platform.

## 1. INCOIS Ocean Currents Adapter (`INCOISCurrentAdapter`)
*   **Role**: Replaces/augments CMEMS with INCOIS RSMC HYCOM surface currents.
*   **Source Data**: NetCDF (`RSMC_hycom_*.nc`).
*   **Variables**: Maps `UVEL` to eastward current and `VVEL` to northward current.
*   **Layer**: Always extracts `DEPTH=0.0` (surface layer).
*   **Handling**: Uses windowed lazy-loading via `xarray.sel` to prevent RAM overload. Uses `scipy.interpolate.griddata` (linear with nearest-neighbor fallback) to precisely interpolate at required lat/lon/time points while properly masking land boundaries (fill value `1.2676506e+30`).
*   **Status**: **INTEGRATED & VERIFIED** (Drives the Lagrangian drift model).

## 2. ISRO EOS-04 SAR Reader (`EOS04Reader`)
*   **Role**: Ingests C-band Synthetic Aperture Radar data from India's EOS-04 satellite.
*   **Source Data**: Zip archives containing Georeferenced TIFFs (`imagery_HH.tif`, `imagery_HV.tif`).
*   **Handling**: Uses GDAL/rasterio `/vsizip/` virtual filesystem to read directly from the compressed archive without extracting the 1.1GB payload.
*   **Polarizations**: Preserves native `HH` and `HV`.
*   **Calibration**: Applies exact ISRO calibration: $\gamma^0_{dB} = 20 \log_{10}(DN) - 67.14$. Masks $DN \le 0$.
*   **Status**: **INGESTION READY** (Detection model adaptation required before inference).

## 3. ISRO-NASA NISAR Reader (`NISARGCOVReader`)
*   **Role**: Ingests S-band SAR data from the upcoming NISAR mission.
*   **Source Data**: HDF5 format GCOV products.
*   **Handling**: Utilizes `h5py` chunked/windowed reads to extract specific slices of the 7.6GB dataset, preventing memory crashes.
*   **Polarizations**: Extracts linear power grids for `HHHH`, `HVHV`, and `HHHV`.
*   **Calibration**: Applies conversion: $\gamma^0_{dB} = 10 \log_{10}(\text{linear\_power})$.
*   **Status**: **INGESTION READY** (Detection model adaptation required before inference).

## 4. INCOIS OOSA Reference
*   **Role**: Serves as the independent operational advisory baseline (mass budgets, stranding estimates).
*   **Integration**: Used for qualitative trajectory validation. *Not* used as training data or forced ground truth.

## 5. System Capabilities & Polarization Guardrails
To preserve scientific integrity, we do **NOT** feed EOS-04 (`HH`/`HV`) or NISAR (`HHHH`/`HVHV`) into the existing Sentinel-1 U-Net (which was trained strictly on `VH`/`VV`).
*   **Sentinel-1**: `DETECTION READY`
*   **EOS-04**: `INGESTION READY` $\rightarrow$ `DETECTION MODEL ADAPTATION REQUIRED`
*   **NISAR**: `INGESTION READY` $\rightarrow$ `DETECTION MODEL ADAPTATION REQUIRED`

## 6. Provenance & Standard Interface
All SAR readers return a standardized `SARScene` object that explicitly tracks the `source`, `acquisition_time`, `polarizations`, `nodata`, and full `provenance` string. This guarantees that all downstream forensic reports can trace the exact lineage of the data.
