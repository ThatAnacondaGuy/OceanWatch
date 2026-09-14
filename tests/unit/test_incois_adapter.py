from backend.app.worker.stages.drift import INCOISCurrentAdapter
import numpy as np

adapter = INCOISCurrentAdapter("data/raw/ocean/incois/RSMC_hycom_20260914.nc")

# Test around the exact time of the audit index 0
u, v = adapter.get_velocity([80.36], [13.23], '2026-09-13T06:00:00')

print(f"Interpolated U: {u[0]}")
print(f"Interpolated V: {v[0]}")

# Assert values are close to +0.049 and +0.194 (ignoring small interpolation differences)
diff_u = abs(u[0] - 0.049)
diff_v = abs(v[0] - 0.194)
assert diff_u < 0.05, f"U value {u[0]} too far from 0.049"
assert diff_v < 0.05, f"V value {v[0]} too far from 0.194"
print("Test passed!")
