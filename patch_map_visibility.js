const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/map/MapLibreMap.tsx', 'utf8');

// Remove the standalone effect
content = content.replace(/    data\?\.vessels\.forEach\(\(v\) => \{\s+if \(markersRef\.current\[v\.id\]\) \{\s+markersRef\.current\[v\.id\]\.getElement\(\)\.style\.display = layers\.vesselCurrentPosition \? 'flex' : 'none';\s+\}\s+\}\);\s+\}, \[layers, data\?\.vessels\]\);/g, "  }, [layers]);");

// Inside Playback loop, ensure we set display back to flex if layers.vesselCurrentPosition is true
content = content.replace(/        const el = marker.getElement\(\);\n        const iconEl/g, "        const el = marker.getElement();\n        el.style.display = layers.vesselCurrentPosition ? 'flex' : 'none';\n        const iconEl");

fs.writeFileSync('frontend/src/components/map/MapLibreMap.tsx', content);
