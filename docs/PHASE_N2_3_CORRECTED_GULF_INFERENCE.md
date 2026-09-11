# Phase N-2.3: Corrected Channel-Order Inference

## 1. Domain Extraction & Correction
- ROI: Lon [-95.5, -94.5], Lat [29.0, 29.5]
- Channel Orientation: `[VH_dB, VV_dB, Zeros]` (Matched to Zenodo training domain)

## 2. Continuous Probability Statistics
- Max Probability: 0.9987
- Mean Probability: 0.0024
- Median Probability: 0.0004
- 99th Percentile: 0.0155
- Fraction > 0.5: 0.000930
- Fraction > 0.8: 0.000332

## 3. Connected Components
- Components > 0.5: 4190
- Total Predicted Pixels: 10717.0

## 4. Top Physical Candidates
No candidates survived morphological artifact rejection.

## 5. Decision
Model generated probabilities, but no candidate survived the physical morphology gates (speckle rejection, aspect elongation > 2.0 for slicks).

---
NO CREDIBLE SLICK CANDIDATE
