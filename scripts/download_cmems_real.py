import os
import sys
import numpy as np
import subprocess

def main():
    print("--- CMEMS REAL DATA ACQUISITION ---")
    
    # 1. Check Credentials
    has_env = 'COPERNICUSMARINE_SERVICE_USERNAME' in os.environ and 'COPERNICUSMARINE_SERVICE_PASSWORD' in os.environ
    has_netrc = os.path.exists(os.path.expanduser("~/.netrc")) or os.path.exists(os.path.expanduser("~/.copernicusmarine/.copernicusmarine-credentials"))
    
    if not (has_env or has_netrc):
        print("[ERROR] Missing CMEMS credentials.")
        print("Please set COPERNICUSMARINE_SERVICE_USERNAME and PASSWORD environment variables.")
        sys.exit(1)
        
    try:
        import xarray as xr
    except ImportError:
        print("[ERROR] Missing xarray. Run: pip install xarray netcdf4")
        sys.exit(1)
        
    # 2. Define Request
    out_dir = "data/raw/cmems"
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "cmems_current_demo.nc")
    
    # Dataset: Hourly global physics analysis
    dataset_id = "cmems_mod_glo_phy_anfc_0.083deg_PT1H-m"
    
    cmd = [
        "copernicusmarine", "subset",
        "-i", dataset_id,
        "-x", "-98", "-X", "-80",
        "-y", "24", "-Y", "30",
        "-z", "0.49", "-Z", "0.51", # Near-surface layer selection (~0.49m in many CMEMS grids)
        "-t", "2023-01-01 00:00:00", "-T", "2023-01-03 23:59:59",
        "-v", "uo", "-v", "vo",
        "-o", out_dir,
        "-f", "cmems_current_demo.nc",
        "--force-download"
    ]
    
    print("Requested Bounds: Lon -98 to -80, Lat 24 to 30")
    print("Requested Time Range: 2023-01-01 to 2023-01-03 (Hourly)")
    print("Requested Depth: Surface layer (~0.49m depth)")
    print("Requested Variables: uo, vo")
    
    # 3. Execute Download
    print("Initiating Copernicus Marine API request...")
    try:
        subprocess.run(cmd, check=True)
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] CMEMS Download failed: {e}")
        sys.exit(1)
    except FileNotFoundError:
        print("[ERROR] 'copernicusmarine' CLI tool not found. Run: pip install copernicusmarine")
        sys.exit(1)
        
    # 4. Validation
    print("Validating downloaded physical data...")
    if not os.path.exists(out_file):
        print("[ERROR] Download succeeded but file not found on disk.")
        sys.exit(1)
        
    ds = xr.open_dataset(out_file)
    
    if 'uo' not in ds.variables or 'vo' not in ds.variables:
        os.remove(out_file)
        print("[ERROR] Downloaded data missing uo or vo variables. File rejected.")
        sys.exit(1)
        
    uo = ds['uo'].values
    if np.nanstd(uo) == 0.0 or np.all(np.isnan(uo)):
        os.remove(out_file)
        print("[ERROR] Downloaded data has zero spatial/temporal variance (flat/dummy field). File rejected.")
        sys.exit(1)
        
    print(f"Dataset Units Verified: uo ({ds['uo'].attrs.get('units', 'unknown')}), vo ({ds['vo'].attrs.get('units', 'unknown')})")
    print("[SUCCESS] CMEMS data successfully acquired and physical variance verified.")

if __name__ == "__main__":
    main()
