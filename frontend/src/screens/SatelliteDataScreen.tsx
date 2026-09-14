import { useApp } from '../context/AppContext';
import { Satellite, Activity, Database, CheckCircle2, Search, Maximize, CheckCircle, Play, DownloadCloud, AlertTriangle } from 'lucide-react';
import MapLibreMap from '../components/map/MapLibreMap';

export default function SatelliteDataScreen() {
  const { data } = useApp();
  if (!data) return null;

  return (
    <div className="flex flex-col h-full p-4 gap-4 overflow-y-auto">
       {/* Top Metrics Row */}
       <div className="flex gap-4 shrink-0 overflow-x-auto pb-1">
          <StatCard icon={<Satellite className="w-5 h-5" />} label="Sentinel-1 Scenes" value="2" trend="+1" trendColor="text-emerald-500" bg="bg-blue-50" fg="text-blue-500" />
          <StatCard icon={<Satellite className="w-5 h-5" />} label="Sentinel-2 Scenes" value="1" subtext="Demo area" bg="bg-emerald-50" fg="text-emerald-500" />
          <StatCard icon={<Activity className="w-5 h-5" />} label="Data Availability" value="N/A" subtext="Demo dataset only" bg="bg-purple-50" fg="text-purple-500" />
          <StatCard icon={<Database className="w-5 h-5" />} label="Total Data Volume" value="1.2 GB" subtext="Demo scene" bg="bg-amber-50" fg="text-amber-500" />
          <div className="flex-1 bg-white rounded-lg border border-slate-200 p-3 shadow-sm flex items-center justify-between min-w-[200px]">
             <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">System Status</span>
                <span className="text-sm font-black text-navy-900 mt-0.5">Demo Mode</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Demonstration data</span>
             </div>
             <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
             </div>
          </div>
       </div>

       {/* Middle Row (Map & Scene List) */}
       <div className="flex gap-4 min-h-[300px]">
          {/* Left: Map */}
          <div className="flex-[1.5] bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col overflow-hidden">
             <div className="p-3 border-b border-slate-100 bg-slate-50 font-bold text-navy-900 text-sm">Coverage Area (Demo)</div>
             <div className="flex-1 relative">
                <MapLibreMap showLayerPanel={false} />
                <div className="absolute top-2 right-2 flex gap-1">
                   <button className="px-3 py-1 text-[10px] font-bold bg-white text-navy-900 rounded border border-slate-200 shadow-sm">Map View</button>
                   <button className="px-3 py-1 text-[10px] font-bold bg-slate-100 text-slate-500 rounded border border-slate-200 shadow-sm hover:bg-white hover:text-navy-900">Satellite</button>
                </div>
             </div>
          </div>

          {/* Right: Scene List */}
          <div className="flex-[2.5] bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col overflow-hidden">
             <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-navy-900 text-sm">Available Scenes (3)</h3>
                <div className="flex gap-2">
                   <button className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-1 rounded">Filter</button>
                   <button className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded">Sort</button>
                </div>
             </div>
             <div className="p-2 border-b border-slate-100">
                <div className="relative">
                   <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1.5" />
                   <input type="text" placeholder="Search by ID, date..." className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded outline-none" />
                </div>
             </div>
             <div className="grid grid-cols-[30px,1.5fr,0.5fr,1fr,1fr,1fr,0.5fr] text-[9px] font-bold uppercase tracking-widest text-slate-400 p-2 border-b border-slate-100 px-3 sticky top-0 bg-white">
                <input type="checkbox" disabled />
                <span>Scene ID</span>
                <span>Sat</span>
                <span>Acquired On</span>
                <span>Area</span>
                <span>Status</span>
                <span />
             </div>
             <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-[30px,1.5fr,0.5fr,1fr,1fr,1fr,0.5fr] text-[10px] items-center p-3 border-b border-slate-100 px-3 bg-blue-50/50 cursor-pointer">
                   <input type="checkbox" checked readOnly />
                   <span className="font-bold text-navy-900 truncate pr-2">ENNORE-2017-DEMO-SAR</span>
                   <span className="text-blue-600 font-bold">S1</span>
                   <span className="text-slate-500 font-medium">{data.case.date.split(' ')[0]}</span>
                   <span className="text-slate-500">Ennore</span>
                   <span className="bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded text-[9px] inline-block text-center uppercase tracking-wider">Processed</span>
                   <DownloadCloud className="w-4 h-4 text-blue-500 ml-auto" />
                </div>
                <div className="grid grid-cols-[30px,1.5fr,0.5fr,1fr,1fr,1fr,0.5fr] text-[10px] items-center p-3 border-b border-slate-100 px-3 hover:bg-slate-50 cursor-pointer">
                   <input type="checkbox" readOnly />
                   <span className="font-bold text-navy-900 truncate pr-2">ENNORE-2017-DEMO-OPT</span>
                   <span className="text-amber-500 font-bold">S2</span>
                   <span className="text-slate-500 font-medium">{data.case.date.split(' ')[0]}</span>
                   <span className="text-slate-500">Ennore</span>
                   <span className="bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded text-[9px] inline-block text-center uppercase tracking-wider">Archived</span>
                   <DownloadCloud className="w-4 h-4 text-slate-400 ml-auto hover:text-blue-500" />
                </div>
                <div className="grid grid-cols-[30px,1.5fr,0.5fr,1fr,1fr,1fr,0.5fr] text-[10px] items-center p-3 border-b border-slate-100 px-3 hover:bg-slate-50 cursor-pointer">
                   <input type="checkbox" readOnly />
                   <span className="font-bold text-navy-900 truncate pr-2">MUMBAI-2025-090-SAR</span>
                   <span className="text-blue-600 font-bold">S1</span>
                   <span className="text-slate-500 font-medium">2025-09-08</span>
                   <span className="text-slate-500">Mumbai</span>
                   <span className="bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded text-[9px] inline-block text-center uppercase tracking-wider">Pending</span>
                   <DownloadCloud className="w-4 h-4 text-slate-400 ml-auto hover:text-blue-500" />
                </div>
             </div>
          </div>
       </div>
       
       {/* Bottom Row (Preview & Spectral) */}
       <div className="flex gap-4 shrink-0">
          {/* Selected Scene Preview */}
          <div className="flex-[1.5] bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col overflow-hidden p-4">
             <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                <h3 className="font-bold text-navy-900 text-sm">Selected Scene Preview <span className="text-slate-400 font-normal">(Sentinel-1A)</span></h3>
             </div>
             
             <div className="flex gap-4 mb-4">
                <div className="flex-1 flex flex-col justify-center gap-3">
                   <div className="flex justify-between items-center border-b border-slate-50 pb-1 text-xs">
                      <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Mission</span>
                      <span className="font-black text-navy-900">Sentinel-1</span>
                   </div>
                   <div className="flex justify-between items-center border-b border-slate-50 pb-1 text-xs">
                      <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Pass</span>
                      <span className="font-black text-navy-900">Ascending</span>
                   </div>
                   <div className="flex justify-between items-center border-b border-slate-50 pb-1 text-xs">
                      <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Mode</span>
                      <span className="font-black text-navy-900">IW</span>
                   </div>
                   <div className="flex justify-between items-center border-b border-slate-50 pb-1 text-xs">
                      <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Platform</span>
                      <span className="font-black text-navy-900">S1A</span>
                   </div>
                   <div className="flex justify-between items-center border-b border-slate-50 pb-1 text-xs">
                      <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Size</span>
                      <span className="font-black text-navy-900">1.2 GB</span>
                   </div>
                </div>
                
                <div className="w-[180px] h-[180px] bg-slate-900 rounded-lg relative overflow-hidden border border-slate-200">
                   {data.sar.preview_asset ? (
                      <img src={data.sar.preview_asset} className="w-full h-full object-cover" alt="SAR Preview" />
                   ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">No Image</div>
                   )}
                   <Maximize className="w-4 h-4 text-white absolute top-2 right-2 drop-shadow cursor-pointer hover:scale-110 transition-transform" />
                </div>
             </div>
             
             <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col gap-2">
                <h4 className="text-[10px] font-bold text-navy-900 uppercase tracking-widest mb-1">Quick Actions</h4>
                <div className="flex gap-2">
                   <button className="flex-1 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded shadow flex items-center justify-center gap-1.5 hover:bg-blue-700 transition-colors"><Play className="w-3 h-3" fill="currentColor"/> Analyze with AI</button>
                   <button className="flex-1 py-1.5 bg-white text-navy-900 border border-slate-200 text-[10px] font-bold rounded shadow-sm flex items-center justify-center gap-1.5 hover:bg-slate-50 transition-colors"><Activity className="w-3 h-3"/> Run Oil Spill Model</button>
                   <button className="flex-1 py-1.5 bg-white text-navy-900 border border-slate-200 text-[10px] font-bold rounded shadow-sm flex items-center justify-center gap-1.5 hover:bg-slate-50 transition-colors"><Database className="w-3 h-3"/> Request Higher Res</button>
                </div>
             </div>
          </div>
          
          {/* Multi-Spectral View */}
          <div className="flex-[2.5] bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col p-4">
             <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                <h3 className="font-bold text-navy-900 text-sm">Multi-Spectral Analysis <span className="text-slate-400 font-normal">(VH/VV)</span></h3>
                <div className="flex gap-2">
                   <button className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded border border-blue-200">Sentinel-1 (SAR)</button>
                   <button className="px-3 py-1 bg-white text-slate-500 text-[10px] font-bold rounded border border-slate-200">Sentinel-2 (Optical)</button>
                </div>
             </div>
             
             <div className="flex-1 flex gap-4 min-h-[220px]">
                <div className="flex-1 bg-slate-900 rounded-lg relative overflow-hidden group border border-slate-700 shadow-inner">
                   <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
                      <span className="text-[10px] text-white font-bold bg-navy-900/80 px-2 py-0.5 rounded shadow">VV Polarization</span>
                      <span className="text-[9px] text-emerald-400 font-bold bg-navy-900/80 px-2 py-0.5 rounded flex items-center gap-1 shadow"><CheckCircle className="w-2.5 h-2.5"/> Quality: Good</span>
                   </div>
                   {data.sar.preview_asset && <img src={data.sar.preview_asset} className="w-full h-full object-cover grayscale brightness-125 contrast-125" alt="VV" />}
                   <Maximize className="w-5 h-5 text-white absolute top-3 right-3 drop-shadow opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:scale-110" />
                </div>
                
                <div className="flex-1 bg-slate-900 rounded-lg relative overflow-hidden group border border-slate-700 shadow-inner">
                   <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
                      <span className="text-[10px] text-white font-bold bg-navy-900/80 px-2 py-0.5 rounded shadow">VH Polarization</span>
                      <span className="text-[9px] text-amber-400 font-bold bg-navy-900/80 px-2 py-0.5 rounded flex items-center gap-1 shadow"><AlertTriangle className="w-2.5 h-2.5"/> Quality: Poor (Synthetic)</span>
                   </div>
                   {data.sar.preview_asset && <img src={data.sar.preview_asset} className="w-full h-full object-cover grayscale contrast-75 brightness-75" alt="VH" />}
                   <Maximize className="w-5 h-5 text-white absolute top-3 right-3 drop-shadow opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:scale-110" />
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
