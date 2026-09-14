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
- Drift Origin (8h): ~13.2719 N, 80.4117 E

### Attribution Ranking
- Rank 1: DEMO-MMSI-001 (Prob: 28.9%)
- Rank 2: DEMO-RADAR-005 (Prob: 24.8%)
- Rank 3: DEMO-MMSI-002 (Prob: 16.9%)
- Rank 4: DEMO-RADAR-005 (Prob: 14.9%)
- Rank 5: DEMO-MMSI-003 (Prob: 11.7%)
- Rank 6: DEMO-MMSI-004 (Prob: 2.9%)

## Validation
PASS