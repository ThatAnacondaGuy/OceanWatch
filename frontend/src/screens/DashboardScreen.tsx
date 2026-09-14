import { useState } from 'react';
import { useApp } from '../context/AppContext';
import DashboardMap from '../components/map/DashboardMap';
import { 
  Droplet, Ship, ShieldCheck, Clock, Calendar, 
  ChevronRight,
  Wind, Waves, Compass, ArrowRight, MapPin, Search as SearchIcon, FileText, Download
} from 'lucide-react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';

export default function DashboardScreen() {
  const { data, setSelectedVessel } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  
  const handleSearch = (e: any) => {
     const val = e.target.value;
     setSearchQuery(val);
     if (val.toUpperCase().includes('MMSI-001')) setSelectedVessel('DEMO-MMSI-001');
     else if (val.toUpperCase().includes('MMSI-002')) setSelectedVessel('DEMO-MMSI-002');
     else if (val.toUpperCase().includes('MMSI-003')) setSelectedVessel('DEMO-MMSI-003');
     else if (val.toUpperCase().includes('MMSI-004')) setSelectedVessel('DEMO-MMSI-004');
     else if (val.toUpperCase().includes('RADAR-005')) setSelectedVessel('DEMO-RADAR-005');
  };
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Investigation Map');

  if (!data) return null;

  const currentCase = data.case;
  const sourceVessel = data.attribution.results[0];

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto overflow-x-hidden p-4 gap-4">
      {/* KPI ROW */}
      <div className="flex gap-4 shrink-0">
        <MetricCard 
          icon={<div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600"><Droplet className="w-5 h-5 fill-current" /></div>}
          title="Active Oil Spills"
          value="1"
          trend="vs. last 24 hrs"
          trendVal="+1"
          trendColor="text-red-500"
        />
        <MetricCard 
          icon={<div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700"><Ship className="w-5 h-5 fill-current" /></div>}
          title="Vessels Analyzed"
          value="5"
          trend="today"
          trendVal="+5"
          trendColor="text-emerald-500"
        />
        <MetricCard 
          icon={<div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600"><ShieldCheck className="w-5 h-5 fill-current" /></div>}
          title="Model Confidence"
          value="Attention U-Net"
          trend="ResNet-34 · scSE Decoder"
        />
        <MetricCard 
          icon={<div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600"><Clock className="w-5 h-5" /></div>}
          title="Avg. Processing Time"
          value="28 seconds"
          trend="per image"
        />
        <div className="flex-1 bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-center min-w-[200px]">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-slate-500" />
            <span className="font-bold text-navy-900 text-sm">Tue, 28 Jan 2017<br/>04:00 UTC</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-navy-900">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
            Demo Playback
          </div>
        </div>
      </div>

      {/* MIDDLE ROW */}
      <div className="flex gap-4 min-h-[500px]">
        
        {/* MAP CONTAINER */}
        <div className="flex-[2.2] bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
          {/* Map Header / Tabs */}
          <div className="h-12 border-b border-slate-200 flex items-center px-2 bg-white shrink-0 justify-between">
            <div className="flex h-full">
              {['Investigation Map', 'Satellite View', 'Analysis Layers', 'Historical Data'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={clsx(
                    "px-4 h-full text-xs font-bold transition-colors border-b-2",
                    activeTab === tab 
                      ? "border-blue-600 text-blue-700 bg-blue-50/50" 
                      : "border-transparent text-slate-500 hover:text-navy-900 hover:bg-slate-50"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
            
            <div className="relative mr-2">
              <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search location, vessel or incident..."
                value={searchQuery}
                onChange={handleSearch}
                className="pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded-full w-64 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {/* Map Area */}
          <div className="flex-1 relative bg-slate-900">
            <DashboardMap />
            
            
          </div>
        </div>
        
        {/* RIGHT PANEL */}
        <div className="flex-1 flex flex-col gap-4">
          
          {/* Selected Incident */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-black text-navy-900 text-base">Selected Incident</h3>
               <span className="bg-red-50 text-red-600 font-bold px-2.5 py-1 rounded-md text-[10px] uppercase tracking-widest border border-red-100">Active</span>
            </div>
            
            <div className="flex flex-col gap-3 text-xs mb-6">
               <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500">Incident ID</span>
                  <span className="font-bold text-navy-900">ENNORE-2017-DEMO</span>
               </div>
               <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500">Detected On</span>
                  <span className="font-bold text-navy-900">28 Jan 2017, 04:00 UTC</span>
               </div>
               <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500">Location</span>
                  <div className="text-right">
                     <div className="font-bold text-navy-900">{currentCase.location}</div>
                     <div className="text-[10px] text-slate-500 mt-0.5">13.27° N, 80.34° E</div>
                  </div>
               </div>
               <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500">Estimated Area</span>
                  <span className="font-bold text-navy-900">{data.slick.area} px (Relative)</span>
               </div>
               <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500">Likely Source</span>
                  <span className="font-bold text-navy-900">{sourceVessel?.id}</span>
               </div>
               <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500">Attribution Score</span>
                  <span className="font-bold text-navy-900">{(sourceVessel.attribution_score * 100).toFixed(1)}%</span>
               </div>
               <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500">Evidence</span>
                  <span className="font-bold text-navy-900">HIGH</span>
               </div>
               <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <span className="font-bold text-amber-600">Synthetic Demo</span>
               </div>
            </div>
            
            <div className="flex gap-3 mt-auto">
               <button 
                 onClick={() => navigate('/demo/ennore')}
                 className="flex-1 bg-navy-900 hover:bg-navy-800 text-white font-bold py-2.5 rounded shadow text-xs transition-colors flex justify-center items-center gap-2">
                 View Details
               </button>
               <button className="flex-1 bg-white hover:bg-slate-50 text-navy-900 border border-slate-200 font-bold py-2.5 rounded shadow-sm text-xs transition-colors flex justify-center items-center gap-2">
                 <FileText className="w-3.5 h-3.5" /> Generate Report
               </button>
            </div>
          </div>
          
          {/* Recent Detections */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-black text-navy-900 text-sm">Recent Detections</h3>
               <button className="text-blue-600 text-[11px] font-bold flex items-center gap-1 hover:underline">
                 View All <ArrowRight className="w-3 h-3" />
               </button>
            </div>
            
            <div className="flex flex-col gap-1 flex-1 overflow-y-auto">
               <div className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-100">
                  <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  <span className="font-bold text-navy-900 text-xs w-28 shrink-0">ENNORE-2017</span>
                  <span className="text-[11px] text-slate-500 w-16">{data.slick.area} px</span>
                  <span className="text-[11px] text-slate-400 flex-1">Demo Case</span>
                  <span className="bg-red-50 text-red-600 text-[9px] font-bold px-2 py-0.5 rounded border border-red-100">Active</span>
                  <ChevronRight className="w-4 h-4 text-slate-300 ml-1" />
               </div>
               
               <div className="flex items-center justify-center p-4 text-[10px] text-slate-400 font-medium italic border-t border-slate-50 mt-2">
                  Additional incidents unavailable in current demo dataset.
               </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className="flex gap-4 shrink-0">
         {/* Wind & Ocean */}
         <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col">
            <h3 className="font-black text-navy-900 text-sm mb-3">Wind & Ocean Conditions</h3>
            <div className="flex gap-4 mt-1">
               <div className="flex gap-3 items-center flex-1">
                  <Wind className="w-8 h-8 text-blue-500" />
                  <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Wind Speed</span>
                     <span className="text-lg font-black text-navy-900 leading-none">{data.environment.wind_speed.toFixed(1)} m/s</span>
                     <span className="text-[10px] text-slate-400 font-medium mt-1">({data.environment.wind_direction.toFixed(0)}°)</span>
                  </div>
               </div>
               
               <div className="w-px bg-slate-100" />
               
               <div className="flex gap-3 items-center flex-1 pl-2">
                  <Waves className="w-8 h-8 text-blue-500" />
                  <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Wave Height</span>
                     <span className="text-lg font-black text-navy-900 leading-none">N/A</span>
                     <span className="text-[10px] text-slate-400 font-medium mt-1">(Demo)</span>
                  </div>
               </div>
               
               <div className="w-px bg-slate-100" />
               
               <div className="flex gap-3 items-center flex-1 pl-2">
                  <Compass className="w-8 h-8 text-blue-500" />
                  <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Surface Current</span>
                     <span className="text-lg font-black text-navy-900 leading-none">{data.environment.current_speed.toFixed(2)} m/s</span>
                     <span className="text-[10px] text-slate-400 font-medium mt-1">({data.environment.current_direction.toFixed(0)}°)</span>
                  </div>
               </div>
            </div>
         </div>
         
         {/* System Notifications */}
         <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col">
            <div className="flex justify-between items-center mb-3">
               <h3 className="font-black text-navy-900 text-sm">System Notifications</h3>
               <button className="text-blue-600 text-[11px] font-bold flex items-center gap-1 hover:underline">
                 View All <ArrowRight className="w-3 h-3" />
               </button>
            </div>
            <div className="flex flex-col gap-2.5">
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full shrink-0" />
                  <span className="text-xs font-bold text-navy-900 flex-1 truncate">SAR validation passed</span>
                  <span className="text-[10px] text-slate-400">04:00 Z</span>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                  <span className="text-xs font-medium text-slate-700 flex-1 truncate">AIS playback loaded</span>
                  <span className="text-[10px] text-slate-400">04:01 Z</span>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full shrink-0" />
                  <span className="text-xs font-medium text-slate-700 flex-1 truncate">Drift analysis completed</span>
                  <span className="text-[10px] text-slate-400">03:55 Z</span>
               </div>
            </div>
         </div>
         
         {/* Quick Actions */}
         <div className="flex-[0.8] bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col">
            <h3 className="font-black text-navy-900 text-sm mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2 flex-1">
               <button 
                 onClick={() => navigate('/vessels')}
                 className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors rounded-lg border border-emerald-100 text-[11px] font-bold">
                  <SearchIcon className="w-3.5 h-3.5" /> Search Vessel
               </button>
               <button title="Annotation mode unavailable in current demo dataset." className="flex items-center justify-center gap-2 bg-blue-50/50 text-blue-700/50 cursor-not-allowed rounded-lg border border-blue-100/50 text-[11px] font-bold">
                  <MapPin className="w-3.5 h-3.5" /> Mark Area
               </button>
               <button title="Report generation endpoint unavailable in current demo." className="flex items-center justify-center gap-2 bg-purple-50/50 text-purple-700/50 cursor-not-allowed rounded-lg border border-purple-100/50 text-[11px] font-bold">
                  <FileText className="w-3.5 h-3.5" /> Generate Report
               </button>
               <button 
                 onClick={() => window.open('/api/demo/ennore', '_blank')}
                 className="flex items-center justify-center gap-2 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors rounded-lg border border-amber-100 text-[11px] font-bold">
                  <Download className="w-3.5 h-3.5" /> Export Data
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, title, value, trend, trendVal, trendColor }: any) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between flex-1 min-w-[180px]">
      <div className="flex gap-3 items-start">
         {icon}
         <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 tracking-wide uppercase mb-1">{title}</span>
            <div className="flex items-baseline gap-2">
               <span className="text-2xl font-black text-navy-900 leading-none">{value}</span>
               {trendVal && <span className={clsx("text-xs font-bold flex items-center gap-0.5", trendColor)}>{trendVal}</span>}
            </div>
            <span className="text-[10px] text-slate-400 mt-1">{trend}</span>
         </div>
      </div>
    </div>
  );
}
