import { useApp } from '../context/AppContext';
import { CheckCircle, Wind, Compass, Waves, CheckCircle2, BarChart, FileSearch, PieChart, Users } from 'lucide-react';
import clsx from 'clsx';

const FACTORS = ['spatial', 'temporal', 'heading', 'gap', 'type', 'anomaly', 'dark'] as const;

export default function AnalyticsScreen() {
  const { data, selectedVessel, setSelectedVessel } = useApp();
  if (!data) return null;

  const selectedResult = data.attribution.results.find(r => r.id === selectedVessel);

  return (
    <div className="flex flex-col h-full p-4 gap-4 overflow-y-auto">
       {/* Top Metrics Row */}
       <div className="flex gap-4 shrink-0 overflow-x-auto pb-1">
          <StatCard icon={<BarChart className="w-5 h-5" />} label="Reports Generated" value="1,248" trend="+15" trendColor="text-emerald-500" bg="bg-blue-50" fg="text-blue-500" />
          <StatCard icon={<FileSearch className="w-5 h-5" />} label="Avg Confidence" value="84.2%" trend="+2.1%" trendColor="text-emerald-500" bg="bg-indigo-50" fg="text-indigo-500" />
          <StatCard icon={<PieChart className="w-5 h-5" />} label="False Positives" value="3.1%" trend="-0.4%" trendColor="text-emerald-500" bg="bg-amber-50" fg="text-amber-500" />
          <StatCard icon={<Users className="w-5 h-5" />} label="Active Agencies" value="12" subtext="Global" bg="bg-emerald-50" fg="text-emerald-500" />
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

      <div className="grid grid-cols-[1.5fr,2fr] gap-5 min-h-[400px]">
        {/* Column 1 */}
        <div className="flex flex-col gap-5">
          {/* Detection Summary */}
          <div className="bg-white rounded border border-slate-200 shadow-sm">
            <div className="p-3 border-b border-slate-100 bg-slate-50"><h3 className="font-bold text-navy-900 text-sm">Detection Summary</h3></div>
            <div className="p-4 grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
              <div><p className="text-slate-500 text-[9px] uppercase font-bold tracking-widest">Slick Detected</p><p className="font-bold text-navy-900 text-sm">{data.case.case_id}</p></div>
              <div><p className="text-slate-500 text-[9px] uppercase font-bold tracking-widest">Date / Time</p><p className="font-bold text-navy-900 text-sm">{data.case.date}</p></div>
              <div><p className="text-slate-500 text-[9px] uppercase font-bold tracking-widest">Slick Area</p><p className="font-bold text-navy-900 text-sm">{data.slick.area} px</p></div>
              <div><p className="text-slate-500 text-[9px] uppercase font-bold tracking-widest">Validation</p><span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold border border-emerald-200 text-[10px]"><CheckCircle className="w-3 h-3" /> Confirmed</span></div>
              <div><p className="text-slate-500 text-[9px] uppercase font-bold tracking-widest">Location</p><p className="font-medium text-navy-900">{data.case.location}</p></div>
              <div><p className="text-slate-500 text-[9px] uppercase font-bold tracking-widest">Wind Gate</p><span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold border border-emerald-200 text-[10px]">PASS ({data.environment.wind_speed.toFixed(1)} m/s)</span></div>
            </div>
          </div>

          {/* Environment */}
          <div className="bg-white rounded border border-slate-200 shadow-sm">
            <div className="p-3 border-b border-slate-100 bg-slate-50"><h3 className="font-bold text-navy-900 text-sm">Environmental Context</h3></div>
            <div className="p-4 grid grid-cols-2 gap-4">
              <EnvItem icon={<Wind className="w-6 h-6 text-blue-400" />} label="Wind Speed" value={`${data.environment.wind_speed.toFixed(1)} m/s`} />
              <EnvItem icon={<Compass className="w-6 h-6 text-blue-400" />} label="Wind Dir" value={`${data.environment.wind_direction.toFixed(0)}°`} />
              <EnvItem icon={<Waves className="w-6 h-6 text-emerald-400" />} label="Current" value={`${data.environment.current_speed.toFixed(2)} m/s`} />
              <EnvItem icon={<Compass className="w-6 h-6 text-emerald-400" />} label="Current Dir" value={`${data.environment.current_direction.toFixed(0)}°`} />
            </div>
          </div>

          {/* Drift + Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded border border-slate-200 shadow-sm p-3">
              <h3 className="font-bold text-navy-900 text-sm mb-2 border-b border-slate-100 pb-1.5">Drift Analysis</h3>
              <div className="flex flex-col gap-1.5 text-xs">
                <Kv k="Origin" v={`${data.drift.origin.lat.toFixed(3)}, ${data.drift.origin.lon.toFixed(3)}`} />
                <Kv k="Window" v={data.drift.time_window} />
                <Kv k="Uncertainty" v="Moderate" />
              </div>
            </div>
            <div className="bg-white rounded border border-slate-200 shadow-sm p-3">
              <h3 className="font-bold text-navy-900 text-sm mb-2 border-b border-slate-100 pb-1.5">Summary</h3>
              <div className="flex flex-col gap-1.5 text-xs">
                <Kv k="Source" v={data.attribution.results[0].id.replace('DEMO-', '')} highlight />
                <Kv k="Dark Vessels" v={String(data.vessels.filter(v => v.vessel_type === 'Unknown / Dark Vessel').length)} />
                <Kv k="Mode" v="Synthetic Demo" />
              </div>
            </div>
          </div>
        </div>

        {/* Column 2 */}
        <div className="flex flex-col gap-5">
          {/* Candidate Ranking */}
          <div className="bg-white rounded border border-slate-200 shadow-sm">
            <div className="p-3 border-b border-slate-100 bg-slate-50"><h3 className="font-bold text-navy-900 text-sm">Candidate Attribution Ranking</h3></div>
            <div className="p-3">
              <table className="w-full text-left text-xs">
                <thead className="text-[9px] uppercase text-slate-400 border-b border-slate-100">
                  <tr><th className="pb-2 w-8">Rank</th><th className="pb-2">Vessel</th><th className="pb-2">Evidence</th><th className="pb-2 text-right">Score</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.attribution.results.map((r, i) => (
                    <tr key={r.id} onClick={() => setSelectedVessel(r.id)}
                      className={clsx("cursor-pointer hover:bg-slate-50 transition-colors", selectedVessel === r.id && "bg-blue-50/50")}>
                      <td className="py-2 font-bold text-slate-400">{i + 1}</td>
                      <td className="py-2 font-bold text-navy-900 flex items-center gap-1.5">
                        {r.id.replace('DEMO-', '')}
                        {i === 0 && <span className="bg-red-100 text-red-700 text-[8px] px-1 py-0.5 rounded uppercase">Source</span>}
                      </td>
                      <td className="py-2">
                        <span className={clsx("px-1.5 py-0.5 rounded text-[9px] font-bold",
                          r.evidence_strength === 'HIGH' ? "bg-red-50 text-red-700" :
                            r.evidence_strength === 'MEDIUM' ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-600"
                        )}>{r.evidence_strength}</span>
                      </td>
                      <td className="py-2">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-black text-navy-900">{(r.attribution_score * 100).toFixed(1)}%</span>
                          <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={clsx("h-full", i === 0 ? "bg-red-500" : "bg-slate-400")} style={{ width: `${r.attribution_score * 100}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Factor Comparison Chart */}
          <div className="bg-white rounded border border-slate-200 shadow-sm flex-1">
            <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-navy-900 text-sm">7-Factor Forensic Evidence Comparison</h3>
              {selectedResult && (
                <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Selected: {selectedResult.id.replace('DEMO-', '')}
                </span>
              )}
            </div>
            <div className="p-4">
              {/* Bar chart */}
              <div className="space-y-3">
                {FACTORS.map(f => (
                  <div key={f}>
                    <div className="flex justify-between text-[9px] font-bold uppercase text-slate-400 mb-1">
                      <span>{f}</span>
                    </div>
                    <div className="flex gap-1 items-center">
                      {data.attribution.results.map((r, i) => {
                        const val = r.factor_breakdown[f];
                        const isSelected = r.id === selectedVessel;
                        const isSource = i === 0;
                        return (
                          <div key={r.id} className="flex-1 group" onClick={() => setSelectedVessel(r.id)} style={{ cursor: 'pointer' }}>
                            <div className="relative h-5 bg-slate-100 rounded-sm overflow-hidden">
                              <div
                                className={clsx("h-full transition-all",
                                  isSelected ? "bg-blue-500" : isSource ? "bg-red-400" : "bg-slate-300")}
                                style={{ width: `${val * 100}%` }}
                              />
                              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-slate-700">
                                {(val * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div className={clsx("text-[7px] text-center mt-0.5 font-bold truncate",
                              isSelected ? "text-blue-600" : "text-slate-400")}>
                              {r.id.replace('DEMO-', '').replace('MMSI-', '').replace('RADAR-', 'R')}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-3 bg-slate-50 text-[9px] text-slate-500 border-t border-slate-100 rounded-b italic">
              Factor scores represent relative correlation confidence from the deterministic AI attribution pipeline. Click any bar to select that candidate.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EnvItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <div>
        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-base font-black text-navy-900">{value}</p>
      </div>
    </div>
  );
}

function Kv({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{k}</span>
      <span className={clsx("font-bold", highlight ? "text-red-600" : "text-navy-900")}>{v}</span>
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
