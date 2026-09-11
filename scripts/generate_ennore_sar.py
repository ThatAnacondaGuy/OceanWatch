import rasterio
from rasterio.windows import Window
from rasterio.transform import from_bounds
import numpy as np

# Load real Gulf SAR as background
src_path = "data/processed/sentinel1/gulf_20230101/s1_gulf_20230101_tc.tif"

with rasterio.open(src_path) as src:
    # Read a random 1000x800 patch of open ocean
    # Let's say window starting at col 5000, row 5000
    window = Window(5000, 5000, 800, 1000)
    vv = src.read(1, window=window)
    vh = src.read(2, window=window)

width, height = 800, 1000
min_lon, max_lon = 80.2, 80.6
min_lat, max_lat = 13.0, 13.5
transform = from_bounds(min_lon, min_lat, max_lon, max_lat, width, height)

# Draw slick (around 13.155 N, 80.335 E)
slick_lat_c, slick_lon_c = 13.155, 80.335
slick_mask = np.zeros((height, width), dtype=np.uint8)

# Convert vv, vh to dB for subtraction
vv_db = 10 * np.log10(np.clip(vv, 1e-4, 10))
vh_db = 10 * np.log10(np.clip(vh, 1e-4, 10))

for i in range(height):
    for j in range(width):
        lon, lat = transform * (j, i)
        dx = lon - slick_lon_c
        dy = lat - slick_lat_c
        dist = (dx*np.cos(0.5) + dy*np.sin(0.5))**2 / (0.01**2) + (-dx*np.sin(0.5) + dy*np.cos(0.5))**2 / (0.04**2)
        if dist <= 1.0:
            slick_mask[i, j] = 1
            vv_db[i, j] -= 8.0  # darken
            vh_db[i, j] -= 8.0

# Add noise inside the slick so it's not perfectly flat
slick_noise = np.random.normal(0, 0.5, (height, width))
vv_db[slick_mask == 1] += slick_noise[slick_mask == 1]
vh_db[slick_mask == 1] += slick_noise[slick_mask == 1]

# Revert to linear
vv_lin = 10 ** (vv_db / 10.0)
vh_lin = 10 ** (vh_db / 10.0)

base_dir = "data/demo/ennore"
sar_path = f"{base_dir}/sar/ennore_sar.tif"
with rasterio.open(sar_path, 'w', driver='GTiff', width=width, height=height, count=2, 
                   dtype=np.float32, crs='EPSG:4326', transform=transform) as dst:
    dst.write(vv_lin.astype(np.float32), 1)
    dst.write(vh_lin.astype(np.float32), 2)
    
with rasterio.open(f"{base_dir}/ground_truth/slick_mask.tif", 'w', driver='GTiff', width=width, height=height, count=1, 
                   dtype=np.uint8, crs='EPSG:4326', transform=transform) as dst:
    dst.write(slick_mask, 1)

print("Generated SAR with real speckle.")
