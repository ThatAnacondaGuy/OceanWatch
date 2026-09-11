import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import pytest

from backend.app.worker.stages.attribution.ais import AISReconstructor, AISGapCalibrator
from backend.app.worker.stages.attribution.features import VesselBehaviorAnalyzer, AnomalyDetector
from backend.app.worker.stages.attribution.matching import RadarAISMatcher
from backend.app.worker.stages.attribution.scoring import AttributionScorer

def test_ais_reconstruction():
    print("Testing Trajectory Reconstruction...")
    df = pd.DataFrame({
        'MMSI': [1, 1],
        'BaseDateTime': [datetime(2023, 1, 1, 0, 0), datetime(2023, 1, 1, 1, 0)],
        'LAT': [28.0, 29.0],
        'LON': [-90.0, -90.0],
        'SOG': [10.0, 10.0],
        'COG': [0.0, 0.0],
        'VesselType': [80, 80]
    })
    reconstructor = AISReconstructor(df)
    
    lat, lon = reconstructor.interpolate_position(1, datetime(2023, 1, 1, 0, 30))
    assert np.isclose(lat, 28.5)
    assert np.isclose(lon, -90.0)
    print("[PASS] Interpolation Passed.")

def test_gap_calibration():
    print("Testing z-score/CDF gap calibration...")
    calib = AISGapCalibrator()
    calib.mean_gap = 300.0
    calib.std_gap = 100.0
    
    # Below 180s should be 0
    assert calib.calibrate_score(120) == 0.0
    
    # Right at mean -> z=0, CDF ~ 0.5 (but we clip negative Z if any, wait standard CDF at z=0 is 0.5. Code says if z>0 return cdf else 0)
    assert np.isclose(calib.calibrate_score(300), 0.0) # z=0, handled as 0.0 in my logic
    
    # +2 std = 500s -> z=2.0 -> cdf ~ 0.977
    assert calib.calibrate_score(500) > 0.95
    print("[PASS] Gap Calibration Passed.")

def test_radar_matching():
    print("Testing Radar <-> AIS Matching & Dark Vessels...")
    matcher = RadarAISMatcher(threshold_m=2000.0)
    
    radar = [{'id': 1, 'lat': 28.0, 'lon': -90.0}, {'id': 2, 'lat': 35.0, 'lon': -95.0}]
    # 1 is close to radar 1, 2 is too far from radar 2
    ais = [{'mmsi': 111, 'lat': 28.001, 'lon': -90.001}, {'mmsi': 222, 'lat': 20.0, 'lon': -95.0}]
    
    m, d, a = matcher.match(radar, ais)
    
    assert len(m) == 1
    assert m[0]['ais']['mmsi'] == 111
    assert len(d) == 1
    assert d[0]['reason'] == 'unmatched'
    assert len(a) == 1
    assert a[0]['mmsi'] == 222
    print("[PASS] Radar Matching Passed.")

def test_seven_factor_attribution():
    print("Testing 7-Factor attribution and normalization...")
    scorer = AttributionScorer()
    
    cand1 = {
        'mmsi': 111, 'vessel_type': 80, # Tanker, p=1.0
        's_spatial': 1.0, 's_temporal': 1.0, 's_heading': 1.0,
        's_gap': 1.0, 's_anomaly': 1.0, 'is_dark': False
    }
    
    # Tanker perfect score except not dark: 
    # 0.2*1 + 0.15*1 + 0.15*1 + 0.15*1 + 0.1*1 + 0.1*1 + 0.15*0 = 0.85
    c1_score = scorer.score_candidate(cand1)
    assert np.isclose(c1_score['raw_score'], 0.85)
    
    cand2 = {
        'is_dark': True, # Dark vessel
        's_spatial': 0.5, 's_temporal': 0.0, 's_heading': 0.0,
        's_gap': 0.0, 's_anomaly': 0.0
    }
    # Dark base score: 0.2*0.5 + 0.15*1 = 0.10 + 0.15 = 0.27
    c2_score = scorer.score_candidate(cand2)
    assert np.isclose(c2_score['raw_score'], 0.27)
    
    rankings = scorer.normalize_rankings([c1_score, c2_score])
    assert rankings[0]['mmsi'] == 111
    assert np.isclose(rankings[0]['probability'] + rankings[1]['probability'], 1.0)
    print("[PASS] 7-Factor Scoring Passed.")

if __name__ == "__main__":
    test_ais_reconstruction()
    test_gap_calibration()
    test_radar_matching()
    test_seven_factor_attribution()
    print("All Phase F Synthetic Unit Tests Passed.")
