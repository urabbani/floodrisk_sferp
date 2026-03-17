# Depth Threshold Filtering Feature - Implementation Summary

## Overview
Implemented a depth threshold slider that filters both impact statistics AND map layers in real-time.

## What Was Built

### 1. **Depth Threshold Slider Component**
- **Location:** `src/components/impact-matrix/components/DepthThresholdSlider.tsx`
- **Features:**
  - Range slider: 0m to 5m+ (adjustable in 0.1m increments)
  - Quick preset buttons: All, 0.5m, 1m, 2m, 3m, 5m+
  - Color-coded slider track (blue → yellow → orange → red based on severity)
  - Real-time value display
  - Reset button to return to "Show All"
  - Visual description when filtering is active

### 2. **Depth Filtering Utilities**
- **Location:** `src/lib/depth-filter.ts`
- **Functions:**
  - `filterDepthBinsByThreshold()` - Filter depth bins by threshold
  - `filterPopulationDepthBinsByThreshold()` - Filter population data
  - `recalculateAffectedCount()` - Recalculate affected features count
  - `recalculatePopulationImpact()` - Recalculate population impact
  - `filterScenarioByThreshold()` - Filter entire scenario by threshold
  - `filterScenariosByThreshold()` - Filter multiple scenarios
  - `createCQLFilterForThreshold()` - Generate CQL filter for GeoServer WMS

### 3. **View Integration**

#### Summary Heatmap View
- Added depth threshold slider above the heatmap matrix
- When slider moves:
  - Heatmap cells update to show filtered impact counts
  - Summary statistics (total affected, high/extreme counts) recalculate
  - Cell colors update based on new severity levels

#### Detailed Breakdown View
- Added depth threshold slider below the header
- When slider moves:
  - 4 summary cards update (population, infrastructure, ag/buildings, severity)
  - Population impact chart filters to show only relevant depth bins
  - All 9 exposure layer rows update their affected counts
  - Depth distribution charts filter to show bins >= threshold

### 4. **Map Layer Filtering**
- **Updated `LayerInfo` type** to include `filter?: string` field
- **Updated `MapViewer` component:**
  - Applies CQL filter to WMS layers when creating them
  - Dynamically updates filter on existing layers when threshold changes
  - Filter format: `depth_bin IN ('1-2m', '2-3m', '3-4m', '4-5m', 'above5m')`
- **Updated `ImpactMatrix` component:**
  - Passes CQL filter to impact layers based on depth threshold
  - Recreates layers when filter changes to apply new filter

### 5. **Impact Matrix Integration**
- **Added depth threshold state:** `depthThreshold` (default: 0)
- **Filtered impact data:** `filteredImpactData` computed using depth threshold
- **CQL filter generation:** `cqlFilter` computed from depth threshold
- **Passes to views:** Both views receive `depthThreshold` and `onDepthThresholdChange` props

## How It Works

### Graph/Chart Filtering (Client-Side)
1. User moves the depth threshold slider
2. `onDepthThresholdChange()` updates `depthThreshold` state
3. `filteredImpactData` recalculates using `filterScenariosByThreshold()`
4. Filtering functions:
   - Remove depth bins with min depth < threshold
   - Recalculate affected counts by summing remaining bins
   - Recalculate percentages based on new totals
   - Recalculate severity based on new affected exposure count
5. Views re-render with filtered data
6. Charts show only depth bins >= threshold
7. Summary cards show filtered statistics

### Map Layer Filtering (Server-Side via CQL)
1. User moves the depth threshold slider
2. `cqlFilter` computed from threshold using `createCQLFilterForThreshold()`
3. `ImpactMatrix` passes filter to impact layers via `LayerInfo.filter`
4. `MapViewer` receives updated layers with new filter
5. Existing WMS layers update their source params:
   - `source.updateParams({ CQL_FILTER: filter })`
6. GeoServer applies CQL filter and returns only matching features
7. Map updates to show only features with depth >= threshold

## Filter Behavior

### Threshold: 0m (Show All)
- All depth bins included
- All affected features shown
- No CQL filter applied to map layers
- Statistics reflect total impact

