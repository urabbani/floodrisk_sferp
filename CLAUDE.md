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
Hazard
├─ Supporting Layers (AOI, Sindh Province, Sub-Catchments, Stream Network)
├─ Survey (DGPS points)
├─ Structures (Canal Network, Drains)
├─ Present Climate / Future Climate
│   └─ Maintenance: Breaches, Reduced Capacity, Perfect
│       └─ Parameters: Depth, Velocity, Duration, V×h
│           └─ Return Periods: 2.3, 5, 10, 25, 50, 100, 500 years
├─ Flood 2022 (Actual Event data)
└─ HDTM (GeoServer layer in DEM workspace: HDTM_1-9_1m)
```

**GeoServer Workspaces:**
- **results**: Static flood scenario layers (raster), survey points, structures
- **DEM**: DEM layers (HDTM), AOI, SubCatchments, Stream Network (database-backed from public schema)
- **exposures**: Impact exposure layers (378 layers across 42 scenarios, database-backed)

### Key Components

- **MapViewer** (`src/components/map/MapViewer.tsx`): OpenLayers map instance manager with coordinate display
- **LayerTree** (`src/components/layer-tree/`): Recursive layer visibility controls
- **ScenarioMatrix** (`src/components/scenario-explorer/`): Grid-based scenario comparison view
- **LegendPanel** (`src/components/map/LegendPanel.tsx`): Dynamic legend from GeoServer
- **FeaturePopup** (`src/components/popups/FeaturePopup.tsx`): Displays feature attributes from WMS GetFeatureInfo
- **SwipeCompare** (`src/components/swipe/SwipeCompare.tsx`): Side-by-side comparison of two flood scenarios
- **ImpactMatrix** (`src/components/impact-matrix/`): Real-time flood impact analysis with depth distribution charts
- **Interventions** (`src/components/annotations/`): Collaborative drawing and annotation on the map (points, lines, polygons with categories and export)
  - **LoginDialog** (`src/components/annotations/LoginDialog.tsx`): Login form for authentication
  - **useAuth** (`src/hooks/useAuth.tsx`): Auth context providing user state, login/logout functions
  - **apiFetch** (`src/lib/api.ts`): Centralized fetch wrapper with automatic JWT token injection

### Impact Matrix Module

The Impact Matrix provides comprehensive flood impact assessment across 42 scenarios per climate:

**Backend API:**
- **Server:** Node.js/Express server at `http://localhost:3001`
- **Endpoint:** `GET /api/impact/summary?climate={present|future}`
- **Database:** PostgreSQL/PostGIS with 42 scenario schemas
- **Statistics Source:** Materialized view `impact_summary_matview` (pre-aggregated per scenario)
- **Zonal Layers:** `Cropped_Area` and `Built_up_Area` use area-based calculations via `ST_Area()`
- **Population Stats:** Table `impact.population_stats` with population impact data by depth bins
- **Production:** Managed by systemd service `floodrisk-impact-api`

**Frontend Components:**
- **SummaryHeatmapView:** 7×3 matrix showing affected count per scenario (color-coded by return period intensity)
- **DetailedBreakdownView:** Per-scenario exposure details with 4 summary cards
- **DepthDistributionChart:** Horizontal bar chart showing depth bin percentages

**Summary Cards (4):**
1. **Population Affected** - Total count of people impacted (e.g., "262,993")
2. **Infrastructure Impact** - Average % of roads, railways, electric grid, telecom affected
3. **Agriculture & Buildings** - Average % of crops and buildings affected
4. **Overall Risk** - Severity level (Low/Medium/High/Extreme) based on affected layers

**Population Impact Data:**
- **Source:** Excel files in `Exposure_Stats/` folder (42 files)
- **Loader:** `api/load-population-stats.mjs` script
- **Database:** `impact.population_stats` table with depth bin breakdown
- **Display:** Population Impact chart shows distribution across flood depth bins
- **Update:** Run `node api/load-population-stats.mjs` to reload from Excel files

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

### Authentication Module

