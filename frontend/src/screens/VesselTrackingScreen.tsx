import { useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Ship, AlertTriangle, PlayCircle, Pause } from 'lucide-react';
import MapLibreMap from '../components/map/MapLibreMap';
import clsx from 'clsx';

const FACTORS = ['spatial', 'temporal', 'heading', 'gap', 'type', 'anomaly', 'dark'] as const;

export default function VesselTrackingScreen() {
  const {
    data,
    selectedVessel, setSelectedVessel,
    playbackTime, setPlaybackTime,
    isPlaying, setIsPlaying,
    playbackData
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

  const currentTimeStr = playbackTime
    ? new Date(playbackTime * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
    : data.case.date + ' 04:00 UTC';

  const selectedResult = data.attribution.results.find(r => r.id === selectedVessel) || data.attribution.results[0];
  const vesselMeta = data.vessels.find(v => v.id === selectedResult.id);
  const isSource = selectedResult.id === data.attribution.results[0].id;
  const isDark = vesselMeta?.vessel_type === 'Unknown / Dark Vessel';

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-white shrink-0 flex justify-between items-center shadow-sm z-10">
        <div>
          <h1 className="text-xl font-black text-navy-900 tracking-tight">Vessel Tracking &amp; Intelligence</h1>
          <p className="text-xs text-slate-500 mt-0.5">Forensic trajectory analysis and evidence scoring.</p>
        </div>
        <div className="flex gap-4 text-xs font-bold">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-red-500 rounded-sm" /> SOURCE</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-amber-500 rounded-sm" /> DARK VESSEL</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-100 border border-blue-500 rounded-sm" /> CANDIDATE</div>
        </div>
      </div>

      {/* Main Area: 3 Columns */}
      <div className="flex-1 flex min-h-0">
        
        {/* LEFT: Candidate List */}
        <div className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-100 bg-slate-50 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-5 top-5" />
            <input type="text" placeholder="Search candidates..." className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded outline-none" />
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {data.attribution.results.map((r, i) => {
              const v = data.vessels.find(x => x.id === r.id);
              const active = selectedVessel === r.id;
              const source = i === 0;
              const dark = v?.vessel_type === 'Unknown / Dark Vessel';
              
              return (
                <div key={r.id} onClick={() => setSelectedVessel(r.id)}
                  className={clsx("p-3 cursor-pointer hover:bg-slate-50 transition-colors flex items-center gap-3", active && "bg-blue-50/50")}>
                  <div className={clsx("w-6 h-6 rounded flex items-center justify-center shrink-0 font-black text-[10px] text-white", 
                    source ? "bg-red-500" : dark ? "bg-amber-500" : "bg-slate-400")}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-navy-900 text-xs truncate">{r.id.replace('DEMO-', '')}</span>
                      <span className="font-black text-navy-900 text-xs">{(r.attribution_score * 100).toFixed(0)}%</span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">{v?.vessel_type}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CENTER: Map */}
        <div className="flex-1 relative bg-slate-900 flex flex-col">
          <MapLibreMap />
        </div>

        {/* RIGHT: Vessel Intelligence */}
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-y-auto">
          {/* Identity Header */}
          <div className={clsx("p-5 border-b flex flex-col gap-2", 
            isSource ? "bg-red-50 border-red-100" : isDark ? "bg-amber-50 border-amber-100" : "bg-slate-50 border-slate-200")}>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-black text-navy-900">{selectedResult.id.replace('DEMO-', '')}</h2>
                <p className="text-xs text-slate-500 font-bold">{vesselMeta?.vessel_type}</p>
              </div>
              <Ship className={clsx("w-6 h-6", isSource ? "text-red-500" : isDark ? "text-amber-500" : "text-slate-400")} />
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-white p-2 rounded border border-slate-200 shadow-sm">
                <div className="text-[9px] font-bold text-slate-400 uppercase">Attribution</div>
                <div className="text-lg font-black text-navy-900">{(selectedResult.attribution_score * 100).toFixed(1)}%</div>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200 shadow-sm">
                <div className="text-[9px] font-bold text-slate-400 uppercase">Evidence</div>
                <div className={clsx("text-sm font-black mt-1", 
                  selectedResult.evidence_strength === 'HIGH' ? "text-red-600" : "text-amber-600")}>
                  {selectedResult.evidence_strength}
                </div>
              </div>
            </div>

            {isSource && (
              <div className="mt-2 text-[10px] font-bold bg-red-100 text-red-800 p-2 rounded border border-red-200 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" /> IDENTIFIED AS PRIMARY SOURCE
              </div>
            )}
            {isDark && (
              <div className="mt-2 text-[10px] font-bold bg-amber-100 text-amber-800 p-2 rounded border border-amber-200 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" /> NON-TRANSMITTING VESSEL (RADAR ONLY)
              </div>
            )}
          </div>

          {/* 7-Factor Evidence */}
          <div className="p-5">
            <h3 className="text-xs font-bold text-navy-900 mb-4 uppercase tracking-widest border-b border-slate-100 pb-2">Forensic Factors</h3>
            <div className="space-y-4">
              {FACTORS.map(f => {
                const val = selectedResult.factor_breakdown[f];
                let colorClass = "bg-blue-500";
                if (val > 0.8) colorClass = "bg-red-500";
                else if (val > 0.4) colorClass = "bg-amber-500";
                else colorClass = "bg-slate-300";

                return (
                  <div key={f}>
                    <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500 mb-1">
                      <span>{f} Match</span>
                      <span className="text-navy-900">{(val * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={clsx("h-full", colorClass)} style={{ width: `${val * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 p-3 bg-slate-50 border border-slate-100 rounded text-[10px] text-slate-500">
              Factor breakdown derived deterministically from spatial intersection, temporal proximity, and anomaly detection models.
            </div>
          </div>
        </div>

      </div>

      {/* BOTTOM: Timeline Playback */}
      <div className="h-16 border-t border-slate-200 bg-white flex items-center px-6 gap-5 shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-10 h-10 rounded-full bg-navy-900 hover:bg-navy-800 text-white flex items-center justify-center shrink-0 shadow transition-colors"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <PlayCircle className="w-5 h-5 ml-0.5" />}
        </button>

        <div className="flex flex-col">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Demonstration Playback</span>
          <span className="text-xs font-mono font-black text-navy-900 whitespace-nowrap min-w-[170px]">
            {currentTimeStr}
          </span>
        </div>

        <div className="flex-1 relative flex items-center h-full group">
          <input
            type="range"
            min={timeRange.min}
            max={timeRange.max}
            step={900}
            value={playbackTime ?? timeRange.min}
            onChange={(e) => setPlaybackTime(+e.target.value)}
            className="w-full h-2 bg-slate-200 rounded-full appearance-none accent-blue-600 cursor-pointer group-hover:h-3 transition-all"
          />
          <div className="absolute -bottom-1 left-0 right-0 flex justify-between text-[9px] text-slate-400 font-mono font-bold pointer-events-none">
            <span>{new Date(timeRange.min * 1000).toISOString().slice(11, 16)}</span>
            <span>{new Date(timeRange.max * 1000).toISOString().slice(11, 16)}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
