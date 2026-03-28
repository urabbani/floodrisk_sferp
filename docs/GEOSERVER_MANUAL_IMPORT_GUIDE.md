# Manual GeoServer Configuration Guide for Impact Layers

## Overview
This guide explains how to manually configure the `exposures` workspace in GeoServer with all impact layers from PostGIS.

## Prerequisites
- GeoServer running at `http://10.0.0.205:8080/geoserver`
- PostgreSQL database with impacted schemas
- Login: `admin` / `geoserver`

## Step 1: Access GeoServer Web Interface

1. Open: `http://10.0.0.205:8080/geoserver/web`
2. Login with credentials

## Step 2: Create or Verify Workspace

1. Click **Workspaces** in the left menu
2. Check if **exposures** exists
3. If not, click **Add new workspace**
   - Name: `exposures`
   - URI: `exposures`
   - Click **Submit**

## Step 3: Add Data Store for Each Impacted Schema

### Instructions for ONE Store (Repeat for all 42 schemas)

1. Click **Stores** → **exposures** → **Add new Store**
2. Select **PostGIS**
3. Configure:

**Basic Store Info:**
- Workspace: `exposures`
- Data Source Name: `T3_100yrs_Present_Perfect_Impacted` (example)
- Description: `PostGIS store for T3_100yrs_Present_Perfect_Impacted`
- Enable: ☑️

**Connection Parameters:**
- **host:** `10.0.0.205`
- **port:** `5432`
- **database:** `postgres`
- **schema:** `T3_100yrs_Present_Perfect_Impacted`
- **user:** `postgres`
- **passwd:** (set your database password)
- **dbtype:** `postgis`

4. Click **Save**
5. GeoServer will test the connection
6. If successful, click **Publish** button to publish layers

## Step 4: Publish Layers

After creating the store, GeoServer will show available layers from the schema:

1. Select all 9 layers:
   - BHU
   - Buildings
   - Built_up_Area
   - Cropped_Area
   - Electric_Grid
   - Railways
   - Roads
   - Settlements
   - Telecom_Towers

2. Click **Publish** for each layer

3. Configure each layer:
   - Name: (auto-filled, e.g., `BHU`)
   - Title: (auto-filled)
   - SRS: `EPSG:32642` (CRITICAL!)
   - Native SRS: `EPSG:32642`
   - Click **Publish**

## Step 5: Repeat for All 42 Schemas

### List of All Impacted Schemas

**Present Climate:**
- `T3_2.3yrs_Present_Breaches_Impacted`
- `T3_5yrs_Present_Breaches_Impacted`
- `T3_10yrs_Present_Breaches_Impacted`
- `T3_25yrs_Present_Breaches_Impacted`
- `T3_50yrs_Present_Breaches_Impacted`
- `T3_100yrs_Present_Breaches_Impacted`
- `T3_500yrs_Present_Breaches_Impacted`

- `T3_2.3yrs_Present_RedCapacity_Impacted`
- `T3_5yrs_Present_RedCapacity_Impacted`
- `T3_10yrs_Present_RedCapacity_Impacted`
- `T3_25yrs_Present_RedCapacity_Impacted`
- `T3_50yrs_Present_RedCapacity_Impacted`
- `T3_100yrs_Present_RedCapacity_Impacted`
- `T3_500yrs_Present_RedCapacity_Impacted`

- `T3_2.3yrs_Present_Perfect_Impacted`
- `T3_5yrs_Present_Perfect_Impacted`
- `T3_10yrs_Present_Perfect_Impacted`
- `T3_25yrs_Present_Perfect_Impacted`
- `T3_50yrs_Present_Perfect_Impacted`
- `T3_100yrs_Present_Perfect_Impacted`
- `T3_500yrs_Present_Perfect_Impacted`

**Future Climate:**
- `T3_2.3yrs_Future_Breaches_Impacted`
- `T3_5yrs_Future_Breaches_Impacted`
- `T3_10yrs_Future_Breaches_Impacted`
- `T3_25yrs_Future_Breaches_Impacted`
- `T3_50yrs_Future_Breaches_Impacted`
- `T3_100yrs_Future_Breaches_Impacted`
- `T3_500yrs_Future_Breaches_Impacted`

