# OceanWatch AI — Complete Project Report
### Forensic Oil Spill Detection & Vessel Attribution Pipeline
### NTRO Problem Statement 26143 | Smart India Hackathon 2026 | Theme: Disaster Management

---

## 1. Problem Statement

Marine oil spills cause severe damage to ocean ecosystems — killing marine life, destroying coral reefs, and contaminating fisheries. The bigger problem is that most oil spills **remain un-attributable to the vessel that caused them**. Ships dump oil illegally, turn off their tracking systems, and sail away. Without proof of who did it, there is no enforcement and no deterrence.

Current monitoring systems like EMSA's CleanSeaNet (Europe) rely on **expensive infrastructure and trained human analysts** to manually examine every satellite image. This makes them inaccessible to developing maritime nations like India. Meanwhile, thousands of chronic small discharges happen every year — invisible, unpunished, and cumulatively more damaging than catastrophic tanker accidents.

**The core challenge**: Build an intelligent automated pipeline that can:
- **(a)** Detect and characterize oil spills from satellite imagery, calculate geometric properties and estimate age
- **(b)** Use oceanographic and meteorological data to trace the slick backward to its origin and predict its future flow
- **(c)** Use AIS (ship tracking) data to reconstruct vessel traffic, filter irrelevant ships, and score suspect vessels on proximity, trajectory, and behavioral anomalies
- **(d)** Display everything on an interactive visual interface with a ranked suspect list

---

## 2. Proposed Solution

**OceanWatch AI** is a fully automated end-to-end pipeline that takes a satellite radar image as input and produces a ranked list of suspect vessels as output — with no human analyst needed at any step.

### What Does This System Do?

A satellite takes a radar photo of the ocean. Our system:
1. **Finds oil spills** in that photo using AI
2. **Figures out where the oil came from** by simulating ocean currents backward in time
3. **Finds ships** in the same radar photo — including ones hiding (AIS turned off)
4. **Scores each ship** on how likely it caused the spill
5. **Shows everything** on a map with a ranked suspect list

This is a **forensic post-event attribution pipeline** — when a spill is reported or found in satellite imagery, the system reconstructs what happened and identifies the most likely responsible vessel. It is NOT a real-time surveillance system (Sentinel-1 revisits every 6-12 days).

### Why This Solution Is Different

| What We Do | Why It Matters |
|---|---|
| Fully automated — no human analyst | Existing systems (EMSA) need expensive trained analysts at every step |
| Calibrated AIS gap scoring | We don't naively flag every AIS gap as suspicious. We compare gaps against ALL ships in the area and only flag statistical outliers. This eliminates false accusations. |
| Dark vessel detection from radar | We find ships that turned off their AIS transponder — the exact evasion tactic NTRO highlights |
| Transparent 7-factor scoring | Every suspect's score breaks down into visible components. An investigator can see exactly WHY a ship was flagged. No black box. |
| Probability surface, not a single point | Our drift model outputs a heat map of probable origin, honestly representing uncertainty |
| 100% free data + open-source tools | Deployable by any maritime nation without commercial licenses |

---

## 3. System Architecture — Full Pipeline

