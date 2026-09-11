import os
import sys
import numpy as np
import xarray as xr
from datetime import datetime

# Ensure backend package can be imported
sys.path.append(os.getcwd())
from backend.app.worker.stages.drift import DriftEnsembleManager, EnvironmentalAdapter

def get_file_size(path):
    size_bytes = os.path.getsize(path)
    return size_bytes / (1024 * 1024)

def summarize_netcdf(name, path, var1, var2):
    print(f"\n--- {name} DATASET SUMMARY ---")
    print(f"Path: {path}")
    print(f"File Size: {get_file_size(path):.2f} MB")
    
    ds = xr.open_dataset(path)
    print(f"Dimensions: {dict(ds.dims)}")
    print(f"Coordinates: {list(ds.coords)}")
    
    v1 = ds[var1].values
    v2 = ds[var2].values
    
    print(f"Variable {var1} -> Min: {np.nanmin(v1):.3f}, Max: {np.nanmax(v1):.3f}, Mean: {np.nanmean(v1):.3f}, Std: {np.nanstd(v1):.3f}")
    print(f"Variable {var2} -> Min: {np.nanmin(v2):.3f}, Max: {np.nanmax(v2):.3f}, Mean: {np.nanmean(v2):.3f}, Std: {np.nanstd(v2):.3f}")
    print(f"Number of Valid Timesteps: {len(ds.valid_time) if hasattr(ds, "valid_time") else len(ds.time)}")
    print(f"Spatial Bounds -> Lon: [{ds.longitude.min().item():.2f}, {ds.longitude.max().item():.2f}], Lat: [{ds.latitude.min().item():.2f}, {ds.latitude.max().item():.2f}]")

def main():
    print("--- REAL ENVIRONMENTAL DRIFT VALIDATION ---")
    era5_path = "data/raw/era5/era5_wind_demo.nc"
    cmems_path = "data/raw/cmems/cmems_current_demo.nc"
    
    if not os.path.exists(era5_path) or not os.path.exists(cmems_path):
        print("[ERROR] Required environmental files missing.")
        sys.exit(1)
        
    summarize_netcdf("ERA5 WIND", era5_path, 'u10', 'v10')
    summarize_netcdf("CMEMS CURRENTS", cmems_path, 'uo', 'vo')
    
    print("\n--- DRIFT EXECUTION TEST ---")
    manager = DriftEnsembleManager(era5_path, cmems_path)
    
    # Initialize particles at an arbitrary point in the Gulf of Mexico
    init_lons = np.full(50, -89.0)
    init_lats = np.full(50, 27.0)
    start_time = datetime(2023, 1, 2, 0, 0)
    
    print(f"Starting Drift Simulation at {start_time}")
    print(f"Initial Origin: Lon -89.0, Lat 27.0")
    
    # Run 2 ensembles, 50 particles each, for 24 hours
    trajectories = manager.run_ensemble(
        init_lons, init_lats, start_time, 
        duration_hours=24, direction=1, n_runs=2, n_particles_per_run=50
    )
    
    print(f"Completed {len(trajectories)} ensemble runs.")
    for i, run in enumerate(trajectories):
        endpoints_lon = run[-1][0]
        endpoints_lat = run[-1][1]
        mean_lon = np.mean(endpoints_lon)
        mean_lat = np.mean(endpoints_lat)
        print(f"Run {i+1} Endpoints (Mean) -> Lon: {mean_lon:.4f}, Lat: {mean_lat:.4f}")
        
    heatmap, xe, ye = manager.generate_probability_heatmap(trajectories, grid_size=10)
    print(f"Probability Heatmap successfully generated with shape: {heatmap.shape}")
    print("[SUCCESS] Real drift validation completed.")

if __name__ == "__main__":
    main()
