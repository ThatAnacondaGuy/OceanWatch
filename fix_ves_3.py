import re
with open('frontend/src/screens/VesselTrackingScreen.tsx', 'r') as f:
    c = f.read()

# Add useState and useApp correctly
c = re.sub(r'import \{ useState, useMemo \} from \'react\';', 'import { useState, useMemo } from \'react\';\nimport { useApp } from \'../context/AppContext\';', c)
c = re.sub(r'import \{ useApp \} from \'../context/AppContext\';\nimport \{ useApp \} from \'../context/AppContext\';', 'import { useApp } from \'../context/AppContext\';', c)

# Add search term state
c = re.sub(
    r'const \{ data, selectedVessel, setSelectedVessel \} = useApp\(\);\n\s+if \(\!data\) return null;',
    r'const { data, selectedVessel, setSelectedVessel } = useApp();\n  const [searchTerm, setSearchTerm] = useState("");\n  if (!data) return null;\n  const filteredVessels = data.attribution.results.filter((r: any) => r.id.toLowerCase().includes(searchTerm.toLowerCase()));',
    c
)

c = re.sub(r'<input type="text" placeholder="Search vessels\.\.\."', r'<input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search vessels..."', c)

c = re.sub(r'filteredVessels\.map\(\(r, i\)', r'filteredVessels.map((r: any, i: number)', c)
c = re.sub(r'filteredVessels\.map\(\(r: any, i: any\)', r'filteredVessels.map((r: any, i: number)', c)

with open('frontend/src/screens/VesselTrackingScreen.tsx', 'w') as f:
    f.write(c)
