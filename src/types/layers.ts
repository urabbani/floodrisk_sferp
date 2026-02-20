// Layer types for the Flood Risk Assessment application

export type GeometryType = 'raster' | 'polygon' | 'line' | 'point';

export interface LayerInfo {
  id: string;
  name: string;
  type: 'raster' | 'vector' | 'wms';
  geometryType?: GeometryType;
  visible: boolean;
  opacity: number;
  geoserverName?: string;
  workspace?: string;
  style?: string;
  legendUrl?: string;
  zIndex?: number;
}

// Z-index priority based on geometry type
export const Z_INDEX_PRIORITY: Record<GeometryType, number> = {
  raster: 10,      // Flood layers - bottom
  polygon: 50,     // Areas, boundaries
  line: 100,       // Canals, drains
  point: 150,      // Survey points - top
};

export interface LayerGroup {
  id: string;
  name: string;
  expanded: boolean;
  visible: boolean;
  children: Array<LayerGroup | LayerInfo>;
}

export type LayerNode = LayerGroup | LayerInfo;

// Helper to check if a node is a group
export function isLayerGroup(node: LayerNode): node is LayerGroup {
  return 'children' in node;
}

// Helper to check if a node is a layer
export function isLayerInfo(node: LayerNode): node is LayerInfo {
  return !('children' in node);
}

// Return period options
export const returnPeriods = [
  { value: '2.3', label: '2.3 Years' },
  { value: '5', label: '5 Years' },
  { value: '10', label: '10 Years' },
  { value: '25', label: '25 Years' },
  { value: '50', label: '50 Years' },
  { value: '100', label: '100 Years' },
  { value: '500', label: '500 Years' },
];

// Parameter types
export const parameters = [
  { value: 'maxdepth', label: 'Depth', unit: 'm', colorScale: 'Blues' },
  { value: 'maxvelocity', label: 'Velocity', unit: 'm/s', colorScale: 'Reds' },
  { value: 'duration', label: 'Duration', unit: 'hours', colorScale: 'Greens' },
  { value: 'vh', label: 'V × h', unit: 'm²/s', colorScale: 'Oranges' },
];

// Maintenance levels
export const maintenanceLevels = [
  { value: 'breaches', label: 'Flood 2022 (Breaches)' },
  { value: 'redcapacity', label: 'Reduced Capacity' },
  { value: 'perfect', label: 'Perfect' },
];

// Climate scenarios
export const climateScenarios = [
  { value: 'present', label: 'Present Climate' },
  { value: 'future', label: 'Future Climate' },
];
