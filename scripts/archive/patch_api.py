import re

with open('backend/app/api/demo.py', 'r') as f:
    content = f.read()

# Add sar.preview_asset
content = re.sub(
    r'"asset_path": "/api/assets/data/demo/ennore/sar/ennore_sar.tif",',
    '"asset_path": "/api/assets/data/demo/ennore/sar/ennore_sar.tif",\n            "preview_asset": "/api/assets/artifacts/demo/ennore/sar_preview.png",',
    content
)

# Add slick.geojson_asset
content = re.sub(
    r'"centroid": {"lat": scenario_meta\["slick"\]\["lat"\], "lon": scenario_meta\["slick"\]\["lon"\]},',
    '"centroid": {"lat": scenario_meta["slick"]["lat"], "lon": scenario_meta["slick"]["lon"]},\n            "geojson_asset": "/api/assets/artifacts/demo/ennore/detected_slick.geojson",',
    content
)

# Add ais block before attribution
ais_block = """        "ais": {
            "tracks_asset": "/api/assets/artifacts/demo/ennore/ais_tracks.geojson"
        },
        "attribution": {"""
content = content.replace('"attribution": {', ais_block)

with open('backend/app/api/demo.py', 'w') as f:
    f.write(content)
