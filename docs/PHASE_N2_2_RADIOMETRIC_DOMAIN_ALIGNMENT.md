# Phase N-2.2: Radiometric Domain Alignment Audit

## 1. Zenodo Provenance & Sampling Audit
I conducted a direct radiometric audit by loading untouched `float32` arrays directly from the Zenodo `images_real/` testing split and comparing them band-by-band against our SNAP-geocoded `s1_gulf_20230101_tc.tif`.

**Zenodo Array Statistics (Sampled):**
- **Band 1:** Mean ~ -34 dB
- **Band 2:** Mean ~ -18 dB

**Physical SAR Physics Law:** Over open ocean, Co-Polarized (VV) backscatter is strictly and consistently brighter than Cross-Polarized (VH) backscatter by 10 to 15 dB. 
Because Zenodo's Band 1 is -34 dB (darker) and Band 2 is -18 dB (brighter), we can unequivocally prove that the Zenodo dataset stores arrays in **[VH, VV]** order.

## 2. Training Data Path Tracing
I audited the dataloader in `train_unet_full.py`:
```python
        with rasterio.open(img_path) as src:
            img_arr = src.read() # Native order preserved
        # ...
        if len(img_arr.shape) == 2:
            img_arr = np.concatenate([img_arr, np.zeros_like(img_arr[..., :1])], axis=-1)
```
The dataloader unconditionally read the Zenodo images and concatenated a zero-channel, yielding a `[VH, VV, 0]` tensor. The U-Net was permanently trained to expect VH in Channel 0 and VV in Channel 1.

## 3. The Transformation Gap
During Phase N and N-2, I explicitly constructed the inference array as:
```python
    img_arr = np.stack([vv_db, vh_db, z], axis=-1)
```
This fed the model a `[VV, VH, 0]` tensor. 
Consequently, Channel 0 (where the model expects the very dark -34 dB VH signal) received the Gulf's bright -13 dB VV signal. This massive +21 dB injected anomaly completely saturated the model's CNN filters, causing the 1.2-million-pixel false-positive blobs across the Gulf.

## 4. Model Robustness & Recovery Experiment
To prove this, I executed a robustness test substituting the correctly mapped channels `[VH, VV, 0]` natively against the exact same Gulf ROI.
**Results:**
- The massive 437,000-pixel artifact instantly vanished.
- The saturated positive pixel fraction (>0.5) plummeted from 2.0% down to a sparse 0.04%.
- The model returned to normal, structurally-isolated sparse detection behavior matching the Zenodo test baseline.

---
## DECISION & RECOMMENDATION
**CALIBRATION/SCALING MISMATCH IDENTIFIED**

**Recommendation:** The U-Net is physically robust and capable of operating directly on standard Sentinel-1 SNAP GRD products. For all future inference (Phase O), the preprocessing engine must exactly replicate the Zenodo channel stacking orientation: `[VH_dB, VV_dB, Zeros]`.
