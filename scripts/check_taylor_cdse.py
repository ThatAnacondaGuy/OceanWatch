import urllib.request
import urllib.parse
import json

box = "POLYGON((-89.1 28.9, -88.9 28.9, -88.9 29.1, -89.1 29.1, -89.1 28.9))"
filter_str = f"Collection/Name eq 'SENTINEL-1' and OData.CSC.Intersects(area=geography'{box}') and ContentDate/Start ge 2023-07-22T00:00:00.000Z and ContentDate/Start le 2023-07-28T23:59:59.000Z and Attributes/OData.CSC.StringAttribute/any(att:att/Name eq 'productType' and att/OData.CSC.StringAttribute/Value eq 'GRD') and Attributes/OData.CSC.StringAttribute/any(att:att/Name eq 'sensorOperationalMode' and att/OData.CSC.StringAttribute/Value eq 'IW')"

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
            platform, orbit, pol = "", "", ""
            for att in p.get('Attributes', []):
                if att.get('Name') == 'platformShortName': platform = att.get('Value')
                elif att.get('Name') == 'orbitDirection': orbit = att.get('Value')
                elif att.get('Name') == 'polarisationChannels': pol = att.get('Value')
            print(f"Platform: {platform}, Orbit: {orbit}, Pol: {pol}")
            print(f"Size: {p.get('ContentLength')} bytes")
            print("-" * 40)
except Exception as e:
    print("CDSE Query Error:", e)
    print("URL used:", url)
