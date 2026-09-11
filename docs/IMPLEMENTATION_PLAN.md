# OceanWatch AI — Implementation Plan

Forensic Oil Spill Detection & Vessel Attribution Pipeline  
**NTRO Problem Statement 26143 | Smart India Hackathon 2026**

---

## Environment Assessment

| Capability | Status | Notes |
|---|---|---|
| **Python** | ✅ 3.14.6 | Ready |
| **Node.js** | ✅ v26.4.0 (npm 11.17) | Ready |
| **CPU** | ✅ Apple M5, 10 cores, 24 GB RAM | ARM64 — will use MPS for PyTorch acceleration |
| **GPU/CUDA** | ❌ No NVIDIA GPU | MPS (Metal) via PyTorch on Apple Silicon |
| **Docker** | ❌ Not installed | Will use local services or install via Homebrew |
| **PostgreSQL** | ❌ Not installed | Install via Homebrew with PostGIS |
| **Redis** | ❌ Not installed | Install via Homebrew |
| **PyTorch** | ❌ Not installed | Install in venv |
| **Disk Space** | ✅ 768 GB free | More than sufficient |
| **Homebrew** | ✅ 6.0.21 | Package manager available |
| **Git** | ✅ 2.55.0 | Ready |
| **Datasets** | ❌ Not present | Must download (Zenodo SAR oil, xView3, MarineCadastre, ERA5 cache, CMEMS cache) |
| **Credentials** | ❌ No .env file | Must create from .env.example, MAPBOX_TOKEN needed |
| **MinIO** | ❌ Not installed | Install via Homebrew or use filesystem adapter for demo |

> [!IMPORTANT]
> **Docker is unavailable.** We will run all services locally via Homebrew (PostgreSQL+PostGIS, Redis, MinIO) and provide a startup script as a Docker-free alternative. A `docker-compose.yml` will also be created for environments where Docker is available.

> [!IMPORTANT]
> **No training datasets are present.** Phase B will include download scripts for all public datasets. Models cannot be trained until datasets are acquired.

> [!IMPORTANT]
> **MAPBOX_TOKEN is not set.** The frontend map will fall back to OpenStreetMap tiles via MapLibre GL JS if no Mapbox token is provided, with a configuration switch for Mapbox when the token is available.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         OceanWatch AI System                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────┐    ┌──────────────┐    ┌───────┐    ┌────────────────┐   │
│  │  React   │───▶│   FastAPI    │───▶│ Redis │───▶│ Celery Workers │   │
│  │ Frontend │◀───│   Backend    │    │       │    │  (Pipeline)    │   │
│  └──────────┘    └──────┬───────┘    └───────┘    └───────┬────────┘   │
│       │                 │                                  │            │
│       │          ┌──────┴───────┐              ┌──────────┴─────────┐  │
│       │          │  PostgreSQL  │              │   ML Models        │  │
│       │          │  + PostGIS   │              │   - Attention UNet │  │
│       │          └──────────────┘              │   - YOLOv8         │  │
│       │                                        │   - Isolation For. │  │
│       │          ┌──────────────┐              └────────────────────┘  │
│       └─────────▶│    MinIO     │                                      │
│                  │ (Object Store)│                                      │
│                  └──────────────┘                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18, Vite, TypeScript, TailwindCSS | SPA Dashboard |
| **Maps** | Mapbox GL JS / MapLibre GL JS, deck.gl | GIS visualization |
| **Charts** | Recharts | Analytics visualizations |
| **Backend** | FastAPI, Uvicorn, Python 3.14 | REST API |
| **Task Queue** | Celery + Redis | Async pipeline jobs |
| **Database** | PostgreSQL 16 + PostGIS 3.4 | Metadata, vectors, geometries |
| **Object Storage** | MinIO | Rasters, GeoTIFFs, PDFs, NetCDFs |
| **ML: Oil Segmentation** | PyTorch, segmentation-models-pytorch | Attention U-Net (ResNet-34) |
| **ML: Ship Detection** | Ultralytics YOLOv8 | SAR ship classification |
| **ML: Anomaly** | scikit-learn | Isolation Forest |
| **SAR Processing** | rasterio, pyproj, GDAL bindings | Geospatial raster I/O |
| **Drift** | OpenDrift/OpenOil (or custom Lagrangian) | Backward hindcast + forward forecast |
| **Geometry** | Shapely, OpenCV, scikit-image | Slick geometry, GLCM |
| **AIS** | pandas, geopandas, movingpandas | Trajectory reconstruction |
| **Reports** | ReportLab / WeasyPrint | Evidence PDF generation |
| **Testing** | pytest, pytest-asyncio, Playwright | Unit/integration/E2E |

---

## Directory Structure

