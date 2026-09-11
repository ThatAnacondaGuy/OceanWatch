import { Bell, User, ChevronDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export function Header() {
  const { data } = useApp();
  
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20 shadow-sm">
       <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-black italic">O</div>
          <div className="flex flex-col">
             <h1 className="text-lg font-black text-navy-900 leading-none">OceanWatch AI</h1>
             <span className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase">Forensic Oil Spill Detection & Vessel Attribution</span>
          </div>
       </div>
       
       <div className="flex items-center gap-6">
          <span className="text-blue-800 font-bold italic text-sm">Government-style demonstration interface</span>
          
          <div className="relative">
             <Bell className="w-5 h-5 text-navy-800 opacity-50" />
          </div>
          
          <div className="flex items-center gap-2 border-l border-slate-200 pl-6 cursor-pointer">
             <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-500">
                <User className="w-4 h-4" />
             </div>
             <div className="flex flex-col">
                <span className="text-xs font-bold text-navy-900 leading-tight">Demo User</span>
                <span className="text-[10px] text-slate-500">Guest Access</span>
             </div>
             <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>
          
          <div className="flex flex-col border-l border-slate-200 pl-6">
             <span className="text-xs font-bold text-navy-900">{data ? data.case.date : 'N/A'}</span>
             <span className="text-[10px] text-slate-500">Scene Reference Time</span>
          </div>
       </div>
    </header>
  );
}