```
┌──────────────────────────────────────────────────────────────────────┐
│                     DATA SOURCES + STORAGE                           │
│                                                                      │
│  Sentinel-1 SAR     ERA5 Wind (PRE-CACHED)   AIS Data               │
│  Sentinel-2 Opt*    CMEMS Currents (CACHED)   Demo: MarineCadastre  │
│  Zenodo Labels      Natural Earth              Prod: NAIS/DG Ship   │
│  xView3 Labels      GEBCO Bathymetry           /Spire satellite AIS │
│                                                                      │
│  * Sentinel-2 used strictly for high-confidence daytime visual       │
│    verification when cloud cover < 20%                               │
│                                                                      │
│  Storage: Rasters → Object Storage (local/MinIO/S3)                 │
│           Vectors/scores → PostgreSQL + PostGIS                     │
└───────┬──────────────────────────────────┬───────────────────────────┘
        │                                  │ (Wind/Currents)
        │                                  ▼
        │    ┌──────────────────────────────────────────────────┐
        │    │                     TASK QUEUE                   │
        │    │  FastAPI pushes to Celery+Redis queue. Returns   │
        │    │  task_id immediately. Async worker runs pipeline.│
        │    └─────────────────────┬────────────────────────────┘
        ▼                          ▼
┌──────────────────────────────────────────────────────────────────────┐
│         MODULE A: FIND THE OIL + FIND THE SHIPS                     │
│                                                                      │
│  Step 1 → Clean SAR image (SNAP for prototype; GDAL for prod)       │
│  Step 2 → WIND GATE (Input: Cached ERA5 Wind)                       │
│           < 2 m/s or > 10 m/s → REJECT (Look-alike / Wave break)    │
│  Step 3 → AI detects oil (Attention U-Net)                          │
│  Step 4 → Texture validation (GLCM homogeneity)                     │
│  Step 5 → Slick geometry extraction (area, elongation, shape)       │
│                                                                      │
│  Step 6 → Ship detection (Chained RoI Pipeline):                    │
│           - CFAR generates Region-of-Interest (RoI) proposals across│
│             ultra-wide SAR swath to discard empty ocean tiles       │
│           - YOLOv8 (xView3) head classifies those candidate crops   │
│             to suppress wave-crest false alarms                     │
│                                                                      │
│  OUTPUT: slick polygon (→ to B), ship positions (→ to C)            │
└───────┬──────────────────────────────────┬───────────────────────────┘
        │ (Slick Polygon)                  │
        ▼                                  │
┌──────────────────────────────────────┐   │ (Radar Ship Positions)
│  MODULE B: OCEAN DRIFT MODELING      │   │
│                                      │   │
│  Input: Cached Wind/Currents         │   │
│                                      │   │
│  - Weathering & Spreading Dynamics   │   │
│    (Calculates Slick Age here)       │   │
│  - Backward Drift (OpenDrift)        │   │
│    Advective field in reverse +      │   │
│    expanding spatial uncertainty     │   │
│    (Monte Carlo forward dispersion)  │   │
│  - Forward trajectory prediction     │   │
│                                      │   │
│  OUTPUT: origin probability heat map │   │
└───────┬──────────────────────────────┘   │
        │ (Heatmap & Time Window)          │
        ▼                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│              MODULE C: WHICH SHIP DID IT?                           │
│                                                                      │
│  Step 1 → Pull AIS traffic for origin area + time window            │
│  Step 2 → Match Radar Ships (from A) ↔ AIS (from C)                 │
│           Unmatched Radar Target = DARK VESSEL 🚩                   │
│  Step 3 → Isolation Forest → behavioral anomaly scores              │
│  Step 4 → 7-factor scoring → ranked suspects                        │
│                                                                      │
│  OUTPUT: ranked suspect list with full score breakdowns              │
└───────┬──────────────────────────────────────────────────────────────┘
        ▼
┌──────────────────────────────────────────────────────────────────────┐
│              MODULE D: VISUALIZATION & REPORTING                    │
│                                                                      │
│  → Interactive GIS map (React + Mapbox GL JS)                       │
│  → Suspect ranking panel + Timeline slider + PDF Export             │
└──────────────────────────────────────────────────────────────────────┘

------------------------------------------------------------------------
Backend Infrastructure Layer (Not Sequential - Hosting Architecture)
[ Docker Container Runtime ]
 ├─ Nginx (Reverse Proxy) ──► FastAPI (API Server)
 ├─ Celery + Redis (Task Broker for async long-running jobs)
 ├─ PostgreSQL + PostGIS (Relational Data & Vectors)
 └─ MinIO / S3 (Object Storage for multi-GB Rasters)
```

---

## 4. Technical Approach — Module Details

### MODULE A: Find the Oil + Find the Ships

#### A1. SAR Preprocessing
Takes a raw Sentinel-1 radar image and prepares it for analysis:
- **Radiometric calibration** — converts raw pixel values to actual radar backscatter (σ₀ in dB)
- **Thermal noise removal** — removes sensor artifacts
- **Terrain correction** — maps the image to real-world coordinates (latitude/longitude)
- **Land masking** — removes all land areas using Natural Earth coastline data
- **Speckle filtering** — reduces radar noise using Refined Lee filter (7×7 window). This filter is chosen specifically because it preserves edges — important for detecting the boundary of thin oil slicks

