import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useApp } from '../../context/AppContext';
import { Search, ShieldAlert, AlertTriangle } from 'lucide-react';

export function AppShell({ children }: { children: ReactNode }) {
  const { loading, error, data } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <Search className="w-8 h-8 animate-spin text-blue-400" />
          <p className="tracking-widest uppercase text-sm font-bold">Loading OceanWatch Case Data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center text-red-400">
        <div className="flex flex-col items-center gap-4">
          <ShieldAlert className="w-12 h-12" />
          <p className="tracking-widest uppercase font-bold">{error || "OceanWatch backend unavailable"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans overflow-hidden">
      <Header />
      
      {/* Persistent Demo Disclaimer */}
      <div className="bg-amber-50 border-b border-amber-200 px-6 py-1.5 flex items-center justify-center gap-2 text-[10px] text-amber-800 font-bold uppercase tracking-wider shrink-0 z-20 shadow-sm relative">
         <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
         <span className="truncate"><span className="font-black">DEMONSTRATION MODE:</span> Ennore historical context. AIS trajectories synthetically reconstructed for pipeline validation. Do not treat as historical forensic evidence.</span>
      </div>
      
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        
        <div className="flex flex-col flex-1 overflow-hidden relative">
          <main className="flex-1 overflow-y-auto flex flex-col relative bg-slate-100/50">
             {children}
          </main>
          
          {/* Footer */}
          <footer className="h-8 bg-white border-t border-slate-200 px-6 flex items-center justify-between text-[10px] text-slate-500 shrink-0 z-10 relative">
             <span>OceanWatch AI: Forensic Oil Spill Detection & Vessel Attribution | Demonstration Release</span>
             <span className="font-bold text-navy-800 flex items-center gap-2">NTRO Problem Statement 26143 · Smart India Hackathon <div className="w-4 h-4 bg-blue-100 text-blue-600 flex items-center justify-center rounded-sm">≈</div></span>
          </footer>
        </div>
      </div>
    </div>
  );
}
