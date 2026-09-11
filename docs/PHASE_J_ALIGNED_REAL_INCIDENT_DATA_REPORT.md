# Phase J: Aligned Real Incident Data Report

This phase audits the local environment for a genuinely co-located, temporally compatible dataset spanning all three sub-systems: Synthetic Aperture Radar (SAR), Automatic Identification System (AIS), and Environmental Forcing (ERA5/CMEMS).

## 1. Domain Asset Inventory & Provenance

An exhaustive audit of the `data/raw/` directories reveals the following temporal and geographic provenances for our real-data assets:

### A. Synthetic Aperture Radar (SAR)
- **Dataset 1:** xView3 Tiny Dataset
  - **Temporal Range:** 2021 (The xView3 competition dataset was published utilizing S1 acquisitions up to 2021).
  - **Geographic Bounds:** Global.
- **Dataset 2:** Zenodo Oil Spill Dataset
  - **Temporal Range:** 2020 or earlier (Dataset published Dec 2020).
  - **Geographic Bounds:** Global.

### B. Automatic Identification System (AIS)
- **Dataset:** MarineCadastre
  - **Source Filename:** `AIS_2023_01_01.csv`
  - **Temporal Range:** Exactly `2023-01-01`
  - **Geographic Bounds:** US Coastal Waters (e.g., Lat ~38.6, Lon ~-90.1)

### C. Environmental Forcing (ERA5 / CMEMS)
- **Dataset:** Copernicus Marine & Climate Data Stores
  - **Source Filenames:** `era5_wind_demo.nc`, `cmems_current_demo.nc`, `era5_wind_20250909.nc`
  - **Temporal Range:** Jan 2023, Sept 2025
  - **Geographic Bounds:** Configurable (e.g., Gulf of Mexico, Arabian Sea)

## 2. Alignment Verification

| Subsystem | Temporal Truth | Spatial Truth | Compatibility Status |
| :--- | :--- | :--- | :--- |
| **SAR (Zenodo/xView3)** | $\le$ 2021 | Global | N/A |
| **AIS (MarineCadastre)** | 2023-01-01 | US Waters | Temporal Mismatch (2+ years) |
| **Environment** | Jan 2023 | Configurable | Temporally aligned with AIS, disjoint from SAR |

**Analysis:**
A mathematical temporal intersection does not exist in the current workspace. The SAR imagery available was captured in 2021 or earlier, while our massive physical AIS dataset strictly covers January 1, 2023. 

## 3. Conclusion & Constraints
In strict adherence to the project directives:
- I have **NOT** altered candidate coordinates to force a match.
- I have **NOT** synthesized fake AIS records into the 2021 timeline.
- I have **NOT** fabricated vessel identities.
- I have **NOT** executed the final 7-factor attribution.

**Status:** A genuine, same-incident attribution (where a single physical oil spill aligns with physical AIS and physical SAR) is currently **PENDING**. To run the final physical demonstration without synthesizing data, we require either:
1. Downloading the 2021 MarineCadastre dataset to match xView3.
2. Acquiring a new Sentinel-1 SAR scene for `2023-01-01` that overlaps our existing US Waters AIS data.
