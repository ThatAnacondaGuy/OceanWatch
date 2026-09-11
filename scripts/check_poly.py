from shapely.geometry import shape, Point, Polygon
target = Point(-89.02, 28.93)
poly = Polygon([(-88.713844, 28.030428), (-86.152023, 28.443466), (-86.495132, 30.190237), (-89.101257, 29.780277), (-88.713844, 28.030428)])
print(f"Target is inside? {poly.intersects(target)}")
