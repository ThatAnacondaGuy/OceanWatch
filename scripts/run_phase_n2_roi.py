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
import matplotlib.pyplot as plt

SNAP_TIFF = "data/processed/sentinel1/gulf_20230101/s1_gulf_20230101_tc.tif"
MODEL_PATH = "models/best_full_oil_unet.pth"
LAND_SHP = "data/raw/natural_earth/ne_10m_land.shp"
OUT_DIR = "qa_output/phase_n2"
os.makedirs(OUT_DIR, exist_ok=True)

# ROI Physics Domain
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
    print("--- TASK 2: EXACT ROI CROP ---")
    with rasterio.open(SNAP_TIFF) as src:
        # rasterio from_bounds expects (left, bottom, right, top)
        window = from_bounds(MIN_LON, MIN_LAT, MAX_LON, MAX_LAT, src.transform)
        # Snap to integer pixels
        window = window.round_lengths().round_offsets()
        
        roi_transform = src.window_transform(window)
        vv_raw = src.read(1, window=window)
        vh_raw = src.read(2, window=window)
        
        height, width = vv_raw.shape
        print(f"ROI Pixel Dimensions: {width} x {height}")
        
    print("--- TASK 3: LAND MASK ---")
    gdf_land = gpd.read_file(LAND_SHP)
    shapes = ((geom, 1) for geom in gdf_land.geometry)
    land_mask = rasterize(shapes, out_shape=(height, width), transform=roi_transform, fill=0, dtype=np.uint8)
    
    # Exclude land before inference (set VV/VH to nodata)
    vv_raw[land_mask == 1] = 0
    vh_raw[land_mask == 1] = 0
    
    print("--- TASK 4: TARGETED U-NET INFERENCE ---")
    model = load_model()
    
    prob_map = np.zeros((height, width), dtype=np.float32)
    TILE_SIZE = 512
    STRIDE = 512
    
    # Process in tiles
    for y in range(0, height, STRIDE):
        for x in range(0, width, STRIDE):
            w, h = min(TILE_SIZE, width - x), min(TILE_SIZE, height - y)
            if w < 128 or h < 128: continue # skip tiny edge slivers
            
            tile_vv = vv_raw[y:y+h, x:x+w]
            tile_vh = vh_raw[y:y+h, x:x+w]
            
            # Skip if entirely land/nodata
            if not np.any(tile_vv > 0): continue
                
            vv_db = 10 * np.log10(np.clip(tile_vv, 1e-4, 10))
            vh_db = 10 * np.log10(np.clip(tile_vh, 1e-4, 10))
            z = np.zeros_like(vv_db)
            img_arr = np.stack([vv_db, vh_db, z], axis=-1)
            img_tensor = torch.from_numpy(img_arr).permute(2, 0, 1).unsqueeze(0).float() / 255.0
            
            with torch.no_grad():
                logits = model(img_tensor.to(device))
                probs = torch.sigmoid(logits).squeeze().cpu().numpy()
            
            prob_map[y:y+h, x:x+w] = probs
            
    # Mask out land from probabilities explicitly
    prob_map[land_mask == 1] = 0
    
    valid_probs = prob_map[prob_map > 0]
    if len(valid_probs) > 0:
        max_prob = np.max(valid_probs)
        p99 = np.percentile(valid_probs, 99)
        p999 = np.percentile(valid_probs, 99.9)
    else:
        max_prob = p99 = p999 = 0
        
    print(f"Max Probability: {max_prob:.4f}")
    print(f"99th Percentile: {p99:.4f}")
    print(f"99.9th Percentile: {p999:.4f}")
    
    # Histogram
    plt.figure()
    plt.hist(prob_map[land_mask == 0].flatten(), bins=50, range=(0.01, 1.0))
    plt.title("Offshore Probability Distribution")
    plt.savefig(f"{OUT_DIR}/prob_histogram.png")
    
    print("--- TASK 5: DIAGNOSTIC THRESHOLDS ---")
    thresholds = [0.30, 0.40, 0.50, 0.60, 0.70, 0.80]
    thresh_results = {}
    
    for t in thresholds:
        b_mask = (prob_map >= t).astype(np.uint8)
        labeled = label(b_mask)
        props = regionprops(labeled)
        num_components = len(props)
        if num_components > 0:
            max_area = max([p.area for p in props])
            total_area = sum([p.area for p in props])
        else:
            max_area = total_area = 0
        thresh_results[t] = (num_components, max_area, total_area)
        print(f"Threshold {t:.2f}: {num_components} components, Max Area: {max_area}, Total Area: {total_area}")
        
    print("--- TASK 6 & 9: OFFSHORE MORPHOLOGY & DECISION ---")
    
    # Let's inspect the strongest threshold that yields something
    # If 0.5 yields nothing, model shows no plausible response
    strong_candidates = [p for p in regionprops(label(prob_map >= 0.5)) if p.area > 100]
    
    decision = ""
    decision_reason = ""
    
    if max_prob < 0.5:
        decision = "MODEL SHOWS NO PLAUSIBLE OFFSHORE RESPONSE"
        decision_reason = f"The maximum offshore probability is {max_prob:.4f}, failing to reach the basic 0.5 confidence threshold anywhere in the ROI."
    elif len(strong_candidates) == 0:
        decision = "MODEL SHOWS NO PLAUSIBLE OFFSHORE RESPONSE"
        decision_reason = f"Probabilities breached 0.5 but failed to form any contiguous morphological structure > 100 pixels."
    else:
        # Check morphology of top candidate
        top = max(strong_candidates, key=lambda x: x.area)
        aspect = top.axis_major_length / (top.axis_minor_length + 1e-6)
        
        # Determine if it's an artifact
        if top.area < 200 and aspect < 2.0:
            decision = "MODEL SHOWS NO PLAUSIBLE OFFSHORE RESPONSE"
            decision_reason = f"Top candidate is a small, non-elongated speckle (area {top.area}, aspect {aspect:.2f}), typical of radar noise, not an oil slick."
        else:
            decision = "VALID OFFSHORE RESPONSE"
            decision_reason = f"A candidate of area {top.area} and aspect {aspect:.2f} was detected, suggesting a structural surface anomaly."

    print(f"DECISION: {decision}")
    
    print("--- TASK 8: VISUAL QA ---")
    # Downsample for plotting
    s = 4
    vv_roi = vv_raw[::s, ::s]
    vh_roi = vh_raw[::s, ::s]
    mask_roi = prob_map[::s, ::s] >= 0.5
    prob_roi = prob_map[::s, ::s]
    land_roi = land_mask[::s, ::s]
    
    vv_db = 10 * np.log10(np.clip(vv_roi, 1e-4, 10))
    vh_db = 10 * np.log10(np.clip(vh_roi, 1e-4, 10))
    
    fig, axes = plt.subplots(2, 3, figsize=(15, 10))
    axes = axes.flatten()
    
    axes[0].imshow(vv_db, cmap='gray', vmin=-25, vmax=0)
    axes[0].set_title('1. VV ROI')
    
    axes[1].imshow(vh_db, cmap='gray', vmin=-30, vmax=-5)
    axes[1].set_title('2. VH ROI')
    
    axes[2].imshow(prob_roi, cmap='hot', vmin=0, vmax=1)
    axes[2].set_title('3. Probability Heatmap')
    
    axes[3].imshow(land_roi, cmap='gray')
    axes[3].set_title('4. Land Mask')
    
    axes[4].imshow(prob_roi, cmap='hot', vmin=0, vmax=1)
    axes[4].contour(land_roi, levels=[0.5], colors='cyan', linewidths=1)
    axes[4].set_title('5. Prob + Coastline')
    
    axes[5].imshow(vv_db, cmap='gray', vmin=-25, vmax=0)
    axes[5].contour(mask_roi, levels=[0.5], colors='red', linewidths=1)
    axes[5].set_title('6. Top Candidate Outlines')
    
    plt.tight_layout()
    plt.savefig(f"{OUT_DIR}/qa_visuals.png")
    
    with open("docs/PHASE_N2_TARGETED_OFFSHORE_INFERENCE.md", "w") as f:
        f.write("# Phase N-2: Targeted Offshore ROI Inference\n\n")
        f.write("## 1. Domain Extraction\n")
        f.write(f"- Bounds: Lon [-95.5, -94.5], Lat [29.0, 29.5]\n")
        f.write(f"- Extracted Array Size: {width} x {height} pixels\n\n")
        f.write("## 2. Continuous Probability Surface\n")
        f.write(f"- Max Offshore Probability: {max_prob:.4f}\n")
        f.write(f"- 99th Percentile: {p99:.4f}\n")
        f.write(f"- 99.9th Percentile: {p999:.4f}\n\n")
        f.write("## 3. Diagnostic Threshold Sweeps\n")
        for t, (n, ma, ta) in thresh_results.items():
            f.write(f"- **{t:.2f}**: {n} components | Max Area: {ma} px | Total: {ta} px\n")
        f.write("\n## 4. Morphology & Validation\n")
        f.write(f"{decision_reason}\n\n")
        f.write(f"---\n{decision}\n")

if __name__ == "__main__":
    main()
