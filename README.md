# Flood Risk Assessment - Indus River

A web-based interactive flood risk assessment tool for the Indus River region in Sindh Province, Pakistan. Built with React 19, TypeScript, Vite, Tailwind CSS, and OpenLayers.

![Flood Risk Assessment](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?logo=vite)
![OpenLayers](https://img.shields.io/badge/OpenLayers-Latest-1F6F75)

**Last Updated:** March 17, 2026

## Features

### Core Features
- **Interactive Map Viewer** - OpenLayers-based map with dynamic north arrow and multiple base map options (Google Satellite, OpenStreetMap, Terrain)
- **GeoServer Integration** - WMS services for flood scenario layers
- **Layer Management** - Hierarchical layer tree with:
  - Group and individual layer visibility toggles
  - Opacity control for each layer
  - Expandable/collapsible groups
  - Active layers overlay showing all visible layers
  - Resizable sidebar panel
- **Feature Identification** - Click on any layer (raster or vector) to view attributes via GeoServer WMS GetFeatureInfo
- **Coordinate Display** - Real-time mouse position display in both UTM (Zone 42N) and Lat/Lon formats with copy-to-clipboard
- **Swipe Compare Tool** - Side-by-side comparison of two different flood scenarios with synchronized pan/zoom
- **Mobile Responsive** - Adaptive UI with sidebar toggle for mobile/desktop

### NEW: Impact Matrix Module
- **Real-time Impact Analysis** - Comprehensive flood impact assessment across 42 scenarios per climate
- **Population Impact Statistics** - Shows affected population counts by depth bin for each scenario
- **4 Summary Cards** - Quick overview showing:
  - Population Affected (total count of people impacted)
  - Infrastructure Impact (avg % of roads, railways, electric, telecom)
  - Agriculture & Buildings (avg % of crops and buildings)
  - Overall Risk Severity (Low/Medium/High/Extreme)
- **Dual Climate Views** - Toggle between Present and Future climate scenarios
- **9 Exposure Layers** - Analyzes impacts on:
  - Basic Health Units (BHU)
  - Buildings
  - Built-up Area
  - Cropped Area
  - Electric Grid
  - Railways
  - Roads
  - Settlements
  - Telecom Towers
- **Dynamic Statistics** - All counts and percentages computed in real-time from database (no hardcoded values)
- **Depth Distribution Charts** - Visual breakdown of flood depth by percentage for each layer
- **Population Impact Chart** - Shows population distribution across flood depth bins
- **Area-Based Analysis** - Zonal layers use actual geometric area calculations via ST_Area()
- **Severity Levels** - Color-coded by return period intensity (light red → dark red)
- **Interactive Layer Controls** - Toggle impact layers on the map directly from the Impact panel
- **Summary Heatmap** - Quick overview of all scenarios in a 7×3 matrix layout
- **Detailed Breakdown View** - Per-scenario exposure details with expandable depth distribution

### Latest Improvements (March 2026)

#### GeoServer Layer Integration
- **Complete Layer Re-import** - 378 impact layers (42 scenarios × 9 exposure types) published to GeoServer
- **Decimal Naming Workaround** - 2.3-year scenarios use "23yrs" naming to avoid REST API issues
- **Unified Workspace** - All impact layers in `exposures` workspace
- **Geometry-Specific Styling** - Each layer type uses its own optimized style
  - Point layers: `impact_depth_point` with 8px circles
  - Line layers: `impact_depth_line` with 3px strokes
  - Polygon layers: `impact_depth_polygon` with 80% opacity fills

#### API Performance Enhancements
- **In-Memory Caching** - ~400x faster response times for cached requests
  - Cache MISS: ~2 seconds (database query)
  - Cache HIT: ~5 milliseconds (from memory)
- **Smart Cache Keys** - Based on climate, maintenance, and return period parameters
- **Cache Management** - REST endpoints for cache statistics, clearing, and invalidation
- **5-Minute TTL** - Automatic cache expiration with configurable duration
- **HTTP Caching Headers** - Browser caching support via Cache-Control headers

#### Depth Filtering
- **Depth Threshold Slider** - Filter impacts by minimum flood depth (0-5m)
- **Real-time Filtering** - Dynamically updates statistics and charts
- **CQL Filter Integration** - Applies depth filter to WMS layers on map
- **Depth Distribution Charts** - Visual breakdown by depth bin percentages

#### API Endpoints
- **Impact Summary** - `GET /api/impact/summary?climate={present|future}`
- **Cache Statistics** - `GET /api/cache/stats`
- **Clear Cache** - `POST /api/cache/clear`
- **Invalidate Cache** - `POST /api/cache/invalidate?climate=present`

### Climate Scenarios
- **Present Climate** - Current conditions with 3 maintenance levels
- **Future Climate** - Projected conditions with 3 maintenance levels
- **Maintenance Levels**:
  - Breaches (2022 actual)
  - Reduced Capacity
  - Perfect conditions

### Return Periods
- 7 return periods: 2.3, 5, 10, 25, 50, 100, 500 years
- Color-coded intensity gradient in matrix view

## Tech Stack

- **Frontend Framework:** React 19 with TypeScript
- **Build Tool:** Vite 7.3
- **Styling:** Tailwind CSS 3.x
- **Map Library:** OpenLayers
- **UI Components:** shadcn/ui (Radix UI)
- **Map Projection:** UTM Zone 42N (EPSG:32642)
- **Backend:** Node.js/Express with PostgreSQL/PostGIS
- **Caching:** In-memory cache with TTL

## Project Structure

```
floodrisk_sferp/
├── src/                          # Frontend source code
│   ├── components/
│   │   ├── impact-matrix/        # Impact Matrix feature
│   │   ├── layer-tree/           # Layer visibility controls
│   │   ├── map/                  # OpenLayers map viewer
│   │   ├── scenario-explorer/    # Scenario comparison matrix
│   │   └── ui/                   # shadcn/ui components
│   ├── config/                   # Configuration files
│   ├── lib/                      # Utility functions
│   └── types/                    # TypeScript type definitions
├── api/                          # Backend API
│   ├── impact-summary.mjs        # Impact API server with caching
│   └── CACHING.md                # Caching documentation
├── tools/
│   └── geoserver/                # GeoServer management scripts
│       ├── apply_style_to_all.py      # Apply styles to all layers
│       ├── exp_to_geoserver.py         # Create data stores
│       └── publish_schema_layers.py    # Publish layers
├── docs/                         # Documentation
│   ├── features/                 # Feature documentation
│   └── archived/                 # Archived planning documents
├── dist/                         # Production build output
├── public/                       # Static assets
├── CLAUDE.md                     # Project-specific Claude instructions
└── README.md                     # This file
```

## Prerequisites

Before running this application, ensure you have:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **GeoServer** instance with flood risk data configured

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/urabbani/floodrisk_sferp.git
   cd floodrisk_sferp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

   *Note: On WSL (Windows Subsystem for Linux), use `npm install --no-bin-links` to avoid symlink issues.*

3. **Configure GeoServer**

   Edit `src/config/layers.ts` to match your GeoServer setup:
   ```typescript
   const GEOSERVER_CONFIG = {
     baseUrl: '/geoserver',  // Proxied to GeoServer via Vite
     workspaces: {
       results: 'results',
       dem: 'DEM',
     },
     wmsVersion: '1.1.1',
   };
   ```

## Development

### Frontend Development Server

Start the development server (includes GeoServer proxy at `/geoserver`):
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Backend API Server

The Impact Matrix requires a backend API server for impact statistics:

```bash
# Terminal 1: Start frontend
npm run dev

# Terminal 2: Start backend API
cd api
node impact-summary.mjs
```

The backend API will be available at `http://localhost:3001`

**API Endpoints:**
- Impact Summary: `http://localhost:3001/api/impact/summary?climate=present`
- Cache Stats: `http://localhost:3001/api/cache/stats`
- Health Check: `http://localhost:3001/api/health`

### Building for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

The application will be available at `http://localhost:5173/`

To expose on network (for testing on other devices):
```bash
npm run dev -- --host
```

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

Preview the production build locally:
```bash
npm run preview
```

## Project Structure

```
floodrisk_sferp/
├── public/                 # Static assets
├── src/
│   ├── components/
│   │   ├── Header.tsx     # Application header
│   │   ├── layer-tree/    # Layer tree component
│   │   ├── map/           # Map viewer & legend panel
│   │   ├── map-tools/     # Map tool components
│   │   ├── popups/        # Feature info popups
│   │   ├── swipe/         # Swipe compare component
│   │   ├── scenario-explorer/  # Scenario matrix view
│   │   └── ui/            # shadcn/ui components
│   ├── config/
│   │   └── layers.ts      # Layer configuration & GeoServer settings
│   ├── types/
│   │   └── layers.ts      # TypeScript type definitions
│   ├── hooks/
│   │   └── use-mobile.ts  # Mobile detection hook
│   ├── lib/
│   │   └── utils.ts       # Utility functions
│   ├── App.tsx            # Main application component
│   ├── main.tsx           # Application entry point
│   └── index.css          # Global styles
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Layer Configuration

All layers are defined in `src/config/layers.ts`. The layer tree structure is:

```
Layers
├── Survey
│   └── DGPS Survey Points
├── Structures
│   ├── Canal Network
│   └── Drains
├── Supporting Layers
│   ├── Area of Interest
│   ├── Sindh Province
│   └── Sub-Catchments
├── Present Climate
│   ├── Maintenance - Breaches
│   │   └── Depth, Velocity, Duration, V×h
│   ├── Maintenance - Reduced Capacity
│   └── Maintenance - Perfect
├── Future Climate
│   └── (same structure as Present)
├── Flood 2022 (Actual Event)
│   └── Max Depth, Max Velocity, Duration, V×h
└── HDTM
    └── High-resolution DEM (merged tiles 1-9 at 1m resolution)
```

**Layer naming convention:** `t3_{returnPeriod}yrs_{scenario}_{maintenance}_{parameter}`
- Example: `t3_25yrs_present_perfect_maxdepth`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | TypeScript check + production build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build locally |

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Production Deployment (Apache on WSL with HTTPS)

**Live Site:** https://portal.srpsid-dss.gos.pk

This application is deployed on Apache running in WSL with HTTPS enabled.

### 1. Build the Application

```bash
npm run build
```

### 2. Apache Configuration

Create or update the Apache virtual host configuration:

```apache
<VirtualHost *:443>
    ServerName portal.srpsid-dss.gos.pk
    DocumentRoot /mnt/d/Scenario_results/floodrisk_sferp/dist

    # SSL Configuration (Let's Encrypt)
    SSLEngine on
    SSLCertificateFile "/etc/letsencrypt/live/portal.srpsid-dss.gos.pk/fullchain.pem"
    SSLCertificateKeyFile "/etc/letsencrypt/live/portal.srpsid-dss.gos.pk/privkey.pem"

    # Proxy GeoServer WMS requests
    ProxyPreserveHost On
    ProxyPass /geoserver http://10.0.0.205:8080/geoserver
    ProxyPassReverse /geoserver http://10.0.0.205:8080/geoserver

    # Proxy API requests to backend (for Impact Matrix)
    ProxyPreserveHost On
    ProxyPass /api/ http://localhost:3001/api/
    ProxyPassReverse /api/ http://localhost:3001/api/

    # SPA routing - redirect all requests to index.html
    <Directory "/mnt/d/Scenario_results/floodrisk_sferp/dist">
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]

        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # Enable compression
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
    </IfModule>

    # Cache static assets
    <IfModule mod_expires.c>
        ExpiresActive On
        ExpiresByType image/gif "access plus 1 year"
        ExpiresByType image/jpeg "access plus 1 year"
        ExpiresByType image/png "access plus 1 year"
        ExpiresByType image/svg+xml "access plus 1 year"
        ExpiresByType application/javascript "access plus 1 year"
        ExpiresByType text/css "access plus 1 year"
    </IfModule>

    ErrorLog ${APACHE_LOG_DIR}/floodrisk-error.log
    CustomLog ${APACHE_LOG_DIR}/floodrisk-access.log combined
