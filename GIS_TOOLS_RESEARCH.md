# GIS Tools and Features for Web-Based Flood Risk Assessment Applications

## Executive Summary

This document provides a comprehensive overview of GIS tools and features commonly used in web-based mapping applications, specifically tailored for flood risk assessment and disaster management. Based on OpenLayers 10.8 (the version used in this project), it covers essential tools, implementation considerations, UX best practices, and accessibility standards. The recommendations are specifically designed for applications displaying flood depth, velocity, and duration data across different climate scenarios.

---

## 1. Essential Navigation Tools

### 1.1 Zoom Controls

**What it does:** Allows users to zoom in/out of the map to view data at different scales.

**Relevance to Flood Risk Assessment:**
- Zoom to specific areas of interest within flood zones
- View fine details of affected infrastructure at close zoom levels
- Understand regional context at broader scales
- Examine flood extent boundaries at optimal zoom levels

**OpenLayers Implementation:**
```typescript
import { Zoom } from 'ol/control';

const zoomControl = new Zoom({
  duration: 250, // Animation duration in ms
});

// Custom zoom to specific extent
map.getView().fit(extent, {
  padding: [50, 50, 50, 50],
  duration: 1000,
  constrainResolution: true // Prevent fuzzy rendering
});
```

**Best Practices:**
- Position zoom controls in the top-right or top-left corner (standard UX pattern)
- Include zoom-to-extent button for returning to default view
- Add zoom level indicator for context
- Use smooth animations (200-300ms) for better UX
- Consider keyboard shortcuts (+/- keys) for accessibility

**Mobile Considerations:**
- Ensure touch targets are at least 44x44px (WCAG AAA)
- Support pinch-to-zoom gestures (built into OpenLayers)
- Consider double-tap-to-zoom behavior

---

### 1.2 Pan Navigation

**What it does:** Enables users to move around the map by dragging.

**Relevance to Flood Risk Assessment:**
- Navigate along flood-prone river corridors
- Explore adjacent areas without changing zoom level
- Follow infrastructure networks (canals, drains)

**OpenLayers Implementation:**
```typescript
// Panning is enabled by default in OpenLayers
// Disable if needed:
const interactions = defaultInteractions({
  doubleClickZoom: false,
  dragPan: true,
  keyboard: true
});

// Constrain pan to specific extent
const view = new View({
  extent: [minX, minY, maxX, maxY],
  constrainOnlyCenter: true, // Allow partial off-screen
  smoothExtentConstraint: true,
  smoothResolutionConstraint: true
});
```

**Best Practices:**
- Enable kinetic panning (momentum) for natural feel
- Constrain to relevant extent to prevent users from getting lost
- Consider arrow key navigation for accessibility
- Show visual feedback during pan operations

---

### 1.3 Extent Navigation / Bookmarked Views

**What it does:** Save and quickly navigate to predefined map extents.

**Relevance to Flood Risk Assessment:**
- Quick access to administrative boundaries (districts, tehsils)
- Navigate to critical infrastructure (barrages, bridges)
- Jump to specific flood scenarios or historical events
- Access frequently analyzed areas

**OpenLayers Implementation:**
```typescript
interface Bookmark {
  name: string;
  extent: number[];
  zoom?: number;
}

// Example bookmarks for flood risk
const bookmarks: Bookmark[] = [
  { name: 'Sindh Province', extent: [309082.5, 2853827.75, 569587.5, 3306262.25] },
  { name: 'Indus River', extent: [400000, 2900000, 480000, 3200000] },
  { name: 'AOI', extent: [439335 - 50000, 3080045 - 50000, 439335 + 50000, 3080045 + 50000] }
];

function navigateToBookmark(bookmark: Bookmark) {
  const view = map.getView();
  view.fit(bookmark.extent, {
    duration: 1000,
    padding: [50, 50, 50, 50]
  });
}
```

**Best Practices:**
- Store bookmarks in localStorage for persistence
- Allow users to create custom bookmarks
- Include thumbnails or mini-maps in bookmark UI
- Group bookmarks logically (administrative, infrastructure, custom)
- Consider a "home" button to return to initial extent

**UX Pattern:**
```tsx
// Bookmark dropdown component
<div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg z-10">
  <select onChange={(e) => navigateToBookmark(bookmarks[e.target.value])}>
    <option value="">Quick Navigation...</option>
    {bookmarks.map((bm, i) => (
      <option key={i} value={i}>{bm.name}</option>
    ))}
  </select>
</div>
```

---

### 1.4 Coordinate Display

**What it does:** Shows current map center coordinates on hover or pointer location.

**Relevance to Flood Risk Assessment:**
- Precise location identification for field verification
- Coordinate sharing with ground teams
- Integration with GPS data from survey points
- Reference for disaster response coordination

**OpenLayers Implementation:**
```typescript
import MousePosition from 'ol/control/MousePosition';

const mousePosition = new MousePosition({
  coordinateFormat: createStringXY(4), // 4 decimal places
  projection: 'EPSG:32642', // Match your map projection
  className: 'mouse-position',
  placeholder: 'Coordinates: ',
  undefinedHTML: '&nbsp;'
});

map.addControl(mousePosition);
```

**Best Practices:**
- Display coordinates in map projection (UTM) AND geographic (lat/lon)
- Show units clearly (meters for UTM, degrees for geographic)
- Consider copy-to-clipboard functionality
- Format to appropriate precision (4-5 decimals for UTM, 6-7 for lat/lon)

---

## 2. Measurement Tools

### 2.1 Distance Measurement

**What it does:** Calculate distances between points on the map.

**Relevance to Flood Risk Assessment:**
- Measure flood extent boundaries
- Calculate evacuation distances
- Determine length of affected infrastructure (canals, roads)
- Measure buffer zones around hazard areas

