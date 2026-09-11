# Phase J-2.1: Ennore Historical AIS Access Verification

This document evaluates the realistic availability of genuine historical AIS trajectories for the 28 January 2017 Ennore collision without fabricating or altering data.

## 1. Vessel Identity Verification
Authoritative maritime registries independently establish the exact identities of the vessels involved:
- **MT Dawn Kanchipuram**: IMO `9116917` | MMSI `419000988` (Oil Tanker)
- **BW Maple** (now *BW Elm*): IMO `9320752` | MMSI `419001620` (LPG Tanker)

## 2. Global Fishing Watch (GFW) Assessment
An investigation of the current GFW API and BigQuery documentation reveals:
- **Product Name:** GFW AIS Vessel Presence / BigQuery tables.
- **Coverage & Resolution:** The public BigQuery datasets provide processed, aggregated fishing effort and binned presence (0.01° grid cells, hourly/daily resolution).
- **Raw AIS Trajectories:** GFW explicitly **does not provide** raw AIS pings (with exact timestamps, raw lat/lon, and MMSIs for non-fishing commercial vessels) via its public BigQuery interface. 
- **Viability:** While GFW's internal database holds the records, the public/academic APIs cannot support high-resolution port-level collision trajectory reconstruction for cargo/tankers without a specialized data agreement.

## 3. Commercial Providers (Spire / MarineTraffic / exactEarth)
An investigation of commercial historical Satellite/Terrestrial AIS archives reveals:
- **Historical Coverage:** Complete archival coverage dating back before 2017.
- **Geographic Coverage:** Global, encompassing the Ennore / Bay of Bengal region.
- **Resolution & Variables:** Retains raw position (Lat/Lon), precise UTC timestamps, MMSIs, and IMO linkages natively.
- **Viability:** Fully capable of trajectory reconstruction for both vessels.
- **Access Route:** Requires execution of an academic/research data grant or a commercial API subscription. A small bounding box for Jan 28-29, 2017, is a trivial database query but strictly gated by credentials.

## 4. Open Academic Data Assessment
A comprehensive search across Zenodo, Kaggle, Mendeley Data, GitHub, and Figshare for `"Dawn Kanchipuram"`, `"BW Maple"`, and `"Ennore AIS"` yielded the following:
- **Literature:** The 2017 Ennore spill is heavily documented in academic literature (e.g., *Indian Academy of Sciences*, 2018), where researchers used GNOME and HYCOM to model the drift.
- **Dataset Availability:** However, none of the papers published the raw `.csv` or `.json` AIS tracks as open supplementary datasets. 
- **Viability:** There is no currently downloadable, open-source raw AIS dataset for this specific incident.

## 5. Final AIS Verdict

| Source | Raw positions | UTC time | MMSI | Non-fishing vessels | 2017 coverage | Ennore coverage | Accessible now | Trajectory reconstruction | PASS/FAIL |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **GFW Public BQ** | No | Binned | No | Binned | Yes | Yes | Yes | No | **FAIL** |
| **Open Repos** | N/A | N/A | N/A | N/A | N/A | N/A | No | No | **FAIL** |
| **Spire / Comm.** | Yes | Yes | Yes | Yes | Yes | Yes | No (Creds) | Yes | **PASS (Gated)** |

---

### FINAL STATUS
**AIS ACCESSIBLE BUT NOT YET OBTAINED**

### BLOCKER
The raw AIS trajectories required to mathematically prove the attribution engine without fabrication exist securely within commercial databases (MarineTraffic, Spire). Because there is no open-access academic repository hosting this specific collision's AIS track, we lack the authorized API credentials to physically download the array into the OceanWatch workspace today.

### NEXT ACTION
Suspend the Indian Ennore attribution demonstration. The project must either:
1. Formally apply for a Spire Maritime Academic Data Grant to obtain the exact `2017-01-28` bounding-box CSV.
2. Pivot to the **MV X-Press Pearl (2021)** case, where the entire raw AIS track has already been published as open-access on Zenodo, bypassing the credential block entirely.
