import { useApp } from '../context/AppContext';
import { Bell, AlertTriangle, Shield, Activity, FileText, CheckCircle, Clock } from 'lucide-react';

export default function AlertsScreen() {
  const { data } = useApp();

  if (!data) return null;

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto overflow-x-hidden p-4 gap-4">
      {/* KPI ROW */}
      <div className="flex gap-4 shrink-0">
        <MetricCard 
          icon={<div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600"><Bell className="w-5 h-5" /></div>}
          title="Total Alerts"
          value="12"
          trend="Last 24h"
        />
        <MetricCard 
          icon={<div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600"><AlertTriangle className="w-5 h-5" /></div>}
          title="High Priority"
          value="2"
          trend="Requires immediate action"
          trendColor="text-red-500"
        />
        <MetricCard 
          icon={<div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600"><Clock className="w-5 h-5" /></div>}
          title="Pending Review"
          value="5"
          trend="In Analyst Queue"
        />
        <MetricCard 
          icon={<div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600"><CheckCircle className="w-5 h-5" /></div>}
          title="Resolved"
          value="104"
          trend="This month"
        />
      </div>

      <div className="flex gap-4 flex-1">
        {/* MAIN PANEL */}
        <div className="flex-[2.2] bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
          <h2 className="font-black text-navy-900 text-lg mb-4">Alert Stream</h2>
          <div className="flex flex-col gap-3">
             <AlertItem 
               title="New oil spill detected" 
               type="detection" 
               severity="HIGH" 
               time="10 mins ago" 
               desc="Sentinel-1 SAR detection in Ennore region." 
               icon={<Activity className="w-4 h-4" />} 
             />
             <AlertItem 
               title="Dark vessel identified in investigation zone" 
               type="anomaly" 
               severity="MEDIUM" 
               time="45 mins ago" 
               desc="Vessel without AIS signal detected near slick geometry." 
               icon={<Shield className="w-4 h-4" />} 
             />
             <AlertItem 
               title="Coastline impact risk elevated" 
               type="environmental" 
               severity="HIGH" 
               time="2 hours ago" 
               desc="Drift trajectory intersects with vulnerable shoreline within 48h." 
               icon={<AlertTriangle className="w-4 h-4" />} 
             />
             <AlertItem 
               title="Attribution scoring completed" 
               type="pipeline" 
               severity="INFO" 
               time="3 hours ago" 
               desc="AI pipeline finished scoring 5 candidate vessels." 
               icon={<Activity className="w-4 h-4" />} 
             />
             <AlertItem 
               title="Investigation report ready for review" 
               type="report" 
               severity="INFO" 
               time="5 hours ago" 
               desc="Automated report generated for previous incident." 
               icon={<FileText className="w-4 h-4" />} 
             />
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
          <h2 className="font-black text-navy-900 text-lg mb-4">Institutional Notification Channels</h2>
          <div className="flex flex-col gap-4">
             <ChannelItem name="SAMUDRA Alert System" badge="DESIGNED INTEGRATION" />
             <ChannelItem name="SACHET Warning Platform" badge="DESIGNED INTEGRATION" />
             <ChannelItem name="Coast Guard Operations" badge="DESIGNED INTEGRATION" />
             <ChannelItem name="Internal Analyst Queue" badge="BUILT" isBuilt={true} />
          </div>
          <div className="mt-8 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
             <p>Integration with sovereign early warning systems (SAMUDRA, SACHET) is mapped out via API schemas but requires institutional authentication for active deployment.</p>
          </div>
        </div>
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

function AlertItem({ title, type, severity, time, desc, icon }: any) {
  const getSeverityColor = () => {
    if (severity === 'HIGH') return 'bg-red-50 text-red-700 border-red-100';
    if (severity === 'MEDIUM') return 'bg-orange-50 text-orange-700 border-orange-100';
    return 'bg-blue-50 text-blue-700 border-blue-100';
  };

  const getIconColor = () => {
    if (severity === 'HIGH') return 'bg-red-100 text-red-600';
    if (severity === 'MEDIUM') return 'bg-orange-100 text-orange-600';
    return 'bg-blue-100 text-blue-600';
  };

  return (
    <div className="flex gap-4 p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getIconColor()}`}>
        {icon}
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-1">
          <h4 className="font-bold text-navy-900 text-sm">{title}</h4>
          <span className="text-[10px] text-slate-400 font-medium">{time}</span>
        </div>
        <p className="text-xs text-slate-500 mb-2">{desc}</p>
        <div className="flex gap-2">
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${getSeverityColor()}`}>
            {severity}
          </span>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded border bg-slate-100 text-slate-600 border-slate-200 uppercase">
            {type}
          </span>
        </div>
      </div>
    </div>
  );
}

function ChannelItem({ name, badge, isBuilt }: { name: string, badge: string, isBuilt?: boolean }) {
  return (
    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
      <div className="flex items-center gap-2">
         <Bell className={`w-4 h-4 ${isBuilt ? 'text-emerald-500' : 'text-slate-400'}`} />
         <span className="text-sm font-bold text-navy-900">{name}</span>
      </div>
      <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${isBuilt ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{badge}</span>
    </div>
  );
}
