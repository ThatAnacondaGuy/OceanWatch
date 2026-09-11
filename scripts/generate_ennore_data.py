import os
import numpy as np
import pandas as pd
import rasterio
from rasterio.transform import from_bounds
import netCDF4 as nc
from datetime import datetime, timedelta

def generate_data():
    base_dir = "data/demo/ennore"
    os.makedirs(f"{base_dir}/sar", exist_ok=True)
    os.makedirs(f"{base_dir}/wind", exist_ok=True)
    os.makedirs(f"{base_dir}/current", exist_ok=True)
    os.makedirs(f"{base_dir}/ais", exist_ok=True)
    os.makedirs(f"{base_dir}/ground_truth", exist_ok=True)

    np.random.seed(42)

    src_path = "data/processed/sentinel1/gulf_20230101/s1_gulf_20230101_tc.tif"
    width, height = 1024, 1024
    min_lon, max_lon = 80.2, 80.6
    min_lat, max_lat = 13.0, 13.5
    transform = from_bounds(min_lon, min_lat, max_lon, max_lat, width, height)

    if os.path.exists(src_path):
        from rasterio.windows import Window
        with rasterio.open(src_path) as src:
            window = Window(5000, 5000, width, height)
            vv = src.read(1, window=window)
            vh = src.read(2, window=window)
            
        slick_lat_c, slick_lon_c = 13.16, 80.32
        slick_mask = np.zeros((height, width), dtype=np.uint8)

        vv_db = 10 * np.log10(np.clip(vv, 1e-4, 10))
        vh_db = 10 * np.log10(np.clip(vh, 1e-4, 10))

        for i in range(height):
            for j in range(width):
                lon, lat = transform * (j, i)
                dx = lon - slick_lon_c
                dy = lat - slick_lat_c
                dist = (dx*np.cos(0.5) + dy*np.sin(0.5))**2 / (0.015**2) + (-dx*np.sin(0.5) + dy*np.cos(0.5))**2 / (0.08**2)
                if dist <= 1.0:
                    slick_mask[i, j] = 1
                    vv_db[i, j] -= 8.0
                    vh_db[i, j] -= 8.0

        slick_noise = np.random.normal(0, 0.5, (height, width))
        vv_db[slick_mask == 1] += slick_noise[slick_mask == 1]
        vh_db[slick_mask == 1] += slick_noise[slick_mask == 1]

        vv_lin = 10 ** (vv_db / 10.0)
        vh_lin = 10 ** (vh_db / 10.0)

        sar_path = f"{base_dir}/sar/ennore_sar.tif"
        with rasterio.open(sar_path, 'w', driver='GTiff', width=width, height=height, count=2, 
                           dtype=np.float32, crs='EPSG:4326', transform=transform) as dst:
            dst.write(vv_lin.astype(np.float32), 1)
            dst.write(vh_lin.astype(np.float32), 2)
            
        with rasterio.open(f"{base_dir}/ground_truth/slick_mask.tif", 'w', driver='GTiff', width=width, height=height, count=1, 
                           dtype=np.uint8, crs='EPSG:4326', transform=transform) as dst:
            dst.write(slick_mask, 1)

    wind_path = f"{base_dir}/wind/wind_field.nc"
    rootgrp = nc.Dataset(wind_path, "w", format="NETCDF4")
    rootgrp.createDimension("time", None)
    rootgrp.createDimension("latitude", 10)
    rootgrp.createDimension("longitude", 10)
    
    times = rootgrp.createVariable("time", "f8", ("time",))
    times.units = "hours since 2017-01-28 00:00:00.0"
    lats = rootgrp.createVariable("latitude", "f4", ("latitude",))
    lons = rootgrp.createVariable("longitude", "f4", ("longitude",))
    u10 = rootgrp.createVariable("u10", "f4", ("time", "latitude", "longitude",))
    v10 = rootgrp.createVariable("v10", "f4", ("time", "latitude", "longitude",))
    
    lats[:] = np.linspace(13.0, 13.5, 10)
    lons[:] = np.linspace(80.2, 80.6, 10)
    times[:] = np.arange(0, 24, 1)
    
    u10[:] = np.full((24, 10, 10), -5.0)
    v10[:] = np.full((24, 10, 10), -2.0)
    rootgrp.close()

    curr_path = f"{base_dir}/current/current_field.nc"
    rootgrp = nc.Dataset(curr_path, "w", format="NETCDF4")
    rootgrp.createDimension("time", None)
    rootgrp.createDimension("latitude", 10)
    rootgrp.createDimension("longitude", 10)
    
    times = rootgrp.createVariable("time", "f8", ("time",))
    times.units = "hours since 2017-01-28 00:00:00.0"
    lats = rootgrp.createVariable("latitude", "f4", ("latitude",))
    lons = rootgrp.createVariable("longitude", "f4", ("longitude",))
    uo = rootgrp.createVariable("uo", "f4", ("time", "latitude", "longitude",))
    vo = rootgrp.createVariable("vo", "f4", ("time", "latitude", "longitude",))
    
    lats[:] = np.linspace(13.0, 13.5, 10)
    lons[:] = np.linspace(80.2, 80.6, 10)
    times[:] = np.arange(0, 24, 1)
    
    uo[:] = np.full((24, 10, 10), -0.1)
    vo[:] = np.full((24, 10, 10), -0.5)
    rootgrp.close()

    records = []
    
    def add_vessel_track(mmsi, start_time, start_lat, start_lon, v_lat, v_lon, vessel_type, gap_hours=None):
        for step in range(12): 
            if gap_hours and step in gap_hours:
                continue
                
            t = start_time + timedelta(hours=step)
            lat = start_lat + v_lat * step
            lon = start_lon + v_lon * step
            
            sog = np.sqrt((v_lat*111)**2 + (v_lon*111)**2) / 1.852
            cog = np.degrees(np.arctan2(v_lon, v_lat)) % 360
            
            records.append({
                'MMSI': mmsi,
                'BaseDateTime': t.strftime('%Y-%m-%dT%H:%M:%S'),
                'LAT': lat,
                'LON': lon,
                'SOG': sog,
                'COG': cog,
                'Heading': cog,
                'VesselName': f'SYNTHETIC_{mmsi}',
                'IMO': f'IMO_{mmsi}',
                'VesselType': vessel_type,
                'Length': 200,
                'Width': 30
            })
            
    base_t = datetime(2017, 1, 28, 0, 0, 0)
    
    # Drift origin is roughly 13.278 N, 80.415 E
    
    # Vessel 001 (Source) - Passes precisely at origin at 04:00 (with gap at 04:00)
    add_vessel_track('DEMO-MMSI-001', base_t, 13.340, 80.445, -0.015, -0.0075, 1004, gap_hours=[4])

    # Vessel 002 (Wrong Time + Worse Offset) 
    # Passes 13.28, 80.35 at 10:00 UTC (10 hours late)
    # At 00:00: lat = 13.28 - 10*(-0.015) = 13.43. lon = 80.35 - 10*(-0.0075) = 80.425
    add_vessel_track('DEMO-MMSI-002', base_t, 13.430, 80.425, -0.015, -0.0075, 1003)
    
    # Vessel 003 (Wrong Heading + Worse Offset)
    # Passes 13.28, 80.48 at 04:00 UTC (far to the east)
    # At 00:00: lat = 13.28 - 4*(-0.005) = 13.30. lon = 80.48 - 4*(0.015) = 80.42
    add_vessel_track('DEMO-MMSI-003', base_t, 13.300, 80.420, -0.005, 0.015, 1003)

    # Vessel 004 (Wrong Space/Location)
    add_vessel_track('DEMO-MMSI-004', base_t, 13.490, 80.590, -0.01, -0.01, 1010)
    
    df = pd.DataFrame(records)
    df.to_csv(f"{base_dir}/ais/ais_tracks.csv", index=False)

if __name__ == "__main__":
    generate_data()
