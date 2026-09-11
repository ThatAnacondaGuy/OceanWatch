import urllib.request
import urllib.parse
import json
import os
import glob

print("--- TASK 1: SENTINEL-1 CDSE QUERY ---")
# Geometry: Point at -89.02, 28.93
filter_str = "Collection/Name eq 'SENTINEL-1' and Attributes/OData.CSC.StringAttribute/any(att:att/Name eq 'productType' and att/OData.CSC.StringAttribute/Value eq 'GRD') and Attributes/OData.CSC.StringAttribute/any(att:att/Name eq 'sensorOperationalMode' and att/OData.CSC.StringAttribute/Value eq 'IW') and OData.CSC.Intersects(area=geography'SRID=4326;POINT(-89.02 28.93)') and ContentDate/Start ge 2023-07-22T00:00:00.000Z and ContentDate/Start le 2023-07-28T23:59:59.000Z"
url = "https://catalogue.dataspace.copernicus.eu/odata/v1/Products?$filter=" + urllib.parse.quote(filter_str) + "&$expand=Attributes&$top=10"

try:
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        products = data.get('value', [])
        print(f"Found {len(products)} Sentinel-1 products.")
        for p in products:
            print(f"Name: {p.get('Name')}")
            print(f"UUID: {p.get('Id')}")
            print(f"Start: {p.get('ContentDate', {}).get('Start')}")
            
            # Attributes
            platform = ""
            orbit = ""
            pol = ""
            for att in p.get('Attributes', []):
                if att.get('Name') == 'platformShortName':
                    platform = att.get('Value')
                elif att.get('Name') == 'orbitDirection':
                    orbit = att.get('Value')
                elif att.get('Name') == 'polarisationChannels':
                    pol = att.get('Value')
            print(f"Platform: {platform}, Orbit: {orbit}, Pol: {pol}")
            print(f"Footprint: {p.get('Footprint')}")
            print(f"Size: {p.get('ContentLength')} bytes")
            print("-" * 40)
except Exception as e:
    print("CDSE Query Error:", e)

print("--- TASK 2: MARINECADASTRE AIS ---")
ais_path = "data/raw/marine_cadastre/AIS_2023_07_25.csv"
if os.path.exists(ais_path):
    print(f"Found {ais_path}")
    size = os.path.getsize(ais_path)
    print(f"Size: {size/(1024*1024):.2f} MB")
else:
    print(f"Missing {ais_path}")
    # Let's search broadly
    ais_files = glob.glob("data/raw/**/*.csv", recursive=True)
    print("Available CSVs:")
    for f in ais_files:
        print(" ", f)

print("--- TASK 3 & 4: ERA5 & CMEMS ---")
era5_path = "data/raw/era5/gulf_20230725"
cmems_path = "data/raw/cmems/gulf_20230725"
if os.path.exists(era5_path):
    print(f"ERA5 directory exists: {era5_path}")
else:
    print("ERA5 directory for July 25 2023 missing.")
if os.path.exists(cmems_path):
    print(f"CMEMS directory exists: {cmems_path}")
else:
    print("CMEMS directory for July 25 2023 missing.")

