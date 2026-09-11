import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Droplet, Navigation, Clock, Wind, Compass, FileText, Search, ChevronRight, Layers, Satellite, History } from 'lucide-react';
import MapLibreMap from '../components/map/MapLibreMap';

type TabId = 'map' | 'satellite' | 'analysis' | 'history';

export default function DashboardScreen() {
  const navigate = useNavigate();
  const { data } = useApp();
  const [activeTab, setActiveTab] = useState<TabId>('map');
  if (!data) return null;

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'map', label: 'Investigation Map', icon: <Navigation className="w-3 h-3" /> },
    { id: 'satellite', label: 'Satellite View', icon: <Satellite className="w-3 h-3" /> },
    { id: 'analysis', label: 'Analysis Layers', icon: <Layers className="w-3 h-3" /> },
    { id: 'history', label: 'Historical Data', icon: <History className="w-3 h-3" /> },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-auto p-5 gap-5">
      {/* Top Stats */}
      <div className="grid grid-cols-4 gap-4 shrink-0">
        <StatCard icon={<Droplet className="w-5 h-5 fill-current" />} label="Active Spills" value="1" badge="Demo" badgeColor="red" bg="bg-red-50" fg="text-red-500" />
        <StatCard icon={<Navigation className="w-5 h-5 fill-current" />} label="Vessels Analyzed" value={String(data.vessels.length)} badge="Local Scene" badgeColor="emerald" bg="bg-blue-50" fg="text-blue-600" />
        <StatCard icon={<Wind className="w-5 h-5" />} label="Wind Speed" value={`${data.environment.wind_speed.toFixed(1)} m/s`} badge="Synthetic" badgeColor="slate" bg="bg-sky-50" fg="text-sky-500" />
        <StatCard icon={<Clock className="w-5 h-5" />} label="Avg. Processing" value="N/A" badge="Demo Mode" badgeColor="slate" bg="bg-purple-50" fg="text-purple-500" />
      </div>

      {/* Map + Right Panel */}
      <div className="flex-1 flex gap-5 min-h-[400px]">
        <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          {/* Tab Bar */}
          <div className="h-11 border-b border-slate-100 flex items-center px-2 bg-slate-50 shrink-0">
            <div className="flex text-[10px] font-bold gap-1">
              {tabs.map(t => (
                <button key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${activeTab === t.id ? 'bg-blue-100 text-blue-800' : 'text-slate-500 hover:text-navy-900 hover:bg-slate-100'}`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 relative">
            {activeTab === 'map' && <MapLibreMap />}

            {activeTab === 'satellite' && (
              <SatelliteViewTab data={data} />
            )}

            {activeTab === 'analysis' && (
              <div className="w-full h-full relative">
                <MapLibreMap showLayerPanel />
              </div>
            )}

            {activeTab === 'history' && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-white p-8">
                <History className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-navy-900 mb-2">Historical Data — Ennore 2017</h3>
                <div className="max-w-md text-xs text-slate-500 space-y-2 text-center">
                  <p><strong>Incident Context:</strong> {data.case.case_name} ({data.case.date})</p>
                  <p><strong>Location:</strong> {data.case.location}</p>
                  <p><strong>Data Source:</strong> {data.case.source}</p>
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-amber-800 text-[10px] font-bold">
                    ⚠ {data.case.disclaimer}
                  </div>
                  <div className="mt-4 text-left space-y-1">
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-1">Evidence Provenance</p>
                    {data.evidence.map((e, i) => (
                      <div key={i} className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="font-medium text-navy-900">{e.item}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${e.classification === 'synthetic_demo' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                          {e.classification.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-72 flex flex-col gap-4 shrink-0">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="p-3 border-b border-slate-100 bg-slate-50 rounded-t-lg flex justify-between items-center">
              <h3 className="font-bold text-navy-900 text-sm">Selected Incident</h3>
              <span className="text-[9px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded uppercase">Active</span>
            </div>
            <div className="p-3 flex flex-col gap-2 text-xs">
              <Row label="Incident ID" value={data.case.case_id} />
              <Row label="Detected On" value={data.case.date} />
              <Row label="Location" value={`${data.slick.centroid.lat.toFixed(2)}°N, ${data.slick.centroid.lon.toFixed(2)}°E`} />
              <Row label="Area" value={`${data.slick.area} px (Relative)`} />
              <Row label="Source" value={data.attribution.results[0].id} />
              <Row label="Score" value={`${(data.attribution.results[0].attribution_score * 100).toFixed(1)}%`} />
              <Row label="Evidence" value={data.attribution.results[0].evidence_strength} />
            </div>
            <div className="p-3 pt-0 flex gap-2">
              <button onClick={() => navigate('/incidents')} className="flex-1 bg-navy-900 text-white text-[10px] font-bold py-2 rounded shadow-sm hover:bg-navy-800">View Details</button>
              <button disabled className="flex-1 bg-white border border-slate-200 text-slate-400 text-[10px] font-bold py-2 rounded cursor-not-allowed flex items-center justify-center gap-1">
                <FileText className="w-3 h-3" /> Report
              </button>
            </div>
          </div>

          {/* Wind & Ocean */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3">
            <h3 className="text-[10px] font-bold text-navy-900 uppercase mb-2">Environment</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2"><Wind className="w-4 h-4 text-blue-400" /><div><p className="text-[9px] text-slate-400">Wind</p><p className="font-bold">{data.environment.wind_speed.toFixed(1)} m/s @ {data.environment.wind_direction.toFixed(0)}°</p></div></div>
              <div className="flex items-center gap-2"><Compass className="w-4 h-4 text-emerald-400" /><div><p className="text-[9px] text-slate-400">Current</p><p className="font-bold">{data.environment.current_speed.toFixed(2)} m/s @ {data.environment.current_direction.toFixed(0)}°</p></div></div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3">
            <h3 className="text-[10px] font-bold text-navy-900 uppercase mb-2">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => navigate('/vessels')} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold py-1.5 rounded flex items-center justify-center gap-1"><Search className="w-3 h-3" /> Vessels</button>
              <button onClick={() => navigate('/monitoring')} className="bg-blue-50 text-blue-700 hover:bg-blue-100 text-[10px] font-bold py-1.5 rounded flex items-center justify-center gap-1"><ChevronRight className="w-3 h-3" /> Playback</button>
              <button disabled className="bg-slate-50 text-slate-400 text-[10px] font-bold py-1.5 rounded cursor-not-allowed flex items-center justify-center gap-1"><FileText className="w-3 h-3" /> Report</button>
              <button onClick={() => window.open('/api/demo/ennore', '_blank')} className="bg-amber-50 text-amber-700 hover:bg-amber-100 text-[10px] font-bold py-1.5 rounded flex items-center justify-center gap-1">Export JSON</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, badge, badgeColor, bg, fg }: { icon: React.ReactNode; label: string; value: string; badge: string; badgeColor: string; bg: string; fg: string }) {
  const bc = badgeColor === 'red' ? 'bg-red-50 text-red-500' : badgeColor === 'emerald' ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-500';
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm flex items-center gap-3">
      <div className={`w-10 h-10 rounded-full ${bg} ${fg} flex items-center justify-center shrink-0`}>{icon}</div>
      <div>
        <p className="text-[10px] font-bold text-navy-900 uppercase">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-xl font-black text-navy-900">{value}</p>
          <span className={`text-[9px] font-bold px-1 rounded ${bc}`}>{badge}</span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between"><span className="text-slate-500">{label}</span><span className="font-bold text-navy-900 text-right">{value}</span></div>
  );
}

function SatelliteViewTab({ data }: { data: any }) {
  const [view, setView] = useState<'VV' | 'VH' | 'Overlay'>('Overlay');

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 text-white relative">
      <div className="absolute top-4 left-4 z-10 flex bg-slate-800 rounded border border-slate-700 p-1 gap-1 shadow-lg">
        <button onClick={() => setView('VV')} className={`px-4 py-1.5 text-xs font-bold rounded transition-colors ${view === 'VV' ? 'bg-blue-600' : 'hover:bg-slate-700 text-slate-300'}`}>VV Band</button>
        <button onClick={() => setView('VH')} className={`px-4 py-1.5 text-xs font-bold rounded transition-colors ${view === 'VH' ? 'bg-blue-600' : 'hover:bg-slate-700 text-slate-300'}`}>VH Band</button>
        <button onClick={() => setView('Overlay')} className={`px-4 py-1.5 text-xs font-bold rounded transition-colors ${view === 'Overlay' ? 'bg-blue-600' : 'hover:bg-slate-700 text-slate-300'}`}>Detection Overlay</button>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        {view === 'VH' ? (
          <div className="text-center text-slate-500 max-w-sm">
            <Satellite className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-bold">VH Cross-Polarization Unavailable</p>
            <p className="text-xs mt-2">The current Ennore synthetic dataset does not contain valid VH backscatter data.</p>
          </div>
        ) : (
          <div className="relative border border-slate-700 rounded shadow-2xl max-h-full max-w-full inline-block">
            <img src={data.sar.preview_asset} alt="SAR Base" className="object-contain max-h-[60vh]" />
            {view === 'Overlay' && (
              <img src={data.sar.unet_probability_asset} alt="Model Overlay" className="absolute inset-0 w-full h-full object-contain opacity-70 mix-blend-screen" />
            )}
          </div>
        )}
      </div>

      <div className="absolute bottom-4 left-4 z-10 text-[10px] text-slate-400">
        Source: {data.sar.source} · Mode: {data.sar.polarization}
      </div>
    </div>
  );
}
