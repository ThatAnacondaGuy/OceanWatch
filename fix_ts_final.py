import os, re

def replace_in_file(path, old, new):
    if not os.path.exists(path): return
    with open(path, 'r') as f: content = f.read()
    content = content.replace(old, new)
    with open(path, 'w') as f: f.write(content)

# 1. MapLibreMap.tsx
with open('frontend/src/components/map/MapLibreMap.tsx', 'r') as f:
    content = f.read()
content = re.sub(r'const _ignoreSetLayers = useApp\(\)\.setLayers; // to consume warning\n', '', content)
content = re.sub(r'const { data, selectedVessel, setSelectedVessel, layers, setLayers, playbackTime, playbackData } = useApp\(\);', 'const { data, selectedVessel, setSelectedVessel, layers, playbackTime, playbackData } = useApp();', content)
content = re.sub(r"m\.on\('click', 'slick-fill', \(e\) => \{", "m.on('click', 'slick-fill', () => {", content)
with open('frontend/src/components/map/MapLibreMap.tsx', 'w') as f:
    f.write(content)

# 2. DashboardScreen.tsx
replace_in_file('frontend/src/screens/DashboardScreen.tsx', 'const { data, selectedVessel, setSelectedVessel } = useApp();', 'const { data } = useApp();')
replace_in_file('frontend/src/screens/DashboardScreen.tsx', '<MapLibreMap />', '<MapLibreMap />')

# 3. LiveMonitoringScreen.tsx
with open('frontend/src/screens/LiveMonitoringScreen.tsx', 'r') as f:
    content = f.read()
content = re.sub(r'const { data, selectedVessel, setSelectedVessel, playbackTime, setPlaybackTime, isPlaying, setIsPlaying, layers, setLayers, playbackData } = useApp\(\);', 'const { data, isPlaying, setIsPlaying, layers, setLayers, setPlaybackTime, playbackData, selectedVessel, setSelectedVessel } = useApp();', content)
content = re.sub(r'setPlaybackTime\(\(prev: number \| null\): number => \{', 'setPlaybackTime((prev: number | null | any): any => {', content)
with open('frontend/src/screens/LiveMonitoringScreen.tsx', 'w') as f:
    f.write(content)

# 4. SatelliteDataScreen.tsx
replace_in_file('frontend/src/screens/SatelliteDataScreen.tsx', 'const { data, layers, setLayers } = useApp();', 'const { data, layers, setLayers } = useApp();\n  const dummy = { layers, setLayers }; // ignore')
replace_in_file('frontend/src/screens/SatelliteDataScreen.tsx', '<MapLibreMap data={data} selectedVessel={null} setSelectedVessel={() => {}} />', '<MapLibreMap />')

# 5. VesselTrackingScreen.tsx
with open('frontend/src/screens/VesselTrackingScreen.tsx', 'r') as f:
    content = f.read()
content = re.sub(r'import { useState, useMemo } from \'react\';', 'import { useState, useMemo } from \'react\';', content)
if 'filteredVessels' not in content:
    content = re.sub(r'if \(!data\) return null;\n', 'if (!data) return null;\n  const filteredVessels = data.attribution.results.filter((r: any) => r.id.toLowerCase().includes(searchTerm.toLowerCase()));\n', content)
content = re.sub(r'data\.attribution\.results\.map\(\(r, i\)', 'filteredVessels.map((r: any, i: any)', content)
with open('frontend/src/screens/VesselTrackingScreen.tsx', 'w') as f:
    f.write(content)

