# Phase G: Environmental Data Audit Report

An exhaustive audit of the workspace and the drift subsystem was conducted to verify environmental data readiness. 

## 1. Required Environmental Data Schemas
To properly execute the Lagrangian Drift Modeling subsystem, the following physical variables and extents are required:

### ERA5 (Wind)
- **Variables:** `u10` (10m u-component of wind), `v10` (10m v-component of wind).
- **Units:** `m/s`
- **Coordinates:** `time`, `latitude`, `longitude`
- **Spatial Coverage:** Gulf of Mexico (demonstration bounding box).
- **Temporal Coverage:** Continuous hourly slices spanning the target oil spill event.

### CMEMS / HYCOM (Currents)
- **Variables:** `uo` (eastward sea water velocity), `vo` (northward sea water velocity).
- **Units:** `m/s`
- **Coordinates:** `time`, `depth`, `latitude`, `longitude`.
- **Depth Constraints:** The adapter correctly mandates a surface-layer slice (e.g., `depth=0`) to accurately reflect surface oil transport.

## 2. Workspace File Assessment
A global filesystem scan located two NetCDF files within the `data/cached/` directories:
- `data/cached/era5/era5_wind_20250909.nc`
- `data/cached/cmems/cmems_currents_20250909.nc`

**Assessment Status:** **REJECTED (SYNTHETIC SUBSTITUTES)**
- Direct tensor inspection via `xarray` revealed these arrays consist entirely of flat, uniform values (e.g., all `u10=-3.5`, all `uo=0.5`). These are synthetic dummy files. Per project directives, synthetic substitutions are strictly prohibited for real-data physical validation. They have been correctly rejected by the audit pipeline.

## 3. Real Data Validated
- **Status:** **BLOCKED**
- Because the cached files were identified as synthetic, no genuine physical values could be validated. The `EnvironmentalAdapter` tests verifying non-zero variance and physically plausible velocities are securely suspended pending actual data.

## 4. Access & Credential Blockers
To acquire the exact subsets required without downloading massive unnecessary archives, the following credentials must be physically injected into the environment by the user:

1. **ERA5 (Copernicus Climate Data Store):**
   - **Method:** `cdsapi` Python module.
   - **Credential Blocker:** Requires a valid `~/.cdsapirc` file containing the user's UID and API Key.
2. **CMEMS (Copernicus Marine Service):**
   - **Method:** `copernicusmarine` CLI/Python module.
   - **Credential Blocker:** Requires a valid Copernicus Marine username and password exported to the environment variables or `.netrc`.

## 5. Remaining Actions
- User must supply CDS and CMEMS credentials.
- The pipeline will subsequently execute a highly localized bounding-box API request (e.g., Gulf of Mexico, single week) to retrieve the minimal genuine NetCDF subsets.
- The real data adapter validation will unblock and process the genuine variances once downloaded.
