# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Flood Risk Assessment - Indus River is a web-based GIS application for visualizing flood scenarios in Sindh Province, Pakistan. It combines OpenLayers mapping with GeoServer WMS services to display flood risk data across different climate conditions, maintenance levels, and return periods.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, OpenLayers, shadcn/ui (Radix UI)

## Development Commands

```bash
# Start development server (includes GeoServer proxy at /geoserver)
npm run dev

# Start backend API server (for Impact Matrix feature)
cd api && node impact-summary.mjs

# Build for production (TypeScript check + Vite build)
npm run build

# Run ESLint
npm run lint

# Preview production build locally
npm run preview

# WSL workaround (if you encounter EPERM symlink errors)
npm install --no-bin-links
```

**Note:** The Impact Matrix feature requires both the frontend dev server (port 5173) and the backend API server (port 3001) to be running simultaneously.

## Architecture

### Layer System (Core Concept)

The application is built around a hierarchical layer tree structure defined in `src/config/layers.ts`. Understanding this is critical:

- **Layer Types:** Groups can contain both sub-groups and individual layers
- **Recursive Structure:** `LayerTreeItem` components render themselves recursively
- **GeoServer Integration:** All flood layers use WMS from GeoServer at `http://10.0.0.205:8080`
- **Proxy:** Vite dev server proxies `/geoserver` to the GeoServer instance (see `vite.config.ts`)

**Layer Naming Convention:** GeoServer layers follow `t3_{rp}yrs_{scenario}_{maintenance}_{parameter}`
- Example: `t3_25yrs_present_perfect_maxdepth`
- The `buildLayerName()` function in `layers.ts` handles this

**Layer Hierarchy:**
```
Supporting Layers (AOI, Sindh Province, Sub-Catchments)
Survey (DGPS points)
Structures (Canal Network, Drains)
Present Climate / Future Climate
  └─ Maintenance: Breaches, Reduced Capacity, Perfect
      └─ Parameters: Depth, Velocity, Duration, V×h
          └─ Return Periods: 2.3, 5, 10, 25, 50, 100, 500 years
Flood 2022 (Actual Event data)
HDTM (GeoServer layer in DEM workspace: HDTM_1-9_1m)
```

### Key Components

- **MapViewer** (`src/components/map/MapViewer.tsx`): OpenLayers map instance manager with coordinate display
- **LayerTree** (`src/components/layer-tree/`): Recursive layer visibility controls
- **ScenarioMatrix** (`src/components/scenario-explorer/`): Grid-based scenario comparison view
- **LegendPanel** (`src/components/map/LegendPanel.tsx`): Dynamic legend from GeoServer
- **FeaturePopup** (`src/components/popups/FeaturePopup.tsx`): Displays feature attributes from WMS GetFeatureInfo
- **SwipeCompare** (`src/components/swipe/SwipeCompare.tsx`): Side-by-side comparison of two flood scenarios
- **ImpactMatrix** (`src/components/impact-matrix/`): Real-time flood impact analysis with depth distribution charts

### Impact Matrix Module

The Impact Matrix provides comprehensive flood impact assessment across 42 scenarios per climate:

**Backend API:**
- **Server:** Node.js/Express server at `http://localhost:3001`
- **Endpoint:** `GET /api/impact/summary?climate={present|future}`
- **Database:** PostgreSQL/PostGIS with 42 scenario schemas
- **Statistics Source:** Materialized view `impact_summary_matview` (pre-aggregated per scenario)
- **Zonal Layers:** `Cropped_Area` and `Built_up_Area` use area-based calculations via `ST_Area()`
- **Production:** Managed by systemd service `floodrisk-impact-api`

**Frontend Components:**
- **SummaryHeatmapView:** 7×3 matrix showing affected count per scenario (color-coded by return period intensity)
- **DetailedBreakdownView:** Per-scenario exposure details with toggleable layer controls
- **DepthDistributionChart:** Horizontal bar chart showing depth bin percentages