**OpenLayers Implementation:**
```typescript
import Draw from 'ol/interaction/Draw';
import { Vector as VectorSource } from 'ol/source';
import { Vector as VectorLayer } from 'ol/layer';
import { LineString } from 'ol/geom';
import { getLength } from 'ol/sphere';
import { unByKey } from 'ol/Observable';

// Create draw layer
const source = new VectorSource();
const drawLayer = new VectorLayer({
  source: source,
  style: new Style({
    stroke: new Stroke({
      color: '#FF0000',
      width: 2
    })
  })
});

// Draw interaction
let draw: Draw | null = null;
let listenerKey: any;

function startMeasureDistance() {
  draw = new Draw({
    source: source,
    type: 'LineString'
  });

  draw.on('drawstart', (evt) => {
    source.clear(); // Clear previous measurements
    listenerKey = evt.feature.on('change', (e) => {
      const geom = e.target.getGeometry() as LineString;
      const length = getLength(geom, { projection: 'EPSG:32642' });
      updateMeasurementDisplay(`${(length / 1000).toFixed(2)} km`);
    });
  });

  draw.on('drawend', () => {
    unByKey(listenerKey);
  });

  map.addInteraction(draw);
}
```

**Best Practices:**
- Show real-time measurement as user draws
- Display in appropriate units (m, km for metric; ft, mi for imperial)
- Allow unit conversion
- Show segment lengths and total length
- Add vertex markers for clarity
- Provide undo/clear functionality

**UX Considerations:**
- Use distinct color for measurement lines
- Show measurement in a floating tooltip
- Consider snapping to existing features
- Support multiple simultaneous measurements

---

### 2.2 Area Measurement

**What it does:** Calculate the area of polygons drawn on the map.

**Relevance to Flood Risk Assessment:**
- Calculate flood inundation area
- Measure affected agricultural land
- Determine population exposure areas
- Assess infrastructure coverage

**OpenLayers Implementation:**
```typescript
import { Polygon } from 'ol/geom';
import { getArea } from 'ol/sphere';

function startMeasureArea() {
  draw = new Draw({
    source: source,
    type: 'Polygon'
  });

  draw.on('drawstart', (evt) => {
    source.clear();
    listenerKey = evt.feature.on('change', (e) => {
      const geom = e.target.getGeometry() as Polygon;
      const area = getArea(geom, { projection: 'EPSG:32642' });
      updateMeasurementDisplay(`${(area / 10000).toFixed(2)} hectares`);
    });
  });

  map.addInteraction(draw);
}
```

**Best Practices:**
- Display in appropriate units (sq m, hectares, sq km)
- Show perimeter alongside area when relevant
- Consider hole support (donut polygons)
- Validate polygon closure
- Support freehand drawing for quick area estimation

**Unit Conversions:**
```typescript
function formatArea(area: number): string {
  if (area < 10000) {
    return `${area.toFixed(0)} m²`;
  } else if (area < 1000000) {
    return `${(area / 10000).toFixed(2)} ha`;
  } else {
    return `${(area / 1000000).toFixed(2)} km²`;
  }
}
```

---

### 2.3 Bearing/Azimuth Measurement

**What it does:** Calculate direction/bearing between points.

**Relevance to Flood Risk Assessment:**
- Determine flood flow direction
- Plan evacuation routes
- Analyze drainage patterns
- Coordinate response activities

**OpenLayers Implementation:**
```typescript
import { transform } from 'ol/proj';

function calculateBearing(point1: number[], point2: number[]): number {
  const lon1 = point1[0] * Math.PI / 180;
  const lat1 = point1[1] * Math.PI / 180;
  const lon2 = point2[0] * Math.PI / 180;
  const lat2 = point2[1] * Math.PI / 180;

  const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) -
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);

  const brng = Math.atan2(y, x);
  return (brng * 180 / Math.PI + 360) % 360; // Convert to degrees
}
```

---

## 3. Identification/Query Tools

### 3.1 Feature Identification (Click to Get Info)

**What it does:** Click on a map feature to display its attributes.

**Relevance to Flood Risk Assessment:**
- Query flood depth values at specific locations
- Get information about survey points
- Identify infrastructure attributes
- Access historical flood data at clicked location

**OpenLayers Implementation:**
```typescript
import { get as getProjection } from 'ol/proj';

map.on('singleclick', (evt) => {
  const viewResolution = map.getView().getResolution();
  if (!viewResolution) return;

  const url = wmsLayer.getSource()?.getFeatureInfoUrl(
    evt.coordinate,
    viewResolution,
    getProjection('EPSG:32642'),
    {
      INFO_FORMAT: 'application/json',
      QUERY_LAYERS: 'results:t3_25yrs_present_perfect_maxdepth',
      FEATURE_COUNT: 10
    }
  );

  if (url) {
    fetch(url)
      .then(response => response.json())
      .then(data => displayFeatureInfo(data));
  }
});

function displayFeatureInfo(features: any[]) {
  // Create popup with feature attributes
  const popup = document.createElement('div');
  popup.className = 'feature-popup';
  popup.innerHTML = `
    <h3>Feature Information</h3>
    <ul>
      ${features.map(f => `
        <li>${f.properties.NAME || 'Unknown'}: ${f.properties.value}</li>
      `).join('')}
    </ul>
  `;
  // Add to overlay
}
```

**Best Practices:**
- Show loading state during WMS GetFeatureInfo request
- Handle no-data cases gracefully
- Limit to top N features to avoid overwhelming UI
- Include layer name in results
- Support identify multiple layers at once
- Consider hover-identify for quick previews
- Style identified features to highlight selection