- `T3_2.3yrs_Future_RedCapacity_Impacted`
- `T3_5yrs_Future_RedCapacity_Impacted`
- `T3_10yrs_Future_RedCapacity_Impacted`
- `T3_25yrs_Future_RedCapacity_Impacted`
- `T3_50yrs_Future_RedCapacity_Impacted`
- `T3_100yrs_Future_RedCapacity_Impacted`
- `T3_500yrs_Future_RedCapacity_Impacted`

- `T3_2.3yrs_Future_Perfect_Impacted`
- `T3_5yrs_Future_Perfect_Impacted`
- `T3_10yrs_Future_Perfect_Impacted`
- `T3_25yrs_Future_Perfect_Impacted`
- `T3_50yrs_Future_Perfect_Impacted`
- `T3_100yrs_Future_Perfect_Impacted`
- `T3_500yrs_Future_Perfect_Impacted`

## Step 6: Apply Style to All Layers

### Upload the Styles

**IMPORTANT:** Use geometry-specific styles for correct rendering:
1. `impact_depth_point.sld` - For point layers (BHU, Telecom_Towers, Settlements)
2. `impact_depth_line.sld` - For line layers (Electric_Grid, Railways, Roads)
3. `impact_depth_polygon.sld` - For polygon layers (Buildings, Built_up_Area, Cropped_Area)

Upload each style:
1. Click **Styles** in the left menu
2. Click **Add new style**
3. Name: `impact_depth_point` (or `impact_depth_line`, `impact_depth_polygon`)
4. Workspace: `exposures`
5. Format: `SLD`
6. Upload the corresponding SLD file or paste the content
7. Click **Submit**
8. Repeat for all three styles

### Apply Style to Layers

Use the provided script to automatically apply the correct style based on geometry type:

```bash
# From the server
cd /mnt/d/Scenario_results/floodrisk_sferp/api
node create-geometry-specific-styles.mjs
```

This script:
- Detects geometry type from layer name
- Applies `impact_depth_point` to point layers
- Applies `impact_depth_line` to line layers
- Applies `impact_depth_polygon` to polygon layers
- Reloads GeoServer configuration

Or manually for each layer:
1. Go to **Layers** → **exposures**
2. Click on a layer name
3. In the **Publishing** tab, set **Default Style** to the appropriate geometry-specific style
4. Click **Save**

## Step 7: Reload GeoServer Configuration

1. Click **Config** in the left menu (or click the gear icon)
2. Click **Reload** button
3. Wait for reload to complete

## Step 8: Verify Layers

### Check via GeoServer REST API:
```bash
curl -u admin:geoserver 'http://10.0.0.205:8080/geoserver/rest/workspaces/exposures/layers.json'
```

Should show all 378 layers (42 schemas × 9 exposure types)

### Check via Web UI:
1. Click **Layers** → **exposures**
2. Should see all layers listed

## Troubleshooting

### "Unable to connect to database"
- Check PostgreSQL is running: `psql -h 10.0.0.205 -U postgres -d postgres`
- Verify schema exists: `\dn T3_100yrs_Present_Perfect_Impacted`
- Verify tables exist: `\dt T3_100yrs_Present_Perfect_Impacted.*`

### "No layers found"
- Click **Reload** on the store configuration page
- Check the schema name matches exactly
- Verify connection parameters

### "Layer not found" in application
- Check layer name format: `exposures:T3_100yrs_Present_Perfect_Impacted.Buildings`
- Verify style is applied
- Check WMS request in browser Network tab

## Layer Naming Convention

**Full qualified name:**
```
exposures:T3_100yrs_Present_Perfect_Impacted_Buildings
```

**IMPORTANT:** Layer names use **underscores** as separators, NOT dots.

**Components:**
- Workspace: `exposures`
- Schema (Store): `T3_100yrs_Present_Perfect_Impacted`
- Layer: `Buildings`
- Full name: `{Schema}_{Layer}` (underscore-separated)

## Quick Test

Test one layer in WMS (using underscores, not dots):
```
http://10.0.0.205:8080/geoserver/exposures/wms?
service=WMS&
version=1.1.0&
request=GetMap&
layers=exposures:T3_100yrs_Present_Perfect_Impacted_Buildings&
styles=&
bbox=300000,2800000,600000,3200000&
width=500&
height=500&
srs=EPSG:32642&
format=image/png
```

