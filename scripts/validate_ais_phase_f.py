import pandas as pd
import os
import sys

# Ensure backend package can be imported
sys.path.append(os.getcwd())
from backend.app.worker.stages.attribution.ais import AISReconstructor, AISGapCalibrator
from backend.app.worker.stages.attribution.features import VesselBehaviorAnalyzer, AnomalyDetector

def main():
    print("--- PHASE F: REAL MARINE CADASTRE AIS VALIDATION ---")
    csv_path = "data/raw/marine_cadastre/AIS_2023_01_01.csv"
    
    if not os.path.exists(csv_path):
        print(f"[BLOCKED] Real dataset missing at {csv_path}")
        return
        
    print("1. Loading Real AIS Dataset...")
    df = pd.read_csv(csv_path)
    df['BaseDateTime'] = pd.to_datetime(df['BaseDateTime'])
    
    # Gulf of Mexico filter
    df = df[(df['LAT'] >= 24) & (df['LAT'] <= 30) & (df['LON'] >= -98) & (df['LON'] <= -80)]
    print(f"   Regional subset size: {len(df)} records")
    
    print("2. Gap Distribution Calibration...")
    calibrator = AISGapCalibrator()
    calibrator.fit(df)
    print(f"   Calibrated Gap > 3 min -> Mean: {calibrator.mean_gap:.1f}s, Std: {calibrator.std_gap:.1f}s")
    
    print("3. Executing Trajectory Reconstruction (500-vessel real-data validation subset)...")
    unique_mmsis = df['MMSI'].unique()[:500]
    subset_df = df[df['MMSI'].isin(unique_mmsis)].copy()
    
    reconstructor = AISReconstructor(subset_df)
    target_time = subset_df['BaseDateTime'].median()
    
    reconstructed_count = 0
    interp_success = 0
    interp_failure = 0
    features_list = []
    
    for mmsi in unique_mmsis:
        traj = reconstructor.get_trajectory(mmsi)
        if not traj.empty:
            reconstructed_count += 1
            
        # Test Interpolation functionality
        pt = reconstructor.interpolate_position(mmsi, target_time)
        if pt is not None:
            interp_success += 1
        else:
            interp_failure += 1
            
        # Extract Behaviors
        feat = VesselBehaviorAnalyzer.extract_features(traj)
        if feat is not None:
            feat['mmsi'] = mmsi
            features_list.append(feat)
            
    print(f"   Number of reconstructed vessel trajectories: {reconstructed_count}")
    print(f"   Interpolation at {target_time} -> Success: {interp_success}, Failure: {interp_failure}")
    
    features_df = pd.DataFrame(features_list)
    print(f"   Number of usable behavioral vectors: {len(features_df)}")
    
    print("4. Fitting Isolation Forest on 500-vessel real-data validation subset...")
    detector = AnomalyDetector()
    detector.fit(features_df)
    print(f"   Isolation Forest training sample count: {len(features_df)}")
    
    scores = []
    for _, row in features_df.iterrows():
        feat_dict = row.to_dict()
        del feat_dict['mmsi']
        scores.append(detector.score_anomaly(feat_dict))
        
    print(f"   Anomaly score range: min {min(scores):.4f}, max {max(scores):.4f}")
    print("   Model successfully saved to models/ais_anomaly.pkl")
    print("--- REAL VALIDATION COMPLETE ---")

if __name__ == "__main__":
    main()
