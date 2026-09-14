# OceanWatch AI Architecture

## 1. Problem Statement
This project addresses **NTRO Smart India Hackathon Problem Statement 26143**:
"AI-based framework for oil spill detection and forensic vessel attribution."
The objective is to ingest large-scale remote sensing imagery, dynamically track oil spills, compute reverse trajectory based on oceanographic inputs, and synthesize evidence for identifying responsible vessels.

## 2. System Objective
OceanWatch AI operates as a **Post-event forensic attribution system**.
Unlike live surveillance or generalized maritime monitoring dashboards, this system activates *after* an incident is logged or satellite imagery indicates a slick. It answers critical forensic questions:
- Where exactly is the slick located?
- When was the spill initiated based on backward drift?
- Which vessels are highly correlated as the candidate sources of the spill?

## 3. Data Source Tiers
The system utilizes two primary tiers of data sources:

1. **Open Data (Built)**
   - Sentinel-1 SAR (Copernicus Data Space Ecosystem)
   - CMEMS Ocean Currents
   - ERA5 Reanalysis Wind Data
   - Spire / AISHub (Sampled Demo AIS)

2. **Sovereign/Indian Adapter Tier (Designed)**
   - Designed to interface with Indian maritime intelligence systems for secure and sovereign analysis.

## 4. Processing Pipeline
The core processing pipeline functions via the following stages:

```text
  [SAR Imagery] --> [U-Net Detection] --> [GLCM Validation] 
                                                  |
                                                  v
[Attribution Engine] <-- [AIS Layer] <-- [Drift Modeling] <-- [Wind Gate]
```

1. **SAR Ingestion:** Pulls Sentinel-1 imagery covering the incident area.
2. **U-Net:** Deep learning identifies potential oil patches.
3. **GLCM:** Validates patches morphologically and texturally.
4. **Wind Gate:** Correlates slick spread with wind conditions.
5. **Drift:** Performs Lagrangian backward advection.
6. **AIS:** Overlays vessel tracks against the drift envelope.
7. **Attribution:** Scores candidate vessels based on 7 factors.

## 5. AI/ML Layer
The artificial intelligence layer relies on two primary methodologies:
- **Attention U-Net:** A highly modified architecture adapted for marine SAR imagery, featuring attention gates to focus on the edge morphology of slicks, drastically reducing false positives caused by natural biogenic slicks or low-wind areas.
- **Isolation Forest:** Anomaly detection applied to AIS trajectories to identify spoofing, sudden course changes, or dark vessel behavior.

## 6. Physical Drift Layer
The physical drift module utilizes **Lagrangian backward advection**.
Using CMEMS and ERA5 data, it takes the spatial polygon of the identified slick and pushes hypothetical particles backward in time over a specified window (e.g., 12, 24, or 48 hours). This calculates the spatial "origin envelope" where the slick was most likely initiated.

## 7. AIS Layer
The AIS layer handles:
- **Trajectory reconstruction:** Interpolating discrete AIS pings into continuous vessel paths.
- **Gap detection:** Highlighting vessels that turned off transponders (dark vessels) near the spill origin window.

## 8. Attribution Layer
The 7-factor scoring engine dynamically evaluates vessels against:
1. Spatial intersection with the drift envelope
2. Temporal alignment with the spill initiation window
3. Vessel heading vs drift vector
4. AIS transmission gaps
5. Vessel type (tankers carry higher baseline risk)
6. Trajectory anomalies (loitering, sudden stops)
7. Dark vessel probability

## 9. Environmental Impact Layer
*Designed:* Provides geometric estimates of potential coastal impact, assessing vulnerable marine ecosystems based on forward trajectory projections. (Currently a designed interface).

## 10. Alerts Layer
*Designed:* Internal analyst queue system. Designed institutional integrations would allow dispatching these alerts to relevant coast guard or environmental agencies.

## 11. Case History Layer
*Designed:* Maintains prior attribution records and historic forensic case logs for longitudinal analysis of frequent offenders.

## 12. Dashboard
A React/MapLibre forensic GIS web interface providing interactive tools for analysts to visualize the evidence layers, toggle drift simulations, and examine AI attribution scores.

## 13. Future Institutional Integrations
The architecture is structured to support seamless integration with Indian institutional maritime frameworks:
- **IMAC:** Information Management and Analysis Centre
- **SAMUDRA:** System for Advance Manufacturing Assessment and Rating
- **SACHET:** Early warning systems
- **NCSCM:** National Centre for Sustainable Coastal Management

## 14. Built vs Designed Convention
Throughout this system, we differentiate between features that are fully *built* (executable code, implemented models) and those that are *designed* (mocked interfaces, proposed architectural extensions).
- **Built:** U-Net detection, Drift modeling, Attribution engine, Dashboard visualization.
- **Designed:** Real-time IMAC alerts, Live sovereign AIS feeds, automated environmental damage cost estimation.

## 15. Limitations and Honest Disclaimers
1. **Evidence vs Proof:** Attribution scores are relative evidence rankings, not legal determinations.
2. **Synthetic Validation:** Current demo pipelines use synthetic/sampled validation data to prove out the system's logic safely.
3. **Environmental Approximations:** Wind and current fields are procedurally generated synthetic approximations for the demo.
4. **Hardware Constraints:** Running the full model requires substantial compute (32GB+ RAM, GPU) for SAR processing.
