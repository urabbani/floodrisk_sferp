/**
 * Google Earth Engine Script: Extract HydroSHEDS Streams for Sindh Province
 *
 * This script extracts stream network data from USGS HydroSHEDS
 * for the Sindh Province flood risk assessment area.
 *
 * Usage:
 * 1. Open https://code.earthengine.google.com/
 * 2. Create new script
 * 3. Paste this code
 * 4. Run to verify (check Console tab)
 * 5. Click "Run" in Tasks tab to export
 * 6. Download from Google Drive
 *
 * Author: Flood Risk Assessment Team
 * Date: 2026-03-24
 * License: CC-BY 4.0 (HydroSHEDS data)
 */

// ============================================
// CONFIGURATION
// ============================================

// Area of Interest: Sindh Province, Pakistan
// UTM Zone 42N extent converted to WGS 84
// Approximate bounds for Sub-Catchments area
var AOI_BOUNDS = {
  minLon: 66.0,
  minLat: 24.0,
  maxLon: 71.0,
  maxLat: 29.0
};

// Stream order filter (Strahler stream order)
// 1-3 = Small streams (headwaters)
// 4-6 = Medium tributaries
// 7-10 = Major rivers
var MIN_STREAM_ORDER = 4; // Set to 1 for all streams, 4 for major rivers only

// Export settings
var EXPORT_DESCRIPTION = 'HydroSHEDS_Streams_Sindh';
var EXPORT_SCALE = 30; // meters (resolution)

// ============================================
// MAIN SCRIPT
// ============================================

// 1. Define Area of Interest
var aoi = ee.Geometry.Rectangle({
  coords: [[AOI_BOUNDS.minLon, AOI_BOUNDS.minLat],
           [AOI_BOUNDS.maxLon, AOI_BOUNDS.maxLat]],
  geodesic: false
});

print('AOI bounds:', aoi.bounds().getInfo());

// 2. Load HydroSHEDS Rivers Dataset
// Note: Verify exact asset ID in GEE Code Editor by searching "HydroSHEDS"
// Possible asset IDs (check which is available):
// - WWF/HydroSHEDS/v1/Basins
// - WWF/HydroSHEDS/v1/Boundaries
// Rivers may be in a different collection

// Try loading rivers - adjust asset path as needed
var hydroshedsRivers = ee.FeatureCollection('WWF/HydroSHEDS/v1/Basins');

// If rivers are not directly available, alternative approach:
// Use HydroSHEDS flow direction to extract stream network
// This is more complex but may be necessary

// 3. Filter to AOI
var riversInAOI = hydroshedsRivers.filterBounds(aoi);

print('Total features in AOI (before filtering):',
      riversInAOI.size().getInfo());

// 4. Filter by stream order (if RIVER_ORD attribute exists)
// Note: Attribute names may vary - check what's available
try {
  var riversFiltered = riversInAOI.filter(
    ee.Filter.gte('RIVER_ORD', MIN_STREAM_ORDER)
  );

  print('Features after stream order filter:',
        riversFiltered.size().getInfo());
} catch (e) {
  print('RIVER_ORD attribute not found. Using all features.');
  var riversFiltered = riversInAOI;
}

// 5. Select relevant attributes
// Adjust attribute names based on actual dataset
var riversSelected = riversFiltered.select([
  'HYBAS_ID',      // Basin ID
  'SUB_ID',        // Sub-basin ID (may vary)
  'HYBAS_ID',      // Basin identifier
  'DOWN_ID',       // Downstream basin
  'NEXT_DOWN'      // Next downstream
]);

// 6. Add metadata
riversSelected = riversSelected.map(function(feature) {
  return feature.set({
    'source': 'USGS HydroSHEDS',
    'extracted_at': ee.Date(Date.now()).format('YYYY-MM-dd'),
    'utm_zone': '42N',
    'province': 'Sindh'
  });
});

// 7. Display on map
Map.centerObject(aoi, 7);
Map.addLayer(aoi, {color: 'red'}, 'AOI', false);
Map.addLayer(riversSelected,
             {color: '1E88E5', width: 2},
             'HydroSHEDS Streams');

// 8. Print statistics
print('=== EXPORT SUMMARY ===');
print('Total features to export:', riversSelected.size().getInfo());
print('Asset properties:', riversSelected.propertyNames().getInfo());

// 9. Sample first feature for inspection
var firstFeature = ee.Feature(riversSelected.first());
print('Sample feature:', firstFeature.getInfo());

// ============================================
// EXPORT TASKS
// ============================================

// Export as GeoJSON (recommended for web mapping)
Export.table.toDrive({
  collection: riversSelected,
  description: EXPORT_DESCRIPTION + '_geojson',
  fileFormat: 'GeoJSON',
  fileNamePrefix: EXPORT_DESCRIPTION + '_geojson'
});

// Export as Shapefile (for GeoServer)
Export.table.toDrive({
  collection: riversSelected,
  description: EXPORT_DESCRIPTION + '_shp',
  fileFormat: 'SHP'
});

// Export as GeoPackage (modern alternative to Shapefile)
Export.table.toDrive({
  collection: riversSelected,
  description: EXPORT_DESCRIPTION + '_gpkg',
  fileFormat: 'Geopackage'
});

// ============================================
// ALTERNATIVE: Using HydroBASINS if rivers not available
// ============================================

// If HydroRIVERS is not available in GEE,
// we can use HydroBASINS (watershed boundaries)
// and derive stream network from basin topology

function extractStreamsFromBasins(basins) {
  // This is a placeholder - actual implementation would
  // use the topology (DOWN_ID, NEXT_DOWN) to extract streams
  // connecting basin pour points

  var basinCentroids = basins.map(function(basin) {
    return ee.Feature(basin.centroid(), {
      'HYBAS_ID': basin.get('HYBAS_ID'),
      'DOWN_ID': basin.get('DOWN_ID'),
      'NEXT_DOWN': basin.get('NEXT_DOWN')
    });
  });

  return basinCentroids;
}

// Uncomment to use basins instead
// var basins = ee.FeatureCollection('WWF/HydroSHEDS/v1/Basins')
//   .filterBounds(aoi);
// var streamsFromBasins = extractStreamsFromBasins(basins);

// ============================================
// NOTES
// ============================================

/*
IMPORTANT:
1. Verify the exact HydroSHEDS asset ID in GEE Code Editor
   - Search Assets tab for "HydroSHEDS"
   - Check available collections (Basins, Rivers, Boundaries)

2. Check attribute names in the dataset
   - Run print(firstFeature) to see available properties
   - Adjust select() statement accordingly

3. Stream order attribute may be named differently:
   - RIVER_ORD
   - STREAM_ORD
   - ORDER
   - Or may not exist in basins dataset

4. If rivers are not available, consider:
   a) Using HydroBASINS and deriving stream network
   b) Downloading HydroRIVERS manually from hydrosheds.org
   c) Using MERIT Hydro dataset (alternative in GEE)

5. Reprojection:
   - GEE exports in WGS 84 (EPSG:4326)
   - Use GDAL to reproject to UTM 42N:
     ogr2ogr -f GeoPackage output.gpkg input.geojson -t_srs EPSG:32642

6. For deployment:
   - Upload exported file to GeoServer
   - Create SLD style (see PLAN_ADD_HYDROSHEDS_STREAMS_GEE.md)
   - Add layer configuration to src/config/layers.ts
*/

print('=== SCRIPT COMPLETE ===');
print('1. Check Console for any errors');
print('2. Check Layers panel to preview data');
print('3. Open Tasks tab (right) to run exports');
print('4. Download from Google Drive when complete');
