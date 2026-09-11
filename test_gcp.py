import rasterio
from rasterio.vrt import WarpedVRT
from rasterio.enums import Resampling

vv_path = 'data/raw/sentinel1/gulf_20230101/S1A_IW_GRDH_1SDV_20230101T122318_20230101T122348_046590_05955B_4039.SAFE/measurement/s1a-iw-grd-vv-20230101t122318-20230101t122348-046590-05955b-001.tiff'

with rasterio.open(vv_path) as src:
    print("Opened SRC")
    gcps, gcp_crs = src.gcps
    print(f"GCPs: {len(gcps)}, CRS: {gcp_crs}")
    
    # Calculate transform from GCPs
    transform = rasterio.transform.from_gcps(gcps)
    print("Affine Transform from GCPs:", transform)

