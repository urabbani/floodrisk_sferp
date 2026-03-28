/**
 * Conversion utilities between Annotation and OpenLayers Feature
 */

import type Feature from 'ol/Feature';
import type { Annotation, NewAnnotation, UpdateAnnotation } from '@/types/annotations';
import { DEFAULT_STYLE_CONFIG } from './styles';
import GeoJSON from 'ol/format/GeoJSON';

const geoJSONFormat = new GeoJSON();

/**
 * Convert an Annotation from the API to an OpenLayers Feature
 */
export function annotationToFeature(annotation: Annotation): Feature {
  const feature = new Feature();

  // Set geometry from GeoJSON
  if (annotation.geometry) {
    const geom = geoJSONFormat.readGeometry(annotation.geometry, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:32642',
    });
    feature.setGeometry(geom);
  }

  // Set properties
  feature.set('id', annotation.id);
  feature.set('title', annotation.title);
  feature.set('description', annotation.description);
  feature.set('category', annotation.category);
  feature.set('geometry_type', annotation.geometry_type);
  feature.set('styleConfig', annotation.style_config || DEFAULT_STYLE_CONFIG);
  feature.set('created_by', annotation.created_by);
  feature.set('created_at', annotation.created_at);
  feature.set('updated_at', annotation.updated_at);

  return feature;
}

/**
 * Convert an OpenLayers Feature to a NewAnnotation for API submission
 */
export function featureToNewAnnotation(
  feature: Feature,
  createdBy: string
): NewAnnotation {
  const geometry = geoJSONFormat.writeGeometry(feature.getGeometry()!, {
    featureProjection: 'EPSG:32642',
    dataProjection: 'EPSG:4326',
  });

  const styleConfig = feature.get('styleConfig') || DEFAULT_STYLE_CONFIG;

  return {
    title: feature.get('title') || 'Untitled',
    description: feature.get('description') || null,
    category: feature.get('category') || 'general',
    geometry_type: feature.get('geometry_type') || 'point',
    geometry: JSON.parse(geometry),
    style_config: styleConfig,
    created_by: createdBy,
  };
}

/**
 * Convert an OpenLayers Feature to an Annotation object
 * Used for features that already have an ID
 */
export function featureToAnnotation(feature: Feature): Annotation {
  const geometry = feature.getGeometry();
  const geometryJson = geometry
    ? JSON.parse(geoJSONFormat.writeGeometry(geometry, {
        featureProjection: 'EPSG:32642',
        dataProjection: 'EPSG:4326',
      }))
    : null;

  return {
    id: feature.get('id'),
    title: feature.get('title') || 'Untitled',
    description: feature.get('description') || null,
    category: feature.get('category') || 'general',
    geometry_type: feature.get('geometry_type') || 'point',
    geometry: geometryJson,
    style_config: feature.get('styleConfig') || DEFAULT_STYLE_CONFIG,
    created_by: feature.get('created_by') || 'Anonymous',
    created_at: feature.get('created_at') || new Date().toISOString(),
    updated_at: feature.get('updated_at') || new Date().toISOString(),
  };
}
