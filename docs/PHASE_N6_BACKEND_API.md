# Phase N-6 & N-6.1: OceanWatch AI Backend API

## Overview
This document outlines the API contract for serving the OceanWatch AI end-to-end demonstration (Ennore Case). The endpoint synthesizes all pipeline artifacts (SAR processing, Lagrangian drift, and 7-factor attribution scoring) into a single, unified JSON payload for the frontend UI. It relies completely on the generated mathematical outputs without hard-coding simulated numeric properties.

## Execution
To start the backend server:
```bash
source venv/bin/activate
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

## API Endpoint
**GET `/api/demo/ennore`**

### Description
Returns the fully validated Ennore Demonstration attribution results.

### Response Schema
The response is structured into distinct logical blocks conforming to the user-facing UI requirements:

- `case`: General incident context and demonstration disclaimers.
- `sar`: SAR image metadata, polarization configuration (`[VH, VV, 0]`), and source links.
- `slick`: Segmentation results, polygon geometry attributes, and physical validation chains (GLCM, Morphology).
- `environment`: Simulated ERA5 wind and CMEMS current vectors.
- `drift`: Origin coordinates, generated ensemble particle metadata, and heatmap asset URL.
- `vessels`: Vessel kinematics (Position, Heading, Speed) and AIS status. Contains mapped human-readable vessel categorizations (e.g., Tanker, Cargo).
- `attribution`: 
  - `note`: A disclaimer defining the "evidence_strength" terminology.
  - `results`: The 7-factor (`spatial`, `temporal`, `heading`, `gap`, `type`, `anomaly`, `dark`) ranking arrays, computing normalized `attribution_score` and exposing `evidence_strength` (HIGH / MEDIUM / LOW).
- `evidence`: Line-item provenance tracking separating real historical inference from synthetic data construction.

### Asset Serving
Static assets (like the SAR imagery, Drift heatmap, or attribution CSVs) are served automatically by FastAPI `StaticFiles` mounted at:
- `/api/assets/data/...`
- `/api/assets/artifacts/...`

Example: 
- `/api/assets/data/demo/ennore/sar/ennore_sar.tif`
- `/api/assets/artifacts/demo/ennore/drift_heatmap.png`

### Provenance Model
The API enforces strict data classification to prevent misinterpretation of synthetic demo data as forensic evidence. Major JSON objects include:
- `status`: Identifies generation method (e.g., `synthetic_demo`, `model_derived`).
- `source`: Brief text describing how the data was generated (e.g., `OceanWatch Physical Validation Pipeline`).

## Demo Disclaimer
The JSON response strictly embeds the following disclaimer under `case.disclaimer`:
> "DEMONSTRATION MODE — Historical AIS trajectories required for this case were not available to the project. AIS trajectories shown in this demonstration are synthetically reconstructed for pipeline validation and must not be interpreted as historical forensic evidence."

## Example Response (Truncated)
```json
{
  "case": {
    "case_id": "ENNORE-2017-DEMO",
    "case_name": "Ennore Port Collision",
    "location": "Kamarajar Port, Chennai, India",
    "status": "synthetic_demo"
  },
  "slick": {
    "detected": true,
    "validation_status": "PASS",
    "validation_details": "Passed minimum area, elongation aspect, GLCM contrast, and ERA5 wind gate checks."
  },
  "drift": {
    "heatmap_asset": "/api/assets/artifacts/demo/ennore/drift_heatmap.png"
  },
  "attribution": {
    "note": "This is a demo evidence-strength label derived from the candidate ranking. It is not a calibrated probability of responsibility.",
    "results": [
      {
        "id": "DEMO-MMSI-001",
        "rank": 1,
        "attribution_score": 0.421,
        "factor_breakdown": {
          "spatial": 0.93,
          "temporal": 0.88,
          "heading": 1.0,
          "gap": 1.0
        },
        "evidence_strength": "HIGH"
      }
    ]
  }
}
```
