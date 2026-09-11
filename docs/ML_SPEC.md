# OceanWatch AI — ML AND ALGORITHM SPECIFICATION

## 1. OIL SPILL MODEL

Model:
Attention U-Net

Encoder:
ResNet-34 pretrained backbone

Framework:
PyTorch + segmentation-models-pytorch

Training data:
Zenodo Sentinel-1 SAR Oil Spill Dataset

Split:
70% training / 15% validation / 15% held-out test

Augmentation:
- random flip
- rotation
- elastic deformation

Loss:
Focal Loss

Target:
IoU >= 0.60 is the stated project target, not a guaranteed outcome.

Output:
- binary mask
- per-pixel confidence
- aggregate detection confidence

Training requirements:
- save checkpoints
- save training config
- save validation metrics
- save held-out test metrics
- record dataset version/hash where possible
- seed runs when feasible

## 2. WIND GATE

Run before AI inference.

Wind source:
cached ERA5.

Project rule:
reject scenes outside 2-10 m/s as a pre-inference false-alarm gate, following the supplied report.

Log:
- wind speed
- location
- timestamp
- pass/fail
- rejection reason

## 3. GLCM VALIDATION

Compute texture features for candidate slick regions.

Features:
- homogeneity
- contrast

Project combined confidence:
confidence = 0.60 * AI_detection_score
           + 0.25 * GLCM_texture_score
           + 0.15 * wind_validity

Threshold:
confidence >= 0.50 -> confirmed detection

Do not silently change these weights.

## 4. SLICK GEOMETRY

Compute:
- area
- perimeter
- elongation ratio
- fragment count
- orientation angle

Tools:
Shapely + OpenCV

## 5. SHIP DETECTION

Stage 1:
CFAR generates candidate RoIs across the SAR scene.

Stage 2:
YOLOv8 processes candidate crops.

Training/reference:
xView3 labels/dataset.

Output:
- ship detections
- confidence
- bounding geometry
- scene coordinates

Do not call CFAR a trainable neural network.

## 6. DRIFT MODEL

Engine:
OpenDrift/OpenOil

Inputs:
- cached wind
- cached currents
- slick geometry
- age bound
- SST/history where available

Oil velocity:
U_oil = U_current + 0.03 * U_wind

Backward:
- reverse advection
- expanding uncertainty
- do not naïvely reverse stochastic diffusion

Monte Carlo:
20-50 ensemble simulations (project design target)

Perturbations:
- wind speed ±10%
- wind direction ±15°
- current speed ±10%
- diffusion coefficient ±50%

Parameters:
- time step 15 minutes
- 500-1000 particles seeded along slick boundary
- output every hour

Outputs:
- origin probability heatmap
- release time window
- high probability origin envelope
- forward 24-72 hour forecast

## 7. AGE / WEATHERING

Use ADIOS/Fay-style weathering/spreading approach with SST and historical wind/current forcing as described by the report.

Do not claim exact age if the available data only supports an estimate.

## 8. AIS RECONSTRUCTION

Demo:
MarineCadastre

Production adapter:
interface for DG Shipping / NAIS / ICG / commercial satellite AIS.

Features:
- ship name
- MMSI
- IMO
- vessel type
- flag
- latitude
- longitude
- SOG
- COG
- heading
- draught
- timestamp

Trajectory:
- interpolate points
- construct continuous track
- filter irrelevant small craft as defined in the report

## 9. RADAR <-> AIS MATCHING

At scene timestamp:
- interpolate AIS position
- nearest vessel match within approximately 2 km

Cases:
- matched
- radar-only -> dark vessel
- AIS-only -> possible size/coverage/spoofing explanation; do not automatically accuse

## 10. ISOLATION FOREST

Train on the broader vessel population for the region/time window.

Features:
- speed variance
- heading variance
- max AIS gap
- gap count >10 min
- speed drops >5 knots
- route deviation
- loitering duration outside anchorage

Output:
anomaly score from 0 to 1

Record model/config for reproducibility.

## 11. 7-FACTOR ATTRIBUTION

Score(ship) =
0.20*S_spatial
+ 0.15*S_temporal
+ 0.15*S_heading
+ 0.15*S_gap
+ 0.10*P_type
+ 0.10*S_anomaly
+ 0.15*S_dark

Factors:
1. spatial
2. temporal
3. heading
4. AIS gap
5. vessel type
6. behavioral anomaly
7. dark-vessel status

AIS gap:
compare against all vessels in same region/time period.
Use the report's calibrated z-score/CDF approach.

Do not automatically equate any AIS gap with guilt.

Normalize:
P(ship_i) = Score(ship_i) / sum(Score(all_ships))

UI must display the factor breakdown.

## 12. VALIDATION

Implement synthetic validation:
- real/demo AIS background
- known oil origin
- injected synthetic guilty trajectory
- run full pipeline
- record top-k rank
- repeat 50+ times where compute permits

Report metric:
% of trials where true source ranked in top 3

Do not invent a final percentage before experiments are run.
