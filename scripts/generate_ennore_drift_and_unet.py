import os
import json
import numpy as np
import rasterio
import torch
import segmentation_models_pytorch as smp
import matplotlib.pyplot as plt

def run_task1():
    print("--- TASK 1: Regenerating REAL U-Net probability map ---")
    sar_path = "data/demo/ennore/sar/ennore_sar.tif"
    model_path = "models/best_full_oil_unet.pth"
    out_dir = "artifacts/demo/ennore"
    os.makedirs(out_dir, exist_ok=True)

    device = torch.device("mps" if torch.backends.mps.is_available() else ("cuda" if torch.cuda.is_available() else "cpu"))
    print(f"Loading Attention U-Net from {model_path} onto {device}...")
    model = smp.Unet(
        encoder_name="resnet34",
        encoder_weights=None,
        decoder_attention_type="scse",
        in_channels=3,
        classes=1,
    )
    state_dict = torch.load(model_path, map_location=device, weights_only=True)
    model.load_state_dict(state_dict)
    model.to(device)
    model.eval()

    print(f"Reading SAR image from {sar_path}...")
    with rasterio.open(sar_path) as src:
        vv_raw = src.read(1)
        vh_raw = src.read(2) if src.count > 1 else np.zeros_like(vv_raw)
        transform = src.transform
        crs = src.crs
        height, width = vv_raw.shape

    print(f"SAR dimensions: {width}x{height}, CRS: {crs}")
    prob_map = np.zeros((height, width), dtype=np.float32)
    TILE_SIZE = 512

    print("Running tile-based inference exactly as run_ennore_demo.py (VH=band0, VV=band1, zeros=band2)...")
    for y in range(0, height, TILE_SIZE):
        for x in range(0, width, TILE_SIZE):
            h_c = min(TILE_SIZE, height - y)
            w_c = min(TILE_SIZE, width - x)
            if h_c < 32 or w_c < 32:
                continue

            patch_vv = vv_raw[y:y+h_c, x:x+w_c]
            patch_vh = vh_raw[y:y+h_c, x:x+w_c]

            pad_h = (32 - h_c % 32) % 32
            pad_w = (32 - w_c % 32) % 32

            patch_vv = np.pad(patch_vv, ((0, pad_h), (0, pad_w)), mode="reflect")
            patch_vh = np.pad(patch_vh, ((0, pad_h), (0, pad_w)), mode="reflect")

            t_vv_db = 10 * np.log10(np.clip(patch_vv, 1e-4, 10))
            t_vh_db = 10 * np.log10(np.clip(patch_vh, 1e-4, 10))
            z = np.zeros_like(t_vv_db)

            img_arr = np.stack([t_vh_db, t_vv_db, z], axis=-1)
            t = torch.from_numpy(img_arr).permute(2, 0, 1).unsqueeze(0).float() / 255.0

            with torch.no_grad():
                probs = torch.sigmoid(model(t.to(device))).squeeze().cpu().numpy()

            probs = probs[:h_c, :w_c]
            prob_map[y:y+h_c, x:x+w_c] = probs

    out_tif = os.path.join(out_dir, "u_net_probability.tif")
    print(f"Saving float32 GeoTIFF to {out_tif}...")
    with rasterio.open(
        out_tif,
        "w",
        driver="GTiff",
        height=height,
        width=width,
        count=1,
        dtype=np.float32,
        crs=crs,
        transform=transform,
    ) as dst:
        dst.write(prob_map, 1)

    out_png = os.path.join(out_dir, "u_net_probability.png")
    print(f"Saving colormapped PNG (inferno, alpha where prob<0.05) to {out_png}...")
    cmap = plt.get_cmap("inferno")
    rgba = cmap(prob_map)
    rgba[..., 3] = np.where(prob_map > 0.05, np.clip(prob_map * 0.8 + 0.2, 0.0, 1.0), 0.0)
    plt.imsave(out_png, rgba)

    min_val = float(prob_map.min())
    max_val = float(prob_map.max())
    mean_val = float(prob_map.mean())
    std_val = float(prob_map.std())

    out_meta = os.path.join(out_dir, "u_net_probability_meta.json")
    meta = {
        "source": model_path,
        "channel_order": ["VH", "VV", "zeros"],
        "threshold_used_downstream": 0.5,
        "min": min_val,
        "max": max_val,
        "mean": mean_val,
        "std": std_val
    }
    with open(out_meta, "w") as f:
        json.dump(meta, f, indent=2)

    print(f"Task 1 Complete. Prob stats: min={min_val:.6f}, max={max_val:.6f}, mean={mean_val:.6f}, std={std_val:.6f}")


