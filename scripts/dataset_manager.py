import os
import json
import numpy as np
import rasterio
from rasterio.transform import from_origin
import pandas as pd
import xarray as xr
from datetime import datetime, timedelta
import cv2

DATA_DIR = "data"

def create_synthetic_zenodo():
    print("Generating minimal synthetic Zenodo SAR data...")
    img_dir = os.path.join(DATA_DIR, "raw", "zenodo", "images")
    mask_dir = os.path.join(DATA_DIR, "raw", "zenodo", "masks")
    os.makedirs(img_dir, exist_ok=True)
    os.makedirs(mask_dir, exist_ok=True)
    
    for i in range(5):
        # Image: 256x256 noise
        img = np.random.randint(50, 150, (256, 256), dtype=np.uint8)
        mask = np.zeros((256, 256), dtype=np.uint8)
        # Draw a synthetic slick
        cv2.ellipse(img, (128, 128), (40, 10), 45, 0, 360, 30, -1)
        cv2.ellipse(mask, (128, 128), (40, 10), 45, 0, 360, 1, -1)
        
        cv2.imwrite(os.path.join(img_dir, f"img_{i}.png"), img)
        cv2.imwrite(os.path.join(mask_dir, f"img_{i}.png"), mask)
    print("  -> Created 5 Zenodo-like chips")

def create_synthetic_xview3():
    print("Generating minimal synthetic xView3 scene...")
    scene_dir = os.path.join(DATA_DIR, "raw", "xview3")
    os.makedirs(scene_dir, exist_ok=True)
    
    # Generate 1024x1024 GeoTIFF (VV and VH)
    vv = np.random.normal(-20, 5, (1024, 1024)).astype(np.float32)
    vh = np.random.normal(-25, 5, (1024, 1024)).astype(np.float32)
    
    # Add a ship
    vv[510:515, 510:515] += 30  # bright metallic reflection
    vh[510:515, 510:515] += 25
    
    transform = from_origin(71.4, 18.4, 0.0001, 0.0001)  # Approx 10m res
    
    tiff_path = os.path.join(scene_dir, "scene_1.tif")
    with rasterio.open(
        tiff_path, 'w', driver='GTiff',
        height=1024, width=1024, count=2, dtype=str(vv.dtype),
        crs='+proj=latlong', transform=transform,
    ) as dst:
        dst.write(vv, 1)
        dst.write(vh, 2)
        dst.update_tags(1, POLARIZATION='VV')
        dst.update_tags(2, POLARIZATION='VH')

    # CSV label
    pd.DataFrame({
        'scene_id': ['scene_1'],
        'lat': [18.3488],  # matches grid approx
        'lon': [71.4510],
        'is_vessel': [True],
        'vessel_length_m': [150],
        'confidence': ['HIGH']
    }).to_csv(os.path.join(scene_dir, "labels.csv"), index=False)
    print("  -> Created xView3 synthetic GeoTIFF and labels")

def create_synthetic_ais():
    print("Generating minimal synthetic MarineCadastre AIS data...")
    out_dir = os.path.join(DATA_DIR, "demo", "ais")
    os.makedirs(out_dir, exist_ok=True)
    
    times = [datetime(2025, 9, 9, 10, 0) + timedelta(minutes=15*i) for i in range(10)]
    # A single vessel moving nearby
    df = pd.DataFrame({
        'MMSI': ['419876543'] * 10,
        'BaseDateTime': [t.isoformat() for t in times],
        'LAT': np.linspace(18.31, 18.40, 10),
        'LON': np.linspace(71.42, 71.50, 10),
        'SOG': [12.4] * 10,
        'COG': [45.0] * 10,
        'Heading': [45.0] * 10,
        'VesselName': ['MV Ocean Star'] * 10,
        'IMO': ['9876543'] * 10,
        'CallSign': ['9VXYZ'] * 10,
        'VesselType': ['1004'] * 10  # Freight
    })
    df.to_csv(os.path.join(out_dir, "AIS_2025_09_09.csv"), index=False)
    print("  -> Created MarineCadastre synthetic CSV")

def create_synthetic_forcing():
    print("Generating minimal synthetic ERA5 and CMEMS NetCDF...")
    era5_dir = os.path.join(DATA_DIR, "cached", "era5")
    cmems_dir = os.path.join(DATA_DIR, "cached", "cmems")
    os.makedirs(era5_dir, exist_ok=True)
    os.makedirs(cmems_dir, exist_ok=True)
    
    lon = np.linspace(71.0, 72.0, 10)
    lat = np.linspace(18.0, 19.0, 10)
    time = pd.date_range("2025-09-08", periods=24, freq="h")
    
    # ERA5 Wind (uniform 5 m/s NE)
    u10 = np.full((len(time), len(lat), len(lon)), -3.5)
    v10 = np.full((len(time), len(lat), len(lon)), -3.5)
    
    ds_era5 = xr.Dataset(
        data_vars=dict(
            u10=(["time", "latitude", "longitude"], u10),
            v10=(["time", "latitude", "longitude"], v10),
        ),
        coords=dict(longitude=lon, latitude=lat, time=time),
    )
    ds_era5.to_netcdf(os.path.join(era5_dir, "era5_wind_20250909.nc"))
    
    # CMEMS Currents (uniform 0.5 m/s E)
    uo = np.full((len(time), len(lat), len(lon)), 0.5)
    vo = np.full((len(time), len(lat), len(lon)), 0.0)
    
    ds_cmems = xr.Dataset(
        data_vars=dict(
            uo=(["time", "latitude", "longitude"], uo),
            vo=(["time", "latitude", "longitude"], vo),
        ),
        coords=dict(longitude=lon, latitude=lat, time=time),
    )
    ds_cmems.to_netcdf(os.path.join(cmems_dir, "cmems_currents_20250909.nc"))
    print("  -> Created synthetic NetCDF caches")

if __name__ == "__main__":
    print("--- OCEANWATCH AI: DATASET MANAGER ---")
    create_synthetic_zenodo()
    create_synthetic_xview3()
    create_synthetic_ais()
    create_synthetic_forcing()
    print("--- MINIMAL SUBSET GENERATION COMPLETE ---")
