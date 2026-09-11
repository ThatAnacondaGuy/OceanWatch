
import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useApp } from '../../context/AppContext';
import { normalizeAISTime } from '../../utils/ais';
import { ChevronDown } from 'lucide-react';

const SATELLITE_STYLE: any = {
  version: 8,
  sources: {
    'esri-satellite': {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      attribution: 'Tiles © Esri'
    },
    'carto-labels': {
      type: 'raster',
      tiles: ['https://cartodb-basemaps-a.global.ssl.fastly.net/dark_only_labels/{z}/{x}/{y}.png'],
      tileSize: 256
    }
  },
  layers: [
    { id: 'satellite-layer', type: 'raster', source: 'esri-satellite' },
    { id: 'labels-layer', type: 'raster', source: 'carto-labels' }
  ]
};

export default function DashboardMap() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Record<string, maplibregl.Marker>>({});
  const popupRef = useRef<maplibregl.Popup | null>(null);
  
  const { data, selectedVessel, setSelectedVessel, playbackTime, playbackData } = useApp();
  
  const [panelOpen, setPanelOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(true);

  const [layers, setLayers] = useState({
    sar: true,
    sarOpacity: 0.2,
    slick: true,
    driftHeatmap: true,
    driftOrigin: true,
    driftForecast: false,
    vesselSelectedTrack: true,
    vesselOtherTracks: true,
    vesselCurrentPosition: true
  });

  useEffect(() => {
    if (mapRef.current || !data || !mapContainer.current) return;

    const m = new maplibregl.Map({
      container: mapContainer.current,
      style: SATELLITE_STYLE,
      center: [80.34, 13.27],
      zoom: 5.5,
      pitch: 0,
      interactive: true,
      attributionControl: false
    });

    mapRef.current = m;
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');

    m.on('load', () => {

      // Add SAR
      m.addSource('sar-img', {
        type: 'image',
        url: '/api/demo/ennore/sar.png',
        coordinates: [
          [data.sar.bounds.min_lon, data.sar.bounds.max_lat],
          [data.sar.bounds.max_lon, data.sar.bounds.max_lat],
          [data.sar.bounds.max_lon, data.sar.bounds.min_lat],
          [data.sar.bounds.min_lon, data.sar.bounds.min_lat]
        ]
      });
      m.addLayer({
        id: 'sar-layer',
        type: 'raster',
        source: 'sar-img',
        paint: { 'raster-opacity': layers.sarOpacity, 'raster-fade-duration': 0 }
      });

      // Add Slick
      m.addSource('slick', { type: 'geojson', data: '/api/demo/ennore/slick' });
      m.addLayer({
        id: 'slick-fill',
        type: 'fill',
        source: 'slick',
        paint: { 'fill-color': '#ff4500', 'fill-opacity': 0.3 }
      });
      m.addLayer({
        id: 'slick-line',
        type: 'line',
        source: 'slick',
        paint: { 'line-color': '#ff0000', 'line-width': 2 }
      });
      m.addLayer({
        id: 'slick-label',
        type: 'symbol',
        source: 'slick',
        layout: {
            'text-field': 'OIL SPILL DETECTED\n106 px (Relative)',
            'text-font': ['Open Sans Bold'],
            'text-size': 10,
            'text-offset': [0, 1.5]
        },
        paint: {
            'text-color': '#ffffff',
            'text-halo-color': '#ff0000',
            'text-halo-width': 1
        }
      });

      // Slick Centroid Popup
      m.on('click', 'slick-fill', (e: any) => {
        if (popupRef.current) popupRef.current.remove();
        const p = new maplibregl.Popup({ closeButton: false, className: 'custom-popup' })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="background:#0f172a;color:white;padding:10px;border-radius:6px;border:1px solid #ef4444;font-family:system-ui;min-width:200px;">
              <div style="color:#ef4444;font-size:10px;font-weight:900;letter-spacing:1px;margin-bottom:6px;">OIL SPILL DETECTED</div>
              <div style="font-size:11px;display:flex;justify-content:space-between;margin-bottom:2px;"><span style="color:#94a3b8">Area:</span> <strong>106 px relative</strong></div>
              <div style="font-size:11px;display:flex;justify-content:space-between;margin-bottom:2px;"><span style="color:#94a3b8">Validation:</span> <strong style="color:#10b981">PASS</strong></div>
              <div style="font-size:11px;display:flex;justify-content:space-between;margin-bottom:2px;"><span style="color:#94a3b8">Geometry:</span> <strong>Elongated</strong></div>
              <div style="font-size:11px;display:flex;justify-content:space-between;margin-bottom:2px;"><span style="color:#94a3b8">Model:</span> <strong>Attention U-Net</strong></div>
              <div style="font-size:11px;display:flex;justify-content:space-between;"><span style="color:#94a3b8">Wind Gate:</span> <strong style="color:#10b981">PASS</strong></div>
            </div>
          `)
          .addTo(m);
        popupRef.current = p;
      });

      // Add Drift Envelope
      m.addSource('drift', { type: 'geojson', data: '/api/demo/ennore/drift' });
      m.addLayer({
        id: 'drift-fill',
        type: 'fill',
        source: 'drift',
        paint: { 'fill-color': '#06b6d4', 'fill-opacity': 0.15 }
      });
      m.addLayer({
        id: 'drift-line',
        type: 'line',
        source: 'drift',
        paint: { 'line-color': '#06b6d4', 'line-width': 1, 'line-dasharray': [4, 4] }
      });

      // Add Drift Heatmap
      m.addSource('drift-heatmap', {
        type: 'image',
        url: '/api/demo/ennore/drift_heatmap.png',
        coordinates: [
          [data.sar.bounds.min_lon, data.sar.bounds.max_lat],
          [data.sar.bounds.max_lon, data.sar.bounds.max_lat],
          [data.sar.bounds.max_lon, data.sar.bounds.min_lat],
          [data.sar.bounds.min_lon, data.sar.bounds.min_lat]
        ]
      });
      m.addLayer({
        id: 'drift-heatmap-layer',
        type: 'raster',
        source: 'drift-heatmap',
        paint: { 'raster-opacity': 0.45, 'raster-fade-duration': 0 }
      });

      // Add Forward Forecast
      m.addSource('forecast', { type: 'geojson', data: '/api/demo/ennore/forecast' });
      m.addLayer({
        id: 'forecast-fill',
        type: 'fill',
        source: 'forecast',
        paint: { 'fill-color': '#a855f7', 'fill-opacity': 0.15 }
      });
      m.addLayer({
        id: 'forecast-line',
        type: 'line',
        source: 'forecast',
        paint: { 'line-color': '#a855f7', 'line-width': 2, 'line-dasharray': [4, 2] }
      });

      // Add Drift Origin Marker
      if (data?.drift?.origin) {
        const originEl = document.createElement('div');
        originEl.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;">
             <div style="width:16px;height:16px;border:3px solid #00ffff;border-radius:50%;background:rgba(0,255,255,0.3);position:relative;">
                <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:4px;height:4px;background:#00ffff;border-radius:50%;"></div>
             </div>
             <div style="background:rgba(0,0,0,0.7);color:#00ffff;padding:2px 4px;font-size:9px;font-weight:bold;margin-top:4px;border-radius:2px;border:1px solid #00ffff;white-space:nowrap;">
               BACKWARD DRIFT ORIGIN
             </div>
          </div>
        `;
        markersRef.current['__drift_origin__'] = new maplibregl.Marker({ element: originEl, anchor: 'top' })
          .setLngLat([data.drift.origin.lon, data.drift.origin.lat])
          .addTo(m);
      }

      // Add Dynamic Tracks Source
      m.addSource('dynamic-tracks-src', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      m.addSource('dynamic-tracks-future-src', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });

      // Neutral Tracks (past)
      m.addLayer({
        id: 'tracks-neutral',
        type: 'line',
        source: 'dynamic-tracks-src',
        paint: { 'line-color': ['case', ['==', ['get', 'isSelected'], true], '#3b82f6', '#10b981'], 'line-width': ['case', ['==', ['get', 'isSelected'], true], 3, 1], 'line-opacity': 0.6 },
        filter: ['==', ['get', 'type'], 'neutral']
      });

      // Dark Tracks (past)
      m.addLayer({
        id: 'tracks-dark',
        type: 'line',
        source: 'dynamic-tracks-src',
        paint: { 'line-color': '#f59e0b', 'line-width': ['case', ['==', ['get', 'isSelected'], true], 3, 1.5], 'line-dasharray': [4, 4] },
        filter: ['==', ['get', 'type'], 'dark']
      });

      // Source Tracks (past)
      m.addLayer({
        id: 'tracks-source',
        type: 'line',
        source: 'dynamic-tracks-src',
        paint: { 'line-color': '#ef4444', 'line-width': ['case', ['==', ['get', 'isSelected'], true], 4, 2.5] },
        filter: ['==', ['get', 'type'], 'source']
      });

      // Future Trail (Dashed)
      m.addLayer({
        id: 'tracks-future',
        type: 'line',
        source: 'dynamic-tracks-future-src',
        paint: { 'line-color': '#94a3b8', 'line-width': 1.5, 'line-dasharray': [2, 4], 'line-opacity': 0.6 }
      });

      // Vessel Markers
      data?.vessels.forEach((v: any) => {
        const isSource = v.id === data?.attribution?.results[0]?.id;
        const isDark = v.vessel_type === 'Unknown / Dark Vessel';
        const fillColor = isSource ? '#ef4444' : isDark ? '#f59e0b' : '#10b981';
        const strokeColor = isSource ? '#991b1b' : isDark ? '#92400e' : '#047857';
        const el = document.createElement('div');
        el.style.cssText = `position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;z-index:${isSource ? 50 : 20};`;
        
        el.innerHTML = `
          <div class="vessel-label" style="opacity:${isSource ? 1 : 0};font-size:9px;font-weight:800;background:rgba(15,23,42,0.9);color:white;padding:2px 5px;border-radius:3px;margin-bottom:2px;white-space:nowrap;border:1px solid ${fillColor};">${isSource ? 'SOURCE: ' : ''}${v.id.replace('DEMO-', '')}</div>
          <div class="vessel-icon" style="transform:rotate(${v.heading}deg);transform-origin:center;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
             <svg width="18" height="26" viewBox="0 0 24 36" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2">
                <path d="M12 2 L22 12 L18 34 L6 34 L2 12 Z" />
             </svg>
          </div>
        `;
        
        el.addEventListener('mouseenter', () => {
           const lbl = el.querySelector('.vessel-label') as HTMLElement;
           if (lbl) lbl.style.opacity = '1';
        });
        el.addEventListener('mouseleave', () => {
           if (v.id !== data?.attribution?.results[0]?.id && v.id !== selectedVessel) {
               const lbl = el.querySelector('.vessel-label') as HTMLElement;
               if (lbl) lbl.style.opacity = '0';
           }
        });
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          setSelectedVessel(v.id);
        });

        markersRef.current[v.id] = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([v.position.lon, v.position.lat])
          .addTo(m);
      });
    });

    return () => {
      m.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  }, [data]);

  // Sync Layers
  useEffect(() => {
    const m = mapRef.current;
    if (!m || !m.isStyleLoaded()) return;

    if (m.getLayer('sar-layer')) m.setLayoutProperty('sar-layer', 'visibility', layers.sar ? 'visible' : 'none');
    if (m.getLayer('sar-layer')) m.setPaintProperty('sar-layer', 'raster-opacity', layers.sarOpacity);
    
    if (m.getLayer('slick-fill')) m.setLayoutProperty('slick-fill', 'visibility', layers.slick ? 'visible' : 'none');
    if (m.getLayer('slick-line')) m.setLayoutProperty('slick-line', 'visibility', layers.slick ? 'visible' : 'none');
    if (m.getLayer('slick-label')) m.setLayoutProperty('slick-label', 'visibility', layers.slick ? 'visible' : 'none');
    
    if (m.getLayer('drift-heatmap-layer')) m.setLayoutProperty('drift-heatmap-layer', 'visibility', layers.driftHeatmap ? 'visible' : 'none');
    
    if (m.getLayer('drift-fill')) m.setLayoutProperty('drift-fill', 'visibility', layers.driftOrigin ? 'visible' : 'none');
    if (m.getLayer('drift-line')) m.setLayoutProperty('drift-line', 'visibility', layers.driftOrigin ? 'visible' : 'none');
    
    if (m.getLayer('forecast-fill')) m.setLayoutProperty('forecast-fill', 'visibility', layers.driftForecast ? 'visible' : 'none');
    if (m.getLayer('forecast-line')) m.setLayoutProperty('forecast-line', 'visibility', layers.driftForecast ? 'visible' : 'none');
    
    if (markersRef.current['__drift_origin__']) {
       markersRef.current['__drift_origin__'].getElement().style.display = layers.driftOrigin ? 'flex' : 'none';
    }

    if (m.getLayer('tracks-neutral')) m.setLayoutProperty('tracks-neutral', 'visibility', layers.vesselOtherTracks ? 'visible' : 'none');
    if (m.getLayer('tracks-dark')) m.setLayoutProperty('tracks-dark', 'visibility', layers.vesselOtherTracks ? 'visible' : 'none');
    if (m.getLayer('tracks-source')) m.setLayoutProperty('tracks-source', 'visibility', layers.vesselSelectedTrack ? 'visible' : 'none');
    if (m.getLayer('tracks-future')) m.setLayoutProperty('tracks-future', 'visibility', layers.vesselSelectedTrack ? 'visible' : 'none');

    data?.vessels.forEach((v: any) => {
      if (markersRef.current[v.id]) {
         markersRef.current[v.id].getElement().style.display = layers.vesselCurrentPosition ? 'flex' : 'none';
         const isSource = v.id === data?.attribution?.results[0]?.id;
         const lbl = markersRef.current[v.id].getElement().querySelector('.vessel-label') as HTMLElement;
         if (lbl) {
            lbl.style.opacity = (isSource || v.id === selectedVessel) ? '1' : '0';
         }
      }
    });

  }, [layers, data, selectedVessel]);

  // Sync Tracks with Playback
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded() || !playbackData) return;
    
    const pastFeatures: any[] = [];
    const futureFeatures: any[] = [];

    playbackData.forEach((track: any) => {
      const isSource = track.vessel_id === data?.attribution?.results[0]?.id;
      const vObj = data?.vessels.find(v => v.id === track.vessel_id);
      const isDark = vObj?.vessel_type === 'Unknown / Dark Vessel';
      const isSelected = track.vessel_id === selectedVessel;

      const trackType = isSource ? 'source' : isDark ? 'dark' : 'neutral';
      
      const pts = track.history;
      let pastCoords: number[][] = [];
      let futureCoords: number[][] = [];
      
      for (let i = 0; i < pts.length; i++) {
        const ptTime = normalizeAISTime(pts[i].timestamp);
        if (ptTime <= (playbackTime || 0)) {
          pastCoords.push([pts[i].lon, pts[i].lat]);
        } else {
          if (futureCoords.length === 0 && pastCoords.length > 0) {
            futureCoords.push(pastCoords[pastCoords.length - 1]);
          }
          futureCoords.push([pts[i].lon, pts[i].lat]);
        }
      }

      if (pastCoords.length > 1) {
        pastFeatures.push({
          type: 'Feature',
          properties: { vessel_id: track.vessel_id, type: trackType, isSelected },
          geometry: { type: 'LineString', coordinates: pastCoords }
        });
      }
      
      if (futureCoords.length > 1) {
        futureFeatures.push({
          type: 'Feature',
          properties: { vessel_id: track.vessel_id, type: trackType, isSelected },
          geometry: { type: 'LineString', coordinates: futureCoords }
        });
      }

      if (markersRef.current[track.vessel_id] && pastCoords.length > 0) {
         markersRef.current[track.vessel_id].setLngLat(pastCoords[pastCoords.length - 1] as [number, number]);
      }
    });

    const srcPast = mapRef.current.getSource('dynamic-tracks-src') as maplibregl.GeoJSONSource;
    const srcFuture = mapRef.current.getSource('dynamic-tracks-future-src') as maplibregl.GeoJSONSource;
    if (srcPast) srcPast.setData({ type: 'FeatureCollection', features: pastFeatures });
    if (srcFuture) srcFuture.setData({ type: 'FeatureCollection', features: futureFeatures });

  }, [playbackTime, playbackData, data, selectedVessel]);

  return (
    <div className="relative w-full h-full bg-slate-900" id="satmap">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* ── Top Right Controls ── */}
      <div className="absolute top-4 right-4 flex gap-2 z-20">
        <div className="relative">
          <button onClick={() => { setPanelOpen(!panelOpen); setFilterOpen(false); setTimeOpen(false); }} className="bg-white border border-slate-200 text-navy-900 text-xs font-bold px-3 py-1.5 rounded shadow-sm flex items-center gap-1.5 hover:bg-slate-50">
            Layers <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {panelOpen && (
            <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-200 w-48 p-2 flex flex-col gap-1 text-xs">
              <LayerRow label="True Color (Offline)" checked={false} onChange={() => {}} />
              <LayerRow label="Oil Spill (AI)" checked={layers.slick} onChange={(v: boolean) => setLayers({ ...layers, slick: v, sar: v })} />
              <LayerRow label="Drift Origin & Heatmap" checked={layers.driftOrigin} onChange={(v: boolean) => setLayers({ ...layers, driftOrigin: v, driftHeatmap: v })} />
              <LayerRow label="Forward Forecast" checked={layers.driftForecast} onChange={(v: boolean) => setLayers({ ...layers, driftForecast: v })} />
              <LayerRow label="Vessel Tracking" checked={layers.vesselSelectedTrack} onChange={(v: boolean) => {
                 setLayers({ ...layers, vesselSelectedTrack: v, vesselOtherTracks: v, vesselCurrentPosition: v });
              }} />
              <LayerRow label="EEZ Boundaries" checked={false} onChange={() => {}} />
            </div>
          )}
        </div>
        
        <div className="relative">
          <button onClick={() => { setFilterOpen(!filterOpen); setPanelOpen(false); setTimeOpen(false); }} className="bg-white border border-slate-200 text-navy-900 text-xs font-bold px-3 py-1.5 rounded shadow-sm flex items-center gap-1.5 hover:bg-slate-50">
            Filter <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {filterOpen && (
             <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-200 p-3 text-xs text-slate-500 italic w-40 text-center">
                Filters active from Global Timeline
             </div>
          )}
        </div>
        
        <div className="relative">
          <button onClick={() => { setTimeOpen(!timeOpen); setPanelOpen(false); setFilterOpen(false); }} className="bg-white border border-slate-200 text-navy-900 text-xs font-bold px-3 py-1.5 rounded shadow-sm flex items-center gap-1.5 hover:bg-slate-50">
            Case Timeline <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {timeOpen && (
             <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-200 p-2 flex flex-col gap-1 text-xs w-40">
                <button className="text-left px-2 py-1.5 hover:bg-slate-50 font-bold text-navy-900 rounded">Current Demo</button>
                <button className="text-left px-2 py-1.5 hover:bg-slate-50 text-slate-600 rounded">Historical Playback</button>
             </div>
          )}
        </div>
      </div>

      {/* ── Compact Legend ── */}
      <div className="absolute bottom-6 left-4 z-20">
        <button
          onClick={() => setLegendOpen(!legendOpen)}
          className="bg-white border border-slate-200 text-navy-900 text-xs font-bold px-3 py-1.5 rounded shadow-sm flex items-center gap-1.5 hover:bg-slate-50 mb-1"
        >
          {legendOpen ? '▼ Legend' : '▶ Legend'}
        </button>
        {legendOpen && (
          <div className="bg-white/95 backdrop-blur text-slate-800 p-2.5 rounded border border-slate-200 text-[10px] shadow-lg min-w-[160px] space-y-1">
            <LegendItem color="#ff4500" dashed={false} label="Oil Spill" fill />
            <LegendItem color="#06b6d4" dashed label="Drift Origin" fill />
            <LegendItem color="#fb923c" dashed={false} label="Drift Heatmap" fill />
            <LegendItem color="#a855f7" dashed label="Forecast" fill />
            <LegendItem color="#ef4444" dashed={false} label="Source Vessel" />
            <LegendItem color="#f59e0b" dashed label="Dark Vessel" />
            <LegendItem color="#10b981" dashed label="Other Vessels" />
          </div>
        )}
      </div>

      {/* ── Minimap ── */}
      <div className="absolute bottom-6 right-4 z-20 w-32 h-24 bg-slate-800 border-2 border-white rounded shadow-lg overflow-hidden flex items-center justify-center relative pointer-events-none">
         <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/India_location_map.svg/1024px-India_location_map.svg.png" 
              alt="India Map" 
              className="w-full h-full object-cover opacity-70" />
         <div className="absolute bottom-6 right-8 w-6 h-4 border-2 border-red-500 rounded-sm shadow-[0_0_4px_rgba(255,0,0,0.5)] bg-red-500/20"></div>
      </div>
      
      {/* ── Forecast Warning ── */}
      {layers.driftForecast && (
        <div className="absolute top-14 right-4 z-10 bg-amber-100/90 backdrop-blur border border-amber-300 text-amber-800 px-3 py-1.5 rounded text-[10px] font-bold shadow">
          ⚠ DEMONSTRATION FORECAST<br/>
          <span className="font-normal text-[9px]">Model projection anchored to detection time.</span>
        </div>
      )}

      {/* ── Data Provenance Badge ── */}
      <div className="absolute bottom-2 left-2 z-10 bg-black/70 text-white/80 px-2 py-1 rounded text-[8px] font-mono uppercase tracking-widest pointer-events-none">
        Synthetic Demo · OceanWatch AI
      </div>
    </div>
  );
}

function LayerRow({ label, checked, onChange }: any) {
  return (
    <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 rounded px-2 py-1.5 transition-colors">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-blue-600 rounded-full" />
      <span className={checked ? "font-bold text-navy-900" : "font-medium text-slate-700"}>{label}</span>
    </label>
  );
}

function LegendItem({ color, dashed, label, fill }: any) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      {fill ? (
        <div style={{ width: 12, height: 8, background: color, opacity: 0.5, borderRadius: 1, border: `1px solid ${color}` }} />
      ) : (
        <div style={{ width: 12, height: 0, borderTop: `2px ${dashed ? 'dashed' : 'solid'} ${color}` }} />
      )}
      <span>{label}</span>
    </div>
  );
}
