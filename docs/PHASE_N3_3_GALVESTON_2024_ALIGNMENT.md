# Phase N-3.3: Galveston 2024 Vessel-Source Case Alignment

## 1. Incident Details
- **Incident:** MMLP-321 Barge Collision with Pelican Island Bridge
- **Date/Time:** May 15, 2024, ~ 09:50 CDT (~ 14:50 UTC)
- **Coordinates:** ~ 29.324 N, -94.810 W
- **Vessel:** MMLP-321 (Martin Petroleum barge) pushed by towing vessel
- **Estimated Release:** Initially estimated at up to 2,000 gallons of Vacuum Gas Oil (VGO)
- **Environment:** Inland waterway / enclosed coastal bay (Galveston Bay / Intracoastal Waterway)

## 2. Sentinel-1 SAR Coverage
- **Search Window:** May 13 to May 30, 2024
- **Result:** No Scene Available
- **Evidence:** Querying the CDSE OData API reveals that while an acquisition occurred on May 12, 2024 (prior to the incident), there are absolutely zero Sentinel-1 GRD IW scenes covering the target coordinates between May 15 and May 30, 2024. The 12-day orbital pass (expected around May 24) appears to have been skipped or not processed for this specific footprint.

## 3. MarineCadastre AIS
- **Target File:** `AIS_2024_05_15.csv`
- **Result:** Missing locally. Requires acquisition.

## 4. ERA5 Wind Forcing
- **Target Data:** Mid-May 2024
- **Result:** Missing locally. Requires acquisition.

## 5. CMEMS Surface Currents
- **Target Data:** Mid-May 2024
- **Result:** **FAIL (Physically Incompatible)**
- **Evidence:** A direct probe of the CMEMS 1/12 degree physical grid at `29.324 N, -94.810 W` returns a `MASKED` (NoData/Land) value. Galveston Bay is an inland water body that falls sub-grid for open-ocean global oceanographic models.

## 6. Alignment Table

| Dataset | Exact Time | Spatial Coverage | Genuine | Accessible | Same Incident | PASS/FAIL |
|---|---|---|---|---|---|---|
| Sentinel-1 | May 15–30 | Galveston Bay | No | No | No | FAIL (No Scenes) |
| AIS | May 15, 2024 | Galveston Bay | Yes | No | Yes | FAIL (Missing) |
| ERA5 | May 15, 2024 | Galveston Bay | Yes | No | Yes | FAIL (Missing) |
| CMEMS | May 15, 2024 | Galveston Bay | No | No | No | FAIL (Masked Inland) |

## 7. Case Quality Assessment
- **Vessel-Source Certainty:** High (Confirmed barge strike).
- **SAR Visibility Potential:** Zero. No satellite coverage exists in the immediate aftermath.
- **Coastal Complexity:** Extreme. Narrow inland channel.
- **Drift Suitability:** Zero. The open-ocean CMEMS model masks this coordinate as land. Lagrangian drift physics cannot execute.
- **Attribution Suitability:** Zero. Without drift physics and SAR polygons, the attribution engine cannot run.

## 8. Decision

NOT ALIGNED