**UX Pattern:**
```tsx
// InfoPopup component
<div className="absolute bg-white rounded-lg shadow-xl p-4 max-w-xs z-50"
     style={{ left: coordinate[0], top: coordinate[1] }}>
  <div className="flex justify-between items-center mb-2">
    <h3 className="font-semibold">Feature Info</h3>
    <button onClick={close} className="text-slate-500 hover:text-slate-700">✕</button>
  </div>
  <div className="space-y-2">
    {features.map(f => (
      <div key={f.id}>
        <span className="text-sm text-slate-600">{f.layer}:</span>
        <span className="ml-2 font-medium">{f.value}</span>
      </div>
    ))}
  </div>
</div>
```

---

### 3.2 Identify by Radius/Rectangle

**What it does:** Select features within a drawn radius or rectangle.

**Relevance to Flood Risk Assessment:**
- Query all features in an area of interest
- Analyze flood impact on multiple assets simultaneously
- Select infrastructure for batch operations
- Export data for specific sub-areas

**OpenLayers Implementation:**
```typescript
// Box selection
import DragBox from 'ol/interaction/DragBox';

const dragBox = new DragBox({
  condition: shiftKeyOnly // Require Shift+drag
});

dragBox.on('boxend', () => {
  const extent = dragBox.getGeometry().getExtent();
  wmsLayer.getSource()?.getFeaturesInExtent(extent).forEach(feature => {
    // Process selected features
  });
});

map.addInteraction(dragBox);

// Circle selection (radius)
import { Circle as CircleGeom } from 'ol/geom';

function createRadiusSelection(center: number[], radius: number) {
  const circle = new CircleGeom(center, radius);
  const extent = circle.getExtent();
  // Query features within extent, then filter by actual distance
}
```

**Best Practices:**
- Visual feedback during selection (semi-transparent fill)
- Show selected count
- Support Ctrl+click for multi-select
- Allow deselecting (click outside or Esc key)
- Export selection to CSV/GeoJSON

---

## 4. Analysis Tools

### 4.1 Profile/Terrain Analysis

**What it does:** Display elevation profile along a drawn line.

**Relevance to Flood Risk Assessment:**
- Understand terrain influence on flood patterns
- Identify low-lying areas prone to flooding
- Plan evacuation routes avoiding flood-prone areas
- Analyze cross-sections of river valleys

**OpenLayers Implementation:**
```typescript
import { LineString } from 'ol/geom';

function getElevationProfile(line: LineString): Promise<number[]> {
  const coordinates = line.getCoordinates();
  const elevations: number[] = [];

  // Sample points along the line
  const numSamples = 100;
  for (let i = 0; i < numSamples; i++) {
    const point = line.getCoordinateAt(i / numSamples);

    // Query DEM elevation at this point
    const url = `${GEOSERVER_CONFIG.baseUrl}/DEM/wms` +
      `?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetFeatureInfo` +
      `&LAYERS=DEM:HDTM&QUERY_LAYERS=DEM:HDTM` +
      `&INFO_FORMAT=application/json` +
      `&X=${point[0]}&Y=${point[1]}`;

    // Fetch and store elevation
    // ...
  }

  return Promise.resolve(elevations);
}
```

**Best Practices:**
- Show distance along X-axis, elevation on Y-axis
- Allow clicking on profile to jump to location on map
- Display min/max/average elevation
- Consider multiple profile comparison
- Support profile export (CSV, image)

**Chart Library Integration:**
```typescript
import { LineChart } from 'recharts';

function ProfileChart({ profile }: { profile: { distance: number; elevation: number }[] }) {
  return (
    <LineChart width={600} height={300} data={profile}>
      <XAxis dataKey="distance" label="Distance (m)" />
      <YAxis label="Elevation (m)" />
      <CartesianGrid strokeDasharray="3 3" />
      <Tooltip />
      <Line type="monotone" dataKey="elevation" stroke="#8884d8" />
    </LineChart>
  );
}
```

---

### 4.2 Line of Sight

**What it does:** Determine visibility between two points considering terrain.

**Relevance to Flood Risk Assessment:**
- Plan observer placement for flood monitoring
- Evaluate communication tower placement
- Assess emergency response visibility
- Identify shelter location visibility

**Implementation Considerations:**
- Requires high-resolution DEM
- Compute terrain profile between points
- Account for earth curvature (for long distances)
- Consider observer height and target height

```typescript
function calculateLineOfSight(
  observer: [number, number, number], // [x, y, height]
  target: [number, number, number],
  dem: TileLayer
): { visible: boolean; profile: number[] } {
  // Get terrain profile between points
  // Calculate line of sight
  // Return visibility status and profile
}
```

---

### 4.3 Watershed Delineation

**What it does:** Identify drainage area upstream from a point.

**Relevance to Flood Risk Assessment:**
- Determine contributing area for flood forecasting
- Identify potential flood sources
- Analyze catchment characteristics
- Support dam breach modeling

**Implementation Note:**
Typically requires backend geoprocessing (GDAL, GRASS, TauDEM):

```typescript
async function delineateWatershed(outletPoint: number[]) {
  const response = await fetch('/api/geoprocessing/watershed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      outlet: outletPoint,
      dem: 'HDTM'
    })
  });

  const watershedGeoJSON = await response.json();
  // Display watershed boundary on map
}
```

---

### 4.4 Flow Direction and Accumulation

**What it does:** Show water flow patterns across terrain.

**Relevance to Flood Risk Assessment:**
- Predict flood water movement
- Identify natural drainage paths
- Locate potential accumulation points
- Support evacuation planning

---

## 5. Drawing/Markup Tools

### 5.1 Point, Line, Polygon Drawing

