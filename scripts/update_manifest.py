import json
import os
import hashlib

MANIFEST_FILE = "data/manifests/datasets.json"
os.makedirs("data/manifests", exist_ok=True)

manifest = {
    "zenodo": {
        "source_url": "https://zenodo.org/record/4322585",
        "license": "CC-BY 4.0",
        "status": "synthetic_smoke_test_subset",
        "files_acquired": 10,
        "size_bytes": "minimal"
    },
    "xview3": {
        "source_url": "https://iuu.xview.us/",
        "license": "xView3 Challenge (Non-commercial)",
        "status": "synthetic_smoke_test_subset",
        "files_acquired": 2,
        "size_bytes": "minimal"
    },
    "marine_cadastre": {
        "source_url": "https://coast.noaa.gov/htdata/CMSP/AISDataHandler/2023/",
        "license": "Public Domain",
        "status": "synthetic_smoke_test_subset",
        "files_acquired": 1,
        "size_bytes": "minimal"
    },
    "era5": {
        "source_url": "https://cds.climate.copernicus.eu/",
        "license": "Copernicus Free and Open",
        "status": "synthetic_smoke_test_subset",
        "files_acquired": 1,
        "size_bytes": "minimal"
    },
    "cmems": {
        "source_url": "https://data.marine.copernicus.eu/",
        "license": "Copernicus Free and Open",
        "status": "synthetic_smoke_test_subset",
        "files_acquired": 1,
        "size_bytes": "minimal"
    }
}

with open(MANIFEST_FILE, "w") as f:
    json.dump(manifest, f, indent=4)
print(f"Manifest written to {MANIFEST_FILE}")
