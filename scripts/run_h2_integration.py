import os
import sys
import numpy as np
import pandas as pd
import torch
import cv2
import rasterio
from skimage.feature import graycomatrix, graycoprops
from datetime import datetime

import segmentation_models_pytorch as smp
from torchvision import transforms

sys.path.append(os.getcwd())
from backend.app.worker.stages.drift import DriftEnsembleManager, EnvironmentalAdapter

def audit_splits():
    print("1. Performing Dataset Split Audit...")
    train = pd.read_csv("data/raw/zenodo/train_split.csv")
    val = pd.read_csv("data/raw/zenodo/val_split.csv")
    test = pd.read_csv("data/raw/zenodo/test_split.csv")
    
    train_ids = set(train['scene_identifier'])
    val_ids = set(val['scene_identifier'])
    test_ids = set(test['scene_identifier'])
    
    disjoint_tv = train_ids.isdisjoint(val_ids)
    disjoint_tt = train_ids.isdisjoint(test_ids)
    disjoint_vt = val_ids.isdisjoint(test_ids)
    
    print(f"   Train IDs: {len(train_ids)}")
    print(f"   Val IDs: {len(val_ids)}")
    print(f"   Test IDs: {len(test_ids)}")
    print(f"   Disjoint (Train/Val): {disjoint_tv}")
    print(f"   Disjoint (Train/Test): {disjoint_tt}")
    print(f"   Disjoint (Val/Test): {disjoint_vt}")
    
    if not (disjoint_tv and disjoint_tt and disjoint_vt):
        raise ValueError("DATASET SPLITS ARE NOT DISJOINT")

