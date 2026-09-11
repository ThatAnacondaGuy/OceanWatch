const fs = require('fs');

let content = fs.readFileSync('frontend/src/components/map/MapLibreMap.tsx', 'utf8');

const fallbackStyle = `
const FALLBACK_STYLE = {
  version: 8,
  sources: {
    'carto-dark': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors, &copy; CARTO'
    }
  },
  layers: [
    {
      id: 'carto-dark-layer',
      type: 'raster',
      source: 'carto-dark',
      minzoom: 0,
      maxzoom: 20
    }
  ]
};
`;

content = content.replace(
  "export default function MapComponent({",
  fallbackStyle + "\nexport default function MapComponent({"
);

content = content.replace(
  "style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',",
  "style: FALLBACK_STYLE,"
);

fs.writeFileSync('frontend/src/components/map/MapLibreMap.tsx', content);
