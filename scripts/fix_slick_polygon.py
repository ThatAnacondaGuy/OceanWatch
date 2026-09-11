import json
import rasterio
from rasterio.features import shapes
import numpy as np
from shapely.geometry import shape, MultiPolygon

with rasterio.open("artifacts/demo/ennore/u_net_probability.tif") as src:
    prob = src.read(1)
    transform = src.transform
    crs = src.crs

mask = (prob > 0.5).astype(np.uint8)

polygons = []
for geom, val in shapes(mask, mask=(mask>0), transform=transform):
    polygons.append(shape(geom))

if not polygons:
    print("No polygon found!")
else:
    multipoly = MultiPolygon(polygons)
    # Get the largest polygon
    largest_poly = max(multipoly.geoms, key=lambda p: p.area)
    
    # Check if coords are in standard Lon, Lat
    # Shapely gives coords as (x, y) which is (Lon, Lat) based on standard affine transform
    
    geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {"class": "oil_slick"},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [list(largest_poly.exterior.coords)]
                }
            }
        ]
    }
    
    with open("artifacts/demo/ennore/detected_slick.geojson", "w") as f:
        json.dump(geojson, f)
    
    print(f"Saved detected_slick.geojson with centroid: {largest_poly.centroid.y}, {largest_poly.centroid.x}")