```
OceanWatch-AI-Agent-Package/
├── docs/                          # Specifications (existing)
├── references/                    # UI + architecture references (existing)
├── data/                          # Datasets (gitignored large files)
│   ├── raw/                       # Downloaded raw datasets
│   ├── processed/                 # Preprocessed training data
│   ├── cached/                    # ERA5, CMEMS cached forcing
│   │   ├── era5/
│   │   └── cmems/
│   ├── demo/                      # Demo scenario seed data
│   │   ├── ais/                   # MarineCadastre AIS CSV
│   │   ├── scenes/                # Demo SAR scene (synthetic/public)
│   │   └── forcing/               # Pre-cached wind + current
│   └── manifests/                 # Dataset provenance records
├── backend/
│   ├── alembic/                   # Database migrations
│   │   ├── versions/
│   │   └── env.py
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                # FastAPI app entry
│   │   ├── config.py              # Settings / env loader
│   │   ├── database.py            # SQLAlchemy + PostGIS engine
│   │   ├── models/                # SQLAlchemy ORM models
│   │   │   ├── __init__.py
│   │   │   ├── job.py
│   │   │   ├── scene.py
│   │   │   ├── incident.py
│   │   │   ├── slick.py
│   │   │   ├── vessel.py
│   │   │   ├── drift.py
│   │   │   ├── alert.py
│   │   │   ├── report.py
│   │   │   ├── model_run.py
│   │   │   └── dataset.py
│   │   ├── schemas/               # Pydantic request/response schemas
│   │   │   ├── __init__.py
│   │   │   ├── job.py
│   │   │   ├── incident.py
│   │   │   ├── vessel.py
│   │   │   ├── analytics.py
│   │   │   └── common.py
│   │   ├── api/                   # API route modules
│   │   │   ├── __init__.py
│   │   │   ├── health.py
│   │   │   ├── jobs.py
│   │   │   ├── scenes.py
│   │   │   ├── incidents.py
│   │   │   ├── vessels.py
│   │   │   ├── analytics.py
│   │   │   ├── alerts.py
│   │   │   ├── reports.py
│   │   │   └── layers.py
│   │   ├── services/              # Business logic
│   │   │   ├── __init__.py
│   │   │   ├── storage.py         # MinIO/S3 adapter
│   │   │   └── report_generator.py
│   │   └── worker/                # Celery tasks
│   │       ├── __init__.py
│   │       ├── celery_app.py
│   │       ├── tasks.py           # Master pipeline orchestrator
│   │       └── stages/            # Individual pipeline stages
│   │           ├── __init__.py
│   │           ├── preprocessing.py
│   │           ├── wind_gate.py
│   │           ├── oil_detection.py
│   │           ├── glcm_validation.py
│   │           ├── geometry.py
│   │           ├── ship_detection.py
│   │           ├── drift_hindcast.py
│   │           ├── ais_reconstruction.py
│   │           ├── radar_ais_match.py
│   │           ├── behavior_anomaly.py
│   │           ├── attribution.py
│   │           ├── forecast.py
│   │           ├── persist_results.py
│   │           └── report_generation.py
│   ├── requirements.txt
│   ├── alembic.ini
│   └── pyproject.toml
├── ml/
│   ├── oil_segmentation/
│   │   ├── dataset.py             # Dataset loader + augmentations
│   │   ├── model.py               # Attention U-Net (smp)
│   │   ├── train.py               # Training loop with checkpointing
│   │   ├── validate.py            # Validation + metrics
│   │   ├── inference.py           # Single-scene inference
│   │   └── config.py              # Hyperparameters
│   ├── ship_detection/
│   │   ├── cfar.py                # CFAR candidate detector
│   │   ├── prepare_data.py        # xView3 data preparation
│   │   ├── train.py               # YOLOv8 training
│   │   ├── inference.py           # CFAR → YOLOv8 pipeline
│   │   └── config.py
│   ├── anomaly/
│   │   ├── isolation_forest.py    # Feature extraction + training
│   │   └── inference.py
│   ├── drift/
│   │   ├── lagrangian.py          # Custom Lagrangian particle tracker
│   │   ├── hindcast.py            # Backward drift with MC ensemble
│   │   ├── forecast.py            # Forward 24-72h forecast
│   │   └── config.py
│   ├── attribution/
│   │   ├── seven_factor.py        # 7-factor scoring formula
│   │   ├── ais_gap_calibration.py # Z-score gap calibration
│   │   ├── radar_ais_match.py     # Cross-matching + dark vessel
│   │   └── synthetic_validation.py
│   └── common/
│       ├── glcm.py                # GLCM texture features
│       ├── geometry.py            # Slick geometry metrics
│       └── wind_gate.py           # Wind gate logic
├── models/                        # Saved model checkpoints
│   ├── oil_segmentation/
│   └── ship_detection/
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── index.html
│   ├── public/
│   │   └── assets/                # Logo, icons
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── api/                   # API client + hooks
│       │   ├── client.ts
│       │   └── hooks.ts
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Sidebar.tsx
│       │   │   ├── Header.tsx
│       │   │   └── Layout.tsx
│       │   ├── map/
│       │   │   ├── MapView.tsx
│       │   │   ├── layers/
│       │   │   └── controls/
│       │   ├── charts/
│       │   ├── common/
│       │   │   ├── KPICard.tsx
│       │   │   ├── StatusBadge.tsx
│       │   │   ├── DataTable.tsx
│       │   │   └── LoadingState.tsx
│       │   └── investigation/
│       │       ├── SevenFactorChart.tsx
│       │       ├── SuspectPanel.tsx
│       │       └── DriftPlayer.tsx
│       ├── pages/
│       │   ├── Dashboard.tsx
│       │   ├── LiveMonitoring.tsx
│       │   ├── SpillIncidents.tsx
│       │   ├── IncidentInvestigation.tsx
│       │   ├── VesselTracking.tsx
│       │   ├── SatelliteData.tsx
│       │   ├── AnalyticsReports.tsx
│       │   ├── EnvironmentalImpact.tsx
│       │   ├── AlertsNotifications.tsx
│       │   ├── DataManagement.tsx
│       │   └── UsersAccess.tsx
│       ├── styles/
│       │   └── globals.css
│       └── types/
│           └── index.ts
├── scripts/
│   ├── setup_env.sh               # Full environment setup
│   ├── download_datasets.sh       # Dataset download automation
│   ├── seed_demo_data.py          # Demo data seeder
│   ├── start_services.sh          # Start PostgreSQL, Redis, MinIO
│   └── run_demo.sh                # End-to-end demo execution
├── tests/
│   ├── unit/
│   │   ├── test_wind_gate.py
│   │   ├── test_glcm.py
│   │   ├── test_geometry.py
│   │   ├── test_cfar.py
│   │   ├── test_seven_factor.py
│   │   ├── test_drift.py
│   │   └── test_ais_gap.py
│   ├── integration/
│   │   ├── test_api.py
│   │   ├── test_pipeline.py
│   │   └── test_storage.py
│   └── e2e/
│       └── test_demo_flow.py
├── docker-compose.yml             # For Docker environments
├── .env.example                   # (existing)
├── .gitignore
├── README.md
└── Makefile                       # Common commands
```

