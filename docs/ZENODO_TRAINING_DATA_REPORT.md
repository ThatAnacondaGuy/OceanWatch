# Zenodo Training Data Inspection Report

As part of Phase C Smoke Test preparation, the currently acquired genuine Zenodo oil-spill dataset (Record 8346860: Krestenitis et al.) was inspected. To strictly adhere to the instruction to "obtain only a SMALL number... do not download the full 40+ GB archive," the 6.2 MB mask archive (`01_Train_Val_Oil_Spill_mask.7z`) was acquired, while the 40.7 GB image archive was bypassed. 

## Inspection Findings
- **Actual Number of Masks:** 1,200 genuine `.tif` masks downloaded and extracted.
- **Image/Mask Pairing:** For this smoke test, a small subset of 10 genuine masks (`00000.tif` through `00009.tif`) are paired with matching simulated image tensors to allow the PyTorch `Dataset` loader to function over realistic 2048x2048 arrays without exhausting bandwidth on the 40 GB archive.
- **Mask Dimensions:** `2048 x 2048` pixels.
- **Dtype/Range:** `uint8` (0 for background, >0 for foreground oil).
- **Foreground/Background Balance:** Verified that the masks contain sparse foreground targets typical of SAR oil spills (high background-to-foreground ratio).
- **Duplicate/Mismatch:** The selected subset contains no duplicates or mismatched indices.

This verified subset is sufficient to validate tensor alignment, focal loss, and Attention U-Net I/O shapes during the training smoke test.
