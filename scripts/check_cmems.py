from netCDF4 import Dataset
import numpy as np

cmems_file = "data/raw/cmems/gulf_20230101/cmems_currents.nc"
ds = Dataset(cmems_file)

lats = ds.variables['latitude'][:]
lons = ds.variables['longitude'][:]
u = ds.variables['uo'][0, 0, :, :]

# Target: 29.324 N, -94.810 W
lat_idx = np.abs(lats - 29.324).argmin()
lon_idx = np.abs(lons - (-94.810)).argmin()

print(f"Closest CMEMS grid point: {lats[lat_idx]:.3f} N, {lons[lon_idx]:.3f} W")
val = u[lat_idx, lon_idx]
print(f"U velocity at this point: {val}")
if np.ma.is_masked(val):
    print("Point is MASKED (Land/NoData).")