---

## Database Schema Plan

15 PostgreSQL + PostGIS tables as specified in PIPELINE_SPEC.md:

### Core Tables

```sql
-- 1. jobs
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scene_id UUID REFERENCES scenes(id),
    status VARCHAR(20) NOT NULL DEFAULT 'queued',  -- queued/running/succeeded/failed
    stage VARCHAR(30),  -- current pipeline stage name
    progress FLOAT DEFAULT 0.0,
    error_message TEXT,
    config JSONB,  -- pipeline configuration snapshot
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. scenes
CREATE TABLE scenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scene_id_external VARCHAR(100) UNIQUE NOT NULL,  -- e.g. S1A_IW_GRDH_...
    satellite VARCHAR(20) NOT NULL,  -- S1A, S1B, S2A, S2B
    product_type VARCHAR(20),  -- IW_GRDH, MSI
    acquisition_time TIMESTAMPTZ NOT NULL,
    polarization VARCHAR(10),  -- VV+VH
    resolution_m FLOAT,
    orbit_number INTEGER,
    orbit_direction VARCHAR(15),  -- Ascending/Descending
    footprint GEOMETRY(Polygon, 4326),
    file_path TEXT,
    file_size_bytes BIGINT,
    processing_status VARCHAR(20) DEFAULT 'raw',  -- raw/preprocessed/analyzed/rejected
    wind_gate_passed BOOLEAN,
    wind_speed_ms FLOAT,
    source VARCHAR(30) DEFAULT 'demo',  -- demo/production
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. incidents
CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id_display VARCHAR(20) UNIQUE NOT NULL,  -- OS-2025-091
    job_id UUID REFERENCES jobs(id),
    scene_id UUID REFERENCES scenes(id),
    status VARCHAR(20) DEFAULT 'active',  -- active/investigating/monitoring/resolved
    severity VARCHAR(10),  -- high/medium/low
    detected_at TIMESTAMPTZ NOT NULL,
    location GEOMETRY(Point, 4326),
    region VARCHAR(100),
    estimated_area_km2 FLOAT,
    combined_confidence FLOAT,
    ai_detection_score FLOAT,
    glcm_texture_score FLOAT,
    wind_validity_score FLOAT,
    estimated_age_hours FLOAT,
    top_suspect_vessel_id UUID,
    top_suspect_probability FLOAT,
    source VARCHAR(30) DEFAULT 'demo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. slicks
CREATE TABLE slicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID REFERENCES incidents(id),
    geometry GEOMETRY(Polygon, 4326) NOT NULL,
    mask_path TEXT,  -- MinIO path to oil mask raster
    confidence FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. slick_metrics
CREATE TABLE slick_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slick_id UUID REFERENCES slicks(id) UNIQUE,
    area_km2 FLOAT,
    perimeter_km FLOAT,
    elongation_ratio FLOAT,  -- L/W
    fragment_count INTEGER,
    orientation_angle_deg FLOAT,
    glcm_homogeneity FLOAT,
    glcm_contrast FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. vessels
CREATE TABLE vessels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mmsi VARCHAR(15),
    imo VARCHAR(15),
    name VARCHAR(100),
    call_sign VARCHAR(20),
    flag VARCHAR(50),
    vessel_type VARCHAR(50),  -- crude_tanker/chemical_tanker/container/cargo/other
    vessel_type_prior FLOAT,  -- P_type: 1.0, 0.9, 0.7, 0.5, 0.3
    length_m FLOAT,
    width_m FLOAT,
    dwt FLOAT,
    owner VARCHAR(200),
    source VARCHAR(30) DEFAULT 'demo',  -- demo/production
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. vessel_positions
CREATE TABLE vessel_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vessel_id UUID REFERENCES vessels(id),
    timestamp TIMESTAMPTZ NOT NULL,
    position GEOMETRY(Point, 4326) NOT NULL,
    sog_knots FLOAT,  -- Speed Over Ground
    cog_degrees FLOAT,  -- Course Over Ground
    heading_degrees FLOAT,
    nav_status VARCHAR(30),
    source VARCHAR(30) DEFAULT 'demo'
);

-- 8. vessel_tracks
CREATE TABLE vessel_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vessel_id UUID REFERENCES vessels(id),
    incident_id UUID REFERENCES incidents(id),
    track GEOMETRY(LineString, 4326),
    time_start TIMESTAMPTZ,
    time_end TIMESTAMPTZ,
    is_dark_vessel BOOLEAN DEFAULT FALSE,
    ais_gap_max_minutes FLOAT,
    ais_gap_count INTEGER,
    speed_variance FLOAT,
    heading_variance FLOAT,
    route_deviation_km FLOAT,
    loitering_duration_minutes FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. drift_runs
CREATE TABLE drift_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID REFERENCES incidents(id),
    direction VARCHAR(10) NOT NULL,  -- backward/forward
    ensemble_size INTEGER,
    time_step_minutes INTEGER DEFAULT 15,
    particle_count INTEGER,
    duration_hours FLOAT,
    config JSONB,  -- perturbation parameters
    particles_path TEXT,  -- MinIO path to NetCDF/JSON
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. origin_heatmaps
CREATE TABLE origin_heatmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drift_run_id UUID REFERENCES drift_runs(id),
    incident_id UUID REFERENCES incidents(id),
    heatmap_path TEXT NOT NULL,  -- MinIO path to GeoTIFF
    release_time_start TIMESTAMPTZ,
    release_time_end TIMESTAMPTZ,
    envelope GEOMETRY(Polygon, 4326),  -- high-probability spatial envelope
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. suspect_scores
CREATE TABLE suspect_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID REFERENCES incidents(id),
    vessel_id UUID REFERENCES vessels(id),
    total_score FLOAT NOT NULL,
    normalized_probability FLOAT NOT NULL,
    s_spatial FLOAT,
    s_temporal FLOAT,
    s_heading FLOAT,
    s_gap FLOAT,
    p_type FLOAT,
    s_anomaly FLOAT,
    s_dark FLOAT,
    rank INTEGER,
    isolation_forest_score FLOAT,
    ais_gap_zscore FLOAT,
    is_dark_vessel BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(incident_id, vessel_id)
);

-- 12. alerts
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,  -- new_spill/dark_vessel/high_suspect/coastline_impact/job_failure
    severity VARCHAR(10) DEFAULT 'info',  -- critical/high/medium/low/info
    title VARCHAR(200) NOT NULL,
    message TEXT,
    incident_id UUID REFERENCES incidents(id),
    vessel_id UUID REFERENCES vessels(id),
    is_acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. reports
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID REFERENCES incidents(id),
    report_type VARCHAR(30) NOT NULL,  -- evidence/monthly/executive
    title VARCHAR(200),
    file_path TEXT NOT NULL,  -- MinIO path to PDF
    file_size_bytes BIGINT,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    config JSONB  -- generation parameters
);

-- 14. model_runs
CREATE TABLE model_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(50) NOT NULL,  -- oil_segmentation/ship_detection/isolation_forest
    model_version VARCHAR(30),
    checkpoint_path TEXT,
    dataset_hash VARCHAR(64),
    config JSONB,  -- hyperparameters
    metrics JSONB,  -- { "iou": 0.62, "loss": 0.34, ... }
    training_started_at TIMESTAMPTZ,
    training_completed_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'pending',  -- pending/training/completed/failed
    seed INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. datasets
CREATE TABLE datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    source VARCHAR(100) NOT NULL,  -- zenodo/xview3/marinecadastre/era5/cmems/natural_earth
    version VARCHAR(50),
    region VARCHAR(100),
    timestamp_range_start TIMESTAMPTZ,
    timestamp_range_end TIMESTAMPTZ,
    checksum VARCHAR(128),
    license VARCHAR(200),
    local_path TEXT,
    ingestion_status VARCHAR(20) DEFAULT 'pending',  -- pending/downloading/ready/error
    file_size_bytes BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_scenes_acquisition ON scenes(acquisition_time);
CREATE INDEX idx_scenes_footprint ON scenes USING GIST(footprint);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_location ON incidents USING GIST(location);
CREATE INDEX idx_vessel_positions_vessel ON vessel_positions(vessel_id, timestamp);
CREATE INDEX idx_vessel_positions_geom ON vessel_positions USING GIST(position);
CREATE INDEX idx_suspect_scores_incident ON suspect_scores(incident_id, rank);
CREATE INDEX idx_alerts_type ON alerts(type, is_acknowledged);
```

