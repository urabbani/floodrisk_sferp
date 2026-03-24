/**
 * Google Earth Engine Script: Extract Stream Network from Flow Accumulation
 *
 * This script derives stream networks from HydroSHEDS Flow Accumulation
 * for the Sindh Province flood risk assessment area.
 *
 * ADVANTAGE: You control stream density by adjusting the threshold!
 *
 * Usage:
 * 1. Open https://code.earthengine.google.com/
 * 2. Create new script
 * 3. Paste this code
 * 4. Run to preview (adjust threshold as needed)
 * 5. Export when satisfied
 *
 * Author: Flood Risk Assessment Team
 * Date: 2026-03-24
 * License: CC-BY 4.0 (HydroSHEDS data)
 */

// ============================================
// CONFIGURATION
// ============================================

// Area of Interest: Sindh Province, Pakistan
var AOI = ee.Geometry.Rectangle({
  coords: [[66.0, 24.0], [71.0, 29.0]], // [minLon, minLat, maxLon, maxLat]
  geodesic: false
});

// Flow Accumulation Threshold
// HIGHER = Fewer, larger rivers (major rivers only)
// LOWER = More streams (includes small tributaries)
//
// Recommended values:
// - 10000: Major rivers only (Indus, Chenab main stems)
// - 5000:  Major rivers + large tributaries
// - 2000:  Moderate density (recommended for flood mapping)
// - 1000:  High density (includes smaller streams)
// - 500:   Very high density (may be too dense for visualization)

var FLOW_THRESHOLD = 2000;

// Stream resolution (arc-seconds)
// 15 = ~500m (higher detail, larger file)
// 30 = ~1km   (lower detail, smaller file, faster)

var RESOLUTION_ARCSEC = 15;

// Export settings
var EXPORT_DESCRIPTION = 'HydroSHEDS_Streams_Sindh_T' + FLOW_THRESHOLD;

// ============================================
// LOAD DATA
// ============================================

// Load HydroSHEDS Flow Accumulation
// Available resolutions: 15 or 30 arc-seconds
var flowAcc = ee.Image('WWF/HydroSHEDS/15ACC'); // Use 'WWF/HydroSHEDS/30ACC' for 1km

// Clip to AOI
var flowAccClip = flowAcc.clip(AOI);

// ============================================
// DERIVE STREAM NETWORK
// ============================================

// Apply threshold to extract streams
// This creates a binary image: 1 = stream, 0 = no stream
var streamsBinary = flowAccClip.gt(FLOW_THRESHOLD);

// Convert to vectors (line features)
// This traces the stream network from the raster
var streamsVector = streamsBinary.reduceToVectors({
  geometry: AOI,
  scale: 30, // meters (processing resolution)
  maxPixels: 1e10,
  geometryType: 'line', // Extract as line features
  eightConnected: false, // Use 4-direction connectivity (better for streams)
  labelProperty: 'stream_id'
});

// ============================================
// ADD ATTRIBUTES
// ============================================

// Add flow accumulation value to each stream segment
var streamsWithAttr = streamsVector.map(function(feature) {
  // Get mean flow accumulation for this stream segment
  var stats = flowAccClip.reduceRegion({
    geometry: feature.geometry(),
    reducer: ee.Reducer.mean(),
    scale: 30,
    maxPixels: 1e10
  });

  // Calculate stream order based on flow accumulation
  // (Simplified Strahler classification)
  var meanFlow = ee.Number(stats.get('b1'));
  var streamOrder = ee.Algorithms.If(
    meanFlow.gte(10000), 3,      // Major rivers
    ee.Algorithms.If(
      meanFlow.gte(2000), 2,     // Tributaries
      1                          // Small streams
    )
  );

  return feature
    .set('flow_acc_mean', meanFlow)
    .set('stream_order', streamOrder)
    .set('source', 'HydroSHEDS Flow Accumulation')
    .set('threshold', FLOW_THRESHOLD)
    .set('extracted_at', ee.Date(Date.now()).format('YYYY-MM-dd'));
});

// ============================================
// VISUALIZATION
// ============================================

// Center map on AOI
Map.centerObject(AOI, 7);

// Display flow accumulation (for reference)
var flowVis = {
  min: 0,
  max: 10000,
  palette: ['white', 'lightblue', 'blue', 'darkblue', 'navy']
};
Map.addLayer(flowAccClip, flowVis, 'Flow Accumulation', false);

