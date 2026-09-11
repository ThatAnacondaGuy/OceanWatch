import numpy as np
import xarray as xr
from datetime import timedelta

class OutOfBoundsError(Exception):
    pass

class EnvironmentalAdapter:
    def __init__(self, nc_path, u_var, v_var, is_wind=False):
        self.nc_path = nc_path
        self.u_var = u_var
        self.v_var = v_var
        self.is_wind = is_wind
        
        try:
            self.ds = xr.open_dataset(nc_path)
            self.has_data = True
            self._normalize_dataset()
        except (FileNotFoundError, OSError):
            self.has_data = False

    def _normalize_dataset(self):
        rename_dict = {}
        for coord in self.ds.coords:
            cl = str(coord).lower()
            if cl in ['latitude', 'lat']: rename_dict[coord] = 'lat'
            elif cl in ['longitude', 'lon']: rename_dict[coord] = 'lon'
            elif cl in ['time', 't', 'valid_time']: rename_dict[coord] = 'time'
            elif cl in ['depth', 'z', 'elevation']: rename_dict[coord] = 'depth'
            
        self.ds = self.ds.rename(rename_dict)
        
        if 'depth' in self.ds.coords:
            self.ds = self.ds.isel(depth=0).drop_vars('depth', errors='ignore')

        self.lon_min = float(self.ds.lon.min())
        self.lon_max = float(self.ds.lon.max())

        self.lat_min = float(self.ds.lat.min())
        self.lat_max = float(self.ds.lat.max())
        self.time_min = self.ds.time.min().values
        self.time_max = self.ds.time.max().values

    def get_velocity(self, lons, lats, time):
        if not self.has_data:
            raise OutOfBoundsError(f"Dataset missing for {self.nc_path}")

        time_np = np.datetime64(time)
        if time_np < self.time_min or time_np > self.time_max:
            raise OutOfBoundsError(f"Time {time} out of bounds [{self.time_min}, {self.time_max}].")

        lons_wrapped = np.array(lons, dtype=float)
        # Normalize to -180..180
        lons_wrapped = (lons_wrapped + 180.0) % 360.0 - 180.0
        # Check if dataset uses 0..360 format
        if self.lon_max > 180.0 or (self.lon_min >= 0 and np.any(lons_wrapped < 0)):
            lons_wrapped = np.where(lons_wrapped < 0, lons_wrapped + 360.0, lons_wrapped)

        if np.any(lons_wrapped < self.lon_min) or np.any(lons_wrapped > self.lon_max):
            raise OutOfBoundsError(f"Longitudes out of spatial bounds [{self.lon_min}, {self.lon_max}].")
        if np.any(np.array(lats) < self.lat_min) or np.any(np.array(lats) > self.lat_max):
            raise OutOfBoundsError(f"Latitudes out of spatial bounds [{self.lat_min}, {self.lat_max}].")

        lon_da = xr.DataArray(lons_wrapped, dims='points')
        lat_da = xr.DataArray(np.array(lats, dtype=float), dims='points')
        
        try:
            ds_interp = self.ds.interp(lon=lon_da, lat=lat_da, time=time_np, method='linear')
        except ValueError:
            ds_interp = self.ds.interp(lon=lon_da, lat=lat_da, time=time_np, method='nearest')

        u_vals = ds_interp[self.u_var].values
        v_vals = ds_interp[self.v_var].values

        if np.isnan(u_vals).any() or np.isnan(v_vals).any():
            raise OutOfBoundsError("Interpolation resulted in NaN (missing data).")

        return u_vals, v_vals

class LagrangianDriftModel:
    def __init__(self, wind_adapter, current_adapter, dt_seconds=900, diffusion_coeff=10.0):
        self.wind = wind_adapter
        self.current = current_adapter
        self.dt = dt_seconds
        self.base_D = diffusion_coeff

    def advect_particles(self, lons, lats, time, direction=1, 
                         wind_scale=1.0, wind_rot=0.0, 
                         current_scale=1.0, diff_scale=1.0):
        n_particles = len(lons)
        
        u_curr, v_curr = self.current.get_velocity(lons, lats, time)
        u_wind, v_wind = self.wind.get_velocity(lons, lats, time)
        
        u_curr *= current_scale
        v_curr *= current_scale
        
        wind_speed = np.sqrt(u_wind**2 + v_wind**2) * wind_scale
        wind_dir = np.arctan2(v_wind, u_wind) + np.radians(wind_rot)
        
        u_wind_pert = wind_speed * np.cos(wind_dir)
        v_wind_pert = wind_speed * np.sin(wind_dir)
        
        u_oil = u_curr + 0.03 * u_wind_pert
        v_oil = v_curr + 0.03 * v_wind_pert
        
        u_oil *= direction
        v_oil *= direction
        
        D = self.base_D * diff_scale
        rand_walk_x = np.sqrt(2 * D * self.dt) * np.random.randn(n_particles)
        rand_walk_y = np.sqrt(2 * D * self.dt) * np.random.randn(n_particles)
        
        lat_rad = np.radians(lats)
        m_per_deg_lon = 111320.0 * np.cos(lat_rad)
        m_per_deg_lat = 111320.0
        
        dx_deg = (u_oil * self.dt + rand_walk_x) / m_per_deg_lon
        dy_deg = (v_oil * self.dt + rand_walk_y) / m_per_deg_lat
        
        return lons + dx_deg, lats + dy_deg

class DriftEnsembleManager:
    def __init__(self, wind_path, current_path):
        self.wind_adapter = EnvironmentalAdapter(wind_path, 'u10', 'v10', is_wind=True)
        self.current_adapter = EnvironmentalAdapter(current_path, 'uo', 'vo', is_wind=False)
        self.model = LagrangianDriftModel(self.wind_adapter, self.current_adapter)

    def run_ensemble(self, init_lons, init_lats, start_time, duration_hours=24, 
                     direction=-1, n_runs=30, n_particles_per_run=1000):
        dt_hours = self.model.dt / 3600.0
        steps = int(duration_hours / dt_hours)
        
        all_trajectories = []
        
        for run in range(n_runs):
            wind_s = np.random.uniform(0.9, 1.1)
            wind_r = np.random.uniform(-15.0, 15.0)
            curr_s = np.random.uniform(0.9, 1.1)
            diff_s = np.random.uniform(0.5, 1.5)
            
            lons = np.array(init_lons[:n_particles_per_run])
            lats = np.array(init_lats[:n_particles_per_run])
            
            run_traj = [(lons.copy(), lats.copy())]
            current_time = start_time
            
            for step in range(steps):
                lons, lats = self.model.advect_particles(
                    lons, lats, current_time, direction,
                    wind_scale=wind_s, wind_rot=wind_r,
                    current_scale=curr_s, diff_scale=diff_s
                )
                if (step + 1) % int(3600 / self.model.dt) == 0:
                    run_traj.append((lons.copy(), lats.copy()))
                    
                current_time += timedelta(seconds=self.model.dt * direction)
                
            all_trajectories.append(run_traj)
            
        return all_trajectories

    def generate_probability_heatmap(self, trajectories, grid_size=100):
        endpoints_lon = []
        endpoints_lat = []
        for run in trajectories:
            endpoints_lon.extend(run[-1][0])
            endpoints_lat.extend(run[-1][1])
            
        heatmap, xedges, yedges = np.histogram2d(
            endpoints_lon, endpoints_lat, bins=grid_size, density=True
        )
        return heatmap, xedges, yedges
