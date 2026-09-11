import os
import urllib.request
import zipfile
import hashlib
import json

DATA_DIR = "data"
MANIFEST_FILE = os.path.join(DATA_DIR, "manifests", "datasets.json")

def md5(fname):
    hash_md5 = hashlib.md5()
    with open(fname, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

def download_and_extract(url, dest_dir, zip_name):
    os.makedirs(dest_dir, exist_ok=True)
    zip_path = os.path.join(dest_dir, zip_name)
    print(f"Downloading {url} to {zip_path}...")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response, open(zip_path, 'wb') as out_file:
            out_file.write(response.read())
        print(f"Extracting {zip_path}...")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(dest_dir)
        return zip_path, True
    except Exception as e:
        print(f"Failed: {e}")
        return None, False

def run_acquisitions():
    manifest = {}
    
    # 1. Natural Earth Land (10m)
    ne_url = "https://naciscdn.org/naturalearth/10m/physical/ne_10m_land.zip"
    ne_dir = os.path.join(DATA_DIR, "raw", "natural_earth")
    ne_zip, ne_ok = download_and_extract(ne_url, ne_dir, "ne_10m_land.zip")
    if ne_ok:
        manifest["natural_earth"] = {
            "source_url": ne_url,
            "license": "Public Domain",
            "status": "ACQUIRED_REAL",
            "files_acquired": len(os.listdir(ne_dir)),
            "size_bytes": os.path.getsize(ne_zip),
            "hash_md5": md5(ne_zip)
        }
        
    # 2. MarineCadastre AIS (Sample: Jan 1, 2023 for Gulf of Mexico testing)
    ais_url = "https://coast.noaa.gov/htdata/CMSP/AISDataHandler/2023/AIS_2023_01_01.zip"
    ais_dir = os.path.join(DATA_DIR, "raw", "marine_cadastre")
    ais_zip, ais_ok = download_and_extract(ais_url, ais_dir, "AIS_2023_01_01.zip")
    if ais_ok:
        manifest["marine_cadastre"] = {
            "source_url": ais_url,
            "license": "Public Domain",
            "status": "ACQUIRED_REAL",
            "files_acquired": len(os.listdir(ais_dir)),
            "size_bytes": os.path.getsize(ais_zip),
            "hash_md5": md5(ais_zip)
        }
        
    # 3. Zenodo Oil Spill
    # Zenodo direct file link for one of the primary dataset zip files (e.g. labels or images).
    # Since the 4322585 dataset has multiple files, we'll try to fetch a specific one if known.
    # Note: Krestenitis dataset files are often 1D_Classes.zip, Images.zip, etc.
    # If the exact link isn't known, we log it as BLOCKED pending exact file selection.
    manifest["zenodo"] = {
        "source_url": "https://zenodo.org/record/4322585",
        "license": "CC-BY 4.0",
        "status": "BLOCKED_NEEDS_EXACT_FILES",
        "reason": "Requires parsing Zenodo API for specific file IDs (Images.zip, Labels.zip)"
    }
    
    # 4. xView3
    manifest["xview3"] = {
        "source_url": "https://iuu.xview.us/",
        "license": "xView3 Challenge",
        "status": "BLOCKED_CREDENTIALS_REQUIRED",
        "reason": "Requires Defense Innovation Unit (DIU) login and signed AWS URLs."
    }
    
    # 5. Copernicus (ERA5 / CMEMS / Sentinel-1 SAFE)
    manifest["copernicus_era5"] = {
        "source_url": "https://cds.climate.copernicus.eu/",
        "status": "BLOCKED_CREDENTIALS_REQUIRED",
        "reason": "Requires CDS API Key (~/.cdsapirc)."
    }
    manifest["copernicus_cmems"] = {
        "source_url": "https://data.marine.copernicus.eu/",
        "status": "BLOCKED_CREDENTIALS_REQUIRED",
        "reason": "Requires Copernicus Marine credentials."
    }
    
    with open(MANIFEST_FILE, "w") as f:
        json.dump(manifest, f, indent=4)
    print("Manifest updated.")

if __name__ == "__main__":
    run_acquisitions()