---

## API Plan

Base URL: `/api/v1`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health check |
| **Jobs** | | |
| `POST` | `/jobs` | Submit new pipeline job (SAR scene) |
| `GET` | `/jobs` | List jobs (filterable by status) |
| `GET` | `/jobs/{id}` | Job detail + progress + artifacts |
| `POST` | `/jobs/{id}/reprocess` | Reprocess (new run ID, preserves history) |
| **Scenes** | | |
| `GET` | `/scenes` | List satellite scenes |
| `GET` | `/scenes/{id}` | Scene detail + metadata |
| `POST` | `/scenes` | Register/upload new scene |
| **Incidents** | | |
| `GET` | `/incidents` | List incidents (filter: status, severity, region, date, confidence) |
| `GET` | `/incidents/{id}` | Full incident detail (slick, geometry, drift, suspects) |
| `PATCH` | `/incidents/{id}` | Update status (resolve, etc.) |
| **Vessels** | | |
| `GET` | `/vessels` | List vessels (filter: type, status, risk) |
| `GET` | `/vessels/{id}` | Vessel dossier (track history, gaps, anomaly, incidents) |
| **Analytics** | | |
| `GET` | `/analytics/overview` | KPI summary |
| `GET` | `/analytics/trends` | Time-series spill trends |
| `GET` | `/analytics/regional` | Regional distribution data |
| `GET` | `/analytics/vessels` | Top suspect vessels by frequency |
| `GET` | `/analytics/processing` | Pipeline performance metrics |
| **Alerts** | | |
| `GET` | `/alerts` | List alerts (filter: type, severity, acknowledged) |
| `PATCH` | `/alerts/{id}/acknowledge` | Acknowledge alert |
| **Reports** | | |
| `POST` | `/reports/generate` | Generate evidence PDF |
| `GET` | `/reports` | List generated reports |
| `GET` | `/reports/{id}` | Report metadata + download URL |
| `GET` | `/reports/{id}/download` | Stream PDF file |
| **Layers** | | |
| `GET` | `/layers/slicks/{incident_id}` | GeoJSON slick polygons |
| `GET` | `/layers/vessels/{incident_id}` | GeoJSON vessel tracks |
| `GET` | `/layers/drift/{incident_id}` | GeoJSON drift particles/heatmap |
| `GET` | `/layers/ships/{incident_id}` | GeoJSON radar ship detections |
| `GET` | `/layers/forecast/{incident_id}` | GeoJSON forward forecast plume |

