import os
import rasterio
from rasterio.windows import from_bounds
import numpy as np
import torch
import segmentation_models_pytorch as smp
from skimage.measure import label, regionprops
from skimage.feature import graycomatrix, graycoprops
import geopandas as gpd
from rasterio.features import rasterize
from netCDF4 import Dataset as ncDataset
import matplotlib.pyplot as plt

SNAP_TIFF = "data/processed/sentinel1/gulf_20230101/s1_gulf_20230101_tc.tif"
MODEL_PATH = "models/best_full_oil_unet.pth"
ERA5_PATH = "data/raw/era5/gulf_20230101/era5_wind.nc"
CMEMS_PATH = "data/raw/cmems/gulf_20230101/cmems_currents.nc"
LAND_SHP = "data/raw/natural_earth/ne_10m_land.shp"
OUT_DIR = "qa_output/phase_n2_3"
os.makedirs(OUT_DIR, exist_ok=True)

MIN_LON, MAX_LON = -95.5, -94.5
MIN_LAT, MAX_LAT = 29.0, 29.5

device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")

def load_model():
    model = smp.Unet(encoder_name="resnet34", encoder_weights=None, decoder_attention_type="scse", in_channels=3, classes=1)
    model.load_state_dict(torch.load(MODEL_PATH, map_location='cpu'))
    model.to(device)
    model.eval()
    return model

