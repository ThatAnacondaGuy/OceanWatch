import { useApp } from '../context/AppContext';
import { Satellite, Image, Clock, Download, Search, CheckCircle, Maximize, Play, Copy, Plus } from 'lucide-react';
import MapLibreMap from '../components/map/MapLibreMap';


export default function SatelliteDataScreen() {
  const { data, layers, setLayers } = useApp();
  console.log(layers, setLayers);
  if (!data) return null;

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-auto p-6 gap-6">
       <div className="shrink-0 flex justify-between items-end">
          <div>
             <div className="flex items-center gap-2 text-[10px] text-blue-600 font-bold tracking-widest uppercase mb-1">
                <span>Dashboard</span> <span className="opacity-50">/</span> <span>Satellite Data</span>
             </div>
             <h1 className="text-2xl font-black text-navy-900 tracking-tight">Satellite Data & Imagery</h1>
             <p className="text-xs text-slate-500 mt-1">Access, view and analyze satellite data from Sentinel-1, Sentinel-2 and other sources for oil spill detection.</p>
          </div>
          <div className="flex gap-2">
             <button className="bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold px-4 py-2.5 rounded shadow">+ Request New Satellite Data</button>
          </div>
       </div>
       
       {/* Top Stats */}
       <div className="grid grid-cols-4 gap-4 shrink-0">
          <div className="bg-white rounded border border-slate-200 p-3 shadow-sm flex items-center gap-3">
             <div className="w-10 h-10 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Satellite className="w-5 h-5 fill-current"/></div>
             <div><p className="text-[10px] font-bold text-slate-500 uppercase">Sentinel-1 Scenes</p><div className="flex items-baseline gap-2"><p className="text-lg font-black text-navy-900 leading-none mt-1">1</p></div><p className="text-[9px] text-slate-400 mt-1">Demo Case</p></div>
          </div>
          <div className="bg-white rounded border border-slate-200 p-3 shadow-sm flex items-center gap-3 opacity-60">
             <div className="w-10 h-10 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><Image className="w-5 h-5"/></div>
             <div><p className="text-[10px] font-bold text-slate-500 uppercase">Sentinel-2 Scenes</p><div className="flex items-baseline gap-2"><p className="text-lg font-black text-navy-900 leading-none mt-1">0</p></div><p className="text-[9px] text-slate-400 mt-1">Demo Case</p></div>
          </div>
          <div className="bg-white rounded border border-slate-200 p-3 shadow-sm flex items-center gap-3 opacity-60">
             <div className="w-10 h-10 rounded bg-purple-50 text-purple-600 flex items-center justify-center shrink-0"><Clock className="w-5 h-5"/></div>
             <div><p className="text-[10px] font-bold text-slate-500 uppercase">Data Availability</p><div className="flex items-baseline gap-2"><p className="text-lg font-black text-navy-900 leading-none mt-1">N/A</p></div><p className="text-[9px] text-slate-400 mt-1">Demo Context</p></div>
          </div>
          <div className="bg-white rounded border border-slate-200 p-3 shadow-sm flex items-center gap-3 opacity-60">
             <div className="w-10 h-10 rounded bg-sky-50 text-sky-600 flex items-center justify-center shrink-0"><Download className="w-5 h-5"/></div>
             <div><p className="text-[10px] font-bold text-slate-500 uppercase">Total Data Volume</p><div className="flex items-baseline gap-2"><p className="text-lg font-black text-navy-900 leading-none mt-1">~1.2 GB</p></div><p className="text-[9px] text-slate-400 mt-1">Extracted Scene</p></div>
          </div>
       </div>
       
       {/* Middle Section (Map + List) */}
       <div className="flex gap-6 shrink-0 h-[400px]">
          {/* Coverage Map */}
          <div className="flex-1 bg-white rounded border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
             <div className="h-10 border-b border-slate-100 flex items-center px-2 bg-slate-50 shrink-0 text-xs font-bold">
                <button className="px-4 py-1 bg-blue-100 text-blue-800 rounded">Coverage Map</button>
                <button className="px-4 py-1 text-slate-500 hover:text-navy-900">Scene Footprints</button>
                <button className="px-4 py-1 text-slate-500 hover:text-navy-900">Acquisition Timeline</button>
             </div>
             <div className="flex-1 relative bg-slate-900">
                <MapLibreMap />
                
                {/* Simulated Polygons Overlay mock over the map visually (via CSS) to emulate the design since we don't have footprints GeoJSON */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
                   <div className="w-64 h-64 border-2 border-blue-400/50 bg-blue-400/10 rotate-12 flex flex-col justify-end p-2">
                      <span className="text-white text-[10px] font-bold bg-navy-900/80 px-1 inline-block self-start">S1A_IW_GRDH (Current Demo Scene)</span>
                   </div>
                </div>
             </div>
          </div>
          
          {/* Satellite Scenes List */}
          <div className="w-[500px] bg-white rounded border border-slate-200 shadow-sm flex flex-col">
             <div className="p-3 border-b border-slate-100 bg-slate-50 font-bold text-navy-900 text-sm">Satellite Scenes (1)</div>
             <div className="p-3 border-b border-slate-100 grid gap-2">
                <div className="relative">
                   <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1.5" />
                   <input type="text" placeholder="Search by ID, date..." className="w-full pl-8 pr-3 py-1 text-xs border border-slate-200 rounded outline-none" />
                </div>
                <div className="grid grid-cols-4 gap-2">
                   <select className="text-[10px] border border-slate-200 rounded p-1"><option>Satellite: All</option></select>
                   <select className="text-[10px] border border-slate-200 rounded p-1"><option>Mode: All</option></select>
                   <select className="text-[10px] border border-slate-200 rounded p-1"><option>Cloud: All</option></select>
                   <select className="text-[10px] border border-slate-200 rounded p-1"><option>Area: All</option></select>
                </div>
             </div>
             <div className="grid grid-cols-[30px,1.5fr,0.5fr,1fr,1fr,1fr,0.5fr] text-[9px] font-bold uppercase tracking-widest text-slate-400 p-2 border-b border-slate-100 px-3">
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
                   <span className="font-bold text-navy-900 truncate pr-2" title="ENNORE_SYNTHETIC_SAR_01">ENNORE_SAR_01</span>
                   <span className="text-blue-600 font-bold">S1</span>
                   <span className="text-slate-500">{data.case.date}</span>
                   <span className="text-slate-500">Ennore</span>
                   <span className="bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded text-[9px] inline-block text-center">Processed</span>
                   <Maximize className="w-3.5 h-3.5 text-blue-500 ml-auto" />
                </div>
             </div>
          </div>
       </div>
       
       {/* Bottom Section (Preview, Multi-Spectral, Actions) */}
       <div className="flex gap-6 min-h-[250px] shrink-0">
          {/* Selected Scene Preview */}
          <div className="w-[450px] bg-white rounded border border-slate-200 shadow-sm flex flex-col overflow-hidden">
             <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-navy-900 text-sm">Selected Scene Preview</h3>
                <span className="flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded"><CheckCircle className="w-3 h-3"/> Processed</span>
             </div>
             <div className="flex-1 flex text-xs">
                <div className="flex-1 p-3 border-r border-slate-100 flex flex-col gap-1.5 justify-center">
                   <div className="font-black text-navy-900 mb-2 truncate">ENNORE_SAR_01</div>
                   <div className="flex justify-between"><span className="text-slate-500">Satellite</span><span className="font-medium">Sentinel-1</span></div>
                   <div className="flex justify-between"><span className="text-slate-500">Product</span><span className="font-medium">GRD IW</span></div>
                   <div className="flex justify-between"><span className="text-slate-500">Polarization</span><span className="font-medium">VV</span></div>
                   <div className="flex justify-between"><span className="text-slate-500">Source</span><span className="font-medium">Synthetic</span></div>
                </div>
                <div className="w-48 bg-slate-900 relative">
                   {data.sar.preview_asset ? (
                      <img src={data.sar.preview_asset} className="w-full h-full object-cover" alt="SAR Preview" />
                   ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500">No Image</div>
                   )}
                   <Maximize className="w-4 h-4 text-white absolute top-2 right-2 drop-shadow" />
                </div>
             </div>
          </div>
          
          {/* Multi-Spectral View */}
          <div className="flex-1 bg-white rounded border border-slate-200 shadow-sm flex flex-col">
             <div className="h-10 border-b border-slate-100 flex items-center px-2 bg-slate-50 shrink-0 text-xs font-bold">
                <button className="px-4 py-1 bg-blue-100 text-blue-800 rounded">Sentinel-1 (SAR)</button>
                <button className="px-4 py-1 text-slate-500">Sentinel-2 (Optical)</button>
                <button className="px-4 py-1 text-slate-500">Detection Overlay</button>
             </div>
             <div className="flex-1 p-3 flex gap-3">
                <div className="flex-1 bg-slate-900 rounded relative overflow-hidden group">
                   <span className="absolute top-2 left-2 text-[10px] text-white font-bold bg-navy-900/80 px-2 py-0.5 rounded z-10">VV Polarization</span>
                   {data.sar.preview_asset && <img src={data.sar.preview_asset} className="w-full h-full object-cover grayscale brightness-125 contrast-125" alt="VV" />}
                   <Maximize className="w-4 h-4 text-white absolute top-2 right-2 drop-shadow opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
                </div>
                <div className="flex-1 bg-slate-900 rounded relative overflow-hidden group">
                   <span className="absolute top-2 left-2 text-[10px] text-white font-bold bg-navy-900/80 px-2 py-0.5 rounded z-10">VH Polarization</span>
                   {data.sar.preview_asset && <img src={data.sar.preview_asset} className="w-full h-full object-cover grayscale contrast-75 brightness-75" alt="VH" />}
                   <Maximize className="w-4 h-4 text-white absolute top-2 right-2 drop-shadow opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
                </div>
             </div>
          </div>
          
          {/* Quick Actions */}
          <div className="w-64 bg-white rounded border border-slate-200 shadow-sm flex flex-col">
             <div className="p-3 border-b border-slate-100 bg-slate-50"><h3 className="font-bold text-navy-900 text-sm">Quick Actions</h3></div>
             <div className="flex-1 p-3 flex flex-col gap-2 justify-center">
                <button className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-blue-700 border border-blue-200 bg-white rounded hover:bg-blue-50 shadow-sm"><Maximize className="w-4 h-4"/> View in Full Screen</button>
                <button className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-emerald-700 border border-emerald-200 bg-emerald-50 rounded hover:bg-emerald-100 shadow-sm"><Play className="w-4 h-4"/> Run Detection on Scene</button>
                <button className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-700 border border-slate-200 bg-white rounded hover:bg-slate-50 shadow-sm"><Copy className="w-4 h-4"/> Compare with Sentinel-2</button>
                <button className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-blue-700 border border-blue-200 bg-white rounded hover:bg-blue-50 shadow-sm"><Download className="w-4 h-4"/> Download Scene (GeoTIFF)</button>
                <button className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-blue-700 border border-blue-200 bg-white rounded hover:bg-blue-50 shadow-sm"><Plus className="w-4 h-4"/> Add to Investigation</button>
             </div>
          </div>
       </div>
    </div>
  );
}