**What it does:** Allow users to create geometries on the map.

**Relevance to Flood Risk Assessment:**
- Mark observation points
- Sketch proposed mitigation measures
- Annotate map features
- Create temporary study areas

**OpenLayers Implementation:**
```typescript
import Draw from 'ol/interaction/Draw';
import { Style, Fill, Stroke, Circle } from 'ol/style';

const drawStyles = {
  Point: new Style({
    image: new Circle({
      radius: 7,
      fill: new Fill({ color: '#FF0000' }),
      stroke: new Stroke({ color: '#FFFFFF', width: 2 })
    })
  }),
  LineString: new Style({
    stroke: new Stroke({ color: '#FF0000', width: 3 })
  }),
  Polygon: new Style({
    stroke: new Stroke({ color: '#FF0000', width: 2 }),
    fill: new Fill({ color: 'rgba(255, 0, 0, 0.2)' })
  })
};

function enableDraw(type: 'Point' | 'LineString' | 'Polygon') {
  const draw = new Draw({
    source: vectorSource,
    type: type,
    style: drawStyles[type]
  });

  map.addInteraction(draw);

  draw.on('drawend', (evt) => {
    const feature = evt.feature;
    // Save or process the feature
  });
}
```

**Best Practices:**
- Visual feedback during drawing (preview)
- Snapping to existing features (optional)
- Vertex editing after drawing
- Undo/redo support
- Clear all drawings option
- Export to GeoJSON

---

### 5.2 Freehand Drawing

**What it does:** Draw by holding mouse button and moving freely.

**Relevance to Flood Risk Assessment:**
- Quick annotation of flood boundaries
- Highlight areas of interest rapidly
- Sketch approximate zones without precision

**OpenLayers Implementation:**
```typescript
const freehandDraw = new Draw({
  source: vectorSource,
  type: 'LineString',
  freehand: true, // Enable freehand mode
  freehandCondition: shiftKeyOnly // Or always true
});
```

---

### 5.3 Text Labels and Annotations

**What it does:** Add text labels and notes to map locations.

**Relevance to Flood Risk Assessment:**
- Label monitoring stations
- Add field observations
- Document issues or concerns
- Collaborative planning

**Implementation:**
```typescript
interface Annotation {
  coordinate: number[];
  text: string;
  author: string;
  timestamp: Date;
}

// Display as overlay
const overlay = new Overlay({
  element: createAnnotationElement(annotation),
  position: annotation.coordinate,
  positioning: 'bottom-center',
  stopEvent: false
});

map.addOverlay(overlay);
```

---

## 6. Selection Tools

### 6.1 Box Selection

**What it does:** Select features within a rectangular area.

**Relevance to Flood Risk Assessment:**
- Select infrastructure in flood zone
- Batch select survey points for analysis
- Select multiple administrative units

**Implementation:** (See 3.2 Identify by Radius/Rectangle)

---

### 6.2 Polygon Selection

**What it does:** Select features within an arbitrary polygon.

**Relevance to Flood Risk Assessment:**
- Select features along irregular flood boundaries
- Select infrastructure in specific catchment
- Custom area analysis

---

### 6.3 Buffer Selection

**What it does:** Select features within a specified distance of a feature/point.

**Relevance to Flood Risk Assessment:**
- Select infrastructure within flood buffer zone
- Identify assets within X meters of river
- Analyze impact radius around breach points

**Implementation:**
```typescript
import { buffer as bufferGeom, fromCircle } from 'ol/geom/Polygon';

function createBuffer(center: number[], radius: number) {
  // Create circle and convert to polygon
  const circle = fromCircle(center, radius, 64);
  return circle.getExtent();
}

function selectByBuffer(feature: Feature, bufferDistance: number) {
  const geom = feature.getGeometry();
  const buffered = bufferGeom(geom, bufferDistance);
  // Query features within buffered geometry
}
```

---

## 7. Print/Export Tools

### 7.1 Print Layout

**What it does:** Generate formatted map prints with title, legend, scale bar, etc.

**Relevance to Flood Risk Assessment:**
- Create official reports with maps
- Generate briefing materials for decision makers
- Produce field maps for response teams
- Document flood scenarios for planning

**Implementation Options:**

**Option 1: Browser Print (Simple)**
```typescript
function printMap() {
  const mapCanvas = document.createElement('canvas');
  const size = map.getSize();
  mapCanvas.width = size[0];
  mapCanvas.height = size[1];

  map.once('rendercomplete', () => {
    const mapCanvas = document.querySelector('.ol-layer canvas');
    if (mapCanvas) {
      const link = document.createElement('a');
      link.download = 'flood-map.png';
      link.href = mapCanvas.toDataURL();
      link.click();
    }
  });

  map.renderSync();
}
```

**Option 2: MapFish Print (Advanced)**
```typescript
// Requires MapFish Print server
async function printLayout() {
  const spec = {
    layout: 'A4 landscape',
    layers: [/* current layer config */],
    pages: [{
      center: map.getView().getCenter(),
      scale: map.getView().getScale(),
      rotation: map.getView().getRotation()
    }],
    outputFilename: 'flood-risk-map'
  };

  const response = await fetch('/print/create', {
    method: 'POST',
    body: JSON.stringify(spec)
  });

  // Download PDF
}
```

**Best Practices:**
- Include scale bar
- Add north arrow
- Include legend
- Show title and metadata (date, scenario, etc.)
- Add attribution
- Consider print quality (300 DPI for reports)

---

### 7.2 Export to Image

**What it does:** Export current map view as PNG/JPG.

**Relevance to Flood Risk Assessment:**
- Quick screenshots for presentations
- Email map snapshots
- Include in documents

