import urllib.request
import urllib.parse
import json

box = "SRID=4326;POLYGON((-95.1 29.1, -94.9 29.1, -94.9 29.3, -95.1 29.3, -95.1 29.1))"
geom_enc = urllib.parse.quote(box)
url = f"https://catalogue.dataspace.copernicus.eu/odata/v1/Products?$filter=Collection/Name eq 'SENTINEL-1' and OData.CSC.Intersects(area=geography'{geom_enc}') and ContentDate/Start ge 2023-01-01T00:00:00.000Z and ContentDate/Start le 2023-01-02T23:59:59.000Z"
url = url.replace(" ", "%20")

try:
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        products = data.get('value', [])
        for p in products:
            if 'GRD' in p.get('Name', '') and 'IW' in p.get('Name', ''):
                print(f"Name: {p.get('Name')}")
except Exception as e:
    print("Error:", e)
