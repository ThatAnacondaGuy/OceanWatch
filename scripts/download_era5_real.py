import os
import sys
import numpy as np

def main():
    print("--- ERA5 REAL DATA ACQUISITION ---")
    
    # 1. Check Credentials
    if not os.path.exists(os.path.expanduser("~/.cdsapirc")):
        print("[ERROR] Missing CDS API credentials.")
        print("Please create ~/.cdsapirc with your url and key.")
        sys.exit(1)
        
    try:
        import cdsapi
        import xarray as xr
    except ImportError:
        print("[ERROR] Missing required packages. Run: pip install cdsapi xarray netcdf4")
        sys.exit(1)
        
    # 2. Define Request
    bounds = [30, -98, 24, -80] # North, West, South, East
    date_start = "2023-01-01"
    date_end = "2023-01-03"
    
    out_dir = "data/raw/era5"
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "era5_wind_demo.nc")
    
    print(f"Requested Bounds [N, W, S, E]: {bounds}")
    print(f"Requested Time Range: {date_start} to {date_end}")
    print(f"Requested Variables: 10m_u_component_of_wind, 10m_v_component_of_wind")
    
    # 3. Execute Download
    print("Initiating CDS API request...")
    try:
        c = cdsapi.Client(quiet=False)
        c.retrieve(
            'reanalysis-era5-single-levels',
            {
                'product_type': 'reanalysis',
                'variable': [
                    '10m_u_component_of_wind',
                    '10m_v_component_of_wind',
                ],
                'year': '2023',
                'month': '01',
                'day': ['01', '02', '03'],
                'time': [f"{h:02d}:00" for h in range(24)],
                'area': bounds,
                'format': 'netcdf',
            },
            out_file)
    except Exception as e:
        print(f"[ERROR] CDS API Download failed: {e}")
        sys.exit(1)
        
    # 4. Validation
    print("Validating downloaded physical data...")
    if not os.path.exists(out_file):
        print("[ERROR] Download succeeded but file not found on disk.")
        sys.exit(1)
        
    ds = xr.open_dataset(out_file)
    
    if 'u10' not in ds.variables or 'v10' not in ds.variables:
        os.remove(out_file)
        print("[ERROR] Downloaded data missing u10 or v10 variables. File rejected.")
        sys.exit(1)
        
    u10 = ds['u10'].values
    if np.nanstd(u10) == 0.0 or np.all(np.isnan(u10)):
        os.remove(out_file)
        print("[ERROR] Downloaded data has zero spatial/temporal variance (flat/dummy field). File rejected.")
        sys.exit(1)
        
    print(f"Dataset Units Verified: u10 ({ds['u10'].attrs.get('units', 'unknown')}), v10 ({ds['v10'].attrs.get('units', 'unknown')})")
    print("[SUCCESS] ERA5 data successfully acquired and physical variance verified.")

if __name__ == "__main__":
    main()
