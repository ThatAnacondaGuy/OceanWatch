import urllib.request
import json
import urllib.parse
from datetime import datetime

box = "POLYGON((-89.5 28.8, -88.5 28.8, -88.5 29.5, -89.5 29.5, -89.5 28.8))"

filter_str = f"Collection/Name eq 'SENTINEL-1' and Attributes/OData.CSC.StringAttribute/any(att:att/Name eq 'productType' and att/OData.CSC.StringAttribute/Value eq 'GRD') and Attributes/OData.CSC.StringAttribute/any(att:att/Name eq 'sensorOperationalMode' and att/OData.CSC.StringAttribute/Value eq 'IW') and OData.CSC.Intersects(area=geography'{box}') and ContentDate/Start ge 2023-11-16T00:00:00.000Z and ContentDate/Start le 2023-11-20T23:59:59.000Z"

url = "https://catalogue.dataspace.copernicus.eu/odata/v1/Products?$filter=" + urllib.parse.quote(filter_str) + "&$top=10"

try:
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        for p in data.get('value', []):
            print(f"Name: {p['Name']}")
            print(f"Start: {p['ContentDate']['Start']}")
            print(f"Id: {p['Id']}")
            print("-" * 40)
except Exception as e:
    print("Error:", e)
