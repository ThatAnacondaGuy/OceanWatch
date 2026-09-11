# Phase E: Drift Modeling Implementation & Validation Report

## 1. Subsystem Architecture
The Oil Drift Hindcast and Plume Forecast subsystem has been successfully designed and validated.

### OpenDrift Fallback
**Status:** **CUSTOM LAGRANGIAN ENGINE ACTIVE**
- *Reasoning:* OpenDrift (and its OpenOil module) relies heavily on a complex stack of NetCDF C-libraries, `basemap`, and specialized environment compilers that are historically unstable when deployed natively via pip on Apple Silicon (M-series ARM64) without Conda. To guarantee deterministic execution and cross-platform reliability, the documented physics-equivalent 2D Lagrangian particle tracker was implemented in native NumPy.

### Core Implementation Features
- **Velocity Model:** Computes physical displacement exactly as $U_{oil} = U_{current} + 0.03 \times U_{wind}$ at each temporal step.
- **Backward Hindcasting:** Calculates reverse trajectories by inverting the advective velocity fields. Crucially, the stochastic diffusion matrix (random walk) is *added* rather than subtracted during reverse steps. This mathematically reproduces the necessary expanding spatial uncertainty cone of the origin coordinate.
- **Monte Carlo Ensemble Generator:**
  - Designed to support 20-50 localized runs and 500-1,000 particles per run.
  - Automatically perturbs environmental parameters per-ensemble using uniformly distributed scale offsets:
    - Wind Speed: $\pm 10\%$
    - Wind Direction: $\pm 15^{\circ}$
    - Current Speed: $\pm 10\%$
    - Diffusion Coefficient: $\pm 50\%$
- **Temporal Output:** Operates on a continuous 15-minute integration timestep ($dt=900s$) but emits bounding state arrays dynamically synchronized to the top of the hour.
- **Aggregations:** Maps particle endpoints into high-resolution spatial 2D histograms (heatmaps) representing the origin probability and forward forecast plume extents.

## 2. Environmental Adapters
- A generic `EnvironmentalAdapter` interface is provided in `backend/app/worker/stages/drift.py`. It is built atop `xarray` and is designed to accept physical ERA5 (`u10`, `v10`) and CMEMS/HYCOM (`uo`, `vo`) NetCDF files.
- **Data Status:** The real environmental data acquisition remains blocked by Copernicus API credentials. No synthetic NetCDFs were fabricated to mimic this execution path.

## 3. Testing and Mathematical Validation
Controlled software tests were executed strictly isolated from the real-data inference path:
1. **`test_lagrangian_advection()`:** Mathematically validated the forward translation algebra combining a simulated 1.0 m/s eastward current with a 10.0 m/s northward wind. The $U_{oil}$ vectors perfectly matched the physical expectations.
2. **`test_backward_diffusion()`:** Confirmed that running a backward model with a pure zero-current/wind field produces a spatially expanding Gaussian distribution of particle probability.
3. **`test_ensemble_manager()`:** Successfully executed multiple runs and generated the combined 2D heatmap output format using controlled perturbations.

**Status:** The Drift Modeling Subsystem is algorithmically verified and ready for real ERA5/CMEMS NetCDF integration.
