# Real Oil Spill Data Validation Report

## 1. Acquisition Attempt & Technical Limitations
Per instructions, an attempt was made to acquire a small subset (at least 100 genuine images) from the official Zenodo Part I archive (`01_Train_Val_Oil_Spill_images.7z`, 40.7 GB) without downloading the entire 40.7 GB dataset.

**Result: BLOCKED (Partial Download Technically Impossible)**

### The `.7z` Format Limitation
The verified Zenodo dataset distributes the images exclusively in a single `.7z` (7-Zip) archive format. Extracting a subset of files from a remote `.7z` archive via HTTP is technically impossible using standard tools (like `wget`, `curl`, `7z`, or `py7zr`) without downloading the entire file first. This is due to two structural characteristics of the 7-Zip format:
1. **Header Location:** The Central Directory (which maps filenames to byte offsets) is written at the *very end* of the archive, meaning a stream cannot be read sequentially from the beginning to pluck out the first 100 files.
2. **Solid Compression:** 7-Zip typically compresses multiple files together into a single "solid block" to maximize compression ratios. To extract file #100, the decompressor must often download and decode files #1 through #99.

Because a partial HTTP-Range download is impossible without fabricating data or exhausting bandwidth, I have explicitly stopped before downloading the 40.7 GB archive, as instructed.

---

## 2. Safest Method to Obtain a Genuine Subset
To safely obtain the ~100 genuine image/mask pairs for the first real training experiment without exhausting automated agent constraints:
1. **Manual Full Download:** Download the 40.7 GB `01_Train_Val_Oil_Spill_images.7z` manually using a high-bandwidth machine.
2. **Local Extraction:** Extract the archive locally using `7z x 01_Train_Val_Oil_Spill_images.7z`.
3. **Subset Selection:** Select exactly 100 images (e.g., `00000.tif` through `00099.tif`) and transfer them into the agent workspace at `data/raw/zenodo/images_real/`. (The corresponding 100 masks are already successfully extracted and residing in `data/raw/zenodo/masks_real/Mask_oil/`).

---

## 3. Validation Checklist (Pending Data)
Once the subset is manually provided, the following validation script will be executed to guarantee readiness for Phase C:
- [ ] **Image-Mask Pairing:** Ensure filenames match exactly.
- [ ] **Dimensions:** Ensure images match the 2048x2048 mask resolution.
- [ ] **Channels & Dtype:** Inspect whether the images are Sentinel-1 Ground Range Detected (GRD) amplitude arrays, and if they represent physical Sigma0-in-dB or require pre-scaling.
- [ ] **Class Balance:** Calculate the true ratio of oil pixels to seawater background in the subset.
- [ ] **Loader Test:** Pass the real images through the PyTorch `Dataset` pipeline to verify focal loss gradients.

**Status:** The real data validation is paused. Please provide the genuine image subset manually to continue.
