# Changelog

All notable changes to the Flood Risk Assessment application are documented in this file.

## [Unreleased]

### Added
- In-memory caching for Impact Matrix API (~400x performance improvement)
- Depth threshold filtering (0-5m slider) for impact analysis
- Cache management endpoints (stats, clear, invalidate)
- GeoServer layer management tools in `tools/geoserver/`

### Changed
- GeoServer layer naming: 2.3yrs → 23yrs (decimal workaround)
- Impact Matrix API returns cached metadata
- Improved error handling for database connection pool

### Fixed
- Apache config typo: "Scenario_Reullts" → "Scenario_results"
- Cache population issue with API responses

### Performance
- Cached API requests: ~5ms (down from ~2000ms)
- Database query optimization with materialized views
- Connection pool tuning (max: 10, min: 2, idle timeout: 10s)

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
