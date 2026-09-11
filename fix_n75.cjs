const fs = require('fs');

// 1. Fix AnalyticsScreen.tsx Crash
let analytics = fs.readFileSync('frontend/src/screens/AnalyticsScreen.tsx', 'utf8');
analytics = analytics.replace(/wind_dir/g, 'wind_direction');
analytics = analytics.replace(/current_dir/g, 'current_direction');
analytics = analytics.replace(/time_window_hours/g, 'time_window');
fs.writeFileSync('frontend/src/screens/AnalyticsScreen.tsx', analytics);

// 2. Fix AppShell.tsx branding and disclaimer
let appShell = fs.readFileSync('frontend/src/components/layout/AppShell.tsx', 'utf8');
appShell = appShell.replace(
  /<footer.*?<\/footer>/s,
  `<footer className="h-8 bg-slate-100 border-t border-slate-200 px-6 flex items-center justify-between text-[10px] text-slate-500 shrink-0">
     <span>OceanWatch AI: Forensic Oil Spill Detection & Vessel Attribution | Demonstration Release</span>
     <span className="font-bold text-navy-800">Government-style demonstration interface</span>
  </footer>`
);
appShell = appShell.replace(
  /<div className="bg-amber-50[^>]*>.*?<\/div>/s,
  `<div className="bg-amber-50 border-b border-amber-200 px-6 py-1.5 flex items-center gap-2 text-[10px] text-amber-800 font-bold uppercase tracking-wider shrink-0">
     <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
     <span className="truncate"><span className="font-black">DEMONSTRATION MODE:</span> Ennore historical context. AIS trajectories synthetically reconstructed for pipeline validation. Do not treat as historical forensic evidence.</span>
  </div>`
);
fs.writeFileSync('frontend/src/components/layout/AppShell.tsx', appShell);

// 3. Fix SpillIncidentsScreen.tsx 99.9% confidence and Likely Source
let spillScreen = fs.readFileSync('frontend/src/screens/SpillIncidentsScreen.tsx', 'utf8');
spillScreen = spillScreen.replace(
  /<span className="text-slate-500 mt-2">Confidence<\/span><span className="font-bold text-emerald-600 mt-2">99.9% \(U-Net\)<\/span>/g,
  `<span className="text-slate-500 mt-2">Detection Status</span><span className="font-bold text-emerald-600 mt-2">VALIDATED</span>`
);
// Fix Likely Source display
spillScreen = spillScreen.replace(
  /<span className="text-slate-500">Likely Source<\/span><span className="font-bold text-navy-900">Vessel \({data.attribution.results\[0\].evidence_strength}\)<\/span>/g,
  `<span className="text-slate-500">Likely Source</span>
   <div className="flex flex-col text-right">
      <span className="font-black text-navy-900">{data.attribution.results[0].id}</span>
      <span className="font-bold text-blue-700 text-[10px]">SCORE: {(data.attribution.results[0].attribution_score * 100).toFixed(1)}%</span>
      <span className="font-bold text-emerald-700 text-[10px]">EVIDENCE: {data.attribution.results[0].evidence_strength}</span>
   </div>`
);
// Fix 100% Data Availability fake metric in Satellite
let satScreen = fs.readFileSync('frontend/src/screens/SatelliteDataScreen.tsx', 'utf8');
satScreen = satScreen.replace(
  /<p className="text-lg font-black text-navy-900 leading-none mt-1">100%<\/p><\/div><p className="text-\[9px\] text-slate-400 mt-1">Local Processing<\/p>/g,
  `<p className="text-lg font-black text-navy-900 leading-none mt-1">N/A</p></div><p className="text-[9px] text-slate-400 mt-1">Demo Context</p>`
);
fs.writeFileSync('frontend/src/screens/SatelliteDataScreen.tsx', satScreen);
fs.writeFileSync('frontend/src/screens/SpillIncidentsScreen.tsx', spillScreen);

// 4. Fix MapLibreMap.tsx to remove CARTO watermark and use pure OSM with dark CSS styling
let map = fs.readFileSync('frontend/src/components/map/MapLibreMap.tsx', 'utf8');
map = map.replace(
  /const FALLBACK_STYLE = \{[\s\S]*?\};/,
  `const FALLBACK_STYLE = {
  version: 8 as const,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors'
    }
  },
  layers: [
    {
      id: 'osm-layer',
      type: 'raster',
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 19,
      paint: {
        'raster-saturation': -1,
        'raster-brightness-max': 0.25,
        'raster-opacity': 0.8
      }
    }
  ]
};`
);
fs.writeFileSync('frontend/src/components/map/MapLibreMap.tsx', map);

// 5. Replace "Not Available" with "N/A" cleanly where appropriate in Dashboard
let dashboard = fs.readFileSync('frontend/src/screens/DashboardScreen.tsx', 'utf8');
dashboard = dashboard.replace(/Not Available/g, 'N/A');
fs.writeFileSync('frontend/src/screens/DashboardScreen.tsx', dashboard);

console.log("N-7.5 UI updates applied.");
