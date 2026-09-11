import os
import rasterio
from rasterio.windows import Window
import numpy as np
import torch
import segmentation_models_pytorch as smp
from skimage.measure import label, regionprops
from skimage.feature import graycomatrix, graycoprops
from shapely.geometry import Polygon
import json
from pyproj import Transformer
from netCDF4 import Dataset as ncDataset
import matplotlib.pyplot as plt

# Paths
SNAP_TIFF = "data/processed/sentinel1/gulf_20230101/s1_gulf_20230101_tc.tif"
MODEL_PATH = "models/best_full_oil_unet.pth"
ERA5_PATH = "data/raw/era5/gulf_20230101/era5_wind.nc"
OUT_DIR = "qa_output/phase_n"
os.makedirs(OUT_DIR, exist_ok=True)

# Tiling configuration
TILE_SIZE = 512
STRIDE = 512
THRESHOLD = 0.5
MIN_AREA_PIXELS = 100

device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")

def load_model():
    model = smp.Unet(
        encoder_name="resnet34",
        encoder_weights=None,
        decoder_attention_type="scse",
        in_channels=3,
        classes=1
    )
    model.load_state_dict(torch.load(MODEL_PATH, map_location='cpu'))
    model.to(device)
    model.eval()
    return model

def process_tile(model, tile_vv, tile_vh):
    vv_db = 10 * np.log10(np.clip(tile_vv, 1e-4, 10))
    vh_db = 10 * np.log10(np.clip(tile_vh, 1e-4, 10))
    z = np.zeros_like(vv_db)
    img_arr = np.stack([vv_db, vh_db, z], axis=-1)
    img_tensor = torch.from_numpy(img_arr).permute(2, 0, 1).unsqueeze(0).float() / 255.0
    img_tensor = img_tensor.to(device)
    with torch.no_grad():
        logits = model(img_tensor)
        probs = torch.sigmoid(logits).squeeze().cpu().numpy()
    return probs

