import { useApp } from '../context/AppContext';
import { ShieldAlert, Droplet, MapPin, Wind, AlertTriangle, Globe } from 'lucide-react';
import MapLibreMap from '../components/map/MapLibreMap';

export default function EnvironmentalImpactScreen() {
  const { data } = useApp();

  if (!data) return null;

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto overflow-x-hidden p-4 gap-4">
      {/* KPI ROW */}
      <div className="flex gap-4 shrink-0">
        <MetricCard 
          icon={<div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600"><Droplet className="w-5 h-5 fill-current" /></div>}
          title="Estimated Spill Area"
          value={`${data.slick.area} px`}
          trend="Geometric estimate"
        />
        <MetricCard 
          icon={<div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600"><MapPin className="w-5 h-5 fill-current" /></div>}
          title="Coastline Proximity"
          value="4.2 km"
          trend="High Risk"
          trendColor="text-orange-500"
        />
        <MetricCard 
          icon={<div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600"><Wind className="w-5 h-5 fill-current" /></div>}
          title="Affected Zone Estimate"
          value="12.5 km²"
          trend="Based on 48h drift"
        />
        <MetricCard 
          icon={<div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-rose-600"><ShieldAlert className="w-5 h-5 fill-current" /></div>}
          title="Ecological Sensitivity"
          value="CRITICAL"
          trend="Coastal mangroves nearby"
          trendColor="text-rose-500"
        />
      </div>

      {/* MIDDLE ROW */}
      <div className="flex gap-4 min-h-[500px]">
        {/* MAP CONTAINER */}
        <div className="flex-[2.2] bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
          <div className="h-12 border-b border-slate-200 flex items-center px-4 bg-white shrink-0">
             <h2 className="font-bold text-navy-900 text-sm">Environmental Impact Map</h2>
          </div>
          <div className="flex-1 relative bg-slate-900">
            <MapLibreMap />
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col flex-1">
            <h3 className="font-black text-navy-900 text-base mb-4 flex items-center gap-2">
               <AlertTriangle className="w-5 h-5 text-orange-500" />
               Coastal Risk Assessment
            </h3>
            <div className="flex flex-col gap-3 text-xs mb-6">
               <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500">Nearest Coastline</span>
                  <span className="font-bold text-navy-900">Ennore Port Region (4.2 km)</span>
               </div>
               <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500">Risk Level</span>
                  <span className="font-bold text-red-600">HIGH</span>
               </div>
               <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500">Potential Affected Shoreline</span>
                  <span className="font-bold text-navy-900">18 km stretch</span>
               </div>
            </div>

            <h3 className="font-black text-navy-900 text-base mb-4 mt-2">Sensitive Areas</h3>
            <div className="flex flex-col gap-3">
               <SensitiveAreaItem name="Pulicat Lake Bird Sanctuary" />
               <SensitiveAreaItem name="Ennore Creek Mangroves" />
               <SensitiveAreaItem name="Chennai Fishing Zones" />
            </div>
            
            <h3 className="font-black text-navy-900 text-base mb-4 mt-6">Environmental Data Sources</h3>
            <div className="flex flex-col gap-3">
               <DataSourceItem name="NCSCM Coastal Vulnerability Index" badge="DESIGNED INTEGRATION" />
               <DataSourceItem name="INCOIS Ocean State Forecast" badge="DESIGNED INTEGRATION" />
               <DataSourceItem name="ERA5 Reanalysis" badge="BUILT (Demo Data)" isBuilt={true} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800 flex items-center gap-2">
        <Globe className="w-4 h-4 shrink-0" />
        <p>Disclaimer: Environmental impact assessment requires integration with NCSCM, INCOIS, and state-level ecological databases. Currently showing geometric estimates from slick detection.</p>
      </div>
    </div>
  );
}

function MetricCard({ icon, title, value, trend, trendColor }: any) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between flex-1 min-w-[180px]">
      <div className="flex gap-3 items-start">
         {icon}
         <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 tracking-wide uppercase mb-1">{title}</span>
            <div className="flex items-baseline gap-2">
               <span className="text-xl font-black text-navy-900 leading-none">{value}</span>
            </div>
            <span className={`text-[10px] mt-1 font-medium ${trendColor || 'text-slate-400'}`}>{trend}</span>
         </div>
      </div>
    </div>
  );
}

function SensitiveAreaItem({ name }: { name: string }) {
  return (
    <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
      <span className="text-xs font-bold text-navy-900">{name}</span>
      <span className="text-[9px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded">DESIGNED INTEGRATION</span>
    </div>
  );
}

function DataSourceItem({ name, badge, isBuilt }: { name: string, badge: string, isBuilt?: boolean }) {
  return (
    <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
      <span className="text-xs font-bold text-navy-900">{name}</span>
      <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${isBuilt ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{badge}</span>
    </div>
  );
}
