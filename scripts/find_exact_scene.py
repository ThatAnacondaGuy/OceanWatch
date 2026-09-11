import urllib.request
import urllib.parse
import json
from shapely.geometry import shape, Point

filter_str = "Collection/Name eq 'SENTINEL-1' and ContentDate/Start ge 2023-07-22T00:00:00.000Z and ContentDate/Start le 2023-07-28T23:59:59.000Z and Attributes/OData.CSC.StringAttribute/any(att:att/Name eq 'productType' and att/OData.CSC.StringAttribute/Value eq 'GRD')"
url = "https://catalogue.dataspace.copernicus.eu/odata/v1/Products?$filter=" + urllib.parse.quote(filter_str) + "&$expand=Attributes&$top=1000"

target = Point(-89.02, 28.93)

try:
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        products = data.get('value', [])
        
        found = False
        for p in products:
            footprint = p.get('GeoFootprint')
            if not footprint:
                continue
                
            geom = shape(footprint)
            if geom.intersects(target):
                print("FOUND SCENE!")
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
                print("-" * 40)
                found = True
        
        if not found:
            print("No scene intersects the target.")
            
except Exception as e:
    print("Error:", e)
