# GeoServer Migration Summary - exp_revised Workspace

## ✅ What's Been Completed

### 1. Code Updated
- **Frontend:** Updated to use `exp_revised` workspace
- **API:** Updated to return `exp_revised` workspace
- **Style Scripts:** All updated to use `exp_revised` workspace
- **Layer Naming:** Fixed to use dot notation: `Schema.Layer` ✓

### 2. Files Deployed
- Frontend built and deployed to `/dist/` on production server
- API files updated and service restarted
- API now returns: `"workspace":"exp_revised"` ✓

### 3. GeoServer Workspace
- **Workspace:** `exp_revised` created ✓
- **Data Stores:** 42 stores created (though not all working properly via REST API)
- **Layers:** Only 1-9 layers published successfully (out of 378 expected)

## ⚠️ What Needs Manual Configuration

### **Issue:** GeoServer REST API mass-import is unreliable

### **Solution:** Manual configuration via GeoServer Web UI

## 📋 Manual Configuration Steps

### **Option A: Quick Setup (Recommended)**

1. **Access GeoServer Web UI:**
   - URL: `http://10.0.0.205:8080/geoserver/web`
   - Login: `admin` / `geoserver`

2. **Configure ONE Store Manually:**

   Go to: **Stores** → **exp_revised** → **Add new Store**

   Configure:
   ```
   Workspace: exp_revised
   Data Source Name: T3_100yrs_Present_Perfect_Impacted
   Type: PostGIS

   Connection:
   - host: 10.0.0.205
   - port: 5432
   - database: postgres
   - schema: T3_100yrs_Present_Perfect_Impacted
   - user: postgres
   - passwd: maltanadirSRV0
   - dbtype: postgis
   ```

   Click **Save** → **Publish** → Select all 9 layers → **Publish** each

3. **Verify it Works:**
   - Check layers: `exp_revised:T3_100yrs_Present_Perfect_Impacted.Buildings`
   - Test in app: Navigate to Impact Matrix → 100yr Perfect → Toggle layers

4. **Repeat for Key Scenarios (Priority Order):**
   - 100yr Present Perfect ✓
   - 100yr Present Breaches
   - 50yr Present Perfect
   - 50yr Present Breaches
   - Then do the rest...

### **Option B: Full Manual Setup**

1. Follow the complete guide: `GEOSERVER_MANUAL_IMPORT_GUIDE.md`
2. Configure all 42 stores manually
3. Publish all 378 layers
4. Apply `impact_depth_simple` style to all

## 🔧 Layer Naming Convention (STANDARDIZED)

**Correct Format:**
```
exp_revised:T3_100yrs_Present_Perfect_Impacted.Buildings
```

**Components:**
- **Workspace:** `exp_revised`
- **Schema (Store):** `T3_100yrs_Present_Perfect_Impacted`
- **Layer:** `Buildings`

**WMS Request Format:**
```
LAYERS=exp_revised:T3_100yrs_Present_Perfect_Impacted.Buildings
```

## 🧪 Testing the Setup

### Test One Store First

**1. Create Store for 100yr Present Perfect:**
- Store name: `T3_100yrs_Present_Perfect_Impacted`
- Schema: `T3_100yrs_Present_Perfect_Impacted`

**2. Publish 9 Layers:**
- BHU
- Buildings
- Built_up_Area
- Cropped_Area
- Electric_Grid
- Railways
- Roads
- Settlements
- Telecom_Towers

**3. Apply Style:**
```bash
cd /mnt/d/Scenario_results/floodrisk_sferp/api
node apply-impact-style.mjs
```

**4. Test in Application:**
1. Open: `https://portal.srpsid-dss.gos.pk`
2. Navigate to: Impact Matrix
3. Click: **100yr row, Perfect column**
4. Toggle ON: Buildings layer
5. ✅ **Should see:** Buildings appear on map

## 📊 Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Workspace | ✅ exp_revised | Created and ready |
| Data Stores | ⚠️ 42 created, not all working | Need manual config |
| Layers | ⚠️ 1-9 published out of 378 | Need manual publish |
| Style (SLD) | ✅ impact_depth_simple | Ready to apply |
| Code | ✅ All updated | Using exp_revised |
| API | ✅ Running | Returns exp_revised |
| Frontend | ✅ Deployed | Using exp_revised |

## 🎯 Next Actions

### **Immediate (To Fix the Bug):**

1. **Manually configure 1 store** (10 minutes):
   - T3_100yrs_Present_Perfect_Impacted
   - Test in application
   - Verify the bug is fixed

2. **If that works, configure key scenarios** (30 minutes):
   - 100yr all three maintenance levels
   - 50yr all three maintenance levels
   - 25yr all three maintenance levels

3. **Then do the rest** (1-2 hours):
   - Remaining scenarios

### **Alternative: Batch Import via GeoServer Web UI**

If GeoServer REST API continues to fail, use the web UI's batch import:

1. **Layer Preview** page might have batch import
2. **Or use SQL batch tools** to configure
3. **Or manually configure critical scenarios first**

## 📝 Scripts Available

All scripts in `api/` folder now use `exp_revised`:
- `apply-impact-style.mjs` - Apply style to all layers
- `apply-style-simple.mjs` - Quick style application
- `apply-style-to-layers.mjs` - Batch style application
- `import-impact-layers-to-geoserver.mjs` - REST API import (unreliable)
- `recreate-stores-and-publish-layers.mjs` - Recreate stores (had issues)

## 🚀 Quick Start (Manual Setup)

```bash
# 1. Access GeoServer
http://10.0.0.205:8080/geoserver/web
# Login: admin / geoserver

# 2. Create ONE store (test scenario)
Stores → exp_revised → Add new Store → PostGIS
Configure: See above
Click Save → Publish → Publish 9 layers

# 3. Test in app
https://portal.srpsid-dss.gos.pk
Impact Matrix → 100yr Perfect → Toggle layers ON

# 4. If it works, repeat for other scenarios
```

## 🔍 Debugging

### If Layers Don't Appear:

1. **Check GeoServer logs:**
   ```bash
   ssh 10.0.0.205
   tail -f /opt/geoserver/data/logs/geoserver.log
   ```

2. **Verify layer exists:**
   ```bash
   curl -u admin:geoserver 'http://10.0.0.205:8080/geoserver/rest/workspaces/exp_revised/layers.json'
   ```

3. **Test WMS directly:**
   ```
   http://10.0.0.205:8080/geoserver/exp_revised/wms?service=WMS&version=1.1.0&request=GetMap&layers=exp_revised:T3_100yrs_Present_Perfect_Impacted.Buildings&styles=&bbox=300000,2800000,600000,3200000&width=500&height=500&srs=EPSG:32642&format=image/png
   ```

4. **Check browser console:**
   - F12 → Network tab
   - Look for WMS requests
   - Check response status and CQL filters

## ✅ Success Criteria

When configured correctly:
- ✅ API returns `workspace: exp_revised`
- ✅ Layer names use dot notation: `Schema.Layer`
- ✅ WMS requests work for all 378 layers
- ✅ All impact scenarios display in application
- ✅ Depth filtering slider works
- ✅ Map layers update when slider moves
