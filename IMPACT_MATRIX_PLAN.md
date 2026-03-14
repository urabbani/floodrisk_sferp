# Flood Impact & Exposure Matrix - Implementation Plan

## Overview
Transform the Scenario Matrix to display flood impact and exposure data for 42 scenarios across 9 exposure categories (BHU, Buildings, Built_up_Area, Cropped_Area, Electric_Grid, Railways, Roads, Settlements, Telecom_Towers).

## Data Structure

### Exposure Layers (9 types)
1. **BHU** (Basic Housing Units) - Point layer
2. **Buildings** - Polygon layer
3. **Built_up_Area** - Polygon layer
4. **Cropped_Area** - Polygon layer (agriculture)
5. **Electric_Grid** - Line/Point layer (infrastructure)
6. **Railways** - Line layer (transport)
7. **Roads** - Line layer (transport)
8. **Settlements** - Polygon layer (populated areas)
9. **Telecom_Towers** - Point layer (infrastructure)

### Depth Bins (depth_bin attribute)
Flood depth classifications (6 categories):
- `0-1m` - Shallow flooding
- `1-2m` - Moderate flooding
- `2-3m` - Deep flooding
- `3-4m` - Very deep flooding
- `4-5m` - Extreme flooding
- `>5m` - Catastrophic flooding

### 42 Scenarios Matrix
```
Climate (2) × Maintenance (3) × Return Periods (7) = 42 scenarios
├─ Present Climate
│  ├─ Breaches (2022)
│  ├─ Reduced Capacity
│  └─ Perfect
│     └─ 7 return periods (2.3, 5, 10, 25, 50, 100, 500 yrs)
└─ Future Climate
   └─ (same structure)
```

---

## Design Proposal: Three-View System

### View 1: Impact Summary Matrix (Heatmap)
**Purpose:** Quick overview of total impact across all scenarios

**Layout:**
```
        | Breaches | RedCap | Perfect |
--------|----------|--------|---------|
2.3yrs  |   45     |   32   |   18    |  ← Total affected exposure types
5yrs    |   67     |   48   |   29    |
10yrs   |   89     |   65   |   41    |
25yrs   |  123     |   92   |   61    |
50yrs   |  156     |  118   |   78    |
100yrs  |  201     |  152   |  101   |
500yrs  |  289     |  218   |  145    |
```

**Features:**
- Color-coded cells (gradient: white → yellow → orange → red)
- Number = count of exposure types with ANY impact
- Click cell → opens View 2 (Detailed Breakdown)
- Climate toggle at top (Present/Future)
- Depth threshold slider (e.g., "Show impacts > 0.5m")

---

### View 2: Detailed Impact Breakdown
**Purpose:** Show which exposure types are affected for a specific scenario

**Layout (when you click a cell from View 1):**
```
Scenario: 25yrs | Present Climate | Breaches
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─ Exposure Type ───┬─ Affected ──┬─ Max Depth ─┬─ Actions ─┐
│ ✓ Buildings       │    1,245    │    2.3m     │  [View]   │
│ ✓ Roads           │     856     │    1.8m     │  [View]   │
│ ✓ BHU             │     623     │    2.1m     │  [View]   │
│ ✓ Settlements     │     412     │    1.9m     │  [View]   │
│ ✗ Cropped_Area    │       -     │     -       │  [View]   │
│ ✗ Telecom_Towers  │       -     │     -       │  [View]   │
│ ✗ Electric_Grid   │       -     │     -       │     -     │
│ ✗ Railways        │       -     │     -       │     -     │
│ ✗ Built_up_Area   │       -     │     -       │     -     │
└───────────────────┴─────────────┴─────────────┴───────────┘

Depth Distribution:
[███░░░░░░] 0-0.5m: 234 features
[███████░░] 0.5-1m: 567 features
[█████████] 1-2m:   892 features
[████░░░░░] 2-3m:   445 features
[██░░░░░░░] >3m:    178 features

[Compare Mode] [Export Report] [Close]
```

