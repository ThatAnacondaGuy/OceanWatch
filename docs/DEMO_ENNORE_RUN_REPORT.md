# Demo Ennore Run Report (N-5.1)

## Overview
The pipeline successfully reproduced an end-to-end attribution workflow on a controlled reconstruction of the Ennore incident scenario.

## Data Inputs
- SAR: Synthetic Sentinel-1 Proxy (Real Background Speckle)
- Channels: `[VH, VV, 0]`
- Validation: Full chain (Area, Aspect, GLCM, Wind Gate)
- Environmental: Synthetic ERA5 / CMEMS
- AIS: Synthetic reconstructing Ennore physics

## Results
- Slick detected: 13.1324 N, 80.3487 E
- Drift Origin (8h): ~13.2750 N, 80.4127 E

### Attribution Ranking
- Rank 1: DEMO-MMSI-001 (Prob: 42.1%)
- Rank 2: DEMO-RADAR-005 (Prob: 21.9%)
- Rank 3: DEMO-MMSI-002 (Prob: 14.2%)
- Rank 4: DEMO-MMSI-003 (Prob: 12.5%)
- Rank 5: DEMO-MMSI-004 (Prob: 9.3%)

## Validation
PASS