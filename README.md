# OceanWatch AI

**Subtitle:** Forensic Oil Spill Detection & Vessel Attribution Pipeline

OceanWatch AI is a post-event forensic attribution system designed to identify potential oil slicks from satellite imagery, model their drift, and mathematically rank vessels based on their likelihood of being the source. Rather than acting as a real-time surveillance system, it operates as a forensic tool to answer three core questions: 
1. Where is the possible oil slick?
2. How did it move?
3. Which vessels were plausibly associated with it?

**Disclaimer:** Attribution in this system is an evidence-based probability ranking, **NOT** a legal determination of guilt.

---

## 1. What This Project Does

The system executes an automated pipeline that:
- **Detects** slicks in Sentinel-1 Synthetic Aperture Radar (SAR) imagery using an Attention U-Net.
- **Validates** detections physically using Gray-Level Co-occurrence Matrices (GLCM) and ERA5 wind gating to filter out "look-alikes".
- **Models Drift** via Lagrangian backward advection using CMEMS ocean currents and ERA5 wind vectors.
- **Reconstructs** historical AIS vessel trajectories.
- **Detects Anomalies** using Isolation Forests to flag AIS spoofing or "dark" (non-broadcasting) vessels.
- **Scores & Ranks** candidates using a 7-factor attribution engine.
- **Visualizes** the entire forensic scene in an interactive GIS dashboard.

---

## NTRO Problem Statement Context
- This project addresses NTRO Smart India Hackathon Problem Statement 26143.
- It operates as a post-event forensic attribution system.
- Attribution scores are relative evidence rankings, not legal determinations.
- Synthetic demo data is used for pipeline validation safely.

---

## Built vs Designed Convention
To clearly communicate the system's current state versus its intended final capabilities, we utilize a "Built vs Designed" badge convention in the UI and documentation. 
- **Built** refers to functional code and executing ML pipelines.
- **Designed** refers to mockups and architectural endpoints intended for future sovereign integration.

---

## 2. System Architecture

```text
       User / Investigator
               │
    Frontend (React / MapLibre)
               │
      Backend API (FastAPI)
               │
 ┌─────────────┴──────────────────────────────────────┐
 │ Pipeline (Python Scripts)                          │
 │ - Detection (Attention U-Net / PyTorch)            │
 │ - Validation (Scikit-Image / GLCM)                 │
 │ - Drift (Lagrangian Model)                         │
 │ - AIS Reconstruction (Pandas / GeoPandas)          │
 │ - Attribution (Isolation Forest / Scoring Engine)  │
 └─────────────┬──────────────────────────────────────┘
               │
 Models + Datasets (Sentinel-1, CMEMS, ERA5, AIS)
```

---

## 3. End-to-End Pipeline

1. **Sentinel-1 SAR:** Downloaded via CDSE and preprocessed (subset, calibrate, terrain correct).
2. **Attention U-Net:** Deep learning model infers a raw probability mask for oil presence.
3. **Physical Validation:** Discards polygons failing minimum area, elongation aspect, contrast, or wind speed checks.
4. **Drift Model:** Simulates the slick's origin window by pushing particles backward in time.
5. **AIS Matching:** Extracts vessels crossing the drift origin envelope within the time window.
6. **Anomaly Analysis:** Flags dark vessels or abnormal trajectories.
7. **Attribution Scoring:** Ranks candidates dynamically based on spatial overlap, temporal alignment, heading, and anomalies.
8. **GIS Dashboard:** Serves the incident data natively to an interactive, dark-mode web mapping interface.

---

## 4. Technology Stack

| Component | Technology | Purpose |
|---|---|---|
| **Frontend** | React, Tailwind, MapLibre GL | Interactive dashboard, GIS visualization |
| **Backend** | FastAPI, Uvicorn | Serves JSON artifacts and case state |
| **Pipeline Core** | Python, Pandas, Numpy | Data processing and orchestration |
| **Deep Learning** | PyTorch, segmentation-models-pytorch | Oil spill mask inference |
| **GIS & Imagery** | GDAL, Rasterio, Scikit-Image | Raster processing and spatial validations |

---

## 5. Repository Structure

```text
.
├── artifacts/          # Pre-computed GeoJSON, PNG, JSON assets for the Ennore demo
├── backend/            # FastAPI backend application
├── data/               # Raw and cached datasets (Ignored by git)
├── docs/               # Project documentation, QA reports, and audit logs
├── frontend/           # React / Vite SPA application
├── ml/                 # Machine learning notebooks and experiments
├── models/             # PyTorch model checkpoints (.pt files)
├── scripts/            # End-to-end data pipelines, downloads, and inference scripts
├── tests/              # Unit and integration tests
├── .env.example        # Environment variable template
└── README.md           # This file
```

---

## 6. System Requirements

### Basic Demo Requirements (UI Only)
Because the pipeline outputs for the "Ennore Demo Case" are permanently baked into the `artifacts/` folder, **you do not need large datasets or models to run the frontend.**
- **OS:** macOS / Linux / Windows (WSL recommended)
- **Node.js:** v18+
- **Python:** v3.9+

### Full Pipeline Requirements (Data Ingestion & Processing)
If executing the data acquisition and inference scripts in `scripts/`:
- **Dependencies:** GDAL, PROJ, GEOS, ESA SNAP (command line tools)
- **RAM:** 32GB+ (for SAR processing)
- **Storage:** 500GB+ (for Sentinel-1 GRD scenes)
- **Accounts:** Copernicus Data Space Ecosystem (CDSE), CMEMS Copernicus Marine

---

## 7. Fresh Clone Setup

This project is configured to run instantly out-of-the-box for demonstration purposes.

### Step 1 — Clone the Repository
```bash
git clone https://github.com/ThatAnacondaGuy/OceanWatch.git
cd OceanWatch
```

### Step 2 — Start the Backend (Terminal 1)
```bash
python -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# IMPORTANT: Run uvicorn from the ROOT directory so it can mount the artifacts/ folder!
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```

### Step 3 — Start the Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```

The OceanWatch AI Dashboard is now accessible at [http://localhost:3000](http://localhost:3000).

---

## 8. Security & Environment Configuration

If you intend to run the full processing pipeline, you must supply credentials for external data sources.

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Fill in the required credentials (e.g., `CDSE_USERNAME`, `CDSE_PASSWORD`).

**SECURITY WARNING:**
Never hardcode API keys or credentials directly into `scripts/` or `backend/` files. The `.env` file is excluded in `.gitignore` by default. If you discover accidentally committed credentials in Git history, rotate them immediately via the upstream provider.