### Data Contract Example (Incident Detail)

```json
{
  "id": "uuid",
  "incident_id_display": "OS-2025-091",
  "status": "active",
  "severity": "high",
  "detected_at": "2025-09-09T11:24:00Z",
  "location": { "lat": 18.32, "lon": 71.45 },
  "region": "Arabian Sea (Indian EEZ)",
  "estimated_area_km2": 12.4,
  "confidence": {
    "combined": 0.947,
    "ai_detection": 0.92,
    "glcm_texture": 0.88,
    "wind_validity": 1.0,
    "formula": "0.60 × AI + 0.25 × GLCM + 0.15 × Wind"
  },
  "geometry": {
    "area_km2": 12.4,
    "perimeter_km": 28.3,
    "elongation_ratio": 4.2,
    "fragment_count": 3,
    "orientation_angle_deg": 127.5
  },
  "drift": {
    "age_estimate_hours": 18,
    "origin_heatmap_url": "/api/v1/layers/drift/{id}",
    "release_time_window": { "start": "...", "end": "..." },
    "forecast_url": "/api/v1/layers/forecast/{id}"
  },
  "suspects": [
    {
      "rank": 1,
      "vessel_name": "MV Ocean Star",
      "vessel_type": "crude_tanker",
      "mmsi": "419876543",
      "total_score": 0.87,
      "normalized_probability": 0.342,
      "factors": {
        "s_spatial": 0.91,
        "s_temporal": 0.85,
        "s_heading": 0.78,
        "s_gap": 0.92,
        "p_type": 1.0,
        "s_anomaly": 0.82,
        "s_dark": 0.0
      },
      "is_dark_vessel": false,
      "ais_gap_zscore": 2.3,
      "isolation_forest_score": 0.82
    }
  ],
  "source": "demo",
  "scene": { "...": "scene metadata" },
  "job": { "...": "job status" }
}
```

