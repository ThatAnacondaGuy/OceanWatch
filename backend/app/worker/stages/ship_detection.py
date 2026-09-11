import os
import numpy as np
from backend.app.worker.stages.cfar import CFARDetector

class ShipDetectionModule:
    def __init__(self, yolo_model_path=None):
        self.cfar = CFARDetector(window_size=51, guard_size=11, k=3.5)
        self.yolo_model_path = yolo_model_path
        self.untrained_mode = not os.path.exists(yolo_model_path) if yolo_model_path else True
        
        if not self.untrained_mode:
            try:
                from ultralytics import YOLO
                self.yolo = YOLO(self.yolo_model_path)
            except ImportError:
                print("Ultralytics not installed. Defaulting to untrained mode.")
                self.untrained_mode = True

    def normalize_sar_crop(self, crop, min_db=-30.0, max_db=0.0):
        """
        Deterministic normalization strategy for SAR amplitude/dB crops.
        Maps physical backscatter values to [0, 255] for YOLO 8-bit compatibility,
        preserving multi-channel polarization information securely.
        """
        crop_clipped = np.clip(crop, min_db, max_db)
        crop_norm = (crop_clipped - min_db) / (max_db - min_db)
        crop_8bit = (crop_norm * 255.0).astype(np.uint8)
        
        if len(crop_8bit.shape) == 2:
            # Single pol (e.g., VV) -> Broadcast to RGB
            return np.stack([crop_8bit]*3, axis=-1)
        elif len(crop_8bit.shape) == 3 and crop_8bit.shape[-1] == 2:
            # Dual pol (VV, VH) -> pseudo-RGB (VV, VH, VV+VH avg)
            vv = crop_8bit[..., 0]
            vh = crop_8bit[..., 1]
            avg = (vv / 2.0 + vh / 2.0).astype(np.uint8)
            return np.stack([vv, vh, avg], axis=-1)
        else:
            # Fallback for unexpected channel counts
            return crop_8bit[..., :3] if len(crop_8bit.shape) == 3 else crop_8bit
                
    def detect(self, img_array, transform=None):
        """
        Integration: SAR -> CFAR -> RoIs -> YOLOv8
        """
        print("Running CFAR...")
        detections_mask = self.cfar.detect(img_array)
        rois = self.cfar.extract_rois(img_array.shape, detections_mask, transform)
        
        print(f"CFAR extracted {len(rois)} candidate RoIs.")
        
        verified_ships = []
        if self.untrained_mode:
            print("[INFO] YOLOv8 model is UNTRAINED or unavailable. Running in Pipeline Test Mode.")
            print("[INFO] Passing through CFAR candidate RoIs without neural verification.")
            for roi in rois:
                roi["confidence"] = 0.0
                roi["label"] = "vessel_candidate"
                verified_ships.append(roi)
        else:
            print("[INFO] Running YOLOv8 verification on RoIs...")
            for roi in rois:
                xmin, ymin, xmax, ymax = roi["bbox"]
                crop = img_array[ymin:ymax, xmin:xmax]
                
                # Apply deterministic crop normalization
                crop_3c = self.normalize_sar_crop(crop)
                
                results = self.yolo(crop_3c, verbose=False)
                
                if len(results) > 0 and len(results[0].boxes) > 0:
                    best_conf = float(results[0].boxes.conf.max().cpu().numpy())
                    best_cls = int(results[0].boxes.cls[0].cpu().numpy())
                    if best_cls == 0 and best_conf > 0.5:
                        roi["confidence"] = best_conf
                        roi["label"] = "verified_vessel"
                        verified_ships.append(roi)
                        
        return verified_ships
