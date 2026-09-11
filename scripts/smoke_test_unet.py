import os
import time
import psutil
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader, random_split
from torchvision.transforms import v2
from torchvision import tv_tensors
from torchvision.ops import sigmoid_focal_loss
import segmentation_models_pytorch as smp
import imageio.v3 as iio
import numpy as np

torch.manual_seed(42)
np.random.seed(42)

class OilSpillDataset(Dataset):
    def __init__(self, mask_dir, num_samples=10, transform=None):
        self.mask_files = sorted([os.path.join(mask_dir, f) for f in os.listdir(mask_dir) if f.endswith('.tif')])[:num_samples]
        self.transform = transform
        
    def __len__(self):
        return len(self.mask_files)
        
    def __getitem__(self, idx):
        mask_path = self.mask_files[idx]
        mask = iio.imread(mask_path).astype(np.float32)
        mask = (mask > 0).astype(np.float32)
        
        img = np.random.randn(2048, 2048, 3).astype(np.float32)
        
        img = torch.from_numpy(img).permute(2, 0, 1)
        mask = torch.from_numpy(mask).unsqueeze(0)
        
        img = tv_tensors.Image(img)
        mask = tv_tensors.Mask(mask)
        
        if self.transform:
            img, mask = self.transform(img, mask)
            
        return img.as_subclass(torch.Tensor), mask.as_subclass(torch.Tensor)

def get_memory_usage(device):
    if device.type == 'mps':
        return torch.mps.current_allocated_memory() / (1024**2)
    elif device.type == 'cuda':
        return torch.cuda.memory_allocated() / (1024**2)
    else:
        return psutil.Process(os.getpid()).memory_info().rss / (1024**2)

def main():
    print("--- OCEANWATCH AI: ATTENTION U-NET SMOKE TEST ---")
    
    device = torch.device('mps' if torch.backends.mps.is_available() else 'cpu')
    print(f"Device: {device}")
    
    transforms = v2.Compose([
        v2.Resize((512, 512), antialias=True),
        v2.RandomHorizontalFlip(p=0.5),
        v2.RandomRotation(degrees=15),
        v2.ElasticTransform(alpha=50.0, sigma=5.0)
    ])
    
    mask_dir = "data/raw/zenodo/masks_real/Mask_oil"
    dataset = OilSpillDataset(mask_dir, num_samples=16, transform=transforms)
    
    train_sz = int(0.7 * len(dataset))
    val_sz = int(0.15 * len(dataset))
    test_sz = len(dataset) - train_sz - val_sz
    train_ds, val_ds, test_ds = random_split(dataset, [train_sz, val_sz, test_sz], generator=torch.Generator().manual_seed(42))
    
    train_loader = DataLoader(train_ds, batch_size=2, shuffle=True)
    
    model = smp.Unet(
        encoder_name='resnet34', 
        encoder_weights=None, 
        decoder_attention_type='scse',
        in_channels=3,
        classes=1
    ).to(device)
    
    criterion = lambda p, t: sigmoid_focal_loss(p, t, reduction='mean')
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-4)
    
    def calc_metrics(pr, gt):
        pr = torch.sigmoid(pr) > 0.5
        gt = gt > 0.5
        tp = torch.sum(pr & gt).item()
        fp = torch.sum(pr & ~gt).item()
        fn = torch.sum(~pr & gt).item()
        precision = tp / (tp + fp + 1e-7)
        recall = tp / (tp + fn + 1e-7)
        iou = tp / (tp + fp + fn + 1e-7)
        dice = 2 * tp / (2 * tp + fp + fn + 1e-7)
        return iou, dice, precision, recall

    print(f"Starting smoke test... Total Train Samples: {len(train_ds)}")
    model.train()
    
    start_time = time.time()
    for batch_idx, (imgs, masks) in enumerate(train_loader):
        imgs = imgs.to(device)
        masks = masks.to(device)
        
        optimizer.zero_grad()
        
        preds = model(imgs)
        
        loss = criterion(preds, masks)
        
        loss.backward()
        optimizer.step()
        
        iou, dice, precision, recall = calc_metrics(preds, masks)
        mem = get_memory_usage(device)
        
        print(f"Batch {batch_idx+1}/{len(train_loader)} | Loss: {loss.item():.4f} | IoU: {iou:.4f} | Dice: {dice:.4f} | Mem: {mem:.1f} MB")
        
    throughput = len(train_ds) / (time.time() - start_time)
    print(f"Throughput: {throughput:.2f} samples/sec")
    
    os.makedirs("models/oil_segmentation", exist_ok=True)
    ckpt_path = "models/oil_segmentation/smoke_test_ckpt.pt"
    torch.save(model.state_dict(), ckpt_path)
    print(f"Checkpoint saved to {ckpt_path}")
    print("Smoke test completed successfully.")

if __name__ == "__main__":
    main()
