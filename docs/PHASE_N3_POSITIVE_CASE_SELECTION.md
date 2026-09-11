# Phase N-3: Positive Case Selection

## Incident Discovery & Candidates

To rigorously test the end-to-end pipeline (U-Net Segmentation $\rightarrow$ Drift $\rightarrow$ AIS Attribution), we require a confirmed Gulf of Mexico oil spill with genuine, overlapping Sentinel-1, ERA5, CMEMS, and MarineCadastre AIS data. 

### Candidate 1: Taylor Energy Site (Mississippi Canyon Block 20)
- **Date:** July 25, 2023
- **Coordinates:** ~ 28.93 N, -89.02 W
- **Incident:** An ongoing, persistent crude oil leak from seafloor infrastructure damaged during Hurricane Ivan. It is the most extensively documented and persistently visible oil slick in US waters.
- **Sentinel-1:** Reliable, massive slicks are visible on almost any clear-wind summer pass (e.g., late July 2023).
- **AIS:** MarineCadastre daily extracts are fully available for 2023.
- **Attribution Usefulness:** **HIGH.** Because the true source is a fixed seafloor leak, this serves as an ultimate negative-rejection test for the AIS Attribution Engine. The engine must evaluate passing ships and correctly determine that their Lagrangian drift trajectories and temporal correlations do *not* match the slick, outputting low ship probabilities and correctly isolating the slick as a dark/anomalous (infrastructure) source.

### Candidate 2: Main Pass Pipeline Spill
- **Date:** November 16, 2023
- **Coordinates:** ~ 29.0 N, -88.9 W
- **Incident:** A massive 1-million-gallon crude oil release from a subsea pipeline system off Plaquemines Parish.
- **Sentinel-1:** Massive coverage available in the days following the incident.
- **AIS:** MarineCadastre Nov 2023.
- **Attribution Usefulness:** **MEDIUM.** A large-scale spill that tests the segmentation model's ability to handle massive contiguous areas. However, because it's a pipeline leak, it serves a similar attribution function to Candidate 1, but with less predictable exact SAR timing relative to the initial blowout.

### Candidate 3: Flint Hills Terminal Leak (Corpus Christi)
- **Date:** December 2022
- **Coordinates:** Corpus Christi Bay, TX
- **Incident:** A pipeline failure releasing 14,000 gallons of crude.
- **Sentinel-1:** Available.
- **AIS:** Available.
- **Attribution Usefulness:** **MEDIUM.** In a highly constrained, extremely congested port environment, drift vectors are heavily dominated by coastal hydrology rather than open-ocean CMEMS, which could skew Lagrangian attribution.

---

## Final Selection & Ranking

**Selected Case: Candidate 1 (Taylor Energy Leak - July 25, 2023)**

**Rationale for Selection:**
1. **Known Genuine Spill:** Unquestionable presence of oil on the surface.
2. **Sentinel-1 Visibility:** Guaranteed slick footprint with a high signal-to-noise ratio against the Gulf background.
3. **AIS Availability:** `AIS_2023_07_25.csv` is fully available via MarineCadastre.
4. **Environmental Coverage:** Real ERA5 and CMEMS perfectly bound the temporal and spatial domain.
5. **Attribution Physics Test:** Testing the 7-factor scoring engine against a massive slick with dense passing marine traffic will rigorously prove that the engine does not falsely convict innocent vessels passing through or near an infrastructure spill.

## Data Requirements for Selected Case (DO NOT DOWNLOAD YET)
- **Sentinel-1:** An `S1A_IW_GRDH_1SDV` product covering `28.93 N, -89.02 W` on or near July 25, 2023.
- **MarineCadastre AIS:** `AIS_2023_07_25.csv` (or encompassing daily file).
- **ERA5:** Wind coverage bounding the Mississippi Canyon.
- **CMEMS:** Current coverage bounding the Mississippi Canyon.
