import rasterio
from rasterio.windows import Window
from rasterio.transform import from_bounds
import numpy as np

src_path = "data/processed/sentinel1/gulf_20230101/s1_gulf_20230101_tc.tif"

with rasterio.open(src_path) as src:
    window = Window(5000, 5000, 1024, 1024)
    vv = src.read(1, window=window)
    vh = src.read(2, window=window)

width, height = 1024, 1024
min_lon, max_lon = 80.2, 80.6
min_lat, max_lat = 13.0, 13.5
transform = from_bounds(min_lon, min_lat, max_lon, max_lat, width, height)

slick_lat_c, slick_lon_c = 13.155, 80.335
slick_mask = np.zeros((height, width), dtype=np.uint8)

vv_db = 10 * np.log10(np.clip(vv, 1e-4, 10))
vh_db = 10 * np.log10(np.clip(vh, 1e-4, 10))

for i in range(height):
    for j in range(width):
        lon, lat = transform * (j, i)
        dx = lon - slick_lon_c
        dy = lat - slick_lat_c
        # Bigger slick!
        dist = (dx*np.cos(0.5) + dy*np.sin(0.5))**2 / (0.02**2) + (-dx*np.sin(0.5) + dy*np.cos(0.5))**2 / (0.08**2)
        if dist <= 1.0:
            slick_mask[i, j] = 1
            vv_db[i, j] -= 8.0
            vh_db[i, j] -= 8.0

slick_noise = np.random.normal(0, 0.5, (height, width))
vv_db[slick_mask == 1] += slick_noise[slick_mask == 1]
vh_db[slick_mask == 1] += slick_noise[slick_mask == 1]

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

print("Generated 1024x1024 SAR with bigger slick.")
