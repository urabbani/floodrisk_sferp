# Flood Risk Assessment - Indus River

A web-based interactive flood risk assessment tool for the Indus River region in Sindh Province, Pakistan. Built with React 19, TypeScript, Vite, Tailwind CSS, and OpenLayers.

![Flood Risk Assessment](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?logo=vite)
![OpenLayers](https://img.shields.io/badge/OpenLayers-Latest-1F6F75)

## Features

- **Interactive Map Viewer** - OpenLayers-based map with multiple base map options (Google Satellite, OpenStreetMap, Terrain)
- **GeoServer Integration** - WMS services for flood scenario layers
- **Scenario Explorer** - Matrix view for comparing flood events across different parameters
- **Layer Management** - Hierarchical layer tree with visibility toggle and opacity control
- **Climate Scenarios** - Compare Present vs Future climate conditions
- **Multiple Parameters** - Max Depth, Max Velocity, Duration, V×h
- **Return Periods** - Analyze flood events from 2.3 to 500 years
- **Maintenance Levels** - Breaches (2022), Reduced Capacity, Perfect conditions

## Screenshots

### Layer Tree View
- Hierarchical organization of flood scenario layers
- Toggle layer visibility and adjust opacity
- Expandable/collapsible groups

### Scenario Matrix View
- Grid-based scenario comparison
- Quick toggle for return periods and maintenance conditions
- Single vs Compare mode

## Tech Stack

- **Frontend Framework:** React 19 with TypeScript
- **Build Tool:** Vite 7.3
- **Styling:** Tailwind CSS 4.x
- **Map Library:** OpenLayers
- **UI Components:** shadcn/ui
- **Map Projection:** UTM Zone 42N (EPSG:32642)

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
     baseUrl: '/geoserver',  // Change if GeoServer is on different host/port
     workspace: 'flood_risk',
     wmsVersion: '1.1.1',
   };
   ```

## Development

Start the development server:
```bash
npm run dev
```

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
│   │   ├── header.tsx     # Application header
│   │   ├── layer-tree/    # Layer tree & scenario matrix
│   │   ├── map/           # Map viewer & legend panel
│   │   ├── scenario-explorer/
│   │   └── ui/            # shadcn/ui components
│   ├── config/
│   │   └── layers.ts      # Layer configuration & GeoServer settings
│   ├── types/
│   │   └── layers.ts      # TypeScript type definitions
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
Flood Scenarios
├── Present Climate
│   ├── Breaches
│   │   ├── Return Periods (2.3, 5, 10, 25, 50, 100, 200, 500 years)
│   │   └── Parameters (MaxDepth, MaxVelocity, Duration, VxH)
│   ├── Reduced Capacity
│   └── Perfect
├── Future Climate
│   └── (same structure)
└── Supporting Layers
    ├── Area of Interest
    ├── Sindh Province
    └── Sub-Catchments
```

**Layer naming convention:** `T3_{returnPeriod}yrs_{scenario}_{maintenance}_{parameter}`
- Example: `T3_25yrs_Present_Perfect_MaxDepth`

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

## Known Issues

- **WSL Symlink Issues:** On WSL, use `npm install --no-bin-links` to avoid EPERM errors
- **Mobile:** Not fully optimized for mobile devices yet

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is proprietary and confidential.

## Contact

For questions or feedback, please contact the project maintainers.

---

**Note:** This application requires a running GeoServer instance with properly configured flood risk data layers. Ensure your GeoServer workspace matches the configuration in `src/config/layers.ts`.
