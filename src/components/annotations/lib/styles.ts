/**
 * Annotation Styles Module
 *
 * Provides OpenLayers style functions for rendering annotation features.
 */

import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Circle from 'ol/style/Circle';
import Text from 'ol/style/Text';
import type Feature from 'ol/Feature';
import type Geometry from 'ol/geom/Geometry';
import type { StyleConfig } from '@/types/annotations';
import { DEFAULT_STYLES } from '@/types/annotations';

/**
 * Default style config for new features
 */
export const DEFAULT_STYLE_CONFIG: StyleConfig = DEFAULT_STYLES.point;

/**
 * Get style configuration from feature properties
 * Falls back to defaults based on geometry type
 */
function getStyleConfig(feature: Feature): StyleConfig {
  const geometryType = feature.get('geometry_type') || 'point';
  return (feature.get('styleConfig') as StyleConfig) || DEFAULT_STYLES[geometryType];
}

/**
 * Create an OpenLayers Style for an annotation feature
 *
 * @param feature - The feature to style
 * @param isSelected - Whether the feature is selected (adds highlight)
 * @returns OpenLayers Style object
 */
export function annotationStyleFunction(feature: Feature, isSelected = false): Style {
  const styleConfig = getStyleConfig(feature);
  const geometry = feature.getGeometry();
  const title = feature.get('title') || '';

  // Parse fill color from style config or create default
  const fillColorHex = styleConfig.fillColor || '#ff0000';
  // Convert hex to rgba with opacity
  const fillOpacity = styleConfig.opacity !== undefined ? styleConfig.opacity : 0.2;
  const fillColor = hexToRgba(fillColorHex, fillOpacity);

  // Stroke color
  const strokeColor = styleConfig.color || '#ff0000';
  const strokeWidth = isSelected ? styleConfig.strokeWidth + 2 : styleConfig.strokeWidth;

  // Build style based on geometry
  const image = geometry?.getType() === 'Point'
    ? new Circle({
      radius: isSelected ? 9 : 7,
      fill: new Fill({ color: strokeColor }),
      stroke: new Stroke({ color: '#ffffff', width: 2 }),
    })
    : undefined;

  // Add highlight border if selected
  const highlightStroke = isSelected
    ? new Stroke({ color: '#0066ff', width: strokeWidth + 2, lineDash: [5, 5] })
    : new Stroke({ color: strokeColor, width: strokeWidth });

  // Text label (title above the feature)
  const text = title
    ? new Text({
      text: title,
      offsetY: isSelected ? -28 : -22,
      font: `${isSelected ? 'bold ' : ''}12px sans-serif`,
      fill: new Fill({ color: '#1e293b' }),
      stroke: new Stroke({ color: '#ffffff', width: 3 }),
      backgroundFill: new Fill({ color: 'rgba(255, 255, 255, 0.7)' }),
      padding: [2, 2, 2, 2],
    })
    : undefined;

  return new Style({
    fill: geometry?.getType() === 'Polygon' ? new Fill({ color: fillColor }) : undefined,
    stroke: highlightStroke,
    image,
    text,
  });
}

/**
 * Convert hex color to rgba string
 */
function hexToRgba(hex: string, alpha: number): string {
  // Remove # if present
  const cleanHex = hex.replace('#', '');

  // Parse hex
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Create a style for vertices during modify interaction
 */
export function vertexStyle(): Style {
  return new Style({
    image: new Circle({
      radius: 6,
      fill: new Fill({ color: '#0066ff' }),
      stroke: new Stroke({ color: '#ffffff', width: 2 }),
    }),
  });
}

/**
 * Default styles for each geometry type
 * Used when creating new features before saving
 */
export const DEFAULT_FEATURE_STYLES = {
  point: {
    'styleConfig': DEFAULT_STYLES.point,
    'geometry_type': 'point',
  },
  line: {
    'styleConfig': DEFAULT_STYLES.line,
    'geometry_type': 'line',
  },
  polygon: {
    'styleConfig': DEFAULT_STYLES.polygon,
    'geometry_type': 'polygon',
  },
} as const;

/**
 * Get default properties for a new feature based on geometry type
 */
export function getDefaultFeatureProperties(
  geometryType: 'point' | 'line' | 'polygon',
  title: string = 'New Annotation',
  createdBy: string = 'Anonymous',
  category: string = 'general'
): Record<string, unknown> {
  return {
    title,
    description: '',
    category,
    geometry_type: geometryType,
    created_by: createdBy,
    ...DEFAULT_FEATURE_STYLES[geometryType],
  };
}

/**
 * Style function for use with VectorLayer
 * Wraps the annotationStyleFunction for OpenLayers
 */
export function createVectorStyleFunction(isSelectedFeature?: Feature) {
  return (feature: Feature) => {
    const isSelected = isSelectedFeature === feature;
    return annotationStyleFunction(feature, isSelected);
  };
}