**Implementation:**
```typescript
export async function exportMapImage(format: 'png' | 'jpeg' = 'png') {
  const mapCanvas = document.createElement('canvas');
  const size = map.getSize();
  if (!size) return;

  mapCanvas.width = size[0] * 2; // 2x for high DPI
  mapCanvas.height = size[1] * 2;

  const map = mapInstance.current;
  map.once('rendercomplete', () => {
    const canvases = document.querySelectorAll('.ol-layer canvas');
    // Compose all canvases
    // Export to blob
  });

  map.renderSync();
}
```

---

### 7.3 Export Data

**What it does:** Export map data or selections to various formats.

**Relevance to Flood Risk Assessment:**
- Share analysis results with stakeholders
- Import into GIS software for further analysis
- Archive flood scenario data
- Create data backups

**Supported Formats:**
- GeoJSON (most compatible)
- KML (Google Earth)
- Shapefile (ZIP bundle)
- CSV (attribute data only)

**Implementation:**
```typescript
export function exportToGeoJSON(features: Feature[]) {
  const geoJSON = {
    type: 'FeatureCollection',
    features: features.map(f => new GeoJSON().writeFeature(f))
  };

  const blob = new Blob([JSON.stringify(geoJSON)], {
    type: 'application/json'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'flood-data.geojson';
  link.click();
}
```

---

## 8. Time/Temporal Tools

### 8.1 Time Slider

**What it does:** Animate or step through temporal data.

**Relevance to Flood Risk Assessment:**
- Show flood progression over time
- Compare historical events
- Animate forecast models
- Visualize seasonal patterns

**OpenLayers Implementation:**
```typescript
interface TimeLayerConfig {
  layer: TileLayer<TileWMS>;
  times: string[]; // ISO datetime strings
}

function createTimeSlider(layers: TimeLayerConfig[]) {
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = 0;
  slider.max = layers[0].times.length - 1;

  slider.addEventListener('input', (e) => {
    const timeIndex = parseInt(e.target.value);
    layers.forEach(config => {
      const source = config.layer.getSource();
      source.updateParams({ TIME: config.times[timeIndex] });
      source.refresh();
    });
  });

  return slider;
}
```

**Best Practices:**
- Play/pause controls
- Adjustable playback speed
- Date/time display
- Scrubbing support
- Loop option

**UX Pattern:**
```tsx
<div className="absolute bottom-20 left-4 bg-white rounded-lg shadow-lg p-4 z-10">
  <div className="flex items-center gap-4">
    <button onClick={togglePlay}>
      {isPlaying ? <Pause /> : <Play />}
    </button>
    <input
      type="range"
      min={0}
      max={times.length - 1}
      value={currentTimeIndex}
      onChange={handleTimeChange}
      className="w-64"
    />
    <span className="text-sm font-mono">{times[currentTimeIndex]}</span>
  </div>
  <div className="mt-2 flex items-center gap-2">
    <label className="text-xs">Speed:</label>
    <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
      <option value={2000}>Slow</option>
      <option value={1000}>Normal</option>
      <option value={500}>Fast</option>
    </select>
  </div>
</div>
```

---

## 9. Comparison Tools

### 9.1 Swipe Comparison

**What it does:** Side-by-side comparison with adjustable divider.

**Relevance to Flood Risk Assessment:**
- Compare Present vs Future climate scenarios
- Compare different return periods
- Compare Breaches vs Perfect maintenance
- Before/after comparisons

**OpenLayers Implementation:**
```typescript
// Requires two map instances or custom layer manipulation
class SwipeControl {
  private leftLayer: Layer;
  private rightLayer: Layer;
  private position: number = 0.5;

  constructor(leftLayer: Layer, rightLayer: Layer) {
    this.leftLayer = leftLayer;
    this.rightLayer = rightLayer;
  }

  setPosition(position: number) {
    this.position = position;
    this.leftLayer.on('precompose', (e) => {
      e.context.save();
      e.context.beginPath();
      e.context.rect(0, 0, e.context.canvas.width * this.position, e.context.canvas.height);
      e.context.clip();
    });

    this.leftLayer.on('postcompose', (e) => {
      e.context.restore();
    });
  }
}
```

**Best Practices:**
- Drag handle clearly visible
- Show labels for each side
- Keyboard support (arrow keys)
- Lock aspect ratio option

---

### 9.2 Split-Screen Comparison

**What it does:** Two independent map views synchronized.

**Relevance to Flood Risk Assessment:**
- Compare scenarios at different locations
- Side-by-side analysis
- Independent zoom while sharing center

**Implementation:**
```tsx
function SplitScreenCompare() {
  const [leftExtent, setLeftExtent] = useState();
  const [rightExtent, setRightExtent] = useState();

  // Sync pan/zoom
  useEffect(() => {
    if (syncEnabled) {
      // When left moves, update right
    }
  }, [leftExtent, syncEnabled]);

  return (
    <div className="flex h-full">
      <div className="w-1/2 border-r">
        <MapViewer id="left" onExtentChange={setLeftExtent} />
        <ScenarioSelector value={leftScenario} onChange={setLeftScenario} />
      </div>
      <div className="w-1/2">
        <MapViewer id="right" onExtentChange={setRightExtent} />
        <ScenarioSelector value={rightScenario} onChange={setRightScenario} />
      </div>
    </div>
  );
}
```

---

### 9.3 Scenario Matrix (Already Implemented)

The project already has a ScenarioMatrix component. Consider enhancements:
- Add synchronized zoom
- Highlight differences
- Export comparison table
- Statistical summary (delta between scenarios)

---

## 10. Geoprocessing Tools

### 10.1 Buffer

**What it does:** Create area around features at specified distance.