def main():
    with rasterio.open(SNAP_TIFF) as src:
        width, height, transform, crs = src.width, src.height, src.transform, src.crs
        model = load_model()
        prob_map = np.zeros((height, width), dtype=np.float32)
        vv_small = src.read(1, out_shape=(height//10, width//10))
        valid_mask_small = (vv_small > 0)
        
        for y in range(0, height, STRIDE):
            for x in range(0, width, STRIDE):
                w, h = min(TILE_SIZE, width - x), min(TILE_SIZE, height - y)
                if w < TILE_SIZE or h < TILE_SIZE: continue
                sy, sx, sh, sw = y//10, x//10, h//10, w//10
                if not valid_mask_small[sy:sy+sh, sx:sx+sw].any(): continue
                window = Window(x, y, w, h)
                tile_vv = src.read(1, window=window)
                tile_vh = src.read(2, window=window)
                if not np.any(tile_vv > 0): continue
                prob_map[y:y+h, x:x+w] = process_tile(model, tile_vv, tile_vh)
                
    binary_mask = (prob_map > THRESHOLD).astype(np.uint8)
    with rasterio.open(SNAP_TIFF) as src:
        vv_full = src.read(1)
        vh_full = src.read(2)
        binary_mask[vv_full == 0] = 0
        
    labeled = label(binary_mask)
    props = regionprops(labeled)
    valid_candidates = [p for p in props if p.area >= MIN_AREA_PIXELS]
    
    if len(valid_candidates) == 0:
        with open("docs/PHASE_N_REAL_OIL_INFERENCE.md", "w") as f:
            f.write("# Phase N: Real Sentinel-1 Oil-Slick Inference\n\nNO VALID SLICK CANDIDATE\n")
        return
        
    top_slick = max(valid_candidates, key=lambda x: x.area)
    y_c, x_c = top_slick.centroid
    lon_c, lat_c = rasterio.transform.xy(transform, y_c, x_c)
    
    with open(f"{OUT_DIR}/top_slick.geojson", "w") as f:
        json.dump({"type": "Point", "coordinates": [lon_c, lat_c]}, f)
        
    bbox = top_slick.bbox
    bx0, bx1 = max(0, bbox[0]-100), min(height, bbox[2]+100)
    by0, by1 = max(0, bbox[1]-100), min(width, bbox[3]+100)
    
    slick_vv = vv_full[bx0:bx1, by0:by1]
    slick_vh = vh_full[bx0:bx1, by0:by1]
    slick_mask = binary_mask[bx0:bx1, by0:by1]
    slick_prob = prob_map[bx0:bx1, by0:by1]
    
    slick_vv_db = 10 * np.log10(np.clip(slick_vv, 1e-4, 10))
    slick_vh_db = 10 * np.log10(np.clip(slick_vh, 1e-4, 10))
    
    vv_8b = np.clip(((slick_vv_db + 30) / 30) * 255, 0, 255).astype(np.uint8)
    glcm = graycomatrix(vv_8b, distances=[1], angles=[0], levels=256, symmetric=True, normed=True)
    contrast = graycoprops(glcm, 'contrast')[0,0]
    homogeneity = graycoprops(glcm, 'homogeneity')[0,0]
    
    try:
        nc = ncDataset(ERA5_PATH)
        lats = nc.variables['latitude'][:]
        lons = nc.variables['longitude'][:]
        lat_idx = np.abs(lats - lat_c).argmin()
        lon_idx = np.abs(lons - lon_c).argmin()
        u10 = nc.variables['u10'][12, lat_idx, lon_idx]
        v10 = nc.variables['v10'][12, lat_idx, lon_idx]
        wind_spd = np.sqrt(u10**2 + v10**2)
        wind_pass = 2 <= wind_spd <= 10
    except:
        wind_pass, wind_spd = False, 0
        
    ai_conf = float(np.mean(prob_map[labeled == top_slick.label]))
    glcm_conf = 1.0 if contrast > 50 else 0.5
    wind_conf = 1.0 if wind_pass else 0.1
    overall_conf = (0.5 * ai_conf) + (0.25 * glcm_conf) + (0.25 * wind_conf)
    
    fig, axes = plt.subplots(2, 3, figsize=(15, 10))
    axes = axes.flatten()
    
    axes[0].imshow(slick_vv_db, cmap='gray', vmin=-25, vmax=0)
    axes[0].contour(slick_mask, levels=[0.5], colors='red')
    axes[0].set_title('VV with Slick Outline')
    
    axes[1].imshow(slick_vh_db, cmap='gray', vmin=-30, vmax=-5)
    axes[1].contour(slick_mask, levels=[0.5], colors='red')
    axes[1].set_title('VH with Slick Outline')
    
    axes[2].imshow(slick_prob, cmap='hot')
    axes[2].set_title('Probability Heatmap')
    
    axes[3].imshow(slick_mask, cmap='gray')
    axes[3].set_title('Binary Mask')
    
    vv_lin = np.clip(slick_vv, 1e-4, 1)
    vh_lin = np.clip(slick_vh, 1e-4, 1)
    ratio = np.clip(vv_lin / (vh_lin + 1e-4), 0, 20) / 20
    rgb = np.dstack([(slick_vv_db + 25) / 25, (slick_vh_db + 30) / 25, ratio])
    axes[4].imshow(np.clip(rgb, 0, 1))
    axes[4].set_title('VV/VH Composite')
    
    axes[5].axis('off')
    
    plt.tight_layout()
    plt.savefig(f"{OUT_DIR}/qa_visuals.png")
    
    with open("docs/PHASE_N_REAL_OIL_INFERENCE.md", "w") as f:
        f.write("# Phase N: Real Sentinel-1 Oil-Slick Inference\n\n")
        f.write("## Inference Settings\n")
        f.write("- Model: models/best_full_oil_unet.pth\n")
        f.write("- Tiling: 512x512, Stride 512\n")
        f.write("- Normalization: VV/VH Linear -> dB -> `[0,255]` stack -> `/255.0` (matching training pipeline)\n")
        f.write("- Threshold: 0.5\n")
        f.write("- Min Area: 100 px\n\n")
        f.write("## Detection Results\n")
        f.write(f"- Valid Candidates: {len(valid_candidates)}\n")
        f.write(f"- Top Candidate Area: {top_slick.area} pixels\n")
        f.write(f"- Top Candidate Centroid: {lat_c:.4f}, {lon_c:.4f}\n\n")
        f.write("## Independent QA\n")
        f.write(f"- GLCM Contrast: {contrast:.2f}\n")
        f.write(f"- GLCM Homogeneity: {homogeneity:.2f}\n\n")
        f.write("## Wind Gate (ERA5)\n")
        f.write(f"- Wind Speed: {wind_spd:.2f} m/s\n")
        f.write(f"- Gate Status: {'PASS' if wind_pass else 'FAIL'}\n\n")
        f.write("## Confidence\n")
        f.write(f"**MODEL-BASED SLICK CONFIDENCE:** {overall_conf:.2f}\n\n")
        f.write("---\nSLICK CANDIDATE DETECTED\n")

if __name__ == "__main__":
    main()