**Tools**: ESA SNAP (snappy Python API) for prototype. Production: GDAL + rasterio + pyroSAR (avoids SNAP's Java bridge memory issues in Docker)

#### A2. Wind Gate (Runs BEFORE AI Detection)
Oil slicks are visible on radar because they dampen tiny ocean surface waves (Bragg waves). This ONLY works when wind is between 2-10 m/s:
- Below 2 m/s: the whole sea is calm, everything looks dark — massive false alarm risk
- Above 10 m/s: waves are too strong, they break through the oil

We pull the exact wind speed at the detection time and location from ERA5 data (read from **local cache**, not live API call).

**If wind is outside 2-10 m/s, the scene is rejected BEFORE the AI model even runs.** This eliminates the majority of look-alike false positives upfront.

**Tools**: cdsapi (for pre-downloading), xarray (for reading cached NetCDF)

#### A3. Oil Slick Detection (Deep Learning — Only on Wind-Validated Scenes)
- **Model**: Attention U-Net
  - A proven image segmentation architecture that draws boundaries around objects in images
  - The "attention" mechanism forces the model to focus on the low-contrast oil-water boundary instead of getting distracted by the dominant ocean background
  - Encoder backbone: ResNet-34 (pretrained on ImageNet for better feature extraction)
- **Training data**: Zenodo Sentinel-1 SAR Oil Spill Dataset — a public, labeled dataset of real oil spill radar images
- **Loss function**: Focal Loss
  - In a radar image, oil pixels are maybe 1-5% of the total. Normal loss functions get lazy and just predict "no oil" everywhere (98% accuracy by doing nothing)
  - Focal Loss fixes this by putting extra weight on the hard cases (the actual oil pixels)
- **Data split**: 70% training / 15% validation / 15% held-out test
- **Augmentation**: random flip, rotation, elastic deformation
- **Target accuracy**: IoU (Intersection over Union) ≥ 0.60 — this is a realistic, honest number for this type of data
- **Output**: binary mask (each pixel = oil or not-oil) + confidence score per pixel

**Tools**: PyTorch, segmentation-models-pytorch

#### A4. Texture Validation (GLCM — Second Layer of False Alarm Reduction)

Even after the wind gate, some non-oil features pass through. Biological slicks (seaweed, algae) and internal waves can still look like oil within the valid wind window. GLCM texture analysis separates them:

**Texture check (GLCM):**
- Oil has a specific smooth texture that differs from biological slicks
- We compute GLCM (Gray-Level Co-occurrence Matrix) features: homogeneity and contrast
- Oil is smoother (higher homogeneity) than biological look-alikes

**Combined confidence formula (merging all checks):**
```
confidence = 0.60 × AI_detection_score + 0.25 × GLCM_texture_score + 0.15 × wind_validity
```
- Transparent formula. No black box. A judge or investigator can see exactly how the confidence was computed.
- Threshold: confidence ≥ 0.50 → confirmed detection

**Tools**: scikit-image (GLCM computation)

#### A5. Geometric Characterization

Once the oil slick is confirmed, we automatically measure it:

| Property | How It's Computed | What It Tells Us |
|---|---|---|
| **Area** (km²) | Polygon area in projected coordinate system | Size/severity of spill |
| **Perimeter** (km) | Polygon boundary length | Edge complexity |
| **Elongation ratio** (L/W) | Major axis ÷ minor axis of fitted ellipse | High = trailing discharge from moving ship. Low = stationary leak. |
| **Fragment count** | Number of disconnected polygon pieces | High fragmentation = older, weathered spill |
| **Orientation angle** | Direction of major axis | Compare with ship heading for attribution |

**Tools**: Shapely (geometry), OpenCV (contour analysis, ellipse fitting)

#### A6. Ship Detection from Radar (Chained RoI Pipeline)

Running a deep neural network over a massive SAR scene (often 1GB+ per image) is computationally prohibitive. We use a chained approach:

**Step 1: CFAR (Region-of-Interest Extraction)**
- CFAR = Constant False Alarm Rate (a statistical detector)
- We run CFAR across the ultra-wide SAR swath to quickly find bright metallic spots (ships, buoys, offshore platforms).
- This discards 99% of the empty ocean tiles instantly.

**Step 2: YOLOv8 (Classification)**
- We feed only the candidate crop regions (RoIs) identified by CFAR into our lightweight YOLOv8 head (trained on the xView3 dataset).
- YOLOv8 acts as a powerful classifier to suppress false alarms (like breaking wave crests) that tricked the CFAR detector.

This chained approach is computationally efficient and minimizes wave-crest false alarms.

---

### MODULE B: Where Did the Oil Come From? (Drift Hindcasting)

#### How It Works
We use **OpenDrift** — a proven, open-source Lagrangian particle tracking framework developed and used in production by the Norwegian Meteorological Institute. It simulates how objects (oil, in our case) move in the ocean.
#### B1. Weathering Dynamics & Spill Age Estimation

A single SAR image is just a static snapshot. You cannot accurately determine the age of an oil spill purely from a 2D image mask. Age is a function of weathering dynamics (evaporation, emulsification, spreading). 

We compute the spill age here in Module B using the ADIOS/Fay spreading models combined with the cached sea-surface temperature (SST) and historical wind/current data. This dynamic calculation yields the **Slick Age**, which gives us the precise time boundary for how far backward we need to simulate.

#### B2. The Physics of Drift

Oil on the ocean surface moves because of two forces:
1. **Ocean currents** (the dominant force) — from CMEMS/HYCOM ocean model data
2. **Wind** (pushes the surface oil) — surface oil drifts at approximately 3% of the wind speed

The total velocity of an oil particle:
```
U_oil = U_current + 0.03 × U_wind
```

#### B3. Backward Simulation (Hindcast) & The "Physics Trap" Defense
To find where the oil came from, we run the simulation **backward in time**.

**The Trap**: Forward drift adds a stochastic diffusion term (random walk) to represent turbulent dispersion. If you simply run time backward ($-dt$), diffusion runs in reverse. Mathematically, reverse diffusion is ill-posed and unnaturally concentrates particles into a single point instead of reflecting historical uncertainty.

**Our Defense**: We model the **advective field in reverse** while applying an **expanding spatial uncertainty envelope** (forward Monte Carlo dispersion). 
- Reverse Advection: `U(-Δt) = -(U_current + 0.03 × U_wind)`
- Expanding Uncertainty (Forward Random Walk): `Δr = √(2 × Kh × Δt) × random_number`

This correctly generates an expanding probability cone the further back in time we go.

#### B4. Making It Reliable (Monte Carlo Ensemble)
A single simulation gives one possible answer. Weather and ocean data have errors. To account for this uncertainty:
- We run **20-50 simulations**, each with slightly perturbed inputs:
  - Wind speed: ±10% random perturbation
  - Wind direction: ±15° random perturbation
  - Current speed: ±10% random perturbation
  - Diffusion coefficient: ±50% random perturbation
- We stack all the results and compute a **2D probability density** — this produces the **origin probability heat map**
- The heat map shows: "There is a 40% chance the oil came from this area, 25% from this area, etc."
- This is fundamentally more honest than claiming "the oil came from THIS exact point"

#### Forward Forecast
Same engine, run **forward** from the detection time:
- Predicts where the oil will drift in the next 24-72 hours
- Shows potential coastline or reef impact zones
- Critical for response planning, not just investigation

#### Simulation Parameters
- Backward time window: bounded by the rough age bound (from Module A)
- Time step: 15 minutes
- Particles: 500-1000 seeded along the detected slick boundary
- Output interval: 1 hour

**Output**:
- Origin probability heat map (GeoTIFF raster)
- Estimated release time window
- Spatial envelope of high-probability origin zone
- Forward trajectory prediction

**Data source note**: ERA5 wind and CMEMS currents are read from **local pre-cached files**, not queried via API during inference. A scheduled data sync job pre-downloads data for the region of interest. ERA5 is appropriate for forensic post-event analysis (reanalysis = higher quality than operational forecasts for historical events). For operational near-real-time use, substitute with GFS/NCMRWF/INCOIS.

**Tools**: OpenDrift/OpenOil (Python), xarray, netCDF4

---

### MODULE C: Which Ship Did It? (Vessel Attribution)

#### C1. AIS Traffic Reconstruction
- **AIS** (Automatic Identification System) is the GPS-like tracking system that ships are legally required to broadcast
- We query AIS records for all ships within:
  - The origin probability envelope + 20km buffer
  - The estimated time window + 2 hours buffer
- **AIS Data Source**:
  - **Demo**: MarineCadastre (Gulf of Mexico, free, US coastal waters)
  - **Production (India)**: DG Shipping / National AIS (NAIS) feeds, ICG coastal radar (ROSS), or commercial satellite AIS providers (Spire, exactEarth) for Indian Ocean Region
- From AIS we get: ship name, MMSI (ID number), IMO number, vessel type, flag state, latitude, longitude, speed over ground (SOG), course over ground (COG), heading, draught, timestamp
- We reconstruct continuous vessel trajectories from these point records using interpolation
- **Filtering**: Remove ships that realistically can't cause significant oil spills — small fishing boats, pleasure craft, sailing yachts. Keep: tankers, cargo ships, container ships, bulk carriers, offshore supply vessels

**Tools**: pandas, geopandas, movingpandas

#### C2. Dark Vessel Detection (SAR ↔ AIS Cross-Matching)
This is where ship detection from radar (Module A) combines with AIS records:

1. At the exact time the satellite captured the radar image, interpolate each AIS vessel's position
2. For each ship detected on radar, find the nearest AIS vessel within ~2 km
3. **Results**:
   - **Matched** — ship on radar has a corresponding AIS vessel → normal, broadcasting ship
   - **Unmatched radar detection** — ship is visible on radar but has NO AIS record → **DARK VESSEL** 🚩 (transponder turned off deliberately)
   - **Unmatched AIS** — AIS broadcast exists but no radar detection → vessel too small for radar, or possible spoofing
4. Dark vessels are added to the suspect list with an elevated suspicion prior — a ship that deliberately turned off its tracker near an oil spill is inherently suspicious

**Tools**: geopandas (spatial operations), scipy.spatial (nearest-neighbor matching)

#### C3. Behavioral Anomaly Detection (Isolation Forest)
For each candidate vessel, we compute behavioral features from their AIS trajectory:

| Feature | What It Measures |
|---|---|
| Speed variance | How erratic was their speed? Normal ships maintain steady speed |
| Heading variance | How erratic was their course? Random zigzagging is suspicious |
| Max AIS gap duration | Longest period without broadcasting |
| Gap count | Number of AIS gaps longer than 10 minutes |
| Speed drop count | Number of sudden speed drops (> 5 knots) — possible discharge events |
| Route deviation | Maximum distance from the direct route to their declared destination |
| Loitering duration | Total time spent nearly stationary (SOG < 1 knot) outside anchorages |

We train an **Isolation Forest** (a standard unsupervised anomaly detection algorithm) on ALL vessels in the region — not just suspects. This teaches the model what "normal" ship behavior looks like for that specific sea area. Each candidate vessel then gets an **anomaly score** from 0 (normal) to 1 (highly anomalous).

**Tools**: scikit-learn (IsolationForest)

#### C4. The Core Algorithm: 7-Factor Suspect Scoring

This is the heart of the attribution system. Each candidate vessel gets scored on 7 transparent factors:

```
Score(ship) = 0.20 × S_spatial
            + 0.15 × S_temporal
            + 0.15 × S_heading
            + 0.15 × S_gap
            + 0.10 × P_type
            + 0.10 × S_anomaly
            + 0.15 × S_dark
```

| Factor | Weight | What It Checks | How It's Computed | Range |
|---|---|---|---|---|
| **S_spatial** | 0.20 | Was the ship in the probable origin area? | Integral of ship trajectory across origin probability heat map | 0 to 1 |
| **S_temporal** | 0.15 | Was it there at the right time? | Fraction of ship's transit time overlapping with estimated release window | 0 to 1 |
| **S_heading** | 0.15 | Was it heading in the same direction as the slick? | Cosine of angle between ship course and slick major axis | 0 to 1 |
| **S_gap** | 0.15 | Did it go silent suspiciously? | **Calibrated z-score**: gap compared to ALL ships in the area (see below) | 0 to 1 |
| **P_type** | 0.10 | Is this type of ship likely to spill? | Prior probability: Crude tanker=1.0, Chemical=0.9, Container=0.7, Cargo=0.5, Other=0.3 | 0 to 1 |
| **S_anomaly** | 0.10 | Was it behaving strangely? | Isolation Forest anomaly score | 0 to 1 |
| **S_dark** | 0.15 | Was it hiding its identity? | 1.0 if dark vessel (on radar, no AIS), 0.0 if broadcasting | 0 or 1 |

#### The Calibrated AIS Gap Innovation

This is our most important algorithmic innovation. Most systems flag any AIS gap as suspicious. This is wrong because AIS gaps happen constantly due to:
- Satellite reception blind spots
- Congested radio channels in busy areas
- Equipment malfunctions
- Geographical dead zones

**Our approach**:
1. Compute the distribution of AIS gap lengths for ALL vessels in the same sea sector and time period
2. Calculate this ship's gap as a z-score against that distribution:
   ```
   S_gap = Φ((gap_this_ship − mean_gap_all_ships) / std_gap_all_ships)
   ```
3. A 30-minute gap is NOT suspicious if the average gap in that area is 25 minutes
4. A 30-minute gap IS suspicious if the average gap in that area is 3 minutes

This single improvement eliminates most false accusations from naive gap-flagging.

#### C5. Score Normalization
All suspect scores are normalized to sum to approximately 1.0:
```
P(ship_i) = Score(ship_i) / Σ Score(all_ships)
```
This reads as a probability distribution — "Ship A has a 45% attribution probability, Ship B has 30%," etc.

Every score comes with its **full 7-factor breakdown**, so an investigator can see exactly which factors drove the accusation.

#### C6. Validation Framework
To prove the system works, we use synthetic validation:
1. Take a real AIS dataset for a real area and time period
2. Take a real or synthetic oil slick with a known origin
3. **Inject a synthetic "guilty" vessel** — a fake ship trajectory that passes through the origin at the right time
4. Run the entire pipeline from detection to attribution
5. Record where the true guilty vessel ranks in the output
6. Repeat 50+ times with different random conditions
7. Report: **"In 50 trials, the true source vessel ranked in the top 3 suspects X% of the time"**

This gives a concrete, testable, reproducible accuracy number.

---

### MODULE D: Interactive Dashboard

#### D1. GIS Map Engine
An interactive web map with toggleable layers:
- SAR radar image (grayscale raster)
- Detected oil slick polygon (color-coded by confidence: green = high, yellow = medium, red = low confidence)
- Origin probability heat map (red-yellow gradient overlay)
- Ship tracks from AIS (color-coded: red = high suspect, amber = medium, blue = low)
- Dark vessel markers (red warning icons with pulsing animation)
- Sentinel-2 optical satellite image overlay (when available, for visual confirmation)
- Forward drift trajectory prediction
- CFAR/ML ship detection markers

#### D2. Suspect Ranking Panel
A side panel showing the ranked vessel list:
- Each vessel shows: name, MMSI, IMO, flag state, vessel type, overall probability score
- **Score breakdown bar chart** — all 7 factors displayed as horizontal bars so the investigator sees exactly why this ship was flagged
- Dark vessel flag indicator
- AIS gap timeline visualization
- Anomaly flag from Isolation Forest

#### D3. Timeline Slider
- Interactive time scrubber with 15-minute steps
- Animates drift particles moving backward (showing where oil came from) or forward (showing where it's going)
- Vessel positions update along their tracks at each time step

#### D4. Evidence PDF Export
One-click auto-generated investigation report containing:
- SAR scene metadata (date, time, sensor, orbit number)
- Oil slick image with detection overlay
- Geometric characterization table
- Wind conditions at detection time
- Drift probability heat map image
- Top 3 suspect vessels with full score breakdowns
- AIS track maps for top suspects
- Dark vessel evidence

#### D5. Alert System
Automated notification triggered when a new oil spill is detected:
- Location coordinates
- Confidence score
- Estimated age
- Nearest suspect vessels
- Predicted coastline impact from forward forecast

**Tools**: React + Mapbox GL JS + deck.gl (primary option) or Streamlit + Folium (faster development fallback), reportlab/weasyprint (PDF generation)

---

## 5. Solution Flow Diagram

```
USER UPLOADS SAR IMAGE
        │
        ▼
[Preprocessing: calibrate → denoise → land mask → geocode]
        │
        ▼
[AI Oil Detection: Attention U-Net → binary mask + confidence]
        │
        ├──── confidence < 0.5 ──→ "No Oil Spill Detected" → STOP
        │
        ▼ (confidence ≥ 0.5)
[Validation: Wind check (ERA5) + Texture check (GLCM)]
        │
        ├──── validation fails ──→ "Possible Look-Alike — Low Confidence" → FLAG
        │
        ▼ (validation passes)
[Characterization: area, shape, elongation, age estimate]
        │
        ├──────────────────────────────────────────────────────┐
        │                                                      │
        ▼                                                      ▼
[Ship Detection: xView3 ML + CFAR]            [Drift Hindcast: OpenDrift backward]
        │                                              │
        │                                      [Monte Carlo 50 runs]
        │                                              │
        │                                      [Origin Probability Heat Map]
        │                                              │
        │                                      [Forward Forecast]
        │                                              │
        └──────────────┬───────────────────────────────┘
                       │
                       ▼
        [Pull AIS Traffic for Origin Area + Time Window]
                       │
                       ▼
        [Match Radar Ships ↔ AIS → Dark Vessel Flags]
                       │
                       ▼
        [Isolation Forest → Behavioral Anomaly Scores]
                       │
                       ▼
        [7-Factor Scoring Formula → Ranked Suspect List]
                       │
                       ▼
        [Dashboard: Map + Suspects + Timeline + PDF Export]
```

---

## 6. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Language** | Python 3.10+ | All processing, ML, backend |
| **SAR Processing** | ESA SNAP (snappy), GDAL, Rasterio | Calibration, geocoding, filtering |
| **Oil Detection** | PyTorch, segmentation-models-pytorch | Attention U-Net segmentation model |
| **Ship Detection** | YOLOv8 (ultralytics) | ML ship detector trained on xView3 |
| **Ship Detection (backup)** | NumPy, SciPy | CFAR statistical bright-target detector |
| **Texture Analysis** | scikit-image | GLCM feature extraction |
| **Geometry** | Shapely, OpenCV | Slick measurement + ellipse fitting |
| **Drift Simulation** | OpenDrift / OpenOil | Lagrangian particle tracking (backward + forward) |
| **Wind Data** | cdsapi (ERA5) | Wind forcing for drift + wind gate |
| **Ocean Current Data** | Copernicus Marine API (CMEMS/HYCOM) | Current forcing for drift (dominant force) |
| **AIS Processing** | pandas, geopandas, movingpandas | Trajectory reconstruction |
| **Spatial Matching** | geopandas, scipy.spatial | SAR↔AIS cross-matching |
| **Anomaly Detection** | scikit-learn (Isolation Forest) | Vessel behavioral scoring |
| **Backend API** | FastAPI + Docker | RESTful microservices |
| **Frontend** | React + Mapbox GL JS + deck.gl | Interactive GIS dashboard |
| **PDF Export** | reportlab / weasyprint | Evidence report generation |

**All tools are open-source. All data sources are free.**

---

## 7. Data Sources

| Data | Source | Format | Cost | Role |
|---|---|---|---|---|
| Radar images | Sentinel-1 GRD (Copernicus / ASF) | GeoTIFF | Free | Primary oil detection input |
| Optical images | Sentinel-2 MSI (Copernicus) | GeoTIFF | Free | Visual confirmation overlay |
| Oil spill training labels | Zenodo Sentinel-1 SAR Dataset | Labeled patches | Free | Train oil detection AI |
| Ship detection training | xView3 SAR Dataset (NeurIPS 2022) | Labeled chips | Free | Train ship detector |
| Wind data | ERA5 Reanalysis (ECMWF) | NetCDF | Free | Wind gate + drift forcing |
| Ocean currents | CMEMS / HYCOM | NetCDF | Free | Drift forcing (dominant) |
| Ship traffic (AIS) | MarineCadastre | CSV | Free | Vessel reconstruction |
| Coastline | Natural Earth | Shapefile | Free | Land masking |

**Demo region**: Gulf of Mexico — chosen because it has the best free AIS data (MarineCadastre covers US waters extensively), documented historical spill cases for testing, and complete ERA5/CMEMS coverage.

---

## 8. Feasibility Analysis

### Technical Feasibility
| Aspect | Assessment |
|---|---|
| AI models (U-Net, YOLOv8) | ✅ Published, peer-reviewed, proven architectures with existing implementations |
| Training data (Zenodo, xView3) | ✅ Public, labeled, free, sufficient quality for prototype |
| Drift engine (OpenDrift) | ✅ Used in production by Norwegian Met Office — mature and validated |
| Anomaly detection (Isolation Forest) | ✅ Standard scikit-learn algorithm, well-documented |
| SAR processing (SNAP) | ✅ Official ESA tool for Sentinel-1, free Python API |
| Web dashboard (React/Mapbox) | ✅ Proven web stack with extensive community support |

### Compute Requirements
| Task | Requirement |
|---|---|
| Training U-Net + YOLOv8 | Single GPU (Google Colab Pro or institutional GPU) |
| SAR preprocessing | CPU only |
| Drift simulation (50 Monte Carlo runs) | CPU only (minutes per scene) |
| AIS processing | CPU only (standard data operations) |
| Dashboard serving | Any web server |

**No expensive infrastructure needed.** Training on Colab Pro costs ~₹900/month. All inference and processing runs on CPU.

---

## 9. Viability Analysis

### Why This Is Viable

1. **Zero data cost** — Every data source (satellite, weather, ocean, AIS) is free and publicly accessible
2. **Zero software licensing** — 100% open-source tools with active communities
3. **Minimal compute cost** — Training on cloud GPU (~₹900/month), everything else on CPU
4. **Modular architecture** — Each module works independently and can be upgraded without touching the others
5. **Docker deployment** — Package everything in a container, deploy on any server (cloud or on-premise)
6. **Mirrors real operational systems** — Our pipeline follows the same fundamental approach as EMSA's CleanSeaNet but replaces the expensive human analyst with automated algorithms
7. **Legal precedent exists** — Satellite + AIS attribution evidence has been used successfully in court (Maersk Kiera case)

### Scalability
- Process any Sentinel-1 scene globally (not limited to demo region)
- Scale horizontally with more compute for near-real-time monitoring
- Future integration with commercial SAR providers (ICEYE, Capella) for higher revisit frequency

---

## 10. Challenges and Mitigation

| Challenge | Why It's Hard | Our Mitigation |
|---|---|---|
| **Look-alike false positives** | Seaweed, low-wind zones, and natural films look like oil on radar | 3-layer filtering: physics (wind gate) + texture (GLCM) + confidence threshold. Not relying on any single check. |
| **Wide origin search cone** | Weather data is coarse (8-30km grid) vs slick (~1km). The backward search cone widens over time. | Monte Carlo ensemble (50 runs) narrows effective uncertainty. Age estimation bounds the simulation time, preventing the cone from growing too large. |
| **AIS gaps misinterpreted** | Normal AIS gaps (satellite reception, congestion) look the same as deliberate transponder shutoff | Calibrated gap scoring: compare each gap against the background distribution of ALL vessels in the area. Only flag statistically rare gaps. |
| **Dark vessels** | Ships that turn off AIS have no traffic record to analyze | Ship detection from radar (ML + CFAR) operates independently of AIS. We find them on radar even without AIS. |
| **Satellite revisit gap** | Sentinel-1 revisits the same area every 6-12 days — spills may not be captured | System designed for forensic post-event analysis. Works with historical data. Future: commercial SAR constellations (ICEYE, Capella) enable daily or sub-daily revisits. |
| **Drift model uncertainty** | Ocean current and wind data have inherent errors | Ensemble Monte Carlo explicitly quantifies this uncertainty. Output is a probability surface, not a false-precision single point. |
| **Training data limitations** | Zenodo dataset may not cover all oil types and conditions | Extensive augmentation + clear reporting of model limitations. Target realistic IoU ≥ 0.60, not inflated claims. |

---

## 11. Impact and Benefits

### Environmental Impact
- **Detects chronic small discharges** — thousands happen every year, invisible to current systems. These cumulatively release more oil into the ocean than catastrophic tanker accidents
- **Deterrence effect** — EMSA's own data shows that detected-spills-per-km² declined over CleanSeaNet's first decade as surveillance awareness increased among shipping operators
- **Forward drift prediction** enables proactive protection of sensitive coastlines, coral reefs, and marine sanctuaries before oil arrives
- Published research (Nature Communications, 2016) shows even small spills cause measurable plankton toxicity within 24 hours

### Social and Legal Impact
- **Closes the attribution gap** — transforms "un-attributable" spills into prosecutable cases with exportable evidence packages
- **Explainable scoring** supports legal proceedings — the Maersk Kiera case established precedent that satellite + AIS evidence is admissible in court
- **Dark vessel detection** directly addresses the enforcement pain point NTRO specifically highlights
- Pattern-level enforcement: tracking repeat offenders across multiple voyages builds stronger cases

### Economic Impact
- **Reduces investigation cost** — automated pipeline replaces expensive manual SAR analysis by trained specialists
- **Zero licensing cost** — built entirely on free data and open-source tools, deployable without commercial infrastructure
- **Offshore operations** — pipeline/platform operators can use the same system to detect their own micro-leaks before they escalate into expensive, reputation-damaging incidents

---

## 12. Stakeholder Analysis

| Stakeholder | How They Benefit |
|---|---|
| **Indian Coast Guard / NTRO** | Automated investigation pipeline. Faster response. Evidence-grade suspect reports for enforcement action. Dark vessel detection capability. |
| **Maritime Enforcement Agencies (global)** | Deployable at zero licensing cost. Works with free satellite data. Explainable scoring supports legal proceedings. |
| **Government Regulators** | Reliable oil spill statistics for policy decisions. MARPOL compliance monitoring. Pattern tracking across shipping lanes. |
| **Port Authorities** | Monitor bilge dumping in port approaches. Baseline chronic pollution data for environmental reporting. |
| **Offshore Platform Operators** | Detect own micro-leaks from pipelines/platforms before they escalate. Self-monitoring capability. |
| **Fishing Communities** | Cleaner fishing waters. Early warning of approaching oil contamination from forward drift forecast. |
| **Marine Conservation Organizations** | Baseline pollution data for marine protected areas. Evidence for enforcement advocacy. |
| **General Public / Environment** | Cleaner oceans. Deterrence reduces illegal dumping. Protected coastlines and marine life. |

---

## 13. What's Standard vs What's Our Innovation

| Component | Standard or Novel? | Explanation |
|---|---|---|
| SAR preprocessing | Standard | Every oil spill system does this |
| Wind validation gate | Standard | Standard physics-based check |
| Deep learning oil segmentation | Standard-ish | Newer than traditional CFAR, but published and proven |
| GLCM texture scoring | Standard | Published technique for look-alike discrimination |
| Geometric characterization | Standard | Basic computer vision operations |
| Rough age estimation (Fay) | Standard | Approximate, based on published physics |
| CFAR ship detection | Standard | Used by real maritime agencies worldwide |
| OpenDrift ensemble hindcast | Standard | Used in production by Norwegian Met Office |
| AIS traffic reconstruction | Standard | Standard data processing |
| **ML ship detection (xView3) + CFAR ensemble** | **Our improvement** | Combining ML and statistical detection for better coverage than either alone |
| **Automated SAR↔AIS matching → dark vessel flags** | **Our contribution** | Real systems do this manually with human analysts |
| **Calibrated AIS gap scoring (z-score vs baseline)** | **Novel** | No existing system does this — eliminates false accusations from normal gaps |
| **7-factor transparent scoring formula** | **Novel** | Automates what human analysts do in their heads, with full explainability |
| **Isolation Forest behavioral anomaly detection** | **Our addition** | Supplementary ML signal for detecting unusual ship behavior |
| **Fully automated end-to-end pipeline** | **Our main contribution** | No human analyst needed — satellite image in, ranked suspect list out |
| **Explainable score breakdown per vessel** | **Novel for this domain** | Every score decomposes into visible, auditable components |
| **One-click evidence PDF export** | **Our addition** | Streamlines the path from detection to enforcement |

---

## 14. Future Enhancements

These are genuine open research challenges that even mature systems like EMSA have not fully solved. We acknowledge them as future work:

| Feature | Why It's Deferred |
|---|---|
| Multi-class segmentation (oil vs look-alike vs water) | No reliable public training labels for look-alike classes exist |
| Wake kinematics (estimate ship speed from radar wake patterns) | Published results are inconsistent and unreliable in real sea conditions |
| Multi-temporal consistency check (compare slick across satellite passes) | Depends entirely on finding overlapping satellite passes — not guaranteed |
| 3D subsurface oil droplet transport modeling | Requires full baroclinic ocean model — open research problem |
| AIS identity spoofing detection | Requires radio-frequency geolocation cross-bearing, not just kinematic analysis |
| Multi-source spill disentanglement | Multiple overlapping spills in the same area is mathematically underdetermined |

---

## 15. References

1. EMSA CleanSeaNet — European Maritime Safety Agency. https://www.emsa.europa.eu/csn-menu.html
2. Zenodo Sentinel-1 SAR Oil Spill Dataset. https://zenodo.org/
3. Paolo et al. (2022). "xView3-SAR: Detecting Dark Fishing Activity Using Synthetic Aperture Radar Imagery" — NeurIPS. https://iuu.xview.us/
4. MarineCadastre AIS Data. https://marinecadastre.gov/accessais/
5. OpenDrift Lagrangian Framework. https://github.com/OpenDrift/opendrift
6. ERA5 Reanalysis — ECMWF Climate Data Store. https://cds.climate.copernicus.eu/
7. CMEMS Global Ocean Physics — Copernicus Marine. https://marine.copernicus.eu/
8. Ronneberger et al. (2015). "U-Net: Convolutional Networks for Biomedical Image Segmentation" — MICCAI
9. Lin et al. (2017). "Focal Loss for Dense Object Detection" — IEEE ICCV
10. Liu et al. (2008). "Isolation Forest" — IEEE ICDM
11. Fay, J.A. (1971). "Physical Processes in the Spreading of Oil on a Water Surface"
12. ITOPF Oil Tanker Spill Statistics. https://www.itopf.org/
13. Nature Communications (2016). "Small spill toxicity evidence." https://doi.org/10.1038/ncomms11206
14. OSERIT Oil Spill Drift Model — Copernicus Marine. https://marine.copernicus.eu/
15. Copernicus Sentinel-1 SAR Mission — ESA. https://sentinels.copernicus.eu/
