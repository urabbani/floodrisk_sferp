# Gemini CLI Project Context: Flood Risk Assessment Application

This project is a React-based interactive flood risk assessment platform designed to visualize and analyze flood scenarios, survey data, and high-resolution terrain models (HDTM).

## Project Overview

- **Purpose**: Interactive mapping and analysis of flood risk scenarios for the Sindh Province (UTM zone 42N).
- **Key Features**:
  - **Map Viewer**: Interactive map using OpenLayers to display WMS layers from GeoServer.
  - **Layer Tree**: Hierarchical management of flood scenario layers (depth, velocity, duration, V×h), survey points, and infrastructure (canals, drains).
  - **Scenario Matrix**: Comparison and visualization of different climate (Present/Future) and maintenance (Breaches, Reduced Capacity, Perfect) scenarios.
  - **Terrain Visualization**: HDTM (High-resolution Digital Terrain Model) tile management.
  - **Legend Panel**: Dynamic legend graphics for active layers.

## Tech Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vite.dev/).
- **Mapping**: [OpenLayers (ol)](https://openlayers.org/), [proj4](https://github.com/proj4js/proj4js).
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/).
- **Data Visualization**: [Recharts](https://recharts.org/).
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/).
- **Linting**: [ESLint](https://eslint.org/).

## Architecture & File Structure

- `src/components/map/`: Core mapping components (`MapViewer.tsx`, `LegendPanel.tsx`).
- `src/components/layer-tree/`: Recursive layer management logic and UI.
- `src/components/scenario-explorer/`: Components for matrix-based scenario navigation.
- `src/components/ui/`: Reusable UI primitives (shadcn/ui based).
- `src/config/`: Configuration for GeoServer, map projection (EPSG:32642), and the hierarchical `layerTree`.
- `src/types/`: TypeScript definitions for layers, geometry types, and scenario parameters.
- `src/lib/utils.ts`: Utility functions (e.g., tailwind-merge).

## Development Commands

- `npm run dev`: Starts the Vite development server with GeoServer proxy enabled.
- `npm run build`: Compiles TypeScript and builds the project for production.
- `npm run lint`: Executes ESLint for code quality checks.
- `npm run preview`: Serves the production build locally.

## Development Conventions

- **Component Organization**: Follow the established structure in `src/components/`. Use UI primitives from `src/components/ui/`.
- **Typing**: Rigorously use types from `src/types/layers.ts` for any layer-related logic.
- **Map Interaction**: New map features should be integrated into `src/components/map/MapViewer.tsx`.
- **Proxying**: GeoServer requests are proxied via Vite (see `vite.config.ts`) to `http://10.0.0.205:8080/geoserver`.

## External Dependencies

- Requires access to a GeoServer instance at `http://10.0.0.205:8080/geoserver` for map layers to function correctly.
