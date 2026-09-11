const fs = require('fs');

let content = fs.readFileSync('frontend/src/screens/VesselTrackingScreen.tsx', 'utf8');

content = content.replace(/p\.time <= timeLimit/g, "normalizeAISTime(p.time) <= timeLimit");
content = content.replace(/pts\[i\]\.time - pts\[i-1\]\.time > 7200/g, "(normalizeAISTime(pts[i].time) - normalizeAISTime(pts[i-1].time)) > 7200");
content = content.replace(/new Date\(pts\[0\]\.time\*1000\)/g, "new Date(normalizeAISTime(pts[0].time)*1000)");
content = content.replace(/new Date\(pts\[pts\.length-1\]\.time\*1000\)/g, "new Date(normalizeAISTime(pts[pts.length-1].time)*1000)");
content = content.replace(/new Date\(p\.time\*1000\)/g, "new Date(normalizeAISTime(p.time)*1000)");

fs.writeFileSync('frontend/src/screens/VesselTrackingScreen.tsx', content);
console.log("Patched VesselTrackingScreen.tsx");
