import os
import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

def get_heading(lat1, lon1, lat2, lon2):
    # simple bearing calculation
    dLon = lon2 - lon1
    y = np.sin(np.radians(dLon)) * np.cos(np.radians(lat2))
    x = np.cos(np.radians(lat1)) * np.sin(np.radians(lat2)) - \
        np.sin(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.cos(np.radians(dLon))
    brng = np.degrees(np.arctan2(y, x))
    return (brng + 360) % 360

def get_speed(lat1, lon1, lat2, lon2, hours):
    if hours == 0: return 0
    # rough distance in nautical miles (1 deg lat = 60 nm, 1 deg lon = ~60*cos(lat) nm)
    d_lat = (lat2 - lat1) * 60
    d_lon = (lon2 - lon1) * 60 * np.cos(np.radians((lat1+lat2)/2))
    dist_nm = np.sqrt(d_lat**2 + d_lon**2)
    return dist_nm / hours

def is_on_land(lat, lon):
    # Ennore/Chennai coast approximation
    # At lat 13.0, coast is ~80.28
    # At lat 13.3, coast is ~80.33
    # Interpolating:
    coast_lon = 80.28 + ((lat - 13.0) / 0.3) * (80.33 - 80.28)
    return lon < coast_lon

def generate_ais():
    print("Generating Ennore Synthetic AIS Data...")
    start_time = datetime(2017, 1, 28, 0, 0, 0)
    
    # Target origin at 04:00 UTC is approx [13.265, 80.412]
    # Slick centroid is [13.132, 80.348]
    
    vessels = {
        'DEMO-MMSI-001': {'type': 'Tanker', 'vtype': 1004, 'role': 'SOURCE_CANDIDATE'},
        'DEMO-MMSI-002': {'type': 'Cargo', 'vtype': 1003, 'role': 'CANDIDATE'},
        'DEMO-MMSI-003': {'type': 'Cargo', 'vtype': 1003, 'role': 'CANDIDATE'},
        'DEMO-MMSI-004': {'type': 'Passenger', 'vtype': 1010, 'role': 'CANDIDATE'},
        'DEMO-RADAR-005': {'type': 'Unknown / Dark Vessel', 'vtype': 0, 'role': 'DARK / RADAR-ONLY CANDIDATE'}
    }
    
    # Path definitions: [(lat, lon, time_offset_hours)]
    # Interpolation will happen every 15 mins.
    
    paths = {
        # Passes right through origin (13.265, 80.412) at 04:00. Moving South-West.
        'DEMO-MMSI-001': [
            (13.310, 80.450, 0),
            (13.287, 80.431, 2),
            (13.265, 80.412, 4), # At origin
            (13.220, 80.380, 6),
            (13.180, 80.360, 8)
        ],
        # Candidate 2: Weaker spatial alignment, parallel but further East
        'DEMO-MMSI-002': [
            (13.300, 80.470, 0),
            (13.270, 80.460, 3),
            (13.240, 80.440, 5),
            (13.190, 80.420, 8)
        ],
        # Candidate 3: Weaker temporal alignment, crosses origin area but late
        'DEMO-MMSI-003': [
            (13.150, 80.380, 0),
            (13.200, 80.400, 3),
            (13.265, 80.412, 7), # At origin at 07:00 (too late)
            (13.280, 80.420, 8)
        ],
        # Candidate 4: Plausible offshore route, moving North-East
        'DEMO-MMSI-004': [
            (13.080, 80.390, 0),
            (13.150, 80.420, 2),
            (13.200, 80.450, 5),
            (13.250, 80.480, 8)
        ],
        # Dark Vessel: Disappears near origin around 03:00 - 05:00
        'DEMO-RADAR-005': [
            (13.290, 80.420, 0),
            (13.275, 80.415, 2),
            (13.250, 80.405, 5),
            (13.210, 80.390, 8)
        ]
    }
    
    # 1. Generate full interpolated tracks
    records = []
    playback_data = {vid: [] for vid in vessels}
    geojson_features = []
    
    for vid, pts in paths.items():
        # Interpolate every 15 minutes (0.25 hours)
        times_hr = np.arange(0, 8.25, 0.25)
        
        orig_hrs = [p[2] for p in pts]
        orig_lats = [p[0] for p in pts]
        orig_lons = [p[1] for p in pts]
        
        interp_lats = np.interp(times_hr, orig_hrs, orig_lats)
        interp_lons = np.interp(times_hr, orig_hrs, orig_lons)
        
        coords = []
        
        for i, hr in enumerate(times_hr):
            lat = interp_lats[i]
            lon = interp_lons[i]
            
            # Enforce Water-Only
            if is_on_land(lat, lon):
                print(f"Warning: {vid} at {hr}h ({lat}, {lon}) is on land. Nudging East.")
                lon = 80.28 + ((lat - 13.0) / 0.3) * (80.33 - 80.28) + 0.02
                interp_lons[i] = lon
                
            t = start_time + timedelta(hours=float(hr))
            
            # Compute speed and heading looking ahead (or back if last point)
            if i < len(times_hr) - 1:
                n_lat, n_lon = interp_lats[i+1], interp_lons[i+1]
                speed = get_speed(lat, lon, n_lat, n_lon, 0.25)
                heading = get_heading(lat, lon, n_lat, n_lon)
            else:
                p_lat, p_lon = interp_lats[i-1], interp_lons[i-1]
                speed = get_speed(p_lat, p_lon, lat, lon, 0.25)
                heading = get_heading(p_lat, p_lon, lat, lon)
            
            coords.append([float(lon), float(lat)])
            
            # Gap for Dark vessel
            if vid == 'DEMO-RADAR-005' and 3.0 <= hr <= 5.0:
                # Dark vessel goes missing (no AIS records in CSV, but maybe radar tracking later)
                # We'll skip CSV and Playback for this window to simulate dark status
                continue
                
            # Gap for Source vessel (simulated AIS gap)
            if vid == 'DEMO-MMSI-001' and 3.5 <= hr <= 4.5:
                continue
                
            ts_sec = int(t.timestamp())
            
            # CSV Record
            records.append({
                'MMSI': vid,
                'BaseDateTime': t.strftime('%Y-%m-%dT%H:%M:%S'),
                'LAT': lat,
                'LON': lon,
                'SOG': speed,
                'COG': heading,
                'Heading': heading,
                'VesselName': f'SYNTHETIC_{vid}',
                'IMO': f'IMO_{vid}',
                'VesselType': vessels[vid]['vtype'],
                'Length': 200,
                'Width': 30
            })
            
            # Playback JSON Record
            playback_data[vid].append({
                "time": ts_sec,
                "lat": float(lat),
                "lon": float(lon),
                "heading": float(heading),
                "speed": float(speed)
            })
            
        # GeoJSON Feature
        geojson_features.append({
            "type": "Feature",
            "properties": {
                "mmsi": vid,
                "vessel_type": vessels[vid]['vtype'],
                "role": vessels[vid]['role'],
                "source_status": "synthetic_demo"
            },
            "geometry": {
                "type": "LineString",
                "coordinates": coords
            }
        })
    
    # 2. Write CSV
    os.makedirs("data/demo/ennore/ais", exist_ok=True)
    df = pd.DataFrame(records)
    df.to_csv("data/demo/ennore/ais/ais_tracks.csv", index=False)
    
    # 3. Write GeoJSON
    os.makedirs("artifacts/demo/ennore", exist_ok=True)
    geojson_out = {
        "type": "FeatureCollection",
        "features": geojson_features
    }
    with open("artifacts/demo/ennore/ais_tracks.geojson", "w") as f:
        json.dump(geojson_out, f, indent=2)
        
    # 4. Write Playback JSON
    with open("artifacts/demo/ennore/ais_playback.json", "w") as f:
        json.dump(playback_data, f, indent=2)
        
    # 5. Write Metadata
    meta = {
      "status": "synthetic_demo",
      "case_id": "ENNORE-2017-DEMO",
      "historical_ais_available": False,
      "purpose": "pipeline_validation_and_ui_demonstration",
      "warning": "Trajectories are synthetic reconstructions and must not be interpreted as historical forensic AIS evidence."
    }
    with open("artifacts/demo/ennore/ais_metadata.json", "w") as f:
        json.dump(meta, f, indent=2)
        
    # Print Audit
    print("\n--- FINAL DATA AUDIT ---")
    print(f"{'Vessel':<16} | {'First Lat':<9} | {'First Lon':<9} | {'Last Lat':<8} | {'Last Lon':<8} | {'Pts':<3} | Water-only")
    for vid in vessels:
        pb = playback_data[vid]
        if pb:
            first = pb[0]
            last = pb[-1]
            # Verify water only
            water_only = "PASS"
            for p in pb:
                if is_on_land(p['lat'], p['lon']):
                    water_only = "FAIL"
                    break
            print(f"{vid:<16} | {first['lat']:<9.3f} | {first['lon']:<9.3f} | {last['lat']:<8.3f} | {last['lon']:<8.3f} | {len(pb):<3} | {water_only}")

if __name__ == "__main__":
    generate_ais()