**Relevance to Flood Risk Assessment:**
- Create flood hazard zones around water bodies
- Buffer infrastructure for protection planning
- Define evacuation zones

**Implementation:**
```typescript
import { buffer as bufferOp } from 'ol/extent';
import { fromExtent } from 'ol/geom/Polygon';

function createBufferFeature(feature: Feature, distance: number) {
  const geom = feature.getGeometry();
  const extent = geom.getExtent();
  const bufferedExtent = bufferOp(extent, distance);
  const bufferedPolygon = fromExtent(bufferedExtent);

  return new Feature({
    geometry: bufferedPolygon,
    originalFeature: feature.getId()
  });
}
```

---

### 10.2 Clip

**What it does:** Extract portion of layers within boundary.

**Relevance to Flood Risk Assessment:**
- Extract flood data for administrative area
- Clip analysis to study area
- Create subsets for focused analysis

**Note:** Typically requires backend (Turf.js for simple cases, GeoServer WPS for complex):

```typescript
import * as turf from '@turf/turf';

function clipLayer(layerGeoJSON: any, boundaryGeoJSON: any) {
  return turf.clip(layerGeoJSON, boundaryGeoJSON);
}
```

---

### 10.3 Intersect

**What it does:** Find overlap between layers.

**Relevance to Flood Risk Assessment:**
- Identify flood-affected infrastructure
- Find overlapping zones of multiple hazards
- Calculate intersection areas

---

### 10.4 Union and Merge

**What it does:** Combine geometries or layers.

**Relevance to Flood Risk Assessment:**
- Merge adjacent flood zones
- Combine multiple hazard areas
- Create comprehensive risk maps

---

## 11. OpenLayers Capabilities and Extensions

### 11.1 Built-in Controls

OpenLayers provides many controls out of the box:

```typescript
import {
  defaults,
  Zoom,
  ScaleLine,
  FullScreen,
  OverviewMap,
  Rotate,
  Attribution,
  MousePosition
} from 'ol/control';

const map = new Map({
  controls: defaults().extend([
    new Zoom(),
    new ScaleLine({ units: 'metric' }),
    new FullScreen(),
    new OverviewMap(),
    new Rotate(),
    new MousePosition({
      projection: 'EPSG:32642',
      coordinateFormat: createStringXY(4)
    })
  ]),
  // ...
});
```

---

### 11.2 Popular OpenLayers Extensions

**ol-ext** (Extension library):
- Search control
- Layer switcher with groups
- Popup
- Drawing toolbar
- Legend
- Profile
- Animation

**Installation:**
```bash
npm install ol-ext
```

```typescript
import Search from 'ol-ext/control/Search';
import LayerSwitcher from 'ol-ext/control/LayerSwitcher';

const search = new Search({
  source: vectorSource
});

const layerSwitcher = new LayerSwitcher({
  tipLabel: 'Layers',
  collapsed: true
});
```

---

### 11.3 Turf.js for Geoprocessing

Client-side geoprocessing library:

```bash
npm install @turf/turf
```

```typescript
import * as turf from '@turf/turf';

// Buffer
const buffered = turf.buffer(feature, 1, { units: 'kilometers' });

// Intersection
const intersection = turf.intersect(poly1, poly2);

// Area
const area = turf.area(feature);

// Length
const length = turf.length(line, { units: 'kilometers' });

// Along
const point = turf.along(line, 5, { units: 'kilometers' });
```

---

## 12. Common UI Patterns for GIS Toolbars

### 12.1 Toolbar Layout Options

**Vertical Toolbar (Left or Right Edge):**
- Space-efficient
- Easy to add many tools
- Group related tools
- Collapse to icons

**Horizontal Toolbar (Top or Bottom Edge):**
- Standard web pattern
- Good for fewer tools
- Often combined with header

**Floating Toolbar:**
- Can be positioned by user
- Minimizes map obstruction
- Mobile-friendly

---

### 12.2 Recommended Pattern for This Project

Based on the shadcn/ui components already available:

```tsx
import { ToggleGroup, Toggle } from '@/components/ui/toggle-group';

function MapToolbar() {
  const [activeTool, setActiveTool] = useState<string>('pan');

  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
      {/* Primary Tools */}
      <ToggleGroup type="single" value={activeTool} onValueChange={setActiveTool}>
        <Toggle value="pan" aria-label="Pan">
          <Move className="w-5 h-5" />
        </Toggle>
        <Toggle value="identify" aria-label="Identify">
          <Search className="w-5 h-5" />
        </Toggle>
        <Toggle value="measure-distance" aria-label="Measure Distance">
          <Ruler className="w-5 h-5" />
        </Toggle>
        <Toggle value="measure-area" aria-label="Measure Area">
          <Square className="w-5 h-5" />
        </Toggle>
        <Toggle value="draw-point" aria-label="Draw Point">
          <MapPin className="w-5 h-5" />
        </Toggle>
        <Toggle value="draw-line" aria-label="Draw Line">
          <Minus className="w-5 h-5" />
        </Toggle>
        <Toggle value="draw-polygon" aria-label="Draw Polygon">
          <Pentagon className="w-5 h-5" />
        </Toggle>
      </ToggleGroup>

      <Separator />

      {/* Secondary Actions */}
      <Button variant="outline" size="icon" onClick={clearDrawings}>
        <Trash2 className="w-5 h-5" />
      </Button>
      <Button variant="outline" size="icon" onClick={exportMap}>
        <Download className="w-5 h-5" />
      </Button>
      <Button variant="outline" size="icon" onClick={printMap}>
        <Printer className="w-5 h-5" />
      </Button>
    </div>
  );
}
```

---

### 12.3 Context-Aware Toolbars

Show relevant tools based on current context:

