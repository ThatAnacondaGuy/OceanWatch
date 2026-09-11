import pandas as pd
import os

ais_file = "data/raw/marine_cadastre/AIS_2023_01_01.csv"
print(f"Validating {ais_file}...")
if not os.path.exists(ais_file):
    print("AIS file not found.")
    exit(1)

# Read just the first 100,000 rows for rapid validation
df = pd.read_csv(ais_file, nrows=100000)

expected_columns = ['MMSI', 'BaseDateTime', 'LAT', 'LON', 'SOG', 'COG', 'Heading', 'VesselName', 'IMO', 'CallSign', 'VesselType']
missing = [c for c in expected_columns if c not in df.columns]

if missing:
    print(f"Missing columns: {missing}")
else:
    print("Schema validated successfully.")

print(f"Row count (sampled): {len(df)}")
print(f"Date range in sample: {df['BaseDateTime'].min()} to {df['BaseDateTime'].max()}")
print(f"Bounding Box: LAT ({df['LAT'].min()}, {df['LAT'].max()}), LON ({df['LON'].min()}, {df['LON'].max()})")
print(f"Unique Vessels (MMSI): {df['MMSI'].nunique()}")
