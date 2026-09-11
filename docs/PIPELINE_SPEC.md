# OceanWatch AI — END-TO-END PIPELINE SPECIFICATION

## 1. JOB LIFECYCLE

POST /jobs or equivalent:
- create job
- validate input
- store source reference
- queue Celery task
- return job_id

Worker stages:
1 PREPROCESSING
2 WIND_GATE
3 OIL_DETECTION
4 GLCM_VALIDATION
5 GEOMETRY
6 SHIP_DETECTION
7 DRIFT_HINDCAST
8 AIS_RECONSTRUCTION
9 RADAR_AIS_MATCH
10 BEHAVIOR_ANOMALY
11 ATTRIBUTION
12 FORECAST
13 PERSIST_RESULTS
14 REPORT_GENERATION

UI should show stage progress.

## 2. BRANCHING

If wind gate fails:
- record rejection
- mark job as "rejected/look-alike risk"
- preserve evidence
- do not continue normal confirmation path

If oil detection confidence < threshold:
- mark no confirmed spill
- preserve low-confidence output

If GLCM/validation fails:
- mark possible look-alike / low confidence
- preserve evidence and reason

If ship detection returns zero:
- continue drift and AIS analysis if origin/time are available
- clearly indicate no radar ships detected

If AIS data unavailable:
- do not fabricate vessel matches
- show "AIS unavailable"
- continue only modules that can run

## 3. DATA PRODUCTS

Every completed job should create artifacts:
- preprocessed SAR
- oil mask
- slick polygon/GeoJSON
- geometry metrics
- ship detections
- drift particles/trajectories
- origin heatmap
- forward forecast
- AIS track dataset
- vessel scores
- evidence report

## 4. DATABASE ENTITIES

At minimum:
- jobs
- scenes
- incidents
- slicks
- slick_metrics
- vessels
- vessel_positions
- vessel_tracks
- drift_runs
- origin_heatmaps
- suspect_scores
- alerts
- reports
- model_runs
- datasets

Use PostGIS for spatial entities.

## 5. STORAGE

MinIO/S3:
- source rasters
- derived rasters
- report files
- large trajectory artifacts

PostgreSQL/PostGIS:
- metadata
- vector geometry
- scores
- status
- relationships

## 6. API CONTRACT AREAS

Minimum:
- health
- jobs
- scenes
- incidents
- incident detail
- vessels
- vessel detail
- analytics
- alerts
- reports
- layers / map data

## 7. FRONTEND DATA RULE

All production pages must consume backend/API data.

Demo pages may load seeded demo records via the same API interfaces.
Do not create a separate fake frontend-only dataset as the primary implementation.

## 8. REPROCESSING

Allow an investigator to re-run a pipeline with:
- updated parameters
- different environmental date/time bounds
- different Monte Carlo count where permitted

Create a new run ID instead of overwriting historical evidence.

## 9. AUDITABILITY

Store:
- who/what triggered the job
- timestamp
- input scene ID
- model versions
- config values
- data-source identifiers
- outputs
- errors

## 10. REPORT

Generate a PDF with:
- scene metadata
- detection overlay
- geometry
- wind
- origin heatmap
- top 3 suspects
- factor breakdown
- AIS track evidence
- dark-vessel evidence
- uncertainty/disclaimer section
