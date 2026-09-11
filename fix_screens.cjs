const fs = require('fs');

// 1. Dashboard Screen
let dashboard = fs.readFileSync('frontend/src/screens/DashboardScreen.tsx', 'utf8');
dashboard = dashboard.replace(/import { Link } from 'react-router-dom';/, "import { Link, useNavigate } from 'react-router-dom';");
if (!dashboard.includes('useNavigate')) {
  dashboard = dashboard.replace(/import { useApp }/, "import { useNavigate } from 'react-router-dom';\nimport { useApp }");
}
dashboard = dashboard.replace(/export default function DashboardScreen\(\) \{/, "export default function DashboardScreen() {\n  const navigate = useNavigate();");
dashboard = dashboard.replace(/<button className="text-slate-500 hover:text-navy-900 pb-2">Live Map<\/button>/, `<button onClick={() => navigate('/monitoring')} className="text-slate-500 hover:text-navy-900 pb-2 border-b-2 border-transparent">Live Map</button>`);
dashboard = dashboard.replace(/<button className="text-slate-500 hover:text-navy-900 pb-2">Satellite View<\/button>/, `<button onClick={() => navigate('/satellite')} className="text-slate-500 hover:text-navy-900 pb-2 border-b-2 border-transparent">Satellite View</button>`);
dashboard = dashboard.replace(/<button className="text-slate-500 hover:text-navy-900 pb-2">Analysis Layers<\/button>/, `<button onClick={() => navigate('/incidents')} className="text-slate-500 hover:text-navy-900 pb-2 border-b-2 border-transparent">Analysis Layers</button>`);
dashboard = dashboard.replace(/<button className="text-slate-500 hover:text-navy-900 pb-2">Historical Data<\/button>/, `<button onClick={() => alert('Historical trajectory data unavailable for synthetic demo.')} className="text-slate-500 hover:text-navy-900 pb-2 border-b-2 border-transparent">Historical Data</button>`);
dashboard = dashboard.replace(/<button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-3 rounded flex items-center gap-2 shadow-sm"><FileText className="w-3.5 h-3.5"\/> Run Detection<\/button>/, `<button className="bg-slate-300 text-slate-500 text-xs font-bold py-1.5 px-3 rounded flex items-center gap-2 shadow-sm cursor-not-allowed" title="Detection pipeline execution is disabled in this UI demonstration"><FileText className="w-3.5 h-3.5"/> Run Detection (Unavailable)</button>`);
dashboard = dashboard.replace(/<button className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold py-1 rounded flex items-center justify-center gap-2"><Search className="w-3.5 h-3.5"\/> Search Vessel<\/button>/, `<button onClick={() => navigate('/vessels')} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold py-1 rounded flex items-center justify-center gap-2"><Search className="w-3.5 h-3.5"/> Search Vessel</button>`);
fs.writeFileSync('frontend/src/screens/DashboardScreen.tsx', dashboard);

// 2. Live Monitoring Screen
let live = fs.readFileSync('frontend/src/screens/LiveMonitoringScreen.tsx', 'utf8');
live = live.replace(/export default function LiveMonitoringScreen\(\) \{/, 
`export default function LiveMonitoringScreen() {
  const { data, playbackTime, setPlaybackTime, isPlaying, setIsPlaying, layers, setLayers, playbackData } = useApp();
  
  // Timer effect for playback
  import('react').then(({ useEffect }) => {
     useEffect(() => {
        let interval: any;
        if (isPlaying && playbackData) {
            interval = setInterval(() => {
                setPlaybackTime(prev => {
                    const next = (prev || 0) + 900; // +15 mins
                    // loop around logic simplified
                    return next;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
     }, [isPlaying, playbackData]);
  });
`);

// Add layer controls block replacement to live monitoring
live = live.replace(/<div className="bg-white rounded border border-slate-200 shadow-sm flex flex-col h-64">[\s\S]*?<\/div>/,
`<div className="bg-white rounded border border-slate-200 shadow-sm flex flex-col flex-1">
    <div className="p-3 border-b border-slate-100 bg-slate-50"><h3 className="text-xs font-bold text-navy-900 uppercase tracking-widest">Map Layers</h3></div>
    <div className="p-3 flex flex-col gap-3 text-xs flex-1 overflow-auto">
        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={layers.sar} onChange={e => setLayers({...layers, sar: e.target.checked})} className="accent-blue-600"/> SAR Background</label>
        {layers.sar && <input type="range" min="0" max="1" step="0.1" value={layers.sarOpacity} onChange={e => setLayers({...layers, sarOpacity: parseFloat(e.target.value)})} className="w-full h-1 bg-slate-200 rounded appearance-none" />}
        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={layers.unet} onChange={e => setLayers({...layers, unet: e.target.checked})} className="accent-blue-600"/> U-Net Probability</label>
        {layers.unet && <input type="range" min="0" max="1" step="0.1" value={layers.unetOpacity} onChange={e => setLayers({...layers, unetOpacity: parseFloat(e.target.value)})} className="w-full h-1 bg-slate-200 rounded appearance-none" />}
        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={layers.slick} onChange={e => setLayers({...layers, slick: e.target.checked})} className="accent-blue-600"/> Detected Slick</label>
        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={layers.driftOrigin} onChange={e => setLayers({...layers, driftOrigin: e.target.checked})} className="accent-blue-600"/> Drift Origin</label>
        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={layers.driftHeatmap} onChange={e => setLayers({...layers, driftHeatmap: e.target.checked})} className="accent-blue-600"/> Backward Drift Heatmap</label>
        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={layers.driftForecast} onChange={e => setLayers({...layers, driftForecast: e.target.checked})} className="accent-blue-600"/> Forward Drift Forecast</label>
        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={layers.vessels} onChange={e => setLayers({...layers, vessels: e.target.checked})} className="accent-blue-600"/> Vessels & AIS Tracks</label>
    </div>
</div>`
);

live = live.replace(/<button className="w-8 h-8 rounded-full bg-blue-600.*?<\/button>/,
`<button onClick={() => setIsPlaying(!isPlaying)} className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 shadow shrink-0">
    <PlayCircle className="w-5 h-5" />
</button>`
);
live = live.replace(/>15 min</, `>Playback</`);
fs.writeFileSync('frontend/src/screens/LiveMonitoringScreen.tsx', live);

// 3. Spill Incidents (Tabs)
let spill = fs.readFileSync('frontend/src/screens/SpillIncidentsScreen.tsx', 'utf8');
spill = spill.replace(/<div className="flex gap-6 border-b border-slate-200 px-6 shrink-0 text-sm">[\s\S]*?<\/div>/,
`<div className="flex gap-6 border-b border-slate-200 px-6 shrink-0 text-sm">
    <button className="text-navy-900 font-bold border-b-2 border-navy-900 pb-3">Overview</button>
    <button onClick={() => alert('Tab panel content rendered in main view.')} className="text-slate-500 hover:text-navy-900 pb-3 border-b-2 border-transparent">Satellite Imagery</button>
    <button onClick={() => alert('Tab panel content rendered in main view.')} className="text-slate-500 hover:text-navy-900 pb-3 border-b-2 border-transparent">Drift Analysis</button>
    <button onClick={() => alert('Tab panel content rendered in main view.')} className="text-slate-500 hover:text-navy-900 pb-3 border-b-2 border-transparent">Vessel Analysis</button>
</div>`
);
spill = spill.replace(/<button className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold px-4 py-2 rounded shadow-sm flex items-center gap-2"><Download className="w-4 h-4"\/> Export Data<\/button>/,
`<button onClick={() => window.open('/api/demo/ennore', '_blank')} className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold px-4 py-2 rounded shadow-sm flex items-center gap-2"><Download className="w-4 h-4"/> Export Data</button>`
);
spill = spill.replace(/<button className="w-full bg-white border border-slate-200.*?Mark Area<\/button>/,
`<button className="w-full bg-slate-100 border border-slate-200 text-slate-400 text-xs font-bold py-2 rounded cursor-not-allowed">Mark Area (Unavailable)</button>`
);
fs.writeFileSync('frontend/src/screens/SpillIncidentsScreen.tsx', spill);

// 4. Vessel Tracking (Search)
let vessel = fs.readFileSync('frontend/src/screens/VesselTrackingScreen.tsx', 'utf8');
vessel = vessel.replace(/const { data, setSelectedVessel, selectedVessel } = useApp\(\);\n  if \(\!data\) return null;/,
`const { data, setSelectedVessel, selectedVessel } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  if (!data) return null;
  const filteredVessels = data.attribution.results.filter(r => r.id.toLowerCase().includes(searchTerm.toLowerCase()));`
);
vessel = vessel.replace(/<input type="text" placeholder="Search MMSI, Name, IMO..." className="w-full bg-slate-100 border-none rounded text-xs py-2 pl-9 focus:ring-1 focus:ring-blue-500 outline-none" \/>/,
`<input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search MMSI, Name, IMO..." className="w-full bg-slate-100 border-none rounded text-xs py-2 pl-9 focus:ring-1 focus:ring-blue-500 outline-none" />`
);
vessel = vessel.replace(/data\.attribution\.results\.map\(\(r, i\)/, 'filteredVessels.map((r, i)');
fs.writeFileSync('frontend/src/screens/VesselTrackingScreen.tsx', vessel);

// 5. Satellite Data
let sat = fs.readFileSync('frontend/src/screens/SatelliteDataScreen.tsx', 'utf8');
sat = sat.replace(/const { data } = useApp\(\);/,
`const { data, layers, setLayers } = useApp();`
);
sat = sat.replace(/<button className="flex-1 bg-white border border-slate-200 text-slate-700 text-xs font-bold py-1.5 rounded shadow-sm">VH<\/button>/,
`<button onClick={() => alert('VH Polarization scene unavailable in current demo dataset.')} className="flex-1 bg-slate-100 border border-slate-200 text-slate-400 text-xs font-bold py-1.5 rounded shadow-sm">VH (N/A)</button>`
);
sat = sat.replace(/<button className="bg-white border border-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded shadow-sm flex items-center gap-2 hover:bg-slate-50"><MapIcon className="w-3.5 h-3.5"\/> View Larger Map<\/button>/,
`<button onClick={() => document.getElementById('satmap')?.requestFullscreen()} className="bg-white border border-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded shadow-sm flex items-center gap-2 hover:bg-slate-50"><MapIcon className="w-3.5 h-3.5"/> Fullscreen Map</button>`
);
// Make the toggle overlays functional
sat = sat.replace(/<input type="checkbox" defaultChecked className="accent-blue-600" \/>/, `<input type="checkbox" checked={layers.sar} onChange={e => setLayers({...layers, sar: e.target.checked})} className="accent-blue-600" />`);
sat = sat.replace(/<input type="checkbox" defaultChecked className="accent-emerald-600" \/>/, `<input type="checkbox" checked={layers.slick} onChange={e => setLayers({...layers, slick: e.target.checked})} className="accent-emerald-600" />`);
sat = sat.replace(/<input type="checkbox" className="accent-blue-600" \/>/, `<input type="checkbox" checked={layers.unet} onChange={e => setLayers({...layers, unet: e.target.checked})} className="accent-blue-600" />`);
fs.writeFileSync('frontend/src/screens/SatelliteDataScreen.tsx', sat);

console.log("Screens patched.");
