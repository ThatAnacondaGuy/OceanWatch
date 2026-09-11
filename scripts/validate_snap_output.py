import os
import rasterio
from rasterio.plot import show
from rasterio.enums import Resampling
import numpy as np
import matplotlib.pyplot as plt
import geopandas as gpd
from shapely.geometry import box

tc_path = "data/processed/sentinel1/gulf_20230101/s1_gulf_20230101_tc.tif"
land_shape_path = "data/raw/natural_earth/ne_10m_land.shp"

def main():
    print("--- TASK 6: VALIDATION ---")
    with rasterio.open(tc_path) as src:
        print(f"Dimensions: {src.width} x {src.height}")
        print(f"Bands: {src.count} (Names: {src.descriptions})")
        print(f"CRS: {src.crs}")
        print(f"Transform:\n{src.transform}")
        print(f"Bounds: {src.bounds}")
        print(f"Nodata: {src.nodatavals}")
        
        # Pixel spacing: derived from transform (scale in degrees, usually ~ 8.98e-5 for 10m)
        pixel_spacing_deg = src.transform[0]
        # roughly 1 deg = 111,320 meters at equator
        pixel_spacing_m = pixel_spacing_deg * 111320
        print(f"Pixel Spacing: {pixel_spacing_deg} deg (~{pixel_spacing_m:.2f} m)")

        # Read downsampled for QA (e.g., 1/10th size)
        scale = 10
        out_shape = (src.height // scale, src.width // scale)
        vv = src.read(1, out_shape=out_shape, resampling=Resampling.average)
        vh = src.read(2, out_shape=out_shape, resampling=Resampling.average)
        transform_scaled = src.transform * rasterio.Affine.scale(scale, scale)
        bounds = src.bounds

    print("--- INDEPENDENT COASTLINE SANITY CHECK ---")
    # Galveston approximate coordinates: 29.3 N, -94.8 W
    # The image bounds should contain this
    if (bounds.left <= -94.8 <= bounds.right) and (bounds.bottom <= 29.3 <= bounds.top):
        print("Galveston Coastline (-94.8, 29.3) is INSIDE the processed bounds. [VALID]")
    else:
        print("Galveston Coastline is OUTSIDE the bounds. [INVALID]")
        
    print("--- TASK 7: VISUAL QA ---")
    gdf_land = gpd.read_file(land_shape_path)
    
    # Clip land to bounds
    bbox = box(bounds.left, bounds.bottom, bounds.right, bounds.top)
    gdf_land_clipped = gpd.clip(gdf_land, bbox)

    fig, axes = plt.subplots(1, 4, figsize=(20, 5))
    
    # Extent for imshow: [left, right, bottom, top]
    extent = [bounds.left, bounds.right, bounds.bottom, bounds.top]
    
    # Convert to dB for viewing
    # SNAP output is already Sigma0 in linear scale.
    vv_db = 10 * np.log10(np.clip(vv, 1e-4, 10))
    vh_db = 10 * np.log10(np.clip(vh, 1e-4, 10))
    
    axes[0].imshow(vv_db, cmap='gray', vmin=-25, vmax=0, extent=extent)
    axes[0].set_title('Sigma0 VV (dB)')
    
    axes[1].imshow(vh_db, cmap='gray', vmin=-30, vmax=-5, extent=extent)
    axes[1].set_title('Sigma0 VH (dB)')
    
    # RGB Composite
    vv_lin = np.clip(vv, 1e-4, 1)
    vh_lin = np.clip(vh, 1e-4, 1)
    ratio = np.clip(vv_lin / (vh_lin + 1e-4), 0, 20) / 20
    rgb = np.dstack([(vv_db + 25) / 25, (vh_db + 30) / 25, ratio])
    axes[2].imshow(np.clip(rgb, 0, 1), extent=extent)
    axes[2].set_title('Composite (R=VV, G=VH, B=Ratio)')
    
    # Coastline overlay on VV
    axes[3].imshow(vv_db, cmap='gray', vmin=-25, vmax=0, extent=extent)
    gdf_land_clipped.plot(ax=axes[3], facecolor='none', edgecolor='red', linewidth=1.5)
    axes[3].set_title('Coastline Overlay')
    
    plt.tight_layout()
    plt.savefig('/Users/devopsdreamer/.gemini/antigravity/brain/f82eb8e5-4ff2-4905-818e-2a4a966a3104/phase_m2_snap_qa.png')
    
    print("Visual QA generated.")

if __name__ == "__main__":
    main()
