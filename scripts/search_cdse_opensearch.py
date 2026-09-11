import urllib.request
import json
url = "https://catalogue.dataspace.copernicus.eu/resto/api/collections/Sentinel1/search.json?box=-89.1,28.8,-88.9,29.0&startDate=2023-07-01T00:00:00Z&completionDate=2023-07-31T23:59:59Z&productType=GRD&maxRecords=5"
try:
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        for p in data.get('features', []):
            prop = p.get('properties', {})
            print(f"Name: {prop.get('title')}")
            print(f"Start: {prop.get('startDate')}")
            print("-" * 40)
except Exception as e:
    print("Error:", e)
