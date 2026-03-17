# Manual GeoServer Configuration Guide for Impact Layers

## Overview
This guide explains how to manually configure the `exp_revised` workspace in GeoServer with all impact layers from PostGIS.

## Prerequisites
- GeoServer running at `http://10.0.0.205:8080/geoserver`
- PostgreSQL database with impacted schemas
- Login: `admin` / `geoserver`

## Step 1: Access GeoServer Web Interface

1. Open: `http://10.0.0.205:8080/geoserver/web`
2. Login with credentials

## Step 2: Create or Verify Workspace

1. Click **Workspaces** in the left menu
2. Check if **exp_revised** exists
3. If not, click **Add new workspace**
   - Name: `exp_revised`
   - URI: `exp_revised`
   - Click **Submit**

## Step 3: Add Data Store for Each Impacted Schema

### Instructions for ONE Store (Repeat for all 42 schemas)

1. Click **Stores** → **exp_revised** → **Add new Store**
2. Select **PostGIS**
3. Configure:

**Basic Store Info:**
- Workspace: `exp_revised`
- Data Source Name: `T3_100yrs_Present_Perfect_Impacted` (example)
- Description: `PostGIS store for T3_100yrs_Present_Perfect_Impacted`
- Enable: ☑️

**Connection Parameters:**
- **host:** `10.0.0.205`
- **port:** `5432`
- **database:** `postgres`
- **schema:** `T3_100yrs_Present_Perfect_Impacted`
- **user:** `postgres`
- **passwd:** `maltanadirSRV0`
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

### Upload the Style

1. Click **Styles** in the left menu
2. Click **Add new style**
3. Name: `impact_depth_simple`
4. Workspace: `exp_revised`
5. Format: `SLD`
6. Upload the SLD file or paste the content
7. Click **Submit**

### Apply Style to Layers

Use the provided script or apply manually:

```bash
# From the server
cd /mnt/d/Scenario_results/floodrisk_sferp/api
node apply-impact-style.mjs
```

Update the script to use `exp_revised` workspace:
```javascript
const WORKSPACE = 'exp_revised';
```

## Step 7: Reload GeoServer Configuration

1. Click **Config** in the left menu (or click the gear icon)
2. Click **Reload** button
3. Wait for reload to complete

## Step 8: Verify Layers

### Check via GeoServer REST API:
```bash
curl -u admin:geoserver 'http://10.0.0.205:8080/geoserver/rest/workspaces/exp_revised/layers.json'
```

Should show all 378 layers (42 schemas × 9 exposure types)

### Check via Web UI:
1. Click **Layers** → **exp_revised**
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
- Check layer name format: `exp_revised:T3_100yrs_Present_Perfect_Impacted.Buildings`
- Verify style is applied
- Check WMS request in browser Network tab

## Layer Naming Convention

**Full qualified name:**
```
exp_revised:T3_100yrs_Present_Perfect_Impacted.Buildings
```

**Components:**
- Workspace: `exp_revised`
- Schema (Store): `T3_100yrs_Present_Perfect_Impacted`
- Layer: `Buildings`

## Quick Test

Test one layer in WMS:
```
http://10.0.0.205:8080/geoserver/exp_revised/wms?
service=WMS&
version=1.1.0&
request=GetMap&
layers=exp_revised:T3_100yrs_Present_Perfect_Impacted.Buildings&
styles=&
bbox=300000,2800000,600000,3200000&
width=500&
height=500&
srs=EPSG:32642&
format=image/png
```

## Expected Outcome

After completing this guide, you should have:
- ✅ Workspace: `exp_revised`
- ✅ Data Stores: 42 stores
- ✅ Layers: 378 layers (42 × 9)
- ✅ Style: `impact_depth_simple` applied to all
- ✅ All layers accessible via WMS
- ✅ Application can load and display all impact layers
