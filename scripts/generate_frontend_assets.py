import os, json
import pandas as pd
import numpy as np
import rasterio
from rasterio.features import shapes
import matplotlib.pyplot as plt
from scipy.ndimage import gaussian_filter

base_dir = "artifacts/demo/ennore"
data_dir = "data/demo/ennore"
os.makedirs(base_dir, exist_ok=True)

print("1. Generating AIS Tracks and Positions...")
df = pd.read_csv(f"{data_dir}/ais/ais_tracks.csv")
df['timestamp'] = pd.to_datetime(df['BaseDateTime']).astype(np.int64) // 10**9

features = []
playback_data = {}

for mmsi, group in df.groupby('MMSI'):
    group = group.sort_values('BaseDateTime')
    
    # Store playback data
    playback_data[mmsi] = [
        {"time": int(row.timestamp), "lat": float(row.LAT), "lon": float(row.LON), "heading": float(row.Heading) if not pd.isna(row.Heading) else 0.0}
        for _, row in group.iterrows()
    ]
    
    coords = [[float(row.LON), float(row.LAT)] for _, row in group.iterrows()]
    features.append({
        "type": "Feature",
        "properties": {"mmsi": mmsi, "vessel_type": int(group.iloc[0].VesselType)},
        "geometry": {"type": "LineString", "coordinates": coords}
    })

with open(f"{base_dir}/ais_tracks.geojson", "w") as f:
    json.dump({"type": "FeatureCollection", "features": features}, f)

with open(f"{base_dir}/ais_playback.json", "w") as f:
    json.dump(playback_data, f)

print("2. Generating Slick GeoJSON...")
with rasterio.open(f"{data_dir}/ground_truth/slick_mask.tif") as src:
    mask = src.read(1)
    transform = src.transform

slick_features = []
for geom, val in shapes(mask, transform=transform):
    if val == 1:
        slick_features.append({
            "type": "Feature",
            "properties": {"class": "oil_slick"},
            "geometry": geom
        })
with open(f"{base_dir}/detected_slick.geojson", "w") as f:
    json.dump({"type": "FeatureCollection", "features": slick_features}, f)

print("3. Generating SAR Preview PNG...")
with rasterio.open(f"{data_dir}/sar/ennore_sar.tif") as src:
    vv = src.read(1)

vv_db = 10 * np.log10(np.clip(vv, 1e-4, 10))
vv_norm = (np.clip((vv_db + 20) / 25, 0, 1) * 255).astype(np.uint8)
plt.imsave(f"{base_dir}/sar_preview.png", vv_norm, cmap='gray')

print("4. Generating U-Net Probability Map (Synthetic Approximation)...")
# Apply gaussian filter to mask to simulate un-thresholded probabilities
prob_map = gaussian_filter(mask.astype(float), sigma=5)
prob_map = np.clip(prob_map / np.max(prob_map), 0, 1)

# Save with a jet/inferno colormap, applying alpha mask so background is transparent
cmap = plt.get_cmap('inferno')
rgba = cmap(prob_map)
rgba[..., 3] = np.where(prob_map > 0.05, prob_map * 0.8 + 0.2, 0)  # Make low prob transparent

plt.imsave(f"{base_dir}/u_net_probability.png", rgba)

print("5. Generating Forward Drift Forecast GeoJSON...")
# Environment data (approximate Ennore 2017)
wind_speed_ms = 4.2
wind_dir_deg = 45 # NE
current_speed_ms = 0.3
current_dir_deg = 350 # NNW

# Slick centroid approx
origin_lat = 13.23
origin_lon = 80.37

# Convert to vectors
def deg_to_uv(speed, deg):
    rad = np.radians(deg)
    # Meteorological to math: u is toward East, v is toward North
    # Wind dir 45 means FROM 45 (NE), so blowing TOWARDS 225 (SW)
    # Actually oceanographic current is usually 'towards'
    math_rad = np.radians(270 - deg) 
    return speed * np.cos(math_rad), speed * np.sin(math_rad)

# 3% wind + 100% current
uw, vw = deg_to_uv(wind_speed_ms * 0.03, wind_dir_deg + 180) # blowing towards
uc, vc = deg_to_uv(current_speed_ms, current_dir_deg)
drift_u = uw + uc
drift_v = vw + vc

# 1 degree lat is ~ 111km, 1 degree lon is ~ 111km * cos(lat)
meters_per_deg_lat = 111320
meters_per_deg_lon = 111320 * np.cos(np.radians(origin_lat))

forecast_features = []
for hours in [1, 2, 4]:
    dist_u = drift_u * (hours * 3600)
    dist_v = drift_v * (hours * 3600)
    
    center_lon = origin_lon + (dist_u / meters_per_deg_lon)
    center_lat = origin_lat + (dist_v / meters_per_deg_lat)
    
    # Generate an uncertainty ellipse (polygon)
    points = 32
    uncertainty_radius_m = hours * 500 # 500m per hour growth
    poly_coords = []
    for i in range(points + 1):
        angle = 2 * np.pi * i / points
        plon = center_lon + ((np.cos(angle) * uncertainty_radius_m) / meters_per_deg_lon)
        plat = center_lat + ((np.sin(angle) * uncertainty_radius_m) / meters_per_deg_lat)
        poly_coords.append([plon, plat])
        
    forecast_features.append({
        "type": "Feature",
        "properties": {"forecast_hours": hours, "class": "forecast_envelope"},
        "geometry": {"type": "Polygon", "coordinates": [poly_coords]}
    })

with open(f"{base_dir}/forward_forecast.geojson", "w") as f:
    json.dump({"type": "FeatureCollection", "features": forecast_features}, f)

print("Assets generated successfully.")
