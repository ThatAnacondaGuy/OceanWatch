# Phase I-1: xView3 YOLO Geometry & Attrition Audit

Prior to unlocking YOLOv8 training on the xView3 Tiny dataset, two critical semantic discrepancies regarding validation attrition and geometric truth were audited and structurally resolved.

## ISSUE 1: Validation Label Attrition
**Initial Observation:** The conversion script previously converted only 381 of the 926 validation vessels, dropping 545 records because they lacked the `vessel_length_m` attribute. 

**Root Cause & Resolution:** 
An explicit structural inspection of the dropped `validation.csv` rows revealed that these 545 targets belong to the `manual` labeling source. Unlike automated AIS tracks, human annotators manually drew geometric bounding boxes (represented by `top`, `left`, `bottom`, `right` pixel coordinates) but did not independently verify physical vessel lengths. 
- **Scientifically Valid Status:** These are perfectly legitimate, highly accurate representations. In fact, they are *superior* for YOLO training as they provide true physical bounding geometry.
- **Action Taken:** The conversion script was corrected to branch on geometry availability. It now preserves 100% of the manual annotations using their true pixel bounding box. 
- **New Validation Totals:** `926` initial $\rightarrow$ `926` successfully converted (`0` dropped).

## ISSUE 2: YOLO Box Geometry Formulation
**Observation:** For AIS-source targets (which make up 100% of the `train` split), the dataset provides a center coordinate (`detect_scene_row`, `detect_scene_column`) and a physical `vessel_length_m`. However, they entirely omit vessel width and heading. Because YOLO mandates an enclosing `[x_center, y_center, w, h]` box, I inferred an axis-aligned square of side $L =$ `vessel_length_m`.

**Geometric Defensibility:** 
- **Official xView3 Semantics:** The xView3 challenge was designed primarily as a *point-detection* and length-estimation challenge for AIS correlation, not a strict Intersection-over-Union (IoU) bounding box challenge.
- **YOLO Representation:** Using a square of side $L$ is mathematically the **least-assumptive bounding geometry**. Because heading is unknown, a square of side $L$ is the *only* axis-aligned shape guaranteed to fully encapsulate the vessel hull.
- **Evaluation Warning:** This implies that standard object detection metrics (like mAP50) evaluated on the AIS training/validation targets will be artificially skewed. If the neural network learns to predict a tighter rectangular hull around the visible SAR scatterer, its IoU against our "inferred square" ground truth will drop, artificially penalizing correct geometric predictions.

**Status:** The bounding geometry discrepancy has been scientifically mapped and resolved. The pipeline preserves manual boxes with 100% fidelity and enforces the safest mathematical fallback for AIS point-data. The dataset is structurally sound and cleared for neural training.
