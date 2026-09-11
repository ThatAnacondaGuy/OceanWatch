import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
import joblib
import os

class VesselBehaviorAnalyzer:
    @staticmethod
    def extract_features(traj_df):
        """Extracts the specified behavioral features for a single vessel trajectory."""
        if len(traj_df) < 2:
            return None
            
        traj_df = traj_df.sort_values('BaseDateTime')
        dt = traj_df['BaseDateTime'].diff().dt.total_seconds().fillna(0)
        
        # Gap features
        max_gap = dt.max()
        gaps_gt_10m = (dt > 600).sum()
        
        # Kinematic variance
        sog_var = traj_df['SOG'].var() if len(traj_df) > 2 else 0.0
        cog_var = traj_df['COG'].var() if len(traj_df) > 2 else 0.0
        
        # Sudden speed drops (>5 knots)
        sog_diff = traj_df['SOG'].diff().fillna(0)
        drops_gt_5k = (sog_diff < -5.0).sum()
        
        # Route deviation (ratio of path length to straight line)
        if len(traj_df) > 1:
            start_pt = traj_df.iloc[0]
            end_pt = traj_df.iloc[-1]
            straight_dist = np.sqrt((end_pt['LON'] - start_pt['LON'])**2 + (end_pt['LAT'] - start_pt['LAT'])**2)
            
            d_lat = traj_df['LAT'].diff().fillna(0)
            d_lon = traj_df['LON'].diff().fillna(0)
            path_dist = np.sum(np.sqrt(d_lat**2 + d_lon**2))
            
            route_dev = path_dist / straight_dist if straight_dist > 0 else 1.0
        else:
            route_dev = 1.0
            
        # Loitering duration (SOG < 1 knot)
        loitering_time = dt[traj_df['SOG'] < 1.0].sum()
        
        return {
            'max_gap': float(max_gap),
            'gaps_gt_10m': int(gaps_gt_10m),
            'sog_var': float(sog_var),
            'cog_var': float(cog_var),
            'speed_drops': int(drops_gt_5k),
            'route_dev': float(route_dev),
            'loitering_time': float(loitering_time)
        }

class AnomalyDetector:
    def __init__(self, model_path='models/ais_anomaly.pkl'):
        self.model_path = model_path
        self.model = None
        self.feature_cols = ['max_gap', 'gaps_gt_10m', 'sog_var', 'cog_var', 'speed_drops', 'route_dev', 'loitering_time']

    def fit(self, features_df):
        """Fit the Isolation Forest on the broader regional population."""
        X = features_df[self.feature_cols].fillna(0)
        self.model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
        self.model.fit(X)
        
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        joblib.dump(self.model, self.model_path)

    def load(self):
        if os.path.exists(self.model_path):
            self.model = joblib.load(self.model_path)
            
    def score_anomaly(self, feature_dict):
        """Produce a 0-1 anomaly score based on Isolation Forest decision_function."""
        if self.model is None:
            self.load()
        if self.model is None:
            return 0.0 # Untrained fallback
            
        x = pd.DataFrame([feature_dict])[self.feature_cols].fillna(0)
        # decision_function returns negative for anomalies, positive for normal
        # We normalize it to a 0-1 probability-like anomaly score (1 = highly anomalous)
        raw_score = self.model.decision_function(x)[0]
        # Sigmoid-like scaling centered around 0
        normalized_score = 1.0 / (1.0 + np.exp(raw_score * 5.0))
        return float(normalized_score)
