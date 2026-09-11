const fs = require('fs');
let content = fs.readFileSync('frontend/src/types.ts', 'utf8');

content = content.replace(
  'preview_asset?: string;',
  'preview_asset?: string;\n  unet_probability_asset?: string;'
);

content = content.replace(
  'heatmap_asset: string | null;',
  'heatmap_asset: string | null;\n  forward_forecast_asset?: string;'
);

content = content.replace(
  'ais?: { tracks_asset: string };',
  'ais?: { tracks_asset: string; playback_asset?: string };'
);

fs.writeFileSync('frontend/src/types.ts', content);
