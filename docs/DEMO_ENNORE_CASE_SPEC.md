# DEMO CASE SPECIFICATION: Ennore 2017 Collision

## A. Historical Case Context
- **Incident:** Ennore Port Oil Spill (Collision between MT BW Maple and MT Dawn Kanchipuram)
- **Location:** Kamarajar Port, Ennore, Chennai, India (Approx. 13.26° N, 80.35° E)
- **Date:** January 28, 2017
- **Details:** Two vessels collided just outside the port's breakwater, resulting in a substantial release of Heavy Fuel Oil (HFO) that drifted southward along the Chennai coastline. This case is selected as the primary demonstration of OceanWatch AI's end-to-end attribution pipeline.

## B. Evidence Classification Matrix

To preserve scientific and historical integrity, the demonstration distinguishes between real historical records and synthetic pipeline validations:

| Component | Status | Description |
| :--- | :--- | :--- |
| **Historical Context** | **REAL HISTORICAL INFORMATION** | The date, location, and vessels (BW Maple / Dawn Kanchipuram) are historical facts. |
| **Sentinel-1 SAR** | **SYNTHETIC DEMONSTRATION DATA** | A synthetic SAR proxy image with a known ground-truth slick mask is generated. |
| **Wind & Currents** | **SYNTHETIC DEMONSTRATION DATA** | Plausible coastal environmental grids are procedurally generated for drift execution. |
| **AIS Trajectories** | **SYNTHETIC DEMONSTRATION DATA** | Vessel trajectories (including the source and distractors) are mathematically reconstructed. |
| **Attribution Result**| **MODEL-DERIVED OUTPUT** | The final ranked list of suspect vessels is algorithmically derived by the 7-Factor attribution engine. |

## C. Demonstration Objective
The objective is to execute a complete, mathematically rigorous run of the OceanWatch AI pipeline using a controlled environment. The pipeline steps are:
1. Load Synthetic SAR image.
2. Segment the slick via Attention U-Net.
3. Validate physically via GLCM and morphology.
4. Advect the slick backward using Lagrangian drift modeling against synthetic ERA5/CMEMS proxies.
5. Identify candidate vessels via synthetic AIS matching.
6. Extract behavioral features and anomaly scores.
7. Execute the 7-Factor Attribution engine.
8. Validate that the ground-truth vessel naturally emerges as Rank #1 through physics and probability, not hard-coding.

## D. Required UI Disclaimer
Any frontend interface or generated report displaying these results MUST include the following disclaimer:
> **DEMONSTRATION MODE** — Historical AIS trajectories and SAR data required for this specific case were not available to the project. The trajectories and satellite imagery shown in this demonstration are synthetically reconstructed for pipeline validation and must not be interpreted as historical forensic evidence.
