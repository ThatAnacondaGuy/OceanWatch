import { Link, useLocation } from 'react-router-dom';
import { Home, Activity, AlertTriangle, Navigation, Satellite, BarChart2, Leaf, Bell, Database, Users, HelpCircle, LogOut, FileText } from 'lucide-react';
import clsx from 'clsx';

export function Sidebar() {
  const location = useLocation();

  const links = [
    { to: '/', icon: Home, label: 'Dashboard' },
    { to: '/monitoring', icon: Activity, label: 'Case Monitoring' },
    { to: '/incidents', icon: AlertTriangle, label: 'Spill Incidents' },
    { to: '/vessels', icon: Navigation, label: 'Vessel Tracking' },
    { to: '/satellite', icon: Satellite, label: 'Satellite Data' },
    { to: '/analytics', icon: BarChart2, label: 'Analytics & Reports' },
    { to: '/environment', icon: Leaf, label: 'Environmental Impact' },
    { to: '/alerts', icon: Bell, label: 'Alerts & Notifications', badge: 3 },
    { to: '/cases', icon: FileText, label: 'Case History' },
    { to: '/data-management', icon: Database, label: 'Data Management' },
    { to: '#', icon: Users, label: 'Users & Access', disabled: true }
  ];

  return (
    <div className="w-64 bg-navy-900 text-white flex flex-col h-screen shrink-0 relative overflow-hidden shadow-xl z-30">
      {/* Decorative wave background at bottom */}
      <div className="absolute bottom-0 left-0 w-full h-64 opacity-20 bg-gradient-to-t from-blue-900 to-transparent pointer-events-none" />
      
      <div className="flex-1 py-4 flex flex-col overflow-y-auto z-10 mt-2">
        {links.map(l => {
          const content = (
            <>
               <l.icon className={clsx("w-5 h-5", location.pathname === l.to ? "text-white" : "text-slate-300")} />
               <span className="flex-1">{l.label}</span>
               {l.badge && (
                 <span className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white">{l.badge}</span>
               )}
            </>
          );
          
          const className = clsx(
            "flex items-center gap-3 px-5 py-3 text-sm font-semibold transition-colors border-l-4 mx-2 rounded-r-md mb-1",
            location.pathname === l.to 
              ? "bg-blue-800/80 border-blue-400 text-white shadow-sm" 
              : "border-transparent text-slate-300 hover:bg-navy-800 hover:text-white"
          );

          if (l.disabled) {
            return (
              <div key={l.label} className={clsx(className, "opacity-70 cursor-not-allowed hover:bg-transparent")}>
                 {content}
              </div>
            );
          }
          
          return (
            <Link key={l.to} to={l.to} className={className}>
               {content}
            </Link>
          );
        })}
      </div>

      <div className="p-4 z-10 flex flex-col gap-2 mt-auto">
         <button className="flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:text-white transition-colors rounded hover:bg-navy-800">
            <HelpCircle className="w-4 h-4" /> Help & Support
         </button>
         <button className="flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:text-white transition-colors rounded hover:bg-navy-800 mb-6">
            <LogOut className="w-4 h-4" /> Logout
         </button>
         
         <div className="flex flex-col gap-1 items-start px-2 pb-2">
           <span className="text-[10px] text-slate-400 font-medium">NTRO · SIH · PS-26143</span>
           <span className="text-[10px] text-slate-500">Post-Event Forensic Analysis</span>
         </div>
      </div>
    </div>
  );
}
