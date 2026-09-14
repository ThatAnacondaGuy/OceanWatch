import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Satellite, Navigation, Droplet, Wind, CheckCircle2, PlayCircle, Pause, AlertTriangle, Activity, Compass, Calendar, EyeOff, Search, ChevronDown } from 'lucide-react';
import MapLibreMap from '../components/map/MapLibreMap';

export default function LiveMonitoringScreen() {
  const { data, isPlaying, setIsPlaying, playbackTime, setPlaybackTime, playbackData, selectedVessel, setSelectedVessel } = useApp();
  const [activeTab, setActiveTab] = useState('Investigation Map');

  const timeRange = useMemo(() => {
    if (!playbackData || Object.keys(playbackData).length === 0) return { min: 0, max: 100 };
    let min = Infinity;
    let max = -Infinity;
    Object.values(playbackData).forEach((pts: any) => {
      pts.forEach((p: any) => {
        if (p.time < min) min = p.time;
        if (p.time > max) max = p.time;
      });
    });
    return { min: min === Infinity ? 0 : min, max: max === -Infinity ? 100 : max };
  }, [playbackData]);

  if (!data) return null;

  const currentTimeStr = playbackTime 
    ? new Date(playbackTime * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
    : 'Waiting for AIS data...';

  return (
    <div className="flex flex-col h-full p-4 gap-4 overflow-y-auto">
      {/* Top Metrics Row */}
      <div className="flex gap-4 shrink-0 overflow-x-auto pb-1">
        <StatCard icon={<Satellite className="w-5 h-5" />} label="Satellites Active" value="2 / 3" subtext="Sentinel-1, Sentinel-2" bg="bg-blue-50" fg="text-blue-500" />
        <StatCard icon={<Navigation className="w-5 h-5" />} label="Monitored Vessels" value="5" trend="+1" trendColor="text-emerald-500" subtext="(In View)" bg="bg-blue-50" fg="text-blue-500" />
        <StatCard icon={<Droplet className="w-5 h-5" />} label="Detected Oil Spills" value="1" badge="Active" badgeColor="red" subtext="Last 24 hours" bg="bg-red-50" fg="text-red-500" />
        <StatCard icon={<EyeOff className="w-5 h-5" />} label="Dark Vessels" value="1" badge="Radar" badgeColor="amber" subtext="(Radar only)" bg="bg-amber-50" fg="text-amber-600" />
        <StatCard icon={<Wind className="w-5 h-5" />} label="Avg. Wind Speed" value={`${data.environment.wind_speed.toFixed(1)} m/s`} subtext="(Demo Area)" bg="bg-slate-50" fg="text-blue-400" />
        <div className="flex-1 bg-white rounded-lg border border-slate-200 p-3 shadow-sm flex items-center justify-between min-w-[200px]">
           <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">System Status</span>
              <span className="text-sm font-black text-navy-900 mt-0.5">Demo Mode</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Demonstration playback active</span>
           </div>
           <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
           </div>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left Column (Main Map + Env) */}
        <div className="flex-[2] flex flex-col gap-4 min-w-0">
          
          <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col min-h-[400px] overflow-hidden">
             <div className="flex items-center justify-between px-2 pt-2 border-b border-slate-100 bg-white z-10 shrink-0">
                <div className="flex gap-1">
                   {['Investigation Map', 'Drift Forecast', 'Vessel Tracks', 'Satellite Coverage'].map(tab => (
                     <button key={tab} onClick={() => setActiveTab(tab)}
                       className={`px-4 py-2.5 text-xs font-bold transition-colors border-b-2 ${activeTab === tab ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-navy-900 hover:bg-slate-50 rounded-t'}`}>
                       {tab}
                     </button>
                   ))}
                </div>
                <div className="flex items-center gap-2 pb-1 pr-2">
                   <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                      <input type="text" placeholder="Search vessel..." className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded w-48 focus:outline-none focus:border-blue-400 text-navy-900" />
                   </div>
                   <button className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded text-xs font-bold shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      Playback Mode <ChevronDown className="w-3.5 h-3.5"/>
                   </button>
                </div>
             </div>
             
             {/* Map Area */}
             <div className="flex-1 relative bg-slate-100">
               <div className="absolute inset-0">
                  <MapLibreMap showLayerPanel />
               </div>
             </div>
             
             {/* Timeline Playback inside Map container */}
             <div className="bg-white border-t border-slate-200 px-4 py-3 shrink-0 flex items-center gap-4">
                <button onClick={() => setIsPlaying(!isPlaying)} className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-md transition-colors">
                  {isPlaying ? <Pause className="w-4 h-4" /> : <PlayCircle className="w-5 h-5" />}
                </button>
                
                <span className="text-xs font-mono font-bold text-navy-900 whitespace-nowrap w-[150px]">
                  {currentTimeStr}
                </span>
                
                <div className="flex-1 relative mx-4">
                  <input
                    type="range"
                    min={timeRange.min}
                    max={timeRange.max}
                    step={900}
                    value={playbackTime ?? timeRange.min}
                    onChange={(e) => setPlaybackTime(+e.target.value)}
                    className="w-full h-1.5 bg-slate-200 rounded-full appearance-none accent-blue-600 cursor-pointer"
                  />
                  <div className="absolute top-4 left-0 right-0 flex justify-between text-[9px] font-bold text-slate-400 px-1">
                    <span>{new Date(timeRange.min * 1000).toISOString().slice(11, 16)} Z</span>
                    <span>{new Date(timeRange.max * 1000).toISOString().slice(11, 16)} Z</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                   <button className="px-3 py-1.5 bg-navy-900 text-white text-[10px] font-bold rounded shadow-sm">Current</button>
                   <button className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[10px] font-bold rounded hover:bg-slate-50 flex items-center gap-1"><Calendar className="w-3 h-3" /> Historical</button>
                </div>
             </div>
          </div>
          
          {/* Bottom Left Panels: Environmental Conditions & Forecast */}
          <div className="flex gap-4 shrink-0 h-28">
             <div className="flex-[2] bg-white rounded-lg border border-slate-200 shadow-sm p-3 flex flex-col">
                <h3 className="text-[11px] font-bold text-navy-900 mb-2">Environmental Conditions <span className="text-slate-400 font-normal">(at cursor)</span></h3>
                <div className="flex items-center justify-between flex-1 px-4">
                   <EnvMetric icon={<Wind className="w-6 h-6 text-blue-400" />} label="Wind Speed" val={`${data.environment.wind_speed.toFixed(1)} m/s`} sub="(NE)" />
                   <div className="w-px h-8 bg-slate-200" />
                   <EnvMetric icon={<Activity className="w-6 h-6 text-emerald-400" />} label="Wave Height" val="1.4 m" sub="(Demo)" />
                   <div className="w-px h-8 bg-slate-200" />
                   <EnvMetric icon={<Compass className="w-6 h-6 text-indigo-400" />} label="Surface Current" val={`${data.environment.current_speed.toFixed(2)} m/s`} sub="(E)" />
                   <div className="w-px h-8 bg-slate-200" />
                   <EnvMetric icon={<Droplet className="w-6 h-6 text-amber-400" />} label="Sea Surface Temp." val="28.3 °C" sub=" " />
                </div>
             </div>
             
             <div className="flex-[1] bg-white rounded-lg border border-slate-200 shadow-sm p-3 flex flex-col">
                <h3 className="text-[11px] font-bold text-navy-900 mb-2">Forecast <span className="text-slate-400 font-normal">(Selected Spill)</span></h3>
                <div className="flex items-center gap-4 mt-2">
                   <Wind className="w-8 h-8 text-red-500" />
                   <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Estimated Reach (72h)</span>
                      <span className="text-sm font-black text-navy-900">~ 85 km</span>
                      <span className="text-[10px] text-slate-400">(towards SE)</span>
                   </div>
                   <div className="ml-auto flex items-center gap-2 pr-2">
                      <AlertTriangle className="w-6 h-6 text-red-500" />
                      <div className="flex flex-col">
                         <span className="text-[10px] font-bold text-navy-900">Potential Impact</span>
                         <span className="text-[10px] font-bold text-red-500">Coastline Risk</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="w-[320px] flex flex-col gap-4 shrink-0 overflow-y-auto">
          
          {/* Active Detections */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-lg">
              <h3 className="font-bold text-navy-900 text-sm">Active Detections (3)</h3>
              <button className="text-[10px] font-bold text-blue-600 hover:underline">View All</button>
            </div>
            <div className="p-1 flex flex-col">
               <DetectionRow id={data.case.case_id} area={`${data.slick.area} px`} time={data.case.date} status="High" color="bg-red-500" statusColor="text-red-600 bg-red-50" />
               <DetectionRow id="OS-2025-090" area="3.1 km²" time="08 Sep 2025, 16:03 Z" status="Medium" color="bg-amber-500" statusColor="text-amber-600 bg-amber-50" />
               <DetectionRow id="OS-2025-089" area="0.8 km²" time="07 Sep 2025, 09:12 Z" status="Low" color="bg-emerald-500" statusColor="text-emerald-600 bg-emerald-50" />
            </div>
          </div>

          {/* Vessels in View */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col flex-1 min-h-[250px]">
            <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-lg">
              <h3 className="font-bold text-navy-900 text-sm">Vessels in View ({data.vessels.length})</h3>
              <button className="text-[10px] font-bold text-blue-600 hover:underline">View All</button>
            </div>
            <div className="flex-1 overflow-y-auto p-1">
              {data.attribution.results.map((c) => {
                const v = data.vessels.find(x => x.id === c.id);
                const isDark = v?.vessel_type === 'Unknown / Dark Vessel';
                const isSource = c.rank === 1;
                return (
                  <div key={c.id} onClick={() => setSelectedVessel(c.id)} className={`flex items-center justify-between p-2 cursor-pointer rounded mb-1 transition-colors ${selectedVessel === c.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                    <div className="flex items-center gap-3">
                       <Navigation className={`w-4 h-4 ${isSource ? 'text-red-500' : isDark ? 'text-amber-500' : 'text-emerald-500'} ${isDark ? '' : 'fill-current'}`} />
                       <div className="flex flex-col">
                          <span className="text-xs font-bold text-navy-900 flex items-center gap-1">{c.id.replace('DEMO-', '')} {isDark && <AlertTriangle className="w-3 h-3 text-amber-500" />}</span>
                          <span className="text-[10px] text-slate-500">{v?.vessel_type}</span>
                       </div>
                    </div>
                    <span className="text-xs font-black text-navy-900">{(c.attribution_score * 100).toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-lg">
              <h3 className="font-bold text-navy-900 text-sm">Recent Activity</h3>
              <button className="text-[10px] font-bold text-blue-600 hover:underline">View All</button>
            </div>
            <div className="p-3 flex flex-col gap-3">
               <ActivityRow color="bg-red-500" text={`New oil spill detected (${data.case.case_id})`} time="2 hours ago" icon={<Droplet className="w-3 h-3 text-red-500" />} />
               <ActivityRow color="bg-amber-500" text="Dark vessel detected (Unmatched)" time="3 hours ago" icon={<EyeOff className="w-3 h-3 text-amber-500" />} />
               <ActivityRow color="bg-blue-500" text="Satellite scene processed (S1A)" time="4 hours ago" icon={<Satellite className="w-3 h-3 text-blue-500" />} />
               <ActivityRow color="bg-emerald-500" text="Investigation completed (OS-2025-088)" time="6 hours ago" icon={<CheckCircle2 className="w-3 h-3 text-emerald-500" />} />
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

function EnvMetric({ icon, label, val, sub }: any) {
   return (
      <div className="flex items-center gap-3">
         {icon}
         <div className="flex flex-col">
            <span className="text-[9px] text-slate-500 font-bold uppercase">{label}</span>
            <span className="text-sm font-black text-navy-900 leading-tight">{val}</span>
            <span className="text-[9px] text-slate-400">{sub}</span>
         </div>
      </div>
   );
}

function DetectionRow({ id, area, time, status, color, statusColor }: any) {
   return (
      <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded cursor-pointer border-b border-slate-50 last:border-0 transition-colors">
         <div className="flex items-center gap-3 min-w-0">
            <div className={`w-2.5 h-2.5 rounded-full ${color} shrink-0`} />
            <div className="flex flex-col min-w-0">
               <span className="text-xs font-bold text-navy-900 truncate">{id}</span>
               <span className="text-[9px] text-slate-500 truncate">{time} • {area}</span>
            </div>
         </div>
         <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusColor} shrink-0`}>{status}</span>
      </div>
   );
}

function ActivityRow({ text, time, icon }: any) {
   return (
      <div className="flex gap-3 items-start">
         <div className="mt-0.5 bg-slate-50 p-1 rounded border border-slate-100">{icon}</div>
         <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-navy-900 leading-tight">{text}</span>
            <span className="text-[10px] text-slate-400 mt-0.5">{time}</span>
         </div>
      </div>
   );
}
