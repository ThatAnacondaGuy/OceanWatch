import numpy as np

class RadarAISMatcher:
    def __init__(self, threshold_m=2000.0):
        self.threshold_m = threshold_m

    def match(self, radar_detections, ais_positions):
        """
        radar_detections: list of dicts [{'id': 1, 'lat': 28.5, 'lon': -90.0}, ...]
        ais_positions: list of dicts [{'mmsi': 123456789, 'lat': 28.5, 'lon': -90.0}, ...]
        Returns: matched_pairs, dark_vessels, ais_only
        """
        matched = []
        dark_vessels = []
        ais_only = list(ais_positions)
        
        for radar in radar_detections:
            r_lat, r_lon = radar['lat'], radar['lon']
            best_match = None
            min_dist = float('inf')
            
            for ais in ais_only:
                a_lat, a_lon = ais['lat'], ais['lon']
                # Approx distance in meters
                dy = (r_lat - a_lat) * 111320.0
                dx = (r_lon - a_lon) * 111320.0 * np.cos(np.radians((r_lat + a_lat) / 2))
                dist = np.sqrt(dx**2 + dy**2)
                
                if dist < min_dist and dist <= self.threshold_m:
                    min_dist = dist
                    best_match = ais
                    
            if best_match:
                matched.append({'radar': radar, 'ais': best_match, 'dist_m': min_dist})
                ais_only.remove(best_match)
            else:
                dark_vessels.append({'radar': radar, 'reason': 'unmatched'})
                
        return matched, dark_vessels, ais_only
