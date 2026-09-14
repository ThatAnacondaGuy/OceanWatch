import os
import rasterio
from backend.app.worker.stages.sar_readers import EOS04Reader, NISARGCOVReader

# Find actual EOS04 zip
eos_dir = "data/raw/satellite/eos04"
eos_files = [f for f in os.listdir(eos_dir) if f.endswith(".zip")]
if eos_files:
    eos_path = os.path.join(eos_dir, eos_files[0])
    reader = EOS04Reader(eos_path)
    from rasterio.windows import Window
    # read small 100x100 window
    scene = reader.read_scene(window=Window(5825, 6741, 100, 100))
    print("EOS-04 Scene:", scene.source)
    print("Polarizations:", scene.polarizations)
    print("HH shape:", scene.arrays["HH"].shape)
    
# Find actual NISAR h5
nisar_dir = "data/raw/satellite/nisar"
nisar_files = [f for f in os.listdir(nisar_dir) if f.endswith(".h5")]
if nisar_files:
    nisar_path = os.path.join(nisar_dir, nisar_files[0])
    reader = NISARGCOVReader(nisar_path)
    scene = reader.read_window(slice(11990, 12090), slice(9154, 9254))
    print("NISAR Scene:", scene.source)
    print("Polarizations:", scene.polarizations)
    print("HHHH shape:", scene.arrays["HHHH"].shape)
