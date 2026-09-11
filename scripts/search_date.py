import urllib.request
import urllib.parse
import json

filter_str = "Collection/Name eq 'SENTINEL-1' and ContentDate/Start ge 2023-07-25T00:00:00.000Z and ContentDate/Start le 2023-07-25T23:59:59.000Z and Attributes/OData.CSC.StringAttribute/any(att:att/Name eq 'productType' and att/OData.CSC.StringAttribute/Value eq 'GRD')"
url = "https://catalogue.dataspace.copernicus.eu/odata/v1/Products?$filter=" + urllib.parse.quote(filter_str) + "&$top=1000"

try:
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        products = data.get('value', [])
        
        # Now locally filter for the coordinate
        target_lon, target_lat = -89.02, 28.93
        found = False
        for p in products:
            # simple string check on footprint to see if it's near our lon/lat
            name = p.get('Name')
            # The footprint is in p['GeoFootprint'] or similar. Usually OData returns it if we ask, or it's in the response.
            # Let's just print names that have '1SDV' to narrow it down, and we can fetch metadata later.
            if '1SDV' in name:
                print(name)
except Exception as e:
    print("Error:", e)
