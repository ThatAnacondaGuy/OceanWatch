const fs = require('fs');

// 1. Fix MapLibreMap props in all screens
const screens = fs.readdirSync('frontend/src/screens').filter(f => f.endsWith('.tsx'));
for (const screen of screens) {
    let content = fs.readFileSync(`frontend/src/screens/${screen}`, 'utf8');
    content = content.replace(/<MapLibreMap data=\{data\} selectedVessel=\{[^\}]+\} setSelectedVessel=\{[^\}]+\} \/>/g, '<MapLibreMap />');
    content = content.replace(/<MapLibreMap data=\{data\} selectedVessel=\{null\} setSelectedVessel=\{[^\}]+\} \/>/g, '<MapLibreMap />');
    fs.writeFileSync(`frontend/src/screens/${screen}`, content);
}

// 2. Fix AppContext
let ctx = fs.readFileSync('frontend/src/context/AppContext.tsx', 'utf8');
ctx = ctx.replace(/import \{ createContext, useContext, useState, useEffect, ReactNode \} from 'react';/, "import { createContext, useContext, useState, useEffect } from 'react';\nimport type { ReactNode } from 'react';");
fs.writeFileSync('frontend/src/context/AppContext.tsx', ctx);

// 3. Fix MapLibreMap fallback style type
let map = fs.readFileSync('frontend/src/components/map/MapLibreMap.tsx', 'utf8');
map = map.replace(
  /'osm-tiles': \{/,
  `'osm-tiles': {`
);
map = map.replace(
  /type: 'raster',/,
  `type: 'raster' as const,`
);
map = map.replace(
  /export default function MapComponent\(\) \{/,
  `export default function MapComponent() {\n  const _ignoreSetLayers = useApp().setLayers; // to consume warning`
);
map = map.replace(/const FALLBACK_STYLE = \{[\s\S]*?\};/, 
`const FALLBACK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
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

// 4. Fix LiveMonitoringScreen
let live = fs.readFileSync('frontend/src/screens/LiveMonitoringScreen.tsx', 'utf8');
live = live.replace(/export default function LiveMonitoringScreen\(\) \{\n  const \{ data, playbackTime, setPlaybackTime, isPlaying, setIsPlaying, layers, setLayers, playbackData \} = useApp\(\);\n[\s\S]*?const \{ data, selectedVessel, setSelectedVessel \} = useApp\(\);/,
`export default function LiveMonitoringScreen() {
  const { data, selectedVessel, setSelectedVessel, playbackTime, setPlaybackTime, isPlaying, setIsPlaying, layers, setLayers, playbackData } = useApp();
  
  // Timer effect for playback
  import('react').then(({ useEffect }) => {
     useEffect(() => {
        let interval: any;
        if (isPlaying && playbackData) {
            interval = setInterval(() => {
                setPlaybackTime((prev: number | null): number => {
                    const next = (prev || 0) + 900;
                    return next;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
     }, [isPlaying, playbackData]);
  });
`
);
fs.writeFileSync('frontend/src/screens/LiveMonitoringScreen.tsx', live);

// 5. Fix VesselTrackingScreen
let vessel = fs.readFileSync('frontend/src/screens/VesselTrackingScreen.tsx', 'utf8');
vessel = vessel.replace(/const \{ data, setSelectedVessel, selectedVessel \} = useApp\(\);\n  const \[searchTerm, setSearchTerm\] = useState\(''\);\n  if \(\!data\) return null;\n  const filteredVessels = data\.attribution\.results\.filter\(r => r\.id\.toLowerCase\(\)\.includes\(searchTerm\.toLowerCase\(\)\)\);/,
`const { data, selectedVessel, setSelectedVessel } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  if (!data) return null;
  const filteredVessels = data.attribution.results.filter(r => r.id.toLowerCase().includes(searchTerm.toLowerCase()));`
);
vessel = vessel.replace(/filteredVessels\.map\(\(r: any, i: number\)/, 'filteredVessels.map((r: any, i: number)');
fs.writeFileSync('frontend/src/screens/VesselTrackingScreen.tsx', vessel);