**Exposure Layers (9 types):**
1. Basic Health Units (BHU) - point features
2. Buildings - point features
3. Built_up_Area - zonal polygons (area-based stats)
4. Cropped_Area - zonal polygons (area-based stats)
5. Electric Grid - line features
6. Railways - line features
7. Roads - line features
8. Settlements - point features
9. Telecom Towers - point features

**Depth Bins:** "15-100cm", "1-2m", "2-3m", "3-4m", "4-5m", "above5m"

**Important:** All statistics are database-driven. No hardcoded values. Zonal layers calculate percentages from actual geometry area, not feature counts.

**Development Commands (with backend):**
```bash
# Terminal 1: Start frontend dev server
npm run dev

# Terminal 2: Start backend API server
cd api && node impact-summary.mjs

# The backend serves at http://localhost:3001/api/impact/summary
# Frontend proxies /api requests to the backend
```

**Production Deployment:**
```bash
# Backend runs as systemd service
sudo systemctl start floodrisk-impact-api
sudo systemctl enable floodrisk-impact-api
sudo systemctl status floodrisk-impact-api

# View logs
sudo journalctl -u floodrisk-impact-api -f
```

### Map Projection

**CRITICAL:** The map uses UTM Zone 42N (EPSG:32642), not Web Mercator. OpenLayers is configured with proj4 for this projection. Center coordinates and extent in `MAP_CONFIG` are in UTM, not lat/lon.

### GeoServer Configuration

- **Workspaces:**
  - `results` - Flood scenario layers (depth, velocity, duration, V×h)
  - `DEM` - Terrain tiles (HDTM_1-9_1m)
  - `exposures` - Impact exposure layers (378 layers: 9 exposure types × 42 scenarios)
- **WMS Version:** 1.1.1
- **Legend Graphics:** Dynamically generated via `GetLegendGraphic` request
- **Development Proxy:** Vite proxies `/geoserver` → `http://10.0.0.205:8080`
- **Impact Layer Styling:** All exposure layers use `impact_depth_simple` SLD style (depth-based coloring)

### shadcn/ui Integration

UI components are from shadcn/ui (Radix UI primitives). Components are in `src/components/ui/`. When adding new components, use the shadcn CLI which places them in this directory.

### Path Aliases

`@/*` maps to `src/*` (configured in `vite.config.ts` and `tsconfig.json`)

## Adding New Layers

1. Define in `src/config/layers.ts` using `createRasterLayer()` or `createVectorLayer()`
2. Add to appropriate group in the `layerTree` structure
3. Layer names must match GeoServer layer names exactly

## Known Issues and Fixes

### Multiple Layer Visibility Bug (FIXED - March 2026)

**Issue:** When toggling multiple layers visible in the Layer Tree or Impact Matrix, only the newest layer would remain visible - previous layers would disappear.

**Root Cause:** The map was being destroyed and recreated every time a layer was toggled due to the map initialization `useEffect` depending on `onMapClick`. The dependency chain was:
1. Layer toggle → `visibleLayerIds` changes
2. `visibleLayers` (computed from `visibleLayerIds`) recalculates
3. `handleMapClick` (uses `visibleLayers`) recreates
4. Map initialization effect runs (depended on `onMapClick`)
5. Entire map destroyed → all previous layers lost

**Solution:** Modified `src/components/map/MapViewer.tsx`:
- Removed `onMapClick` from map initialization dependencies (empty deps array `[]`)
- Added `onMapClickRef` to store current click handler
- Click listener now uses `onMapClickRef.current` instead of prop directly
- Separate `useEffect` updates the ref when `onMapClick` changes

**Result:** Map initializes only once on mount, click handler stays updated, and multiple layers can coexist without interference.

---

### Impact Matrix Percentage Calculation Bug (FIXED - March 2026)

**Issue:** Electric Grid, Built_up_Area, and Cropped_Area showed >100% impact percentage (e.g., "199% Length affected").

