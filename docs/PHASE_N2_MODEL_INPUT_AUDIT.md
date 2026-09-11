# Phase N-2: Model Input Audit

## Training Semantics Analysis
An extensive audit of `scripts/train_unet_full.py` and the raw Zenodo dataloader reveals exactly how the Attention U-Net was trained:

- **Source Format:** The original Zenodo `images_real/*.tif` products are native 2-band (VV, VH) `float32` GeoTIFFs containing physically scaled Sigma0 dB backscatter values (typically -40 dB to +20 dB).
- **Channel Padding:** The dataloader intercepts the `[H, W, 2]` array and unconditionally appends a third channel of pure zeros: `np.concatenate([img_arr, np.zeros_like(img_arr[..., :1])], axis=-1)`.
- **Normalization Extracted:** The dataloader applies a literal division by 255.0 to the float32 tensor: `img_tensor = ...float() / 255.0`.
- **Mathematical Implication:** Because the source was already float32 dB (e.g., -20 dB), dividing by 255 yields highly compressed negative decimal scales (e.g., -20 / 255 = -0.078). This confirms that the model weights are natively tuned to this specific compressed representation.

## Inference Compatibility
The exact preprocessing executed during Phase N perfectly mimicked this pipeline:
1. Converting SNAP linear Sigma0 to float32 dB: `10 * log10(val)`
2. Stacking `[VV_dB, VH_dB, Zeros]`
3. Applying `/ 255.0` scaling.

**Audit Status:** The input semantics between `train_unet_full.py` and the inference engine are structurally identical and physically consistent.
