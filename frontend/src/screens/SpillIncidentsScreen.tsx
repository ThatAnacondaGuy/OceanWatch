import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Search, Share, ArrowRight, Download, Wind, ChevronRight, Compass, Waves, Eye } from 'lucide-react';
import MapLibreMap from '../components/map/MapLibreMap';
import clsx from 'clsx';

const TABS = ['Overview', 'Satellite Imagery', 'Drift Analysis', 'Vessel Analysis', 'Environmental Impact', 'Timeline'] as const;
type TabId = (typeof TABS)[number];

export default function SpillIncidentsScreen() {
  const { data, selectedVessel, setSelectedVessel, layers, setLayers } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('Overview');
  if (!data) return null;

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="p-5 pb-3 shrink-0 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] text-blue-600 font-bold tracking-widest uppercase mb-1">
            <span>Dashboard</span> <ChevronRight className="w-3 h-3" /> <span>Spill Incidents</span>
          </div>
          <h1 className="text-xl font-black text-navy-900 tracking-tight">Spill Incidents</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.open('/api/demo/ennore', '_blank')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-white bg-navy-900 rounded shadow hover:bg-navy-800">
            <Download className="w-3.5 h-3.5" /> Export Data
          </button>
        </div>
      </div>

      {/* Main: List + Detail */}
      <div className="flex-1 flex px-5 pb-5 gap-5 min-h-0">
        {/* Left: Incident List */}
        <div className="w-[300px] bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col shrink-0">
          <div className="p-2.5 border-b border-slate-100 bg-slate-50 font-bold text-navy-900 text-sm">Incident List</div>
          <div className="p-2.5 border-b border-slate-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input type="text" placeholder="Search by ID…" className="w-full pl-8 pr-3 py-1.5 text-[10px] border border-slate-200 rounded outline-none" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-3 bg-blue-50/50 border-b border-slate-100 cursor-pointer">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-navy-900">{data.case.case_id}</span>
                <span className="text-[9px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded">ACTIVE</span>
              </div>
              <div className="text-[9px] text-slate-500 mt-1">{data.case.location} · {data.slick.area} px</div>
              <div className="text-[9px] text-slate-400 mt-0.5">{data.case.date}</div>
            </div>
            <div className="p-6 text-center text-slate-400 text-[9px] font-bold uppercase tracking-widest border-b border-dashed m-3 rounded">
              End of Results (Demo)
            </div>
          </div>
        </div>

        {/* Right: Incident Detail Panel */}
        <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col min-w-0">
          {/* Detail Header */}
          <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
            <div>
              <h2 className="text-base font-black text-navy-900">{data.case.case_id}</h2>
              <p className="text-[10px] text-slate-500">{data.case.date} · {data.case.source}</p>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-blue-600 bg-blue-50 rounded border border-blue-200">
                <Share className="w-3 h-3" /> Share
              </button>
              <button onClick={() => navigate('/monitoring')} className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-white bg-navy-900 rounded shadow">
                <Eye className="w-3 h-3" /> Open Playback <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 px-1 shrink-0 overflow-x-auto">
            {TABS.map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={clsx("px-3 py-2.5 text-[10px] font-bold whitespace-nowrap border-b-2 transition-colors",
                  activeTab === t ? "text-blue-600 border-blue-600" : "text-slate-500 border-transparent hover:text-navy-900")}>
                {t}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'Overview' && <OverviewTab data={data} selectedVessel={selectedVessel} setSelectedVessel={setSelectedVessel} />}
            {activeTab === 'Satellite Imagery' && <SatelliteTab data={data} />}
            {activeTab === 'Drift Analysis' && <DriftTab data={data} layers={layers} setLayers={setLayers} />}
            {activeTab === 'Vessel Analysis' && <VesselTab data={data} selectedVessel={selectedVessel} setSelectedVessel={setSelectedVessel} />}
            {activeTab === 'Environmental Impact' && <EnvironmentTab data={data} />}
            {activeTab === 'Timeline' && <TimelineTab data={data} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ data, selectedVessel, setSelectedVessel }: any) {
  return (
    <div className="flex gap-4 min-h-[400px]">
      <div className="flex-[1.5] rounded-lg border border-slate-200 overflow-hidden relative">
        <MapLibreMap />
      </div>
      <div className="flex-1 flex flex-col gap-3">
        <div className="text-xs space-y-1.5">
          <h3 className="text-sm font-bold text-navy-900 mb-2 border-b border-slate-100 pb-1">Incident Information</h3>
          <Row label="ID" value={data.case.case_id} />
          <Row label="Date" value={data.case.date} />
          <Row label="Location" value={`${data.slick.centroid.lat.toFixed(3)}°N, ${data.slick.centroid.lon.toFixed(3)}°E · ${data.case.location}`} />
          <Row label="Area" value={`${data.slick.area} px`} />
          <Row label="Detection" value={data.slick.validation_status} />
          <Row label="Likely Source" value={`${data.attribution.results[0].id} (${(data.attribution.results[0].attribution_score * 100).toFixed(1)}%)`} bold />
        </div>

        <div className="mt-2">
          <h3 className="text-sm font-bold text-navy-900 mb-2 border-b border-slate-100 pb-1">Top Suspects</h3>
          <div className="space-y-1.5">
            {data.attribution.results.slice(0, 3).map((r: any, i: number) => {
              const v = data.vessels.find((x: any) => x.id === r.id);
              return (
                <div key={r.id} onClick={() => setSelectedVessel(r.id)}
                  className={clsx("flex items-center gap-2 p-2 rounded cursor-pointer text-xs border transition-colors",
                    selectedVessel === r.id ? "bg-blue-50 border-blue-200" : "border-slate-100 hover:bg-slate-50")}>
                  <span className="font-bold text-slate-400 w-5">{i + 1}</span>
                  <span className="font-bold text-navy-900 flex-1">{r.id.replace('DEMO-', '')}</span>
                  <span className="text-[9px] text-slate-400">{v?.vessel_type}</span>
                  <span className="font-black text-navy-900">{(r.attribution_score * 100).toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function SatelliteTab({ data }: any) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-bold text-navy-900">Sentinel-1 SAR Imagery</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="border border-slate-200 rounded overflow-hidden">
          <div className="text-[10px] font-bold text-center py-1.5 bg-slate-50 border-b border-slate-100">VV Polarization</div>
          <img src={data.sar.preview_asset} alt="SAR VV" className="w-full" />
        </div>
        <div className="border border-slate-200 rounded overflow-hidden opacity-50">
          <div className="text-[10px] font-bold text-center py-1.5 bg-slate-50 border-b border-slate-100">VH Polarization</div>
          <div className="h-64 flex items-center justify-center text-[10px] text-slate-400 bg-slate-50">
            VH scene unavailable in current demo dataset
          </div>
        </div>
      </div>
      <div className="text-[10px] text-slate-500">
        <strong>Source:</strong> {data.sar.source} · <strong>Polarization:</strong> {data.sar.polarization} · <strong>Status:</strong> {data.sar.status}
      </div>
    </div>
  );
}

function DriftTab({ data, layers, setLayers }: any) {
  return (
    <div className="flex gap-4 min-h-[400px]">
      <div className="flex-[1.5] rounded-lg border border-slate-200 overflow-hidden">
        <MapLibreMap showLayerPanel />
      </div>
      <div className="flex-1 flex flex-col gap-3 text-xs">
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
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-bold text-navy-900 border-b border-slate-100 pb-1">Vessel Attribution Analysis</h3>
      <table className="w-full text-left text-xs">
        <thead className="text-[9px] uppercase text-slate-400 border-b border-slate-100">
          <tr><th className="pb-2 w-8">#</th><th className="pb-2">MMSI</th><th className="pb-2">Type</th><th className="pb-2">Evidence</th><th className="pb-2 text-right">Score</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.attribution.results.map((r: any, i: number) => {
            const v = data.vessels.find((x: any) => x.id === r.id);
            return (
              <tr key={r.id} onClick={() => setSelectedVessel(r.id)}
                className={clsx("cursor-pointer hover:bg-slate-50", selectedVessel === r.id && "bg-blue-50/40")}>
                <td className="py-2.5 font-bold text-slate-400">{i + 1}</td>
                <td className="py-2.5 font-bold text-navy-900">{r.id.replace('DEMO-', '')}</td>
                <td className="py-2.5 text-slate-500">{v?.vessel_type}</td>
                <td className="py-2.5">
                  <span className={clsx("px-1.5 py-0.5 rounded text-[9px] font-bold",
                    r.evidence_strength === 'HIGH' ? "bg-red-100 text-red-700" :
                      r.evidence_strength === 'MEDIUM' ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                  )}>{r.evidence_strength}</span>
                </td>
                <td className="py-2.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="font-black">{(r.attribution_score * 100).toFixed(1)}%</span>
                    <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
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
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-bold text-navy-900 border-b border-slate-100 pb-1">Environmental Conditions</h3>
      <div className="grid grid-cols-2 gap-4">
        <EnvCard icon={<Wind className="w-8 h-8 text-blue-400" />} label="Wind Speed" value={`${data.environment.wind_speed.toFixed(1)} m/s`} />
        <EnvCard icon={<Compass className="w-8 h-8 text-blue-400" />} label="Wind Direction" value={`${data.environment.wind_direction.toFixed(0)}°`} />
        <EnvCard icon={<Waves className="w-8 h-8 text-emerald-400" />} label="Current Speed" value={`${data.environment.current_speed.toFixed(2)} m/s`} />
        <EnvCard icon={<Compass className="w-8 h-8 text-emerald-400" />} label="Current Direction" value={`${data.environment.current_direction.toFixed(0)}°`} />
      </div>
      <div className="text-[10px] text-slate-500">
        <strong>Source:</strong> {data.environment.source} · <strong>Status:</strong> {data.environment.synthetic_real_status.replace('_', ' ').toUpperCase()}
      </div>
      <div className="p-3 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-800">
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
    <div className="flex flex-col gap-1">
      <h3 className="text-sm font-bold text-navy-900 border-b border-slate-100 pb-1 mb-2">Investigation Timeline — {data.case.date}</h3>
      {events.map((e, i) => (
        <div key={i} className="flex items-start gap-3 py-2 border-b border-slate-50">
          <div className="text-[10px] font-mono text-slate-400 w-20 shrink-0 text-right pt-0.5">{e.time}</div>
          <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
          <div className="text-xs text-navy-900 font-medium">{e.label}</div>
        </div>
      ))}
      <div className="mt-3 text-[9px] text-slate-400 italic">All times reference the synthetic demo scenario. Not actual historical event times.</div>
    </div>
  );
}

function EnvCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded border border-slate-100">
      {icon}
      <div><p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">{label}</p><p className="text-lg font-black text-navy-900">{value}</p></div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between"><span className="text-slate-500">{label}</span><span className={clsx("text-navy-900 text-right", bold ? "font-black" : "font-medium")}>{value}</span></div>
  );
}
