import os
import cdsapi
import subprocess

# Bounds for Galveston Offshore: North, West, South, East
area = [29.5, -95.5, 28.8, -94.5]

def download_era5():
    print("--- Downloading ERA5 ---")
    try:
        c = cdsapi.Client()
        c.retrieve(
            'reanalysis-era5-single-levels',
            {
                'product_type': 'reanalysis',
                'format': 'netcdf',
                'variable': [
                    '10m_u_component_of_wind', '10m_v_component_of_wind',
                ],
                'year': '2023',
                'month': '01',
                'day': '01',
                'time': [
                    f"{str(i).zfill(2)}:00" for i in range(24)
                ],
                'area': area,
            },
            'data/raw/era5/gulf_20230101/era5_wind.nc')
        print("ERA5 download complete.")
    except Exception as e:
        print(f"ERA5 Download Failed: {e}")

def download_cmems():
    print("--- Downloading CMEMS ---")
    cmd = [
        "copernicusmarine", "subset",
        "-i", "cmems_mod_glo_phy_my_0.083_P1D-m",
        "-x", str(area[1]), "-X", str(area[3]),
        "-y", str(area[2]), "-Y", str(area[0]),
        "-t", "2023-01-01", "-T", "2023-01-01",
        "-v", "uo", "-v", "vo",
        "-z", "0.493", "-Z", "0.494",
        "-o", "data/raw/cmems/gulf_20230101/",
        "-f", "cmems_currents.nc",
        "--force-download"
    ]
    subprocess.run(cmd)

if __name__ == "__main__":
    download_era5()
    download_cmems()
