import pandas as pd
import numpy as np

def main():
    df = pd.read_csv("data/raw/zenodo/dataset_index.csv")
    
    # Shuffle
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    n = len(df)
    train_end = int(0.7 * n)
    val_end = int(0.85 * n)
    
    train_df = df.iloc[:train_end]
    val_df = df.iloc[train_end:val_end]
    test_df = df.iloc[val_end:]
    
    # Verify disjointness
    train_ids = set(train_df['scene_identifier'])
    val_ids = set(val_df['scene_identifier'])
    test_ids = set(test_df['scene_identifier'])
    
    assert train_ids.isdisjoint(val_ids), "Train and Val overlap!"
    assert train_ids.isdisjoint(test_ids), "Train and Test overlap!"
    assert val_ids.isdisjoint(test_ids), "Val and Test overlap!"
    
    train_df.to_csv("data/raw/zenodo/train_split.csv", index=False)
    val_df.to_csv("data/raw/zenodo/val_split.csv", index=False)
    test_df.to_csv("data/raw/zenodo/test_split.csv", index=False)
    
    print("Splits created successfully and disjointness verified.")
    print(f"Train: {len(train_df)} | Val: {len(val_df)} | Test: {len(test_df)}")

if __name__ == "__main__":
    main()
