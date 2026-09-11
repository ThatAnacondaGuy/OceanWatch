# Phase N: Real Sentinel-1 Oil-Slick Inference

## Inference Settings
- Model: models/best_full_oil_unet.pth
- Tiling: 512x512, Stride 512
- Normalization: VV/VH Linear -> dB -> `[0,255]` stack -> `/255.0` (matching training pipeline)
- Threshold: 0.5
- Min Area: 100 px

## Detection Results
- Valid Candidates: 48
- Top Candidate Area: 5129.0 pixels
- Top Candidate Centroid: 30.7381, -95.1353

## Independent QA
- GLCM Contrast: 59.72
- GLCM Homogeneity: 0.54

## Wind Gate (ERA5)
- Wind Speed: 2.43 m/s
- Gate Status: PASS

## Confidence
**MODEL-BASED SLICK CONFIDENCE:** 0.94

---
SLICK CANDIDATE DETECTED
