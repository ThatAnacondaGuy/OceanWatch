import os
import rasterio
from rasterio.windows import from_bounds
import numpy as np
import pandas as pd
import torch
import segmentation_models_pytorch as smp
import matplotlib.pyplot as plt

SNAP_TIFF = "data/processed/sentinel1/gulf_20230101/s1_gulf_20230101_tc.tif"
MODEL_PATH = "models/best_full_oil_unet.pth"
TEST_CSV = "data/raw/zenodo/test_split.csv"
OUT_DIR = "qa_output/phase_n2_1"
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

def calculate_bins(probs):
    b1 = np.sum(probs < 0.01)
    b2 = np.sum((probs >= 0.01) & (probs < 0.1))
    b3 = np.sum((probs >= 0.1) & (probs < 0.5))
    b4 = np.sum((probs >= 0.5) & (probs < 0.9))
    b5 = np.sum((probs >= 0.9) & (probs < 0.99))
    b6 = np.sum(probs >= 0.99)
    total = len(probs)
    return np.array([b1, b2, b3, b4, b5, b6], dtype=float) / total

def process_gulf(model):
    print("Processing Gulf ROI...")
    with rasterio.open(SNAP_TIFF) as src:
        window = from_bounds(MIN_LON, MIN_LAT, MAX_LON, MAX_LAT, src.transform)
        window = window.round_lengths().round_offsets()
        
        # Subsample heavily for faster global stats, or read smaller patches
        # To get true distribution without memory blowing up, we read downsampled by 4
        vv_raw = src.read(1, window=window, out_shape=(window.height//4, window.width//4))
        vh_raw = src.read(2, window=window, out_shape=(window.height//4, window.width//4))
        
    mask = (vv_raw > 0)
    vv_db = 10 * np.log10(np.clip(vv_raw[mask], 1e-4, 10))
    vh_db = 10 * np.log10(np.clip(vh_raw[mask], 1e-4, 10))
    
    input_stats = {
        "vv_min": vv_db.min(), "vv_max": vv_db.max(), "vv_mean": vv_db.mean(), "vv_std": vv_db.std(),
        "vh_min": vh_db.min(), "vh_max": vh_db.max(), "vh_mean": vh_db.mean(), "vh_std": vh_db.std()
    }
    
    # Process full image in patches for prob map
    # Since we need probs, let's process the downsampled array to save time, 
    # it gives the same statistical distribution.
    h, w = vv_raw.shape
    prob_map = np.zeros((h, w), dtype=np.float32)
    TILE_SIZE = 512
    
    for y in range(0, h, TILE_SIZE):
        for x in range(0, w, TILE_SIZE):
            w_c, h_c = min(TILE_SIZE, w - x), min(TILE_SIZE, h - y)
            if w_c < 128 or h_c < 128: continue
            t_vv = vv_raw[y:y+h_c, x:x+w_c]
            t_vh = vh_raw[y:y+h_c, x:x+w_c]
            if not np.any(t_vv > 0): continue
            
            t_vv_db = 10 * np.log10(np.clip(t_vv, 1e-4, 10))
            t_vh_db = 10 * np.log10(np.clip(t_vh, 1e-4, 10))
            z = np.zeros_like(t_vv_db)
            img_arr = np.stack([t_vv_db, t_vh_db, z], axis=-1)
            img_tensor = torch.from_numpy(img_arr).permute(2, 0, 1).unsqueeze(0).float() / 255.0
            with torch.no_grad():
                probs = torch.sigmoid(model(img_tensor.to(device))).squeeze().cpu().numpy()
            prob_map[y:y+h_c, x:x+w_c] = probs
            
    valid_probs = prob_map[mask]
    norm_vv = vv_db / 255.0
    
    return valid_probs, input_stats, norm_vv

def process_zenodo(model):
    print("Processing Zenodo Test Set...")
    df = pd.read_csv(TEST_CSV)
    
    all_probs = []
    vv_dbs = []
    vh_dbs = []
    
    limit = min(20, len(df))
    for idx, row in df.head(limit).iterrows():
        try:
            with rasterio.open(row['image_path']) as src:
                arr = src.read()
                
            if arr.shape[0] == 2:
                vv = arr[0]
                vh = arr[1]
                z = np.zeros_like(vv)
                img_arr = np.stack([vv, vh, z], axis=-1)
            elif arr.shape[0] == 3:
                vv = arr[0]
                vh = arr[1]
                img_arr = arr.transpose(1,2,0)
            else:
                continue
                
            vv_dbs.append(vv.flatten())
            vh_dbs.append(vh.flatten())
            
            img_tensor = torch.from_numpy(img_arr).permute(2, 0, 1).unsqueeze(0).float() / 255.0
            with torch.no_grad():
                probs = torch.sigmoid(model(img_tensor.to(device))).squeeze().cpu().numpy()
                
            all_probs.append(probs.flatten())
        except Exception as e:
            print(f"Skipping {row['image_path']}: {e}")
            
    all_probs = np.concatenate(all_probs)
    vv_db = np.concatenate(vv_dbs)
    vh_db = np.concatenate(vh_dbs)
    
    input_stats = {
        "vv_min": vv_db.min(), "vv_max": vv_db.max(), "vv_mean": vv_db.mean(), "vv_std": vv_db.std(),
        "vh_min": vh_db.min(), "vh_max": vh_db.max(), "vh_mean": vh_db.mean(), "vh_std": vh_db.std()
    }
    
    norm_vv = vv_db / 255.0
    
    return all_probs, input_stats, norm_vv
    

def main():
    model = load_model()
    
    g_probs, g_in, g_norm = process_gulf(model)
    z_probs, z_in, z_norm = process_zenodo(model)
    
    print("=== TASK 3: DISTRIBUTIONS ===")
    print(f"Gulf Max: {g_probs.max():.4f}, Mean: {g_probs.mean():.4f}, P50: {np.percentile(g_probs, 50):.4f}")
    print(f"Gulf P90: {np.percentile(g_probs, 90):.4f}, P99: {np.percentile(g_probs, 99):.4f}")
    print(f"Gulf Pos Frac: {np.mean(g_probs >= 0.5):.4f}")
    
    print(f"Zenodo Max: {z_probs.max():.4f}, Mean: {z_probs.mean():.4f}, P50: {np.percentile(z_probs, 50):.4f}")
    print(f"Zenodo P90: {np.percentile(z_probs, 90):.4f}, P99: {np.percentile(z_probs, 99):.4f}")
    print(f"Zenodo Pos Frac: {np.mean(z_probs >= 0.5):.4f}")
    
    print("=== TASK 4: INPUT DISTRIBUTIONS ===")
    for k in g_in:
        print(f"{k} -> Gulf: {g_in[k]:.2f} | Zenodo: {z_in[k]:.2f}")
        
    print(f"Norm VV Mean -> Gulf: {g_norm.mean():.4f} | Zenodo: {z_norm.mean():.4f}")
        
    print("=== TASK 5: CALIBRATION BINS ===")
    g_bins = calculate_bins(g_probs)
    z_bins = calculate_bins(z_probs)
    bin_labels = ["<0.01", "0.01-0.1", "0.1-0.5", "0.5-0.9", "0.9-0.99", ">0.99"]
    
    for i, lbl in enumerate(bin_labels):
        print(f"Bin {lbl} -> Gulf: {g_bins[i]:.4f} | Zenodo: {z_bins[i]:.4f}")
        
    # Decision
    # If Gulf predictions > 0.5 are like 30% but Zenodo is 1%, it's domain shift
    # If both are > 0.5 for a massive fraction, it's model implementation
    
    decision = ""
    if z_bins[4] + z_bins[5] > 0.2: # If Zenodo has > 20% saturated
        decision = "MODEL INFERENCE ISSUE"
    elif g_bins[4] + g_bins[5] > 0.1 and z_bins[4] + z_bins[5] < 0.05:
        decision = "DOMAIN SHIFT SUSPECTED"
    else:
        decision = "PROBABILITY BEHAVIOR ACCEPTABLE"
        
    print(f"DECISION: {decision}")
    
    # Save Report
    with open("docs/PHASE_N2_1_MODEL_DOMAIN_SHIFT_AUDIT.md", "w") as f:
        f.write("# Phase N-2.1: Model Domain-Shift Audit\n\n")
        f.write("## Input Distribution Comparison\n")
        f.write("| Metric | Gulf ROI | Zenodo Test |\n")
        f.write("|---|---|---|\n")
        f.write(f"| VV Mean (dB) | {g_in['vv_mean']:.2f} | {z_in['vv_mean']:.2f} |\n")
        f.write(f"| VV Std | {g_in['vv_std']:.2f} | {z_in['vv_std']:.2f} |\n")
        f.write(f"| VH Mean (dB) | {g_in['vh_mean']:.2f} | {z_in['vh_mean']:.2f} |\n")
        f.write(f"| VH Std | {g_in['vh_std']:.2f} | {z_in['vh_std']:.2f} |\n")
        f.write(f"| Normalized VV Mean | {g_norm.mean():.4f} | {z_norm.mean():.4f} |\n\n")
        
        f.write("## Probability Behavior\n")
        f.write("| Bin | Gulf ROI | Zenodo Test |\n")
        f.write("|---|---|---|\n")
        for i, lbl in enumerate(bin_labels):
            f.write(f"| {lbl} | {g_bins[i]:.4f} | {z_bins[i]:.4f} |\n")
        f.write("\n")
        
        f.write(f"**Zenodo Pos Frac (>=0.5):** {np.mean(z_probs >= 0.5):.4f}\n")
        f.write(f"**Gulf Pos Frac (>=0.5):** {np.mean(g_probs >= 0.5):.4f}\n\n")
        
        f.write("---\n")
        f.write(f"{decision}\n")

if __name__ == "__main__":
    main()
