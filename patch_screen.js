const fs = require('fs');
let content = fs.readFileSync('frontend/src/screens/VesselTrackingScreen.tsx', 'utf8');

// The rewrite messed up the state initialization, I will replace the block explicitly
content = content.replace(/const state = useMemo.*?;/s, "");
content = content.replace(/const selectedResult = data\.attribution\.results.*?;/s, "");
content = content.replace(/const vesselMeta = data\.vessels.*?Dark Vessel';/s, "");

const fixedBlock = `
  const selectedResult = data.attribution.results.find((r: any) => r.id === selectedVessel) || data.attribution.results[0];
  const vesselMeta = data.vessels.find((v: any) => v.id === selectedResult.id);
  const isSource = selectedResult.id === data.attribution.results[0].id;
  const isDark = vesselMeta?.vessel_type === 'Unknown / Dark Vessel';
  
  const state = getVesselStateAtTime(selectedResult.id, playbackTime ?? timeRange.min, playbackData, data.vessels, data.attribution);
  const pts = state?.allPts || [];
  const pastPts = state?.pastPts || [];
`;

content = content.replace("let hasGap = false;", fixedBlock + "\n  let hasGap = false;");

// In the UI, use `state.hasValidTelemetry` to optionally show "No telemetry"
content = content.replace(/currentPt \?/g, "state && state.hasValidTelemetry ?");
content = content.replace(/currentPt\./g, "state.");

fs.writeFileSync('frontend/src/screens/VesselTrackingScreen.tsx', content);