// Display extracted streams (color by stream order)
var streamsVis = streamsWithAttr.style({
  color: '1E88E5',
  width: 2
});
Map.addLayer(streamsVis, {}, 'Extracted Streams');

// Display AOI boundary
Map.addLayer(AOI, {color: 'red'}, 'AOI', false);

// ============================================
// STATISTICS
// ============================================

print('=== STREAM NETWORK STATISTICS ===');
print('Flow Threshold:', FLOW_THRESHOLD);
print('Total Stream Features:', streamsWithAttr.size());
print('Stream Order Distribution:',
      streamsWithAttr.aggregate_array('stream_order')
        .reduce(ee.Reducer.frequencyHistogram()));

// Sample first feature
var firstFeature = ee.Feature(streamsWithAttr.first());
print('Sample Stream Segment:', firstFeature);

// ============================================
// EXPORT
// ============================================

// Export as GeoJSON (recommended)
Export.table.toDrive({
  collection: streamsWithAttr,
  description: EXPORT_DESCRIPTION + '_geojson',
  fileFormat: 'GeoJSON'
});

// Export as Shapefile (for GeoServer)
Export.table.toDrive({
  collection: streamsWithAttr,
  description: EXPORT_DESCRIPTION + '_shp',
  fileFormat: 'SHP'
});

// Export as GeoPackage (modern alternative)
Export.table.toDrive({
  collection: streamsWithAttr,
  description: EXPORT_DESCRIPTION + '_gpkg',
  fileFormat: 'Geopackage'
});

// ============================================
// ALTERNATIVE: Multi-Threshold Export
// ============================================

// If you want to export multiple stream density levels
// at once, uncomment this section:

/*
var thresholds = [500, 1000, 2000, 5000, 10000];
var thresholdNames = ['dense', 'high', 'medium', 'low', 'major'];

thresholds.forEach(function(threshold, index) {
  var streams = flowAccClip.gt(threshold).reduceToVectors({
    geometry: AOI,
    scale: 30,
    maxPixels: 1e10,
    geometryType: 'line',
    eightConnected: false
  });

  Export.table.toDrive({
    collection: streams,
    description: 'Streams_' + thresholdNames[index] + '_T' + threshold,
    fileFormat: 'GeoJSON'
  });
});
*/

// ============================================
// NOTES
// ============================================

/*
THRESHOLD SELECTION GUIDE:

Choose threshold based on your purpose:

1. FLOOD RISK MAPPING (Recommended: 2000-5000)
   - Shows major drainage paths
   - Not too dense for visualization
   - Captures rivers that matter for flood analysis

2. HYDROLOGICAL MODELING (Recommended: 500-1000)
   - Includes smaller tributaries
   - More complete flow network
   - Better for runoff modeling

3. BASEMAP/GENERAL REFERENCE (Recommended: 5000-10000)
   - Only major rivers
   - Clean, uncluttered visualization
   - Fast rendering

TESTING DIFFERENT THRESHOLDS:

1. Run script with FLOW_THRESHOLD = 2000
2. Visually inspect the map
3. If too dense: increase threshold (try 5000)
4. If too sparse: decrease threshold (try 1000)
5. Repeat until satisfied

PERFORMANCE TIPS:

- Higher threshold = fewer features = faster export
- 30 arc-second (1km) processes faster than 15 arc-second (500m)
- For production, test with 30 arc-second first

REPROJECTION:

- GEE exports in WGS 84 (EPSG:4326)
- Reproject to UTM 42N after download:
  ogr2ogr -f GeoPackage output.gpkg input.geojson -t_srs EPSG:32642

NEXT STEPS AFTER EXPORT:

1. Download from Google Drive
2. Reproject to UTM 42N (see above)
3. Upload to GeoServer
4. Create SLD style based on stream_order attribute
5. Add to layers.ts configuration

STYLING IN GEOSERVER:

Create style that uses stream_order attribute:
- Order 3 (major rivers): 3px width, #1E88E5
- Order 2 (tributaries): 2px width, #42A5F5
- Order 1 (small): 1px width, #64B5F6
*/

print('=== SCRIPT READY ===');
print('1. Preview map to verify threshold');
print('2. Adjust FLOW_THRESHOLD if needed');
print('3. Run exports in Tasks tab');
print('4. Download from Google Drive');
