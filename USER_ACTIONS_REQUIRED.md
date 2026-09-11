# User Actions Required

To proceed with Phase C (Model Training) and execute real physical inference on the OceanWatch AI platform, please complete the following manual actions. **Automated scripts cannot perform these tasks due to credential and login requirements.**

### 1. Register for xView3 (Ship Detection Data)
- **Action:** Go to https://iuu.xview.us/
- **Action:** Create an account and accept the Challenge terms.
- **Action:** Download at least **1 GeoTIFF scene** from the validation/train set and its corresponding **CSV label file**.
- **Action:** Place the TIFF at `data/raw/xview3/scene_1.tif` and the CSV at `data/raw/xview3/labels.csv`.

### 2. Configure Copernicus CDS (ERA5 Wind Forcing)
- **Action:** Register an account at https://cds.climate.copernicus.eu/
- **Action:** Create the file `~/.cdsapirc` in your home directory containing your UID and API key (available in your profile settings).

### 3. Configure Copernicus Marine (CMEMS Ocean Currents)
- **Action:** Register an account at https://data.marine.copernicus.eu/
- **Action:** Save your username and password to the environment variables `COPERNICUS_USER` and `COPERNICUS_PWD` in the `.env` file.

### 4. Acquire a Raw Sentinel-1 Scene (Pipeline Validation)
- **Action:** Go to Copernicus Data Space Ecosystem (https://dataspace.copernicus.eu/) or ASF DAAC (https://search.asf.alaska.edu/).
- **Action:** Download one Sentinel-1 GRD IW `.SAFE` product (preferably over the Gulf of Mexico on Jan 1, 2023, to match our AIS demo data).
- **Action:** Extract the `.SAFE` folder and place it inside `data/demo/scenes/`.

### 5. Download the Zenodo Dataset (Oil Spill Data)
- **Action:** Run the provided automated script to download the open-source Krestenitis dataset:
  ```bash
  mkdir -p data/raw/zenodo
  wget https://zenodo.org/record/4322585/files/Images.zip -O data/raw/zenodo/Images.zip
  wget https://zenodo.org/record/4322585/files/Labels_2D.zip -O data/raw/zenodo/Labels_2D.zip
  unzip data/raw/zenodo/Images.zip -d data/raw/zenodo/images/
  unzip data/raw/zenodo/Labels_2D.zip -d data/raw/zenodo/masks/
  ```

Once these datasets and credentials are in place, we can unblock Phase C and begin real model training and physical pipeline execution.