def get_geometry_and_glcm(pred_mask, img_array, base_lon=-89.0, base_lat=27.0, res_m=10.0):
    print("\n3. Converting Predicted Mask to Real Slick Geometry...")
    
    # Connected components / Contours
    mask_u8 = (pred_mask * 255).astype(np.uint8)
    contours, _ = cv2.findContours(mask_u8, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours:
        return None
        
    c = max(contours, key=cv2.contourArea)
    area_px = cv2.contourArea(c)
    
    M = cv2.moments(c)
    if M["m00"] != 0:
        cx = int(M["m10"] / M["m00"])
        cy = int(M["m01"] / M["m00"])
    else:
        cx, cy = 0, 0
        
    x, y, w, h = cv2.boundingRect(c)
    
    print(f"   Binary Mask: Extracted")
    print(f"   Connected Components: {len(contours)} total, 1 primary")
    print(f"   Area: {area_px} px^2")
    print(f"   Pixel Centroid: (X: {cx}, Y: {cy})")
    print(f"   Bounding Geometry: [x:{x}, y:{y}, w:{w}, h:{h}]")
    
    # Convert to geographic coordinates (approximation for un-georeferenced Zenodo patch)
    # Assume image center is exactly at base_lon, base_lat. 
    # 1 degree lat ~ 111,111 meters. 1 degree lon at 27N ~ 111,111 * cos(27) ~ 98,998 meters.
    img_h, img_w = pred_mask.shape
    center_x, center_y = img_w / 2, img_h / 2
    
    offset_x_m = (cx - center_x) * res_m
    offset_y_m = (center_y - cy) * res_m # y goes down in image
    
    geo_lon = base_lon + (offset_x_m / 98998.0)
    geo_lat = base_lat + (offset_y_m / 111111.0)
    
    print(f"   Geographic Coordinates: Lon {geo_lon:.6f}, Lat {geo_lat:.6f}")
    
    print("\n4. Applying GLCM & WindGate Validation...")
    # GLCM
    patch = img_array[y:y+h, x:x+w]
    if patch.shape[0] > 0 and patch.shape[1] > 0:
        patch_gray = (np.mean(patch, axis=-1) * 255).astype(np.uint8)
        glcm = graycomatrix(patch_gray, distances=[1], angles=[0], levels=256, symmetric=True, normed=True)
        contrast = graycoprops(glcm, 'contrast')[0, 0]
        homogeneity = graycoprops(glcm, 'homogeneity')[0, 0]
    else:
        contrast, homogeneity = 0, 0
        
    print(f"   GLCM Contrast: {contrast:.4f}")
    print(f"   GLCM Homogeneity: {homogeneity:.4f}")
    
    return geo_lon, geo_lat, contrast, homogeneity

def main():
    print("--- PHASE H-2: REAL SLICK TO DRIFT INTEGRATION ---")
    
    audit_splits()
    
    device = torch.device('mps' if torch.backends.mps.is_available() else 'cpu')
    model = smp.Unet(
        encoder_name="resnet34",
        encoder_weights="imagenet",
        decoder_attention_type="scse",
        in_channels=3,
        classes=1
    ).to(device)
    
    print("\n2. Loading Best Checkpoint (models/best_full_oil_unet.pth)...")
    model.load_state_dict(torch.load("models/best_full_oil_unet.pth"))
    model.eval()
    
    test_df = pd.read_csv("data/raw/zenodo/test_split.csv")
    
    # Find an image with a positive prediction
    found_slick = False
    for idx in range(len(test_df)):
        img_path = test_df.iloc[idx]['image_path']
        
        with rasterio.open(img_path) as src:
            img_arr = src.read(out_shape=(src.count, 256, 256)).transpose(1, 2, 0)
            
        if len(img_arr.shape) == 2:
            img_arr = np.stack([img_arr, img_arr, img_arr], axis=-1)
        elif img_arr.shape[-1] == 2:
            img_arr = np.concatenate([img_arr, np.zeros_like(img_arr[..., :1])], axis=-1)
        elif img_arr.shape[-1] == 4:
            img_arr = img_arr[..., :3]
            
        img_tensor = torch.from_numpy(img_arr).permute(2,0,1).float().unsqueeze(0).to(device) / 255.0
        
        with torch.no_grad():
            logits = model(img_tensor)
            preds = (torch.sigmoid(logits) > 0.5).squeeze().cpu().numpy()
            
        if preds.sum() > 50:  # Valid slick found
            print(f"   Inference successful on Test Image: {os.path.basename(img_path)}")
            res = get_geometry_and_glcm(preds, img_arr)
            if res is not None:
                geo_lon, geo_lat, contrast, hom = res
                found_slick = True
                break
                
    if not found_slick:
        print("[ERROR] No valid slick found in test set limits.")
        return

    print("\n5. Coupling Real Slick with Genuine ERA5 & CMEMS...")
    era5_path = "data/raw/era5/era5_wind_demo.nc"
    cmems_path = "data/raw/cmems/cmems_current_demo.nc"
    
    # Initialize Drift Manager
    manager = DriftEnsembleManager(era5_path, cmems_path)
    
    # WindGate Validation
    print("   Evaluating WindGate Confidence:")
    start_time = datetime(2023, 1, 2, 12, 0) # Midpoint of our downloaded real env data
    
    wind_u = manager.wind_adapter.get_velocity(np.array([geo_lon]), np.array([geo_lat]), start_time)[0]
    wind_v = manager.wind_adapter.get_velocity(np.array([geo_lon]), np.array([geo_lat]), start_time)[1]
    wind_speed = np.sqrt(wind_u**2 + wind_v**2)[0]
    print(f"   Local ERA5 Wind Speed at Slick Centroid: {wind_speed:.2f} m/s")
    
    confidence = 1.0
    if wind_speed > 10.0:
        print("   WindGate: HIGH WIND (Confidence Penalty)")
        confidence *= 0.5
    else:
        print("   WindGate: PASS")
        
    print(f"   Final Slick Confidence: {confidence:.2f}")
    
    print("\n6. Running BACKWARD Lagrangian Drift...")
    # Generate 500 particles for uncertainty representation around the centroid
    n_particles = 500
    init_lons = np.random.normal(geo_lon, 0.005, n_particles)
    init_lats = np.random.normal(geo_lat, 0.005, n_particles)
    
    # direction=-1 for backward hindcasting
    trajectories = manager.run_ensemble(
        init_lons, init_lats, start_time, 
        duration_hours=24, direction=-1, n_runs=1, n_particles_per_run=n_particles
    )
    
    print("\n7. Backward Drift Results & Origin Probability:")
    print(f"   Trajectories computed: {len(trajectories[0])} physical particles.")
    print(f"   Temporal integration: -24 hours.")
    
    final_lons = trajectories[0][-1][0]
    final_lats = trajectories[0][-1][1]
    
    origin_lon_min, origin_lon_max = np.min(final_lons), np.max(final_lons)
    origin_lat_min, origin_lat_max = np.min(final_lats), np.max(final_lats)
    
    print(f"   Origin Probability Envelope:")
    print(f"      Lon Bound: [{origin_lon_min:.4f}, {origin_lon_max:.4f}]")
    print(f"      Lat Bound: [{origin_lat_min:.4f}, {origin_lat_max:.4f}]")
    
    heatmap, xe, ye = manager.generate_probability_heatmap(trajectories, grid_size=20)
    print(f"   Uncertainty Heatmap Generated: {heatmap.shape} matrix mapped to envelope.")
    
    print("\n--- PHASE H-2 COMPLETE ---")

if __name__ == "__main__":
    main()
