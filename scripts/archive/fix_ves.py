import re
with open('frontend/src/screens/VesselTrackingScreen.tsx', 'r') as f:
    c = f.read()
# Remove duplicate useApp import
lines = c.split('\n')
clean = []
seen = set()
for l in lines:
    if 'useApp' in l and 'import' in l:
        if 'useApp' in seen:
            continue
        seen.add('useApp')
    clean.append(l)
c = '\n'.join(clean)

c = re.sub(r'const \{ data, selectedVessel, setSelectedVessel \} = useApp\(\);\s+const \{ data, selectedVessel, setSelectedVessel \} = useApp\(\);', 'const { data, selectedVessel, setSelectedVessel } = useApp();', c)

with open('frontend/src/screens/VesselTrackingScreen.tsx', 'w') as f:
    f.write(c)