**Features:**
- Checkbox per exposure type → toggles layer on map
- Affected count = features with depth > threshold
- Max Depth = maximum depth_bin value in that layer
- [View] button → zooms to extent of affected features
- Depth distribution bar chart
- Color coding by severity (green → yellow → orange → red)

---

### View 3: Comparative Analysis
**Purpose:** Compare multiple scenarios side-by-side

**Layout:**
```
Compare Scenarios
━━━━━━━━━━━━━━━━

Selected: [25yrs Breaches] vs [50yrs Breaches] vs [25yrs RedCap]

┌─ Exposure ─────┬── 25yrs Breaches ──┬── 50yrs Breaches ──┬── 25yrs RedCap ──┐
│ Buildings      │      ████░░ 1,245  │      ██████ 1,567  │      ███░░  982   │
│ Roads          │      ███░░░   856  │      ████░░ 1,124  │      ██░░░░  623  │
│ BHU            │      ██░░░░   623  │      ███░░   891   │      ██░░░░  534  │
│ Settlements    │      ███░░░   412  │      ████░░   578  │      ██░░░░  312  │
│ Cropped_Area   │      ░░░░░░     -  │      █░░░░░    45   │      ░░░░░░    -   │
└────────────────┴────────────────────┴────────────────────┴──────────────────┘

Legend: ░ = 0-100, █ = 100+ (proportional scale)

Depth Comparison (>1m):
┌─ Exposure ─────┬── 25yrs ──┬── 50yrs ──┬── 25yrs RedCap ──┐
│ Buildings      │    823    │   1,145    │      612          │
│ Roads          │    456    │    789     │      234          │
└────────────────┴───────────┴───────────┴───────────────────┘
```

**Features:**
- Add up to 4 scenarios to compare
- Bar charts for visual comparison
- Filter by depth threshold
- Export comparison table as CSV

---

## Technical Implementation

### 1. Data Types Definition

```typescript
// src/types/impact.ts

export type ExposureLayerType =
  | 'BHU'
  | 'Buildings'
  | 'Built_up_Area'
  | 'Cropped_Area'
  | 'Electric_Grid'
  | 'Railways'
  | 'Roads'
  | 'Settlements'
  | 'Telecom_Towers';

export type DepthBinRange = '0-1m' | '1-2m' | '2-3m' | '3-4m' | '4-5m' | '5m+';

export interface DepthBin {
  range: DepthBinRange;
  minDepth: number;
  maxDepth: number;
  count: number;  // Number of features in this depth range
  percentage: number;
}

export const DEPTH_BINS: DepthBinRange[] = ['0-1m', '1-2m', '2-3m', '3-4m', '4-5m', '5m+'];

export const DEPTH_BIN_COLORS: Record<DepthBinRange, string> = {
  '0-1m': '#90EE90',
  '1-2m': '#FFD700',
  '2-3m': '#FFA500',
  '3-4m': '#FF6347',
  '4-5m': '#DC143C',
  '5m+': '#8B0000',
};

export interface ExposureImpact {
  layerType: ExposureLayerType;
  totalFeatures: number;
  affectedFeatures: number;  // Features with depth > threshold
  maxDepth: number;
  depthBins: DepthBin[];
  geoserverLayer: string;    // Layer name for WMS
  workspace: string;
}

export interface ScenarioImpactSummary {
  scenarioId: string;        // e.g., 't3_25yrs_present_breaches'
  climate: 'present' | 'future';
  maintenance: 'breaches' | 'redcapacity' | 'perfect';
  returnPeriod: string;
  totalAffectedExposures: number;  // Count of exposure types with any impact
  severity: 'low' | 'medium' | 'high' | 'extreme';
  impacts: Record<ExposureLayerType, ExposureImpact>;
}

export interface ImpactMatrixData {
  climate: 'present' | 'future';
  summaries: ScenarioImpactSummary[];
}
```

### 2. GeoServer Layer Naming Convention

