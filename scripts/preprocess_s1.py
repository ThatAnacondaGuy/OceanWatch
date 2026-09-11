import os
import xml.etree.ElementTree as ET
import numpy as np
import rasterio
from rasterio.warp import reproject, Resampling
from rasterio.transform import from_gcps
from rasterio.features import rasterize
import geopandas as gpd
import matplotlib.pyplot as plt
from scipy.interpolate import interp1d

# Paths
safe_dir = "data/raw/sentinel1/gulf_20230101/S1A_IW_GRDH_1SDV_20230101T122318_20230101T122348_046590_05955B_4039.SAFE"
vv_path = os.path.join(safe_dir, "measurement", "s1a-iw-grd-vv-20230101t122318-20230101t122348-046590-05955b-001.tiff")
vh_path = os.path.join(safe_dir, "measurement", "s1a-iw-grd-vh-20230101t122318-20230101t122348-046590-05955b-002.tiff")
cal_vv_path = os.path.join(safe_dir, "annotation", "calibration", "calibration-s1a-iw-grd-vv-20230101t122318-20230101t122348-046590-05955b-001.xml")
cal_vh_path = os.path.join(safe_dir, "annotation", "calibration", "calibration-s1a-iw-grd-vh-20230101t122318-20230101t122348-046590-05955b-002.xml")
land_shape_path = "data/raw/natural_earth/ne_10m_land.shp"

def extract_calibration_vector(xml_path, target_width):
    tree = ET.parse(xml_path)
    root = tree.getroot()
    # We will average the sigmaNought arrays across all azimuth times to get a generic range vector
    pixel_indices = None
    sigma_arrays = []
    for cal_vec in root.findall('.//calibrationVector'):
        pixels = np.array([float(x) for x in cal_vec.find('pixel').text.split()])
        sigmas = np.array([float(x) for x in cal_vec.find('sigmaNought').text.split()])
        if pixel_indices is None:
            pixel_indices = pixels
        sigma_arrays.append(sigmas)
    
    mean_sigmas = np.mean(sigma_arrays, axis=0)
    # Interpolate to the full image width
    f = interp1d(pixel_indices, mean_sigmas, kind='linear', fill_value="extrapolate")
    full_vector = f(np.arange(target_width))
    return full_vector