The Interventions feature uses JWT-based authentication for user management and access control:

**Backend (`api/auth.mjs`):**
- **POST /api/auth/login** - Authenticate and receive JWT token (24h expiry)
- **GET /api/auth/me** - Get current user info (requires auth)
- **GET /api/auth/users** - List users (admin only)
- **POST /api/auth/users** - Create user (admin only)
- **PUT /api/auth/users/:id** - Update user (admin only)
- **POST /api/auth/users/:id/reset-password** - Reset password (admin only)
- **Middleware:** `authenticate` (JWT verification), `requireAdmin` (role check)
- **Rate limiting:** 5 login attempts per 15 minutes per IP

**Database Schema (`api/migrations/create_users.sql`):**
- Table: `auth.users` with columns: `id`, `username` (login), `display_name` (shown on interventions), `password_hash` (bcrypt), `role` (admin/user), `active`, timestamps
- `created_by` field in interventions is set server-side from authenticated user's `display_name`

**Frontend:**
- **`src/hooks/useAuth.tsx`** - AuthProvider context wrapping the app, validates token on mount via `/api/auth/me`
- **`src/lib/api.ts`** - `apiFetch()` wrapper auto-injects `Authorization: Bearer <token>` header, handles 401 by clearing token and dispatching logout event
- **`src/components/annotations/LoginDialog.tsx`** - Login form triggered when user tries to draw without authentication
- **`src/types/auth.ts`** - AuthUser, LoginRequest, LoginResponse types

**User Management CLI (`api/seed-user.mjs`):**
```bash
# Add user
node api/seed-user.mjs add <username> "<display_name>" <password> [--admin]

# List users
node api/seed-user.mjs list

# Reset password
node api/seed-user.mjs reset-password <username> <new_password>

# Toggle active status
node api/seed-user.mjs toggle <username>
```

**Authorization:**
- Public: GET interventions, all impact endpoints
- Protected: POST/PUT/DELETE interventions (requires auth)
- Ownership: Users can only edit/delete their own interventions
- Admin override: Can manage any intervention and user accounts

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
- **Impact Layer Styling:** All exposure layers use geometry-specific SLD styles
  - `impact_depth_point` - Point layers (BHU, Telecom_Towers, Settlements) with 8px circles
  - `impact_depth_line` - Line layers (Electric_Grid, Railways, Roads) with 3px strokes
  - `impact_depth_polygon` - Polygon layers (Buildings, Built_up_Area, Cropped_Area) with 80% opacity fills

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

---

### Population Impact Statistics (ADDED - March 2026)

**Feature:** Added population impact data to enhance flood scenario assessment.

**Implementation:**
1. **Database Schema:** Created `impact.population_stats` table with:
   - Climate, maintenance, return period scenario identifiers
   - Total and affected population counts
   - Depth bin breakdown (15-100cm, 1-2m, 2-3m, 3-4m, 4-5m, above5m)
   - ON CONFLICT UPDATE for easy reloading

2. **Excel Data Loader:** `api/load-population-stats.mjs`
   - Parses 42 Excel files from `Exposure_Stats/` folder
   - Filename format: `Exposure_Consolidated_T3_{rp}yrs_{Climate}_{Maintenance}.xlsx`
   - Extracts population row (row 12) with depth bin values
   - Loads into database with deduplication

3. **API Enhancement:** Modified `api/impact-summary.mjs` to:
   - LEFT JOIN with `impact.population_stats` table
   - Return `populationImpact` object in scenario summaries
   - Include depth bin distribution with percentages

4. **UI Updates:** Updated `DetailedBreakdownView.tsx` to:
   - Show actual population count (not percentage) in summary cards
   - Display 4 summary cards: Population, Infrastructure, Ag/Buildings, Severity
   - Add "Population Impact" depth distribution chart
   - Calculate category-level impact percentages

**Data Management:**
```bash
# Reload population data from Excel files
node api/load-population-stats.mjs

# Verify population data in database
psql -h 10.0.0.205 -U postgres -d postgres \
  -c "SELECT climate, maintenance, return_period, affected_population FROM impact.population_stats LIMIT 5;"
```

