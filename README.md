# Flood Risk Assessment - Indus River

A web-based interactive flood risk assessment tool for the Indus River region in Sindh Province, Pakistan. Built with React 19, TypeScript, Vite, Tailwind CSS, and OpenLayers.

![Flood Risk Assessment](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?logo=vite)
![OpenLayers](https://img.shields.io/badge/OpenLayers-Latest-1F6F75)

## Key Features

### Core Features
- **Interactive Map Viewer** - OpenLayers-based map with multiple base map options
- **GeoServer Integration** - WMS services for flood scenario layers
- **Layer Management** - Hierarchical layer tree with visibility/opacity controls
- **Three-Panel Interface** - "Hazard", "Impact", and "Interventions" tabs
- **Feature Identification** - Click on any layer to view attributes via WMS GetFeatureInfo
- **Coordinate Display** - Real-time mouse position in UTM (Zone 42N) and Lat/Lon
- **Swipe Compare Tool** - Side-by-side comparison of two flood scenarios
- **Interventions** - Collaborative drawing and annotation on the map:
  - Draw points, lines, and polygons
  - Add details (title, description, category)
  - Edit, delete, search, filter interventions
  - Toggle visibility, export as GeoJSON
  - **JWT-based authentication** required for drawing/editing
  - **Role-based access control**: Admin users can manage all interventions, regular users can only manage their own
- **Mobile Responsive** - Adaptive UI with sidebar toggle
- **Stream Network** - HydroSHEDS-derived stream network visualization

### Impact Matrix Module
- **Real-time Impact Analysis** - Comprehensive flood impact assessment across 42 scenarios per climate
- **Population Impact Statistics** - Affected population counts by depth bin
- **4 Summary Cards**: Population Affected, Infrastructure Impact, Agriculture & Buildings, Overall Risk Severity
- **9 Exposure Layers**: BHU, Buildings, Built-up Area, Cropped Area, Electric Grid, Railways, Roads, Settlements, Telecom Towers
- **Dynamic Statistics** - All counts/percentages computed from database (no hardcoded values)
- **Depth Distribution Charts** - Visual breakdown by depth bin percentages
- **Area-Based Analysis** - Zonal layers use actual geometric area calculations
- **Compare View** - Side-by-side Present vs Future climate comparison with insightful charts

## Tech Stack
- **Frontend**: React 19 with TypeScript, Vite 7.3, Tailwind CSS 3.x
- **Map Library**: OpenLayers (UTM Zone 42N - EPSG:32642)
- **UI Components**: shadcn/ui (Radix UI)
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
│   │   ├── map/                  # OpenLayers map viewer
│   │   ├── popups/               # Feature info popups
│   │   ├── scenario-explorer/    # Scenario comparison matrix
│   │   ├── swipe/                # Swipe compare component
│   │   └── ui/                   # shadcn/ui components
│   ├── config/                   # Configuration files
│   ├── lib/                      # Utility functions
│   └── types/                    # TypeScript type definitions
├── api/                          # Backend API
│   ├── impact-summary.mjs        # Impact API server with caching
│   ├── auth.mjs                  # JWT authentication module
│   ├── annotations.mjs           # Interventions CRUD API
│   ├── db.mjs                    # Database connection pool
│   ├── seed-user.mjs             # CLI user management tool
│   └── migrations/               # Database migration scripts
│       └── create_users.sql      # Auth users table schema
├── tools/
│   └── geoserver/                # GeoServer management scripts
├── dist/                         # Production build output
├── CLAUDE.md                     # Project-specific Claude instructions
└── README.md                     # This file
```

## Installation & Setup

### Prerequisites
- Node.js (v18 or higher) - [Download](https://nodejs.org/)
- npm (comes with Node.js)
- GeoServer instance with flood risk data configured

### Installation
```bash
# 1. Clone the repository
git clone https://github.com/urabbani/floodrisk_sferp.git
cd floodrisk_sferp

# 2. Install dependencies
npm install
# Note: On WSL (Windows Subsystem for Linux), use `npm install --no-bin-links` to avoid symlink issues.

# 3. Configure GeoServer
# Edit src/config/layers.ts to match your GeoServer setup:
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

### Building for Production
```bash
npm run build  # Creates optimized production build in dist/
npm run preview  # Preview production build locally
```

## Deployment
The application is deployed at: https://portal.srpsid-dss.gos.pk

See docs/DEPLOYMENT.md for detailed deployment instructions including:
- Apache configuration with HTTPS
- GeoServer proxy setup
- Backend API deployment as systemd service
- Database setup for population statistics
- Standard deployment workflow (local → GitHub → production)

## Credits
Developed and maintained by Dr. Umair Rabbani
Built with Claude Code using Anthropic's Claude Sonnet 4.6