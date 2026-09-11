# Phase I: xView3 Tiny Dataset Readiness Report

Following the discovery that the local environment previously possessed only 1 independent validation target, I successfully prepared the official xView3 "Tiny" dataset. This dataset acts as the next genuine verification stage prior to unlocking the massive 40GB+ master dataset.

## 1. Scene Acquisition & Storage
The specified physical `.tar.gz` scenes were pulled directly from the xView3 remote indices and decompressed into `data/raw/xview3/tiny/`. 

- **Number of Scenes:** 7 total
- **Real SAR Images:** 14 massive physical arrays (Each scene provides two 1.3 GB arrays: `VV_dB.tif` and `VH_dB.tif`).
- **Total Storage Required:** `26.32 GB` (Decompressed)

## 2. Target Semantics & Label Compatibility
A structural audit of the metadata against the newly unpacked physical arrays confirms full conversion readiness. 
- **Total Vessel Targets:** `1,304` true ship targets physically located within these bounds.
- **Label Compatibility:** `True`. The target parameters (`lat`, `lon`, `vessel_length_m`) map identically to the `is_vessel=True` schema and can be successfully bound using `rasterio.transform` for CFAR candidate alignment.
- **Synthetic Contamination:** `None`. No targets have been duplicated, and no synthetic geometries were inserted.

## 3. Train/Validation Split Separation
The scenes map flawlessly into the required machine learning separation without cross-contamination. 
- **Train Split:** 5 Scenes (`05bc615a9b0e1159t`, `cbe4ad26fe73f118t`, `e98ca5aba8849b06t`, `2899cfb18883251bt`, `72dba3e82f782f67t`)
- **Train Targets:** `378` physical vessels.
- **Validation Split:** 2 Scenes (`590dd08f71056cacv`, `b1844cde847a3942v`)
- **Validation Targets:** `926` physical vessels.
- **Disjoint Separation:** `True` (Asserted strictly on `scene_id`. The validation arrays have never been exposed to the training domain).

**Status:** The xView3 Tiny Dataset is physically extracted, verified, and completely prepared for the CFAR $\rightarrow$ YOLO pipeline conversion. Model training is halted awaiting authorization.
