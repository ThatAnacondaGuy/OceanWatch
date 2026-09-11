import rasterio
import numpy as np
import torch
import segmentation_models_pytorch as smp

device = torch.device("cpu")
model = smp.Unet(encoder_name="resnet34", encoder_weights=None, decoder_attention_type="scse", in_channels=3, classes=1)
model.load_state_dict(torch.load("models/best_full_oil_unet.pth", map_location='cpu'))
model.eval()

sar_path = "data/demo/ennore/sar/ennore_sar.tif"
with rasterio.open(sar_path) as src:
    vv = src.read(1)
    vh = src.read(2)

vv_db = 10 * np.log10(np.clip(vv, 1e-4, 10))
vh_db = 10 * np.log10(np.clip(vh, 1e-4, 10))

# Normalize
vv_norm = vv_db / 255.0
vh_norm = vh_db / 255.0
zero_ch = np.zeros_like(vv_norm)

img_arr = np.stack([vh_norm, vv_norm, zero_ch], axis=-1)
# crop to 512x512 for a quick test
patch = img_arr[200:712, 200:712, :]
t = torch.from_numpy(patch).permute(2,0,1).unsqueeze(0).float().to(device)

with torch.no_grad():
    probs = torch.sigmoid(model(t)).cpu().numpy()[0,0]

print(f"Max Prob: {probs.max():.4f}")
print(f"Mean Prob: {probs.mean():.4f}")
print(f"Frac > 0.5: {(probs > 0.5).mean():.4f}")
