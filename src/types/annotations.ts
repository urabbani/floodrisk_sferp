/**
 * Annotation Types
 *
 * Type definitions for the collaborative drawing and annotation feature.
 */

/**
 * Drawing tool selection
 */
export type DrawingTool =
  | 'none'      // No tool active - normal map interaction
  | 'point'     // Draw point annotations
  | 'line'      // Draw line annotations
  | 'polygon'   // Draw polygon annotations
  | 'select'    // Select existing annotation
  | 'modify'    // Modify existing annotation vertices
  | 'delete';   // Delete selected annotation

/**
 * Annotation categories for grouping and filtering
 */
export type AnnotationCategory =
  | 'general'
  | 'observation'
  | 'infrastructure'
  | 'hazard'
  | 'field_note'
  | 'other';

/**
 * Geometry types supported
 */
export type AnnotationGeometryType = 'point' | 'line' | 'polygon';

/**
 * Style configuration for annotation rendering
 */
export interface StyleConfig {
  color: string;           // Stroke/border color (hex)
  strokeWidth: number;     // Stroke width in pixels
  fillColor: string;       // Fill color with opacity (hex + alpha)
  opacity: number;         // Fill opacity (0-1)
}

/**
 * Default style for each geometry type
 */
export const DEFAULT_STYLES: Record<AnnotationGeometryType, StyleConfig> = {
  point: {
    color: '#ff0000',
    strokeWidth: 2,
    fillColor: '#ff0000',
    opacity: 0.7,
  },
  line: {
    color: '#ff0000',
    strokeWidth: 2,
    fillColor: '#ff0000',
    opacity: 0.7,
  },
  polygon: {
    color: '#ff0000',
    strokeWidth: 2,
    fillColor: '#ff0000',
    opacity: 0.2,
  },
} as const;

/**
 * Available color presets for annotations
 */
export const COLOR_PRESETS = [
  { name: 'Red', value: '#ff0000', fill: 'rgba(255, 0, 0, 0.2)' },
  { name: 'Orange', value: '#ff6600', fill: 'rgba(255, 102, 0, 0.2)' },
  { name: 'Yellow', value: '#ffcc00', fill: 'rgba(255, 204, 0, 0.2)' },
  { name: 'Green', value: '#00cc00', fill: 'rgba(0, 204, 0, 0.2)' },
  { name: 'Blue', value: '#0066ff', fill: 'rgba(0, 102, 255, 0.2)' },
  { name: 'Purple', value: '#9900ff', fill: 'rgba(153, 0, 255, 0.2)' },
] as const;

/**
 * Category labels and colors
 */
export const CATEGORY_INFO: Record<AnnotationCategory, { label: string; color: string }> = {
  general: { label: 'General', color: '#64748b' },
  observation: { label: 'Observation', color: '#0ea5e9' },
  infrastructure: { label: 'Infrastructure', color: '#f59e0b' },
  hazard: { label: 'Hazard', color: '#ef4444' },
  field_note: { label: 'Field Note', color: '#10b981' },
  other: { label: 'Other', color: '#8b5cf6' },
} as const;

/**
 * Annotation as returned from the API
 */
export interface Annotation {
  id: number;
  title: string;
  description: string | null;
  category: AnnotationCategory;
  geometry_type: AnnotationGeometryType;
  geometry: GeoJSONGeometry;
  style_config: StyleConfig;
  created_by: string;
  created_at: string;  // ISO 8601 timestamp
  updated_at: string;  // ISO 8601 timestamp
}

/**
 * GeoJSON Geometry (simplified subset)
 */
export type GeoJSONGeometry =
  | { type: 'Point'; coordinates: [number, number] }
  | { type: 'Point'; coordinates: [number, number, number] }
  | { type: 'LineString'; coordinates: Array<[number, number] | [number, number, number]> }
  | { type: 'Polygon'; coordinates: Array<Array<[number, number] | [number, number, number]>> }
  | { type: 'MultiPoint'; coordinates: Array<[number, number] | [number, number, number]> }
  | { type: 'MultiLineString'; coordinates: Array<Array<[number, number] | [number, number, number]>> }
  | { type: 'MultiPolygon'; coordinates: Array<Array<Array<[number, number] | [number, number, number]>>> };

/**
 * New annotation data for creation
 */
export interface NewAnnotation {
  title: string;
  description?: string;
  category?: AnnotationCategory;
  geometry_type: AnnotationGeometryType;
  geometry: GeoJSONGeometry;
  style_config?: Partial<StyleConfig>;
  created_by: string;
  // New fields for intervention requirements
  interventionType?: string;
  featureType?: AnnotationGeometryType;
  hydrologicalParams?: string;
  interventionInfo?: {
    shortDescription: string;
    locationShapeInfo: string;
    hydrologicalParameters: string;
  };
}

/**
 * Annotation update data
 */
export interface UpdateAnnotation {
  title?: string;
  description?: string | null;
  category?: AnnotationCategory;
  geometry?: GeoJSONGeometry;
  style_config?: Partial<StyleConfig>;
  // New fields for intervention requirements
  interventionType?: string;
  featureType?: AnnotationGeometryType;
  hydrologicalParams?: string;
  interventionInfo?: {
    shortDescription: string;
    locationShapeInfo: string;
    hydrologicalParameters: string;
  };
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
  count?: number;
}

/**
 * Annotations list response
 */
export interface AnnotationsListResponse extends ApiResponse<Annotation[]> {
  // error is inherited from ApiResponse
}

/**
 * Annotations list response
 */
export interface AnnotationsListResponse {
  success: boolean;
  data: Annotation[];
  count: number;
}

/**
 * Drawing tool icon mapping for UI
 */
export const TOOL_INFO: Record<DrawingTool, { icon: string; label: string; description: string }> = {
  none: { icon: 'MousePointer2', label: 'Pan/Zoom', description: 'Normal map navigation and feature identification' },
  point: { icon: 'MapPin', label: 'Point', description: 'Click to place a point marker' },
  line: { icon: 'Minus', label: 'Line', description: 'Click to draw line segments, double-click to finish' },
  polygon: { icon: 'Pentagon', label: 'Polygon', description: 'Click to place vertices, double-click to close' },
  select: { icon: 'MousePointer2', label: 'Select', description: 'Click to select an annotation for editing' },
  modify: { icon: 'Pencil', label: 'Modify', description: 'Drag vertices to modify shape' },
  delete: { icon: 'Trash2', label: 'Delete', description: 'Delete selected annotation' },
} as const;

/**
 * Format category for display
 */
export function formatCategory(category: AnnotationCategory): string {
  return CATEGORY_INFO[category]?.label || category;
}

/**
 * Get category color
 */
export function getCategoryColor(category: AnnotationCategory): string {
  return CATEGORY_INFO[category]?.color || '#64748b';
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
