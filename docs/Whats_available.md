# Flood Risk Assessment System - Technical Specification

**Purpose:** This document provides a complete technical specification of the Flood Risk Assessment System for Sindh Province, Pakistan. It is designed to enable AI systems to understand the data structures, methodologies, and relationships within the platform.

**Last Updated:** 2026-04-24

---

## 1. System Overview

### 1.1 Geographic Scope

- **Province:** Sindh, Pakistan
- **Study Area:** 7 Districts in the Indus River Basin
  - Active Districts: Dadu, Jacobabad, Jamshoro, Kashmore, Larkana, Qambar Shahdadkot, Shikarpur
  - Excluded Districts: Naushahro Feroze, Shaheed Benazirabad (removed from analysis)
- **Coordinate Reference System:** UTM Zone 42N (EPSG:32642)
- **Area of Interest (AOI):** Bounding box [309082.5, 2853827.75, 569587.5, 3306262.25] in UTM coordinates

### 1.2 Core Capabilities

The system provides three analytical modules:

1. **Hazard Assessment** - Flood scenario modeling with depth, velocity, duration, and V×h parameters
2. **Impact Assessment** - Exposure analysis across 9 asset types with population impact
3. **Risk Assessment** - Economic damage and Expected Annual Damage (EAD) calculations

---

## 2. Hazard Data

### 2.1 Flood Scenarios

The system models flood hazard across **42 scenarios** defined by three dimensions:

| Dimension | Values | Count |
|-----------|--------|-------|
| **Return Period** | 2.3, 5, 10, 25, 50, 100, 500 years | 7 |
| **Climate** | Present, Future | 2 |
| **Maintenance** | Breaches, Reduced Capacity, Perfect | 3 |

**Total Scenarios:** 7 × 2 × 3 = 42

### 2.2 Hazard Parameters

Each scenario produces four raster layers (GeoServer WMS):

1. **maxdepth** - Maximum flood depth (meters)
2. **maxvelocity** - Maximum flood velocity (m/s)
3. **duration** - Flood duration (hours)
4. **vh** - Velocity × Depth product (m²/s)

**Layer Naming Convention:**
```
t3_{rp}yrs_{climate}_{maintenance}_{parameter}
Examples:
  t3_25yrs_present_breaches_maxdepth
  t3_100yrs_future_perfect_maxvelocity
```

### 2.3 Actual Event Data

- **Flood 2022** - Historical flood event with 4 parameter layers
- Serves as validation/benchmark for modeled scenarios

### 2.4 Supporting Layers

| Layer | Type | Workspace | Purpose |
|-------|------|-----------|---------|
| AOI (Area of Interest) | Polygon | DEM | Study boundary |
| Sindh Province | Polygon | results | Provincial extent |
| Sub-Catchments | Polygon | DEM | Hydrological boundaries |
| Stream Network | Line | DEM | River network |
| HDTM (Hillshaded Relief) | Raster | DEM | Terrain visualization |

---

## 3. Exposure Data

### 3.1 Exposure Layers (9 Types)

| Layer Type | Geometry | Description | Total Count Source |
|------------|----------|-------------|-------------------|
| **BHU** | Point | Basic Health Units | Feature count |
| **Buildings** | Point | Building footprints | Feature count |
| **Built_up_Area** | Polygon | Urban built-up areas | Area (m²) via ST_Area() |
| **Cropped_Area** | Polygon | Agricultural land | Area (m²) via ST_Area() |
| **Electric_Grid** | Line | Power transmission lines | Length (m) via ST_Length() |
| **Railways** | Line | Railway network | Feature count |
| **Roads** | Line | Road network | Feature count |
| **Settlements** | Polygon | Human settlements | Feature count |
| **Telecom_Towers** | Point | Communication towers | Feature count |

### 3.2 Exposure Database Schema

**Source Schema:** `Exposure_InputData`

Each exposure type has a corresponding table with:
- `geom` - PostGIS geometry column
- `depth_bin` - Flood depth classification (in impacted schemas)

### 3.3 Impacted Schemas

For each of the 42 scenarios, there is a corresponding database schema:

**Schema Naming:**
```
T3_{rp}yrs_{Climate}_{Maintenance}_Impacted
Examples:
  T3_25yrs_Present_Breaches_Impacted
  T3_100yrs_Future_Perfect_Impacted
```

**Schema Contents:** Each schema contains tables for all 9 exposure types with the `depth_bin` column added.