**Root Cause:** The materialized view `impact_summary_matview` used `COUNT(*)` for all exposure types. This is correct for point features but incorrect for line and polygon features:
- **Line features** (Electric Grid, Railways, Roads) need: Total length vs affected length
- **Polygon features** (Buildings, Settlements, Built_up_Area, Cropped_Area) need: Total area vs affected area
- **Point features** (BHU, Telecom Towers) correctly use: Total count vs affected count

**Solution:** Modified `api/impact-summary.mjs` to calculate geometry-specific totals:

1. **Electric_Grid (Line)**:
   - Total: `SUM(ST_Length(geom))` from Exposure_InputData.Electric_Grid
   - Affected: `SUM(ST_Length(geom))` from impacted scenario schema
   - Shows: "Length %" with meter units

2. **Built_up_Area, Cropped_Area (Polygon)**:
   - Total: `SUM(ST_Area(geom))` from Exposure_InputData
   - Affected: `SUM(ST_Area(geom))` from impacted scenario schema
   - Shows: "Area %" with square meter units

3. **All Other Layers**:
   - Continue using `COUNT(*)` for feature counts
   - Shows: "Count %"

**Result:** Accurate percentages comparing apples to apples (length vs length, area vs area, count vs count).

**Performance:** Optimized to only calculate geometry for Electric_Grid, Built_up_Area, and Cropped_Area (3 queries per scenario). Other layers use fast COUNT(*) queries.

## Mobile Responsiveness

- App uses `use-mobile.ts` hook for responsive behavior
- Sidebar collapses on mobile (overlay pattern)
- Base maps and map controls adapt to screen size

## UI Features

- **Resizable Sidebar:** Layer panel can be resized by dragging the right edge (200px-600px range)
- **Coordinate Display:** Real-time mouse position in UTM (Zone 42N) and Lat/Lon with copy-to-clipboard
- **Feature Identification:** Click on any layer to view attributes via WMS GetFeatureInfo (works for raster and vector)
- **Swipe Compare:** Compare two flood scenarios side-by-side with synchronized pan/zoom and draggable divider
- All groups default to collapsed state except root

## Production Deployment

**Live Site:** https://portal.srpsid-dss.gos.pk

- **Platform:** Apache on WSL with HTTPS
- **Server:** `10.0.0.205` (umair@10.0.0.205)
- **Document Root:** `/mnt/d/Scenario_results/floodrisk_sferp/dist/`
- **Apache Config:** `/etc/apache2/sites-available/floodrisk.conf`
- **GeoServer Proxy:** Apache proxies `/geoserver` → `http://10.0.0.205:8080/geoserver`
- **API Proxy:** Apache proxies `/api/` → `http://localhost:3001/api/`
- **Backend Service:** systemd manages `floodrisk-impact-api` service on port 3001
- **SSL:** Let's Encrypt certificates for `portal.srpsid-dss.gos.pk`

**Backend API (Production):**
- **Service Name:** `floodrisk-impact-api`
- **Port:** 3001
- **Endpoint:** `https://portal.srpsid-dss.gos.pk/api/impact/summary`
- **Working Directory:** `/mnt/d/Scenario_results/floodrisk_sferp/api/`
- **Auto-restart:** Enabled via systemd

**Deployment Workflow (Keep All 3 Synced):**

The 3 locations to keep synced:
1. **Local machine** - Development environment
2. **GitHub** - https://github.com/urabbani/floodrisk_sferp.git
3. **Production server** - https://portal.srpsid-dss.gos.pk

```bash
# 1. Build locally
npm run build

# 2. Commit and push to GitHub
git add .
git commit -m "your commit message"
git push

# 3. Upload dist to server
sshpass -p 'your_password' scp -r dist/* umair@10.0.0.205:/mnt/d/Scenario_results/floodrisk_sferp/dist/

# 4. Pull git changes on server (keeps server repo synced)
sshpass -p 'your_password' ssh umair@10.0.0.205 "cd /mnt/d/Scenario_results/floodrisk_sferp && git pull"
```

See README.md for detailed Apache configuration and deployment instructions.