</VirtualHost>

# Redirect HTTP to HTTPS
<VirtualHost *:80>
    ServerName your-domain.com
    Redirect permanent / https://your-domain.com/
</VirtualHost>
```

### 3. Deploy

Copy the built files to the Apache document root:

```bash
# Local build
npm run build

# Upload to server (using sshpass)
sshpass -p 'password' scp -r dist/* umair@10.0.0.205:/mnt/d/Scenario_results/floodrisk_sferp/dist/

# Or if on server directly
sudo cp -r dist/* /mnt/d/Scenario_results/floodrisk_sferp/dist/
sudo systemctl reload apache2
```

### 4. Backend API Deployment (Impact Matrix)

The Impact Matrix feature requires a backend API server to serve statistics from PostgreSQL/PostGIS.

#### Quick Deploy (Automated)

```bash
# Set your password in deploy-backend.sh first
./deploy-backend.sh
```

#### Manual Deploy

**Step 1: Upload API files to server**

```bash
# Create api directory on server
ssh umair@10.0.0.205 "mkdir -p /mnt/d/Scenario_results/floodrisk_sferp/api"

# Upload files
scp api/impact-summary.mjs umair@10.0.0.205:/mnt/d/Scenario_results/floodrisk_sferp/api/
scp api/package.json umair@10.0.0.205:/mnt/d/Scenario_results/floodrisk_sferp/api/
scp api/floodrisk-impact-api.service umair@10.0.0.205:/mnt/d/Scenario_results/floodrisk_sferp/api/
```

**Step 2: Install dependencies**

```bash
ssh umair@10.0.0.205
cd /mnt/d/Scenario_results/floodrisk_sferp/api
npm install --production
```

**Step 3: Setup systemd service**

```bash
# Copy service file
sudo cp /mnt/d/Scenario_results/floodrisk_sferp/api/floodrisk-impact-api.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable and start service
sudo systemctl enable floodrisk-impact-api
sudo systemctl start floodrisk-impact-api

# Verify service is running
sudo systemctl status floodrisk-impact-api
```

**Step 4: Test API**

```bash
# Test Present climate endpoint
curl http://localhost:3001/api/impact-summary?climate=present

# Test Future climate endpoint
curl http://localhost:3001/api/impact-summary?climate=future
```

**Service Management:**

```bash
# Start/Stop/Restart
sudo systemctl start floodrisk-impact-api
sudo systemctl stop floodrisk-impact-api
sudo systemctl restart floodrisk-impact-api

# View logs
sudo journalctl -u floodrisk-impact-api -f

# Check status
sudo systemctl status floodrisk-impact-api
```

**Loading Population Data:**

The Impact Matrix includes population impact statistics loaded from Excel files:

```bash
# Load/reload population data from Excel files
cd /mnt/d/Scenario_results/floodrisk_sferp
node api/load-population-stats.mjs

# Verify population data in database
PGPASSWORD='maltanadirSRV0' psql -h 10.0.0.205 -U postgres -d postgres \
  -c "SELECT climate, maintenance, return_period, affected_population FROM impact.population_stats ORDER BY return_period LIMIT 10;"
```

**Data Source:**
- Excel files located in `Exposure_Stats/` folder
- Filename format: `Exposure_Consolidated_T3_{rp}yrs_{Climate}_{Maintenance}.xlsx`
- 42 files covering all scenario combinations (2 climates × 3 maintenance levels × 7 return periods)
- Population data stored in `impact.population_stats` table
- Includes depth bin breakdown: 15-100cm, 1-2m, 2-3m, 3-4m, 4-5m, above5m

**Environment Variables:** The API uses these environment variables (configured in systemd service):

- `PORT`: 3001
- `DB_HOST`: 10.0.0.205
- `DB_PORT`: 5432
- `DB_NAME`: postgres
- `DB_USER`: postgres
- `DB_PASSWORD`: maltanadirSRV0

### 5. GeoServer Configuration

The application proxies GeoServer requests through Apache. Ensure:
- GeoServer is accessible at `http://10.0.0.205:8080/geoserver`
- Apache `proxy`, `proxy_http`, and `rewrite` modules are enabled:
  ```bash
  sudo a2enmod proxy proxy_http rewrite ssl
  ```

### 6. Server Details

**Production Server:**
- Host: `10.0.0.205` (internal WSL)
- Domain: `portal.srpsid-dss.gos.pk`
- Public IP: `124.29.217.193`
- Document Root: `/mnt/d/Scenario_results/floodrisk_sferp/dist/`
- Apache Config: `/etc/apache2/sites-available/floodrisk.conf`
- SSL: Let's Encrypt certificates

**GeoServer:**
- URL: `http://10.0.0.205:8080/geoserver`
- Proxy: Apache proxies `/geoserver` to GeoServer

### 6. Updating the Production Site

After the initial deployment, use this workflow to update the site with new features or fixes:

```bash
# 1. Pull latest changes from git (if applicable)
git pull origin main

# 2. Install any new dependencies
npm install --no-bin-links

# 3. Build the production bundle
npm run build

# 4. Backup current production (optional but recommended)
sudo cp -r /var/www/html/floodrisk /var/www/html/floodrisk.backup.$(date +%Y%m%d_%H%M%S)

# 5. Deploy to production
sudo rm -rf /var/www/html/floodrisk/*
sudo cp -r dist/* /var/www/html/floodrisk/

# 6. Clear browser cache (users may need to hard refresh: Ctrl+Shift+R)
```

#### Quick Deploy Script

Create a script `deploy.sh` for faster deployments:

```bash
#!/bin/bash
set -e

echo "Building application..."
npm run build

echo "Backing up current version..."
sudo cp -r /var/www/html/floodrisk /var/www/html/floodrisk.backup.$(date +%Y%m%d_%H%M%S)

echo "Deploying to production..."
sudo rm -rf /var/www/html/floodrisk/*
sudo cp -r dist/* /var/www/html/floodrisk/

echo "Deployment complete! Clear browser cache if needed."
```

Make it executable: `chmod +x deploy.sh`

Then deploy with: `./deploy.sh`

## Standard Deployment Workflow (Keep All 3 Synced)

**The 3 locations to keep synced:**
1. **Local machine** - Your development environment
2. **GitHub** - Remote repository (https://github.com/urabbani/floodrisk_sferp.git)
3. **Production server** - Live site at https://portal.srpsid-dss.gos.pk

### Complete Deployment Steps

```bash
# 1. Build locally
npm run build

# 2. Commit and push to GitHub
git add .
git commit -m "your commit message"
git push

# 3. Deploy to production server
sshpass -p 'your_password' ssh umair@10.0.0.205 << 'ENDSSH'
cd /mnt/d/Scenario_results/floodrisk_sferp

# Pull latest code
git fetch origin
git reset --hard origin/main

# Restart backend API service
sudo systemctl restart floodrisk-impact-api

# Check service status
systemctl status floodrisk-impact-api --no-pager | head -5
ENDSSH

# 4. Verify deployment
curl -s http://10.0.0.205:3001/api/health | python3 -m json.tool
curl -s https://portal.srpsid-dss.gos.pk/ | grep -o "<title>.*</title>"
```

**Server Details:**
- Host: `umair@10.0.0.205`
- Document Root: `/mnt/d/Scenario_results/floodrisk_sferp/dist/`
- Repo Path: `/mnt/d/Scenario_results/floodrisk_sferp/`
- Live Site: https://portal.srpsid-dss.gos.pk

## Credits

Developed and maintained by Dr. Umair Rabbani

Built with Claude Code using Anthropic's Claude Sonnet 4.6

## Recent Updates (March 2026)

### GeoServer Layer Integration (March 17, 2026)

**Complete re-import of impact exposure layers to GeoServer:**

- **378 layers published** across 42 scenarios (6 return periods × 3 maintenance levels × 2 climates)
- **9 exposure types** per scenario: BHU, Buildings, Built_up_Area, Cropped_Area, Electric_Grid, Railways, Roads, Settlements, Telecom_Towers
- **Naming workaround implemented** for decimal return periods (2.3yrs → 23yrs) to avoid GeoServer REST API issues
- **Geometry-specific styling** applied using `impact_depth_point`, `impact_depth_line`, and `impact_depth_polygon` SLDs
- **Unified workspace** - all layers in `exposures` workspace

**Tools created:**
- `tools/geoserver/exp_to_geoserver.py` - Create data stores
- `tools/geoserver/publish_schema_layers.py` - Publish layers
- `tools/geoserver/apply_style_to_all.py` - Apply styles

### API Performance Optimization (March 17, 2026)

**Implemented in-memory caching for Impact Matrix API:**

- **~400x faster** response times for cached requests
  - Cache MISS: ~2 seconds (database query)
  - Cache HIT: ~5 milliseconds (from memory)
- **Smart cache keys** based on climate, maintenance, and return period
- **5-minute TTL** with configurable duration via `CACHE_TTL` environment variable
- **Cache management endpoints** for statistics, clearing, and invalidation
- **HTTP caching headers** for browser-side caching

**New API endpoints:**
- `GET /api/cache/stats` - View cache statistics
- `POST /api/cache/clear` - Clear all cache
- `POST /api/cache/invalidate` - Invalidate specific cache entry

### Depth Filtering Feature (March 17, 2026)

**Added depth threshold filtering to Impact Matrix:**

- **Interactive slider** (0-5m) to filter impacts by minimum flood depth
- **Real-time updates** to statistics and charts
- **CQL filter integration** applies depth filter to WMS layers
- **Depth distribution charts** show percentage breakdown by depth bin

## Known Issues & Fixes

### Multiple Layer Visibility Bug (March 16, 2026)

**Fixed:** Issue where only the newest activated layer would remain visible when toggling multiple layers.

**Solution:** Refactored `src/components/map/MapViewer.tsx` to use `onMapClickRef` instead of depending on `onMapClick` in map initialization.

### Percentage Calculation Bug (March 16, 2026)

**Fixed:** Electric Grid, Built_up_Area, and Cropped_Area showing >100% impact percentage.

**Solution:** Modified `api/impact-summary.mjs` to use geometry-specific calculations:
- Line features: `SUM(ST_Length(geom))` for total/affected length
- Polygon features: `SUM(ST_Area(geom))` for total/affected area
- Point features: `COUNT(*)` for feature counts

---

### Impact Matrix Percentage Calculation Fix (March 16, 2026)

**Fixed:** Electric Grid, Built_up_Area, and Cropped_Area showing >100% impact percentage.

**What was broken:**
- Electric Grid showed "199% Length affected" ✗
- Built_up_Area showed "245% Area affected" ✗
- Cropped_Area showed "312% Area affected" ✗

**Root Cause:** The backend API was using `COUNT(*)` for all exposure types, which works for point features but is incorrect for line and polygon features:
- **Line features** should compare: affected length ÷ total length
- **Polygon features** should compare: affected area ÷ total area
- **Point features** correctly compare: affected count ÷ total count

**Solution:** Modified `api/impact-summary.mjs` to calculate geometry-specific totals:

1. **Electric_Grid (Line Features)**:
   ```sql
   -- Total length from exposure input
   SELECT SUM(ST_Length(geom)) FROM "Exposure_InputData"."Electric_Grid"

   -- Affected length from impacted scenario
   SELECT SUM(ST_Length(geom)) FROM "T3_25yrs_Present_Breaches_Impacted"."Electric_Grid" WHERE depth_bin IS NOT NULL
   ```
   Shows: "Length %" (e.g., "45.2%" with "12,345m of 27,890m affected")

2. **Built_up_Area, Cropped_Area (Polygon Features)**:
   ```sql
   -- Total area from exposure input
   SELECT SUM(ST_Area(geom)) FROM "Exposure_InputData"."Built_up_Area"

   -- Affected area from impacted scenario
   SELECT SUM(ST_Area(geom)) FROM "T3_25yrs_Present_Breaches_Impacted"."Built_up_Area" WHERE depth_bin IS NOT NULL
   ```
   Shows: "Area %" (e.g., "67.8%" with "45,678m² of 67,890m² affected")

3. **All Other Layers (Point Features)**:
   - BHU, Telecom Towers, Buildings, Settlements, Railways, Roads
   - Continue using `COUNT(*)` for feature counts
   - Shows: "Count %"

**Result:** Accurate percentages comparing apples to apples (length vs length, area vs area, count vs count). The percentage labels in the UI now correctly reflect the measurement type (Count/Length/Area).

**Performance:** Optimized to only calculate expensive geometry operations for Electric_Grid, Built_up_Area, and Cropped_Area. Other layers use fast COUNT(*) queries.

---

### Population Impact Statistics (March 16, 2026)

**Added:** Population impact data integration for flood scenario assessment.

**What's New:**
- Population affected count shown in summary cards (e.g., "262,993 people")
- Population Impact chart showing distribution across flood depth bins
- Database table `impact.population_stats` with 42 scenarios loaded
- Excel data loader for importing population statistics from `Exposure_Stats/` folder

**Implementation:**
1. Created `impact.population_stats` database table with:
   - Scenario identifiers (climate, maintenance, return period)
   - Total and affected population counts
   - Depth bin breakdown (6 bins: 15-100cm to above5m)

2. Built Excel loader script (`api/load-population-stats.mjs`):
   - Parses 42 Excel files with naming format: `Exposure_Consolidated_T3_{rp}yrs_{Climate}_{Maintenance}.xlsx`
   - Extracts population data from row 12 of each file
   - Loads into database with ON CONFLICT UPDATE for easy reloading

3. Enhanced API (`api/impact-summary.mjs`):
   - LEFT JOIN with `impact.population_stats` table
   - Returns `populationImpact` object with depth bin distribution

4. Updated UI (`DetailedBreakdownView.tsx`):
   - 4 summary cards: Population, Infrastructure, Ag/Buildings, Severity
   - Population Impact depth distribution chart
   - Shows actual population count instead of percentage

**Data Management:**
```bash
# Reload population data from Excel files
node api/load-population-stats.mjs

# Verify in database
psql -h 10.0.0.205 -U postgres -d postgres \
  -c "SELECT COUNT(*) FROM impact.population_stats;"
# Expected: 42 scenarios
```

## Known Issues

- **WSL Symlink Issues:** On WSL, use `npm install --no-bin-links` to avoid EPERM errors

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is proprietary and confidential.

## Contact

For questions or feedback, please contact the project maintainers.

---

**Note:** This application requires a running GeoServer instance with properly configured flood risk data layers. Ensure your GeoServer workspace matches the configuration in `src/config/layers.ts`.
