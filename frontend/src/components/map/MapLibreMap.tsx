import { useEffect, useRef, useState, useCallback, } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useApp } from '../../context/AppContext';
import { getVesselStateAtTime } from '../../utils/ais';

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
      },
    },
  ],
};

interface Props {
  showLayerPanel?: boolean;
}

export default function MapComponent({ showLayerPanel = false }: Props) {
  const {
    data,
    selectedVessel,
    setSelectedVessel,
    layers,
    setLayers,
    playbackTime,
    playbackData,
  } = useApp();

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Record<string, maplibregl.Marker>>({});
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [panelOpen, setPanelOpen] = useState(showLayerPanel);
  const [legendOpen, setLegendOpen] = useState(true);

  // Dynamic FitCase Calculation
  const fitCase = useCallback(() => {
    if (!data || !mapRef.current) return;
    const bounds = new maplibregl.LngLatBounds();
    bounds.extend([data.slick.centroid.lon, data.slick.centroid.lat]);
    bounds.extend([data?.drift?.origin?.lon, data?.drift?.origin?.lat]);
    data?.vessels.forEach(v => {
      const state = getVesselStateAtTime(v.id, playbackTime, playbackData, data.vessels, data.attribution);
      if (state && state.lon && state.lat) {
        bounds.extend([state.lon, state.lat]);
      }
    });
    mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 13, duration: 1500 });
  }, [data]);

  // ── Initialization ──────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainer.current || mapRef.current || !data) return;

    const b = data.sar.bounds;
    const m = new maplibregl.Map({
      container: mapContainer.current,
      style: DARK_STYLE,
      bounds: [
        [b.min_lon - 0.05, b.min_lat - 0.05],
        [b.max_lon + 0.05, b.max_lat + 0.05],
      ],
      fitBoundsOptions: { padding: 50 },
    });
    mapRef.current = m;
    m.addControl(new maplibregl.NavigationControl(), 'top-right');

    m.on('load', () => {
      // ── 1. SAR Image Layer ──────────────────────────────────────────
      if (data.sar.preview_asset) {
        m.addSource('sar-src', {
          type: 'image',
          url: data.sar.preview_asset,
          coordinates: [
            [b.min_lon, b.max_lat],
            [b.max_lon, b.max_lat],
            [b.max_lon, b.min_lat],
            [b.min_lon, b.min_lat],
          ],
        });
        m.addLayer({ id: 'sar-layer', type: 'raster', source: 'sar-src', paint: { 'raster-opacity': layers.sarOpacity } });
      }

      // ── 2. Model Detection Layer ────────────────────────────────────
      if (data.sar.unet_probability_asset) {
        m.addSource('model-det-src', {
          type: 'image',
          url: data.sar.unet_probability_asset,
          coordinates: [
            [b.min_lon, b.max_lat],
            [b.max_lon, b.max_lat],
            [b.max_lon, b.min_lat],
            [b.min_lon, b.min_lat],
          ],
        });
        m.addLayer({
          id: 'model-det-layer',
          type: 'raster',
          source: 'model-det-src',
          paint: { 'raster-opacity': layers.unetOpacity },
          layout: { visibility: 'none' },
        });
      }

      // ── 3. Backward Drift Heatmap ─────────────────────────────────
      if (data.drift.heatmap_asset) {
        m.addSource('drift-heat-src', {
          type: 'image',
          url: data.drift.heatmap_asset,
          coordinates: [
            [b.min_lon, b.max_lat],
            [b.max_lon, b.max_lat],
            [b.max_lon, b.min_lat],
            [b.min_lon, b.min_lat],
          ],
        });
        m.addLayer({
          id: 'drift-heat-layer',
          type: 'raster',
          source: 'drift-heat-src',
          paint: { 'raster-opacity': 0.45 },
          layout: { visibility: 'visible' },
        });
      }

      // ── 4. Drift Uncertainty Envelope ───────────────────────────────
      const driftUncertUrl = data.drift.drift_uncertainty_asset || '/api/assets/artifacts/demo/ennore/drift_uncertainty.geojson';
      m.addSource('drift-uncert-src', { type: 'geojson', data: driftUncertUrl });
      m.addLayer({
        id: 'drift-uncert-fill',
        type: 'fill',
        source: 'drift-uncert-src',
        paint: { 'fill-color': '#06b6d4', 'fill-opacity': 0.15 },
        layout: { visibility: 'visible' },
      });
      m.addLayer({
        id: 'drift-uncert-line',
        type: 'line',
        source: 'drift-uncert-src',
        paint: { 'line-color': '#06b6d4', 'line-width': 2, 'line-dasharray': [4, 4] },
        layout: { visibility: 'visible' },
      });

      // ── 5. Forward Drift Forecast ───────────────────────────────────
      if (data.drift.forward_forecast_asset) {
        m.addSource('forecast-src', { type: 'geojson', data: data.drift.forward_forecast_asset });
        m.addLayer({
          id: 'forecast-fill',
          type: 'fill',
          source: 'forecast-src',
          paint: { 'fill-color': '#a855f7', 'fill-opacity': 0.2 },
          filter: ['==', ['get', 'class'], 'forecast_envelope'],
          layout: { visibility: 'none' },
        });
        m.addLayer({
          id: 'forecast-line',
          type: 'line',
          source: 'forecast-src',
          paint: { 'line-color': '#d8b4fe', 'line-width': 2, 'line-dasharray': [3, 2] },
          filter: ['==', ['get', 'class'], 'forecast_envelope'],
          layout: { visibility: 'none' },
        });
        m.addLayer({
          id: 'forecast-centerline',
          type: 'line',
          source: 'forecast-src',
          paint: { 'line-color': '#c084fc', 'line-width': 2.5 },
          filter: ['==', ['get', 'class'], 'forecast_centerline'],
          layout: { visibility: 'none' },
        });
        // Forecast Labels (+1h, +2h, +4h)
        m.addLayer({
          id: 'forecast-labels',
          type: 'symbol',
          source: 'forecast-src',
          filter: ['==', ['get', 'class'], 'forecast_center'],
          layout: {
            'text-field': '+{forecast_hours}h',
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 12,
            'text-anchor': 'bottom-left',
            'text-offset': [0.5, -0.5],
            'visibility': 'none'
          },
          paint: {
            'text-color': '#e9d5ff',
            'text-halo-color': '#4c1d95',
            'text-halo-width': 1.5,
          }
        });
      }

      // ── 6. Oil Slick Footprint ──────────────────────────────────────
      if (data.slick.geojson_asset) {
        m.addSource('slick-src', { type: 'geojson', data: data.slick.geojson_asset });
        m.addLayer({
          id: 'slick-fill',
          type: 'fill',
          source: 'slick-src',
          paint: { 'fill-color': '#ef4444', 'fill-opacity': 0.4 },
        });
        m.addLayer({
          id: 'slick-outline',
          type: 'line',
          source: 'slick-src',
          paint: { 'line-color': '#f87171', 'line-width': 2.5 },
        });
        m.addLayer({
          id: 'slick-glow',
          type: 'line',
          source: 'slick-src',
          paint: { 'line-color': '#ef4444', 'line-width': 8, 'line-blur': 6, 'line-opacity': 0.4 },
        });

        // Slick centroid marker & label
        const centroidEl = document.createElement('div');
        centroidEl.style.cssText = 'position:relative;display:flex;flex-direction:column;align-items:center;pointer-events:auto;cursor:pointer;';
        centroidEl.innerHTML = `
          <div style="width:14px;height:14px;background:#ef4444;border:2.5px solid white;border-radius:50%;box-shadow:0 0 12px rgba(239,68,68,0.8);"></div>
          <div style="position:absolute;top:18px;background:rgba(15,23,42,0.85);backdrop-filter:blur(4px);border:1px solid #ef4444;padding:4px 8px;border-radius:4px;color:white;font-family:system-ui;font-size:10px;white-space:nowrap;box-shadow:0 4px 6px rgba(0,0,0,0.3);">
            <div style="font-weight:900;color:#fca5a5;margin-bottom:2px;">DETECTED OIL SLICK</div>
            <div>Area: ${data.slick.area} px</div>
            <div>Validation: <span style="color:#4ade80;">PASS</span></div>
          </div>
        `;
        centroidEl.addEventListener('click', (e) => {
          e.stopPropagation();
          if (popupRef.current) popupRef.current.remove();
          const popup = new maplibregl.Popup({ maxWidth: '320px', offset: [0, -10] })
            .setLngLat([data.slick.centroid.lon, data.slick.centroid.lat])
            .setHTML(`
              <div style="font-family:system-ui;font-size:11px;line-height:1.6;color:#1e293b">
                <div style="font-weight:900;font-size:13px;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-bottom:6px">DETECTED OIL SLICK</div>
                <div><b>Detection:</b> ${data.slick.validation_status}</div>
                <div><b>Area:</b> ${data.slick.area} px (relative)</div>
                <div><b>Centroid:</b> ${data.slick.centroid.lat.toFixed(4)}°N, ${data.slick.centroid.lon.toFixed(4)}°E</div>
                <div><b>Geometry:</b> ${data.slick.geometry}</div>
                <div><b>Validation:</b> ${data.slick.validation_details}</div>
                <div><b>Model:</b> ${data.slick.model_information}</div>
              </div>
            `)
            .addTo(m);
          popupRef.current = popup;
        });
        const slickMarker = new maplibregl.Marker({ element: centroidEl, anchor: 'top' })
          .setLngLat([data.slick.centroid.lon, data.slick.centroid.lat])
          .addTo(m);
        markersRef.current['__slick_centroid__'] = slickMarker;
      }

      // ── 7. Dynamic Tracks Source & Layer ────────────────────────────
      m.addSource('dynamic-tracks-src', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      m.addSource('dynamic-tracks-future-src', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      
      // Neutral tracks (past)
      m.addLayer({
        id: 'tracks-neutral',
        type: 'line',
        source: 'dynamic-tracks-src',
        paint: { 
          'line-color': ['case', ['==', ['get', 'isSelected'], true], '#3b82f6', '#94a3b8'], 
          'line-width': ['case', ['==', ['get', 'isSelected'], true], 3.5, 1.5], 
          'line-opacity': ['case', ['==', ['get', 'isSelected'], true], 1.0, 0.4] 
        },
        filter: ['==', ['get', 'type'], 'neutral'],
      });
      // Dark tracks (past)
      m.addLayer({
        id: 'tracks-dark',
        type: 'line',
        source: 'dynamic-tracks-src',
        paint: { 
          'line-color': '#f59e0b', 
          'line-width': ['case', ['==', ['get', 'isSelected'], true], 3.5, 2], 
          'line-dasharray': [4, 4],
          'line-opacity': ['case', ['==', ['get', 'isSelected'], true], 1.0, 0.5]
        },
        filter: ['==', ['get', 'type'], 'dark'],
      });
      // Source track (past)
      m.addLayer({
        id: 'tracks-source',
        type: 'line',
        source: 'dynamic-tracks-src',
        paint: { 
          'line-color': '#ef4444', 
          'line-width': ['case', ['==', ['get', 'isSelected'], true], 4, 2.5], 
          'line-opacity': ['case', ['==', ['get', 'isSelected'], true], 1.0, 0.6] 
        },
        filter: ['==', ['get', 'type'], 'source'],
      });

      // Future tracks (all types - faint and dashed)
      m.addLayer({
        id: 'tracks-future',
        type: 'line',
        source: 'dynamic-tracks-future-src',
        paint: { 
          'line-color': ['case', ['==', ['get', 'isSelected'], true], '#94a3b8', '#cbd5e1'], 
          'line-width': 1.5,
          'line-dasharray': [2, 4],
          'line-opacity': 0.3 
        }
      });

      // ── 8. Source-Slick Relationship Connector ──────────────────────
      m.addSource('relationship-src', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      m.addLayer({
        id: 'relationship-line',
        type: 'line',
        source: 'relationship-src',
        paint: { 'line-color': '#38bdf8', 'line-width': 2, 'line-dasharray': [2, 2], 'line-opacity': 0.8 },
      });

      // ── 9. Drift Origin Marker & Label ──────────────────────────────
      const originEl = document.createElement('div');
      originEl.style.cssText = 'position:relative;display:flex;flex-direction:column;align-items:center;pointer-events:auto;cursor:pointer;';
      originEl.innerHTML = `
        <div style="width:24px;height:24px;border:2.5px dashed #06b6d4;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(6,182,212,0.15);box-shadow:0 0 10px rgba(6,182,212,0.5);">
          <div style="width:8px;height:8px;background:#06b6d4;border-radius:50%"></div>
        </div>
        <div style="position:absolute;top:28px;background:rgba(15,23,42,0.85);backdrop-filter:blur(4px);border:1px solid #06b6d4;padding:3px 6px;border-radius:4px;color:white;font-family:system-ui;font-size:9px;white-space:nowrap;font-weight:bold;">
          BACKWARD DRIFT ORIGIN
        </div>
      `;
      originEl.addEventListener('click', (e) => {
        e.stopPropagation();
        if (popupRef.current) popupRef.current.remove();
        const p = new maplibregl.Popup({ maxWidth: '240px', offset: [0, -12] })
          .setLngLat([data?.drift?.origin?.lon, data?.drift?.origin?.lat])
          .setHTML(`
            <div style="font-family:system-ui;font-size:11px;line-height:1.6;color:#1e293b">
              <div style="font-weight:900;font-size:13px;border-bottom:1px solid #e2e8f0;padding-bottom:4px;margin-bottom:4px">DRIFT ORIGIN</div>
              <div><b>Lat:</b> ${data?.drift?.origin?.lat.toFixed(4)}°N</div>
              <div><b>Lon:</b> ${data?.drift?.origin?.lon.toFixed(4)}°E</div>
              <div><b>Time Window:</b> ${data.drift.time_window}</div>
              <div><b>Uncertainty:</b> ${data.drift.uncertainty_envelope}</div>
            </div>
          `)
          .addTo(m);
        popupRef.current = p;
      });
      const originMarker = new maplibregl.Marker({ element: originEl, anchor: 'top' })
        .setLngLat([data?.drift?.origin?.lon, data?.drift?.origin?.lat])
        .addTo(m);
      markersRef.current['__drift_origin__'] = originMarker;

      // ── 10. Vessel SVG Markers ──────────────────────────────────────
      data?.vessels.forEach((v) => {
        const isSource = v.id === data?.attribution?.results[0]?.id;
        const isDark = v.vessel_type === 'Unknown / Dark Vessel';
        
        const fillColor = isSource ? '#ef4444' : isDark ? '#f59e0b' : '#f8fafc';
        const strokeColor = isSource ? '#991b1b' : isDark ? '#92400e' : '#3b82f6';

        const el = document.createElement('div');
        el.style.cssText = `position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;z-index:${isSource ? 50 : 20};transition:transform 0.1s;`;
        
        // Custom SVG Ship
        const labelStyle = isSource ? 'opacity:1;' : 'opacity:0; transition:opacity 0.2s;';
        el.innerHTML = `
          <div class="vessel-label" style="${labelStyle} font-size:9px;font-weight:800;background:rgba(15,23,42,0.9);color:white;padding:2px 5px;border-radius:3px;margin-bottom:2px;white-space:nowrap;border:1px solid ${fillColor};box-shadow:0 2px 4px rgba(0,0,0,0.5);">${isSource ? 'SOURCE: ' : ''}${v.id.replace('DEMO-', '')}</div>
          <div class="vessel-icon" style="transform:rotate(${v.heading}deg);transform-origin:center;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
            <svg width="18" height="24" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L20 12V28C20 29.1 19.1 30 18 30H6C4.9 30 4 29.1 4 28V12L12 2Z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2" stroke-linejoin="round"/>
            </svg>
          </div>
        `;
        el.addEventListener('mouseenter', () => {
          const lbl = el.querySelector('.vessel-label') as HTMLElement;
          if (lbl) lbl.style.opacity = '1';
        });
        el.addEventListener('mouseleave', () => {
          if (v.id !== selectedVessel && !isSource) {
            const lbl = el.querySelector('.vessel-label') as HTMLElement;
            if (lbl) lbl.style.opacity = '0';
          }
        });
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          setSelectedVessel(v.id);
        });

        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([
    getVesselStateAtTime(v.id, playbackTime, playbackData, data?.vessels || [], data?.attribution).lon || v.position.lon,
    getVesselStateAtTime(v.id, playbackTime, playbackData, data?.vessels || [], data?.attribution).lat || v.position.lat
  ])
          .addTo(m);
        markersRef.current[v.id] = marker;
      });

      // Initial Fit Case
      fitCase();
    });

    return () => {
      m.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  }, [data]);

  // ── Layer Visibility Sync ───────────────────────────────────────────
  useEffect(() => {
    const m = mapRef.current;
    if (!m || !m.isStyleLoaded() || !data) return;

    const vis = (id: string, on: boolean) => {
      if (m.getLayer(id)) m.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none');
    };
    const opacity = (id: string, val: number) => {
      if (m.getLayer(id)) m.setPaintProperty(id, 'raster-opacity', val);
    };

    vis('sar-layer', layers.sar);
    opacity('sar-layer', layers.sarOpacity);

    vis('model-det-layer', layers.unet);
    opacity('model-det-layer', layers.unetOpacity);

    vis('slick-fill', layers.slick);
    vis('slick-outline', layers.slick);
    vis('slick-glow', layers.slick);
    if (markersRef.current['__slick_centroid__']) {
      markersRef.current['__slick_centroid__'].getElement().style.display = layers.slick ? 'flex' : 'none';
    }

    vis('drift-heat-layer', layers.driftHeatmap);
    vis('drift-uncert-fill', layers.driftOrigin);
    vis('drift-uncert-line', layers.driftOrigin);
    if (markersRef.current['__drift_origin__']) {
      markersRef.current['__drift_origin__'].getElement().style.display = layers.driftOrigin ? 'flex' : 'none';
    }

    vis('forecast-fill', layers.driftForecast);
    vis('forecast-line', layers.driftForecast);
    vis('forecast-centerline', layers.driftForecast);
    vis('forecast-labels', layers.driftForecast);

    vis('tracks-neutral', layers.vessels);
    vis('tracks-source', layers.vessels);
    vis('tracks-dark', layers.vessels);
    vis('tracks-future', layers.vessels);
    vis('relationship-line', layers.vessels);

  }, [layers]);

  // ── Playback & Selection Sync (Dynamic Tracks) ──────────────────────
  useEffect(() => {
    const m = mapRef.current;
    if (!m || !m.isStyleLoaded() || !playbackData || !data) return;

    const currentVesselPositions: Record<string, {lat: number, lon: number}> = {};
    const pastFeatures: any[] = [];
    const futureFeatures: any[] = [];
    const timeLimit = playbackTime ?? Infinity;

    data.vessels.forEach((v) => {
      const isSource = v.id === data.attribution.results[0]?.id;
      const isDark = v.vessel_type === 'Unknown / Dark Vessel';
      const isSelected = v.id === selectedVessel;
      const type = isSource ? 'source' : isDark ? 'dark' : 'neutral';

      const state = getVesselStateAtTime(v.id, timeLimit, playbackData, data.vessels, data.attribution);
      if (!state || !state.hasValidTelemetry) {
        if (markersRef.current[v.id]) markersRef.current[v.id].getElement().style.display = 'none';
        return;
      }

      currentVesselPositions[v.id] = { lat: state.lat, lon: state.lon };

      const pastCoords = state.pastPts.map((p: any) => [p.lon, p.lat]);
      const futureCoords = state.futurePts.map((p: any) => [p.lon, p.lat]);
      
      // Connect future track to the last past point
      if (pastCoords.length > 0 && futureCoords.length > 0) {
        futureCoords.unshift(pastCoords[pastCoords.length - 1]);
      }

      // Update marker position & rotation
      const marker = markersRef.current[v.id];
      if (marker) {
        marker.setLngLat([state.lon, state.lat]);
        const el = marker.getElement();
        el.style.display = layers.vesselCurrentPosition ? 'flex' : 'none';
        const iconEl = el.querySelector('.vessel-icon') as HTMLElement;
        if (iconEl) {
          iconEl.style.transform = `rotate(${state.heading}deg)`;
          // Enlarge selected marker slightly
          if (isSelected) {
            iconEl.style.transform += ' scale(1.3)';
          }
        }
        
        // Highlight logic
        const labelEl = el.querySelector('.vessel-label') as HTMLElement;
        if (labelEl) {
          if (isSelected) {
            labelEl.style.opacity = '1';
            labelEl.style.background = '#3b82f6';
            labelEl.style.borderColor = '#60a5fa';
            el.style.zIndex = '60';
          } else {
            labelEl.style.opacity = isSource ? '1' : '0';
            labelEl.style.background = 'rgba(15,23,42,0.9)';
            labelEl.style.borderColor = isSource ? '#ef4444' : isDark ? '#f59e0b' : '#f8fafc';
            el.style.zIndex = isSource ? '50' : '20';
          }
        }
      }

      // Add Track LineStrings
      if (pastCoords.length > 1) {
        if ((isSelected && layers.vesselSelectedTrack) || (!isSelected && layers.vesselOtherTracks)) {
          pastFeatures.push({
            type: 'Feature',
            properties: { mmsi: v.id, type, isSelected },
            geometry: { type: 'LineString', coordinates: pastCoords }
          });
        }
      }
      if (futureCoords.length > 1 && layers.vesselHistoricalTrail) {
        if ((isSelected && layers.vesselSelectedTrack) || (!isSelected && layers.vesselOtherTracks)) {
          futureFeatures.push({
            type: 'Feature',
            properties: { mmsi: v.id, type, isSelected },
            geometry: { type: 'LineString', coordinates: futureCoords }
          });
        }
      }
    });

    // Update dynamic tracks source
    const pastSrc = m.getSource('dynamic-tracks-src') as maplibregl.GeoJSONSource;
    if (pastSrc) pastSrc.setData({ type: 'FeatureCollection', features: pastFeatures });

    const futureSrc = m.getSource('dynamic-tracks-future-src') as maplibregl.GeoJSONSource;
    if (futureSrc) futureSrc.setData({ type: 'FeatureCollection', features: futureFeatures });

    // Update Source Relationship Line (from current pos to origin)
    const relSrc = m.getSource('relationship-src') as maplibregl.GeoJSONSource;
    if (relSrc) {
      if (selectedVessel && currentVesselPositions[selectedVessel]) {
        relSrc.setData({
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [
                [currentVesselPositions[selectedVessel].lon, currentVesselPositions[selectedVessel].lat],
                [data?.drift?.origin?.lon, data?.drift?.origin?.lat]
              ]
            }
          }]
        });
      } else {
        relSrc.setData({ type: 'FeatureCollection', features: [] });
      }
    }

    // Update Earliest Available Point Marker
    if (layers.vesselOriginPoint && selectedVessel && playbackData[selectedVessel] && playbackData[selectedVessel].length > 0) {
      const earliest = playbackData[selectedVessel][0];
      if (!markersRef.current['__earliest_point__']) {
        const earliestEl = document.createElement('div');
        earliestEl.style.cssText = 'position:relative;display:flex;flex-direction:column;align-items:center;pointer-events:none;z-index:40;';
        earliestEl.innerHTML = `
          <div style="width:10px;height:10px;background:#3b82f6;border:2px solid white;border-radius:50%;box-shadow:0 0 8px rgba(59,130,246,0.8);"></div>
          <div style="position:absolute;top:14px;background:rgba(15,23,42,0.85);backdrop-filter:blur(4px);border:1px solid #3b82f6;padding:2px 4px;border-radius:3px;color:white;font-family:system-ui;font-size:8px;white-space:nowrap;box-shadow:0 2px 4px rgba(0,0,0,0.3);">
            ORIGIN / EARLIEST AVAILABLE AIS
          </div>
        `;
        markersRef.current['__earliest_point__'] = new maplibregl.Marker({ element: earliestEl, anchor: 'center' })
          .setLngLat([earliest.lon, earliest.lat])
          .addTo(m);
      } else {
        markersRef.current['__earliest_point__'].setLngLat([earliest.lon, earliest.lat]);
        markersRef.current['__earliest_point__'].getElement().style.display = 'flex';
      }
    } else {
      if (markersRef.current['__earliest_point__']) {
        markersRef.current['__earliest_point__'].getElement().style.display = 'none';
      }
    }

  }, [playbackTime, playbackData, data?.vessels, selectedVessel, layers]);

  // Handle Fly-To on Select
  useEffect(() => {
    if (selectedVessel && markersRef.current[selectedVessel] && mapRef.current) {
      const ll = markersRef.current[selectedVessel].getLngLat();
      mapRef.current.flyTo({ center: [ll.lng, ll.lat], zoom: 12, speed: 1.2 });
    }
  }, [selectedVessel]);

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-full bg-slate-900" id="satmap">
      <div ref={mapContainer} className="w-full h-full" />

      {/* ── Layer Control Panel (collapsible) ── */}
      <div className="absolute top-2 left-2 z-20">
        <button
          onClick={() => setPanelOpen(!panelOpen)}
          className="bg-white/95 backdrop-blur text-navy-900 text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          {panelOpen ? '✕ LAYERS' : '☰ LAYERS'}
        </button>

        {panelOpen && (
          <div className="mt-1 bg-white/95 backdrop-blur rounded shadow-xl border border-slate-200 p-3 w-56 text-[11px] text-slate-700 space-y-2 max-h-[70vh] overflow-y-auto">
            <LayerRow label="SAR Background" checked={layers.sar} onChange={(v) => setLayers({ ...layers, sar: v })} />
            {layers.sar && (
              <input type="range" min={0} max={1} step={0.05} value={layers.sarOpacity}
                onChange={(e) => setLayers({ ...layers, sarOpacity: +e.target.value })}
                className="w-full h-1 accent-slate-600 mb-1" />
            )}

            <LayerRow label="Model Detection" checked={layers.unet} onChange={(v) => setLayers({ ...layers, unet: v })} />
            {layers.unet && (
              <input type="range" min={0} max={1} step={0.05} value={layers.unetOpacity}
                onChange={(e) => setLayers({ ...layers, unetOpacity: +e.target.value })}
                className="w-full h-1 accent-orange-500 mb-1" />
            )}

            <LayerRow label="Detected Slick" checked={layers.slick} onChange={(v) => setLayers({ ...layers, slick: v })} color="#ef4444" />
            <LayerRow label="Backward Heatmap" checked={layers.driftHeatmap} onChange={(v) => setLayers({ ...layers, driftHeatmap: v })} color="#fb923c" />
            <LayerRow label="Drift Origin & Envelope" checked={layers.driftOrigin} onChange={(v) => setLayers({ ...layers, driftOrigin: v })} color="#06b6d4" />
            <LayerRow label="Forward Forecast" checked={layers.driftForecast} onChange={(v) => setLayers({ ...layers, driftForecast: v })} color="#a855f7" />
            
            <div className="mt-3 mb-1 font-bold text-slate-800 border-b border-slate-200 pb-1">Vessel Tracking</div>
            <LayerRow label="Selected Vessel Track" checked={layers.vesselSelectedTrack} onChange={(v) => setLayers({ ...layers, vesselSelectedTrack: v })} color="#3b82f6" />
            <LayerRow label="Other Vessel Tracks" checked={layers.vesselOtherTracks} onChange={(v) => setLayers({ ...layers, vesselOtherTracks: v })} />
            <LayerRow label="Future Track (Dashed)" checked={layers.vesselHistoricalTrail} onChange={(v) => setLayers({ ...layers, vesselHistoricalTrail: v })} />
            <LayerRow label="Current Position (Ships)" checked={layers.vesselCurrentPosition} onChange={(v) => setLayers({ ...layers, vesselCurrentPosition: v })} />
            <LayerRow label="Origin Point (Earliest)" checked={layers.vesselOriginPoint} onChange={(v) => setLayers({ ...layers, vesselOriginPoint: v })} />

            <div className="pt-2 border-t border-slate-200 mt-2">
              <button onClick={fitCase}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-colors">
                Fit Case
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Legend (collapsible) ── */}
      <div className="absolute bottom-6 right-2 z-10">
        <button
          onClick={() => setLegendOpen(!legendOpen)}
          className="bg-white/95 backdrop-blur text-navy-900 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded shadow border border-slate-200 mb-1 ml-auto block"
        >
          {legendOpen ? '▼ LEGEND' : '▶ LEGEND'}
        </button>
        {legendOpen && (
          <div className="bg-white/95 backdrop-blur text-slate-800 p-2.5 rounded border border-slate-200 text-[10px] shadow-lg min-w-[160px] space-y-1">
            <LegendItem color="#ef4444" dashed={false} label="Detected Slick" fill />
            <LegendItem color="#06b6d4" dashed label="Backward Uncertainty" fill />
            <LegendItem color="#fb923c" dashed={false} label="Drift Heatmap" fill />
            <LegendItem color="#a855f7" dashed label="Forward Forecast" fill />
            <LegendItem color="#ef4444" dashed={false} label="Source Track & Vessel" />
            <LegendItem color="#f59e0b" dashed label="Dark Track & Vessel" />
            <LegendItem color="#94a3b8" dashed label="AIS Candidate Track" />
          </div>
        )}
      </div>
      
      {/* ── Forecast Warning ── */}
      {layers.driftForecast && (
        <div className="absolute top-4 right-10 z-10 bg-amber-100/90 backdrop-blur border border-amber-300 text-amber-800 px-3 py-1.5 rounded text-[10px] font-bold shadow">
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

function LayerRow({ label, checked, onChange, color }: { label: string; checked: boolean; onChange: (v: boolean) => void; color?: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 rounded px-1 py-1 -mx-1 transition-colors">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
        className="accent-blue-600 w-3.5 h-3.5 rounded" />
      {color && <span style={{ background: color, width: 8, height: 8, borderRadius: 2, display: 'inline-block', border: '1px solid white' }} />}
      <span className="font-medium">{label}</span>
    </label>
  );
}

function LegendItem({ color, dashed, label, fill }: { color: string; dashed: boolean; label: string; fill?: boolean }) {
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