---

## Frontend Page Plan

### Design Language (from `01_dashboard_LOCKED.png`)

- **Header**: Deep navy (`#0f172a`) with Government of India emblem, OceanWatch AI branding, tagline, notification bell, user avatar, date/time
- **Sidebar**: Navy (`#1e293b`), icon + label navigation, active state highlight, "Clean Seas Strong India" footer emblem
- **Content**: Light gray (`#f8fafc`) background, white cards with thin borders + subtle shadows
- **KPI Cards**: Top row, icon + large number + trend indicator, colored accent per type
- **Status Badges**: Red=Active/High, Amber=Monitoring/Medium, Green=Resolved/Low, Blue=Info
- **Typography**: Clean sans-serif, clear hierarchy

### Pages (11 total, matching UI_SPEC.md + screenshots)

| # | Page | Key Components | Reference Image |
|---|---|---|---|
| 1 | **Dashboard** | 4 KPI cards, interactive map, Selected Incident panel, Recent Detections list, Wind & Ocean Conditions, System Notifications, Quick Actions | `01_dashboard_LOCKED.png` |
| 2 | **Live Monitoring** | Full-viewport map, 6 KPI cards, 8+ layer toggles, time scrubber (-24h to +72h), Active Detections panel, Vessels in View, Environmental Conditions, Forecast panel | `02_live_monitoring.png` |
| 3 | **Spill Incidents** | 5 KPI cards, Incident List with filters + search, Incident Details panel (tabs: Overview, Satellite Imagery, Drift Analysis, Vessel Analysis, Environmental Impact, Timeline), Top Suspect Vessels table, Quick Actions | `03_spill_incidents.png` |
| 4 | **Incident Investigation** | Forensic progression header (7 steps), central map with SAR + slick + drift + vessels, 7-factor horizontal bar chart, suspect ranking panel, 15-min timestep scrubber, re-run/export actions | (Designed from UI_SPEC.md §4) |
| 5 | **Vessel Tracking** | 4 KPI cards, Vessel List with filters + sorting, central map with tracks/layers, Vessel Details panel (photo, specs, position, risk indicators), Track History chart, Speed & Heading chart, AIS Gap Timeline | `04_vessel_tracking.png` |
| 6 | **Satellite Data** | 4 KPI cards, Coverage Map with footprints, Satellite Scenes table with filters, Selected Scene Preview (metadata + polarization views), Quick Actions (Run Detection, Download) | `05_satellite_data.png` |
| 7 | **Analytics & Reports** | 4 KPI cards, Spill Detection Trends (bar chart), Severity Distribution (donut), Spill Types by Source (horizontal bars), Regional Distribution heatmap, Top 10 Suspect Vessels table, Key Insights, Environmental Correlation scatter, Monthly Processing Statistics, Report Generation panel | `06_analytics_reports.png` |
| 8 | **Environmental Impact** | Forward forecast map overlay, MPA/reef/mangrove overlays, affected area calculation, time-to-shore estimate, impact risk assessment | (Designed from UI_SPEC.md §8) |
| 9 | **Alerts & Notifications** | Priority alert feed, severity filters, acknowledge actions, badge counts | (Designed from UI_SPEC.md §9) |
| 10 | **Data Management** | System health indicators, cache status, storage capacity, model checkpoint inventory, sync triggers | (Designed from UI_SPEC.md §10) |
| 11 | **Users & Access** | RBAC management (4 roles), user list, role assignment | (Designed from UI_SPEC.md §11) |

---

## ML Training Plan

### Oil Spill Segmentation (Attention U-Net)

1. **Dataset**: Zenodo Sentinel-1 SAR Oil Spill Dataset
2. **Preparation**: Download → split 70/15/15 → augment (flip, rotate, elastic)
3. **Architecture**: `segmentation_models_pytorch.Unet` with `encoder_name="resnet34"`, `attention_type="scse"`, pretrained encoder
4. **Loss**: Focal Loss (γ=2.0, α=0.75 for foreground)
5. **Optimizer**: AdamW, lr=1e-4, weight_decay=1e-4
6. **Scheduler**: CosineAnnealingLR
7. **Training**: 50 epochs, batch_size=8, seed=42
8. **Checkpointing**: Save best (val IoU) and last checkpoint
9. **Metrics**: IoU, Dice, Precision, Recall per epoch → JSON + CSV
10. **Target**: IoU ≥ 0.60 (project target, not guaranteed)
11. **Device**: MPS (Apple Metal) for training, CPU fallback
12. **Output**: `models/oil_segmentation/best.pt`, `models/oil_segmentation/metrics.json`

