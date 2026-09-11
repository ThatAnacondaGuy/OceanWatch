export function normalizeAISTime(rawTime: number): number {
  return rawTime * 1000;
}

export type VesselStateResult = {
  vesselId: string;
  hasValidTelemetry: boolean;
  reason?: string;
  timestampSec: number;
  lat: number;
  lon: number;
  speed: number;
  heading: number;
  vesselType: string;
  isSource: boolean;
  isDark: boolean;
  pastPts: any[];
  futurePts: any[];
  diffSec: number;
  allPts: any[];
};

export function getVesselStateAtTime(
  vesselId: string | null, 
  playbackTimeSec: number | null, 
  playbackData: Record<string, any[]> | null,
  vessels: any[],
  attribution: any
): VesselStateResult {
  const emptyState = {
    vesselId: vesselId || '',
    hasValidTelemetry: false,
    timestampSec: 0,
    lat: 0,
    lon: 0,
    speed: 0,
    heading: 0,
    vesselType: 'Unknown',
    isSource: false,
    isDark: false,
    pastPts: [],
    futurePts: [],
    diffSec: 0,
    allPts: []
  };

  if (!playbackData) {
    return { ...emptyState, reason: "AIS_DATA_LOADING" };
  }
  if (!vesselId) {
    return { ...emptyState, reason: "VESSEL_NOT_SELECTED" };
  }
  if (playbackTimeSec === null) {
    return { ...emptyState, reason: "PLAYBACK_TIME_INVALID" };
  }

  const pts = playbackData[vesselId];
  if (!pts || pts.length === 0) {
    return { ...emptyState, reason: "VESSEL_NOT_FOUND" };
  }

  const vesselMeta = vessels.find(v => v.id === vesselId);
  const isSource = attribution?.results?.[0]?.id === vesselId;
  const vesselType = vesselMeta?.vessel_type || 'Unknown';
  const isDark = vesselType === 'Unknown / Dark Vessel';

  let currentPt = pts[0];
  const pastPts = [];
  const futurePts = [];
  
  for (const pt of pts) {
    const ptSec = normalizeAISTime(pt.time);
    if (ptSec <= playbackTimeSec) {
      currentPt = pt;
      pastPts.push(pt);
    } else {
      futurePts.push(pt);
    }
  }

  const currentPtSec = normalizeAISTime(currentPt.time);
  const diffSec = Math.abs(currentPtSec - playbackTimeSec);
  const toleranceSec = 3600 * 2; // 2 hour tolerance

  let hasValidTelemetry = diffSec <= toleranceSec;
  if (playbackTimeSec < normalizeAISTime(pts[0].time)) {
    hasValidTelemetry = false;
  }

  return {
    vesselId,
    timestampSec: currentPtSec,
    lat: currentPt.lat,
    lon: currentPt.lon,
    speed: currentPt.speed || 0,
    heading: currentPt.heading || 0,
    vesselType,
    isSource,
    isDark,
    hasValidTelemetry,
    reason: hasValidTelemetry ? undefined : "NO_TELEMETRY_IN_WINDOW",
    pastPts,
    futurePts,
    diffSec,
    allPts: pts
  };
}
