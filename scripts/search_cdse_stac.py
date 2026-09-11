import urllib.request
import json
url = "https://catalogue.dataspace.copernicus.eu/stac/search"
payload = {
    "bbox": [-89.1, 28.8, -88.9, 29.0],
    "datetime": "2023-07-01T00:00:00Z/2023-07-31T23:59:59Z",
    "collections": ["SENTINEL-1"],
    "limit": 5
}
try:
    req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        for f in data.get('features', []):
            prop = f.get('properties', {})
            print(f"ID: {f.get('id')}")
            print(f"Start: {prop.get('datetime')}")
            print("-" * 40)
except Exception as e:
    print("Error:", e)
