import os
import xml.etree.ElementTree as ET
import numpy as np
import rasterio
from rasterio.enums import Resampling
from rasterio.transform import from_gcps
from rasterio.features import rasterize
import geopandas as gpd
import matplotlib.pyplot as plt
from scipy.interpolate import interp1d

safe_dir = "data/raw/sentinel1/gulf_20230101/S1A_IW_GRDH_1SDV_20230101T122318_20230101T122348_046590_05955B_4039.SAFE"
vv_path = os.path.join(safe_dir, "measurement", "s1a-iw-grd-vv-20230101t122318-20230101t122348-046590-05955b-001.tiff")
vh_path = os.path.join(safe_dir, "measurement", "s1a-iw-grd-vh-20230101t122318-20230101t122348-046590-05955b-002.tiff")
cal_vv_path = os.path.join(safe_dir, "annotation", "calibration", "calibration-s1a-iw-grd-vv-20230101t122318-20230101t122348-046590-05955b-001.xml")
cal_vh_path = os.path.join(safe_dir, "annotation", "calibration", "calibration-s1a-iw-grd-vh-20230101t122318-20230101t122348-046590-05955b-002.xml")
land_shape_path = "data/raw/natural_earth/ne_10m_land.shp"

def extract_calibration_vector(xml_path, target_width):
    tree = ET.parse(xml_path)
    root = tree.getroot()
    pixel_indices = None
    sigma_arrays = []
    for cal_vec in root.findall('.//calibrationVector'):
        pixels = np.array([float(x) for x in cal_vec.find('pixel').text.split()])
        sigmas = np.array([float(x) for x in cal_vec.find('sigmaNought').text.split()])
        if pixel_indices is None: pixel_indices = pixels
        sigma_arrays.append(sigmas)
    mean_sigmas = np.mean(sigma_arrays, axis=0)
    f = interp1d(pixel_indices, mean_sigmas, kind='linear', fill_value="extrapolate")
    return f(np.arange(target_width))

def main():
    print("--- TASK 1: PRODUCT INSPECTION ---")
    scale_factor = 10
    with rasterio.open(vv_path) as src:
        width, height = src.width, src.height
        gcps, crs = src.gcps
        
        # Scale down transform
        full_transform = from_gcps(gcps)
        scaled_transform = full_transform * rasterio.Affine.scale(scale_factor, scale_factor)
        
        out_shape = (height // scale_factor, width // scale_factor)
        
        print(f"Original Dimensions: {width}x{height}")
        print(f"Downsampled Dimensions: {out_shape[1]}x{out_shape[0]}")
        
        vv_raw = src.read(1, out_shape=out_shape, resampling=Resampling.average).astype(np.float32)

    with rasterio.open(vh_path) as src_vh:
        vh_raw = src_vh.read(1, out_shape=out_shape, resampling=Resampling.average).astype(np.float32)

    print("--- TASK 3: RADIOMETRIC CALIBRATION ---")
    cal_vv = extract_calibration_vector(cal_vv_path, width)
    cal_vh = extract_calibration_vector(cal_vh_path, width)
    
    # Subsample calibration vector
    cal_vv_scaled = cal_vv[::scale_factor][:out_shape[1]]
    cal_vh_scaled = cal_vh[::scale_factor][:out_shape[1]]
    
    cal_vv_2d = np.tile(cal_vv_scaled, (out_shape[0], 1))
    cal_vh_2d = np.tile(cal_vh_scaled, (out_shape[0], 1))
    
    vv_sigma0 = (vv_raw**2) / (cal_vv_2d**2 + 1e-6)
    vh_sigma0 = (vh_raw**2) / (cal_vh_2d**2 + 1e-6)
    
    vv_db = 10 * np.log10(np.clip(vv_sigma0, 1e-4, 10))
    vh_db = 10 * np.log10(np.clip(vh_sigma0, 1e-4, 10))
    
    print("--- TASK 4 & 5: LAND MASK & GEOREFERENCING ---")
    gdf_land = gpd.read_file(land_shape_path)
    shapes = ((geom, 1) for geom in gdf_land.geometry)
    land_mask = rasterize(shapes, out_shape=out_shape, transform=scaled_transform, fill=0, dtype=np.uint8)
    offshore_mask = 1 - land_mask
    print(f"Land Pixels: {np.sum(land_mask)}, Offshore Pixels: {np.sum(offshore_mask)}")
    
    print("--- TASK 6: VISUAL QA ---")
    fig, axes = plt.subplots(2, 4, figsize=(20, 10))
    axes = axes.flatten()
    
    axes[0].imshow(np.clip(vv_raw, 0, 1000), cmap='gray')
    axes[0].set_title('1. Raw VV (DN)')
    axes[1].imshow(vv_db, cmap='gray', vmin=-25, vmax=0)
    axes[1].set_title('2. Calibrated Sigma0 VV (dB)')
    axes[2].imshow(vh_db, cmap='gray', vmin=-30, vmax=-5)
    axes[2].set_title('3. Calibrated Sigma0 VH (dB)')
    
    vv_lin = np.clip(vv_sigma0, 1e-4, 1)
    vh_lin = np.clip(vh_sigma0, 1e-4, 1)
    ratio = np.clip(vv_lin / (vh_lin + 1e-4), 0, 20) / 20
    rgb = np.dstack([(vv_db + 25) / 25, (vh_db + 30) / 25, ratio])
    axes[3].imshow(np.clip(rgb, 0, 1))
    axes[3].set_title('4. Feature Composite (RGB)')
    
    axes[4].imshow(land_mask, cmap='gray')
    axes[4].set_title('5. Land Mask')
    
    # To show georeferenced footprint, plot coordinates roughly
    axes[5].imshow(offshore_mask, cmap='Blues')
    axes[5].set_title('6. Georeferenced Footprint (Mask)')
    
    offshore_vv = np.copy(vv_db)
    offshore_vv[land_mask == 1] = -50
    axes[6].imshow(offshore_vv, cmap='gray', vmin=-25, vmax=0)
    axes[6].set_title('7. Offshore Only (VV dB)')
    
    axes[7].hist(vv_db.ravel(), bins=50, range=(-30, 5), alpha=0.5, label='VV')
    axes[7].hist(vh_db.ravel(), bins=50, range=(-35, 0), alpha=0.5, label='VH')
    axes[7].legend()
    axes[7].set_title('Histogram')
    
    plt.tight_layout()
    plt.savefig('/Users/devopsdreamer/.gemini/antigravity/brain/f82eb8e5-4ff2-4905-818e-2a4a966a3104/phase_m_qa_full.png')
    
    print("--- TASK 7: MODEL INPUT PREPARATION ---")
    out_profile = {
        'driver': 'GTiff',
        'height': out_shape[0],
        'width': out_shape[1],
        'count': 2,
        'dtype': 'float32',
        'crs': 'EPSG:4326',
        'transform': scaled_transform,
        'nodata': -999.0
    }
    model_vv = np.where(land_mask == 1, -999.0, vv_db)
    model_vh = np.where(land_mask == 1, -999.0, vh_db)
    with rasterio.open('qa_output/model_ready_full.tif', 'w', **out_profile) as dst:
        dst.write(model_vv.astype(np.float32), 1)
        dst.write(model_vh.astype(np.float32), 2)

if __name__ == "__main__":
    main()