### Ship Detection (CFAR + YOLOv8)

1. **CFAR**: Pure statistical implementation — sliding window, local mean/variance, threshold = μ + k×σ (k=3.5)
2. **Dataset**: xView3 SAR ship labels
3. **YOLOv8**: Ultralytics `yolov8s` fine-tuned on xView3 crops
4. **Training**: 100 epochs, imgsz=640, batch=16
5. **Output**: `models/ship_detection/best.pt`

### Isolation Forest (Behavioral Anomaly)

1. **Features**: 7 behavioral features per ML_SPEC.md
2. **Training**: Fit on regional background vessel traffic (demo: MarineCadastre)
3. **Parameters**: n_estimators=100, contamination=0.1
4. **Output**: `models/anomaly/isolation_forest.joblib`

> [!WARNING]
> **Model training cannot begin until datasets are downloaded.** Phase B must complete dataset acquisition first. Until real training completes, the system will clearly label any outputs as "untrained placeholder" and will NOT fabricate accuracy numbers.

---

## Inference Plan

### Per-Scene Pipeline (14 stages)

```
PREPROCESSING → WIND_GATE → OIL_DETECTION → GLCM_VALIDATION → GEOMETRY
    → SHIP_DETECTION → DRIFT_HINDCAST → AIS_RECONSTRUCTION → RADAR_AIS_MATCH
    → BEHAVIOR_ANOMALY → ATTRIBUTION → FORECAST → PERSIST_RESULTS → REPORT_GENERATION
```

**Early Exit Points:**
- Wind gate fail (wind < 2 or > 10 m/s) → status: "rejected/look-alike risk"
- Oil detection confidence < 0.50 → status: "no confirmed spill"
- GLCM validation fail → status: "possible look-alike"
- Zero ships detected → proceed but flag "no radar ships"
- AIS unavailable → flag "AIS unavailable", skip attribution

**Key Formulas (hardcoded from ML_SPEC.md):**
- Combined confidence: `0.60 × AI_score + 0.25 × GLCM_score + 0.15 × wind_validity`
- Drift velocity: `U_oil = U_current + 0.03 × U_wind`
- 7-factor: `0.20×S_spatial + 0.15×S_temporal + 0.15×S_heading + 0.15×S_gap + 0.10×P_type + 0.10×S_anomaly + 0.15×S_dark`
- Gap z-score: `S_gap = Φ((gap_ship - μ_regional) / σ_regional)`
- Normalization: `P(ship_i) = Score(ship_i) / Σ Score(ship_j)`

---

## Pipeline / Job-State Plan

### Job States
```
queued → running → succeeded
                 ↘ failed
```

### Stage Tracking
Each job tracks: `job_id`, `status`, `stage` (current of 14), `progress` (0.0–1.0), `started_at`, `completed_at`, `error_message`, `artifact_references`

### Celery Configuration
- Broker: Redis (`redis://localhost:6379/0`)
- Result backend: Redis
- Task serializer: JSON
- Task routes: `pipeline.*` → `pipeline` queue
- Concurrency: 2 workers (CPU-bound ML inference)
- Task timeout: 3600s (1 hour max per job)
- Retry: Up to 2 retries on transient failures

### Reprocessing
- `POST /api/v1/jobs/{id}/reprocess` creates a NEW job with a new `job_id`
- Original job/artifacts preserved for audit trail
- Each reprocessing links to original via `parent_job_id`

### Artifact Storage
- **MinIO**: SAR rasters, oil masks (GeoTIFF), origin heatmaps (GeoTIFF), drift particles (NetCDF/JSON), forecast plumes, evidence PDFs
- **PostgreSQL**: All metadata, vector geometries, scores, relationships, audit logs

---

## Testing Plan

### Unit Tests (Phase-by-phase)
| Module | Tests |
|---|---|
| Wind gate | Reject < 2 m/s, reject > 10 m/s, pass 2–10 m/s, audit log |
| GLCM | Homogeneity/contrast extraction, combined confidence formula |
| Geometry | Area, perimeter, elongation, fragment count, orientation |
| CFAR | Candidate detection on synthetic bright targets |
| 7-factor | Weight sum = 1.0, per-factor range [0,1], normalization sums to 1.0 |
| Drift | Reverse advection direction, expanding uncertainty, MC perturbation bounds |
| AIS gap | Z-score calibration, Φ function, edge cases |
| Vessel type prior | Correct mapping for all vessel types |

### Integration Tests
- API endpoint smoke tests (all CRUD operations)
- Pipeline integration: submit job → verify stage transitions → verify artifacts created
- Storage: MinIO upload/download round-trip
- Database: Migration up/down, spatial queries

