import { Bell, ChevronDown, Shield } from 'lucide-react';

export function Header() {
  
  return (
    <header className="h-[72px] bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20 shadow-sm relative w-full">
       <div className="flex items-center gap-6 h-full">
          {/* Government/Identity Area */}
          <div className="flex items-center gap-3 pr-6 border-r border-slate-200 h-full py-3">
             <div className="w-10 h-10 flex items-center justify-center text-slate-700 bg-slate-50 rounded-full border border-slate-200">
               <Shield className="w-6 h-6" />
             </div>
             <div className="flex flex-col justify-center">
                <span className="text-[13px] font-black text-navy-900 leading-tight">OceanWatch AI Platform</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Government-Style Demo</span>
             </div>
          </div>
          
          {/* OceanWatch AI Branding */}
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md overflow-hidden relative">
                {/* stylized wave graphic icon */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-700" />
                <div className="w-6 h-6 border-[3px] border-white rounded-full z-10 flex items-center justify-center">
                   <div className="w-2.5 h-2.5 bg-white rounded-full" />
                </div>
             </div>
             <div className="flex flex-col">
                <h1 className="text-xl font-black text-navy-900 leading-none tracking-tight">OceanWatch AI</h1>
                <span className="text-[11px] text-slate-500 font-bold tracking-wide uppercase mt-0.5">Forensic Oil Spill Detection & Vessel Attribution</span>
             </div>
          </div>
       </div>
       
       <div className="flex items-center gap-6">
          <span className="text-blue-700 font-bold italic text-sm tracking-wide mr-4">"Cleaner Oceans, Safer Tomorrow"</span>
          
          <div className="relative cursor-pointer hover:bg-slate-50 p-2 rounded-full transition-colors">
             <Bell className="w-5 h-5 text-slate-600" />
             <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[8px] font-bold flex items-center justify-center border border-white">3</div>
          </div>
          
          <div className="flex items-center gap-3 pl-4 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors border-l border-slate-200">
             <div className="w-9 h-9 bg-navy-900 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                DU
             </div>
             <div className="flex flex-col">
                <span className="text-sm font-bold text-navy-900 leading-tight">Demo User</span>
                <span className="text-[11px] text-slate-500">Nodal Officer (Ops)</span>
             </div>
             <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
          </div>
       </div>
    </header>
  );
}
