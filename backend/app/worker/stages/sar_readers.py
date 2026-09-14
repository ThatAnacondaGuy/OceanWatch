import os
import rasterio
import h5py
import numpy as np
from dataclasses import dataclass
from typing import Dict, Any, Tuple, Optional

@dataclass
class SARScene:
    source: str
    acquisition_time: str
    crs: str
    bounds: Tuple[float, float, float, float]
    resolution: Tuple[float, float]
    polarizations: list
    arrays: Dict[str, np.ndarray]
    units: str
    nodata: Any
    metadata: Dict[str, Any]
    provenance: str

class EOS04Reader:
    def __init__(self, zip_path: str):
        self.zip_path = zip_path
        # Extract base name without extension for the internal directory structure
        base_name = os.path.basename(zip_path).replace('.zip', '')
        self.vsi_base = f"/vsizip/{os.path.abspath(zip_path)}/{base_name}"
        
    def _read_tif(self, subpath: str, window=None) -> tuple:
        full_path = f"{self.vsi_base}/{subpath}"
        with rasterio.open(full_path) as src:
            if window:
                data = src.read(1, window=window)
            else:
                data = src.read(1)
            
            # If no window, we can just grab these
            crs = src.crs.to_string() if src.crs else "Unknown"
            bounds = (src.bounds.left, src.bounds.bottom, src.bounds.right, src.bounds.top)
            res = (src.res[0], src.res[1])
            nodata = src.nodata
            return data, crs, bounds, res, nodata

    def read_scene(self, window=None) -> SARScene:
        # Read HH
        hh_dn, crs, bounds, res, nodata = self._read_tif("scene_HH/imagery_HH.tif", window=window)
        # Read HV
        hv_dn, _, _, _, _ = self._read_tif("scene_HV/imagery_HV.tif", window=window)
        
        # Calibration: gamma0_dB = 20 * log10(DN) - 67.14
        # Mask DN <= 0
        def calibrate(dn_arr):
            arr = np.array(dn_arr, dtype=np.float32)
            valid = arr > 0
            out = np.full(arr.shape, np.nan, dtype=np.float32)
            out[valid] = 20.0 * np.log10(arr[valid]) - 67.14
            return out
            
        hh_db = calibrate(hh_dn)
        hv_db = calibrate(hv_dn)
        
        # Attempt to read auxiliary if they exist
        aux = {}
        for aux_name in ["LIA", "contributing_area", "mask"]:
            try:
                # Based on typical EOS-04 structure, might not exist exactly with these names
                aux_data, _, _, _, _ = self._read_tif(f"scene_HH/{aux_name}.tif", window=window)
                aux[aux_name] = aux_data
            except Exception:
                pass
                
        return SARScene(
            source="EOS-04",
            acquisition_time="Unknown (extract from metadata later)",
            crs=crs,
            bounds=bounds,
            resolution=res,
            polarizations=["HH", "HV"],
            arrays={"HH": hh_db, "HV": hv_db, **aux},
            units="dB",
            nodata=np.nan,
            metadata={"status": "INGESTION READY", "calibration": "20*log10(DN) - 67.14"},
            provenance=f"EOS-04 / ISRO (file: {self.zip_path})"
        )

class NISARGCOVReader:
    def __init__(self, h5_path: str):
        self.h5_path = h5_path
        
    def read_window(self, row_slice: slice, col_slice: slice) -> SARScene:
        with h5py.File(self.h5_path, 'r') as f:
            base_group = f['/science/SSAR/GCOV/grids/frequencyA']
            
            # Read subsets to save memory
            hhhh_linear = base_group['HHHH'][row_slice, col_slice]
            hvhv_linear = base_group['HVHV'][row_slice, col_slice]
            hhhv_linear = base_group['HHHV'][row_slice, col_slice]
            
            # Auxiliary
            try: rtc_factor = base_group['rtcGammaToSigmaFactor'][row_slice, col_slice]
            except KeyError: rtc_factor = None
            try: mask = base_group['mask'][row_slice, col_slice]
            except KeyError: mask = None
            
            # Coordinates
            x_coords = base_group['xCoordinates'][col_slice]
            y_coords = base_group['yCoordinates'][row_slice]
            
            # Convert linear to dB
            def to_db(arr):
                out = np.full(arr.shape, np.nan, dtype=np.float32)
                valid = (arr > 0) & (~np.isnan(arr))
                out[valid] = 10.0 * np.log10(arr[valid])
                return out
                
            hhhh_db = to_db(hhhh_linear)
            hvhv_db = to_db(hvhv_linear)
            hhhv_db = to_db(np.abs(hhhv_linear))  # HHHV is complex usually, or amplitude
            
            crs = f['/science/SSAR/GCOV/grids/frequencyA'].attrs.get('projection', 'Unknown CRS')
            if isinstance(crs, bytes): crs = crs.decode('utf-8')
            
            bounds = (x_coords.min(), y_coords.min(), x_coords.max(), y_coords.max())
            res = (
                (x_coords[-1] - x_coords[0]) / max(1, len(x_coords) - 1),
                abs((y_coords[-1] - y_coords[0]) / max(1, len(y_coords) - 1))
            )
            
            arrays = {
                "HHHH": hhhh_db,
                "HVHV": hvhv_db,
                "HHHV": hhhv_db
            }
            if rtc_factor is not None: arrays["rtcGammaToSigmaFactor"] = rtc_factor
            if mask is not None: arrays["mask"] = mask

            return SARScene(
                source="NISAR",
                acquisition_time="Unknown",
                crs=str(crs),
                bounds=bounds,
                resolution=res,
                polarizations=["HHHH", "HVHV", "HHHV"],
                arrays=arrays,
                units="dB",
                nodata=np.nan,
                metadata={"status": "INGESTION READY", "calibration": "10*log10(linear_power)"},
                provenance=f"NISAR / ISRO-NASA (file: {self.h5_path})"
            )
