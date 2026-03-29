# Changelog

All notable changes to the Flood Risk Assessment application are documented in this file.

## [Unreleased]

### Added
- Stream Network layer (HydroSHEDS-derived, DEM:hydrosheds_streamnetwork)
  - Flow accumulation threshold of 500 (values below transparent)
  - Gradient coloring from light blue (small streams) to navy (major rivers)
  - SLD styles provided in `styles/` directory
- SLD styles for stream network with continuous gradient and rule-based options
- Database-backed layers: AOI and SubCatchments from public schema

### Changed
- **BREAKING**: "Annotations" UI renamed to "Interventions" for clarity (internal code paths unchanged)
- **BREAKING**: "Layers" sidebar tab renamed to "Hazard" for better clarity
- AOI layer: results workspace → DEM workspace (database-backed, public.AOI)
- SubCatchments layer: results workspace → DEM workspace (database-backed, public.SubCatchments)
- Updated documentation to reflect new layer architecture and workspace configuration
- Project structure cleanup (removed planning documents)

### Fixed
- Intervention visibility state bug in InterventionPanel component (multiple interventions could not be toggled independently)

### Performance
- N/A

## [1.2.0] - 2026-03-17

### Added
- Complete GeoServer integration with 378 impact layers
- Population impact statistics by depth bin
- Depth distribution charts for all exposure types
- Backend API with PostgreSQL/PostGIS integration
- systemd service for backend API management
- Cache-Control headers for browser caching

### Changed
- Impact Matrix now uses backend API instead of hardcoded data
- Layer naming convention: `{schema}_{layer_type}` (underscore separator)
- Return period 2.3yrs renamed to 23yrs for GeoServer compatibility

### Fixed
- Percentage calculation for geometry-based layers (lines/polygons)
- Multiple layer visibility bug in map viewer
- Connection pool exhaustion issues

## [1.1.0] - 2026-03-16

### Added
- Impact Matrix module with real-time statistics
- Summary Heatmap view (7×3 scenario matrix)
- Detailed Breakdown view with depth distribution
- Population impact charts
- 4 summary cards (Population, Infrastructure, Ag/Buildings, Severity)

### Changed
- GeoServer workspace: `exp_revised` → `exposures`
- Layer structure updated for impact exposure data

### Fixed
- Layer tree visibility toggles
- Feature identification for WMS layers

## [1.0.0] - 2026-03-15

### Added
- Interactive map viewer with OpenLayers
- GeoServer WMS integration
- Layer management with hierarchical tree
- Feature identification via GetFeatureInfo
- Coordinate display (UTM + Lat/Lon)
- Swipe Compare tool for scenario comparison
- Mobile responsive design
- Resizable sidebar panel

### Changed
- Initial production deployment
- Apache configuration with HTTPS
- Base map integration (Google Satellite, OSM, Terrain)

## [0.9.0] - 2026-03-10

### Added
- Initial project structure
- React 19 + TypeScript + Vite setup
- Tailwind CSS + shadcn/ui components
- Basic layer configuration

---

**Version Format:** [Major.Minor.Patch]
- **Major:** Significant feature additions or breaking changes
- **Minor:** New features or enhancements
- **Patch:** Bug fixes, performance improvements, documentation
