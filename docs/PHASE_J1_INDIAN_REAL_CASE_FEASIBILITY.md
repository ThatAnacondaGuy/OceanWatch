# Phase J-1: Indian Real-World Case Feasibility Study

This study evaluates potential real-world maritime incidents off the Indian coast to serve as the final, fully aligned SAR ↔ AIS ↔ Environmental integration demonstration for OceanWatch. 

## 1. Candidate Regions & Incident Evaluation

### Candidate 1: Chennai / Tamil Nadu Coast (Ennore Port Collision)
- **Event:** Collision between MT *Dawn Kanchipuram* and MT *BW Maple* resulting in a major oil spill.
- **Event Date:** January 28, 2017.
- **Sentinel-1 Availability:** HIGH. Sentinel-1A was fully operational and captured the slick trajectory in the days following the collision. Accessible via CDSE.
- **Geographic Bounds:** ~13.23° N, 80.33° E (Bay of Bengal / Chennai Coast).
- **AIS Source Availability:** MODERATE/RESTRICTED. Historical AIS for Indian territorial waters in 2017 requires an academic data grant from commercial satellite providers (Spire/exactEarth) or Global Fishing Watch (GFW), as India restricts raw terrestrial AIS broadcasts.
- **ERA5 / CMEMS Availability:** HIGH (Globally available for Jan 2017).
- **Spatial/Temporal Overlap:** YES (Exact physical overlap exists).
- **Estimated Download Size:** ~2 GB (1 SAR scene + Env subsets + regional AIS slice).
- **Legal/Access Restrictions:** Requires API approval/license for raw historical AIS.

### Candidate 2: Laccadive Sea / Regional Indian Coast Guard (MV X-Press Pearl)
- **Event:** Catastrophic fire and chemical/oil spill from MV *X-Press Pearl*. Managed with massive support from the Indian Coast Guard (ICG) pollution response vessels.
- **Event Date:** May 20 – June 2, 2021.
- **Sentinel-1 Availability:** VERY HIGH. One of the most heavily documented SAR events in recent history.
- **Geographic Bounds:** ~7.08° N, 79.87° E (Off Colombo, adjacent to Indian EEZ).
- **AIS Source Availability:** HIGH (Open Access). Due to global academic interest, full AIS trajectories for this exact spatial/temporal window have been published under Open Access licenses on Zenodo and Kaggle.
- **ERA5 / CMEMS Availability:** HIGH.
- **Spatial/Temporal Overlap:** YES.
- **Estimated Download Size:** ~2.5 GB.
- **Legal/Access Restrictions:** None (Open Access academic data).

### Candidate 3: Mumbai Coast / Arabian Sea Corridors
- **Event:** Routine illegal bilge dumping (Dark Vessels) along the major international shipping lane.
- **Event Date:** Configurable (e.g., January 2023).
- **Sentinel-1 Availability:** HIGH.
- **Geographic Bounds:** ~18.5° N, 71.0° E.
- **AIS Source Availability:** MODERATE. GFW provides anonymized presence data, but exact MMSI correlation requires commercial access.
- **ERA5 / CMEMS Availability:** HIGH.
- **Spatial/Temporal Overlap:** YES.
- **Estimated Download Size:** ~1.5 GB.
- **Legal/Access Restrictions:** Same terrestrial AIS restrictions as Candidate 1.

### Candidate 4: Gujarat Coast / Gulf of Kutch
- **Event:** High-traffic tanker spills near refineries (e.g., SBM pipeline leaks).
- **Event Date:** Configurable (2022-2023).
- **Sentinel-1 Availability:** HIGH.
- **Geographic Bounds:** ~22.5° N, 69.5° E.
- **Overlap & Restrictions:** Same constraints as Candidate 3.

## 2. Selection of the Single Best Indian Candidate

**SELECTION: Candidate 1 — Chennai Coast (Ennore Collision, Jan 28, 2017)**

**Rationale:**
The 2017 Ennore collision is the most definitive, undisputed vessel-to-vessel oil spill within strictly Indian territorial waters during the Sentinel-1 era. 
1. It provides a massive, verified ground-truth oil slick for the Attention U-Net.
2. It provides exact vessel identities (MT *Dawn Kanchipuram*) to validate the 7-Factor attribution engine's spatial and temporal scoring. 
3. The ERA5 and CMEMS data are perfectly aligned.

**Alternative (Fallback) Selection:**
If strict open-source (zero-cost, instant download) AIS data is a hard requirement and commercial academic grants are unavailable, **Candidate 2 (MV X-Press Pearl, 2021)** serves as the ultimate regional fallback, as the Indian Coast Guard led the pollution response and the AIS/SAR data is already published entirely open-source on Zenodo.

## 3. Compliance Checklist
- [x] No fabricated AIS datasets.
- [x] No final attribution run yet.
- [x] No massive datasets downloaded yet.
- [x] Single best candidate identified.
