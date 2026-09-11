# OceanWatch AI — Data Sources & Access Requirements

Before initiating large downloads, this document details the exact provenance, format, and access requirements for the datasets required by the OceanWatch AI pipeline (Phase B).

## 1. Zenodo SAR Oil Spill Dataset (Training/Validation)
- **Source URL:** https://zenodo.org/record/4322585 (Krestenitis et al.)
- **Access Requirements:** Open Access (no API key required).
- **License:** Creative Commons Attribution 4.0 International (CC-BY 4.0).
- **Format:** `.jpg` / `.png` image chips and 1D/2D binary mask labels.
- **Total Size:** ~1.2 GB (zipped).
- **Minimal Subset:** 10 images + 10 masks (for pipeline validation).

## 2. xView3 SAR Ship Detection Dataset (Training/Validation)
- **Source URL:** https://iuu.xview.us/ (Defense Innovation Unit)
- **Access Requirements:** **Registration Required.** Must create an account and agree to terms. Data is gated behind signed URLs.
- **License:** xView3 Challenge License (Open for research/non-commercial).
- **Format:** Sentinel-1 GRD GeoTIFFs (VV/VH) + CSV files with point labels.
- **Total Size:** ~18 GB (train/val split).
- **Minimal Subset:** Because it is gated, the automated script will generate a synthetic GeoTIFF + CSV label fixture mimicking the xView3 format for smoke testing.

## 3. MarineCadastre (Demo AIS)
- **Source URL:** https://coast.noaa.gov/htdata/CMSP/AISDataHandler/2023/
- **Access Requirements:** Open Access (US Gov Public Domain). No API key required.
- **License:** Public Domain.
- **Format:** Daily CSV files.
- **Total Size:** ~300-500 MB per day.
- **Minimal Subset:** Generate synthetic subset mimicking format for smoke test.

## 4. ERA5 Wind Forcing (Environment Cache)
- **Source URL:** https://cds.climate.copernicus.eu/
- **Access Requirements:** **Registration Required.** Requires CDS API Key.
- **Format:** NetCDF4 (`.nc`)
- **Total Size:** ~10-50 MB per monthly regional extract.
- **Minimal Subset:** Script generates a synthetic NetCDF file with uniform 5 m/s wind fields.

## 5. CMEMS Ocean Currents (Environment Cache)
- **Source URL:** https://data.marine.copernicus.eu/
- **Access Requirements:** **Registration Required.** Requires Copernicus Marine Credentials.
- **Format:** NetCDF4 (`.nc`)
- **Total Size:** ~20-100 MB per monthly regional extract.
- **Minimal Subset:** Generates a synthetic NetCDF file with a baseline 0.5 m/s ocean current.
