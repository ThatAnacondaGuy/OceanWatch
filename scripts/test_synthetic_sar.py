import numpy as np
import torch
import segmentation_models_pytorch as smp

device = torch.device("cpu")
model = smp.Unet(encoder_name="resnet34", encoder_weights=None, decoder_attention_type="scse", in_channels=3, classes=1)
model.load_state_dict(torch.load("models/best_full_oil_unet.pth", map_location='cpu'))
model.eval()

def try_values(vh_db, vv_db):
    t_vh = torch.full((512, 512), vh_db)
    t_vv = torch.full((512, 512), vv_db)
    z = torch.zeros((512, 512))
    
    t = torch.stack([t_vh, t_vv, z], dim=0).unsqueeze(0).float() / 255.0
    with torch.no_grad():
        probs = torch.sigmoid(model(t)).cpu().numpy()[0,0,0,0]
    return probs

print("Testing synthetic values:")
print(f"Sea (VH=-22, VV=-13): {try_values(-22, -13):.4f}")
print(f"Slick (VH=-28, VV=-19): {try_values(-28, -19):.4f}")

print(f"Zenodo Sea (VH=-33, VV=-20): {try_values(-33, -20):.4f}")
print(f"Zenodo Slick (VH=-40, VV=-25): {try_values(-40, -25):.4f}")
print(f"Zenodo Slick 2 (VH=-45, VV=-30): {try_values(-45, -30):.4f}")
