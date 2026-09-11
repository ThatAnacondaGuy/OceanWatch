# Phase J-2.2: MV X-Press Pearl Open AIS Verification

This document details the independent verification of the claim that genuine open-access raw AIS trajectory data for the MV X-Press Pearl (IMO: 9875343, MMSI: 563118200) incident exists, before committing to a case pivot.

## 1. Zenodo Repository Investigation
An exhaustive programmatic search of the Zenodo REST API and web interfaces for the vessel names, MMSI (`563118200`), IMO (`9875343`), and incident keywords returned:
- **Files Found:** Only `.pdf` documents (conference papers, journal articles) analyzing the socio-economic, ecological, and microplastic impacts.
- **Raw AIS Files:** Zero `.csv`, `.json`, or raw trajectory files.
- **Result:** The claim that a raw AIS trajectory is published on Zenodo is **FALSE**.

## 2. Alternative Open Repositories
Searches across Figshare, Mendeley Data, Kaggle, and GitHub were explicitly executed to trace supplementary datasets linked to peer-reviewed modeling papers.
- **Result:** Researchers utilize commercial providers (MarineTraffic, VesselFinder) to run GNOME/oil-spill drift models, but they do **NOT** publish the underlying raw AIS data points due to strict commercial licensing constraints. No raw trajectory was found.

## 3. Sentinel-1 & Environmental Feasibility
If AIS were acquired, the physical environment is perfectly aligned:
- **Sentinel-1 SAR:** Live CDSE queries verified acquisitions directly over Colombo (e.g., `S1A_IW_GRDH_1SDV_20210527T002537_20210527T002602`) capturing the critical spill phase.
- **ERA5 / CMEMS:** Hourly winds and daily currents are fully available for May 2021 via Copernicus.

## 4. Final Assessment Matrix

| Dataset | Genuine | Open | Exact date coverage | Spatial coverage | Raw AIS / variables | Usable | Evidence | PASS/FAIL |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **X-Press Pearl AIS** | N/A | No | N/A | N/A | No | No | Zenodo/Kaggle API Search | **FAIL** |
| **Sentinel-1 SAR** | Yes | Yes | May 20-27, 2021 | Colombo | N/A | Yes | CDSE STAC | **PASS** |
| **ERA5 / CMEMS** | Yes | Yes | May 20-27, 2021 | Colombo | N/A | Yes | Copernicus | **PASS** |

---

### OVERALL STATUS
**B. AIS EXISTS BUT GATED**
Historical AIS trajectories natively exist in commercial maritime databases, but they strictly require commercial/restricted access. No genuine open-source raw AIS trajectory could be found in academic repositories.

### FINAL RECOMMENDATION:
- **INVESTIGATE A THIRD CASE** (Or supply authorized API credentials for Ennore/X-Press Pearl).

**Rationale:** Both the *Ennore 2017* and *X-Press Pearl 2021* cases perfectly align structurally with Sentinel-1 and Environmental forcing. However, both critically fail the "open and instantly accessible" requirement for raw AIS trajectories because high-resolution historical cargo/tanker ping data is monopolized by gated commercial entities. We cannot physically download an Indian Ocean vessel trajectory for these specific dates without an active Spire/MarineTraffic API key or a pre-supplied authorized dataset.
