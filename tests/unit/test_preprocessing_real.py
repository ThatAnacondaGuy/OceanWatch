import os
import numpy as np
import rasterio
from backend.app.worker.stages.preprocessing import preprocess_sar_scene, apply_land_mask

def test_preprocessing_real_masking():
    in_tif = "data/raw/xview3/scene_1.tif"
    out_tif = "data/processed/scene_1_preprocessed_real.tif"
    shapefile = "data/raw/natural_earth/ne_10m_land.shp"
    
    assert os.path.exists(in_tif), "Input TIFF missing"
    assert os.path.exists(shapefile), "Natural Earth shapefile missing"
    
    res = preprocess_sar_scene(in_tif, out_tif, shapefile, is_safe_dir=False)
    assert os.path.exists(res), "Output artifact missing"
    
    with rasterio.open(in_tif) as src_in, rasterio.open(res) as src_out:
        assert src_in.crs == src_out.crs
        
        in_vv = src_in.read(1)
        out_vv = src_out.read(1)
        
        # Verify filtering changed the data
        assert not np.array_equal(in_vv, out_vv)
        
        # Verify masking logic: We expect land pixels to be -50.0 (if any intersected)
        # Since our synthetic TIFF is in the Arabian Sea (18.3N, 71.4E), it might not intersect land.
        # But the geometry_mask executed correctly. Let's do a direct mask test on a known land bounding box.
        transform = rasterio.transform.from_origin(72.82, 18.97, 0.01, 0.01) # Mumbai coordinates
        dummy_img = np.ones((10, 10))
        masked_img, land_mask = apply_land_mask(dummy_img, transform, src_in.crs, shapefile)
        # Should be land
        assert np.any(land_mask), "Mumbai coordinates should intersect Natural Earth land!"
        assert np.any(masked_img == -50.0), "Land pixels should be set to -50.0"

    print("Real Preprocessing (Masking + Filtering) PASSED.")

if __name__ == "__main__":
    test_preprocessing_real_masking()
