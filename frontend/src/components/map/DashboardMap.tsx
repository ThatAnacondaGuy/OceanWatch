import { getVesselStateAtTime } from '../../utils/ais';
import { useEffect, useRef, useState, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useApp } from '../../context/AppContext';
import { ChevronDown, Droplet } from 'lucide-react';

const DARK_STYLE: any = {
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap'
    }
  },
  layers: [
    {
      id: 'osm-layer',
      type: 'raster',
      source: 'osm-tiles',
      paint: {
        'raster-saturation': -1,
        'raster-brightness-max': 0.2,
        'raster-opacity': 0.9,
      }
    }
  ]
};

export default function DashboardMap() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Record<string, maplibregl.Marker>>({});
  
  const { data, selectedVessel, setSelectedVessel, playbackData, playbackTime } = useApp();
  
  const [panelOpen, setPanelOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(true);

  const [layers, setLayers] = useState({
    sar: true,
    sarOpacity: 0.20,
    unet: true,
    unetOpacity: 0.25,
    slick: true,
    slickOpacity: 0.60,
    driftHeatmap: true,
    driftHeatmapOpacity: 0.35,
    driftOrigin: true,
    driftForecast: false,
    forecastOpacity: 0.45,
    vesselTracks: true,
    vesselTrackOpacity: 0.85
  });

  // Safe coordinates
  const boundsCoords = useMemo((): [[number, number], [number, number], [number, number], [number, number]] | null => {
    if (!data?.sar?.bounds) return null;
    const b = data.sar.bounds;
    return [
      [b.min_lon, b.max_lat],
      [b.max_lon, b.max_lat],
      [b.max_lon, b.min_lat],
      [b.min_lon, b.min_lat]
    ];
  }, [data]);

  useEffect(() => {
    if (mapRef.current || !data || !mapContainer.current || !boundsCoords) return;

    const m = new maplibregl.Map({
      container: mapContainer.current,
      style: DARK_STYLE,
      // Center/zoom will be set dynamically via fitBounds
      pitch: 0,
      interactive: true,
      attributionControl: false
    });

    mapRef.current = m;
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');

      // COMPUTE GEOGRAPHIC BOUNDS DYNAMICALLY
      const bounds = new maplibregl.LngLatBounds();
      // Slick
      bounds.extend([data.slick.centroid.lon, data.slick.centroid.lat]);
      // Drift
      bounds.extend([data.drift.origin.lon, data.drift.origin.lat]);
      // Coastal context (West)
      bounds.extend([80.25, 13.2]);
      // Offshore context (East)
      bounds.extend([80.65, 13.2]);
      // All Vessels
      data.vessels.forEach((v: any) => {
        const state = getVesselStateAtTime(v.id, playbackTime, playbackData, data.vessels, data.attribution);
        if (state && state.lon && state.lat) {
          bounds.extend([state.lon, state.lat]);
        }
      });
      // Apply FitBounds
      m.fitBounds(bounds, { padding: { top: 120, bottom: 160, left: 320, right: 120 }, duration: 0 });


    m.on('load', () => {
      
      // 3. SAR raster
      m.addSource('sar-img', { type: 'image', url: '/api/assets/artifacts/demo/ennore/sar_preview.png', coordinates: boundsCoords });
      m.addLayer({ id: 'sar-layer', type: 'raster', source: 'sar-img', paint: { 'raster-opacity': layers.sarOpacity, 'raster-fade-duration': 0 } });

      // 4. U-Net / model raster
      m.addSource('unet-img', { type: 'image', url: '/api/assets/artifacts/demo/ennore/u_net_probability.png', coordinates: boundsCoords });
      m.addLayer({ id: 'unet-layer', type: 'raster', source: 'unet-img', paint: { 'raster-opacity': layers.unetOpacity, 'raster-fade-duration': 0 } });

      // 5. Drift heatmap
      m.addSource('drift-heatmap', { type: 'image', url: '/api/assets/artifacts/demo/ennore/drift_heatmap.png', coordinates: boundsCoords });
      m.addLayer({ id: 'drift-heatmap-layer', type: 'raster', source: 'drift-heatmap', paint: { 'raster-opacity': layers.driftHeatmapOpacity, 'raster-fade-duration': 0 } });

      // 6. Drift uncertainty
      m.addSource('drift-uncertainty', { type: 'geojson', data: '/api/assets/artifacts/demo/ennore/drift_uncertainty.geojson' });
      m.addLayer({ id: 'drift-uncertainty-fill', type: 'fill', source: 'drift-uncertainty', paint: { 'fill-color': '#00ffff', 'fill-opacity': 0.15 } });
      m.addLayer({ id: 'drift-uncertainty-line', type: 'line', source: 'drift-uncertainty', paint: { 'line-color': '#00ffff', 'line-width': 1, 'line-dasharray': [2, 2], 'line-opacity': 0.6 } });

      // 7. Forward forecast
      m.addSource('forecast', { type: 'geojson', data: '/api/assets/artifacts/demo/ennore/forward_forecast.geojson' });
      m.addLayer({ id: 'forecast-fill', type: 'fill', source: 'forecast', paint: { 'fill-color': '#ff00ff', 'fill-opacity': 0.15 } });
      m.addLayer({ id: 'forecast-line', type: 'line', source: 'forecast', paint: { 'line-color': '#ff00ff', 'line-width': 2, 'line-dasharray': [4, 2] } });

      // 8. Slick polygon (Actual Detection)
      m.addSource('slick', { type: 'geojson', data: '/api/assets/artifacts/demo/ennore/detected_slick.geojson' });
      m.addLayer({ id: 'slick-glow', type: 'line', source: 'slick', paint: { 'line-color': '#ff4500', 'line-width': 8, 'line-opacity': 0.3, 'line-blur': 4 } });
      m.addLayer({ id: 'slick-fill', type: 'fill', source: 'slick', paint: { 'fill-color': '#ff2200', 'fill-opacity': layers.slickOpacity } });
      m.addLayer({ id: 'slick-line', type: 'line', source: 'slick', paint: { 'line-color': '#ff2200', 'line-width': 2.5 } });

      // Calculate simple bbox for Slick Bracket (Fake bounding box)
      // Ennore Slick is roughly [80.3464, 13.1279] to [80.3507, 13.1367]
      const minX = 80.346, minY = 13.1275, maxX = 80.351, maxY = 13.1375;
      const bracketLen = 0.001;
      const bracketGeojson = {
        type: 'FeatureCollection',
        features: [
          // Top Left
          { type: 'Feature', geometry: { type: 'LineString', coordinates: [[minX, minY+bracketLen], [minX, minY], [minX+bracketLen, minY]] } },
          // Top Right
          { type: 'Feature', geometry: { type: 'LineString', coordinates: [[maxX-bracketLen, minY], [maxX, minY], [maxX, minY+bracketLen]] } },
          // Bottom Right
          { type: 'Feature', geometry: { type: 'LineString', coordinates: [[maxX, maxY-bracketLen], [maxX, maxY], [maxX-bracketLen, maxY]] } },
          // Bottom Left
          { type: 'Feature', geometry: { type: 'LineString', coordinates: [[minX+bracketLen, maxY], [minX, maxY], [minX, maxY-bracketLen]] } }
        ]
      };
      
      m.addSource('slick-bbox', { type: 'geojson', data: bracketGeojson as any });
      m.addLayer({ id: 'slick-bbox-line', type: 'line', source: 'slick-bbox', paint: { 'line-color': '#ff2200', 'line-width': 2, 'line-opacity': 0.8 } });

      // Slick Centroid Label + Marker
      const slickEl = document.createElement('div');
      slickEl.style.cursor = 'pointer';
      slickEl.innerHTML = `
        <div style="background: rgba(255,34,0,0.8); width: 6px; height: 6px; border-radius: 50%; transform: translate(-50%, -50%);"></div>
        <div style="position: absolute; margin-top: -10px; margin-left: 8px; background: rgba(0,0,0,0.6); border: 1px solid rgba(255,34,0,0.4); padding: 2px 4px; border-radius: 3px; pointer-events: none; white-space: nowrap;">
          <div style="color: #ff2200; font-weight: 600; font-size: 10px;">DETECTED OIL SLICK <span style="color:#aaa;font-weight:normal;">${data.slick.area}px</span></div>
        </div>
      `;
      const popupHtml = `
        <div style="font-family: system-ui; font-size: 11px; color: #1e293b; min-width: 150px; padding: 4px;">
          <div style="font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 4px;">Detected Oil Slick</div>
          <div><b>Area:</b> ${data.slick.area} px (Relative)</div>
          <div><b>Geometry:</b> Irregular Polygon</div>
          <div><b>Validation:</b> ${data.slick.validation_status}</div>
          <div><b>Model:</b> ATTENTION U-NET</div>
        </div>
      `;
      new maplibregl.Marker({ element: slickEl })
        .setLngLat([data.slick.centroid.lon, data.slick.centroid.lat])
        .setPopup(new maplibregl.Popup({ offset: 10, closeButton: false }).setHTML(popupHtml))
        .addTo(m);

      // Drift Origin Target
      const originEl = document.createElement('div');
      originEl.innerHTML = `
        <div style="position: relative;">
          <div style="position: absolute; border: 1px dashed #00ffff; width: 14px; height: 14px; border-radius: 50%; transform: translate(-50%, -50%); pointer-events: none;"></div>
          <div style="position: absolute; width: 4px; height: 4px; background: #00ffff; border-radius: 50%; transform: translate(-50%, -50%); pointer-events: none;"></div>
          <div style="position: absolute; top: 6px; left: 8px; background: rgba(0,0,0,0.5); border: 1px solid rgba(0,255,255,0.3); padding: 2px 4px; border-radius: 3px; white-space: nowrap; pointer-events: none;">
            <div style="color: #00ffff; font-weight: 600; font-size: 9px;">BACKWARD ORIGIN</div>
          </div>
        </div>
      `;
      new maplibregl.Marker({ element: originEl })
        .setLngLat([data.drift.origin.lon, data.drift.origin.lat])
        .addTo(m);

      // 10. Vessel Tracks
      m.addSource('vessel-tracks', { type: 'geojson', data: '/api/assets/artifacts/demo/ennore/ais_tracks.geojson' });
      // Source vessel track (red)
      m.addLayer({
        id: 'vessel-tracks-source',
        type: 'line',
        source: 'vessel-tracks',
        filter: ['==', 'mmsi', 'DEMO-MMSI-001'],
        paint: { 'line-color': '#ff3333', 'line-width': 3, 'line-opacity': layers.vesselTrackOpacity, 'line-dasharray': [2, 1] }
      });
      // Dark vessel track (amber)
      m.addLayer({
        id: 'vessel-tracks-dark',
        type: 'line',
        source: 'vessel-tracks',
        filter: ['==', 'mmsi', 'DEMO-RADAR-005'],
        paint: { 'line-color': '#ffb700', 'line-width': 2, 'line-opacity': layers.vesselTrackOpacity, 'line-dasharray': [3, 2] }
      });
      // Normal vessels (green/blue)
      m.addLayer({
        id: 'vessel-tracks-normal',
        type: 'line',
        source: 'vessel-tracks',
        filter: ['all', ['!=', 'mmsi', 'DEMO-MMSI-001'], ['!=', 'mmsi', 'DEMO-RADAR-005']],
        paint: { 'line-color': '#00ff88', 'line-width': 1.5, 'line-opacity': layers.vesselTrackOpacity * 0.7 }
      });

      // Environmental Vectors (Subtle)
      const windEl = document.createElement('div');
      windEl.innerHTML = `<div style="color: #aaa; font-size: 9px; font-weight: 500; opacity: 0.7;">WIND ↗</div>`;
      new maplibregl.Marker({ element: windEl }).setLngLat([80.32, 13.20]).addTo(m);

      // Source Relationship Line
      m.addSource('source-relationship', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [[data.drift.origin.lon, data.drift.origin.lat], [80.4225, 13.295]] // roughly pointing to MMSI-001
          }
        }
      });
      m.addLayer({
        id: 'source-relationship-line',
        type: 'line',
        source: 'source-relationship',
        paint: { 'line-color': '#ff3333', 'line-width': 1, 'line-dasharray': [4, 4], 'line-opacity': 0.4 }
      });
    });
  }, [data, boundsCoords]); // Init once

  // Dynamic layers opacity and visibility
  useEffect(() => {
    if (!mapRef.current) return;
    const m = mapRef.current;
    
    const setVis = (id: string, vis: boolean) => {
      if (m.getLayer(id)) m.setLayoutProperty(id, 'visibility', vis ? 'visible' : 'none');
    };
    const setOp = (id: string, op: number, type: 'raster' | 'fill' | 'line') => {
      if (m.getLayer(id)) m.setPaintProperty(id, `${type}-opacity`, op);
    };

    setVis('sar-layer', layers.sar);
    setOp('sar-layer', layers.sarOpacity, 'raster');

    setVis('unet-layer', layers.unet);
    setOp('unet-layer', layers.unetOpacity, 'raster');

    setVis('slick-glow', layers.slick);
    setVis('slick-fill', layers.slick);
    setVis('slick-line', layers.slick);
    // slick bbox removed for cleaner visual
    if(layers.slick) setOp('slick-fill', layers.slickOpacity, 'fill');

    setVis('drift-heatmap-layer', layers.driftHeatmap);
    setOp('drift-heatmap-layer', layers.driftHeatmapOpacity, 'raster');

    setVis('drift-uncertainty-fill', layers.driftOrigin);
    setVis('drift-uncertainty-line', layers.driftOrigin);

    setVis('forecast-fill', layers.driftForecast);
    setVis('forecast-line', layers.driftForecast);
    if(layers.driftForecast) setOp('forecast-fill', layers.forecastOpacity, 'fill');

    setVis('vessel-tracks-source', layers.vesselTracks);
    setVis('vessel-tracks-dark', layers.vesselTracks);
    setVis('vessel-tracks-normal', layers.vesselTracks);

  }, [layers]);

  // Vessels Marker Sync
  useEffect(() => {
    if (!mapRef.current || !data) return;
    const m = mapRef.current;
    const vessels = data.vessels;

    vessels.forEach((v: any) => {
            const isSelected = selectedVessel === v.id;
      const isSource = v.id === 'DEMO-MMSI-001';
      const isDark = v.id === 'DEMO-RADAR-005';

      let markerColor = '#00ff88'; // normal green
      if (isSource) markerColor = '#ff3333';
      else if (isDark) markerColor = '#ffb700';
      
      const scale = isSelected ? 1.3 : (isSource ? 1.1 : 1.0);
      const strokeWidth = isSelected ? 3 : 1.5;
      const strokeColor = isSelected ? '#ffffff' : '#000000';

      const state = getVesselStateAtTime(v.id, playbackTime, playbackData, data.vessels, data.attribution);
      if (!state || !state.hasValidTelemetry) {
        if (markersRef.current[v.id]) markersRef.current[v.id].getElement().style.display = 'none';
        return;
      }

      if (markersRef.current[v.id]) markersRef.current[v.id].getElement().style.display = 'block';

      const rotation = state.heading || 0;
      const pos = { lat: state.lat, lon: state.lon }; console.log("VESSEL_POS", v.id, pos.lon, pos.lat);

      // Real Ship SVG (Directional)
      const svg = `
        <svg width="24" height="24" viewBox="0 0 24 24" style="transform: rotate(${rotation}deg) scale(${scale}); transition: transform 0.2s; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
          <path d="M12 2 L20 20 L12 17 L4 20 Z" fill="${markerColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linejoin="round"/>
        </svg>
      `;
      
      const labelHtml = `
        <div style="
          position: absolute; 
          left: 12px; top: -12px; 
          background: rgba(0,0,0,0.7); 
          color: ${markerColor}; 
          border: 1px solid ${markerColor}; 
          border-radius: 3px; 
          padding: 2px 4px; 
          font-size: 9px; 
          font-weight: 600; 
          white-space: nowrap;
          pointer-events: none;
          box-shadow: 0 1px 3px rgba(0,0,0,0.5);
          display: ${(isSelected || isSource || isDark) ? 'block' : 'none'};
        ">
          ${isSource ? 'SOURCE #1' : isDark ? 'DARK VESSEL' : v.id}
        </div>
      `;

      const el = document.createElement('div');
      el.style.position = 'relative';
      el.style.cursor = 'pointer';
      // Use CSS hover to show label if not already block
      if (!isSelected && !isSource && !isDark) {
         const style = document.createElement('style');
         style.innerHTML = `
           .vessel-lbl-${v.id} { display: none; }
           .vessel-wrap-${v.id}:hover .vessel-lbl-${v.id} { display: block !important; }
         `;
         el.appendChild(style);
         el.innerHTML += `<div class="vessel-wrap-${v.id}">${svg}<div class="vessel-lbl-${v.id}" style="position:absolute;left:14px;top:-14px;background:rgba(0,0,0,0.8);color:#fff;border:1px solid #aaa;border-radius:4px;padding:2px 6px;font-size:10px;white-space:nowrap;z-index:999;">${v.id}</div></div>`;
      } else {
         el.innerHTML = svg + labelHtml;
      }
      
      el.onclick = () => {
        setSelectedVessel(isSelected ? null : v.id);
        m.flyTo({ center: [pos.lon, pos.lat], zoom: Math.max(m.getZoom(), 11) });
      };

      if (!markersRef.current[v.id]) {
        markersRef.current[v.id] = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([pos.lon, pos.lat])
          .addTo(m);
      } else {
        markersRef.current[v.id].setLngLat([pos.lon, pos.lat]);
        const oldEl = markersRef.current[v.id].getElement();
        oldEl.innerHTML = el.innerHTML;
        oldEl.onclick = el.onclick;
      }
    });
    
  }, [data, playbackData, selectedVessel, setSelectedVessel]);

  return (
    <div className="relative w-full h-full bg-navy-900 overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Top Right Controls */}
      <div className="absolute top-4 right-4 flex space-x-2 z-10">
        
        {/* Layers */}
        <div className="relative">
          <button 
            onClick={() => { setPanelOpen(!panelOpen); setFilterOpen(false); setTimeOpen(false); }}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-900/95 text-slate-200 border border-slate-700 rounded shadow-lg hover:bg-slate-800 font-medium text-sm transition-colors"
          >
            <span>Layers</span>
            <ChevronDown size={16} />
          </button>
          
          {panelOpen && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-slate-900/95 text-slate-200 rounded shadow-2xl p-4 border border-slate-700 flex flex-col space-y-3 z-50">
              <label className="flex items-center space-x-2 text-sm text-slate-300 font-medium cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                  checked={layers.sar} onChange={e => setLayers({ ...layers, sar: e.target.checked })} />
                <span>SAR Background</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-slate-300 font-medium cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                  checked={layers.unet} onChange={e => setLayers({ ...layers, unet: e.target.checked })} />
                <span>U-Net Model Mask</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-slate-300 font-medium cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                  checked={layers.slick} onChange={e => setLayers({ ...layers, slick: e.target.checked })} />
                <span>Oil Spill Polygon</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-slate-300 font-medium cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                  checked={layers.driftOrigin} onChange={e => setLayers({ ...layers, driftOrigin: e.target.checked })} />
                <span>Backward Drift Origin</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-slate-300 font-medium cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                  checked={layers.driftHeatmap} onChange={e => setLayers({ ...layers, driftHeatmap: e.target.checked })} />
                <span>Drift Heatmap</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-slate-300 font-medium cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                  checked={layers.driftForecast} onChange={e => setLayers({ ...layers, driftForecast: e.target.checked })} />
                <span>Forward Forecast (+4h)</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-slate-300 font-medium cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                  checked={layers.vesselTracks} onChange={e => setLayers({ ...layers, vesselTracks: e.target.checked })} />
                <span>Vessel Tracks</span>
              </label>
            </div>
          )}
        </div>

        {/* Filter */}
        <div className="relative">
          <button 
            onClick={() => { setFilterOpen(!filterOpen); setPanelOpen(false); setTimeOpen(false); }}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-900/95 text-slate-200 border border-slate-700 rounded shadow-lg hover:bg-slate-800 font-medium text-sm transition-colors"
          >
            <span>Filter</span>
            <ChevronDown size={16} />
          </button>
        </div>

        {/* Case Timeline */}
        <div className="relative">
          <button 
            onClick={() => { setTimeOpen(!timeOpen); setPanelOpen(false); setFilterOpen(false); }}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-900/95 text-slate-200 border border-slate-700 rounded shadow-lg hover:bg-slate-800 font-medium text-sm transition-colors"
          >
            <span>Case Timeline</span>
            <ChevronDown size={16} />
          </button>
        </div>

      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-4 z-10 w-48">
        <button 
          onClick={() => setLegendOpen(!legendOpen)}
          className="w-full flex items-center justify-between px-3 py-2 bg-slate-900/95 text-slate-200 border border-slate-700 rounded shadow-lg hover:bg-slate-800 font-medium text-sm transition-colors"
        >
          <span className="flex items-center"><Droplet size={14} className="mr-2" /> Legend</span>
          <ChevronDown size={16} className={`transform transition-transform ${legendOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {legendOpen && (
          <div className="mt-2 bg-slate-900/95 text-slate-200 rounded shadow-2xl p-3 border border-slate-700 flex flex-col space-y-2">
            <div className="flex items-center text-xs text-slate-400">
              <span className="w-3 h-3 bg-[#ff2200] opacity-80 mr-2 rounded-sm border border-[#ff4500]"></span>
              Oil Spill
            </div>
            <div className="flex items-center text-xs text-slate-400">
              <span className="w-3 h-3 bg-[#00ffff] opacity-80 mr-2 rounded-sm border border-[#00ffff]"></span>
              Drift Origin
            </div>
            <div className="flex items-center text-xs text-slate-400">
              <div className="w-3 h-3 bg-gradient-to-r from-yellow-300 to-red-500 mr-2 rounded-sm"></div>
              Drift Heatmap
            </div>
            <div className="flex items-center text-xs text-slate-400">
              <span className="w-3 h-3 bg-[#ff00ff] opacity-50 mr-2 rounded-sm"></span>
              Forecast
            </div>
            <div className="flex items-center text-xs text-slate-400">
              <span className="w-3 h-1 bg-[#ff3333] mr-2"></span>
              Source Vessel
            </div>
            <div className="flex items-center text-xs text-slate-400">
              <span className="w-3 h-1 bg-[#ffb700] mr-2 border-b border-dashed border-white"></span>
              Dark Vessel
            </div>
            <div className="flex items-center text-xs text-slate-400">
              <span className="w-3 h-1 bg-[#00ff88] mr-2"></span>
              Other Vessels
            </div>
          </div>
        )}
      </div>

      {/* Mini-map */}
      <div className="absolute bottom-6 right-4 z-10 w-40 h-28 bg-gray-900 border border-gray-700 shadow-xl rounded overflow-hidden">
         <div className="w-full h-full relative" style={{ backgroundImage: 'url(https://tile.openstreetmap.org/5/23/14.png)', filter: 'invert(100%) hue-rotate(180deg) contrast(1.2)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.8 }}>
            {/* Viewport indicator for Chennai area */}
            <div className="absolute border border-white bg-white/20" style={{ left: '60%', top: '45%', width: '15%', height: '10%' }}></div>
            <div className="absolute bottom-1 right-2 text-[8px] text-white/70 font-mono tracking-widest">OCEANWATCH AI</div>
         </div>
      </div>
      
    </div>
  );
}
