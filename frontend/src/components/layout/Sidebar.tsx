import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Activity, Droplets, Navigation, Satellite, BarChart2, Database, Users, HelpCircle, LogOut } from 'lucide-react';
import clsx from 'clsx';

export function Sidebar() {
  const location = useLocation();

  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/monitoring', icon: Activity, label: 'Live Monitoring' },
    { to: '/incidents', icon: Droplets, label: 'Spill Incidents' },
    { to: '/vessels', icon: Navigation, label: 'Vessel Tracking' },
    { to: '/satellite', icon: Satellite, label: 'Satellite Data' },
    { to: '/analytics', icon: BarChart2, label: 'Analytics & Reports' }
  ];

  const bottomLinks = [
    { to: '#', icon: Database, label: 'Data Management' },
    { to: '#', icon: Users, label: 'Users & Access' }
  ];

  return (
    <div className="w-64 bg-navy-800 text-white flex flex-col h-screen shrink-0 border-r border-navy-700">
      <div className="p-4 flex items-center gap-3 border-b border-navy-700 bg-navy-900 shrink-0 h-16">
         <div className="w-8 h-8 rounded border-2 border-white/20 flex items-center justify-center shrink-0">
            <span className="font-black text-white/50">OW</span>
         </div>
         <div className="flex flex-col">
           <span className="text-[10px] font-bold leading-tight text-slate-300">OceanWatch AI Platform</span>
           <span className="text-[10px] font-bold leading-tight text-slate-300">Technology Demonstration</span>
         </div>
      </div>
      
      <div className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto">
        {links.map(l => (
          <Link key={l.to} to={l.to} className={clsx("flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors border-l-4", location.pathname === l.to ? "bg-blue-900/40 border-blue-500 text-white" : "border-transparent text-slate-400 hover:text-white hover:bg-navy-700")}>
             <l.icon className="w-5 h-5" />
             {l.label}
          </Link>
        ))}
        
        <div className="mt-8">
           {bottomLinks.map(l => (
             <div key={l.label} className="flex items-center gap-3 px-6 py-3 text-sm font-medium border-l-4 border-transparent text-slate-500 cursor-not-allowed">
                <l.icon className="w-5 h-5" />
                {l.label}
             </div>
           ))}
        </div>
      </div>

      <div className="p-4 border-t border-navy-700 flex flex-col gap-2">
         <button className="flex items-center gap-3 px-2 py-2 text-sm text-slate-500 cursor-not-allowed">
            <HelpCircle className="w-4 h-4" /> Help & Support (N/A)
         </button>
         <button className="flex items-center gap-3 px-2 py-2 text-sm text-slate-400 hover:text-white transition-colors">
            <LogOut className="w-4 h-4" /> Exit Demo
         </button>
         <div className="mt-4 pt-4 border-t border-navy-700">
            <p className="text-blue-400 font-bold text-xs uppercase tracking-widest text-center">OceanWatch</p>
            <p className="text-slate-400 text-[10px] uppercase tracking-widest text-center">Synthetic Demo</p>
         </div>
      </div>
    </div>
  );
}
