import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Share, Download, Wind, Compass, Waves, Eye, Droplet, Activity, Clock, CheckCircle2, AlertTriangle, FileText, Navigation, Search as SearchIcon, Filter } from 'lucide-react';
import MapLibreMap from '../components/map/MapLibreMap';
import clsx from 'clsx';

const TABS = ['Overview', 'Satellite Imagery', 'Drift Analysis', 'Vessel Analysis', 'Environmental Impact', 'Timeline'] as const;
type TabId = (typeof TABS)[number];

export default function SpillIncidentsScreen() {
  const { data, selectedVessel, setSelectedVessel, layers, setLayers } = useApp();
  const [activeTab, setActiveTab] = useState<TabId>('Overview');
  if (!data) return null;

  return (
    <div className="flex flex-col h-full p-4 gap-4 overflow-y-auto">
      {/* Top Metrics Row */}
      <div className="flex gap-4 shrink-0 overflow-x-auto pb-1">
        <StatCard icon={<Droplet className="w-5 h-5" />} label="Active Incidents" value="12" trend="+2" trendColor="text-red-500" subtext="Needs review" bg="bg-red-50" fg="text-red-500" badge="Active" badgeColor="red" />
        <StatCard icon={<Activity className="w-5 h-5" />} label="Total Incidents" value="1,248" trend="+12%" trendColor="text-emerald-500" subtext="All time" bg="bg-blue-50" fg="text-blue-500" />
        <StatCard icon={<Clock className="w-5 h-5" />} label="Avg Investigation Time" value="4.2d" trend="-1d" trendColor="text-emerald-500" subtext="Last 30 days" bg="bg-amber-50" fg="text-amber-500" />
        <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Resolved Incidents" value="1,034" trend="82%" trendColor="text-navy-900" subtext="Resolution rate" bg="bg-emerald-50" fg="text-emerald-500" />
        <StatCard icon={<AlertTriangle className="w-5 h-5" />} label="Potential Coastal Impact" value="3" subtext="High Risk" bg="bg-orange-50" fg="text-orange-500" badge="High" badgeColor="amber" />
        
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
        {/* Left: Incident List */}
        <div className="w-[320px] bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-lg">
            <h2 className="font-bold text-navy-900 text-sm">Incident List</h2>
            <button className="text-[10px] font-bold text-blue-600 flex items-center gap-1"><Filter className="w-3 h-3"/> Filter</button>
          </div>
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <SearchIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input type="text" placeholder="Search by ID or Location..." className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded outline-none focus:border-blue-400 text-navy-900" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {/* Table Header inside list */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 text-[9px] font-bold text-slate-400 uppercase tracking-wider bg-white sticky top-0">
               <span className="w-20">ID / Date</span>
               <span className="flex-1 text-center">Status</span>
               <span className="w-10 text-right">Risk</span>
            </div>
            {/* Demo Item */}
            <div className="p-3 bg-blue-50/40 border-b border-slate-100 cursor-pointer transition-colors relative">
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-600" />
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-bold text-navy-900">{data.case.case_id}</span>
                <span className="text-[9px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded">ACTIVE</span>
              </div>
              <div className="text-[10px] text-slate-500">{data.case.date.split(' ')[0]}</div>
              <div className="flex items-center justify-between mt-2">
                 <span className="text-[9px] text-slate-500 font-medium">{data.case.location}</span>
                 <span className="text-[9px] text-orange-600 font-bold flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5" /> High</span>
              </div>
            </div>
            
            {/* Fake items for list padding */}
            <IncidentRow id="OS-2025-090" date="08 Sep 2025" loc="Gulf of Mannar" status="Reviewing" statusColor="bg-amber-100 text-amber-700" risk="Medium" riskColor="text-amber-600" />
            <IncidentRow id="OS-2025-089" date="07 Sep 2025" loc="Chennai Coast" status="Resolved" statusColor="bg-emerald-100 text-emerald-700" risk="Low" riskColor="text-emerald-600" />
            <IncidentRow id="OS-2025-088" date="06 Sep 2025" loc="Palk Strait" status="Resolved" statusColor="bg-emerald-100 text-emerald-700" risk="Low" riskColor="text-emerald-600" />
          </div>
        </div>

        {/* Right: Incident Detail Panel */}
        <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col min-w-0">
          
          <div className="flex items-center justify-between px-2 pt-2 border-b border-slate-100 bg-white z-10 shrink-0 rounded-t-lg">
             <div className="flex gap-1 overflow-x-auto hide-scrollbar">
                {TABS.map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2.5 text-xs font-bold transition-colors border-b-2 whitespace-nowrap ${activeTab === tab ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-navy-900 hover:bg-slate-50 rounded-t'}`}>
                    {tab}
                  </button>
                ))}
             </div>
             <div className="flex items-center gap-2 pb-1 pr-2">
                <button onClick={() => window.open('/api/demo/ennore', '_blank')} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50">
                  <Download className="w-3.5 h-3.5" /> Export Data
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-white bg-navy-900 rounded shadow hover:bg-navy-800">
                  <Share className="w-3 h-3" /> Share Incident
                </button>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
             {activeTab === 'Overview' && <OverviewTab data={data} />}
             {activeTab === 'Drift Analysis' && <DriftTab data={data} layers={layers} setLayers={setLayers} />}
             {activeTab === 'Vessel Analysis' && <VesselTab data={data} selectedVessel={selectedVessel} setSelectedVessel={setSelectedVessel} />}
             {activeTab === 'Environmental Impact' && <EnvironmentTab data={data} />}
             {activeTab === 'Timeline' && <TimelineTab data={data} />}
             {activeTab === 'Satellite Imagery' && <div className="flex items-center justify-center h-full text-slate-400 font-bold italic">See Satellite Data page.</div>}
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

function IncidentRow({ id, date, loc, status, statusColor, risk, riskColor }: any) {
   return (
      <div className="p-3 bg-white border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
         <div className="flex justify-between items-start mb-1">
            <span className="text-xs font-bold text-navy-900">{id}</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${statusColor}`}>{status.toUpperCase()}</span>
         </div>
         <div className="text-[10px] text-slate-500">{date}</div>
         <div className="flex items-center justify-between mt-2">
            <span className="text-[9px] text-slate-500 font-medium">{loc}</span>
            <span className={`text-[9px] font-bold flex items-center gap-1 ${riskColor}`}>{risk === 'High' && <AlertTriangle className="w-2.5 h-2.5"/>} {risk}</span>
         </div>
      </div>
   );
}

function OverviewTab({ data }: any) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col h-full gap-4">
       {/* Incident Info Header inside Overview */}
       <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between shrink-0">
          <div>
             <div className="flex items-center gap-3 mb-1">
                <h2 className="text-lg font-black text-navy-900">{data.case.case_id}</h2>
                <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded uppercase">Active Incident</span>
             </div>
             <p className="text-xs text-slate-500 flex items-center gap-2">
                <span><Clock className="w-3 h-3 inline mr-1" /> {data.case.date}</span>
                <span>•</span>
                <span><Navigation className="w-3 h-3 inline mr-1" /> {data.case.location}</span>
             </p>
          </div>
          <div className="flex gap-4">
             <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Estimated Area</span>
                <span className="text-sm font-black text-navy-900">{data.slick.area} px</span>
             </div>
             <div className="w-px h-8 bg-slate-200" />
             <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Likely Source</span>
                <span className="text-sm font-black text-red-600">Vessel (Conf: {(data.attribution.results[0].attribution_score * 100).toFixed(0)}%)</span>
             </div>
          </div>
       </div>

       {/* Map and Actions */}
       <div className="flex gap-4 flex-1 min-h-[400px]">
          <div className="flex-[2] bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden relative">
             <MapLibreMap showLayerPanel={false} />
             <div className="absolute top-2 right-2 flex gap-1">
                <button className="px-3 py-1 text-[10px] font-bold bg-white text-navy-900 rounded border border-slate-200 shadow-sm">Map View</button>
                <button className="px-3 py-1 text-[10px] font-bold bg-slate-100 text-slate-500 rounded border border-slate-200 shadow-sm hover:bg-white hover:text-navy-900">Satellite</button>
             </div>
          </div>
          
          <div className="w-[300px] flex flex-col gap-4 shrink-0">
             <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
                <h3 className="font-bold text-navy-900 text-sm mb-3">Quick Actions</h3>
                <div className="flex flex-col gap-2">
                   <button onClick={() => navigate('/monitoring')} className="w-full py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-xs font-bold rounded border border-blue-200 flex items-center justify-center gap-1.5"><Eye className="w-3.5 h-3.5" /> View in Live Monitoring</button>
                   <button onClick={() => navigate('/vessels')} className="w-full py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors text-xs font-bold rounded border border-emerald-200 flex items-center justify-center gap-1.5"><Navigation className="w-3.5 h-3.5" /> Analyze Suspect Vessels</button>
                   <button className="w-full py-2 bg-purple-50 text-purple-700 opacity-50 cursor-not-allowed text-xs font-bold rounded border border-purple-200 flex items-center justify-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Generate Official Report</button>
                </div>
             </div>

             <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex-1 flex flex-col min-h-0">
                <div className="p-3 border-b border-slate-100">
                   <h3 className="font-bold text-navy-900 text-sm">Top Suspect Vessels</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                   {data.attribution.results.slice(0,3).map((r: any, i: number) => (
                      <div key={r.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded mb-1">
                         <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 w-3">{i+1}</span>
                            <div className="flex flex-col">
                               <span className="text-xs font-bold text-navy-900">{r.id.replace('DEMO-', '')}</span>
                               <span className={`text-[9px] font-bold ${r.evidence_strength === 'HIGH' ? 'text-red-500' : 'text-amber-500'}`}>{r.evidence_strength} MATCH</span>
                            </div>
                         </div>
                         <span className="text-xs font-black text-navy-900">{(r.attribution_score * 100).toFixed(0)}%</span>
                      </div>
                   ))}
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}

function DriftTab({ data, layers, setLayers }: any) {
  return (
    <div className="flex gap-4 h-full">
      <div className="flex-[1.5] rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <MapLibreMap showLayerPanel />
      </div>
      <div className="flex-1 flex flex-col gap-3 text-xs bg-white p-4 rounded-lg border border-slate-200 shadow-sm overflow-y-auto">
        <h3 className="text-sm font-bold text-navy-900 border-b border-slate-100 pb-1">Backward Drift Analysis</h3>
        <Row label="Origin" value={`${data.drift.origin.lat.toFixed(4)}°N, ${data.drift.origin.lon.toFixed(4)}°E`} />
        <Row label="Time Window" value={data.drift.time_window} />
        <Row label="Uncertainty" value={data.drift.uncertainty_envelope} />
        <Row label="Particles" value={data.drift.particle_metadata} />
        <Row label="Source" value={data.drift.source} />

        <h3 className="text-sm font-bold text-navy-900 border-b border-slate-100 pb-1 mt-3">Layer Controls</h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={layers.driftHeatmap} onChange={(e) => setLayers({ ...layers, driftHeatmap: e.target.checked })} className="accent-blue-600 w-3.5 h-3.5" />
          <span className="font-medium">Backward Heatmap</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={layers.driftOrigin} onChange={(e) => setLayers({ ...layers, driftOrigin: e.target.checked })} className="accent-blue-600 w-3.5 h-3.5" />
          <span className="font-medium">Drift Origin Envelope</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={layers.driftForecast} onChange={(e) => setLayers({ ...layers, driftForecast: e.target.checked })} className="accent-blue-600 w-3.5 h-3.5" />
          <span className="font-medium">Forward Forecast</span>
        </label>

        <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded text-[9px] text-amber-800 font-bold">
          ⚠ DEMONSTRATION FORECAST: Model projection from synthetic scenario. Not a historical observation.
        </div>
      </div>
    </div>
  );
}

function VesselTab({ data, selectedVessel, setSelectedVessel }: any) {
  return (
    <div className="flex flex-col gap-3 bg-white p-4 rounded-lg border border-slate-200 shadow-sm h-full">
      <h3 className="text-sm font-bold text-navy-900 border-b border-slate-100 pb-2">Vessel Attribution Analysis</h3>
      <table className="w-full text-left text-xs">
        <thead className="text-[10px] uppercase text-slate-400 border-b border-slate-100">
          <tr><th className="pb-2 w-8">#</th><th className="pb-2">MMSI</th><th className="pb-2">Type</th><th className="pb-2">Evidence</th><th className="pb-2 text-right">Score</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.attribution.results.map((r: any, i: number) => {
            const v = data.vessels.find((x: any) => x.id === r.id);
            return (
              <tr key={r.id} onClick={() => setSelectedVessel(r.id)}
                className={clsx("cursor-pointer hover:bg-slate-50 transition-colors", selectedVessel === r.id && "bg-blue-50/40")}>
                <td className="py-3 font-bold text-slate-400">{i + 1}</td>
                <td className="py-3 font-bold text-navy-900">{r.id.replace('DEMO-', '')}</td>
                <td className="py-3 text-slate-500">{v?.vessel_type}</td>
                <td className="py-3">
                  <span className={clsx("px-2 py-1 rounded text-[10px] font-bold",
                    r.evidence_strength === 'HIGH' ? "bg-red-100 text-red-700" :
                      r.evidence_strength === 'MEDIUM' ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                  )}>{r.evidence_strength}</span>
                </td>
                <td className="py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <span className="font-black text-navy-900">{(r.attribution_score * 100).toFixed(1)}%</span>
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={clsx("h-full", i === 0 ? "bg-red-500" : "bg-slate-400")} style={{ width: `${r.attribution_score * 100}%` }} />
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EnvironmentTab({ data }: any) {
  return (
    <div className="flex flex-col gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm h-full">
      <h3 className="text-sm font-bold text-navy-900 border-b border-slate-100 pb-2">Environmental Conditions</h3>
      <div className="grid grid-cols-2 gap-4">
        <EnvCard icon={<Wind className="w-8 h-8 text-blue-400" />} label="Wind Speed" value={`${data.environment.wind_speed.toFixed(1)} m/s`} />
        <EnvCard icon={<Compass className="w-8 h-8 text-blue-400" />} label="Wind Direction" value={`${data.environment.wind_direction.toFixed(0)}°`} />
        <EnvCard icon={<Waves className="w-8 h-8 text-emerald-400" />} label="Current Speed" value={`${data.environment.current_speed.toFixed(2)} m/s`} />
        <EnvCard icon={<Compass className="w-8 h-8 text-emerald-400" />} label="Current Direction" value={`${data.environment.current_direction.toFixed(0)}°`} />
      </div>
      <div className="text-xs text-slate-500 mt-4">
        <strong>Source:</strong> {data.environment.source} · <strong>Status:</strong> {data.environment.synthetic_real_status.replace('_', ' ').toUpperCase()}
      </div>
      <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 mt-2">
        <strong>Known Limitations:</strong> Wind and current fields are procedurally generated synthetic approximations. Real ERA5/CMEMS data was not available for this demonstration. Results should not be interpreted as historical environmental conditions.
      </div>
    </div>
  );
}

function TimelineTab({ data }: any) {
  const events = [
    { time: '00:00 UTC', label: 'Synthetic AIS tracking begins', type: 'ais' },
    { time: '04:00 UTC', label: 'SAR acquisition (simulated Sentinel-1 overpass)', type: 'sar' },
    { time: '04:00 UTC', label: 'Oil slick detected by Attention U-Net', type: 'detection' },
    { time: '04:00 UTC', label: 'Physical validation passed (GLCM, morphology, wind gate)', type: 'validation' },
    { time: '04:00-12:00', label: `Backward drift analysis (${data.drift.time_window})`, type: 'drift' },
    { time: '04:00 UTC', label: '7-factor attribution scoring completed', type: 'attribution' },
    { time: '04:00 UTC', label: `Source identified: ${data.attribution.results[0].id} (${(data.attribution.results[0].attribution_score * 100).toFixed(1)}%)`, type: 'result' },
  ];

  return (
    <div className="flex flex-col gap-1 bg-white p-4 rounded-lg border border-slate-200 shadow-sm h-full">
      <h3 className="text-sm font-bold text-navy-900 border-b border-slate-100 pb-2 mb-4">Investigation Timeline — {data.case.date}</h3>
      {events.map((e, i) => (
        <div key={i} className="flex items-start gap-4 py-3 border-b border-slate-50">
          <div className="text-xs font-mono text-slate-400 w-24 shrink-0 text-right pt-0.5">{e.time}</div>
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1 shrink-0" />
          <div className="text-sm text-navy-900 font-medium">{e.label}</div>
        </div>
      ))}
      <div className="mt-4 text-xs text-slate-400 italic">All times reference the synthetic demo scenario. Not actual historical event times.</div>
    </div>
  );
}

function EnvCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
      {icon}
      <div><p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{label}</p><p className="text-xl font-black text-navy-900">{value}</p></div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-start mb-1 gap-2"><span className="text-slate-500 shrink-0">{label}</span><span className={clsx("text-navy-900 text-right", bold ? "font-black" : "font-medium")}>{value}</span></div>
  );
}
