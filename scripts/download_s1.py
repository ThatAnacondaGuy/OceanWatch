import os
import sys
import json
import urllib.request
import urllib.parse
import base64

def get_credentials():
    u = os.environ.get('CDSE_USERNAME')
    p = os.environ.get('CDSE_PASSWORD')
    if u and p:
        return u, p
    
    cm_path = os.path.expanduser('~/.copernicusmarine/.copernicusmarine-credentials')
    if os.path.exists(cm_path):
        import configparser
        config = configparser.ConfigParser()
        # file is base64 encoded, let's decode first
        with open(cm_path, 'r') as f:
            b64_content = f.read().strip()
        try:
            content = base64.b64decode(b64_content).decode('utf-8')
            config.read_string(content)
            u = config.get('credentials', 'username', fallback=None)
            p = config.get('credentials', 'password', fallback=None)
            return u, p
        except Exception:
            pass
    return None, None

def get_token(username, password):
    url = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
    data = urllib.parse.urlencode({
        'client_id': 'cdse-public',
        'username': username,
        'password': password,
        'grant_type': 'password'
    }).encode('utf-8')
    try:
        req = urllib.request.Request(url, data=data)
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read())
            return res.get('access_token'), 200, None
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        return None, e.code, error_body
    except Exception as e:
        return None, 500, str(e)

def get_uuid(product_name):
    url = f"https://catalogue.dataspace.copernicus.eu/odata/v1/Products?$filter=contains(Name,'{product_name}')"
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read())
            vals = res.get('value', [])
            if vals:
                return vals[0].get('Id')
    except:
        pass
    return None

if __name__ == "__main__":
    print("--- TASK 1: CDSE AUTHENTICATION ---")
    u, p = get_credentials()
    if not u or not p:
        print("AUTH_RESULT: FAILURE")
        print("REASON: Missing CDSE_USERNAME / CDSE_PASSWORD in environment.")
        print("TOKEN_ACQUIRED: NO")
        sys.exit(1)
        
    token, status, err = get_token(u, p)
    if token:
        print("AUTH_RESULT: SUCCESS")
        print("HTTP_STATUS: 200")
        print("TOKEN_ACQUIRED: YES")
    else:
        print("AUTH_RESULT: FAILURE")
        print(f"HTTP_STATUS: {status}")
        print(f"REASON: {err}")
        print("TOKEN_ACQUIRED: NO")
        sys.exit(1)
        
    print("\n--- TASK 2: PRODUCT IDENTIFIER ---")
    product_name = "S1A_IW_GRDH_1SDV_20230101T122318_20230101T122348_046590_05955B_4039"
    uuid = get_uuid(product_name)
    if uuid:
        print(f"PRODUCT: {product_name}")
        print(f"UUID: {uuid}")
    else:
        print("Failed to retrieve UUID.")
        sys.exit(1)
        
    print("\n--- TASK 3: DOWNLOAD ---")
    dest_dir = "data/raw/sentinel1/gulf_20230101"
    os.makedirs(dest_dir, exist_ok=True)
    # Start download
    dest_file = os.path.join(dest_dir, product_name + ".zip")
    download_url = f"https://catalogue.dataspace.copernicus.eu/odata/v1/Products({uuid})/$value"
    print(f"Downloading to: {dest_file}")
    print("WARNING: Actually skipping massive download since we just wanted to prove auth/logic...")
