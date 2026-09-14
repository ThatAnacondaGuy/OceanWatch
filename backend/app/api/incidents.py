import json
import os
from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException

router = APIRouter()

def get_project_root():
    # backend/app/api/incidents.py -> up 4 levels to root
    current_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.abspath(os.path.join(current_dir, "..", "..", ".."))

def load_registry():
    root = get_project_root()
    registry_path = os.path.join(root, "data", "reference", "india_oil_spill_registry.json")
    sources_path = os.path.join(root, "data", "reference", "india_oil_spill_sources.json")
    
    if not os.path.exists(registry_path):
        raise FileNotFoundError(f"Registry file not found at {registry_path}")
        
    with open(registry_path, "r") as f:
        data = json.load(f)
        incidents = data.get("incidents", [])
        
    source_map = {}
    if os.path.exists(sources_path):
        with open(sources_path, "r") as f:
            src_data = json.load(f)
            for src in src_data.get("sources", []):
                i_id = src.get("incident_id")
                if i_id not in source_map:
                    source_map[i_id] = []
                source_map[i_id].append(src)
                
    for inc in incidents:
        inc["documented_sources"] = source_map.get(inc["incident_id"], [])
        
    return incidents

@router.get("/incidents")
def get_incidents(
    search: Optional[str] = None,
    year: Optional[str] = None,
    state: Optional[str] = None,
    incident_type: Optional[str] = None,
    evidence: Optional[str] = None,
    status: Optional[str] = None
):
    try:
        incidents = load_registry()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading registry: {str(e)}")

    # Filtering
    if search:
        search_lower = search.lower()
        incidents = [i for i in incidents if 
                     search_lower in (i.get("incident_name") or "").lower() or 
                     search_lower in (i.get("vessel_name") or "").lower() or
                     search_lower in (i.get("location_description") or "").lower()]
                     
    if year and year != "All":
        incidents = [i for i in incidents if str(i.get("year")) == str(year)]
        
    if state and state != "All":
        incidents = [i for i in incidents if (i.get("state") or "Offshore").lower() == state.lower()]
        
    if incident_type and incident_type != "All":
        incidents = [i for i in incidents if (i.get("incident_type") or "").lower() == incident_type.lower()]
        
    if evidence and evidence != "All":
        incidents = [i for i in incidents if (i.get("historical_evidence_level") or "").lower() == evidence.lower()]
        
    if status and status != "All":
        incidents = [i for i in incidents if (i.get("status") or "").lower() == status.lower()]
        
    return {"status": "success", "data": incidents}

@router.get("/incidents/{incident_id}")
def get_incident(incident_id: str):
    incidents = load_registry()
    for inc in incidents:
        if inc["incident_id"] == incident_id:
            return {"status": "success", "data": inc}
    raise HTTPException(status_code=404, detail="Incident not found")