```typescript
const toolContexts = {
  default: ['pan', 'identify', 'measure', 'draw'],
  drawing: ['point', 'line', 'polygon', 'text', 'clear'],
  analysis: ['buffer', 'intersect', 'profile', 'watershed'],
  comparison: ['swipe', 'split-screen']
};
```

---

## 13. Accessibility Considerations

### 13.1 WCAG Compliance

**Color Contrast:**
- 4.5:1 for normal text (AA)
- 7:1 for normal text (AAA)
- 3:1 for large text and graphics

**Touch Target Size:**
- Minimum 44x44px for mobile (WCAG AAA)
- 24x24px acceptable for desktop

**Focus Indicators:**
- Visible focus on all interactive elements
- Skip to main content link

---

### 13.2 Keyboard Navigation

```typescript
// Keyboard shortcuts for map tools
map.on('keydown', (evt) => {
  switch (evt.originalEvent.key) {
    case 'i': // Identify mode
      activateTool('identify');
      break;
    case 'm': // Measure mode
      activateTool('measure');
      break;
    case 'd': // Draw mode
      activateTool('draw');
      break;
    case 'Escape': // Cancel current operation
      cancelCurrentTool();
      break;
    case '+': // Zoom in
      zoomIn();
      break;
    case '-': // Zoom out
      zoomOut();
      break;
  }
});
```

---

### 13.3 Screen Reader Support

```tsx
<button
  aria-label="Measure distance tool"
  aria-pressed={activeTool === 'measure-distance'}
  aria-describedby="measure-distance-help"
  onClick={() => setActiveTool('measure-distance')}
>
  <Ruler className="w-5 h-5" />
</button>
<span id="measure-distance-help" className="sr-only">
  Click to start measuring distances on the map
</span>
```

---

### 13.4 ARIA Labels for Map Elements

```tsx
<div
  role="application"
  aria-label="Interactive flood risk map"
  aria-describedby="map-instructions"
>
  <div id="map-instructions" className="sr-only">
    Use arrow keys to pan, plus and minus keys to zoom.
    Press I to identify features, M to measure distances.
  </div>
  <div ref={mapRef} className="w-full h-full" tabIndex={0} />
</div>
```

---

## 14. Mobile Touch Interactions

### 14.1 Touch Gestures

OpenLayers supports these gestures by default:
- Single finger drag - Pan
- Two finger pinch - Zoom
- Two finger rotate - Rotate
- Double tap - Zoom in

**Custom touch interactions:**
```typescript
import { defaults, DragPan, PinchZoom, PinchRotate } from 'ol/interaction';

const interactions = defaults({
  dragPan: true,
  pinchZoom: true,
  pinchRotate: false // Disable rotation on mobile
});

// Add long-press for identify
let longPressTimer: any;
map.on('pointerdown', (evt) => {
  longPressTimer = setTimeout(() => {
    identifyFeatureAt(evt.coordinate);
  }, 500); // 500ms long press
});

map.on('pointerup', () => clearTimeout(longPressTimer));
map.on('pointerdrag', () => clearTimeout(longPressTimer));
```

---

### 14.2 Mobile Toolbar Pattern

```tsx
// Bottom toolbar for mobile (thumb-friendly)
function MobileMapToolbar() {
  const isMobile = useMobile();

  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t rounded-t-xl shadow-2xl p-2 z-50">
        <div className="flex justify-around">
          <MobileToolButton icon={<Move />} label="Pan" tool="pan" />
          <MobileToolButton icon={<Search />} label="Info" tool="identify" />
          <MobileToolButton icon={<Ruler />} label="Measure" tool="measure" />
          <MobileToolButton icon={<PenTool />} label="Draw" tool="draw" />
          <MobileToolButton icon={<Layers />} label="Layers" tool="layers" />
        </div>
      </div>
    );
  }

  return <DesktopToolbar />;
}
```

---

### 14.3 Touch-Friendly Measurement

```typescript
// Larger touch targets for mobile
const mobileDrawStyle = new Style({
  image: new Circle({
    radius: 10, // Larger than desktop
    fill: new Fill({ color: '#FF0000' }),
    stroke: new Stroke({ color: '#FFFFFF', width: 3 })
  }),
  stroke: new Stroke({
    color: '#FF0000',
    width: 4 // Thicker lines
  })
});
```

---

## 15. Specific Recommendations for This Application

### 15.1 Priority Tools for Flood Risk Visualization

**Phase 1 - Essential (Immediate Value):**
1. **Feature Identification** - Click to get flood depth/velocity values
2. **Measurement Tools** - Distance and area for impact assessment
3. **Bookmark Navigation** - Quick access to key locations
4. **Coordinate Display** - For field verification

**Phase 2 - High Value (User-Requested):**
5. **Drawing/Markup** - Annotate map observations
6. **Swipe Comparison** - Compare scenarios side-by-side
7. **Export to Image** - Generate report maps
8. **Print Layout** - Official map outputs

**Phase 3 - Advanced (Future Enhancement):**
9. **Terrain Profile** - Understand flood dynamics
10. **Buffer Selection** - Select by distance
11. **Time Animation** - For temporal flood progression
12. **Geoprocessing** - Advanced analysis

---

### 15.2 Implementation Architecture

