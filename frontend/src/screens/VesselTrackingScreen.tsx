import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { AlertTriangle, CheckCircle2, Search, Filter, Crosshair, Pause, PlayCircle, EyeOff, Navigation, ChevronDown } from 'lucide-react';
import MapLibreMap from '../components/map/MapLibreMap';
import { getVesselStateAtTime, normalizeAISTime } from '../utils/ais';

export default function VesselTrackingScreen() {
  const { data, selectedVessel, setSelectedVessel, playbackData, isPlaying, setIsPlaying, playbackTime, setPlaybackTime } = useApp();
  const [activeTab, setActiveTab] = useState('Tracks & History');

  const timeRange = useMemo(() => {
    if (!playbackData || Object.keys(playbackData).length === 0) return { min: 0, max: 100 };
    let min = Infinity;
    let max = -Infinity;
    Object.values(playbackData).forEach((pts: any) => {
      pts.forEach((p: any) => {
        const t = normalizeAISTime(p.time);
        if (t < min) min = t;
        if (t > max) max = t;
      });
    });
    return { min: min === Infinity ? 0 : min, max: max === -Infinity ? 100 : max };
  }, [playbackData]);

  if (!data) return null;

  const selectedResult = data.attribution.results.find(r => r.id === selectedVessel);
  const selectedDetails = data.vessels.find(v => v.id === selectedVessel);

  const currentTs = playbackTime ?? timeRange.min;
  const stateResult = getVesselStateAtTime(selectedVessel, currentTs, playbackData, data.vessels, data.attribution);
  const state = stateResult.hasValidTelemetry ? stateResult : null;
  const pastPts = stateResult.pastPts;
  const hasValidTelemetry = stateResult.hasValidTelemetry;
  const pts = stateResult.allPts;

  const hasGap = pts.some((p: any, i: number) => {
    if (i === 0) return false;
    return (normalizeAISTime(p.time) - normalizeAISTime(pts[i - 1].time)) > 7200;
  });

  const currentTimeStr = playbackTime
    ? new Date(playbackTime * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
    : 'Waiting for AIS data...';

  return (
    <div className="flex flex-col h-full p-4 gap-4 overflow-y-auto">
      {/* Top Metrics Row */}
      <div className="flex gap-4 shrink-0 overflow-x-auto pb-1">
        <StatCard icon={<Navigation className="w-5 h-5" />} label="Total Vessels Tracked" value="4,892" trend="+154" trendColor="text-emerald-500" bg="bg-blue-50" fg="text-blue-500" />
        <StatCard icon={<AlertTriangle className="w-5 h-5" />} label="Vessels with AIS Gaps" value="342" subtext="7%" bg="bg-amber-50" fg="text-amber-500" />
        <StatCard icon={<EyeOff className="w-5 h-5" />} label="Dark Vessels" value="7" trend="+2" trendColor="text-red-500" bg="bg-slate-100" fg="text-slate-600" badge="Radar" badgeColor="slate" />
        <StatCard icon={<AlertTriangle className="w-5 h-5" />} label="Suspicious Behavior" value="12" subtext="Needs Review" bg="bg-red-50" fg="text-red-500" badge="Alerts" badgeColor="red" />
        <div className="flex-1 bg-white rounded-lg border border-slate-200 p-3 shadow-sm flex items-center justify-between min-w-[200px]">
           <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">System Status</span>
              <span className="text-sm font-black text-navy-900 mt-0.5">Operational</span>
              <span className="text-[10px] text-slate-400 mt-0.5">All systems nominal</span>
           </div>
           <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
           </div>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left: Vessel List */}
        <div className="w-[300px] bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-lg">
            <h2 className="font-bold text-navy-900 text-sm">Vessel Watchlist (15)</h2>
            <button className="text-[10px] font-bold text-blue-600 flex items-center gap-1"><Filter className="w-3 h-3"/> Filter</button>
          </div>
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input type="text" placeholder="Search MMSI or Name..." className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded outline-none focus:border-blue-400 text-navy-900" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
            {data.attribution.results.map(r => {
              const v = data.vessels.find(x => x.id === r.id);
              const isDark = v?.vessel_type === 'Unknown / Dark Vessel';
              const isSource = r.rank === 1;
              return (
                <div key={r.id} onClick={() => setSelectedVessel(r.id)} 
                     className={`flex items-start gap-3 p-2 rounded cursor-pointer transition-colors border ${selectedVessel === r.id ? 'bg-blue-50/60 border-blue-200 shadow-sm' : 'border-transparent hover:bg-slate-50 hover:border-slate-100'}`}>
                   <div className="pt-1"><Navigation className={`w-4 h-4 ${isSource ? 'text-red-500' : isDark ? 'text-amber-500' : 'text-emerald-500'} ${isDark ? '' : 'fill-current'}`} /></div>
                   <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                         <span className="text-xs font-bold text-navy-900 truncate">{r.id.replace('DEMO-', '')}</span>
                         <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isSource ? 'bg-red-100 text-red-700' : isDark ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{r.evidence_strength} RISK</span>
                      </div>
                      <div className="text-[9px] text-slate-500 mt-1 truncate">{v?.vessel_type}</div>
                      <div className="flex items-center gap-2 mt-1.5">
                         <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                            <div className={`h-full ${isSource ? 'bg-red-500' : isDark ? 'bg-amber-500' : 'bg-slate-400'}`} style={{ width: `${r.attribution_score * 100}%` }} />
                         </div>
                         <span className="text-[9px] font-black text-navy-900 w-6 text-right">{(r.attribution_score * 100).toFixed(0)}%</span>
                      </div>
                   </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center: Map */}
        <div className="flex-[2] flex flex-col gap-4 min-w-0">
          <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col min-h-[400px] overflow-hidden">
             <div className="flex items-center justify-between px-2 pt-2 border-b border-slate-100 bg-white z-10 shrink-0">
                <div className="flex gap-1">
                   {['Live Map', 'Tracks & History', 'AIS Gaps', 'Anomaly Detection'].map(tab => (
                     <button key={tab} onClick={() => setActiveTab(tab)}
                       className={`px-4 py-2.5 text-xs font-bold transition-colors border-b-2 ${activeTab === tab ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-navy-900 hover:bg-slate-50 rounded-t'}`}>
                       {tab}
                     </button>
                   ))}
                </div>
                <button className="flex items-center gap-1.5 px-3 py-1.5 mr-2 mb-1 bg-white border border-slate-200 rounded text-xs font-bold text-slate-600 hover:bg-slate-50">Layers <ChevronDown className="w-3.5 h-3.5"/></button>
             </div>
             
             {/* Map Area */}
             <div className="flex-1 relative bg-slate-100">
               <div className="absolute inset-0">
                  <MapLibreMap showLayerPanel />
               </div>
             </div>
             
             {/* Timeline Playback inside Map container */}
             <div className="bg-white border-t border-slate-200 px-4 py-3 shrink-0 flex items-center gap-4">
                <button onClick={() => setIsPlaying(!isPlaying)} className="w-10 h-10 rounded-full bg-navy-900 hover:bg-navy-800 text-white flex items-center justify-center shrink-0 shadow-md transition-colors">
                  {isPlaying ? <Pause className="w-4 h-4" /> : <PlayCircle className="w-5 h-5" />}
                </button>
                
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Demonstration Playback</span>
                  <span className="text-xs font-mono font-black text-navy-900 whitespace-nowrap min-w-[150px]">
                    {currentTimeStr}
                  </span>
                </div>
                
                <div className="flex-1 relative flex items-center h-full group mx-4">
                  <input
                    type="range"
                    min={timeRange.min}
                    max={timeRange.max}
                    step={900}
                    value={playbackTime ?? timeRange.min}
                    onChange={(e) => { setIsPlaying(false); setPlaybackTime(+e.target.value); }}
                    className="w-full h-1.5 bg-slate-200 rounded-full appearance-none accent-blue-600 cursor-pointer group-hover:h-2 transition-all"
                  />
                  <div className="absolute top-4 left-0 right-0 flex justify-between text-[9px] font-bold text-slate-400 px-1">
                    <span>{new Date(timeRange.min * 1000).toISOString().slice(11, 16)}</span>
                    <span>{new Date(timeRange.max * 1000).toISOString().slice(11, 16)}</span>
                  </div>
                </div>
             </div>
          </div>
          
          {/* Bottom Panels */}
          <div className="flex gap-4 shrink-0 h-[140px]">
             {/* Speed & Heading Analysis */}
             <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm p-3 flex flex-col">
                <h3 className="text-xs font-bold text-navy-900 mb-2 border-b border-slate-100 pb-1">Speed & Heading Analysis</h3>
                {pastPts.length > 0 ? (
                  <div className="text-[10px] flex-1 overflow-y-auto">
                    <div className="grid grid-cols-3 bg-slate-50 font-bold text-slate-500 uppercase px-2 py-1 sticky top-0 border-b border-slate-100">
                      <div>Time (UTC)</div><div>Speed</div><div>Heading</div>
                    </div>
                    {pastPts.slice(-8).reverse().map((p: any, i: number) => (
                      <div key={i} className="grid grid-cols-3 px-2 py-1.5 border-b border-slate-50 font-mono text-navy-900">
                        <div>{new Date(normalizeAISTime(p.time)*1000).toISOString().slice(11,16)}</div>
                        <div>{(p.speed ?? 0).toFixed(1)} kts</div>
                        <div>{(p.heading ?? 0).toFixed(0)}°</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-400 italic mt-2">History unavailable for current trajectory.</div>
                )}
             </div>
             
             {/* AIS Gap Timeline */}
             <div className="flex-[1.5] bg-white rounded-lg border border-slate-200 shadow-sm p-3 flex flex-col">
                <div className="flex justify-between items-center mb-2 border-b border-slate-100 pb-1">
                   <h3 className="text-xs font-bold text-navy-900">AIS Gap Timeline</h3>
                   <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${hasGap ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                      {hasGap ? 'Gaps Detected' : 'No Significant Gaps'}
                   </span>
                </div>
                <div className="flex-1 flex flex-col justify-center px-4 relative">
                   <div className="w-full h-2 bg-emerald-400 rounded-full absolute left-4 right-4" />
                   {hasGap && <div className="absolute left-[30%] w-[15%] h-2 bg-amber-400 rounded-none z-10" />}
                   {hasGap && <div className="absolute left-[60%] w-[5%] h-2 bg-red-400 rounded-none z-10" />}
                   
                   <div className="absolute top-[60%] left-4 right-4 flex justify-between text-[9px] text-slate-500 font-mono">
                      <span>-12h</span>
                      <span>-6h</span>
                      <span>Now</span>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Right: Vessel Details */}
        <div className="w-[300px] flex flex-col gap-4 shrink-0 overflow-y-auto">
          {/* Selected Vessel */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-100 bg-slate-50 rounded-t-lg">
              <h3 className="font-bold text-navy-900 text-sm">Selected Vessel</h3>
            </div>
            <div className="p-4 flex flex-col items-center border-b border-slate-100 text-center">
               <Navigation className={`w-8 h-8 mb-2 ${selectedResult?.rank === 1 ? 'text-red-500' : 'text-slate-400'}`} />
               <h2 className="text-xl font-black text-navy-900">{selectedVessel?.replace('DEMO-', '')}</h2>
               <p className="text-xs text-slate-500">{selectedDetails?.vessel_type}</p>
            </div>
            <div className="p-3 bg-slate-50 grid grid-cols-2 gap-x-2 gap-y-3">
               <div><span className="text-[9px] font-bold text-slate-400 uppercase block">Length</span><span className="text-xs font-bold text-navy-900">N/A</span></div>
               <div><span className="text-[9px] font-bold text-slate-400 uppercase block">Width</span><span className="text-xs font-bold text-navy-900">N/A</span></div>
               <div><span className="text-[9px] font-bold text-slate-400 uppercase block">Flag</span><span className="text-xs font-bold text-navy-900">Unknown</span></div>
               <div><span className="text-[9px] font-bold text-slate-400 uppercase block">Status</span><span className="text-xs font-bold text-emerald-600">Underway</span></div>
            </div>
          </div>

          {/* Current Position */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-100 bg-slate-50 rounded-t-lg flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-blue-500" />
              <h3 className="font-bold text-navy-900 text-sm">Current Position</h3>
            </div>
            <div className="p-4">
              {hasValidTelemetry ? (
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs">
                  <div><div className="text-[9px] text-slate-400 font-bold uppercase mb-1">Latitude</div><div className="font-mono font-medium text-navy-900">{(state?.lat ?? 0).toFixed(5)}°N</div></div>
                  <div><div className="text-[9px] text-slate-400 font-bold uppercase mb-1">Longitude</div><div className="font-mono font-medium text-navy-900">{(state?.lon ?? 0).toFixed(5)}°E</div></div>
                  <div><div className="text-[9px] text-slate-400 font-bold uppercase mb-1">Speed</div><div className="font-mono font-medium text-navy-900">{(state?.speed ?? 0).toFixed(1)} kts</div></div>
                  <div><div className="text-[9px] text-slate-400 font-bold uppercase mb-1">Heading</div><div className="font-mono font-medium text-navy-900">{(state?.heading ?? 0).toFixed(1)}°</div></div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic text-center py-2">No telemetry at this time.</div>
              )}
            </div>
          </div>

          {/* Risk & Anomaly Indicators */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-100 bg-slate-50 rounded-t-lg">
              <h3 className="font-bold text-navy-900 text-sm">Risk & Anomaly Indicators</h3>
            </div>
            <div className="p-3 flex flex-col gap-3">
               <AnomalyRow label="AIS Spoofing Detected" active={false} />
               <AnomalyRow label="AIS Gap > 2 hours" active={hasGap} />
               <AnomalyRow label="Trajectory Anomaly" active={(selectedResult?.factor_breakdown?.anomaly ?? 0) > 0.6} />
               <AnomalyRow label="Historical Compliance Risk" active={(selectedResult?.factor_breakdown?.dark ?? 0) > 0.5} />
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subtext, bg, fg, trend, trendColor, badge, badgeColor }: any) {
  const bc = badgeColor === 'red' ? 'bg-red-50 text-red-500' : badgeColor === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500';
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm flex flex-col justify-between min-w-[160px] flex-1">
      <div className="flex items-center justify-between mb-2">
         <div className={`w-8 h-8 rounded ${bg} ${fg} flex items-center justify-center shrink-0`}>{icon}</div>
         {badge && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${bc}`}>{badge}</span>}
      </div>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide truncate">{label}</p>
      <div className="flex items-baseline gap-2 mt-1">
         <p className="text-2xl font-black text-navy-900 leading-none">{value}</p>
         {trend && <span className={`text-[11px] font-bold ${trendColor}`}>{trend}</span>}
      </div>
      <p className="text-[10px] text-slate-400 mt-1 truncate">{subtext}</p>
    </div>
  );
}

function AnomalyRow({ label, active }: any) {
   return (
      <div className="flex justify-between items-center p-2 border border-slate-100 rounded bg-white">
         <span className="text-[11px] font-bold text-navy-900">{label}</span>
         {active ? (
            <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5" /> High</span>
         ) : (
            <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5" /> Nominal</span>
         )}
      </div>
   );
}
