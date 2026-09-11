import re

with open('backend/app/api/demo.py', 'r') as f:
    content = f.read()

# Add unet_probability_asset to SarInfo
content = re.sub(
    r'(class SarInfo\(BaseModel\):\n.*?preview_asset: Optional\[str\] = None\n)',
    r'\1    unet_probability_asset: Optional[str] = None\n',
    content,
    flags=re.MULTILINE
)

# Add forward_forecast_asset to DriftInfo
content = re.sub(
    r'(class DriftInfo\(BaseModel\):\n.*?heatmap_asset: Optional\[str\] = None\n)',
    r'\1    forward_forecast_asset: Optional[str] = None\n',
    content,
    flags=re.MULTILINE
)

# Update payload structure for Sar
content = re.sub(
    r'("preview_asset": "/api/assets/artifacts/demo/ennore/sar_preview\.png",)',
    r'\1\n            "unet_probability_asset": "/api/assets/artifacts/demo/ennore/u_net_probability.png",',
    content
)

# Update payload structure for Drift
content = re.sub(
    r'("heatmap_asset": "/api/assets/artifacts/demo/ennore/drift_heatmap\.png",)',
    r'\1\n            "forward_forecast_asset": "/api/assets/artifacts/demo/ennore/forward_forecast.geojson",',
    content
)

# Update payload structure for AIS
content = re.sub(
    r'("ais": \{\n\s+"tracks_asset": "/api/assets/artifacts/demo/ennore/ais_tracks\.geojson"\n\s+\})',
    r'"ais": {\n            "tracks_asset": "/api/assets/artifacts/demo/ennore/ais_tracks.geojson",\n            "playback_asset": "/api/assets/artifacts/demo/ennore/ais_playback.json"\n        }',
    content
)

with open('backend/app/api/demo.py', 'w') as f:
    f.write(content)
