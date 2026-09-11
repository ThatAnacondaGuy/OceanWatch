const fs = require('fs');

const files = [
  'frontend/src/screens/LiveMonitoringScreen.tsx',
  'frontend/src/screens/VesselTrackingScreen.tsx',
  'frontend/src/components/map/MapLibreMap.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  if (!content.includes("import { normalizeAISTime")) {
    content = content.replace("import { useApp } from '../context/AppContext';", "import { useApp } from '../context/AppContext';\nimport { normalizeAISTime } from '../utils/ais';");
  }

  // timeRange logic in Screens
  content = content.replace(/arr\[0\]\.time < min/g, "normalizeAISTime(arr[0].time) < min");
  content = content.replace(/min = arr\[0\]\.time/g, "min = normalizeAISTime(arr[0].time)");
  content = content.replace(/arr\[arr\.length - 1\]\.time > max/g, "normalizeAISTime(arr[arr.length - 1].time) > max");
  content = content.replace(/max = arr\[arr\.length - 1\]\.time/g, "max = normalizeAISTime(arr[arr.length - 1].time)");
  
  // playbackTime mapping in VesselTrackingScreen/LiveMonitoringScreen
  // already correct: new Date(playbackTime * 1000) because playbackTime is in SECONDS.
  
  // MapLibreMap logic
  content = content.replace(/pt\.time <= timeLimit/g, "normalizeAISTime(pt.time) <= timeLimit");

  fs.writeFileSync(file, content);
}
console.log("Patched timestamps in UI files.");
