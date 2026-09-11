import urllib.request
import urllib.parse
import json

base_url = "https://catalogue.dataspace.copernicus.eu/odata/v1/Products?$filter="
filter_str = "OData.CSC.Intersects(area=geography'SRID=4326;POINT(-89.0155 28.9252)') and ContentDate/Start ge 2023-07-01T00:00:00.000Z and ContentDate/Start le 2023-07-31T23:59:59.000Z and Collection/Name eq 'SENTINEL-1' and Attributes/OData.CSC.StringAttribute/any(att:att/Name eq 'productType' and att/OData.CSC.StringAttribute/Value eq 'GRD')"
url = base_url + urllib.parse.quote(filter_str) + "&$top=5"

try:
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        for p in data.get('value', []):
            print(f"Name: {p['Name']}")
            print(f"Start: {p['ContentDate']['Start']}")
            print("-" * 40)
except Exception as e:
    print("Error:", e)
