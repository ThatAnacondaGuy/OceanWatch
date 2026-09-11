import numpy as np
import xarray as xr
import pytest
from datetime import datetime, timedelta
from backend.app.worker.stages.drift import LagrangianDriftModel, DriftEnsembleManager, EnvironmentalAdapter, OutOfBoundsError

def generate_synthetic_netcdf(path, is_0_360=False, has_depth=False):
    lons = np.linspace(0, 10, 11) if is_0_360 else np.linspace(-5, 5, 11)
    lats = np.linspace(20, 30, 11) # ascending
    times = pd.date_range("2023-01-01", periods=3, freq="h")
    
    # Create distinct U and V gradients for testing spatial interp
    U = np.zeros((len(times), len(lats), len(lons)))
    V = np.zeros((len(times), len(lats), len(lons)))
    
    for t in range(len(times)):
        for i, lat in enumerate(lats):
            for j, lon in enumerate(lons):
                # Spatial gradient: U increases with lon, V increases with lat
                # Temporal gradient: Add +1 per hour
                U[t, i, j] = lon + t 
                V[t, i, j] = lat + t
                
    coords = {'time': times, 'lat': lats, 'lon': lons}
    dims = ['time', 'lat', 'lon']
    
    if has_depth:
        depths = [0, 10, 50]
        U = np.stack([U, U*0.5, U*0.1], axis=1) # decreasing current with depth
        V = np.stack([V, V*0.5, V*0.1], axis=1)
        coords['depth'] = depths
        dims = ['time', 'depth', 'lat', 'lon']

    ds = xr.Dataset(
        data_vars=dict(
            u10=(dims, U),
            v10=(dims, V)
        ),
        coords=coords
    )
    ds.to_netcdf(path)

import pandas as pd
import os

def test_environmental_interpolation_and_bounds():
    print("Testing genuine spatial/temporal interpolation and out-of-bounds handling...")
    nc_path = "tests/fixtures/sync_era5.nc"
    os.makedirs("tests/fixtures", exist_ok=True)
    generate_synthetic_netcdf(nc_path, is_0_360=False, has_depth=False)
    
    adapter = EnvironmentalAdapter(nc_path, 'u10', 'v10')
    
    # 1. Exact node match at t=0
    u, v = adapter.get_velocity([0.0], [25.0], datetime(2023, 1, 1, 0, 0, 0))
    assert np.isclose(u[0], 0.0), f"Expected U=0.0, got {u[0]}"
    assert np.isclose(v[0], 25.0), f"Expected V=25.0, got {v[0]}"
    
    # 2. Spatial Interpolation (lon=0.5, lat=25.5 at t=0)
    u, v = adapter.get_velocity([0.5], [25.5], datetime(2023, 1, 1, 0, 0, 0))
    assert np.isclose(u[0], 0.5), f"Spatial interp U failed: {u[0]}"
    assert np.isclose(v[0], 25.5), f"Spatial interp V failed: {v[0]}"
    
    # 3. Temporal Interpolation (lon=0.0, lat=25.0 at t=0.5h) -> +0.5 to U and V
    u, v = adapter.get_velocity([0.0], [25.0], datetime(2023, 1, 1, 0, 30, 0))
    assert np.isclose(u[0], 0.5), f"Temporal interp U failed: {u[0]}"
    assert np.isclose(v[0], 25.5), f"Temporal interp V failed: {v[0]}"
    
    # 4. Out of bounds (Space)
    try:
        adapter.get_velocity([15.0], [25.0], datetime(2023, 1, 1, 0, 0, 0))
        assert False, "Should raise OutOfBoundsError for lon=15.0"
    except OutOfBoundsError:
        pass
        
    # 5. Out of bounds (Time)
    try:
        adapter.get_velocity([0.0], [25.0], datetime(2024, 1, 1, 0, 0, 0))
        assert False, "Should raise OutOfBoundsError for time=2024"
    except OutOfBoundsError:
        pass
        
    print("[PASS] Interpolation and Boundary Checks Passed.")

def test_longitude_wrapping_and_depth():
    print("Testing longitude 0..360 wrapping and CMEMS surface-depth selection...")
    nc_path = "tests/fixtures/sync_cmems.nc"
    # Create 0..360 dataset with depth
    generate_synthetic_netcdf(nc_path, is_0_360=True, has_depth=True)
    
    adapter = EnvironmentalAdapter(nc_path, 'u10', 'v10')
    
    # Coordinate provided as -355.0 (which is +5.0 in 0..360)
    u, v = adapter.get_velocity([-355.0], [25.0], datetime(2023, 1, 1, 0, 0, 0))
    assert np.isclose(u[0], 5.0), f"Lon wrapping failed. U={u[0]}"
    
    # Check depth selection (it should use depth=0 automatically, U should not be halved)
    assert np.isclose(u[0], 5.0), f"Depth extraction failed (got non-surface value). U={u[0]}"
    print("[PASS] Lon Wrapping and Depth Selection Passed.")

class MockAdapter:
    def __init__(self, u, v):
        self.u = u
        self.v = v
        self.has_data = True
    def get_velocity(self, lons, lats, time):
        return np.full_like(lons, self.u), np.full_like(lats, self.v)

def test_lagrangian_advection():
    print("Testing mathematical Lagrangian advection step...")
    curr_adapter = MockAdapter(1.0, 0.0)
    wind_adapter = MockAdapter(0.0, 10.0)
    model = LagrangianDriftModel(wind_adapter, curr_adapter, dt_seconds=3600, diffusion_coeff=0.0)
    lons, lats = np.array([-90.0]), np.array([28.0])
    time = datetime(2023, 1, 1)
    
    new_lons, new_lats = model.advect_particles(lons, lats, time, direction=1)
    
    lat_rad = np.radians(28.0)
    expected_lon = -90.0 + 3600.0 / (111320.0 * np.cos(lat_rad))
    expected_lat = 28.0 + (10.0 * 0.03 * 3600.0) / 111320.0
    
    assert np.isclose(new_lons[0], expected_lon)
    assert np.isclose(new_lats[0], expected_lat)
    print("[PASS] Forward Advection Math Passed.")

if __name__ == "__main__":
    test_environmental_interpolation_and_bounds()
    test_longitude_wrapping_and_depth()
    test_lagrangian_advection()
    print("All Phase E Corrector Tests Passed.")
