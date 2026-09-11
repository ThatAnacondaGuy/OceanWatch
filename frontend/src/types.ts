export interface CaseInfo {
  case_id: string;
  case_name: string;
  location: string;
  date: string;
  mode: string;
  disclaimer: string;
  status: string;
  source: string;
}

export interface SarInfo {
  asset_path: string;
  preview_asset?: string;
  unet_probability_asset?: string;
  polarization: string;
  bounds: { min_lon: number; max_lon: number; min_lat: number; max_lat: number };
  detection_status: string;
  status: string;
  source: string;
}

export interface SlickInfo {
  detected: boolean;
  centroid: { lat: number; lon: number };
  geojson_asset?: string;
  area: number;
  geometry: string;
  validation_status: string;
  validation_details: string;
  model_information: string;
  status: string;
  source: string;
}

export interface EnvironmentInfo {
  wind_speed: number;
  wind_direction: number;
  current_speed: number;
  current_direction: number;
  source: string;
  synthetic_real_status: string;
}

export interface DriftInfo {
  origin: { lat: number; lon: number };
  time_window: string;
  uncertainty_envelope: string;
  heatmap_asset: string | null;
  forward_forecast_asset?: string;
  drift_uncertainty_asset?: string;
  particle_metadata: string;
  status: string;
  source: string;
}

export interface Vessel {
  id: string;
  vessel_type: string;
  position: { lat: number; lon: number };
  heading: number;
  speed: number;
  ais_status: string;
  synthetic_real_status: string;
}

export interface AttributionFactor {
  spatial: number;
  temporal: number;
  heading: number;
  gap: number;
  type: number;
  anomaly: number;
  dark: number;
}

export interface AttributionResult {
  id: string;
  rank: number;
  attribution_score: number;
  raw_score: number;
  factor_breakdown: AttributionFactor;
  explanation: string;
  evidence_strength: string;
}

export interface AttributionData {
  note: string;
  results: AttributionResult[];
}

export interface EvidenceItem {
  item: string;
  source: string;
  classification: string;
}

export interface EnnoreDemoData {
  case: CaseInfo;
  sar: SarInfo;
  slick: SlickInfo;
  environment: EnvironmentInfo;
  drift: DriftInfo;
  vessels: Vessel[];
  ais?: { tracks_asset: string; playback_asset?: string };
  attribution: AttributionData;
  evidence: EvidenceItem[];
}