**Files Added:**
- `api/migrations/create_population_stats.sql` - Database schema
- `api/load-population-stats.mjs` - Excel loader script
- Updated `api/impact-summary.mjs` - API integration
- Updated `src/types/impact.ts` - TypeScript types
- Updated `src/components/impact-matrix/views/DetailedBreakdownView.tsx` - UI changes

---

### Compare View toFixed() Error (FIXED - March 18, 2026)

**Issue:** Random white screen error in Compare View: `Uncaught TypeError: Cannot read properties of undefined (reading 'toFixed')`

**Root Cause:** Chart components didn't validate for `undefined`, `null`, or `NaN` values before passing them to `toFixed()` calls and Recharts components. This occurred when:
- API returned incomplete data for certain exposure layers
- Division operations resulted in `NaN` (e.g., dividing by zero)
- Population impact data had missing depth bins
- Chart tooltips received undefined values

**Solution:** Added comprehensive null/undefined/NaN validation throughout chart components:

1. **CustomTooltip Component** - Safe value extraction:
   ```typescript
   const presentValue = presentBar?.value;
   const formattedPresent = (presentValue !== undefined && presentValue !== null && !isNaN(presentValue))
     ? presentValue.toFixed(1)
     : '0.0';
   ```

2. **Chart Data Preparation** - Null checks before calculations:
   ```typescript
   if (presentImpact && presentImpact.totalFeatures > 0) {
     presentPercent = (presentImpact.affectedFeatures / presentImpact.totalFeatures) * 100;
   }
   ```

3. **Infrastructure & Ag/Building Calculations** - NaN validation:
   ```typescript
   if (!isNaN(presentPercent) && !isNaN(futurePercent)) {
     infrastructurePresentAvg += presentPercent;
     infrastructureFutureAvg += futurePercent;
   }
   ```

4. **Utility Functions** - Safe formatting:
   ```typescript
   export function formatCount(count: number): string {
     if (count === undefined || count === null || isNaN(count)) {
       return '0';
     }
     return count.toLocaleString();
   }
   ```

5. **Population Depth Distribution** - Null coalescing:
   ```typescript
   const presentPopulation = bin?.population ?? 0;
   ```

**Result:** Compare View is now fully resilient to missing or invalid data. All chart components handle edge cases gracefully.

**Files Modified:**
- `src/components/impact-matrix/views/components/ScenarioComparisonCharts.tsx`
- `src/lib/utils.ts`

---

### Dynamic Sidebar Width for Compare View (ADDED - March 18, 2026)

**Feature:** Sidebar automatically expands to 75% width in Compare View for better chart readability.

**Problem:** Compare View displays multiple charts and statistical visualizations that need more horizontal space. The 600px max-width constraint made charts feel cramped and reduced readability.

**Solution:** Implemented view-aware dynamic max-width that adjusts based on current Impact Matrix view:

1. **App Component State Tracking**:
   ```typescript
   const [currentImpactView, setCurrentImpactView] = useState<'summary' | 'detail' | 'compare'>('summary');
   ```

2. **Dynamic MAX_WIDTH Calculation**:
   ```typescript
   const MAX_WIDTH = currentImpactView === 'compare'
     ? Math.floor(window.innerWidth * 0.75)
     : 600;
   ```

3. **ImpactMatrix View Callback**:
   ```typescript
   // In ImpactMatrix.tsx
   useEffect(() => {
     onViewChange?.(currentView);
   }, [currentView, onViewChange]);
   ```

**View-Aware Constraints:**
- **Compare View**: 75% of viewport width (optimal for charts)
- **Summary/Detail/Layers Views**: 600px max (sufficient for text content)

**Technical Details:**
- `onViewChange` prop added to `ImpactMatrixProps` interface
- Parent App component tracks current view state
- Resize logic remains unchanged, only max constraint adjusts
- Seamless transition when switching between views

