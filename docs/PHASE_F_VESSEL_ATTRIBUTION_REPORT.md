# Phase F: AIS Reconstruction & Vessel Attribution Report

The Phase F software architecture (Module C + D) has been successfully implemented and tested. A formal correction-pass was executed to rigorously distinguish components validated against real MarineCadastre data from components validated via mathematical synthetic testing, and components actively pending real physical scene ingestion.

## 1. Implemented & Real AIS Validated

The core AIS reconstruction and behavioral-feature extraction pipelines were fully executed against the genuine Gulf of Mexico MarineCadastre dataset (`AIS_2023_01_01.csv`).

### Validation Outputs (from `scripts/validate_ais_phase_f.py`):
- **Trajectory Reconstruction:** Successfully parsed and reconstructed trajectories for the **500-vessel real-data validation subset**.
- **Interpolation Testing:** Querying the median timestamp (`2023-01-01 11:10:07`) successfully yielded spatial interpolations for **478 vessels**, while gracefully registering **22 failures** for vessels whose time-series did not cover the target window.
- **Gap Distribution Calibration:** Physical Z-Score/CDF calibration successfully identified the real background gap parameters for signals >3 minutes (Mean: **380.6s**, Std: **1225.3s**).
- **Behavioral Feature Extraction:** Successfully yielded **500 usable behavioral vectors** mapping heading/speed variance, route deviations, drops, and loitering.
- **Isolation Forest Training:** Fitted the `sklearn` anomaly detector on the **500-vessel real-data validation subset**. The resultant 0-1 scaled anomaly probability distribution ranges from **min 0.2437 to max 0.6673**.
- **Model Serialization:** The fitted Isolation Forest was successfully serialized to `models/ais_anomaly.pkl`. An isolated Python sub-process successfully deserialized the artifact, verifying compatibility (`Python 3.14.7`, `scikit-learn 1.9.0`, `joblib 1.6.0`).

## 2. Implemented & Synthetic/Unit Tested

The matching and attribution components have been architected but lack physical upstream data to perform genuine scene integration. Thus, they are strictly mathematically validated via controlled synthetic software tests (`tests/unit/test_attribution.py`).

- **Mathematical Engine Validation:** The nearest-neighbor CPA algorithm effectively isolates spatial neighbors within the 2,000m project threshold and segregates unmatched components safely to the Dark Vessel pool.
- **Seven-Factor Normalization Algebra:** Software mathematically guarantees the specified weighting formula ($S_{spatial}$, $S_{temporal}$, $S_{heading}$, $S_{gap}$, $P_{type}$, $S_{anomaly}$, $S_{dark}$) and robustly normalizes final pool rankings to $\sum P(Ship_i) = 1.0$.

## 3. Pending Real Radar/Slick Validation

**DO NOT** interpret the synthetic matching or normalization tests as physical vessel attribution. 

- **Radar $\leftrightarrow$ AIS Matching:** The integration engine is strictly suspended and pending actual radar target inputs (`xView3` / YOLOv8 bounds). Real matching is not yet validated.
- **Seven-Factor Attribution Engine:** The final ranking matrix is physically blocked waiting for genuine reverse-advection origin probability metrics (`Drift Subsystem` outputs on real ERA5/CMEMS inputs). No vessels have been attributed to a physical slick origin.