def run_task2():
    print("\n--- TASK 2: Regenerating forward_forecast.geojson with physical drift ---")
    meta_path = "artifacts/demo/ennore/scenario_metadata.json"
    with open(meta_path, "r") as f:
        meta = json.load(f)

    slick_lat = meta["slick"]["lat"]
    slick_lon = meta["slick"]["lon"]
    env = meta["environment"]

    if "u_current" in env and "u_wind" in env:
        u_curr = float(env["u_current"])
        v_curr = float(env["v_current"])
        u_wind = float(env["u_wind"])
        v_wind = float(env["v_wind"])
    else:
        # Fallback to speed/direction
        w_speed = float(env["wind_speed"])
        w_dir = float(env.get("wind_direction", 248.2))
        w_rad = np.radians(w_dir)
        u_wind = w_speed * np.sin(w_rad)
        v_wind = w_speed * np.cos(w_rad)

        c_speed = float(env.get("current_speed", 0.51))
        c_dir = float(env.get("current_direction", 191.3))
        c_rad = np.radians(c_dir)
        u_curr = c_speed * np.sin(c_rad)
        v_curr = c_speed * np.cos(c_rad)

    # Physical formula: U_oil = U_current + 0.03 * U_wind
    u_oil = u_curr + 0.03 * u_wind
    v_oil = v_curr + 0.03 * v_wind

    print(f"Drift vectors: U_curr=({u_curr:.3f}, {v_curr:.3f}) m/s, U_wind=({u_wind:.3f}, {v_wind:.3f}) m/s")
    print(f"Resulting U_oil=({u_oil:.3f}, {v_oil:.3f}) m/s, Speed={np.hypot(u_oil, v_oil):.3f} m/s")

    m_per_deg_lat = 111320.0
    m_per_deg_lon = 111320.0 * np.cos(np.radians(slick_lat))

    D = 10.0  # diffusion coefficient m^2/s
    horizons = [1, 2, 4]
    forecast_features = []
    centerline_coords = [[slick_lon, slick_lat]]

    drift_angle = np.arctan2(v_oil, u_oil)
    cos_a = np.cos(drift_angle)
    sin_a = np.sin(drift_angle)

    for h in horizons:
        t_sec = h * 3600.0
        dx_m = u_oil * t_sec
        dy_m = v_oil * t_sec

        c_lon = slick_lon + (dx_m / m_per_deg_lon)
        c_lat = slick_lat + (dy_m / m_per_deg_lat)
        centerline_coords.append([c_lon, c_lat])

        # Physical diffusion growth + advective ensemble spread
        sigma_diff = np.sqrt(2.0 * D * t_sec)
        vel_spread = 0.10 * np.hypot(u_oil, v_oil) * t_sec
        semi_major_m = 2.0 * sigma_diff + vel_spread + 150.0
        semi_minor_m = 2.0 * sigma_diff + 150.0

        # Elliptical envelope polygon
        points = 32
        poly_coords = []
        for i in range(points + 1):
            phi = 2.0 * np.pi * i / points
            xp = semi_major_m * np.cos(phi)
            yp = semi_minor_m * np.sin(phi)
            xr = xp * cos_a - yp * sin_a
            yr = xp * sin_a + yp * cos_a
            plon = c_lon + (xr / (111320.0 * np.cos(np.radians(c_lat))))
            plat = c_lat + (yr / 111320.0)
            poly_coords.append([plon, plat])

        # Add envelope polygon
        forecast_features.append({
            "type": "Feature",
            "properties": {
                "forecast_hours": h,
                "horizon": f"+{h}h",
                "class": "forecast_envelope",
                "center": [c_lon, c_lat],
                "semi_major_m": round(semi_major_m, 1),
                "semi_minor_m": round(semi_minor_m, 1),
                "description": f"+{h}h Forward Drift Uncertainty Envelope"
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [poly_coords]
            }
        })

        # Add center point
        forecast_features.append({
            "type": "Feature",
            "properties": {
                "forecast_hours": h,
                "horizon": f"+{h}h",
                "class": "forecast_center",
                "name": f"+{h}h Horizon Center",
                "coordinates": [c_lon, c_lat]
            },
            "geometry": {
                "type": "Point",
                "coordinates": [c_lon, c_lat]
            }
        })

    # Add centerline LineString connecting slick centroid to all horizon centers
    forecast_features.append({
        "type": "Feature",
        "properties": {
            "class": "forecast_centerline",
            "name": "centerline",
            "description": "Trajectory centerline connecting slick centroid to +1h, +2h, and +4h forecast horizon centers"
        },
        "geometry": {
            "type": "LineString",
            "coordinates": centerline_coords
        }
    })

    out_forecast = "artifacts/demo/ennore/forward_forecast.geojson"
    with open(out_forecast, "w") as f:
        json.dump({"type": "FeatureCollection", "features": forecast_features}, f, indent=2)

    print(f"Task 2 Complete. Saved {len(forecast_features)} features to {out_forecast}")


