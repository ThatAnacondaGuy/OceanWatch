import numpy as np

class AttributionScorer:
    def __init__(self):
        self.W_SPATIAL = 0.20
        self.W_TEMPORAL = 0.15
        self.W_HEADING = 0.15
        self.W_GAP = 0.15
        self.W_TYPE = 0.10
        self.W_ANOMALY = 0.10
        self.W_DARK = 0.15

    def get_vessel_type_prior(self, vessel_type):
        if vessel_type in [80, 81, 82, 83, 84, 89, 1004]:
            return 1.0
        elif vessel_type in [70, 71, 72, 73, 74, 79, 1003]:
            return 0.6
        else:
            return 0.2

    def score_candidate(self, candidate_info):
        s_spatial = candidate_info.get('s_spatial', 0.0)
        s_temporal = candidate_info.get('s_temporal', 0.0)
        s_heading = candidate_info.get('s_heading', 0.0)
        p_type = self.get_vessel_type_prior(candidate_info.get('vessel_type', 0))
        s_anomaly = candidate_info.get('s_anomaly', 0.0)
        is_dark = candidate_info.get('is_dark', False)
        
        # CORRECTION 1: If Dark Vessel, S_gap is neutral (0.0), NOT 1.0. 
        # S_dark alone represents the radar-only condition.
        if is_dark:
            s_gap = 0.0
            s_dark = 1.0
        else:
            s_gap = candidate_info.get('s_gap', 0.0)
            s_dark = 0.0
            
        score = (self.W_SPATIAL * s_spatial +
                 self.W_TEMPORAL * s_temporal +
                 self.W_HEADING * s_heading +
                 self.W_GAP * s_gap +
                 self.W_TYPE * p_type +
                 self.W_ANOMALY * s_anomaly +
                 self.W_DARK * s_dark)
                 
        return {
            'mmsi': candidate_info.get('mmsi', 'DARK_VESSEL_CANDIDATE'),
            'raw_score': score,
            'breakdown': {
                'S_spatial': s_spatial,
                'S_temporal': s_temporal,
                'S_heading': s_heading,
                'S_gap': s_gap,
                'P_type': p_type,
                'S_anomaly': s_anomaly,
                'S_dark': s_dark
            }
        }

    def normalize_rankings(self, scores_list):
        total_score = sum(s['raw_score'] for s in scores_list)
        for s in scores_list:
            if total_score > 0:
                s['probability'] = s['raw_score'] / total_score
            else:
                s['probability'] = 0.0
        scores_list.sort(key=lambda x: x['probability'], reverse=True)
        return scores_list
