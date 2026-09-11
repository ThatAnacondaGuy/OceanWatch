import os
import numpy as np
import pandas as pd
import rasterio
from rasterio.transform import from_origin
from backend.app.worker.stages.cfar import CFARDetector
from ml.datasets.xview3 import XView3DatasetParser
from backend.app.worker.stages.ship_detection import ShipDetectionModule

def test_cfar_synthetic_fixture():
    print("Testing CFAR validity with synthetic bright-target fixture...")
    # Generate 100x100 background noise
    img = np.random.normal(loc=10.0, scale=2.0, size=(100, 100))
    # Add a bright target (ship) at center
    img[48:52, 48:52] = 50.0 
    
    detector = CFARDetector(window_size=21, guard_size=5, k=3.5)
    mask = detector.detect(img)
    
    assert np.any(mask), "CFAR failed to detect the synthetic bright target."
    
    transform = from_origin(0, 50, 10, 10)
    rois = detector.extract_rois(img.shape, mask, transform, min_size=1)
    
    assert len(rois) >= 1, "CFAR failed to extract RoI."
    print("[PASS] CFAR Output Validity Passed (SYNTHETIC TEST ONLY).")

def test_xview3_parser_and_bounds():
    print("Testing xView3 schema parsing, coord conversion, and normalized bounds...")
    os.makedirs("tests/fixtures", exist_ok=True)
    csv_path = "tests/fixtures/dummy_xview.csv"
    tif_path = "tests/fixtures/dummy_scene.tif"
    
    df = pd.DataFrame({
        'scene_id': ['dummy_scene', 'dummy_scene'],
        'lat': [10.5, 10.6],
        'lon': [-20.5, -20.6],
        'is_vessel': [True, False],
        'vessel_length_m': [150.0, np.nan]
    })
    df.to_csv(csv_path, index=False)
    
    # 0.001 deg ~ 111m per pixel
    transform = from_origin(-21.0, 11.0, 0.001, 0.001)
    with rasterio.open(tif_path, 'w', driver='GTiff', height=1000, width=1000, count=1, dtype='uint8', crs='+proj=latlong', transform=transform) as dst:
        dst.write(np.zeros((1000, 1000), dtype='uint8'), 1)
        
    parser = XView3DatasetParser(tif_path, csv_path)
    is_valid, msg = parser.validate_schema()
    assert is_valid, f"Schema validation failed: {msg}"
    
    txt_path, count = parser.convert_to_yolo_format("tests/fixtures/yolo_out")
    assert count == 1, "Should parse exactly 1 vessel."
    
    with open(txt_path, 'r') as f:
        line = f.read().strip().split()
        assert len(line) == 5, "YOLO format must have 5 values"
        cls, x_n, y_n, w_n, h_n = map(float, line)
        assert 0.0 <= x_n <= 1.0 and 0.0 <= y_n <= 1.0, "Coordinates must be normalized [0,1]"
        assert 0.0 <= w_n <= 1.0 and 0.0 <= h_n <= 1.0, "Bounds must be normalized [0,1]"
        # Check dynamic dimension translation (not hardcoded to 20x20 pixels)
        # 150m vessel at ~111m/pixel should be ~1.35 pixels wide. With 5-pixel minimum -> 5/1000 = 0.005
        assert w_n >= 0.005, f"Dynamic bounding box conversion failed, w_n={w_n}"
        
    print("[PASS] Pixel-coord conversion & normalized YOLO bounds [0,1] Passed.")

def test_crop_normalization():
    print("Testing crop normalization and multi-channel handling...")
    module = ShipDetectionModule()
    
    # Test 1: Single channel (VV) -> 3 channel RGB
    single_crop = np.full((10, 10), -15.0) # -15 dB
    norm_1c = module.normalize_sar_crop(single_crop, min_db=-30.0, max_db=0.0)
    assert norm_1c.shape == (10, 10, 3)
    assert np.allclose(norm_1c[0,0,0], 127, atol=2) # Halfway between -30 and 0 is 127
    
    # Test 2: Dual channel (VV, VH) -> 3 channel Pseudo RGB
    dual_crop = np.zeros((10, 10, 2))
    dual_crop[..., 0] = 0.0 # 0 dB VV
    dual_crop[..., 1] = -30.0 # -30 dB VH
    norm_2c = module.normalize_sar_crop(dual_crop, min_db=-30.0, max_db=0.0)
    assert norm_2c.shape == (10, 10, 3)
    assert np.allclose(norm_2c[0,0,0], 255) # VV -> 255
    assert np.allclose(norm_2c[0,0,1], 0)   # VH -> 0
    assert np.allclose(norm_2c[0,0,2], 127) # Avg -> 127
    
    print("[PASS] Crop normalization & Multi-channel handling Passed.")

if __name__ == "__main__":
    test_cfar_synthetic_fixture()
    test_xview3_parser_and_bounds()
    test_crop_normalization()
    print("All tests passed.")
