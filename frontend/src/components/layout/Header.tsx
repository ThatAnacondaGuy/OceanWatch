import { Bell, User, ChevronDown, Anchor } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export function Header() {
  const { data } = useApp();
  
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20 shadow-sm relative">
       <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 pr-6 border-r border-slate-200">
             <div className="text-slate-400">
               <Anchor className="w-8 h-8" />
             </div>
             <div className="flex flex-col">
                <span className="text-xs font-bold text-navy-900 leading-tight">OceanWatch AI Platform</span>
                <span className="text-[10px] text-slate-500 font-medium">Demonstration Release</span>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-black text-xl italic shadow-md">O</div>
             <div className="flex flex-col">
                <h1 className="text-xl font-black text-navy-900 leading-none tracking-tight">OceanWatch AI</h1>
                <span className="text-xs text-slate-500 font-semibold tracking-wide">Forensic Oil Spill Detection & Vessel Attribution</span>
             </div>
          </div>
       </div>
       
       <div className="flex items-center gap-8">
          <span className="text-blue-700 font-semibold italic text-[13px] tracking-wide">"Cleaner Oceans, Safer Tomorrow"</span>
          
          <div className="relative cursor-pointer">
             <Bell className="w-5 h-5 text-navy-800" />
             <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[8px] font-bold flex items-center justify-center border border-white">3</div>
          </div>
          
          <div className="flex items-center gap-3 border-l border-slate-200 pl-8 cursor-pointer">
             <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-sm">
                <User className="w-4 h-4" />
             </div>
             <div className="flex flex-col">
                <span className="text-xs font-bold text-navy-900 leading-tight">Demo User</span>
                <span className="text-[10px] text-slate-500">Nodal Officer (Ops)</span>
             </div>
             <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>
          
          <div className="flex flex-col border-l border-slate-200 pl-6 w-32">
             <span className="text-xs font-bold text-navy-900">{data ? new Date(data.case.date).toLocaleDateString('en-US', {weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'}) : 'N/A'}</span>
             <span className="text-[10px] text-slate-500">Scene Reference Time</span>
          </div>
       </div>
    </header>
  );
}
