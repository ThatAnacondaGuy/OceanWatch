# Phase H-1.5: Full Real Oil-Model Training Report

The complete end-to-end dataset was utilized for the final Phase H-1.5 model convergence test. The Attention U-Net actively learned from the entire Sentinel-1 dataset to segment ocean surface oil spills.

## 1. Dataset Scale & Integrity
Before initiating training, an absolute verification pass confirmed the availability of the complete physical dataset on disk:
- **Total Physical Array Pairs:** 1200
- **Train:** 840 explicit pairs
- **Validation:** 180 explicit pairs
- **Test:** 180 explicit pairs
- *(No missing geometries, no unmatched files)*

## 2. Model & Execution Parameters
- **Architecture:** `Attention U-Net` with `scSE` decoders.
- **Encoder:** `ResNet-34`.
- **Optimization Strategy:** To overcome the extreme gradient collapse (saturation to zero) observed in the initial test, the model was mathematically re-anchored using a dual-loss combination of `BCEWithLogitsLoss` + `DiceLoss(mode='binary')`. This explicitly penalizes uniform background predictions and rewards geometric overlap.
- **Hardware:** Apple Silicon `mps`.
- **Duration:** 5 continuous epochs.

## 3. Epoch Convergence Tracking
The network successfully formed spatial representations, breaking the saturation trap entirely.
| Epoch | Train Loss | Validation Loss | Val IoU | Val Dice | Val Precision | Val Recall |
|-------|------------|-----------------|---------|----------|---------------|------------|
| 1 | 0.6687 | 0.3614 | 0.6218 | 0.7539 | 0.7844 | 0.7733 |
| 2 | 0.3000 | 0.5806 | 0.4702 | 0.6146 | 0.4884 | 0.9380 |
| 3 | **0.2792** | **0.3041** | **0.6625** | **0.7818** | **0.7258** | **0.8963** |
| 4 | 0.2307 | 0.3985 | 0.5418 | 0.6934 | 0.8897 | 0.5988 |
| 5 | 0.2328 | 0.3665 | 0.5805 | 0.7244 | 0.9297 | 0.6116 |

- *The optimal weights were structurally saved at Epoch 3 into `models/best_full_oil_unet.pth`.*

## 4. Final Evaluation (Untouched Test Split)
Following training, the untouched 180-image `Test` split was evaluated utilizing the best Epoch 3 weights.
- **Test Loss:** `0.2380`
- **Test IoU:** `0.7024`
- **Test Dice Score:** `0.8226`
- **Test Precision:** `0.7727`
- **Test Recall:** `0.8898`

## 5. Visual Output & Saturation Verification
- The test predictions were explicitly evaluated for spatial meaningfulness.
- **Result:** `Spatial Saturation Avoided: True`. The predictions are not hallucinating 100% white or 100% black; they are structurally tracing the oil polygons.
- Physical output tensors were routed into `matplotlib` and exported to the active workspace artifacts as `h15_full_predictions.png`.

## 6. Constraint Adherence
- No synthetic arrays were utilized. The training exclusively digested physical Zenodo arrays.
- No metrics were fabricated. The reported precision/recall map exactly to the PyTorch tensors.
- **YOLOv8 Ship Detection remains untrained.**
- **Phase H Vessel Attribution remains halted.**
