import os
import cv2
import matplotlib.pyplot as plt
from ultralytics import YOLO

def main():
    print("--- EVALUATING YOLO ON VALIDATION DATA ---")
    model = YOLO("runs/detect/runs/xview3/full_train/weights/best.pt")
    
    # We know ALL == MANUAL because val_ais is empty
    out_dir = "data/yolo_real"
    
    metrics = model.val(data=f"{out_dir}/dataset.yaml", split="val", verbose=False)
    
    try:
        p = metrics.results_dict.get('metrics/precision(B)', 0.0)
        r = metrics.results_dict.get('metrics/recall(B)', 0.0)
        map50 = metrics.results_dict.get('metrics/mAP50(B)', 0.0)
        map50_95 = metrics.results_dict.get('metrics/mAP50-95(B)', 0.0)
    except:
        p, r, map50, map50_95 = 0, 0, 0, 0
        
    speed = metrics.speed.get("inference", 0.0) if hasattr(metrics, "speed") else 0.0
    
    print("\n--- METRICS ---")
    print("Note: The 2 Validation Scenes contain 0 AIS-only inferred squares.")
    print("100% of the Validation Evaluation uses true native manual boxes.")
    print(f"Precision: {p:.4f}")
    print(f"Recall: {r:.4f}")
    print(f"mAP50: {map50:.4f}")
    print(f"mAP50-95: {map50_95:.4f}")
    print(f"Inference Speed: {speed:.2f} ms/img")

    # Generate Visualization
    print("\nGenerating visual overlay...")
    val_images = [f for f in os.listdir(f"{out_dir}/images/val") if f.endswith(".jpg")]
    if val_images:
        sample = val_images[0]
        img_path = f"{out_dir}/images/val/{sample}"
        lbl_path = f"{out_dir}/labels/val/{sample.replace('.jpg', '.txt')}"
        
        img = cv2.imread(img_path)
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        gt_img = img_rgb.copy()
        if os.path.exists(lbl_path):
            with open(lbl_path, "r") as f:
                for line in f:
                    parts = line.strip().split()
                    if not parts: continue
                    _, nx, ny, nw, nh = map(float, parts)
                    h, w, _ = img.shape
                    cx, cy = int(nx * w), int(ny * h)
                    bw, bh = int(nw * w), int(nh * h)
                    cv2.rectangle(gt_img, (cx - bw//2, cy - bh//2), (cx + bw//2, cy + bh//2), (0, 255, 0), 2)
                    
        res = model(img, verbose=False)[0]
        pred_img = img_rgb.copy()
        for box in res.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            conf = float(box.conf[0])
            cv2.rectangle(pred_img, (x1, y1), (x2, y2), (255, 0, 0), 2)
            cv2.putText(pred_img, f"{conf:.2f}", (x1, y1-5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 2)
            
        fig, axes = plt.subplots(1, 3, figsize=(15, 5))
        axes[0].imshow(img_rgb)
        axes[0].set_title("SAR Crop")
        axes[0].axis("off")
        
        axes[1].imshow(gt_img)
        axes[1].set_title("Ground Truth (Native Box)")
        axes[1].axis("off")
        
        axes[2].imshow(pred_img)
        axes[2].set_title("YOLOv8 Prediction")
        axes[2].axis("off")
        
        plt.tight_layout()
        out_file = "/Users/devopsdreamer/.gemini/antigravity/brain/f82eb8e5-4ff2-4905-818e-2a4a966a3104/phase_i2_yolo_predictions.png"
        plt.savefig(out_file)
        print(f"Visualization saved to {out_file}")

if __name__ == "__main__":
    main()