```typescript
// Impact layers follow pattern:
// t3_{returnPeriod}_{climate}_{maintenance}_{exposureType}
// Examples:
// - t3_25yrs_present_breaches_Buildings
// - t3_50yrs_future_redcapacity_Roads
// - t3_100yrs_present_perfect_BHU

function buildImpactLayerName(
  returnPeriod: string,
  climate: string,
  maintenance: string,
  exposureType: ExposureLayerType
): string {
  return `t3_${returnPeriod}yrs_${climate}_${maintenance}_${exposureType}`;
}
```

### 3. Component Structure

```
src/components/impact-matrix/
├── index.ts                          # Exports
├── ImpactMatrix.tsx                  # Main container (3 views)
├── views/
│   ├── SummaryHeatmapView.tsx        # View 1: Heatmap matrix
│   ├── DetailedBreakdownView.tsx     # View 2: Single scenario details
│   ├── ComparativeAnalysisView.tsx   # View 3: Multi-scenario compare
│   └── ImpactMatrixControls.tsx      # Shared controls (climate, depth slider)
├── components/
│   ├── ImpactCell.tsx                # Heatmap cell component
│   ├── ExposureRow.tsx                # Exposure type row in detailed view
│   ├── DepthDistributionChart.tsx    # Bar chart for depth bins
│   └── ComparisonBar.tsx              # Bar chart for comparisons
└── hooks/
    ├── useImpactData.ts              # Fetch impact data from PostGIS/GeoServer
    └── useImpactLayerToggle.ts       # Handle layer visibility
```

### 4. Data Fetching Strategy

#### PostGIS API Endpoint (Recommended - Selected Approach)

Impact layers are already published in GeoServer. We'll create a dedicated PostGIS API endpoint for performance.

```typescript
// Backend endpoint: /api/impact/summary
// Query parameters: climate, maintenance (optional), returnPeriod (optional)

interface ImpactSummaryQuery {
  climate: 'present' | 'future';
  maintenance?: 'breaches' | 'redcapacity' | 'perfect' | 'all';
  returnPeriod?: string;
  depthThreshold?: number;  // Default: 0 (show all)
}

async function fetchImpactSummary(params: ImpactSummaryQuery): Promise<ImpactMatrixData> {
  const queryParams = new URLSearchParams({
    climate: params.climate,
    ...(params.maintenance && { maintenance: params.maintenance }),
    ...(params.returnPeriod && { returnPeriod: params.returnPeriod }),
    ...(params.depthThreshold && { depthThreshold: String(params.depthThreshold) }),
  });

  const response = await fetch(`/api/impact/summary?${queryParams}`);
  return response.json();
}
```

**SQL Query on Backend:**
```sql
-- PostGIS query to aggregate impact statistics
SELECT
  return_period,
  maintenance,
  exposure_type,
  COUNT(*) as total_features,
  COUNT(CASE WHEN depth_bin > :depthThreshold THEN 1 END) as affected_features,
  MAX(depth_bin) as max_depth,
  -- Depth bin distribution (6 categories)
  COUNT(CASE WHEN depth_bin >= 0 AND depth_bin < 1 THEN 1 END) as bin_0_1,
  COUNT(CASE WHEN depth_bin >= 1 AND depth_bin < 2 THEN 1 END) as bin_1_2,
  COUNT(CASE WHEN depth_bin >= 2 AND depth_bin < 3 THEN 1 END) as bin_2_3,
  COUNT(CASE WHEN depth_bin >= 3 AND depth_bin < 4 THEN 1 END) as bin_3_4,
  COUNT(CASE WHEN depth_bin >= 4 AND depth_bin < 5 THEN 1 END) as bin_4_5,
  COUNT(CASE WHEN depth_bin >= 5 THEN 1 END) as bin_5_plus
FROM impact_layers
WHERE climate = :climate
  AND (:maintenance = 'all' OR maintenance = :maintenance)
  AND (:returnPeriod IS NULL OR return_period = :returnPeriod)
GROUP BY return_period, maintenance, exposure_type
ORDER BY return_period, maintenance, exposure_type;
```

### 5. Integration with Existing Map

