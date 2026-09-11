const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/map/MapLibreMap.tsx', 'utf8');

// The original import might be missing entirely! Let's insert it at the top.
if (!content.includes('import { normalizeAISTime, getVesselStateAtTime } from')) {
    content = content.replace("import { useApp } from '../../context/AppContext';", "import { useApp } from '../../context/AppContext';\nimport { normalizeAISTime, getVesselStateAtTime } from '../../utils/ais';");
}
fs.writeFileSync('frontend/src/components/map/MapLibreMap.tsx', content);
