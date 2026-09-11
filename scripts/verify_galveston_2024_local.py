import urllib.request
import urllib.parse
import json
from shapely.geometry import shape, Point

target_lon, target_lat = -94.810, 29.324
target = Point(target_lon, target_lat)

filter_str = "Collection/Name eq 'SENTINEL-1' and ContentDate/Start ge 2024-05-15T00:00:00.000Z and ContentDate/Start le 2024-05-30T23:59:59.000Z"
url = "https://catalogue.dataspace.copernicus.eu/odata/v1/Products?$filter=" + urllib.parse.quote(filter_str) + "&$expand=Attributes&$top=1000"

try:
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        products = data.get('value', [])
        
        found_scenes = []
        for p in products:
            if 'GRD' not in p.get('Name', '') or 'IW' not in p.get('Name', ''):
                continue
                
            footprint = p.get('GeoFootprint')
            if not footprint:
                continue
                
            geom = shape(footprint)
            if geom.intersects(target):
                found_scenes.append(p)
                
        print(f"Found {len(found_scenes)} matching scenes containing the exact coordinates.")
        for p in found_scenes:
            print(f"Name: {p.get('Name')}")
            print(f"UUID: {p.get('Id')}")
            print(f"Start: {p.get('ContentDate', {}).get('Start')}")
            print(f"Size: {p.get('ContentLength')} bytes")
            print(f"S3 Path: {p.get('S3Path', 'N/A')}")
            print("-" * 40)
            
except Exception as e:
    print("Error:", e)