def main():
    print("--- TASK 1: PRODUCT INSPECTION ---")
    with rasterio.open(vv_path) as src:
        width, height = src.width, src.height
        gcps, crs = src.gcps
        print(f"Dimensions: {width}x{height}")
        print(f"GCPs: {len(gcps)}")
        print(f"CRS: {crs}")

        # Compute transform for georeferencing
        transform = from_gcps(gcps)
        
        # Read a downsampled patch for quick processing (factor 10)
        # Or a specific region (e.g. Galveston bay offshore)
        # Let's read a [4000:6000, 10000:12000] patch representing Galveston offshore
        print("--- TASK 2: EXTRACT VV/VH ---")
        window = rasterio.windows.Window(10000, 8000, 2000, 2000)
        vv_raw = src.read(1, window=window).astype(np.float32)
        
        # We need the transform of the window
        win_transform = src.window_transform(window)
        # But wait, the source doesn't have a direct affine transform, it uses GCPs.
        # To get the geographic bounds of the window, we apply the GCP affine transform:
        win_geo_transform = transform * rasterio.Affine.translation(window.col_off, window.row_off)
        
    with rasterio.open(vh_path) as src_vh:
        vh_raw = src_vh.read(1, window=window).astype(np.float32)

    print(f"Extracted Patch Size: {vv_raw.shape}")
    print(f"VV Raw Stats: min={vv_raw.min()}, max={vv_raw.max()}, mean={vv_raw.mean()}")
    
    print("--- TASK 3: RADIOMETRIC CALIBRATION ---")
    cal_vv = extract_calibration_vector(cal_vv_path, width)
    cal_vh = extract_calibration_vector(cal_vh_path, width)
    
    # Slice the calibration vector to match our window
    cal_vv_patch = cal_vv[window.col_off : window.col_off + window.width]
    cal_vh_patch = cal_vh[window.col_off : window.col_off + window.width]
    
    # Broadcast to 2D
    cal_vv_2d = np.tile(cal_vv_patch, (window.height, 1))
    cal_vh_2d = np.tile(cal_vh_patch, (window.height, 1))
    
    # Apply calibration: sigma0 = DN^2 / A^2
    vv_sigma0 = (vv_raw**2) / (cal_vv_2d**2)
    vh_sigma0 = (vh_raw**2) / (cal_vh_2d**2)
    
    # Convert to dB for visualization
    vv_db = 10 * np.log10(np.clip(vv_sigma0, 1e-4, 10))
    vh_db = 10 * np.log10(np.clip(vh_sigma0, 1e-4, 10))
    
    print(f"VV Sigma0 (dB) Stats: min={vv_db.min():.2f}, max={vv_db.max():.2f}, mean={vv_db.mean():.2f}")
    
    print("--- TASK 4 & 5: LAND MASK & GEOREFERENCING ---")
    # We will create a georeferenced bounding box for this patch
    # win_geo_transform maps pixel (x,y) to (lon, lat)
    
    # Rasterize land
    gdf_land = gpd.read_file(land_shape_path)
    # The output is in EPSG:4326. We can use rasterize on our geo-transform grid.
    out_shape = (window.height, window.width)
    shapes = ((geom, 1) for geom in gdf_land.geometry)
    land_mask = rasterize(shapes, out_shape=out_shape, transform=win_geo_transform, fill=0, dtype=np.uint8)
    
    offshore_mask = 1 - land_mask
    print(f"Land Pixels: {np.sum(land_mask)}, Offshore Pixels: {np.sum(offshore_mask)}")
    
    print("--- TASK 6: VISUAL QA ---")
    os.makedirs('qa_output', exist_ok=True)
    
    fig, axes = plt.subplots(2, 4, figsize=(20, 10))
    axes = axes.flatten()
    
    axes[0].imshow(np.clip(vv_raw, 0, 1000), cmap='gray')
    axes[0].set_title('1. Raw VV (DN)')
    
    axes[1].imshow(vv_db, cmap='gray', vmin=-25, vmax=0)
    axes[1].set_title('2. Calibrated Sigma0 VV (dB)')
    
    axes[2].imshow(vh_db, cmap='gray', vmin=-30, vmax=-5)
    axes[2].set_title('3. Calibrated Sigma0 VH (dB)')
    
    # Feature image (RGB composite: R=VV, G=VH, B=VV/VH)
    vv_lin = np.clip(vv_sigma0, 1e-4, 1)
    vh_lin = np.clip(vh_sigma0, 1e-4, 1)
    ratio = np.clip(vv_lin / (vh_lin + 1e-4), 0, 20) / 20
    rgb = np.dstack([(vv_db + 25) / 25, (vh_db + 30) / 25, ratio])
    rgb = np.clip(rgb, 0, 1)
    axes[3].imshow(rgb)
    axes[3].set_title('4. Feature Composite (RGB)')
    
    axes[4].imshow(land_mask, cmap='gray')
    axes[4].set_title('5. Land Mask')
    
    # Offshore only (VV)
    offshore_vv = np.copy(vv_db)
    offshore_vv[land_mask == 1] = -50
    axes[5].imshow(offshore_vv, cmap='gray', vmin=-25, vmax=0)
    axes[5].set_title('6. Offshore Only (VV dB)')
    
    # 7th plot: Histogram to prove calibration worked
    axes[6].hist(vv_db.ravel(), bins=50, range=(-30, 5), alpha=0.5, label='VV')
    axes[6].hist(vh_db.ravel(), bins=50, range=(-35, 0), alpha=0.5, label='VH')
    axes[6].legend()
    axes[6].set_title('7. Sigma0 Histogram')
    
    axes[7].axis('off')
    
    plt.tight_layout()
    plt.savefig('/Users/devopsdreamer/.gemini/antigravity/brain/f82eb8e5-4ff2-4905-818e-2a4a966a3104/phase_m_qa.png')
    plt.close()
    
    print("--- TASK 7: MODEL INPUT PREPARATION ---")
    # Save a georeferenced TIFF of the calibrated offshore VV/VH
    out_profile = {
        'driver': 'GTiff',
        'height': window.height,
        'width': window.width,
        'count': 2,
        'dtype': 'float32',
        'crs': 'EPSG:4326',
        'transform': win_geo_transform,
        'nodata': -999.0
    }
    
    model_vv = np.where(land_mask == 1, -999.0, vv_db)
    model_vh = np.where(land_mask == 1, -999.0, vh_db)
    
    out_tif = 'qa_output/model_ready_input.tif'
    with rasterio.open(out_tif, 'w', **out_profile) as dst:
        dst.write(model_vv.astype(np.float32), 1)
        dst.write(model_vh.astype(np.float32), 2)
        
    print(f"Model-ready raster saved: {out_tif}")
    print("PREPROCESSING COMPLETE")

if __name__ == "__main__":
    main()
