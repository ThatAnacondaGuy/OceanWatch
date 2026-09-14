import { useEffect, useState, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Search, MapPin, Anchor, Info, ChevronRight, Calendar, Droplet, ArrowRight } from 'lucide-react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';

const DARK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm-layer',
      type: 'raster',
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 19,
      paint: {
        'raster-saturation': -1,
        'raster-brightness-max': 0.2,
        'raster-opacity': 0.9,
      }
    }
  ]
};

export default function SpillIncidentsScreen() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const navigate = useNavigate();

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('All');
  const [stateFilter, setStateFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [evidenceFilter, setEvidenceFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetch('/api/incidents')
      .then(async r => {
        if (!r.ok) {
          const errData = await r.json().catch(() => ({}));
          throw new Error(errData.detail || `HTTP Error ${r.status}`);
        }
        return r.json();
      })
      .then(d => {
        setIncidents(d.data || []);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setError(e.message);
        setLoading(false);
      });
  }, []);

  const filteredIncidents = incidents.filter(i => {
    if (yearFilter !== 'All' && i.year?.toString() !== yearFilter) return false;
    if (stateFilter !== 'All' && (i.state || 'Offshore') !== stateFilter) return false;
    if (typeFilter !== 'All' && (i.incident_type || '') !== typeFilter) return false;
    if (evidenceFilter !== 'All' && (i.historical_evidence_level || '') !== evidenceFilter) return false;
    if (statusFilter !== 'All' && (i.status || '') !== statusFilter) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const n = (i.incident_name || '').toLowerCase();
      const v = (i.vessel_name || '').toLowerCase();
      if (!n.includes(s) && !v.includes(s)) return false;
    }
    return true;
  });

  const years = ['All', ...Array.from(new Set(incidents.map(i => i.year))).filter(Boolean).sort().reverse()];
  const states = ['All', ...Array.from(new Set(incidents.map(i => i.state || 'Offshore'))).filter(Boolean).sort()];
  const types = ['All', ...Array.from(new Set(incidents.map(i => i.incident_type))).filter(Boolean).sort()];
  const evidences = ['All', ...Array.from(new Set(incidents.map(i => i.historical_evidence_level))).filter(Boolean).sort()];
  const statuses = ['All', ...Array.from(new Set(incidents.map(i => i.status))).filter(Boolean).sort()];

  // Stats
  const total = incidents.length;
  const official = incidents.filter(i => i.historical_evidence_level === 'CONFIRMED_OFFICIAL').length;
  const statesCount = states.length - 1;

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current) return;
    
    if (!mapRef.current) {
      const m = new maplibregl.Map({
        container: mapContainer.current,
        style: DARK_STYLE,
        center: [78.9629, 20.5937],
        zoom: 4,
        attributionControl: false
      });
      m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
      mapRef.current = m;
    }
  }, []);

  // Update Markers
  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;

    // Clear old markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    filteredIncidents.filter(i => i.latitude && i.longitude).forEach(inc => {
      const el = document.createElement('div');
      el.className = 'w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full shadow cursor-pointer transition-transform hover:scale-125';
      if (selectedIncident?.incident_id === inc.incident_id) {
         el.className = 'w-5 h-5 bg-blue-500 border-2 border-white rounded-full shadow-lg cursor-pointer scale-110 ring-4 ring-blue-500/30 z-50';
      }
      
      el.onclick = () => {
        setSelectedIncident(inc);
      };

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([inc.longitude, inc.latitude])
        .addTo(m);
        
      markersRef.current.push(marker);
    });
  }, [filteredIncidents, selectedIncident]);

  return (
    <div className="h-full flex flex-col bg-slate-900 text-slate-200">
      {/* HEADER */}
      <div className="bg-navy-950 border-b border-navy-800 p-6 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-white">HISTORICAL OIL-SPILL INCIDENTS</h1>
        <p className="text-slate-400 mt-1">Documented Marine and Coastal Oil-Spill Incidents — India</p>
        <div className="mt-4 p-3 bg-navy-900 rounded border border-navy-700 text-sm flex items-start gap-3 w-fit">
          <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-slate-300 leading-relaxed max-w-4xl">
            Curated from publicly documented sources. Registry coverage is not an exhaustive census of every minor spill.
            The records here represent historical reality and are distinctly separated from synthetic demonstrations.
          </p>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDE: List and Filters */}
        <div className="w-[45%] flex flex-col border-r border-navy-800 bg-navy-900 shadow-sm z-10 min-w-[500px]">
          
          {/* STATS */}
          <div className="p-4 border-b border-navy-800 flex gap-4 bg-navy-900/50">
             <div className="bg-navy-950 p-3 rounded shadow-sm border border-navy-800 flex-1 text-center">
                <div className="text-2xl font-black text-white">{total}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Documented Incidents</div>
             </div>
             <div className="bg-navy-950 p-3 rounded shadow-sm border border-navy-800 flex-1 text-center">
                <div className="text-2xl font-black text-blue-400">{statesCount}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">States Affected</div>
             </div>
             <div className="bg-navy-950 p-3 rounded shadow-sm border border-navy-800 flex-1 text-center">
                <div className="text-2xl font-black text-emerald-400">{official}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Confirmed Official</div>
             </div>
          </div>

          {/* FILTERS */}
          <div className="p-4 border-b border-navy-800 flex flex-wrap gap-2 items-center bg-navy-950">
            <div className="relative flex-1 min-w-[150px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-2 py-1.5 bg-navy-900 border border-navy-700 rounded text-xs text-white focus:outline-none focus:border-blue-500 transition-colors placeholder-slate-500"
              />
            </div>
            <select value={yearFilter} onChange={e => setYearFilter(e.target.value)} className="py-1.5 px-2 bg-navy-900 border border-navy-700 rounded text-xs outline-none text-white focus:border-blue-500">
              {years.map(y => <option key={y} value={y}>{y === 'All' ? 'Year' : y}</option>)}
            </select>
            <select value={stateFilter} onChange={e => setStateFilter(e.target.value)} className="py-1.5 px-2 bg-navy-900 border border-navy-700 rounded text-xs outline-none text-white focus:border-blue-500">
              {states.map(s => <option key={s} value={s}>{s === 'All' ? 'Region' : s}</option>)}
            </select>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="py-1.5 px-2 bg-navy-900 border border-navy-700 rounded text-xs outline-none text-white focus:border-blue-500">
              {types.map(s => <option key={s} value={s}>{s === 'All' ? 'Type' : s}</option>)}
            </select>
            <select value={evidenceFilter} onChange={e => setEvidenceFilter(e.target.value)} className="py-1.5 px-2 bg-navy-900 border border-navy-700 rounded text-xs outline-none text-white focus:border-blue-500">
              {evidences.map(s => <option key={s} value={s}>{s === 'All' ? 'Evidence' : s}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="py-1.5 px-2 bg-navy-900 border border-navy-700 rounded text-xs outline-none text-white focus:border-blue-500">
              {statuses.map(s => <option key={s} value={s}>{s === 'All' ? 'Status' : s}</option>)}
            </select>
          </div>

          {/* LIST */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-navy-900">
            {loading ? (
              <div className="text-center py-10 text-slate-500 font-medium">Loading historical registry...</div>
            ) : error ? (
              <div className="text-center py-10 text-red-400 font-medium">
                <div className="text-lg font-bold mb-2">Historical incident registry unavailable</div>
                <div className="text-xs text-red-300/80">{error}</div>
              </div>
            ) : filteredIncidents.length === 0 ? (
              <div className="text-center py-10 text-slate-500 font-medium">No incidents match the filters.</div>
            ) : (
              filteredIncidents.map(inc => (
                <div 
                  key={inc.incident_id}
                  onClick={() => setSelectedIncident(inc)}
                  className={clsx(
                    "p-4 rounded-lg border cursor-pointer transition-all duration-200",
                    selectedIncident?.incident_id === inc.incident_id 
                      ? "bg-navy-800 border-blue-500 shadow-lg shadow-blue-900/20" 
                      : "bg-navy-950 border-navy-700 hover:border-slate-600 hover:bg-navy-900"
                  )}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-white">{inc.incident_name}</h3>
                    <span className="text-[9px] font-black px-2 py-1 rounded bg-navy-800 text-slate-300 border border-navy-700">{inc.status}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-500" /> {inc.incident_date}</div>
                    <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-500" /> {inc.state || 'Offshore'}</div>
                    <div className="flex items-center gap-1.5"><Droplet className="w-3.5 h-3.5 text-slate-500" /> {inc.quantity_spilled ? `${inc.quantity_spilled} ${inc.quantity_units}` : 'Quantity Unknown'}</div>
                    <div className="flex items-center gap-1.5"><Anchor className="w-3.5 h-3.5 text-slate-500" /> <span className="truncate">{inc.vessel_name || 'Unknown'}</span></div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-navy-800 flex items-center justify-between">
                    <span className={clsx("text-[9px] font-bold px-2 py-0.5 rounded", 
                      inc.historical_evidence_level === 'CONFIRMED_OFFICIAL' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50' : 'bg-amber-900/30 text-amber-400 border border-amber-800/50'
                    )}>
                      {inc.historical_evidence_level.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                      {inc.incident_type} <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT SIDE: Map & Details */}
        <div className="w-[55%] flex flex-col relative bg-navy-950">
          <div ref={mapContainer} className="flex-1 w-full h-full" />

          {/* Details Overlay */}
          {selectedIncident && (
            <div className="absolute bottom-6 left-6 right-6 bg-navy-900 rounded-xl shadow-2xl border border-navy-700 z-[1000] overflow-hidden flex flex-col max-h-[60%]">
              <div className="bg-navy-950 p-5 border-b border-navy-800 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedIncident.incident_name}</h2>
                  <div className="text-xs text-slate-400 mt-1 font-mono tracking-widest">{selectedIncident.incident_id}</div>
                </div>
                <button 
                  onClick={() => {
                    if (selectedIncident.incident_id === 'IND-OS-2017-001') {
                      navigate('/demo/ennore');
                    } else {
                      alert('Investigation view is currently unavailable for this historical incident. (Placeholder for temporal reconstruction)');
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded text-xs font-bold transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/50"
                >
                  VIEW INVESTIGATION <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 overflow-y-auto text-sm grid grid-cols-2 gap-8 bg-navy-900">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-navy-800 pb-2">Incident Details</h4>
                  <table className="w-full text-xs text-left">
                    <tbody className="divide-y divide-navy-800">
                      <tr><td className="py-2 text-slate-500 w-28">Date</td><td className="py-2 text-slate-200 font-medium">{selectedIncident.incident_date}</td></tr>
                      <tr><td className="py-2 text-slate-500">Location</td><td className="py-2 text-slate-200 font-medium">{selectedIncident.location_description}</td></tr>
                      <tr><td className="py-2 text-slate-500">Coordinates</td><td className="py-2 text-slate-200 font-medium font-mono">{selectedIncident.latitude}°, {selectedIncident.longitude}°</td></tr>
                      <tr><td className="py-2 text-slate-500">Cause</td><td className="py-2 text-slate-200 font-medium">{selectedIncident.cause}</td></tr>
                      <tr><td className="py-2 text-slate-500">Vessel</td><td className="py-2 text-slate-200 font-medium">{selectedIncident.vessel_name || 'N/A'}</td></tr>
                      <tr><td className="py-2 text-slate-500">Pollutant</td><td className="py-2 text-slate-200 font-medium">{selectedIncident.pollutant_type}</td></tr>
                      <tr><td className="py-2 text-slate-500">Quantity</td><td className="py-2 text-slate-200 font-medium">{selectedIncident.quantity_spilled ? `${selectedIncident.quantity_spilled} ${selectedIncident.quantity_units}` : 'Unknown'}</td></tr>
                    </tbody>
                  </table>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-navy-800 pb-2">Provenance & Evidence</h4>
                  <div className="mb-4">
                    <span className={clsx("text-[10px] font-bold px-2.5 py-1 rounded border block w-fit mb-1", 
                      selectedIncident.historical_evidence_level === 'CONFIRMED_OFFICIAL' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50' : 'bg-amber-900/30 text-amber-400 border-amber-800/50'
                    )}>
                      {selectedIncident.historical_evidence_level.replace(/_/g, ' ')}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1.5 uppercase font-medium tracking-wide">Status: <span className="text-blue-400">{selectedIncident.provenance_status.replace(/_/g, ' ')}</span></p>
                  </div>
                  
                  <div className="bg-navy-950 p-3 rounded border border-navy-800 text-xs text-slate-300 mb-4 shadow-inner">
                    <strong className="text-slate-500 block mb-1">Primary Source</strong>
                    {selectedIncident.primary_source}
                  </div>
                  
                  {selectedIncident.documented_sources && selectedIncident.documented_sources.length > 0 && (
                    <div className="text-xs">
                      <strong className="text-slate-500 block mb-2">Documented Sources</strong>
                      <ul className="flex flex-col gap-2 list-none">
                        {selectedIncident.documented_sources.map((src: any, idx: number) => (
                          <li key={idx} className="bg-navy-800/50 p-2 rounded border border-navy-800 flex flex-col gap-1">
                            <a href={src.source_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline font-medium leading-tight">
                              {src.source_title}
                            </a>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wide">{src.organization} · {src.publication_date}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedIncident.notes && (
                    <div className="mt-4 text-xs bg-blue-950 border border-blue-900/50 p-3 rounded text-blue-200 flex items-start gap-2 shadow-inner">
                      <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
                      <p className="leading-relaxed opacity-90">{selectedIncident.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
