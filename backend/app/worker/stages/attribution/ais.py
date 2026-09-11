import pandas as pd
import numpy as np
from datetime import datetime
from scipy.stats import norm

class AISReconstructor:
    def __init__(self, df):
        """
        Expects a pandas DataFrame of MarineCadastre AIS.
        Must contain: MMSI, BaseDateTime, LAT, LON, SOG, COG, VesselType
        """
        self.df = df
        if 'BaseDateTime' in self.df.columns and not pd.api.types.is_datetime64_any_dtype(self.df['BaseDateTime']):
            self.df['BaseDateTime'] = pd.to_datetime(self.df['BaseDateTime'])
        self.df = self.df.sort_values(by=['MMSI', 'BaseDateTime'])

    def filter_vessel_types(self, allowed_types):
        self.df = self.df[self.df['VesselType'].isin(allowed_types)].copy()

    def get_trajectory(self, mmsi):
        return self.df[self.df['MMSI'] == mmsi]

    def interpolate_position(self, mmsi, target_time):
        """Linearly interpolate position at target_time."""
        traj = self.get_trajectory(mmsi)
        if traj.empty:
            return None
        
        target_time = pd.to_datetime(target_time)
        before = traj[traj['BaseDateTime'] <= target_time]
        after = traj[traj['BaseDateTime'] >= target_time]
        
        if before.empty or after.empty:
            return None # Out of temporal bounds
            
        b = before.iloc[-1]
        a = after.iloc[0]
        
        if b['BaseDateTime'] == a['BaseDateTime']:
            return b['LAT'], b['LON']
            
        # Linear interp
        dt_total = (a['BaseDateTime'] - b['BaseDateTime']).total_seconds()
        dt_target = (target_time - b['BaseDateTime']).total_seconds()
        frac = dt_target / dt_total
        
        lat = b['LAT'] + frac * (a['LAT'] - b['LAT'])
        lon = b['LON'] + frac * (a['LON'] - b['LON'])
        return lat, lon

class AISGapCalibrator:
    def __init__(self):
        self.mean_gap = 0.0
        self.std_gap = 1.0

    def fit(self, df):
        """Compute background distribution of AIS gaps > 3 minutes"""
        df = df.sort_values(['MMSI', 'BaseDateTime'])
        if not pd.api.types.is_datetime64_any_dtype(df['BaseDateTime']): df['BaseDateTime'] = pd.to_datetime(df['BaseDateTime'])
        df['time_diff'] = df.groupby('MMSI')['BaseDateTime'].diff().dt.total_seconds()
        # Filter typical broadcast rates (e.g., < 3 mins is normal underway)
        gaps = df['time_diff'][df['time_diff'] > 180].dropna()
        if len(gaps) > 0:
            self.mean_gap = gaps.mean()
            self.std_gap = gaps.std() if gaps.std() > 0 else 1.0

    def calibrate_score(self, gap_seconds):
        """CDF-based z-score for gap duration"""
        if gap_seconds <= 180:
            return 0.0
        z = (gap_seconds - self.mean_gap) / self.std_gap
        # We only care about statistically *long* gaps
        return float(norm.cdf(z)) if z > 0 else 0.0
