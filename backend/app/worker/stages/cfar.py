import numpy as np
from scipy.ndimage import uniform_filter, label, find_objects
import rasterio

class CFARDetector:
    def __init__(self, window_size=51, guard_size=11, k=3.5):
        """
        Fast mathematical approximation of a 2D CA-CFAR detector using uniform-filter sliding averages (full-window minus guard-window).
        window_size: Size of the local background window.
        guard_size: Size of the guard window (excluded from background).
        k: Threshold multiplier (default 3.5).
        """
        self.window_size = window_size
        self.guard_size = guard_size
        self.k = k

    def detect(self, img):
        """
        Fast approximation of CFAR using uniform filters.
        img: 2D numpy array (SAR amplitude/intensity).
        Returns binary mask of detections.
        """
        # Ensure float32
        img = img.astype(np.float32)
        
        # Calculate local mean and variance over the full window
        mean_full = uniform_filter(img, size=self.window_size)
        sqr_mean_full = uniform_filter(img**2, size=self.window_size)
        
        # Calculate local mean and variance over the guard window
        mean_guard = uniform_filter(img, size=self.guard_size)
        sqr_mean_guard = uniform_filter(img**2, size=self.guard_size)
        
        # Calculate background only (full window minus guard window)
        # N_full = window_size**2, N_guard = guard_size**2
        N_f = self.window_size ** 2
        N_g = self.guard_size ** 2
        N_b = N_f - N_g
        
        if N_b <= 0:
            raise ValueError("Window size must be strictly greater than guard size.")
            
        mean_bg = (mean_full * N_f - mean_guard * N_g) / N_b
        sqr_mean_bg = (sqr_mean_full * N_f - sqr_mean_guard * N_g) / N_b
        
        var_bg = sqr_mean_bg - mean_bg**2
        var_bg = np.maximum(var_bg, 0) # Avoid negative variance due to precision
        std_bg = np.sqrt(var_bg)
        
        # CFAR Threshold
        threshold = mean_bg + self.k * std_bg
        
        # Detections
        detections = img > threshold
        return detections

    def extract_rois(self, img_shape, detections, transform, min_size=3, max_size=500, padding=10):
        """
        Extract Regions of Interest (RoIs) from the binary detection mask.
        Returns a list of dicts with bounding boxes and geographic coordinates.
        """
        labeled_array, num_features = label(detections)
        objects = find_objects(labeled_array)
        
        rois = []
        for i, slice_obj in enumerate(objects):
            if slice_obj is None:
                continue
                
            y_slice, x_slice = slice_obj
            h = y_slice.stop - y_slice.start
            w = x_slice.stop - x_slice.start
            
            if h < min_size or w < min_size or h > max_size or w > max_size:
                continue
                
            # Add padding
            ymin = max(0, y_slice.start - padding)
            ymax = min(img_shape[0], y_slice.stop + padding)
            xmin = max(0, x_slice.start - padding)
            xmax = min(img_shape[1], x_slice.stop + padding)
            
            # Geographic coordinates of the center
            center_x = (xmin + xmax) / 2.0
            center_y = (ymin + ymax) / 2.0
            
            if transform is not None:
                lon, lat = transform * (center_x, center_y)
            else:
                lon, lat = 0.0, 0.0
                
            rois.append({
                "id": i,
                "bbox": [xmin, ymin, xmax, ymax],
                "center": (center_x, center_y),
                "geo": (lon, lat)
            })
            
        return rois