### E2E / Demo Test
- Full demo scenario from DEMO_SPEC.md (15-step script)
- Frontend smoke test (Playwright): navigate all 11 pages, verify no errors
- Browser verification of dashboard against `01_dashboard_LOCKED.png`

---

## Demo Plan

### Scenario: Gulf of Mexico Demo

1. **Pre-cached data**: Synthetic/public SAR scene, MarineCadastre AIS for GoM region, cached ERA5 wind, cached CMEMS currents
2. **Seed script** (`scripts/seed_demo_data.py`): Populates database with demo scene, demo vessels, demo AIS positions, demo forcing data
3. **Pipeline execution**: Runs full 14-stage pipeline on demo scene using real algorithms (or clearly-labeled placeholders if models are untrained)
4. **Precomputed fallback**: If live pipeline cannot run, precomputed artifacts are loaded from `data/demo/` through the same API/UI
5. **Demo walk-through**: Follows the 15-step DEMO_SPEC.md script

### Demo vs Production Separation
- All demo records tagged with `source = 'demo'`
- Demo AIS adapter reads MarineCadastre CSV → never labeled as Indian government AIS
- Production adapters are stubbed interfaces with clear `NotImplementedError` + documentation
- Environmental data adapter: demo reads local cache, production adapter interface defined for live ECMWF/Copernicus APIs

---

## Risks & Blockers

| Risk | Severity | Mitigation |
|---|---|---|
| **Zenodo dataset unavailable or too large** | High | Download script with resume, fallback to synthetic tiny dataset for smoke testing |
| **xView3 dataset requires registration** | Medium | Document access steps, provide synthetic CFAR test data |
| **OpenDrift installation on Apple Silicon** | Medium | Custom Lagrangian particle tracker as fallback (spec-compliant physics) |
| **MPS (Metal) training instability** | Low | CPU fallback for training, MPS for inference |
| **MAPBOX_TOKEN not provided** | Low | MapLibre GL JS with free OSM tiles as default |
| **No Docker for PostgreSQL/Redis** | Low | Homebrew installation scripts provided |
| **Large dataset storage** | Low | 768 GB available, sufficient |
| **MarineCadastre AIS format changes** | Low | Version-locked download URLs, format validation |
| **GLCM computation speed** | Low | Process only candidate ROI regions, not full scene |
| **PDF generation library compatibility** | Low | WeasyPrint primary, ReportLab fallback |

---

## Phase Execution Order

| Phase | Name | Dependencies | Key Deliverables |
|---|---|---|---|
| **A** | Foundation & Environment | None | Venv, services, database, project structure, config |
| **B** | Data Ingestion & Preprocessing | A | Download scripts, demo data seeder, SAR preprocessing |
| **C** | Oil Model Training & Inference | B | U-Net training script, checkpoint, inference pipeline |
| **D** | Ship Detection | B | CFAR implementation, YOLOv8 training, detection pipeline |
| **E** | Drift Modeling | C | Lagrangian tracker, backward hindcast, MC ensemble, forward forecast |
| **F** | AIS + Attribution | B, D, E | AIS reconstruction, radar-AIS matching, Isolation Forest, 7-factor scoring |
| **G** | Backend Orchestration | A, C–F | FastAPI app, Celery pipeline, all API endpoints, storage |
| **H** | Frontend Integration | G | All 11 pages, map, charts, design language |
| **I** | Reports | G, H | Evidence PDF generation, report API |
| **J** | Testing & Demo | All | Unit tests, integration tests, E2E, acceptance criteria verification |

---

## User Review Required

> [!IMPORTANT]
> **Services Installation**: PostgreSQL, Redis, and MinIO will be installed via Homebrew since Docker is unavailable. This will modify your system. Confirm this is acceptable.

> [!IMPORTANT]
> **Dataset Downloads**: The Zenodo SAR Oil Spill dataset (~2-5 GB), xView3 subset, and MarineCadastre AIS data will need to be downloaded. This requires network access and storage. Confirm before proceeding.

> [!IMPORTANT]
> **MAPBOX_TOKEN**: A Mapbox access token is needed for the full map experience shown in the reference screenshots. Without it, the system will use MapLibre GL JS with OpenStreetMap tiles (functional but visually different from reference). Do you have a Mapbox token to add to `.env`?

## Open Questions

> [!NOTE]
> 1. **Mapbox Token**: Do you have a Mapbox GL JS token, or should we default to MapLibre + OSM tiles?
> 2. **Service Installation**: Shall I install PostgreSQL, Redis, and MinIO via Homebrew, or do you prefer a different approach?
> 3. **Dataset Size**: The full Zenodo SAR dataset is several GB. Should I download the full dataset or start with a minimal subset for faster iteration?
> 4. **OpenDrift**: OpenDrift has complex native dependencies (C/Fortran). Should I use it if installable, or implement a custom Lagrangian tracker (same physics, pure Python/NumPy) as the primary approach?
