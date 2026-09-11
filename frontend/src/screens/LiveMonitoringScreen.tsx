import { useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Ship, Droplet, UserX, Wind, CheckCircle, PlayCircle, Pause, AlertTriangle } from 'lucide-react';
import MapLibreMap from '../components/map/MapLibreMap';

export default function LiveMonitoringScreen() {
  const {
    data, selectedVessel, setSelectedVessel,
    playbackTime, setPlaybackTime,
    isPlaying, setIsPlaying,
    layers, setLayers, playbackData,
  } = useApp();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Compute time range from playback data
  const timeRange = useMemo(() => {
    if (!playbackData) return { min: 0, max: 1 };
    let min = Infinity;
    let max = -Infinity;
    Object.values(playbackData).forEach((arr: any) => {
      if (arr.length > 0) {
        if (arr[0].time < min) min = arr[0].time;
        if (arr[arr.length - 1].time > max) max = arr[arr.length - 1].time;
      }
    });
    return { min: min === Infinity ? 0 : min, max: max === -Infinity ? 1 : max };
  }, [playbackData]);

  // Playback timer
  useEffect(() => {
    if (isPlaying && playbackData) {
      intervalRef.current = setInterval(() => {
        setPlaybackTime((prev) => {
          const next = (prev ?? timeRange.min) + 900; // +15 min
          if (next > timeRange.max) return timeRange.min; // loop
          return next;
        });
      }, 800);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, playbackData, timeRange]);

  if (!data) return null;

  const darkVessels = data.vessels.filter(v => v.vessel_type === 'Unknown / Dark Vessel').length;
  const currentTimeStr = playbackTime
    ? new Date(playbackTime * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
    : data.case.date + ' 04:00 UTC';

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Top Stats */}
      <div className="grid grid-cols-6 gap-3 p-4 shrink-0">
        <StatCard icon={<Ship className="w-5 h-5 fill-current" />} label="Monitored Vessels" value={String(data.vessels.length)} sub="(Demo)" bg="bg-blue-50" fg="text-blue-600" />
        <StatCard icon={<Droplet className="w-5 h-5 fill-current" />} label="Detected Slicks" value="1" sub="Ennore" bg="bg-red-50" fg="text-red-500" />
        <StatCard icon={<UserX className="w-5 h-5 fill-current" />} label="Dark Vessels" value={String(darkVessels)} sub="(Radar only)" bg="bg-slate-100" fg="text-slate-600" />
        <StatCard icon={<Wind className="w-5 h-5" />} label="Wind Speed" value={`${data.environment.wind_speed.toFixed(1)} m/s`} sub="Synthetic" bg="bg-sky-50" fg="text-sky-500" />
        <StatCard icon={<AlertTriangle className="w-5 h-5" />} label="Attribution Score" value={`${(data.attribution.results[0].attribution_score * 100).toFixed(0)}%`} sub={data.attribution.results[0].id.replace('DEMO-','')} bg="bg-amber-50" fg="text-amber-500" />
        <StatCard icon={<CheckCircle className="w-5 h-5" />} label="System Status" value="Operational" sub="Demo Playback" bg="bg-emerald-50" fg="text-emerald-500" />
      </div>

      {/* Main Area: Map + Sidebar */}
      <div className="flex-1 flex px-4 pb-4 gap-4 min-h-0">
        {/* Map Area */}
        <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          {/* Map Toolbar */}
          <div className="h-10 border-b border-slate-100 flex items-center justify-between px-3 bg-slate-50 shrink-0">
            <div className="flex text-[10px] font-bold gap-1">
              <button onClick={() => { setLayers({ ...layers, sar: true, slick: true, vessels: true, driftHeatmap: false, driftForecast: false }); }}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded">Investigation Map</button>
              <button onClick={() => { setLayers({ ...layers, driftHeatmap: true, driftForecast: true, driftOrigin: true }); }}
                className="px-3 py-1 text-slate-500 hover:text-navy-900 hover:bg-slate-100 rounded">+ Drift</button>
              <button onClick={() => { setLayers({ ...layers, driftForecast: true }); }}
                className="px-3 py-1 text-slate-500 hover:text-navy-900 hover:bg-slate-100 rounded">+ Forecast</button>
            </div>
            <div className="px-2 py-0.5 bg-amber-50 border border-amber-200 rounded text-[9px] text-amber-700 font-bold uppercase tracking-widest">
              Demonstration Playback
            </div>
          </div>

          {/* Map */}
          <div className="flex-1 relative"><MapLibreMap showLayerPanel /></div>

          {/* Timeline */}
          <div className="h-14 border-t border-slate-200 bg-white flex items-center px-4 gap-3 shrink-0">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shrink-0 shadow transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <PlayCircle className="w-5 h-5" />}
            </button>

            <span className="text-[10px] font-mono font-bold text-navy-900 whitespace-nowrap min-w-[160px]">
              {currentTimeStr}
            </span>

            <div className="flex-1 relative">
              <input
                type="range"
                min={timeRange.min}
                max={timeRange.max}
                step={900}
                value={playbackTime ?? timeRange.min}
                onChange={(e) => setPlaybackTime(+e.target.value)}
                className="w-full h-2 bg-slate-200 rounded-full appearance-none accent-blue-600 cursor-pointer"
              />
              <div className="absolute top-3 left-0 right-0 flex justify-between text-[8px] text-slate-400 font-mono px-0.5">
                <span>{new Date(timeRange.min * 1000).toISOString().slice(11, 16)}</span>
                <span>{new Date(timeRange.max * 1000).toISOString().slice(11, 16)}</span>
              </div>
            </div>

            <div className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-[9px] text-slate-500 font-bold uppercase tracking-wider whitespace-nowrap">
              Demo Playback
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-[300px] flex flex-col gap-3 shrink-0 overflow-y-auto">
          {/* Active Detections */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm shrink-0">
            <div className="p-2.5 border-b border-slate-100 bg-slate-50 text-xs font-bold text-navy-900">Active Detections (1)</div>
            <div className="p-2.5">
              <div className="flex items-start gap-2 p-2 bg-red-50/50 rounded border border-red-100">
                <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-navy-900 truncate">{data.case.case_id}</div>
                  <div className="text-[9px] text-slate-500">{data.case.location}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">{data.slick.area} px</div>
                </div>
              </div>
            </div>
          </div>

          {/* Vessels in View */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex-1 flex flex-col min-h-0">
            <div className="p-2.5 border-b border-slate-100 bg-slate-50 text-xs font-bold text-navy-900">
              Vessels in View ({data.vessels.length})
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {data.attribution.results.map((c) => {
                const v = data.vessels.find(x => x.id === c.id);
                const isDark = v?.vessel_type === 'Unknown / Dark Vessel';
                const isSource = c.rank === 1;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedVessel(c.id)}
                    className={`flex items-center gap-2 p-2.5 cursor-pointer hover:bg-slate-50 transition-colors text-[10px] ${selectedVessel === c.id ? 'bg-blue-50/60' : ''}`}
                  >
                    <div className={`w-2.5 h-2.5 rotate-45 border border-white shrink-0 ${isSource ? 'bg-red-500' : isDark ? 'bg-amber-500' : 'bg-slate-400'}`} />
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-navy-900">{c.id.replace('DEMO-', '')}</span>
                      <span className="text-slate-400 ml-1">{v?.vessel_type}</span>
                    </div>
                    <span className="font-black text-navy-900">{(c.attribution_score * 100).toFixed(0)}%</span>
                    {isDark && <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Layer Controls Sidebar */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm shrink-0">
            <div className="p-2.5 border-b border-slate-100 bg-slate-50 text-xs font-bold text-navy-900">Map Layers</div>
            <div className="p-2.5 flex flex-col gap-2 text-[10px]">
              <LayerCheck label="SAR Background" checked={layers.sar} onChange={v => setLayers({ ...layers, sar: v })} />
              {layers.sar && (
                <input type="range" min={0} max={1} step={0.05} value={layers.sarOpacity}
                  onChange={e => setLayers({ ...layers, sarOpacity: +e.target.value })}
                  className="w-full h-1 bg-slate-200 rounded accent-slate-500" />
              )}
              <LayerCheck label="Model Detection" checked={layers.unet} onChange={v => setLayers({ ...layers, unet: v })} />
              {layers.unet && (
                <input type="range" min={0} max={1} step={0.05} value={layers.unetOpacity}
                  onChange={e => setLayers({ ...layers, unetOpacity: +e.target.value })}
                  className="w-full h-1 bg-slate-200 rounded accent-orange-500" />
              )}
              <LayerCheck label="Detected Slick" checked={layers.slick} onChange={v => setLayers({ ...layers, slick: v })} />
              <LayerCheck label="Drift Origin" checked={layers.driftOrigin} onChange={v => setLayers({ ...layers, driftOrigin: v })} />
              <LayerCheck label="Drift Heatmap" checked={layers.driftHeatmap} onChange={v => setLayers({ ...layers, driftHeatmap: v })} />
              <LayerCheck label="Drift Forecast" checked={layers.driftForecast} onChange={v => setLayers({ ...layers, driftForecast: v })} />
              <LayerCheck label="Vessel Tracks" checked={layers.vessels} onChange={v => setLayers({ ...layers, vessels: v })} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, bg, fg }: { icon: React.ReactNode; label: string; value: string; sub: string; bg: string; fg: string }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-2.5 shadow-sm flex items-center gap-2.5">
      <div className={`w-9 h-9 rounded ${bg} ${fg} flex items-center justify-center shrink-0`}>{icon}</div>
      <div>
        <p className="text-[9px] font-bold text-slate-500 uppercase">{label}</p>
        <p className="text-sm font-black text-navy-900 leading-none mt-0.5">{value}</p>
        <p className="text-[8px] text-slate-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

function LayerCheck({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="accent-blue-600 w-3 h-3" />
      <span className="font-medium">{label}</span>
    </label>
  );
}