### 3.4 Depth Bins

Flood impact is classified into 6 depth bins:

| Range | Min Depth | Max Depth | Color |
|-------|-----------|-----------|-------|
| 15-100cm | 0.15m | 1.0m | Light Green (#90EE90) |
| 1-2m | 1.0m | 2.0m | Gold (#FFD700) |
| 2-3m | 2.0m | 3.0m | Orange (#FFA500) |
| 3-4m | 3.0m | 4.0m | Tomato Red (#FF6347) |
| 4-5m | 4.0m | 5.0m | Crimson (#DC143C) |
| above5m | 5.0m | ∞ | Dark Red (#8B0000) |

---

## 4. Impact Results

### 4.1 Impact Summary Data Structure

Each scenario produces an impact summary with the following structure:

```typescript
ScenarioImpactSummary {
  scenarioId: string;           // e.g., "T3_25yrs_Present_Breaches_Impacted"
  climate: "present" | "future";
  maintenance: "breaches" | "redcapacity" | "perfect";
  returnPeriod: string;         // "2.3", "5", "10", "25", "50", "100", "500"
  totalAffectedExposures: number; // Count of exposure types with any impact (0-8)
  severity: "low" | "medium" | "high" | "extreme";
  impacts: {
    [exposureType]: ExposureImpact | null
  };
  populationImpact?: PopulationImpact | null;
}
```

### 4.2 Exposure Impact Structure

```typescript
ExposureImpact {
  layerType: ExposureLayerType;
  totalFeatures: number;        // Total from Exposure_InputData (count/length/area)
  affectedFeatures: number;     // Features with depth > threshold
  maxDepthBin: string;          // Maximum flood depth bin observed
  depthBins: DepthBin[];        // Distribution across 6 depth bins
  geoserverLayer: string;       // GeoServer layer name
  workspace: "exposures";
  geometryType: "point" | "line" | "polygon";
}
```

### 4.3 Severity Classification

Based on the number of affected exposure types (out of 8):

| Severity | Affected Exposures | Color |
|----------|-------------------|-------|
| Low | 0-2 | Light Green (#90EE90) |
| Medium | 3-5 | Gold (#FFD700) |
| High | 6-7 | Tomato Red (#FF6347) |
| Extreme | 8 | Dark Red (#8B0000) |

### 4.4 Population Impact

**Source Table:** `impact.population_stats`

```typescript
PopulationImpact {
  totalPopulation: number;      // Total population in study area
  affectedPopulation: number;   // Population affected by flooding
  affectedPercentage: number;   // (affected / total) × 100
  depthBins: PopulationDepthBin[];
}
```

**Depth Bin Distribution:**
- Population count for each of the 6 depth bins
- Percentage of affected population in each bin

### 4.5 Impact API Endpoint

**Endpoint:** `GET /api/impact/summary`

**Query Parameters:**
- `climate` (required): "present" | "future"
- `maintenance` (optional): "breaches" | "redcapacity" | "perfect" | "all"
- `returnPeriod` (optional): "2.3" | "5" | "10" | "25" | "50" | "100" | "500"

**Response:**
```json
{
  "success": true,
  "data": {
    "climate": "present",
    "summaries": [ScenarioImpactSummary],
    "metadata": {
      "lastUpdated": "2026-04-24T...",
      "totalScenarios": 21,
      "cached": true
    }
  }
}
```

### 4.6 Materialized View

**View Name:** `impact_summary_matview`

Pre-aggregates impact statistics for performance. Includes:
- Climate, maintenance, return period
- Exposure type
- Total and affected feature counts
- Maximum depth bin
- Depth bin distribution (6 bins)

Refreshed via: `POST /api/impact/refresh`

---

## 5. Risk and Vulnerability

### 5.1 Risk Analysis Modes

The system provides three risk modes:

| Mode | Description | Unit |
|------|-------------|------|
| **Exp** | Exposure - Area/extent of assets at risk | ha (hectares) / sqm |
| **Vul** | Vulnerability - Area susceptible to damage | ha / sqm |
| **Dmg** | Economic Damage - Monetary loss valuation | USD |

### 5.2 Asset Types

**Two primary asset categories:**

1. **Agriculture (crop)**
   - Unit: hectares (ha)
   - Damage: Crop loss valuation

2. **Buildings** - Three sub-types:
   - `buildLow56` - Kacha (low-rise, vulnerable)
   - `buildLow44` - Pakka (medium-rise)
   - `buildHigh` - High-rise (least vulnerable)
   - Unit: square meters (sqm)
   - Damage: Structural damage valuation

### 5.3 Risk Data Structure

```typescript
RegionRiskData {
  crop: number;        // Agriculture damage/area
  buildLow56: number;  // Kacha buildings damage/area
  buildLow44: number;  // Pakka buildings damage/area
  buildHigh: number;   // High-rise buildings damage/area
}
```

### 5.4 Risk Data File

**Location:** `public/data/risk.json`

**Generated from:** 42 Excel files in `risk/` directory

**File Naming:**
```
Risk_Analysis_T3_{rp}yrs_{Climate}_{Maintenance}.xlsx
Example: Risk_Analysis_T3_25yrs_Present_Breaches.xlsx
```

**Build Command:**
```bash
node scripts/build-risk-json.js
```

**Data Structure:**
```json
{
  "generated": "2026-04-24T...",
  "scenarios": {
    "25_present_perfect": {
      "returnPeriod": 25,
      "climate": "present",
      "maintenance": "perfect"
    }
  },
  "data": {
    "25_present_perfect": {
      "Dadu": { "Exp": {...}, "Vul": {...}, "Dmg": {...} },
      "TOTAL": { "Exp": {...}, "Vul": {...}, "Dmg": {...} }
    }
  },
  "districts": ["Dadu", "Jacobabad", ...]
}
```

### 5.5 Expected Annual Damage (EAD)

**Method:** Trapezoidal integration across return periods

**Formula:**
```
EAD = Σ 0.5 × (Dᵢ + Dᵢ₊₁) × |1/RPᵢ - 1/RPᵢ₊₁|

Where:
  Dᵢ = Damage at return period RPᵢ
  RP = Return period in years (2.3, 5, 10, 25, 50, 100, 500)
```

**EAD Result Structure:**
```typescript
EadResult {
  climate: "present" | "future";
  maintenance: "breaches" | "redcapacity" | "perfect";
  region: string;              // District name
  ead: {
    crop: number;              // Agriculture EAD
    buildLow56: number;        // Kacha EAD
    buildLow44: number;        // Pakka EAD
    buildHigh: number;         // High-rise EAD
  };
  eadTotal: number;            // Sum of all asset EAD
}
```

**Total EAD Combinations:** 2 climates × 3 maintenance × 8 regions (7 districts + TOTAL) = 48 EAD results

### 5.6 Risk Dashboard Views

1. **Summary Heatmap** - 7×3 matrix showing risk values by return period and maintenance
2. **District Breakdown** - Per-district risk comparison with charts
3. **Spatial** - Choropleth map of district-level risk
4. **EAD** - Expected Annual Damage with trapezoidal integration

### 5.7 Risk Color Scale

Sequential yellow-to-red scale for risk values:
```
#ffffcc (very low) → #ffeda0 → #fed976 → #feb24c →
#fd8d3c → #fc4e2a → #e31a1c (extreme)
```

---

## 6. Data Pipeline

### 6.1 Hazard Data Flow

```
Hydrological Modeling (HEC-RAS/SOBEK)
    ↓
Flood Scenario Results (Depth, Velocity, Duration, V×h)
    ↓
GeoServer Import (results workspace)
    ↓
WMS Service → OpenLayers Map Viewer
```

### 6.2 Exposure Data Flow

```
Exposure Input Data (Shapefiles/GeoPackage)
    ↓
PostgreSQL/PostGIS (Exposure_InputData schema)
    ↓
Spatial Overlay with Hazard Layers
    ↓
Depth Bin Assignment
    ↓
Impacted Schemas (42 schemas)
    ↓
Materialized View (impact_summary_matview)
    ↓
API Endpoint → Frontend
```

### 6.3 Risk Data Flow

```
Excel Risk Analysis Files (42 files)
    ↓
build-risk-json.js (Node.js script)
    ↓
public/data/risk.json
    ↓
Frontend (useRiskData, useEadData hooks)
    ↓
Risk Dashboard Components
```

### 6.4 Population Data Flow

```
Excel Files (risk/ folder)
    ↓
load-population-stats.mjs (loader script)
    ↓
impact.population_stats table
    ↓
LEFT JOIN in impact-summary.mjs
    ↓
API Response → Population Impact Charts
```

---

## 7. Database Schema Summary

### 7.1 Key Schemas

| Schema | Purpose |
|--------|---------|
| `public` | System tables |
| `Exposure_InputData` | Source exposure layers (9 tables) |
| `T3_*_Impacted` | 42 impacted schemas (one per scenario) |
| `impact` | Impact summary statistics |
| `auth` | Authentication and users |
| `annotations` | User interventions |

### 7.2 Key Tables

**impact.population_stats:**
- Stores population impact per scenario
- Columns: climate, maintenance, return_period, total_population, affected_population, depth bins

**impact_summary_matview:**
- Materialized view aggregating all impact statistics
- Auto-joined with population_stats via API

---

## 8. GeoServer Configuration

### 8.1 Workspaces

| Workspace | Purpose | Layer Count |
|-----------|---------|-------------|
| `results` | Hazard layers, survey, structures | 120+ |
| `DEM` | Terrain, boundaries, hydrography | 10+ |
| `exposures` | Impact exposure layers (378 layers) | 378 |

**Exposures Layer Calculation:**
9 exposure types × 42 scenarios = 378 layers

### 8.2 Layer Styling

**Impact Layers (exposures workspace):**
- Point layers: 8px circles, depth-colored
- Line layers: 3px strokes, depth-colored
- Polygon layers: 80% opacity fills, depth-colored

**Style Names:**
- `impact_depth_point` - BHU, Telecom_Towers, Settlements
- `impact_depth_line` - Electric_Grid, Railways, Roads
- `impact_depth_polygon` - Buildings, Built_up_Area, Cropped_Area

---

## 9. Frontend Data Structures

### 9.1 Core Types

**Location:** `src/types/`

| File | Types Defined |
|------|---------------|
| `impact.ts` | ExposureLayerType, DepthBin, PopulationImpact, ScenarioImpactSummary |
| `risk.ts` | RiskMode, RegionRiskData, EadResult, AssetSubKey |
| `layers.ts` | LayerInfo, LayerGroup, GeometryType |

### 9.2 Data Fetching Hooks

| Hook | Purpose | Source |
|------|---------|--------|
| `useImpactData` | Fetch impact summaries | `/api/impact/summary` |
| `useRiskData` | Load risk JSON | `public/data/risk.json` |
| `useEadData` | Compute EAD values | Client-side calculation |
| `useAnnotations` | CRUD interventions | `/api/annotations` |

---

## 10. Key Calculations

### 10.1 Severity Calculation

```typescript
function calculateSeverity(affectedCount: number): SeverityLevel {
  if (affectedCount <= 2) return 'low';
  if (affectedCount <= 5) return 'medium';
  if (affectedCount <= 7) return 'high';
  return 'extreme';
}
```

### 10.2 Depth Bin Classification

```typescript
function getDepthBinRange(depth: number): DepthBinRange {
  if (depth < 1.0) return '15-100cm';
  if (depth < 2.0) return '1-2m';
  if (depth < 3.0) return '2-3m';
  if (depth < 4.0) return '3-4m';
  if (depth < 5.0) return '4-5m';
  return 'above5m';
}
```

### 10.3 EAD Calculation

```typescript
function calculateEad(damages: { returnPeriod: number; damage: number }[]): number {
  if (damages.length < 2) return 0;
  let ead = 0;
  for (let i = 0; i < damages.length - 1; i++) {
    const freqLeft = 1 / damages[i].returnPeriod;
    const freqRight = 1 / damages[i + 1].returnPeriod;
    ead += 0.5 * (damages[i].damage + damages[i + 1].damage) * Math.abs(freqLeft - freqRight);
  }
  return ead;
}
```

### 10.4 Geometry-Specific Totals

**Point Features:** `COUNT(*)`
**Line Features:** `SUM(ST_Length(geom))` - in meters
**Polygon Features:** `SUM(ST_Area(geom))` - in square meters

---

## 11. API Endpoints Reference

### 11.1 Impact Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/impact/summary` | Get impact summaries |
| POST | `/api/impact/refresh` | Refresh materialized view |

### 11.2 Cache Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/cache/stats` | Get cache statistics |
| POST | `/api/cache/clear` | Clear all cache |
| POST | `/api/cache/invalidate` | Invalidate specific entry |

### 11.3 Utility Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/health` | Health check with DB status |

---

## 12. Constants and Enumerations

### 12.1 Return Periods

```typescript
const RETURN_PERIODS = [2.3, 5, 10, 25, 50, 100, 500];
```

### 12.2 Maintenance Levels

```typescript
const MAINTENANCE_LEVELS = ['perfect', 'breaches', 'redcapacity'];
const MAINTENANCE_LABELS = {
  perfect: 'Perfect',
  breaches: 'Flood 2022 (Breaches)',
  redcapacity: 'Reduced Capacity'
};
```

### 12.3 Climate Scenarios

```typescript
const CLIMATE_SCENARIOS = ['present', 'future'];
const CLIMATE_LABELS = {
  present: 'Present Climate',
  future: 'Future Climate'
};
```

### 12.4 Districts (7 Active)

```typescript
const DISTRICTS = [
  'Dadu',
  'Jacobabad',
  'Jamshoro',
  'Kashmore',
  'Larkana',
  'Qambar Shahdadkot',
  'Shikarpur'
];
```

---

## 13. Performance Considerations

### 13.1 Caching Strategy

- **TTL:** 5 minutes (configurable via `CACHE_TTL` env var)
- **Scope:** Impact summary responses (no depth threshold filter)
- **Invalidation:** Manual via `/api/cache/clear` or `/api/cache/invalidate`

### 13.2 Database Optimization

- **Materialized View:** Pre-aggregated impact statistics
- **Indexes:** On climate, maintenance, return_period columns
- **Geometry Calculations:** Cached for Electric_Grid, Built_up_Area, Cropped_Area

### 13.3 Client-Side Optimization

- **Static Risk JSON:** Loaded once, cached in browser
- **EAD Calculation:** Client-side computation (no server round-trip)
- **Dynamic TOTAL:** Calculated from active districts (not pre-computed)

---

## 14. Data Update Procedures

### 14.1 Updating Risk Data

```bash
# 1. Update Excel files in risk/ folder
# 2. Run build script
node scripts/build-risk-json.js

# 3. Verify output
cat public/data/risk.json

# 4. Manually remove excluded districts from GeoJSON
# Edit public/data/districts.geojson and remove:
#   - Naushahro Feroze
#   - Shaheed Benazirabad
```

### 14.2 Updating Population Data

```bash
# Run loader script
node api/load-population-stats.mjs

# Verify database
psql -h 10.0.0.205 -U postgres -d postgres \
  -c "SELECT * FROM impact.population_stats LIMIT 5;"
```

### 14.3 Refreshing Impact Summary

```bash
# Via API
curl -X POST http://localhost:3001/api/impact/refresh

# Or clear cache to force refresh
curl -X POST http://localhost:3001/api/cache/clear
```

---

## 15. Important Notes

### 15.1 Excluded Data

- **Interventions** - User-drawn annotations (separate module)
- **2 Districts** - Naushahro Feroze and Shaheed Benazirabad excluded from Risk Dashboard
- **Compare Tab** - Hidden in Impact Matrix (code preserved but UI disabled)

### 15.2 Known Workarounds

- **GeoServer 2.3yrs → 23yrs:** Decimal points in layer names cause REST API issues
- **Zonal Layer Percentages:** Calculated via ST_Area() for accuracy, not feature counts
- **Dynamic TOTAL:** Risk Dashboard sums 7 active districts, not pre-computed

### 15.3 Data Validation

- **Electric_Grid:** Length in meters (total: ~4.3M meters)
- **Built_up_Area:** Area in square meters
- **Cropped_Area:** Area in square meters
- **Point Layers:** Feature counts only

---

## 16. File Locations Reference

| Component | Location |
|-----------|----------|
| Impact Types | `src/types/impact.ts` |
| Risk Types | `src/types/risk.ts` |
| Layer Config | `src/config/layers.ts` |
| Impact API | `api/impact-summary.mjs` |
| Risk Build Script | `scripts/build-risk-json.js` |
| Risk Data | `public/data/risk.json` |
| Districts GeoJSON | `public/data/diskricts.geojson` |
| Population Loader | `api/load-population-stats.mjs` |
| Migration Files | `api/migrations/*.sql` |

---

## 17. Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Maps | OpenLayers, proj4 |
| Backend API | Node.js, Express |
| Database | PostgreSQL 15, PostGIS 3.3 |
| GeoServer | 2.23.x |
| OGC Services | WMS 1.1.1 |
| Authentication | JWT (bcrypt) |

---

**End of Specification**
