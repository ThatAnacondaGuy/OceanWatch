import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Droplet, Navigation, CheckCircle2, Clock, Search, ChevronRight, FileText, Satellite, MapPin, Download, Wind, Activity, Compass } from 'lucide-react';
import MapLibreMap from '../components/map/MapLibreMap';
import { useNavigate } from 'react-router-dom';

export default function DashboardScreen() {
  const { data } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Live Map');

  if (!data) return null;

  return (
    <div className="flex flex-col h-full p-6 gap-6 overflow-y-auto">
      {/* Top Metrics Row */}
      <div className="flex gap-4 shrink-0">
        <div className="flex-1">
          <StatCard icon={<Droplet className="w-6 h-6" />} label="Active Oil Spills" value="1" badge="Active" badgeColor="red" bg="bg-red-50" fg="text-red-500" subtext="In Demo Scene" />
        </div>
        <div className="flex-1">
          <StatCard icon={<Navigation className="w-6 h-6" />} label="Vessels Analyzed" value="5" trend="+4" trendColor="text-emerald-500" bg="bg-blue-50" fg="text-blue-500" subtext="In View" />
        </div>
        <div className="flex-1">
          <StatCard icon={<CheckCircle2 className="w-6 h-6" />} label="Detection Accuracy" value="94.7%" bg="bg-emerald-50" fg="text-emerald-500" subtext="AI Model (SAR)" />
        </div>
        <div className="flex-1">
          <StatCard icon={<Clock className="w-6 h-6" />} label="Avg. Processing Time" value="28s" bg="bg-purple-50" fg="text-purple-500" subtext="per image" />
        </div>
        <div className="flex-1 bg-white rounded-lg border border-slate-200 p-4 shadow-sm flex flex-col justify-center items-end">
          <div className="text-right">
             <div className="text-sm font-bold text-navy-900">{new Date(data.case.date).toLocaleDateString('en-US', {weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'})}</div>
             <div className="text-[10px] text-slate-500 font-medium mb-1">11:24 UTC</div>
             <div className="flex items-center gap-1.5 justify-end mt-1">
               <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
               <span className="text-[11px] font-bold text-navy-900">System Operational</span>
             </div>
          </div>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left Column (Main Map/Sat views) */}
        <div className="flex-[2] flex flex-col gap-4 min-w-0">
          <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col overflow-hidden min-h-[400px]">
             {/* Tabs & Controls */}
             <div className="flex items-center justify-between px-2 pt-2 border-b border-slate-100 bg-white z-10 shrink-0">
                <div className="flex gap-1">
                   {['Live Map', 'Satellite View', 'Analysis Layers', 'Historical Data'].map(tab => (
                     <button key={tab} onClick={() => setActiveTab(tab)}
                       className={`px-4 py-2.5 text-xs font-bold transition-colors border-b-2 ${activeTab === tab ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-navy-900 hover:bg-slate-50 rounded-t'}`}>
                       {tab}
                     </button>
                   ))}
                </div>
                <div className="flex items-center gap-2 pb-1 pr-2">
                   <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                      <input type="text" placeholder="Search location, vessel..." className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded w-48 focus:outline-none focus:border-blue-400 text-navy-900" />
                   </div>
                   <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-bold text-slate-600 hover:bg-slate-50">Layers</button>
                   <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-bold text-slate-600 hover:bg-slate-50">Last 24 Hours</button>
                </div>
             </div>
            
            <div className="flex-1 relative bg-slate-100">
               {activeTab === 'Live Map' && (
                 <div className="absolute inset-0">
                   <MapLibreMap />
                 </div>
               )}
               {activeTab === 'Satellite View' && <SatelliteViewTab data={data} />}
               {activeTab !== 'Live Map' && activeTab !== 'Satellite View' && (
                 <div className="flex items-center justify-center h-full text-slate-400 italic">Not available in demo</div>
               )}
            </div>
          </div>

          <div className="flex gap-4 shrink-0 h-32">
             <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm p-4 flex flex-col">
                <h3 className="text-xs font-bold text-navy-900 mb-3">Wind & Ocean Conditions</h3>
                <div className="flex items-center justify-between flex-1">
                   <div className="flex items-center gap-3">
                      <Wind className="w-6 h-6 text-blue-400" />
                      <div><p className="text-[10px] text-slate-500 font-bold uppercase">Wind Speed</p><p className="font-black text-navy-900">{data.environment.wind_speed.toFixed(1)} m/s</p><p className="text-[9px] text-slate-400">({data.environment.wind_direction.toFixed(0)}°)</p></div>
                   </div>
                   <div className="w-px h-8 bg-slate-200" />
                   <div className="flex items-center gap-3">
                      <Activity className="w-6 h-6 text-emerald-400" />
                      <div><p className="text-[10px] text-slate-500 font-bold uppercase">Wave Height</p><p className="font-black text-navy-900">1.4 m</p><p className="text-[9px] text-slate-400">Demo</p></div>
                   </div>
                   <div className="w-px h-8 bg-slate-200" />
                   <div className="flex items-center gap-3">
                      <Compass className="w-6 h-6 text-indigo-400" />
                      <div><p className="text-[10px] text-slate-500 font-bold uppercase">Surface Current</p><p className="font-black text-navy-900">{data.environment.current_speed.toFixed(2)} m/s</p><p className="text-[9px] text-slate-400">({data.environment.current_direction.toFixed(0)}°)</p></div>
                   </div>
                </div>
             </div>
             
             <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm p-4 flex flex-col">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold text-navy-900">System Notifications</h3>
                  <button className="text-[10px] font-bold text-blue-600 hover:underline">View All &rarr;</button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2">
                   <NotificationItem color="bg-red-500" text="New oil spill detected (ENNORE-2017-DEMO)" time="2 hours ago" />
                   <NotificationItem color="bg-blue-500" text="Vessel match found: DEMO-MMSI-001" time="3 hours ago" />
                   <NotificationItem color="bg-emerald-500" text="Model processing completed (Sentinel-1)" time="5 hours ago" />
                </div>
             </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-80 flex flex-col gap-4 shrink-0 overflow-y-auto">
          {/* Selected Incident */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-navy-900 text-sm">Selected Incident</h3>
              <span className="text-[10px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded uppercase">Active</span>
            </div>
            <div className="p-4 flex flex-col gap-3 text-xs">
              <Row label="Incident ID" value={data.case.case_id} />
              <Row label="Detected On" value={data.case.date} />
              <Row label="Location" value={`${data.slick.centroid.lat.toFixed(2)}°N, ${data.slick.centroid.lon.toFixed(2)}°E\nEnnore (Inside EEZ)`} />
              <Row label="Estimated Area" value={`${data.slick.area} px (Relative)`} />
              <Row label="Likely Source" value={`Vessel (Confidence: ${(data.attribution.results[0].attribution_score * 100).toFixed(0)}%)`} />
              <Row label="Status" value="Under Investigation" />
            </div>
            <div className="p-4 pt-2 flex gap-2">
              <button onClick={() => navigate('/incidents')} className="flex-1 bg-navy-900 text-white text-xs font-bold py-2 rounded shadow-sm hover:bg-navy-800 transition-colors">View Details</button>
              <button disabled className="flex-1 bg-white border border-slate-200 text-slate-400 text-xs font-bold py-2 rounded cursor-not-allowed flex items-center justify-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Generate Report
              </button>
            </div>
          </div>

          {/* Recent Detections */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-navy-900 text-sm">Recent Detections</h3>
              <button className="text-[10px] font-bold text-blue-600 hover:underline">View All &rarr;</button>
            </div>
            <div className="p-2 flex flex-col">
               <DetectionRow id={data.case.case_id} area={`${data.slick.area} px`} time="Demo" status="Active" color="bg-red-500" statusColor="text-red-600 bg-red-50" />
               <DetectionRow id="OS-2025-090" area="3.1 km²" time="N/A" status="Monitoring" color="bg-amber-500" statusColor="text-amber-600 bg-amber-50" />
               <DetectionRow id="OS-2025-089" area="0.8 km²" time="N/A" status="Monitoring" color="bg-amber-500" statusColor="text-amber-600 bg-amber-50" />
               <DetectionRow id="OS-2025-088" area="0.2 km²" time="N/A" status="Resolved" color="bg-emerald-500" statusColor="text-emerald-600 bg-emerald-50" />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col p-4">
            <h3 className="font-bold text-navy-900 text-sm mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => navigate('/vessels')} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors text-xs font-bold py-2 rounded border border-emerald-200 flex items-center justify-center gap-1.5"><Search className="w-3.5 h-3.5" /> Search Vessel</button>
              <button onClick={() => navigate('/monitoring')} className="bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-xs font-bold py-2 rounded border border-blue-200 flex items-center justify-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Mark Area</button>
              <button disabled className="bg-purple-50 text-purple-700 opacity-50 text-xs font-bold py-2 rounded border border-purple-200 cursor-not-allowed flex items-center justify-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Generate Report</button>
              <button onClick={() => window.open('/api/demo/ennore', '_blank')} className="bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors text-xs font-bold py-2 rounded border border-amber-200 flex items-center justify-center gap-1.5"><Download className="w-3.5 h-3.5" /> Export Data</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subtext, bg, fg, trend, trendColor, badge, badgeColor }: any) {
  const bc = badgeColor === 'red' ? 'bg-red-50 text-red-500' : badgeColor === 'emerald' ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-500';
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm flex items-start gap-3 h-full">
      <div className={`w-12 h-12 rounded-full ${bg} ${fg} flex items-center justify-center shrink-0`}>{icon}</div>
      <div className="flex flex-col h-full justify-between flex-1">
        <p className="text-[11px] font-bold text-navy-900 uppercase tracking-wide">{label}</p>
        <div className="flex items-baseline gap-2 mt-1">
          <p className="text-3xl font-black text-navy-900 leading-none">{value}</p>
          {badge && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${bc}`}>{badge}</span>}
          {trend && <span className={`text-[10px] font-bold ${trendColor}`}>{trend}</span>}
        </div>
        <p className="text-[10px] text-slate-400 mt-1">{subtext}</p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-4">
       <span className="text-slate-500 shrink-0">{label}</span>
       <span className="font-bold text-navy-900 text-right whitespace-pre-line">{value}</span>
    </div>
  );
}

function NotificationItem({ color, text, time }: any) {
   return (
      <div className="flex items-center gap-2">
         <div className={`w-2 h-2 rounded-full ${color} shrink-0`} />
         <span className="text-xs font-medium text-navy-900 truncate flex-1">{text}</span>
         <span className="text-[9px] text-slate-400 shrink-0">{time}</span>
      </div>
   );
}

function DetectionRow({ id, area, time, status, color, statusColor }: any) {
   return (
      <div className="flex items-center justify-between p-3 hover:bg-slate-50 rounded cursor-pointer border-b border-slate-50 last:border-0 transition-colors">
         <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
            <div className="flex flex-col">
               <span className="text-xs font-bold text-navy-900">{id}</span>
               <span className="text-[10px] text-slate-500">{area} • {time}</span>
            </div>
         </div>
         <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusColor}`}>{status}</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
         </div>
      </div>
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

      <div className="flex-1 flex items-center justify-center p-8 bg-black/50">
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
