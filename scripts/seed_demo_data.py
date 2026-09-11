import os
import pandas as pd
from datetime import datetime, timezone
import rasterio
from sqlalchemy import create_engine, text

DB_URL = "postgresql://oceanwatch:oceanwatch@localhost:5432/oceanwatch"

def seed_database():
    print("Connecting to database...")
    engine = create_engine(DB_URL)
    
    with engine.connect() as conn:
        print("Clearing existing demo data...")
        conn.execute(text("DELETE FROM vessel_positions WHERE source='demo'"))
        conn.execute(text("DELETE FROM vessels WHERE source='demo'"))
        conn.execute(text("DELETE FROM scenes WHERE source='demo'"))
        conn.execute(text("DELETE FROM datasets"))
        conn.commit()

        # Seed Scenes
        print("Seeding SAR scenes...")
        scene_path = "data/raw/xview3/scene_1.tif"
        if os.path.exists(scene_path):
            with rasterio.open(scene_path) as src:
                bounds = src.bounds
                # Simple bbox polygon for PostGIS
                polygon = f"POLYGON(({bounds.left} {bounds.bottom}, {bounds.left} {bounds.top}, {bounds.right} {bounds.top}, {bounds.right} {bounds.bottom}, {bounds.left} {bounds.bottom}))"
                
                conn.execute(text("""
                    INSERT INTO scenes (scene_id_external, satellite, product_type, acquisition_time, polarization, footprint, file_path, file_size_bytes, source)
                    VALUES (:id, 'S1A', 'IW_GRDH', :time, 'VV+VH', ST_GeomFromText(:poly, 4326), :path, :size, 'demo')
                """), {
                    "id": "DEMO_S1A_001",
                    "time": datetime(2025, 9, 9, 11, 24, tzinfo=timezone.utc),
                    "poly": polygon,
                    "path": scene_path,
                    "size": os.path.getsize(scene_path)
                })
        
        # Seed Vessels & Positions
        print("Seeding AIS vessels and positions...")
        ais_path = "data/demo/ais/AIS_2025_09_09.csv"
        if os.path.exists(ais_path):
            df = pd.read_csv(ais_path)
            # Insert vessels
            unique_vessels = df.drop_duplicates(subset=['MMSI'])
            for _, row in unique_vessels.iterrows():
                conn.execute(text("""
                    INSERT INTO vessels (mmsi, imo, name, call_sign, vessel_type, vessel_type_prior, source)
                    VALUES (:mmsi, :imo, :name, :call, 'crude_tanker', 1.0, 'demo')
                    ON CONFLICT DO NOTHING
                """), {
                    "mmsi": str(row['MMSI']),
                    "imo": str(row['IMO']),
                    "name": row['VesselName'],
                    "call": row['CallSign']
                })
            
            # Fetch vessel IDs
            res = conn.execute(text("SELECT id, mmsi FROM vessels WHERE source='demo'")).fetchall()
            vessel_map = {str(r[1]): r[0] for r in res}
            
            # Insert positions
            for _, row in df.iterrows():
                v_id = vessel_map.get(str(row['MMSI']))
                if v_id:
                    dt = datetime.fromisoformat(row['BaseDateTime']).replace(tzinfo=timezone.utc)
                    point = f"POINT({row['LON']} {row['LAT']})"
                    conn.execute(text("""
                        INSERT INTO vessel_positions (vessel_id, timestamp, position, sog_knots, cog_degrees, heading_degrees, source)
                        VALUES (:vid, :ts, ST_GeomFromText(:pt, 4326), :sog, :cog, :hdg, 'demo')
                    """), {
                        "vid": v_id, "ts": dt, "pt": point, "sog": row['SOG'], "cog": row['COG'], "hdg": row['Heading']
                    })
        
        conn.commit()
    print("Database seeding completed.")

if __name__ == "__main__":
    seed_database()
