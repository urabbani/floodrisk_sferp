# GEMINI.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Flood Risk Assessment - Indus River is a web-based GIS application for visualizing flood scenarios in Sindh Province, Pakistan. It combines OpenLayers mapping with GeoServer WMS services to display flood risk data across different climate conditions, maintenance levels, and return periods.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, OpenLayers, shadcn/ui (Radix UI)

## Development Commands

```bash
# Start development server (includes GeoServer proxy at /geoserver)
npm run dev

# Build for production (TypeScript check + Vite build)
npm run build

# Run ESLint
npm run lint

# Preview production build locally
npm run preview

# WSL workaround (if you encounter EPERM symlink errors)
npm install --no-bin-links
```

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
HDTM (GeoServer layer group in DEM workspace)
```

### Key Components

- **MapViewer** (`src/components/map/MapViewer.tsx`): OpenLayers map instance manager
- **LayerTree** (`src/components/layer-tree/`): Recursive layer visibility controls
- **ScenarioMatrix** (`src/components/scenario-explorer/`): Grid-based scenario comparison view
- **LegendPanel** (`src/components/map/LegendPanel.tsx`): Dynamic legend from GeoServer

### Map Projection

**CRITICAL:** The map uses UTM Zone 42N (EPSG:32642), not Web Mercator. OpenLayers is configured with proj4 for this projection. Center coordinates and extent in `MAP_CONFIG` are in UTM, not lat/lon.

### GeoServer Configuration

- **Workspaces:** `results` (flood scenarios), `DEM` (terrain tiles)
- **WMS Version:** 1.1.1
- **Legend Graphics:** Dynamically generated via `GetLegendGraphic` request
- **Development Proxy:** Vite proxies `/geoserver` → `http://10.0.0.205:8080`

### shadcn/ui Integration

UI components are from shadcn/ui (Radix UI primitives). Components are in `src/components/ui/`. When adding new components, use the shadcn CLI which places them in this directory.

### Path Aliases

`@/*` maps to `src/*` (configured in `vite.config.ts` and `tsconfig.json`)

## Adding New Layers

1. Define in `src/config/layers.ts` using `createRasterLayer()` or `createVectorLayer()`
2. Add to appropriate group in the `layerTree` structure
3. Layer names must match GeoServer layer names exactly

## Mobile Responsiveness

- App uses `use-mobile.ts` hook for responsive behavior
- Sidebar collapses on mobile (overlay pattern)
- Base maps and map controls adapt to screen size

## UI Features

- **Resizable Sidebar:** Layer panel can be resized by dragging the right edge (200px-600px range)
- All groups default to collapsed state except root

## Production Deployment

- **Platform:** Apache on WSL with HTTPS
- **Document Root:** `/var/www/html/floodrisk/` (or configured path)
- **GeoServer Proxy:** Apache proxies `/geoserver` → `http://10.0.0.205:8080/geoserver`
- **Update Workflow:** Build with `npm run build`, then copy `dist/*` to Apache document root

See README.md for detailed Apache configuration and deployment instructions.
