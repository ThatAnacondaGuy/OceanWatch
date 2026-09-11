import os
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
import segmentation_models_pytorch as smp
from segmentation_models_pytorch.losses import DiceLoss
import rasterio
from rasterio.enums import Resampling
import matplotlib.pyplot as plt

class FastZenodoDataset(Dataset):
    def __init__(self, csv_path, target_size=(256, 256)):
        self.df = pd.read_csv(csv_path)
        self.target_size = target_size
        
    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        img_path = row['image_path']
        mask_path = row['mask_path']
        
        # Fast downsampling read via rasterio
        with rasterio.open(img_path) as src:
            img_arr = src.read(
                out_shape=(src.count, self.target_size[0], self.target_size[1]),
                resampling=Resampling.bilinear
            ).transpose(1, 2, 0)
            
        with rasterio.open(mask_path) as src:
            mask_arr = src.read(
                1,
                out_shape=(self.target_size[0], self.target_size[1]),
                resampling=Resampling.nearest
            )
            
        # Format channels (2 -> 3)
        if len(img_arr.shape) == 2:
            img_arr = np.stack([img_arr, img_arr, img_arr], axis=-1)
        elif img_arr.shape[-1] == 2:
            img_arr = np.concatenate([img_arr, np.zeros_like(img_arr[..., :1])], axis=-1)
        elif img_arr.shape[-1] == 4:
            img_arr = img_arr[..., :3]
            
        # Format masks
        mask_arr = (mask_arr > 0).astype(np.float32)
        
        img_tensor = torch.from_numpy(img_arr).permute(2,0,1).float() / 255.0
        mask_tensor = torch.from_numpy(mask_arr).unsqueeze(0).float()
        
        return img_tensor, mask_tensor

def calculate_metrics(preds, masks):
    tp = (preds * masks).sum()
    fp = (preds * (1 - masks)).sum()
    fn = ((1 - preds) * masks).sum()
    
    iou = tp / (tp + fp + fn + 1e-7)
    dice = 2 * tp / (2 * tp + fp + fn + 1e-7)
    prec = tp / (tp + fp + 1e-7)
    rec = tp / (tp + fn + 1e-7)
    return iou.item(), dice.item(), prec.item(), rec.item()

