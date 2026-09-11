import sys
import re

with open("scripts/run_ennore_demo.py", "r") as f:
    content = f.read()

# Add saving heatmap
heatmap_save = """
        origin_lon_c = np.mean(xe)
        
        plt.figure(figsize=(8, 6))
        plt.pcolormesh(xe, ye, heatmap.T, cmap='hot', shading='auto')
        plt.colorbar(label='Origin Probability')
        plt.title('Backward Advection Origin Envelope (8h)')
        plt.xlabel('Longitude')
        plt.ylabel('Latitude')
        plt.tight_layout()
        plt.savefig(f"{ART_DIR}/drift_heatmap.png")
        plt.close()
"""
content = content.replace("origin_lon_c = np.mean(xe)", heatmap_save)

# Add saving scenario metadata
metadata_save = """
    with open(f"{ART_DIR}/validation_report.json", 'w') as f:
        json.dump(validations, f, indent=2)
        
    scenario_metadata = {
        "slick": {
            "lat": float(slick_lat),
            "lon": float(slick_lon),
            "area": float(best_cand.area)
        },
        "drift_origin": {
            "lat": float(origin_lat_c),
            "lon": float(origin_lon_c)
        },
        "environment": {
            "wind_speed": float(wind_spd)
        }
    }
    with open(f"{ART_DIR}/scenario_metadata.json", "w") as f:
        json.dump(scenario_metadata, f, indent=2)
"""
content = content.replace("with open(f\"{ART_DIR}/validation_report.json\", 'w') as f:\n        json.dump(validations, f, indent=2)", metadata_save)

with open("scripts/run_ennore_demo.py", "w") as f:
    f.write(content)
