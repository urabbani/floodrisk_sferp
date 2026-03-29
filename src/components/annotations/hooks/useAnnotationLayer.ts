/**
 * useAnnotationLayer Hook
 *
 * Manages the annotation VectorLayer, syncing features with the API.
 * Handles loading annotations from the server and updating the map.
 */

import { useEffect, useCallback, useRef } from 'react';
import type Map from 'ol/Map';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { GeoJSON } from 'ol/format';
import Feature from 'ol/Feature';
import type Geometry from 'ol/geom/Geometry';
import type { Annotation, NewAnnotation, UpdateAnnotation } from '@/types/annotations';
import { apiFetch } from '@/lib/api';
import { annotationStyleFunction } from '../lib/styles';

interface UseAnnotationLayerOptions {
  map: Map | null;
  apiUrl?: string;
}

interface UseAnnotationLayerReturn {
  vectorSource: VectorSource;
  vectorLayer: VectorLayer<VectorSource>;
  loadAnnotations: () => Promise<Annotation[]>;
  createAnnotation: (annotation: NewAnnotation) => Promise<Annotation>;
  updateAnnotation: (id: number, annotation: UpdateAnnotation) => Promise<Annotation>;
  deleteAnnotation: (id: number) => Promise<void>;
  addFeature: (feature: Feature) => void;
  removeFeature: (feature: Feature) => void;
}

const DEFAULT_API_URL = '/api/annotations';

export function useAnnotationLayer({
  map,
  apiUrl = DEFAULT_API_URL,
}: UseAnnotationLayerOptions): UseAnnotationLayerReturn {
  const vectorSourceRef = useRef<VectorSource>(
    new VectorSource({
      format: new GeoJSON(),
    })
  );

  const vectorLayerRef = useRef<VectorLayer<VectorSource>>(
    new VectorLayer({
      source: vectorSourceRef.current,
      style: annotationStyleFunction as any,
      zIndex: 200, // Above all WMS layers
    })
  );

  // Add vector layer to map
  useEffect(() => {
    if (!map) return;

    map.addLayer(vectorLayerRef.current);

    return () => {
      map.removeLayer(vectorLayerRef.current);
    };
  }, [map]);

  /**
   * Load all annotations from the API
   */
  const loadAnnotations = useCallback(async (): Promise<Annotation[]> => {
    try {
      const result = await apiFetch<{ success: boolean; data?: Annotation[]; error?: string }>(apiUrl, { noAuth: true });

      if (!result.success) {
        throw new Error(result.error || 'Failed to load annotations');
      }

      const annotations: Annotation[] = result.data || [];

      // Clear existing features and add loaded ones
      vectorSourceRef.current.clear();

      for (const annotation of annotations) {
        const feature = annotationToFeature(annotation);
        if (feature) {
          vectorSourceRef.current.addFeature(feature);
        }
      }

      return annotations;
    } catch (error) {
      console.error('Error loading annotations:', error);
      throw error;
    }
  }, [apiUrl]);

  // Load annotations when map becomes available
  useEffect(() => {
    if (!map) return;

    loadAnnotations().catch(err => {
      console.error('Failed to load annotations:', err);
    });
  }, [map, loadAnnotations]);

  /**
   * Create a new annotation via the API
   */
  const createAnnotation = useCallback(async (newAnnotation: NewAnnotation): Promise<Annotation> => {
    try {
      const result = await apiFetch<{ success: boolean; data: Annotation; error?: string }>(apiUrl, {
        method: 'POST',
        body: JSON.stringify(newAnnotation),
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to create annotation');
      }

      const createdAnnotation: Annotation = result.data;

      // Add the new feature to the map
      const feature = annotationToFeature(createdAnnotation);
      if (feature) {
        vectorSourceRef.current.addFeature(feature);
      }

      return createdAnnotation;
    } catch (error) {
      console.error('Error creating annotation:', error);
      throw error;
    }
  }, [apiUrl]);

  /**
   * Update an existing annotation via the API
   */
  const updateAnnotation = useCallback(async (id: number, updates: UpdateAnnotation): Promise<Annotation> => {
    try {
      const result = await apiFetch<{ success: boolean; data: Annotation; error?: string }>(`${apiUrl}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to update annotation');
      }

      const updatedAnnotation: Annotation = result.data;

      // Find and update the existing feature
      const features = vectorSourceRef.current.getFeatures();
      const featureToUpdate = features.find((f) => f.get('id') === id);

      if (featureToUpdate) {
        // Update feature properties
        if (updates.title !== undefined) featureToUpdate.set('title', updates.title);
        if (updates.description !== undefined) featureToUpdate.set('description', updates.description);
        if (updates.category !== undefined) featureToUpdate.set('category', updates.category);
        if (updates.style_config !== undefined) featureToUpdate.set('styleConfig', updates.style_config);

        // Update geometry if provided
        if (updates.geometry) {
          const format = new GeoJSON();
          const geometry = format.readGeometry(updates.geometry) as Geometry;
          featureToUpdate.setGeometry(geometry);
        }

        featureToUpdate.changed();
      }

      return updatedAnnotation;
    } catch (error) {
      console.error('Error updating annotation:', error);
      throw error;
    }
  }, [apiUrl]);

  /**
   * Delete an annotation via the API
   */
  const deleteAnnotation = useCallback(async (id: number): Promise<void> => {
    try {
      const result = await apiFetch<{ success: boolean; error?: string }>(`${apiUrl}/${id}`, {
        method: 'DELETE',
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete annotation');
      }

      // Remove the feature from the map
      const features = vectorSourceRef.current.getFeatures();
      const featureToDelete = features.find((f) => f.get('id') === id);

      if (featureToDelete) {
        vectorSourceRef.current.removeFeature(featureToDelete);
      }
    } catch (error) {
      console.error('Error deleting annotation:', error);
      throw error;
    }
  }, [apiUrl]);

  /**
   * Add a feature to the vector source (used after drawing)
   */
  const addFeature = useCallback((feature: Feature) => {
    vectorSourceRef.current.addFeature(feature);
  }, []);

  /**
   * Remove a feature from the vector source
   */
  const removeFeature = useCallback((feature: Feature) => {
    vectorSourceRef.current.removeFeature(feature);
  }, []);

  return {
    vectorSource: vectorSourceRef.current,
    vectorLayer: vectorLayerRef.current,
    loadAnnotations,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    addFeature,
    removeFeature,
  };
}

/**
 * Convert API annotation to OpenLayers Feature
 */
function annotationToFeature(annotation: Annotation): Feature | null {
  try {
    const format = new GeoJSON();

    // Convert GeoJSON geometry to OpenLayers geometry
    const geometry = format.readGeometry(annotation.geometry);

    // Create feature with properties
    const feature = new Feature({
      geometry,
    });

    // Set all properties
    feature.setProperties({
      id: annotation.id,
      title: annotation.title,
      description: annotation.description,
      category: annotation.category,
      geometry_type: annotation.geometry_type,
      styleConfig: annotation.style_config,
      created_by: annotation.created_by,
      created_at: annotation.created_at,
      updated_at: annotation.updated_at,
      visible: true, // Default to visible
    });

    return feature;
  } catch (error) {
    console.error('Error converting annotation to feature:', error);
    return null;
  }
}