def main():
    print("--- PHASE H-1.5: FULL REAL ATTENTION U-NET TRAINING ---")
    
    train_csv = "data/raw/zenodo/train_split.csv"
    val_csv = "data/raw/zenodo/val_split.csv"
    test_csv = "data/raw/zenodo/test_split.csv"
    
    print("1. Integrity Check & Loading...")
    train_ds = FastZenodoDataset(train_csv)
    val_ds = FastZenodoDataset(val_csv)
    test_ds = FastZenodoDataset(test_csv)
    
    print(f"   Train: {len(train_ds)} | Val: {len(val_ds)} | Test: {len(test_ds)}")
    
    train_loader = DataLoader(train_ds, batch_size=8, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=8, shuffle=False, num_workers=0)
    test_loader = DataLoader(test_ds, batch_size=8, shuffle=False, num_workers=0)
    
    device = torch.device('mps' if torch.backends.mps.is_available() else 'cpu')
    print(f"Hardware: {device}")
    
    model = smp.Unet(
        encoder_name="resnet34",
        encoder_weights="imagenet",
        decoder_attention_type="scse",
        in_channels=3,
        classes=1
    ).to(device)
    
    # Combined Loss to combat extreme imbalance and prevent all-zero saturation
    bce_loss = nn.BCEWithLogitsLoss()
    dice_loss = DiceLoss(mode='binary')
    
    def combined_loss(logits, masks):
        return bce_loss(logits, masks) + dice_loss(logits, masks)
        
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
    
    best_val_loss = float('inf')
    os.makedirs("models", exist_ok=True)
    best_model_path = "models/best_full_oil_unet.pth"
    
    num_epochs = 5
    print("\n2. Full Training Execution")
    for epoch in range(num_epochs):
        model.train()
        train_loss = 0
        for imgs, masks in train_loader:
            imgs, masks = imgs.to(device), masks.to(device)
            optimizer.zero_grad()
            logits = model(imgs)
            loss = combined_loss(logits, masks)
            loss.backward()
            optimizer.step()
            train_loss += loss.item()
            
        train_loss /= len(train_loader)
        
        model.eval()
        val_loss, val_iou, val_dice, val_prec, val_rec = 0, 0, 0, 0, 0
        with torch.no_grad():
            for imgs, masks in val_loader:
                imgs, masks = imgs.to(device), masks.to(device)
                logits = model(imgs)
                loss = combined_loss(logits, masks)
                val_loss += loss.item()
                
                preds = (torch.sigmoid(logits) > 0.5).float()
                i, d, p, r = calculate_metrics(preds, masks)
                val_iou += i
                val_dice += d
                val_prec += p
                val_rec += r
                
        val_loss /= len(val_loader)
        val_iou /= len(val_loader)
        val_dice /= len(val_loader)
        val_prec /= len(val_loader)
        val_rec /= len(val_loader)
        
        print(f"Epoch {epoch+1}/{num_epochs}")
        print(f"  Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f}")
        print(f"  Val IoU: {val_iou:.4f} | Dice: {val_dice:.4f} | Prec: {val_prec:.4f} | Rec: {val_rec:.4f}")
        
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            torch.save(model.state_dict(), best_model_path)
            print(f"  -> Saved Best Checkpoint")
            
    print("\n3. Held-Out Test Evaluation")
    model.load_state_dict(torch.load(best_model_path))
    model.eval()
    
    test_loss, test_iou, test_dice, test_prec, test_rec = 0, 0, 0, 0, 0
    with torch.no_grad():
        for imgs, masks in test_loader:
            imgs, masks = imgs.to(device), masks.to(device)
            logits = model(imgs)
            loss = combined_loss(logits, masks)
            test_loss += loss.item()
            
            preds = (torch.sigmoid(logits) > 0.5).float()
            i, d, p, r = calculate_metrics(preds, masks)
            test_iou += i
            test_dice += d
            test_prec += p
            test_rec += r
            
    test_loss /= len(test_loader)
    test_iou /= len(test_loader)
    test_dice /= len(test_loader)
    test_prec /= len(test_loader)
    test_rec /= len(test_loader)
    
    print(f"  Test Loss: {test_loss:.4f}")
    print(f"  Test IoU: {test_iou:.4f}")
    print(f"  Test Dice: {test_dice:.4f}")
    print(f"  Test Precision: {test_prec:.4f}")
    print(f"  Test Recall: {test_rec:.4f}")
    
    print("\n4. Visualization Generation")
    fig, axes = plt.subplots(3, 3, figsize=(10, 10))
    axes[0, 0].set_title("SAR Image")
    axes[0, 1].set_title("Ground Truth Mask")
    axes[0, 2].set_title("Predicted Mask")
    
    samples_plotted = 0
    saturation_check_passed = True
    
    # We load 1 batch from test loader
    with torch.no_grad():
        imgs, masks = next(iter(test_loader))
        imgs, masks = imgs.to(device), masks.to(device)
        logits = model(imgs)
        preds = (torch.sigmoid(logits) > 0.5).float()
        
        for i in range(min(3, len(imgs))):
            pred_ratio = preds[i].mean().item()
            if pred_ratio > 0.95 or pred_ratio < 0.0001:
                saturation_check_passed = False
                
            img_np = imgs[i].cpu().numpy()[0]
            mask_np = masks[i].cpu().numpy()[0]
            pred_np = preds[i].cpu().numpy()[0]
            
            axes[i, 0].imshow(img_np, cmap='gray')
            axes[i, 0].axis('off')
            axes[i, 1].imshow(mask_np, cmap='gray')
            axes[i, 1].axis('off')
            axes[i, 2].imshow(pred_np, cmap='gray')
            axes[i, 2].axis('off')
            
    plt.tight_layout()
    artifact_dir = "/Users/devopsdreamer/.gemini/antigravity/brain/f82eb8e5-4ff2-4905-818e-2a4a966a3104"
    vis_path = os.path.join(artifact_dir, "h15_full_predictions.png")
    plt.savefig(vis_path)
    print(f"  Visualizations exported to: {vis_path}")
    print(f"  Spatial Saturation Avoided (Meaningful Prediction): {saturation_check_passed}")

if __name__ == "__main__":
    main()
