import os
import matplotlib.pyplot as plt
import cv2
import rasterio
from ultralytics import YOLO

def main():
    print("--- PHASE I: REAL VESSEL DETECTION ---")
    
    data_yaml = os.path.abspath("data/yolo_dataset/dataset.yaml")
    
    print("1. Training YOLOv8n on CFAR candidates...")
    model = YOLO("models/yolov8n.pt")
    
    # Controlled run: 5 epochs, imgsz=128
    results = model.train(
        data=data_yaml,
        epochs=5,
        imgsz=128,
        batch=4,
        device="mps",
        project="runs/detect",
        name="xview3_vessel_train",
        exist_ok=True,
        verbose=False
    )
    
    print("\n2. YOLOv8 Validation Results (Held-Out Data):")
    # Actually results is a DetMetrics object
    metrics = model.val()
    
    # Safely get metrics
    try:
        p = metrics.results_dict.get('metrics/precision(B)', 0.0)
        r = metrics.results_dict.get('metrics/recall(B)', 0.0)
        map50 = metrics.results_dict.get('metrics/mAP50(B)', 0.0)
        map50_95 = metrics.results_dict.get('metrics/mAP50-95(B)', 0.0)
    except:
        p, r, map50, map50_95 = 0.0, 0.0, 0.0, 0.0
        
    print(f"   Precision: {p:.4f}")
    print(f"   Recall: {r:.4f}")
    print(f"   mAP50: {map50:.4f}")
    print(f"   mAP50-95: {map50_95:.4f}")
    
    speed_inf = metrics.speed.get("inference", 0.0) if hasattr(metrics, "speed") else 0.0
    print(f"   Inference Speed: {speed_inf:.2f} ms/img")

    print("\n3. Visualizing Outputs...")
    # Let's visualize the pos_val.jpg
    val_img_path = "data/yolo_dataset/images/val/pos_val.jpg"
    if os.path.exists(val_img_path):
        img = cv2.imread(val_img_path)
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Predict
        res = model(img)[0]
        
        # Plot
        fig, axes = plt.subplots(1, 3, figsize=(12, 4))
        
        # SAR Scene (crop)
        axes[0].imshow(img_rgb)
        axes[0].set_title("SAR Crop (CFAR Candidate)")
        axes[0].axis('off')
        
        # GT
        gt_img = img_rgb.copy()
        with open("data/yolo_dataset/labels/val/pos_val.txt", "r") as f:
            line = f.read().strip()
            if line:
                c, nx, ny, nw, nh = map(float, line.split())
                h, w, _ = gt_img.shape
                x1 = int((nx - nw/2) * w)
                y1 = int((ny - nh/2) * h)
                x2 = int((nx + nw/2) * w)
                y2 = int((ny + nh/2) * h)
                cv2.rectangle(gt_img, (x1, y1), (x2, y2), (0, 255, 0), 2)
                
        axes[1].imshow(gt_img)
        axes[1].set_title("Ground Truth Vessel")
        axes[1].axis('off')
        
        # Pred
        pred_img = img_rgb.copy()
        if len(res.boxes) > 0:
            for box in res.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                conf = float(box.conf[0])
                cv2.rectangle(pred_img, (x1, y1), (x2, y2), (255, 0, 0), 2)
                cv2.putText(pred_img, f"{conf:.2f}", (x1, y1-5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 1)
        axes[2].imshow(pred_img)
        axes[2].set_title("YOLO Detection")
        axes[2].axis('off')
        
        plt.tight_layout()
        artifact_path = "/Users/devopsdreamer/.gemini/antigravity/brain/f82eb8e5-4ff2-4905-818e-2a4a966a3104/phase_i_yolo_vis.png"
        plt.savefig(artifact_path)
        print(f"   Saved visualization to {artifact_path}")
    else:
        print("   No validation image to visualize.")
        
    print("\n--- PHASE I COMPLETE ---")

if __name__ == "__main__":
    main()
