import rasterio
from rasterio.windows import from_bounds
import numpy as np
import torch
import segmentation_models_pytorch as smp

SNAP_TIFF = "data/processed/sentinel1/gulf_20230101/s1_gulf_20230101_tc.tif"
MODEL_PATH = "models/best_full_oil_unet.pth"
MIN_LON, MAX_LON = -95.5, -94.5
MIN_LAT, MAX_LAT = 29.0, 29.5

device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
model = smp.Unet(encoder_name="resnet34", encoder_weights=None, decoder_attention_type="scse", in_channels=3, classes=1)
model.load_state_dict(torch.load(MODEL_PATH, map_location='cpu'))
model.to(device)
model.eval()

with rasterio.open(SNAP_TIFF) as src:
    window = from_bounds(MIN_LON, MIN_LAT, MAX_LON, MAX_LAT, src.transform).round_lengths().round_offsets()
    # Downsample by 4 to get quick full-ROI stats without OOM
    vv = src.read(1, window=window, out_shape=(window.height//4, window.width//4))
    vh = src.read(2, window=window, out_shape=(window.height//4, window.width//4))

mask = vv > 0
vv_db = 10 * np.log10(np.clip(vv, 1e-4, 10))
vh_db = 10 * np.log10(np.clip(vh, 1e-4, 10))

# WRONG SWAP (Phase N)
img_wrong = np.stack([vv_db, vh_db, np.zeros_like(vv_db)], axis=-1)
# CORRECT SWAP (Matching Zenodo VH, VV)
img_correct = np.stack([vh_db, vv_db, np.zeros_like(vv_db)], axis=-1)

def run_inf(img_arr):
    h, w, c = img_arr.shape
    prob_map = np.zeros((h, w), dtype=np.float32)
    TILE = 512
    for y in range(0, h, TILE):
        for x in range(0, w, TILE):
            h_c = min(TILE, h - y)
            w_c = min(TILE, w - x)
            patch = img_arr[y:y+h_c, x:x+w_c]
            if not np.any(patch[...,0] != 0): continue
            t = torch.from_numpy(patch).permute(2,0,1).unsqueeze(0).float() / 255.0
            with torch.no_grad():
                probs = torch.sigmoid(model(t.to(device))).squeeze().cpu().numpy()
            prob_map[y:y+h_c, x:x+w_c] = probs
    return prob_map

p_correct = run_inf(img_correct)[mask]
print(f"CORRECT (VH, VV) -> Max: {p_correct.max():.4f}, Mean: {p_correct.mean():.4f}, Frac>0.5: {np.mean(p_correct>0.5):.6f}")