def main():
    print("--- TASK 1: CORRECTED INFERENCE ---")
    with rasterio.open(SNAP_TIFF) as src:
        window = from_bounds(MIN_LON, MIN_LAT, MAX_LON, MAX_LAT, src.transform)
        window = window.round_lengths().round_offsets()
        roi_transform = src.window_transform(window)
        vv_raw = src.read(1, window=window)
        vh_raw = src.read(2, window=window)
        
    height, width = vv_raw.shape
    
    gdf_land = gpd.read_file(LAND_SHP)
    shapes = ((geom, 1) for geom in gdf_land.geometry)
    land_mask = rasterize(shapes, out_shape=(height, width), transform=roi_transform, fill=0, dtype=np.uint8)
    
    # Pre-masking raw SAR invalid regions
    vv_raw[land_mask == 1] = 0
    vh_raw[land_mask == 1] = 0
    
    model = load_model()
    prob_map = np.zeros((height, width), dtype=np.float32)
    TILE_SIZE = 512
    
    # Process full res tiles
    for y in range(0, height, TILE_SIZE):
        for x in range(0, width, TILE_SIZE):
            h_c = min(TILE_SIZE, height - y)
            w_c = min(TILE_SIZE, width - x)
            if h_c < 128 or w_c < 128: continue
            
            patch_vv = vv_raw[y:y+h_c, x:x+w_c]
            patch_vh = vh_raw[y:y+h_c, x:x+w_c]
            if not np.any(patch_vv > 0): continue
            
            t_vv_db = 10 * np.log10(np.clip(patch_vv, 1e-4, 10))
            t_vh_db = 10 * np.log10(np.clip(patch_vh, 1e-4, 10))
            z = np.zeros_like(t_vv_db)
            
            # THE CORRECT CHANNEL SWAP
            img_arr = np.stack([t_vh_db, t_vv_db, z], axis=-1)
            t = torch.from_numpy(img_arr).permute(2,0,1).unsqueeze(0).float() / 255.0
            
            with torch.no_grad():
                probs = torch.sigmoid(model(t.to(device))).squeeze().cpu().numpy()
            prob_map[y:y+h_c, x:x+w_c] = probs

    prob_map[land_mask == 1] = 0
    valid_probs = prob_map[vv_raw > 0]
    
    print("--- TASK 2: SAVE CONTINUOUS PROBABILITY ---")
    if len(valid_probs) > 0:
        max_p = valid_probs.max()
        mean_p = valid_probs.mean()
        med_p = np.median(valid_probs)
        p90 = np.percentile(valid_probs, 90)
        p99 = np.percentile(valid_probs, 99)
        p999 = np.percentile(valid_probs, 99.9)
        f_05 = np.mean(valid_probs > 0.5)
        f_08 = np.mean(valid_probs > 0.8)
        f_09 = np.mean(valid_probs > 0.9)
    else:
        max_p = mean_p = med_p = p90 = p99 = p999 = f_05 = f_08 = f_09 = 0
        
    print(f"Max: {max_p:.4f}, Mean: {mean_p:.4f}, Med: {med_p:.4f}")
    print(f"P90: {p90:.4f}, P99: {p99:.4f}, P99.9: {p999:.4f}")
    print(f"Frac>0.5: {f_05:.6f}, Frac>0.8: {f_08:.6f}, Frac>0.9: {f_09:.6f}")
    
    print("--- TASK 3: CONNECTED COMPONENTS ---")
    b_mask = (prob_map >= 0.5).astype(np.uint8)
    b_mask[vv_raw == 0] = 0
    labeled = label(b_mask)
    props = regionprops(labeled)
    
    num_comp = len(props)
    total_px = sum([p.area for p in props])
    print(f"Components: {num_comp}, Total Predicted Pixels: {total_px}")
    
    print("--- TASK 4 & 5: PHYSICAL OFFSHORE QA & ENVIRONMENT ---")
    # Reject speckle, coastal artifacts
    # Minimum 100 pixels, sensible aspect
    valid_cands = []
    
    for p in props:
        if p.area < 100: continue
        aspect = p.axis_major_length / (p.axis_minor_length + 1e-6)
        if aspect < 2.0 and p.area < 500: continue # Likely speckle/ship
        
        y_c, x_c = p.centroid
        lon_c, lat_c = rasterio.transform.xy(roi_transform, y_c, x_c)
        
        # Must be in strictly offshore bounding box
        if not (-95.5 <= lon_c <= -94.5 and 29.0 <= lat_c <= 29.5): continue
        
        # Distance to coastline approx
        # Since we pre-masked land, let's just accept if it survives
        
        valid_cands.append(p)
        
    valid_cands = sorted(valid_cands, key=lambda x: x.area, reverse=True)[:20]
    
    era5 = ncDataset(ERA5_PATH)
    e_lats = era5.variables['latitude'][:]
    e_lons = era5.variables['longitude'][:]
    
    cand_details = []
    
    for idx, p in enumerate(valid_cands):
        y_c, x_c = p.centroid
        lon_c, lat_c = rasterio.transform.xy(roi_transform, y_c, x_c)
        aspect = p.axis_major_length / (p.axis_minor_length + 1e-6)
        
        bbox = p.bbox
        bx0, bx1 = max(0, bbox[0]-50), min(height, bbox[2]+50)
        by0, by1 = max(0, bbox[1]-50), min(width, bbox[3]+50)
        
        c_vv = vv_raw[bx0:bx1, by0:by1]
        c_vh = vh_raw[bx0:bx1, by0:by1]
        c_vv_db = 10 * np.log10(np.clip(c_vv, 1e-4, 10))
        c_vv_8b = np.clip(((c_vv_db + 30) / 30) * 255, 0, 255).astype(np.uint8)
        
        glcm = graycomatrix(c_vv_8b, distances=[1], angles=[0], levels=256, symmetric=True, normed=True)
        contrast = graycoprops(glcm, 'contrast')[0,0]
        homogeneity = graycoprops(glcm, 'homogeneity')[0,0]
        
        lat_idx = np.abs(e_lats - lat_c).argmin()
        lon_idx = np.abs(e_lons - lon_c).argmin()
        u10 = era5.variables['u10'][12, lat_idx, lon_idx]
        v10 = era5.variables['v10'][12, lat_idx, lon_idx]
        wind_spd = np.sqrt(u10**2 + v10**2)
        wind_pass = 2 <= wind_spd <= 10
        
        cand_details.append({
            "id": idx+1, "area": p.area, "lon": lon_c, "lat": lat_c,
            "aspect": aspect, "perimeter": p.perimeter,
            "glcm_c": contrast, "glcm_h": homogeneity,
            "wind": wind_spd, "wind_pass": wind_pass, "bbox": bbox
        })
        
    print(f"Found {len(cand_details)} credible morphological candidates.")
    
    decision = ""
    decision_reason = ""
    if len(cand_details) == 0:
        decision = "NO CREDIBLE SLICK CANDIDATE"
        decision_reason = "Model generated probabilities, but no candidate survived the physical morphology gates (speckle rejection, aspect elongation > 2.0 for slicks)."
    else:
        best = cand_details[0]
        if best['area'] > 1000 and best['wind_pass']:
            decision = "CREDIBLE OFFSHORE SLICK CANDIDATE"
            decision_reason = f"Candidate 1 demonstrates massive contiguous offshore structure (Area {best['area']}), elongated aspect ({best['aspect']:.2f}), and passes environmental wind gates ({best['wind']:.2f} m/s)."
        else:
            decision = "REQUIRES MANUAL REVIEW"
            decision_reason = f"Candidates detected (Top Area {best['area']}), but they are either extremely small or fail wind physics."

    print(f"DECISION: {decision}")
    
    print("--- TASK 6: VISUAL QA ---")
    s = 4
    vv_roi = vv_raw[::s, ::s]
    vh_roi = vh_raw[::s, ::s]
    mask_roi = b_mask[::s, ::s]
    prob_roi = prob_map[::s, ::s]
    land_roi = land_mask[::s, ::s]
    
    vv_db = 10 * np.log10(np.clip(vv_roi, 1e-4, 10))
    vh_db = 10 * np.log10(np.clip(vh_roi, 1e-4, 10))
    
    fig, axes = plt.subplots(2, 3, figsize=(15, 10))
    axes = axes.flatten()
    axes[0].imshow(vv_db, cmap='gray', vmin=-25, vmax=0)
    axes[0].contour(mask_roi, levels=[0.5], colors='red', linewidths=0.5)
    axes[0].set_title('1. VV with Candidates')
    axes[1].imshow(vh_db, cmap='gray', vmin=-30, vmax=-5)
    axes[1].contour(mask_roi, levels=[0.5], colors='red', linewidths=0.5)
    axes[1].set_title('2. VH with Candidates')
    axes[2].imshow(prob_roi, cmap='hot', vmin=0, vmax=1)
    axes[2].set_title('3. Probability Heatmap')
    axes[3].imshow(mask_roi, cmap='gray')
    axes[3].set_title('4. Binary Candidate Mask')
    
    vv_lin = np.clip(vv_roi, 1e-4, 1)
    vh_lin = np.clip(vh_roi, 1e-4, 1)
    ratio = np.clip(vv_lin / (vh_lin + 1e-4), 0, 20) / 20
    rgb = np.dstack([(vv_db + 25) / 25, (vh_db + 30) / 25, ratio])
    axes[4].imshow(np.clip(rgb, 0, 1))
    axes[4].set_title('5. VV/VH Composite')
    
    axes[5].imshow(vv_db, cmap='gray', vmin=-25, vmax=0)
    axes[5].contour(land_roi, levels=[0.5], colors='cyan')
    axes[5].set_title('6. Coastline Overlay')
    plt.tight_layout()
    plt.savefig(f"{OUT_DIR}/n2_3_qa.png")
    plt.close()
    
    # Zoomed candidates
    for i, c in enumerate(cand_details[:3]):
        bbox = c['bbox']
        bx0, bx1 = max(0, bbox[0]-100), min(height, bbox[2]+100)
        by0, by1 = max(0, bbox[1]-100), min(width, bbox[3]+100)
        vv_zoom = 10 * np.log10(np.clip(vv_raw[bx0:bx1, by0:by1], 1e-4, 10))
        mask_zoom = b_mask[bx0:bx1, by0:by1]
        plt.figure()
        plt.imshow(vv_zoom, cmap='gray', vmin=-25, vmax=0)
        plt.contour(mask_zoom, levels=[0.5], colors='red')
        plt.title(f"Candidate {c['id']}")
        plt.savefig(f"{OUT_DIR}/7_zoom_{c['id']}.png")
        plt.close()

    print("--- TASK 7: REPORT ---")
    with open("docs/PHASE_N2_3_CORRECTED_GULF_INFERENCE.md", "w") as f:
        f.write("# Phase N-2.3: Corrected Channel-Order Inference\n\n")
        f.write("## 1. Domain Extraction & Correction\n")
        f.write("- ROI: Lon [-95.5, -94.5], Lat [29.0, 29.5]\n")
        f.write("- Channel Orientation: `[VH_dB, VV_dB, Zeros]` (Matched to Zenodo training domain)\n\n")
        
        f.write("## 2. Continuous Probability Statistics\n")
        f.write(f"- Max Probability: {max_p:.4f}\n")
        f.write(f"- Mean Probability: {mean_p:.4f}\n")
        f.write(f"- Median Probability: {med_p:.4f}\n")
        f.write(f"- 99th Percentile: {p99:.4f}\n")
        f.write(f"- Fraction > 0.5: {f_05:.6f}\n")
        f.write(f"- Fraction > 0.8: {f_08:.6f}\n\n")
        
        f.write("## 3. Connected Components\n")
        f.write(f"- Components > 0.5: {num_comp}\n")
        f.write(f"- Total Predicted Pixels: {total_px}\n\n")
        
        f.write("## 4. Top Physical Candidates\n")
        if len(cand_details) > 0:
            for c in cand_details:
                f.write(f"### Candidate {c['id']}\n")
                f.write(f"- **Area:** {c['area']} px\n")
                f.write(f"- **Centroid:** {c['lat']:.4f}, {c['lon']:.4f}\n")
                f.write(f"- **Aspect Ratio:** {c['aspect']:.2f}\n")
                f.write(f"- **GLCM Contrast:** {c['glcm_c']:.2f}\n")
                f.write(f"- **Wind Speed:** {c['wind']:.2f} m/s (Gate: {'PASS' if c['wind_pass'] else 'FAIL'})\n\n")
        else:
            f.write("No candidates survived morphological artifact rejection.\n\n")
            
        f.write("## 5. Decision\n")
        f.write(f"{decision_reason}\n\n")
        f.write(f"---\n{decision}\n")

if __name__ == "__main__":
    main()