def run_task3():
    print("\n--- TASK 3: Generating backward drift uncertainty envelope ---")
    meta_path = "artifacts/demo/ennore/scenario_metadata.json"
    with open(meta_path, "r") as f:
        meta = json.load(f)

    origin_lat = meta["drift_origin"]["lat"]
    origin_lon = meta["drift_origin"]["lon"]
    slick_lat = meta["slick"]["lat"]
    slick_lon = meta["slick"]["lon"]

    # 8-hour backward drift window, diffusion coefficient D=10 m^2/s
    t_window_sec = 8.0 * 3600.0
    D_coeff = 10.0
    sigma_diff_8h = np.sqrt(2.0 * D_coeff * t_window_sec)  # ~758.95 m

    # Advective ensemble uncertainty (10% velocity spread over 8 hours)
    # Estimate drift speed from slick-to-origin displacement
    dy_drift = (slick_lat - origin_lat) * 111320.0
    dx_drift = (slick_lon - origin_lon) * (111320.0 * np.cos(np.radians(origin_lat)))
    dist_drift = np.hypot(dx_drift, dy_drift)
    advective_spread = 0.10 * dist_drift  # ~1.73 km

    semi_major_m = 2.0 * sigma_diff_8h + advective_spread  # ~3250 m along drift axis
    semi_minor_m = 2.0 * sigma_diff_8h                     # ~1518 m transverse

    drift_angle = np.arctan2(dy_drift, dx_drift)
    cos_th = np.cos(drift_angle)
    sin_th = np.sin(drift_angle)

    origin_m_per_lon = 111320.0 * np.cos(np.radians(origin_lat))
    origin_m_per_lat = 111320.0

    points = 64
    poly_coords = []
    for i in range(points + 1):
        phi = 2.0 * np.pi * i / points
        xp = semi_major_m * np.cos(phi)
        yp = semi_minor_m * np.sin(phi)
        xr = xp * cos_th - yp * sin_th
        yr = xp * sin_th + yp * cos_th
        plon = origin_lon + (xr / origin_m_per_lon)
        plat = origin_lat + (yr / origin_m_per_lat)
        poly_coords.append([plon, plat])

    drift_uncert_geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "class": "drift_uncertainty_envelope",
                    "origin": [origin_lon, origin_lat],
                    "diffusion_coefficient_D": D_coeff,
                    "time_window_hours": 8.0,
                    "sigma_diffusion_m": round(sigma_diff_8h, 2),
                    "semi_major_m": round(semi_major_m, 1),
                    "semi_minor_m": round(semi_minor_m, 1),
                    "orientation_deg": round(float(np.degrees(drift_angle) % 360), 2),
                    "description": "8-hour backward drift uncertainty envelope (D=10 m^2/s)"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [poly_coords]
                }
            }
        ]
    }

    out_uncert = "artifacts/demo/ennore/drift_uncertainty.geojson"
    with open(out_uncert, "w") as f:
        json.dump(drift_uncert_geojson, f, indent=2)

    print(f"Task 3 Complete. Saved backward drift uncertainty envelope to {out_uncert}")


if __name__ == "__main__":
    run_task1()
    run_task2()
    run_task3()
    print("\nAll 3 tasks executed successfully.")
