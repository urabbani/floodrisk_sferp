# Flood Risk Assessment - Indus River

A web-based interactive flood risk assessment tool for the Indus River region in Sindh Province, Pakistan. Built with React 19, TypeScript, Vite, Tailwind CSS, and OpenLayers.

![Flood Risk Assessment](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?logo=vite)
![OpenLayers](https://img.shields.io/badge/OpenLayers-10-1F6F75)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-PostGIS-336791?logo=postgresql)

## Key Features

### Core Features
- **Interactive Map Viewer** - OpenLayers-based map with multiple base map options (Google Satellite, OSM, Terrain)
- **GeoServer Integration** - WMS services for flood scenario layers across 3 workspaces
- **Layer Management** - Hierarchical layer tree with visibility/opacity controls
- **Four-Panel Interface** - "Hazard", "Impact", "Risk", and "Interventions" tabs
- **Feature Identification** - Click on any layer to view attributes via WMS GetFeatureInfo
- **Coordinate Display** - Real-time mouse position in UTM (Zone 42N) and Lat/Lon with copy-to-clipboard
- **Swipe Compare Tool** - Side-by-side comparison of two flood scenarios with synchronized pan/zoom
- **Resizable Sidebar** - Drag the right edge to resize (expands to 75% width in Compare View for chart readability)
- **Mobile Responsive** - Adaptive UI with sidebar toggle for small screens
- **Stream Network** - HydroSHEDS-derived stream network visualization with flow accumulation gradient

### Impact Matrix Module
- **Real-time Impact Analysis** - Comprehensive flood impact assessment across 42 scenarios per climate
- **Population Impact Statistics** - Affected population counts by depth bin (loaded from Excel data)
- **4 Summary Cards**: Population Affected, Infrastructure Impact, Agriculture & Buildings, Overall Risk Severity
- **9 Exposure Layers**: BHU, Buildings, Built-up Area, Cropped Area, Electric Grid, Railways, Roads, Settlements, Telecom Towers
- **Dynamic Statistics** - All counts/percentages computed from database (no hardcoded values)
- **Depth Distribution Charts** - Visual breakdown by depth bin percentages (6 bins: 15-100cm through >5m)
- **Area-Based Analysis** - Zonal layers use actual geometric area calculations via PostGIS
- **Compare View** - Side-by-side Present vs Future climate comparison with insightful charts

### Risk Dashboard
- **Multi-Mode Analysis** - Exposure, Vulnerability, and Damage (Exp → Vul → Dmg) risk modes
- **Asset Types** - Agriculture (crop) and Buildings (Kacha, Pakka, High-Rise) damage assessment
- **Summary Heatmap** - Color-coded matrix of risk across scenarios
- **District Breakdown** - Per-district risk analysis with bar charts for all districts in Sindh
- **Spatial View** - Choropleth map visualization with district-level risk coloring and hover tooltips
- **Scenario Selection** - Filter by climate (present/future), maintenance level, and return period
- **Pre-computed Data** - Risk data generated via Python pipeline and served as static JSON

### Interventions
Collaborative drawing and annotation on the map (enhanced March 30, 2026):
- **Simplified Create Flow**: Dialog opens FIRST, then drawing happens
  1. Click "Create Intervention" → opens dialog
  2. Fill in Name, select Intervention Type from 42 predefined types
  3. Description and required parameters appear dynamically
  4. Feature Type auto-selected (Point/Line/Polygon)
  5. Click "Create" → draw geometry → saved automatically
- **42 Intervention Types** from requirements document (e.g., M4-Afforestation, P1-Bypass Channel)
- Edit, delete, search, filter interventions
- Toggle visibility, export as GeoJSON
- **JWT-based authentication** required for drawing/editing
- **Role-based access control**: Admin users can manage all interventions; regular users can only manage their own

## Tech Stack
- **Frontend**: React 19 with TypeScript 5.9, Vite 7.2, Tailwind CSS 3.x
- **Map Library**: OpenLayers 10 (UTM Zone 42N - EPSG:32642)
- **UI Components**: shadcn/ui (Radix UI)
- **Charts**: Recharts
- **Backend**: Node.js/Express with PostgreSQL/PostGIS
- **Authentication**: JWT tokens with bcryptjs password hashing
- **Caching**: In-memory cache with TTL

## Project Structure
```
floodrisk_sferp/
├── src/                          # Frontend source code
│   ├── components/
│   │   ├── annotations/          # Interventions (drawing & annotation)
│   │   ├── impact-matrix/        # Impact Matrix feature
│   │   ├── layer-tree/           # Layer visibility controls
│   │   ├── map/                  # OpenLayers map viewer, legend panel
│   │   ├── popups/               # Feature info popups
│   │   ├── risk-dashboard/       # Risk Dashboard (heatmap, district, spatial views)
│   │   ├── scenario-explorer/    # Scenario comparison matrix
│   │   ├── swipe/                # Swipe compare component
│   │   └── ui/                   # shadcn/ui components
│   ├── config/                   # Layer configuration (layers.ts)
│   ├── hooks/                    # Custom React hooks (useAuth, use-mobile)
│   ├── lib/                      # Utility functions
│   └── types/                    # TypeScript type definitions
├── api/                          # Backend API
│   ├── impact-summary.mjs        # Impact API server with caching
│   ├── auth.mjs                  # JWT authentication module
│   ├── annotations.mjs           # Interventions CRUD API
│   ├── db.mjs                    # Database connection pool
│   ├── seed-user.mjs             # CLI user management tool
│   ├── load-population-stats.mjs # Excel → DB population data loader
│   └── migrations/               # Database migration scripts
│       ├── create_users.sql      # Auth users table schema
│       └── create_population_stats.sql  # Population stats table
├── public/
│   └── data/                     # Static data files
│       ├── risk.json             # Pre-computed risk data
│       └── districts.geojson     # District boundaries
├── scripts/
│   └── build-risk-json.js        # Risk data build script
├── sql/                          # SQL queries
│   ├── impact_summary_actual.sql
│   └── impact_summary_query.sql
├── styles/                       # GeoServer SLD styles
│   ├── hydrosheds_streamnetwork.sld.xml
│   └── hydrosheds_streamnetwork_continuous.sld.xml
├── tools/
│   └── geoserver/                # GeoServer management scripts
├── docs/                         # Documentation
├── dist/                         # Production build output
├── CLAUDE.md                     # Project-specific Claude instructions
└── README.md                     # This file
```

## Layer Hierarchy

Layers follow a hierarchical structure with GeoServer WMS integration:

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
└─ HDTM (Digital Elevation Model)
```

**Layer Naming Convention:** GeoServer layers follow `t3_{rp}yrs_{scenario}_{maintenance}_{parameter}`
(e.g., `t3_25yrs_present_perfect_maxdepth`)

**GeoServer Workspaces:**
- `results` - Flood scenario layers (raster), survey points, structures
- `DEM` - DEM layers (HDTM), AOI, SubCatchments, Stream Network (database-backed)
- `exposures` - Impact exposure layers (378 layers: 9 exposure types × 42 scenarios)

## Installation & Setup

### Prerequisites
- Node.js (v18 or higher) - [Download](https://nodejs.org/)
- npm (comes with Node.js)
- GeoServer instance with flood risk data configured
- PostgreSQL/PostGIS database (for Impact Matrix and Interventions backend)

### Installation
```bash
# 1. Clone the repository
git clone https://github.com/urabbani/floodrisk_sferp.git
cd floodrisk_sferp

# 2. Install dependencies
npm install
# Note: On WSL (Windows Subsystem for Linux), use `npm install --no-bin-links` to avoid symlink issues.

# 3. Configure GeoServer
# Edit src/config/layers.ts to match your GeoServer setup
```

## Development

### Frontend Development Server
```bash
npm run dev  # Includes GeoServer proxy at /geoserver
# Available at http://localhost:5173
```

### Backend API Server (Required for Impact Matrix & Interventions)
```bash
# Terminal 1: Start frontend
npm run dev

# Terminal 2: Start backend API
cd api
node impact-summary.mjs
# Available at http://localhost:3001
```

### Build Risk Data
```bash
npm run build:risk-data  # Generates public/data/risk.json from Python pipeline output
```

### User Management (Authentication)
The Interventions feature requires authentication. Create users via CLI:

```bash
# Create a regular user
node api/seed-user.mjs add john "John Doe" password123

# Create an admin user
node api/seed-user.mjs add admin "Administrator" password123 --admin

# List all users
node api/seed-user.mjs list

# Reset password
node api/seed-user.mjs reset-password john newpassword

# Disable/enable account
node api/seed-user.mjs toggle john
```

### Population Data Management
```bash
# Reload population data from Excel files in Exposure_Stats/
node api/load-population-stats.mjs

# Verify data
psql -h 10.0.0.205 -U postgres -d postgres \
  -c "SELECT climate, maintenance, return_period, affected_population FROM impact.population_stats LIMIT 5;"
```

### Building for Production
```bash
npm run build   # TypeScript check + Vite build → dist/
npm run preview # Preview production build locally
npm run lint    # Run ESLint
```

## Deployment

The application is deployed at: **https://portal.srpsid-dss.gos.pk**

- **Platform:** Apache on WSL with HTTPS (Let's Encrypt SSL)
- **Server:** `10.0.0.205`
- **Document Root:** `/mnt/d/Scenario_results/floodrisk_sferp/dist/`
- **Backend Service:** systemd manages `floodrisk-impact-api` on port 3001
- **GeoServer Proxy:** Apache proxies `/geoserver` → `http://10.0.0.205:8080/geoserver`
- **API Proxy:** Apache proxies `/api/` → `http://localhost:3001/api/`

### Deployment Workflow
Keep 3 locations synced (local → GitHub → production):

```bash
# 1. Build locally
npm run build

# 2. Commit and push to GitHub
git add .
git commit -m "your commit message"
git push

# 3. Upload dist to server
scp -r dist/* umair@10.0.0.205:/mnt/d/Scenario_results/floodrisk_sferp/dist/

# 4. Pull git changes on server (keeps server repo synced)
ssh umair@10.0.0.205 "cd /mnt/d/Scenario_results/floodrisk_sferp && git pull"
```

### Backend Service Management
```bash
sudo systemctl start floodrisk-impact-api    # Start
sudo systemctl enable floodrisk-impact-api   # Enable on boot
sudo systemctl status floodrisk-impact-api   # Check status
sudo journalctl -u floodrisk-impact-api -f   # View logs
```

## Map Projection

**Important:** The map uses UTM Zone 42N (EPSG:32642), not Web Mercator. OpenLayers is configured with proj4 for this projection. Center coordinates and extent are in UTM, not lat/lon.

## Credits

Developed and maintained by Dr. Umair Rabbani

Built with Claude Code using Z.AI's GLM series of models
