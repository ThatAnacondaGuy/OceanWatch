import { useApp } from '../context/AppContext';
import { AlertCircle, Info, History } from 'lucide-react';

export default function CaseHistoryScreen() {
  const { data } = useApp();

  if (!data) return null;
  const currentCase = data.case;
  const mainVessel = data.attribution.results[0];

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto overflow-x-hidden p-4 gap-4">
      <div className="flex gap-4 flex-1">
        {/* MAIN PANEL */}
        <div className="flex-[2.2] flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col flex-1">
            <div className="flex items-center gap-2 mb-4">
               <History className="w-5 h-5 text-navy-900" />
               <h2 className="font-black text-navy-900 text-lg">Investigation Cases</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                    <th className="p-3 font-bold">Case ID</th>
                    <th className="p-3 font-bold">Date</th>
                    <th className="p-3 font-bold">Location</th>
                    <th className="p-3 font-bold">Status</th>
                    <th className="p-3 font-bold">Candidates</th>
                    <th className="p-3 font-bold">Top Match Score</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {/* Real Demo Data Row */}
                  <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer bg-blue-50/30">
                    <td className="p-3 font-bold text-navy-900">ENNORE-2017-DEMO</td>
                    <td className="p-3 text-slate-600">28 Jan 2017</td>
                    <td className="p-3 text-slate-600">{currentCase.location}</td>
                    <td className="p-3">
                      <span className="bg-red-50 text-red-600 font-bold px-2 py-1 rounded text-[10px] uppercase border border-red-100">
                        Active
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">5</td>
                    <td className="p-3 font-bold text-navy-900">{(mainVessel.attribution_score * 100).toFixed(1)}%</td>
                  </tr>
                  
                  {/* Placeholder Rows */}
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <td className="p-3 font-medium text-slate-400">MUMBAI-2023-014</td>
                    <td className="p-3 text-slate-400">12 Nov 2023</td>
                    <td className="p-3 text-slate-400">Mumbai High</td>
                    <td className="p-3">
                      <span className="bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded text-[10px] uppercase border border-slate-200">
                        Closed
                      </span>
                    </td>
                    <td colSpan={2} className="p-3 text-xs text-slate-400 italic text-center">
                      No additional cases in demo dataset
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <td className="p-3 font-medium text-slate-400">KOCHI-2023-089</td>
                    <td className="p-3 text-slate-400">05 Sep 2023</td>
                    <td className="p-3 text-slate-400">Kochi Port Limits</td>
                    <td className="p-3">
                      <span className="bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded text-[10px] uppercase border border-slate-200">
                        Resolved
                      </span>
                    </td>
                    <td colSpan={2} className="p-3 text-xs text-slate-400 italic text-center">
                      No additional cases in demo dataset
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800">
             <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
             <div className="text-sm">
                <p className="font-bold mb-1">Important Disclaimer</p>
                <p className="text-xs">Case history records are for analyst reference only. Prior investigation records do not constitute evidence of culpability in current or future cases.</p>
             </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
            <h2 className="font-black text-navy-900 text-lg mb-4">Vessel Investigation History</h2>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg mb-4">
               <div className="text-xs text-slate-500 mb-1">Currently Selected Vessel</div>
               <div className="font-bold text-navy-900">{mainVessel.id}</div>
               <div className="text-xs text-slate-500 mt-2">Vessel Type: Oil Tanker</div>
            </div>
            
            <h3 className="font-bold text-sm text-navy-900 mb-3">Prior Appearances</h3>
            <div className="flex flex-col gap-2">
               <div className="text-xs p-3 bg-slate-50 border border-slate-100 rounded text-slate-600 italic text-center">
                  No prior investigation records found for this vessel in demo dataset.
               </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col flex-1">
             <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-blue-500" />
                <h3 className="font-black text-navy-900 text-sm">Historical Attribution Context</h3>
             </div>
             <p className="text-xs text-slate-600 leading-relaxed">
               The AI Agent Package utilizes MMSI lookup concepts to cross-reference vessels against global maritime databases.
               While historical appearances in investigation zones are logged, the attribution model strictly prioritizes spatiotemporal alignment and physical drift evidence over historical priors to ensure objective, data-driven analysis.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