Test point layer (BHU):
```
http://10.0.0.205:8080/geoserver/exposures/wms?
service=WMS&
version=1.1.0&
request=GetMap&
layers=exposures:T3_100yrs_Present_Perfect_Impacted_BHU&
styles=&
bbox=300000,2800000,600000,3200000&
width=500&
height=500&
srs=EPSG:32642&
format=image/png
```

Test line layer (Electric_Grid):
```
http://10.0.0.205:8080/geoserver/exposures/wms?
service=WMS&
version=1.1.0&
request=GetMap&
layers=exposures:T3_100yrs_Present_Perfect_Impacted_Electric_Grid&
styles=&
bbox=300000,2800000,600000,3200000&
width=500&
height=500&
srs=EPSG:32642&
format=image/png
```

## Expected Outcome

After completing this guide, you should have:
- ✅ Workspace: `exposures`
- ✅ Data Stores: 42 stores
- ✅ Layers: 378 layers (42 × 9)
- ✅ Styles: 3 geometry-specific styles applied
  - `impact_depth_point` for point layers
  - `impact_depth_line` for line layers
  - `impact_depth_polygon` for polygon layers
- ✅ All layers accessible via WMS
- ✅ Application can load and display all impact layers
- ✅ No centroid points on polygons or lines

**Geometry Types:**
- **Point layers** (BHU, Telecom_Towers, Settlements) - Displayed as colored circles (8px size)
- **Line layers** (Electric_Grid, Railways, Roads) - Displayed as colored lines (3px width)
- **Polygon layers** (Buildings, Built_up_Area, Cropped_Area) - Displayed as filled polygons with 80% opacity

---

## Known Issues and Solutions

### Issue 1: Point and Line Layers Not Displaying

**Symptom:** Only polygon layers (Buildings, Built_up_Area, Cropped_Area) appear on the map. Point layers (BHU, Telecom_Towers) and line layers (Electric_Grid, Railways, Roads) are missing.

**Root Cause:** Using `impact_depth_simple.sld` or `impact_depth_style.sld` which only contains `PolygonSymbolizer`, which doesn't work for points or lines.

**Fix:** Run the geometry-specific styles script:
```bash
cd /mnt/d/Scenario_results/floodrisk_sferp/api
node create-geometry-specific-styles.mjs
```

### Issue 2: Centroid Points Showing on Polygons and Lines

**Symptom:** Polygon and line layers display correctly but also show unwanted centroid points.

**Root Cause:** Using a combined style (`impact_depth_style.sld`) that includes all three symbolizers (Point, Line, Polygon) in every rule. GeoServer applies all applicable symbolizers, causing polygons and lines to also render points.

**Fix:** Use geometry-specific styles (see Issue 1 solution above). The script will:
1. Upload `impact_depth_point.sld`, `impact_depth_line.sld`, `impact_depth_polygon.sld`
2. Apply the correct style to each layer based on its geometry type
3. Reload GeoServer configuration

**Verification:** Test all three geometry types:
```bash
# Test BHU (point layer)
curl "http://10.0.0.205:8080/geoserver/exposures/wms?service=WMS&version=1.1.0&request=GetMap&layers=exposures:T3_25yrs_Present_Breaches_Impacted_BHU&bbox=250000,2850000,350000,2950000&width=400&height=400&srs=EPSG:32642&format=image/png" | file -

# Test Electric_Grid (line layer)
curl "http://10.0.0.205:8080/geoserver/exposures/wms?service=WMS&version=1.1.0&request=GetMap&layers=exposures:T3_25yrs_Present_Breaches_Impacted_Electric_Grid&bbox=250000,2850000,350000,2950000&width=400&height=400&srs=EPSG:32642&format=image/png" | file -

# Test Buildings (polygon layer)
curl "http://10.0.0.205:8080/geoserver/exposures/wms?service=WMS&version=1.1.0&request=GetMap&layers=exposures:T3_25yrs_Present_Breaches_Impacted_Buildings&bbox=250000,2850000,350000,2950000&width=400&height=400&srs=EPSG:32642&format=image/png" | file -
```

All should return "PNG image data" (not XML error).