**User Experience:**
- Automatic adjustment when clicking between tabs
- No user action required
- Drag handle continues to work within new constraints
- Charts have more space for labels, bars, and legends

**Files Modified:**
- `src/App.tsx` - Added currentImpactView state and dynamic MAX_WIDTH
- `src/components/impact-matrix/ImpactMatrix.tsx` - Added onViewChange callback and useEffect

---

### Compare View UI Improvements (ADDED - March 18, 2026)

**Enhancements:** Improved labels and formatting in Compare View for better user experience.

#### 1. Maintenance Level Label Clarity

**Issue:** "Flood 2022" label didn't indicate it was the Breaches maintenance level.

**Solution:** Changed to "Flood 2022 (Breaches)" using the centralized `formatMaintenanceLabel()` utility.

**Before:**
```typescript
// Hardcoded labels
{comparison.baseline.maintenance === 'breaches'
  ? 'Flood 2022'
  : comparison.baseline.maintenance === 'redcapacity'
    ? 'Reduced Capacity'
    : 'Perfect Maintenance'}
```

**After:**
```typescript
// Using centralized formatting function
{formatMaintenanceLabel(comparison.baseline.maintenance)}
```

**Result:** The word "Breaches" is now prominently displayed everywhere in the UI, making it unambiguous which maintenance level is being viewed.

#### 2. Population Chart Integer Formatting

**Issue:** Population Impact by Flood Depth chart showed:
- Population with % sign (e.g., "262993.4%")
- Decimal values on axis (e.g., "12345.6")
- Misleading Depth Scale legend

**Solution:** Created separate tooltip components and proper integer formatting.

**Implementation:**

1. **Created Two Tooltip Components:**
   ```typescript
   // For exposure percentages (keeps % sign)
   function ExposureTooltip({ active, payload }: any) {
     const formattedPresent = presentValue.toFixed(1);
     return <span>{formattedPresent}%</span>;
   }

   // For population counts (integers only)
   function PopulationTooltip({ active, payload }: any) {
     const formattedPresent = Math.round(presentValue).toLocaleString();
     return <span>{formattedPresent} people</span>;
   }
   ```

2. **Updated XAxis Formatter:**
   ```typescript
   <XAxis
     tickFormatter={(value: number) => Math.round(value).toLocaleString()}
   />
   ```

3. **Removed Irrelevant Legend:**
   - Removed "Depth Scale" legend from Population Depth Distribution chart
   - Not relevant for Present vs Future comparison

**Result:**
- Population: "262,993 people" (integer with comma separators)
- X-axis: "12,345" (whole numbers, no decimals)
- Clean view without confusing legend

**Files Modified:**
- `src/components/impact-matrix/views/components/ScenarioComparisonCharts.tsx`

## Mobile Responsiveness

- App uses `use-mobile.ts` hook for responsive behavior
- Sidebar collapses on mobile (overlay pattern)
- Base maps and map controls adapt to screen size

## UI Features

- **Resizable Sidebar:** Layer panel can be resized by dragging the right edge (200px-600px range)
- **Coordinate Display:** Real-time mouse position in UTM (Zone 42N) and Lat/Lon with copy-to-clipboard
- **Feature Identification:** Click on any layer to view attributes via WMS GetFeatureInfo (works for raster and vector)
- **Swipe Compare:** Compare two flood scenarios side-by-side with synchronized pan/zoom and draggable divider
- **Interventions:** Draw points, lines, polygons on the map with details (title, description, category), search, filter, visibility toggle, and GeoJSON export
  - **Authentication required:** Must sign in to draw, edit, or delete interventions
  - **Role-based access:** Admins can manage all interventions; regular users can only manage their own
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
sshpass -p '<your_password>' scp -r dist/* umair@10.0.0.205:/mnt/d/Scenario_results/floodrisk_sferp/dist/

# 4. Pull git changes on server (keeps server repo synced)
sshpass -p '<your_password>' ssh umair@10.0.0.205 "cd /mnt/d/Scenario_results/floodrisk_sferp && git pull"
```

See README.md for detailed Apache configuration and deployment instructions.