### Threshold: 1.5m
- Only depth bins with min >= 1.5m shown: '2-3m', '3-4m', '4-5m', 'above5m'
- Affected counts reduced to only features in those bins
- Map layers filter: `depth_bin IN ('2-3m', '3-4m', '4-5m', 'above5m')`
- Statistics recalculate based on filtered data

### Threshold: 5m
- Only 'above5m' bin shown
- Only severely flooded features shown
- Map layers filter: `depth_bin = 'above5m'`
- Statistics reflect only catastrophic flooding impacts

## Technical Details

### Depth Bins
- '15-100cm': 0.15m - 1.0m
- '1-2m': 1.0m - 2.0m
- '2-3m': 2.0m - 3.0m
- '3-4m': 3.0m - 4.0m
- '4-5m': 4.0m - 5.0m
- 'above5m': 5.0m+ (no maximum)

### CQL Filter Format
Uses discrete depth bin labels (not numeric values):
```javascript
// Threshold: 1.5m
"CQL_FILTER": "depth_bin IN ('2-3m', '3-4m', '4-5m', 'above5m')"

// Threshold: 0m (no filter)
"CQL_FILTER": undefined
```

This approach matches the database schema where `depth_bin` is a text field.

## User Experience

### Visual Feedback
- Slider color changes from blue (safe) → yellow → orange → red (danger)
- Current value displayed with color-coded badge
- Description text explains what's being filtered
- All charts and statistics update immediately

### Performance
- Client-side filtering is instant (data already loaded)
- Map layer filtering triggers WMS tile refresh
- No API calls needed for statistics (uses pre-loaded data)
- Efficient updates using React memoization

### Reset Functionality
- Click "Reset" button or "All" preset to return to threshold = 0
- Immediately shows all data and removes map filters
- Fast way to return to full view

## Files Modified

### New Files
- `src/components/impact-matrix/components/DepthThresholdSlider.tsx`
- `src/lib/depth-filter.ts`

### Modified Files
- `src/components/impact-matrix/index.ts` - Export new component
- `src/components/impact-matrix/ImpactMatrix.tsx` - Add depth state and filtering
- `src/components/impact-matrix/views/SummaryHeatmapView.tsx` - Add slider, use filtered data
- `src/components/impact-matrix/views/DetailedBreakdownView.tsx` - Add slider, use filtered data
- `src/types/layers.ts` - Add `filter?: string` to LayerInfo
- `src/components/map/MapViewer.tsx` - Apply CQL filters to WMS layers

## Testing Checklist

- [ ] Slider appears in both Summary and Detail views
- [ ] Moving slider updates heatmap cell counts
- [ ] Moving slider updates summary statistics
- [ ] Moving slider updates detail view summary cards
- [ ] Moving slider updates population impact chart
- [ ] Moving slider updates exposure layer affected counts
- [ ] Depth distribution charts filter correctly
- [ ] Reset button returns to threshold = 0
- [ ] Preset buttons work (0.5m, 1m, 2m, 3m, 5m+)
- [ ] Map layers update when slider moves (if layers visible)
- [ ] Console logs show CQL filter being applied
- [ ] No errors in browser console

## Next Steps (Optional Enhancements)

1. **Add depth threshold to URL parameters** - Allow bookmarking filtered views
2. **Add threshold legend** - Show color coding explanation
3. **Add animation** - Smooth transitions when filtering
4. **Add tooltips** - Explain what each threshold means
5. **Add comparison mode** - Compare impacts at different thresholds
6. **Export filtered data** - CSV/PDF with current filter applied

## Example Usage

```typescript
// In any component
import { DepthThresholdSlider } from '@/components/impact-matrix';

<DepthThresholdSlider
  value={depthThreshold}
  onChange={setDepthThreshold}
  min={0}
  max={5}
  step={0.1}
/>
```

## Performance Notes

- Filtering is done client-side on already-loaded data
- No additional API calls when slider moves
- Map tiles refresh only when layers are visible
- React.memo prevents unnecessary re-renders
- Efficient depth bin filtering using array methods
