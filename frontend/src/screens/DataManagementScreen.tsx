import { Database, Satellite, Activity, Waves, Server, Code, GitMerge } from 'lucide-react';

export default function DataManagementScreen() {
  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto overflow-x-hidden p-4 gap-4">
      
      <div className="flex gap-4">
        {/* LEFT COLUMN */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Section 1 */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
               <Database className="w-5 h-5 text-emerald-600" />
               <h2 className="font-black text-navy-900 text-lg">Open / Demonstration Data Sources</h2>
            </div>
            <div className="flex flex-col gap-3">
               <DataSourceCard 
                 name="Sentinel-1 SAR" 
                 icon={<Satellite className="w-4 h-4" />}
                 badge="BUILT" 
                 badgeColor="bg-emerald-100 text-emerald-700"
                 desc="Copernicus open access radar imagery used for baseline slick detection."
               />
               <DataSourceCard 
                 name="MarineCadastre AIS" 
                 icon={<Activity className="w-4 h-4" />}
                 badge="DEMO" 
                 badgeColor="bg-blue-100 text-blue-700"
                 desc="Historical AIS playback for the 2017 Ennore incident demonstration."
               />
               <DataSourceCard 
                 name="ERA5 Reanalysis" 
                 icon={<Server className="w-4 h-4" />}
                 badge="BUILT" 
                 badgeColor="bg-emerald-100 text-emerald-700"
                 desc="ECMWF atmospheric reanalysis for historical wind data."
               />
               <DataSourceCard 
                 name="CMEMS Ocean Currents" 
                 icon={<Waves className="w-4 h-4" />}
                 badge="BUILT" 
                 badgeColor="bg-emerald-100 text-emerald-700"
                 desc="Copernicus Marine Service physics reanalysis."
               />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex-[1.5] flex flex-col gap-4">
          {/* Section 2 */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-indigo-600" />
                  <h2 className="font-black text-navy-900 text-lg">Sovereign / Indian Data Sources</h2>
               </div>
               <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100">
                  DATA ADAPTERS MODULE
               </span>
            </div>
            
            <p className="text-xs text-slate-500 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
              The following systems are implemented as stubbed adapter interfaces. They are architecturally ready to receive institutional credentials and connect to sovereign endpoints.
            </p>

            <div className="grid grid-cols-2 gap-3">
               <DataSourceCard 
                 name="EOS-04 (RISAT) SAR" 
                 icon={<Satellite className="w-4 h-4" />}
                 badge="DESIGNED INTEGRATION" 
                 badgeColor="bg-slate-200 text-slate-600"
                 desc="Adapter interface ready for ISRO SAR telemetry."
               />
               <DataSourceCard 
                 name="NISAR L-Band SAR" 
                 icon={<Satellite className="w-4 h-4" />}
                 badge="DESIGNED INTEGRATION" 
                 badgeColor="bg-slate-200 text-slate-600"
                 desc="Adapter ready for upcoming ISRO-NASA joint mission."
               />
               <DataSourceCard 
                 name="Bhoonidhi Platform" 
                 icon={<Database className="w-4 h-4" />}
                 badge="DESIGNED INTEGRATION" 
                 badgeColor="bg-slate-200 text-slate-600"
                 desc="Interface established for NRSC data hub access."
               />
               <DataSourceCard 
                 name="INCOIS Ocean Data" 
                 icon={<Waves className="w-4 h-4" />}
                 badge="DESIGNED INTEGRATION" 
                 badgeColor="bg-slate-200 text-slate-600"
                 desc="Ocean state forecast and physical models integration."
               />
               <DataSourceCard 
                 name="Indian AIS (DGLL)" 
                 icon={<Activity className="w-4 h-4" />}
                 badge="DESIGNED INTEGRATION" 
                 badgeColor="bg-slate-200 text-slate-600"
                 desc="Secure receiver interface for coastal AIS network."
               />
            </div>
          </div>
          
          {/* Section 3: Pipeline Status */}
          <div className="bg-navy-900 rounded-xl shadow-sm p-5 flex flex-col text-white">
            <div className="flex items-center gap-2 mb-4">
               <GitMerge className="w-5 h-5 text-blue-400" />
               <h2 className="font-black text-white text-lg">Processing Pipeline Status</h2>
            </div>
            
            <div className="flex gap-4 items-center mb-2">
               <PipelineStep name="Data Ingestion" status="active" />
               <div className="h-px bg-slate-700 flex-1"></div>
               <PipelineStep name="SAR Segmentation" status="active" />
               <div className="h-px bg-slate-700 flex-1"></div>
               <PipelineStep name="Drift Simulation" status="active" />
               <div className="h-px bg-slate-700 flex-1"></div>
               <PipelineStep name="AIS Fusion" status="active" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DataSourceCard({ name, badge, badgeColor, desc, icon }: any) {
  return (
    <div className="flex flex-col bg-slate-50 p-3 rounded-lg border border-slate-100 hover:border-slate-300 transition-colors">
      <div className="flex justify-between items-start mb-2">
         <div className="flex items-center gap-2">
            <div className="text-slate-500">{icon}</div>
            <span className="text-sm font-bold text-navy-900">{name}</span>
         </div>
         <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${badgeColor}`}>{badge}</span>
      </div>
      <p className="text-xs text-slate-500">{desc}</p>
    </div>
  );
}

function PipelineStep({ name, status }: { name: string, status: string }) {
  return (
    <div className="flex flex-col items-center gap-2 w-24 text-center">
       <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${status === 'active' ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400' : 'border-slate-600 bg-slate-800 text-slate-500'}`}>
          <Code className="w-4 h-4" />
       </div>
       <span className="text-[10px] font-bold text-slate-300">{name}</span>
    </div>
  );
}
