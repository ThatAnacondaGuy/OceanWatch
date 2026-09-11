import urllib.request
import urllib.parse
import json

box = "SRID=4326;POLYGON((-89.1 28.9, -88.9 28.9, -88.9 29.1, -89.1 29.1, -89.1 28.9))"
geom_enc = urllib.parse.quote(box)
url = f"https://catalogue.dataspace.copernicus.eu/odata/v1/Products?$filter=Collection/Name eq 'SENTINEL-1' and OData.CSC.Intersects(area=geography'{geom_enc}') and ContentDate/Start ge 2023-07-22T00:00:00.000Z and ContentDate/Start le 2023-07-28T23:59:59.000Z"
url = url.replace(" ", "%20")
print("URL:", url)

try:
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        products = data.get('value', [])
        for p in products:
            if 'GRD' in p.get('Name', '') and 'IW' in p.get('Name', ''):
                print(f"Name: {p.get('Name')}")
                print(f"UUID: {p.get('Id')}")
                print(f"Start: {p.get('ContentDate', {}).get('Start')}")
                print("-" * 40)
except Exception as e:
    print("Error:", e)
