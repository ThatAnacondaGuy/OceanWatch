# OceanWatch AI — MASTER IMPLEMENTATION SPECIFICATION
Version: 1.0
Status: AUTHORITATIVE IMPLEMENTATION GUIDE

## 0. PURPOSE

You are implementing OceanWatch AI, a forensic oil-spill detection and vessel-attribution platform.

The supplied files are the project's source of truth:
1. docs/PROJECT_REPORT.md = technical project report and canonical project description.
2. references/ui/ = approved visual references for the frontend.
3. docs/MASTER_SPEC.md = implementation rules in this file.
4. docs/UI_SPEC.md = detailed UI behavior and visual rules.
5. docs/ML_SPEC.md = model/training requirements.
6. docs/PIPELINE_SPEC.md = end-to-end processing contract.
7. docs/DATA_SPEC.md = data and environment contract.
8. docs/DEMO_SPEC.md = reproducible demo requirements.
9. docs/ACCEPTANCE_CRITERIA.md = definition of done.

## 1. CORE PRODUCT DEFINITION

OceanWatch AI is a fully automated forensic post-event attribution pipeline.

Input:
- Sentinel-1 SAR scene

Core output:
- oil-spill detection and characterization
- origin probability heat map
- forward drift forecast
- detected radar ships
- AIS-reconstructed vessel tracks
- dark-vessel flags
- vessel behavioral anomaly scores
- transparent 7-factor vessel attribution scores
- ranked suspect list
- evidence/report package

IMPORTANT:
This is not to be represented as continuous real-time Sentinel-1 surveillance. The supplied report states that Sentinel-1 revisit timing makes the primary system forensic/post-event. Keep this distinction in product copy and documentation.

## 2. IMPLEMENTATION PRINCIPLES

- Implement actual algorithms where specified.
- Do not replace a specified algorithm with fake random outputs.
- Do not hard-code realistic-looking AI confidence scores in the production inference path.
- Use demo adapters only where the real external data source is unavailable.
- Keep demo mode and production mode clearly separated.
- Log model versions, dataset versions, configuration and pipeline run IDs.
- Every major processing stage must produce inspectable outputs.
- Prefer deterministic/reproducible runs when seeds can be controlled.
- Fail clearly when required data is missing.
- Preserve modular boundaries so components can be upgraded independently.
- Do not silently change the mathematical formulas in PROJECT_REPORT.md.
- Do not claim a model is "trained" unless training actually completed.
- Do not claim a source is "government/live" when the implementation is using demo data.

## 3. SYSTEM COMPONENTS

### Module A — Find the oil + find the ships
A1 SAR preprocessing
A2 Wind gate
A3 Attention U-Net oil segmentation with ResNet-34 encoder
A4 GLCM texture validation
A5 Slick geometry characterization
A6 CFAR -> RoI -> YOLOv8 ship detection

### Module B — Drift hindcast and forecast
B1 weathering/age estimation
B2 current + wind drift
B3 backward hindcast with reverse advection + expanding uncertainty
B4 Monte Carlo ensemble
B5 forward 24-72 hour forecast

### Module C — Vessel attribution
C1 AIS traffic reconstruction
C2 radar <-> AIS matching and dark-vessel detection
C3 Isolation Forest behavior anomaly scoring
C4 7-factor suspect scoring
C5 normalized vessel probabilities
C6 validation experiment

### Module D — Visualization and reporting
D1 GIS map
D2 suspect ranking
D3 timeline
D4 evidence PDF
D5 alert system

## 4. TARGET ARCHITECTURE

Frontend:
- React
- Mapbox GL JS
- deck.gl
- responsive desktop-first government dashboard

Backend:
- FastAPI
- Celery
- Redis
- PostgreSQL + PostGIS
- MinIO/S3
- Nginx
- Docker

ML/data:
- PyTorch
- segmentation-models-pytorch
- Ultralytics YOLOv8
- NumPy/SciPy
- scikit-image
- Shapely/OpenCV
- OpenDrift/OpenOil
- xarray/netCDF4
- pandas/geopandas/movingpandas
- scikit-learn

## 5. REQUIRED FRONTEND PAGES

1. Dashboard
2. Live Monitoring
3. Spill Incidents
4. Incident Investigation detail
5. Vessel Tracking / Vessel Intelligence
6. Satellite Data
7. Analytics & Reports
8. Environmental Impact
9. Alerts & Notifications
10. Data Management
11. Users & Access

All pages must look like one application and must inherit the locked design language in references/ui/01_dashboard_LOCKED.png.

## 6. EXECUTION BEHAVIOR FOR THE AGENT

Before writing major code:
A. Read all docs.
B. Inspect all supplied UI images.
C. Inspect the repository.
D. Produce an implementation plan.
E. Identify missing datasets/credentials/tooling.
F. Build a minimal vertical slice first.
G. Run tests.
H. Expand module-by-module.
I. Re-run tests after integration.
J. Use browser verification for the frontend.

Do NOT spend the whole first phase making mock UI screens without wiring real API contracts.

## 7. VERTICAL SLICE REQUIREMENT

Create a small end-to-end path before scaling:
- upload or select one demo SAR scene
- preprocess
- run oil detector
- validate
- generate slick geometry
- run ship detection
- run drift
- read demo AIS
- score vessels
- store result
- show result on dashboard
- export a report

The vertical slice may use a small demo scene, but the code path must be the same architecture used for the full pipeline.

## 8. ERROR HANDLING

Every pipeline job must have:
- job ID
- status: queued/running/succeeded/failed
- started_at
- completed_at
- stage
- progress
- error message
- artifact references

The UI must show failures clearly and never silently display fabricated success.

## 9. DATA CONTRACT

Use local caching for ERA5 and CMEMS during inference, per the project report. Do not add unnecessary live API dependency to the inference path.

Use MarineCadastre for the documented demo AIS path.
Provide clean adapters/interfaces for eventual Indian production AIS sources.

## 10. SECURITY / SECRET HANDLING

- Never commit API keys or secret values.
- Create .env.example.
- Use environment variables.
- Keep map provider keys outside source control.
- Sanitize uploaded file paths.
- Validate upload types and sizes.

## 11. QUALITY

The system must be:
- runnable
- testable
- inspectable
- reproducible
- modular
- visually consistent
- honest about uncertainty
- honest about data provenance
