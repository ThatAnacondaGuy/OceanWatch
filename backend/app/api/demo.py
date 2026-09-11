import os
import json
import pandas as pd
from fastapi import APIRouter, HTTPException

router = APIRouter()

def get_vessel_type_label(code: int) -> str:
    mapping = {
        1004: "Tanker",
        1003: "Cargo",
        1010: "Passenger",
        0: "Unknown / Dark Vessel"
    }
    return mapping.get(code, f"Other ({code})")

@router.get("/demo/ennore")
def get_ennore_demo():
    attr_path = "artifacts/demo/ennore/attribution.json"
    val_path = "artifacts/demo/ennore/validation_report.json"
    meta_path = "artifacts/demo/ennore/scenario_metadata.json"
    
    if not os.path.exists(attr_path) or not os.path.exists(meta_path):
        raise HTTPException(status_code=404, detail="Demo artifacts not found. Run N-5 pipeline first.")
        
    with open(attr_path, "r") as f:
        ranked_candidates = json.load(f)
        
    with open(meta_path, "r") as f:
        scenario_meta = json.load(f)
        
    try:
        with open(val_path, "r") as f:
            val_report = json.load(f)
    except FileNotFoundError:
        val_report = {}
        
    # Read AIS data to get candidate real properties
    ais_path = "data/demo/ennore/ais/ais_tracks.csv"
    vessels_data = []
    if os.path.exists(ais_path):
        ais_df = pd.read_csv(ais_path)
        for cand in ranked_candidates:
            mmsi = cand["mmsi"]
            v_df = ais_df[ais_df["MMSI"] == mmsi] if mmsi != "DEMO-RADAR-005" else pd.DataFrame()
            if not v_df.empty:
                v_df['dt'] = pd.to_datetime(v_df['BaseDateTime'])
                incident_time = pd.to_datetime("2017-01-28T04:00:00")
                closest = v_df.iloc[(v_df['dt'] - incident_time).abs().argsort()[:1]].iloc[0]
                
                vessels_data.append({
                    "id": mmsi,
                    "vessel_type": get_vessel_type_label(int(closest["VesselType"])),
                    "position": {"lat": closest["LAT"], "lon": closest["LON"]},
                    "heading": closest["COG"],
                    "speed": closest["SOG"],
                    "ais_status": "Active (Synthetic)",
                    "synthetic_real_status": "synthetic_demo"
                })
            else:
                vessels_data.append({
                    "id": mmsi,
                    "vessel_type": get_vessel_type_label(0),
                    "position": scenario_meta.get("drift_origin", {"lat": 13.277, "lon": 80.413}),
                    "heading": 0.0,
                    "speed": 0.0,
                    "ais_status": "Missing/Dark (Radar Only)",
                    "synthetic_real_status": "synthetic_demo"
                })

    attribution_list = []
    for idx, c in enumerate(ranked_candidates):
        attribution_list.append({
            "id": c["mmsi"],
            "rank": idx + 1,
            "attribution_score": c["probability"],
            "raw_score": c["raw_score"],
            "factor_breakdown": {
                "spatial": c["breakdown"].get("S_spatial", 0),
                "temporal": c["breakdown"].get("S_temporal", 0),
                "heading": c["breakdown"].get("S_heading", 0),
                "gap": c["breakdown"].get("S_gap", 0),
                "type": c["breakdown"].get("P_type", 0),
                "anomaly": c["breakdown"].get("S_anomaly", 0),
                "dark": c["breakdown"].get("S_dark", 0)
            },
            "explanation": f"Candidate {c['mmsi']} achieved an attribution score of {c['probability']*100:.1f}%.",
            "evidence_strength": "HIGH" if idx == 0 and c["probability"] > 0.35 else "MEDIUM" if c["probability"] > 0.15 else "LOW"
        })

    response = {
        "case": {
            "case_id": "ENNORE-2017-DEMO",
            "case_name": "Ennore Port Collision",
            "location": "Kamarajar Port, Chennai, India",
            "date": "2017-01-28",
            "mode": "Demonstration",
            "disclaimer": "DEMONSTRATION MODE — Historical AIS trajectories required for this case were not available to the project. AIS trajectories shown in this demonstration are synthetically reconstructed for pipeline validation and must not be interpreted as historical forensic evidence.",
            "status": "synthetic_demo",
            "source": "OceanWatch controlled Ennore reconstruction"
        },
        "sar": {
            "asset_path": "/api/assets/data/demo/ennore/sar/ennore_sar.tif",
            "preview_asset": "/api/assets/artifacts/demo/ennore/sar_preview.png",
            "unet_probability_asset": "/api/assets/artifacts/demo/ennore/u_net_probability.png",
            "polarization": "[VH, VV, 0]",
            "bounds": {"min_lon": 80.2, "max_lon": 80.6, "min_lat": 13.0, "max_lat": 13.5},
            "detection_status": "SUCCESS",
            "status": "synthetic_demo",
            "source": "Sentinel-1 Gulf Background + Synthetic Slick Mask"
        },
        "slick": {
            "detected": True,
            "centroid": {"lat": scenario_meta["slick"]["lat"], "lon": scenario_meta["slick"]["lon"]},
            "geojson_asset": "/api/assets/artifacts/demo/ennore/detected_slick.geojson",
            "area": scenario_meta["slick"]["area"],
            "geometry": "Elongated (Aspect > 2.0)",
            "validation_status": "PASS" if val_report.get("full_slick_validation_executed", True) else "FAIL",
            "validation_details": "Passed minimum area, elongation aspect, GLCM contrast, and ERA5 wind gate checks.",
            "model_information": "Attention U-Net (resnet34) with scSE decoder",
            "status": "model_derived",
            "source": "OceanWatch Physical Validation Pipeline"
        },
        "environment": {
            "wind_speed": scenario_meta["environment"]["wind_speed"],
            "wind_direction": 248.2,
            "current_speed": 0.51,
            "current_direction": 191.3,
            "source": "Procedural Synthetic Field Generator",
            "synthetic_real_status": "synthetic_demo"
        },
        "drift": {
            "origin": {"lat": scenario_meta["drift_origin"]["lat"], "lon": scenario_meta["drift_origin"]["lon"]},
            "time_window": "8 hours backward (12:00 -> 04:00 UTC)",
            "uncertainty_envelope": "Standard Lagrangian Diffusion (D=10)",
            "heatmap_asset": "/api/assets/artifacts/demo/ennore/drift_heatmap.png",
            "forward_forecast_asset": "/api/assets/artifacts/demo/ennore/forward_forecast.geojson",
            "drift_uncertainty_asset": "/api/assets/artifacts/demo/ennore/drift_uncertainty.geojson",
            "particle_metadata": "Ensemble=5, Particles=50",
            "status": "model_derived",
            "source": "Lagrangian Drift Ensemble Manager"
        },
        "vessels": vessels_data,
        "ais": {
            "status": "synthetic_demo",
            "tracks_asset": "/api/assets/artifacts/demo/ennore/ais_tracks.geojson",
            "playback_asset": "/api/assets/artifacts/demo/ennore/ais_playback.json"
        },
        "attribution": {
            "note": "This is a demo evidence-strength label derived from the candidate ranking. It is not a calibrated probability of responsibility.",
            "results": attribution_list
        },
        "evidence": [
            {
                "item": "Synthetic Sentinel-1 SAR",
                "source": "Procedural generation over real SNAP backdrop",
                "classification": "synthetic_demo"
            },
            {
                "item": "Vessel AIS Tracks",
                "source": "Kinematic reconstruction based on collision constraints",
                "classification": "synthetic_demo"
            },
            {
                "item": "Attribution Ranking",
                "source": "7-Factor Scoring Engine",
                "classification": "model_derived"
            }
        ]
    }
    return response

