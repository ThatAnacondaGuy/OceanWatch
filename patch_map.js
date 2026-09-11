const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/map/MapLibreMap.tsx', 'utf8');
if (!content.includes('import { normalizeAISTime, getVesselStateAtTime } from')) {
    content = content.replace("import { normalizeAISTime } from '../utils/ais';", "import { normalizeAISTime, getVesselStateAtTime } from '../utils/ais';");
}
fs.writeFileSync('frontend/src/components/map/MapLibreMap.tsx', content);
