import urllib.request
import urllib.parse
import json
from shapely.geometry import shape, Point

# Pelican Island Causeway Bridge, Galveston, TX
# Approx: 29.324 N, -94.810 W
target_lon, target_lat = -94.810, 29.324
target = Point(target_lon, target_lat)

filter_str = f"Collection/Name eq 'SENTINEL-1' and ContentDate/Start ge 2024-05-13T00:00:00.000Z and ContentDate/Start le 2024-05-18T23:59:59.000Z and Attributes/OData.CSC.StringAttribute/any(att:att/Name eq 'productType' and att/OData.CSC.StringAttribute/Value eq 'GRD') and Attributes/OData.CSC.StringAttribute/any(att:att/Name eq 'sensorOperationalMode' and att/OData.CSC.StringAttribute/Value eq 'IW')"

url = "https://catalogue.dataspace.copernicus.eu/odata/v1/Products?$filter=" + urllib.parse.quote(filter_str) + "&$expand=Attributes&$top=1000"

try:
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        products = data.get('value', [])
        
        found_scenes = []
        for p in products:
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
            platform, orbit, pol = "", "", ""
            for att in p.get('Attributes', []):
                if att.get('Name') == 'platformShortName': platform = att.get('Value')
                elif att.get('Name') == 'orbitDirection': orbit = att.get('Value')
                elif att.get('Name') == 'polarisationChannels': pol = att.get('Value')
            print(f"Platform: {platform}, Orbit: {orbit}, Pol: {pol}")
            print(f"Size: {p.get('ContentLength')} bytes")
            print(f"S3 Path: {p.get('S3Path', 'N/A')}")
            print("-" * 40)
            
except Exception as e:
    print("Error:", e)