```typescript
// When user clicks exposure type in Detailed Breakdown View:
function handleExposureToggle(exposureType: ExposureLayerType, visible: boolean) {
  const layerName = buildImpactLayerName(
    exposureType,
    selectedClimate,
    selectedMaintenance,
    selectedReturnPeriod
  );

  // Add or remove WMS layer from map
  onLayerToggle(layerName, visible);

  // Apply style to highlight affected features
  if (visible) {
    applyImpactStyle(layerName, depthThreshold);
  }
}

// Apply SLD or CSS style to highlight features by depth_bin
function applyImpactStyle(layerName: string, threshold: number) {
  const layer = map.getLayers().getArray().find(l => l.get('name') === layerName);

  // Set style based on depth_bin
  layer.setStyle((feature) => {
    const depth = feature.get('depth_bin');
    if (depth > threshold) {
      return getImpactStyle(depth);  // Red for severe, orange for moderate
    }
    return null;  // Don't render features below threshold
  });
}
```

---

## UI/UX Enhancements

### 1. Color Coding System
```
Severity Levels (based on affected count):
- Low (1-10):      🟩 Light Green
- Medium (11-50):  🟨 Yellow/Orange
- High (51-100):   🟧 Orange
- Extreme (100+):  🟥 Red

Depth Colors (6 categories):
- 0-1m:     #90EE90 (Light Green)
- 1-2m:     #FFD700 (Gold)
- 2-3m:     #FFA500 (Orange)
- 3-4m:     #FF6347 (Tomato Red)
- 4-5m:     #DC143C (Crimson)
- >5m:      #8B0000 (Dark Red)
```

### 2. Interactive Features
- **Hover over cell** → tooltip with quick summary
- **Click cell** → opens detailed breakdown panel (slide-over or modal)
- **Shift+click** → add to comparison (up to 4 scenarios)
- **Right-click** → context menu (Export, View on Map, Generate Report)

### 3. Responsive Design
- Desktop: 3-column layout (matrix | details | map)
- Tablet: 2-column (matrix | details/map tabs)
- Mobile: Single column with tab navigation

---

## Implementation Phases

### Phase 1: Setup & Data Types (Week 1)
- [ ] Add impact types to `src/types/impact.ts`
- [ ] Configure GeoServer workspace for impact layers
- [ ] Create PostGIS view for impact aggregation
- [ ] Set up API endpoint for impact summaries

### Phase 2: Summary Heatmap View (Week 2)
- [ ] Build `SummaryHeatmapView.tsx`
- [ ] Implement data fetching hook
- [ ] Color-coded cells with severity levels
- [ ] Climate toggle and depth threshold slider
- [ ] Click to open detail view

### Phase 3: Detailed Breakdown View (Week 3)
- [ ] Build `DetailedBreakdownView.tsx`
- [ ] Exposure type list with checkboxes
- [ ] Depth distribution bar chart
- [ ] Layer toggle integration with map
- [ ] Zoom to extent functionality
- [ ] Styling by depth_bin on map

### Phase 4: Comparative Analysis View (Week 4)
- [ ] Build `ComparativeAnalysisView.tsx`
- [ ] Multi-scenario selection
- [ ] Bar chart comparisons
- [ ] Export to CSV functionality

### Phase 5: Polish & Testing (Week 5)
- [ ] Performance optimization (caching, lazy loading)
- [ ] Error handling and loading states
- [ ] Accessibility improvements
- [ ] Documentation
- [ ] User testing and feedback

---

## Success Metrics

1. **Performance:** Impact summary loads in < 2 seconds
2. **Usability:** User can find impact data for any scenario in < 3 clicks
3. **Completeness:** All 42 scenarios × 9 exposure types = 368 data points accessible
4. **Visual Clarity:** Severity is immediately apparent from color coding
5. **Map Integration:** Clicking exposure type instantly shows affected features on map

---

## Open Questions

1. **Data Source:** Are impact layers already published in GeoServer?
2. **Depth Bin Values:** What are the exact depth_bin values/ranges?
3. **Performance:** Should we cache impact summaries in frontend or fetch on demand?
4. **Styling:** Do we need custom SLD styles for impact layers?
5. **Export Format:** What format for impact reports (PDF, Excel, JSON)?
