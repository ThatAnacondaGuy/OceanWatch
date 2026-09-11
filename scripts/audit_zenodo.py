import rasterio
import pandas as pd
import numpy as np

TEST_CSV = "data/raw/zenodo/test_split.csv"
SNAP_TIFF = "data/processed/sentinel1/gulf_20230101/s1_gulf_20230101_tc.tif"

print("=== ZENODO TEST SPLIT SAMPLE ===")
df = pd.read_csv(TEST_CSV)
for idx, row in df.head(5).iterrows():
    with rasterio.open(row['image_path']) as src:
        arr = src.read()
        print(f"File: {row['image_path']}")
        print(f" - Dtype: {arr.dtype}, Band Count: {src.count}")
        print(f" - CRS: {src.crs}, Transform: {src.transform}")
        if src.count >= 2:
            print(f" - Band 1 (Mean/Std): {arr[0].mean():.2f} / {arr[0].std():.2f}")
            print(f" - Band 2 (Mean/Std): {arr[1].mean():.2f} / {arr[1].std():.2f}")
            print(f" - Band 1 Min/Max: {arr[0].min():.2f} / {arr[0].max():.2f}")
            print(f" - Band 2 Min/Max: {arr[1].min():.2f} / {arr[1].max():.2f}")

print("\n=== SNAP GULF ROI (Full) ===")
with rasterio.open(SNAP_TIFF) as src:
    print(f"Dtype: {src.dtypes}, CRS: {src.crs}")
    print(f"Band Descriptions: {src.descriptions}")