```typescript
// Centralized tool manager
class MapToolManager {
  private map: Map;
  private currentTool: string = 'pan';
  private interactions: Map<string, Interaction> = new Map();

  constructor(map: Map) {
    this.map = map;
    this.initializeTools();
  }

  activateTool(toolId: string) {
    // Deactivate current tool
    if (this.currentTool && this.interactions.has(this.currentTool)) {
      this.map.removeInteraction(this.interactions.get(this.currentTool));
    }

    // Activate new tool
    if (toolId !== 'pan' && this.interactions.has(toolId)) {
      this.map.addInteraction(this.interactions.get(toolId));
    }

    this.currentTool = toolId;
    this.updateCursor();
  }

  private initializeTools() {
    // Measure distance
    const measureDistance = new Draw({ /* ... */ });
    this.interactions.set('measure-distance', measureDistance);

    // Measure area
    const measureArea = new Draw({ /* ... */ });
    this.interactions.set('measure-area', measureArea);

    // Draw point
    const drawPoint = new Draw({ /* ... */ });
    this.interactions.set('draw-point', drawPoint);

    // ... other tools
  }

  private updateCursor() {
    const cursors: Record<string, string> = {
      pan: 'grab',
      identify: 'crosshair',
      'measure-distance': 'crosshair',
      'measure-area': 'crosshair',
      'draw-point': 'crosshair',
      // ...
    };

    this.map.getTargetElement().style.cursor = cursors[this.currentTool] || 'default';
  }
}
```

---

### 15.3 Component Structure

```tsx
// App.tsx
function App() {
  const [activeTool, setActiveTool] = useState('pan');
  const [measurements, setMeasurements] = useState<Measurement[]>([]);

  return (
    <div className="h-screen flex">
      <ResizablePanelGroup>
        <ResizablePanel defaultSize={300}>
          <Sidebar>
            <LayerTree />
            <LegendPanel />
          </Sidebar>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel>
          <MapViewer activeTool={activeTool} />
          <MapToolbar activeTool={activeTool} onToolChange={setActiveTool} />
          <MeasurementResults measurements={measurements} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
```

---

### 15.4 Flood-Specific Enhancements

**Flood Depth Query:**
```typescript
async function queryFloodDepth(coordinate: number[], scenario: FloodScenario) {
  const url = `${GEOSERVER_CONFIG.baseUrl}/results/wms` +
    `?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetFeatureInfo` +
    `&LAYERS=results:${buildLayerName(scenario)}` +
    `&QUERY_LAYERS=results:${buildLayerName(scenario)}` +
    `&INFO_FORMAT=application/json` +
    `&X=${coordinate[0]}&Y=${coordinate[1]}` +
    `&SRS=EPSG:32642`;

  const response = await fetch(url);
  const data = await response.json();

  return {
    depth: data.features[0].properties.GRAY_INDEX,
    velocity: data.features[0].properties.velocity || null,
    duration: data.features[0].properties.duration || null
  };
}
```

**Flood Impact Summary:**
```typescript
interface FloodImpactSummary {
  scenario: string;
  returnPeriod: string;
  maxDepth: number;
  avgDepth: number;
  affectedArea: number; // hectares
  affectedPopulation: number;
  affectedInfrastructure: {
    bridges: number;
    roads: number; // km
    buildings: number;
  };
}

function generateImpactSummary(scenarioLayer: Layer): FloodImpactSummary {
  // Query layer statistics
  // Calculate impact metrics
  // Return summary
}
```

---

## 16. Performance Considerations

### 16.1 WMS Optimization

- Use tiled WMS (`TILED=true`)
- Appropriate tile size (256x256 standard)
- Server-side caching
- Limit visible layers
- Use appropriate image formats

```typescript
const wmsSource = new TileWMS({
  url: `${GEOSERVER_CONFIG.baseUrl}/results/wms`,
  params: {
    LAYERS: 'results:t3_25yrs_present_perfect_maxdepth',
    TILED: true,
    VERSION: '1.1.1',
    FORMAT: 'image/png',
    TRANSPARENT: true
  },
  serverType: 'geoserver',
  tileLoadFunction: (image, src) => {
    // Custom loading with error handling
    image.getImage().src = src;
  },
  transition: 0 // Disable fade for faster perceived load
});
```

---

### 16.2 Vector Layer Optimization

- Simplify geometries on zoom out
- Use webgl renderer for large datasets
- Implement clustering for points

```typescript
import WebGLPointsLayer from 'ol/layer/WebGLPoints';

const pointLayer = new WebGLPointsLayer({
  source: pointSource,
  style: {
    symbol: {
      symbolType: 'circle',
      size: 8,
      color: '#FF0000'
    }
  }
});
```

---

## 17. Testing Strategy

### 17.1 Tool Testing

```typescript
describe('MapToolManager', () => {
  it('should activate measure distance tool', () => {
    const manager = new MapToolManager(map);
    manager.activateTool('measure-distance');
    expect(manager.getCurrentTool()).toBe('measure-distance');
  });

  it('should calculate correct distance', () => {
    const line = new LineString([[0, 0], [1000, 0]]);
    const length = getLength(line, { projection: 'EPSG:32642' });
    expect(length).toBe(1000);
  });
});
```

---

## Sources and References

Due to web search tool limitations at the time of compilation, this document is based on:

1. **OpenLayers Official Documentation** - https://openlayers.org/en/latest/doc/
2. **OpenLayers API Reference** - https://openlayers.org/en/latest/apidoc/
3. **OpenLayers Examples** - https://openlayers.org/en/latest/examples/
4. **Project Source Code** - /mnt/d/floodrisk_sferp
5. **shadcn/ui Documentation** - https://ui.shadcn.com/
6. **WCAG 2.1 Guidelines** - https://www.w3.org/WAI/WCAG21/quickref/
7. **Turf.js Documentation** - https://turfjs.org/

---

## Conclusion

This comprehensive guide provides the foundation for implementing GIS tools in your flood risk assessment application. The recommendations prioritize tools that provide immediate value to users analyzing flood scenarios while maintaining accessibility and mobile compatibility. Start with Phase 1 tools and iteratively add more advanced features based on user feedback and requirements.
