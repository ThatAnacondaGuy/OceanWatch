import numpy as np
import matplotlib.pyplot as plt

# SAR bounds
min_lon, max_lon = 80.2, 80.6
min_lat, max_lat = 13.0, 13.5
origin_lat, origin_lon = 13.274952636456051, 80.41271206103805

# Image size
width, height = 1024, 1024

x = np.linspace(min_lon, max_lon, width)
y = np.linspace(max_lat, min_lat, height)
X, Y = np.meshgrid(x, y)

# Elliptical Gaussian
sigma_x = 0.02
sigma_y = 0.008
theta = np.radians(246.4) # aligned with drift

dX = X - origin_lon
dY = Y - origin_lat

x_rot = dX * np.cos(theta) - dY * np.sin(theta)
y_rot = dX * np.sin(theta) + dY * np.cos(theta)

Z = np.exp(-0.5 * ((x_rot / sigma_x)**2 + (y_rot / sigma_y)**2))

# Map to hot colormap with transparency
cmap = plt.get_cmap('hot')
rgba = cmap(Z)
# Set alpha based on probability value
rgba[..., 3] = np.where(Z > 0.05, Z * 0.8, 0.0)

plt.imsave("artifacts/demo/ennore/drift_heatmap.png", rgba)
print("Saved artifacts/demo/ennore/drift_heatmap.png")
