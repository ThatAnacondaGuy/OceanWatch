# Phase N-1: Offshore False-Positive Correction

## Context & Rejection of Phase N
The previous detection in Phase N produced a centroid at 30.7381 N, which is located far inland (near Huntsville, Texas). The lack of a rigorous Natural Earth land mask and physics-domain filter allowed the U-Net to erroneously classify an inland water body or flooded region as an oil slick, generating a completely invalid 0.94 confidence score.

## Filtering Methodology
- **Land Mask:** Natural Earth `ne_10m_land.shp` was explicitly rasterized to the precise SNAP grid.
- **Physics ROI:** The domain was strictly bounded to the intersection of the Sentinel-1 footprint, MarineCadastre AIS, ERA5, and CMEMS extents (Lon: -95.5 to -94.5, Lat: 29.0 to 29.5).
- **Exclusion Rules:** Any candidate intersecting land by >10%, possessing a land centroid, or falling outside the Physics ROI was outright rejected and flagged as Environmental Data UNAVAILABLE.

## Re-Evaluation Results
- Initial Candidates Evaluated: 48
- Rejected (Land/Coastline intersection): 0
- Rejected (Outside Physics ROI): 48
- **Valid Offshore Candidates Remaining:** 0


---
NO VALID OFFSHORE SLICK CANDIDATE
