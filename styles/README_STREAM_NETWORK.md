# HydroSHEDS Stream Network SLD Style

## Overview
Two SLD styles are provided for the `DEM:hydrosheds_streamnetwork` raster layer in GeoServer.

## Flow Accumulation Threshold
- **Values below 500**: Transparent (no display)
- **Values 500+**: Visible streams, colored by size/importance

## SLD Options

### Option 1: Continuous Gradient (Recommended)
**File**: `hydrosheds_streamnetwork_continuous.sld.xml`

**Advantages**:
- ✅ Better performance (single ColorMap)
- ✅ Smooth gradient transitions
- ✅ Simpler configuration
- ✅ Works with all GeoServer versions

**Color Scheme**:
| Flow Accumulation | Color | Opacity | Stream Type |
|-------------------|-------|---------|-------------|
| 0-500 | Transparent | 0 | No stream |
| 500-1000 | Light Blue (#64B5F6) | 0.7-0.75 | Small streams |
| 1000-5000 | Medium Blue (#1E88E5) | 0.8 | Tributaries |
| 5000-10000 | Dark Blue (#1565C0) | 0.85 | Major rivers |
| 10000+ | Navy (#0D47A1) | 0.9-0.92 | Main stem rivers |

### Option 2: Rule-Based (Advanced)
**File**: `hydrosheds_streamnetwork.sld.xml`

**Advantages**:
- ✅ Explicit control over each range
- ✅ Can add different styling per rule
- ✅ More customizable

**Disadvantages**:
- ⚠️ More complex
- ⚠️ May have compatibility issues with older GeoServer versions

## Installation Instructions

### Via GeoServer Web UI

1. **Login to GeoServer**
   ```
   http://10.0.0.205:8080/geoserver
   ```

2. **Navigate to Styles**
   - Click "Styles" in left menu
   - Click "Add new style"

3. **Upload SLD**
   - Name: `hydrosheds_streamnetwork`
   - Workspace: `DEM`
   - Format: SLD
   - Upload: Choose `hydrosheds_streamnetwork_continuous.sld.xml`
   - Click "Upload" then "Submit"

4. **Publish Style**
   - Navigate to "Layers" → "DEM" → `hydrosheds_streamnetwork`
   - Go to "Publishing" tab
   - WMS Settings → Default Style: `hydrosheds_streamnetwork`
   - Click "Save"

### Via REST API

```bash
# Upload style
curl -u admin:geoserver -X POST \
  -H "Content-Type: application/vnd.ogc.sld+xml" \
  -d @styles/hydrosheds_streamnetwork_continuous.sld.xml \
  "http://10.0.0.205:8080/geoserver/rest/styles"

# Set workspace
curl -u admin:geoserver -X PUT \
  -H "Content-Type: application/json" \
  -d '{"style":{"workspace":"DEM"}}' \
  "http://10.0.0.205:8080/geoserver/rest/styles/hydrosheds_streamnetwork"

# Assign to layer
curl -u admin:geoserver -X PUT \
  -H "Content-Type: application/json" \
  -d '{"layer":{"defaultStyle":{"name":"hydrosheds_streamnetwork"}}}' \
  "http://10.0.0.205:8080/geoserver/rest/layers/DEM:hydrosheds_streamnetwork"
```

## Preview Layer

After uploading the style, preview the layer:
```
http://10.0.0.205:8080/geoserver/DEM/wms?service=WMS&version=1.1.1&request=GetMap&layers=DEM:hydrosheds_streamnetwork&styles=&bbox=309082.5,2853827.75,569587.5,3306262.25&width=800&height=600&srs=EPSG:32642&format=image/png
```

## Frontend Integration

The layer has been added to the frontend configuration:

```typescript
// src/config/layers.ts - Supporting Layers group
createRasterLayer('Stream Network', 'hydrosheds_streamnetwork',
  false, 0.8, GEOSERVER_CONFIG.workspaces.dem, 'raster')
```

**Layer Details**:
- **Display Name**: Stream Network
- **GeoServer Layer**: `DEM:hydrosheds_streamnetwork`
- **Workspace**: `DEM`
- **Type**: Raster
- **Default Opacity**: 0.8
- **Location**: Supporting Layers group

## Color Scheme Rationale

The blue gradient is chosen because:
1. **Industry standard** for hydrography visualization
2. **Intuitive**: Lighter colors = smaller streams, Darker = major rivers
3. **Accessible**: Good contrast for color blindness
4. **Professional**: Matches cartographic conventions

## Customization

To adjust the threshold or colors, modify the ColorMapEntry values in the SLD:

```xml
<!-- Change threshold from 500 to 1000 -->
<ColorMapEntry color="#000000" quantity="0" opacity="0"/>
<ColorMapEntry color="#000000" quantity="1000" opacity="0"/>  <!-- Changed -->

<!-- Adjust color intensity -->
<ColorMapEntry color="#42A5F5" quantity="1000" opacity="0.75"/>  <!-- Lighter -->
```

## Troubleshooting

### Layer not visible
1. Check layer is published in GeoServer
2. Verify style is assigned correctly
3. Check WMS request URL format
4. Verify CRS is EPSG:32642

### Everything appears transparent
- Check if flow accumulation values are below 500
- Lower the threshold in the SLD
- Verify raster data has values > 500

### Colors don't appear
- Verify SLD syntax is valid
- Check GeoServer logs for errors
- Try the continuous gradient version first

## Data Source

- **Dataset**: USGS HydroSHEDS
- **Product**: Flow Accumulation Raster
- **Resolution**: 15 arc-seconds (~500m)
- **License**: CC-BY 4.0
- **Citation**: Lehner, B., Grill G. (2013): Global river hydrography and network routing: baseline data and new approaches to study the world's large river systems. Hydrological Processes, 27(15): 2171–2186.

## Support

For issues or questions:
- GeoServer Documentation: https://docs.geoserver.org/
- SLD Specification: https://www.opengeospatial.org/standards/sld
