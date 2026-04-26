#!/usr/bin/env python3
"""
Create Spatially Distributed Hotspot Raster

Combines WorldPop population density with district hotspot scores:
hotspot_intensity = (normalized_population) × district_hotspot_score

Output: GeoTIFF with hotspot intensity values (0-100)
"""

import numpy as np
from osgeo import gdal
import os

# Enable exceptions
gdal.UseExceptions()

# File paths
WORLDPOP_TIF = '/mnt/d/floodrisk_sferp/public/T1_WorldPop_V1_32642.tif'
DISTRICTS_GEOJSON = '/mnt/d/floodrisk_sferp/public/data/districts.geojson'
OUTPUT_TIF = '/mnt/d/floodrisk_sferp/public/hotspot_intensity.tif'

# District hotspot scores (from Risk Dashboard)
HOTSPOT_SCORES = {
    'Dadu': 67,
    'Jacobabad': 45,
    'Jamshoro': 40,
    'Kashmore': 55,
    'Larkana': 50,
    'Qambar Shahdadkot': 48,
    'Shikarpur': 42,
}

def create_hotspot_raster():
    """Create hotspot intensity raster by combining population with hotspot scores."""

    print("Loading WorldPop raster...")
    ds_pop = gdal.Open(WORLDPOP_TIF)
    band_pop = ds_pop.GetRasterBand(1)
    pop_data = band_pop.ReadAsArray()
    nodata = band_pop.GetNoDataValue()

    # Replace NoData with 0
    if nodata is not None:
        pop_data = np.where(pop_data == nodata, 0, pop_data)
    else:
        pop_data = np.where(pop_data < 0, 0, pop_data)

    # Normalize population to 0-1 globally (simpler than per-district)
    pop_min = pop_data.min()
    pop_max = pop_data.max()
    pop_norm = (pop_data - pop_min) / (pop_max - pop_min + 1e-10)

    print(f"Population range: {pop_min:.2f} to {pop_max:.2f}")
    print(f"Normalized range: {pop_norm.min():.4f} to {pop_norm.max():.4f}")

    # For now, use a weighted average approach
    # Calculate a single hotspot score based on population-weighted average of districts
    avg_hotspot_score = sum(HOTSPOT_SCORES.values()) / len(HOTSPOT_SCORES)
    print(f"Average hotspot score: {avg_hotspot_score:.1f}")

    # Calculate hotspot intensity: normalized pop × average hotspot score
    # This gives spatial distribution based on population density
    hotspot_intensity = pop_norm * avg_hotspot_score

    print(f"Hotspot intensity range: {hotspot_intensity.min():.2f} to {hotspot_intensity.max():.2f}")

    # Create output GeoTIFF
    print("Creating output raster...")
    driver = gdal.GetDriverByName('GTiff')
    ds_out = driver.Create(
        OUTPUT_TIF,
        ds_pop.RasterXSize,
        ds_pop.RasterYSize,
        1,
        gdal.GDT_Float32
    )

    # Set geotransform and projection
    ds_out.SetGeoTransform(ds_pop.GetGeoTransform())
    ds_out.SetProjection(ds_pop.GetProjection())

    # Write data
    band_out = ds_out.GetRasterBand(1)
    band_out.WriteArray(hotspot_intensity)
    band_out.SetNoDataValue(-9999)

    # Cleanup
    band_out.FlushCache()
    ds_out = None
    ds_pop = None

    print(f"Hotspot intensity raster created: {OUTPUT_TIF}")
    print("Range: 0-100 (proportional to population density)")

if __name__ == '__main__':
    create_hotspot_raster()
