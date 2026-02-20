# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Flood Risk Assessment web application** for the Indus River region (Sindh Province, Pakistan). Built with React 19, TypeScript, Vite, Tailwind CSS, and OpenLayers, it visualizes flood scenario data from GeoServer WMS services.

The application allows users to:
- Compare flood scenarios across different climate conditions (Present/Future)
- Analyze different maintenance levels (Breaches, Reduced Capacity, Perfect)
- View multiple parameters: Max Depth, Max Velocity, Duration, V×h
- Explore return periods from 2.3 to 500 years

## Development Commands

```bash
npm run dev      # Start development server (HMR enabled)
npm run build    # TypeScript check + production build
npm run lint     # Run ESLint
npm run preview  # Preview production build locally
```

## Architecture

### Layer System

The entire data layer structure is defined in `src/config/layers.ts`. This file:
- Defines the hierarchical layer tree matching the QGIS project structure
- Contains GeoServer configuration (`GEOSERVER_CONFIG`) - points to `/geoserver` relative path
- Contains map projection settings (`MAP_CONFIG`) - uses UTM Zone 42N (EPSG:32642)
- Generates hundreds of flood scenario layers programmatically via `generateFloodScenarioLayers()`

**Layer naming convention:** `T3_{returnPeriod}yrs_{scenario}_{maintenance}_{parameter}`
- Example: `T3_25yrs_Present_Perfect_MaxDepth`

**Important:** When adding new layers, update `src/config/layers.ts`. The layer tree structure drives the LayerTree component and scenario selection UI.

### Type System

All layer and scenario types are in `src/types/layers.ts`:
- `LayerInfo` - Individual layer metadata (WMS layer with GeoServer integration)
- `LayerGroup` - Hierarchical groups containing layers or sub-groups
- Type guards: `isLayerGroup()` and `isLayerInfo()`

### Component Structure

- **`src/components/map/`** - OpenLayers map viewer (`MapViewer.tsx`) and legend panel
- **`src/components/layer-tree/`** - Hierarchical layer management UI
- **`src/components/scenario-explorer/`** - Scenario comparison interface (`ScenarioMatrix.tsx`)
- **`src/components/ui/`** - 40+ shadcn/ui components (Button, Card, Dialog, etc.)

### Map Configuration

- **Projection:** EPSG:32642 (WGS 84 / UTM zone 42N)
- **Center:** [439335, 3080045]
- **Extent:** [309082.5, 2853827.75, 569587.5, 3306262.25]
- **Base maps:** Google Satellite, OpenStreetMap, Terrain (configured in `layers.ts`)

## GeoServer Integration

The app integrates with a local GeoServer instance:
- Workspace: `flood_risk`
- Base URL: `/geoserver` (relative path for same-origin)
- WMS Version: 1.1.1
- Legend graphics generated dynamically via GetLegendGraphic requests

When working with GeoServer layers, ensure the `geoserverName` in layer config matches the actual layer name in GeoServer workspace.
