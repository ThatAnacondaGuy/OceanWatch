import os
import numpy as np
import rasterio
from backend.app.worker.stages.preprocessing import preprocess_sar_scene

def test_preprocessing():
    # Setup test file
    in_tif = "data/raw/xview3/scene_1.tif"
    out_tif = "data/processed/scene_1_preprocessed.tif"
    
    assert os.path.exists(in_tif), "Synthetic input TIFF must exist"
    
    # Run module A1
    res = preprocess_sar_scene(in_tif, out_tif)
    
    # Verify artifact exists
    assert os.path.exists(res), "Output artifact must exist"
    
    # Verify metadata preserved
    with rasterio.open(in_tif) as src_in, rasterio.open(res) as src_out:
        assert src_in.count == src_out.count
        assert src_in.crs == src_out.crs
        assert src_in.transform == src_out.transform
        assert src_in.width == src_out.width
        assert src_in.height == src_out.height
        
        # Verify filtering changed the data (speckle filter smooths variance)
        in_vv = src_in.read(1)
        out_vv = src_out.read(1)
        assert not np.array_equal(in_vv, out_vv)
        
    print("Preprocessing tests PASSED.")
