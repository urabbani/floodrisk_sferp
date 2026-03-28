/**
 * useDrawingInteractions Hook
 *
 * Manages OpenLayers drawing interactions (Draw, Modify, Snap, Select)
 * for the annotation feature.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type Map from 'ol/Map';
import Draw from 'ol/interaction/Draw';
import Modify from 'ol/interaction/Modify';
import Snap from 'ol/interaction/Snap';
import Select from 'ol/interaction/Select';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { GeoJSON } from 'ol/format';
import type Feature from 'ol/Feature';
import type Geometry from 'ol/geom/Geometry';
import { Style, Circle, Fill, Stroke } from 'ol/style';
import type { DrawingTool } from '@/types/annotations';
import {
  annotationStyleFunction,
  vertexStyle,
  getDefaultFeatureProperties,
} from '../lib/styles';

interface UseDrawingInteractionsOptions {
  map: Map | null;
  vectorSource?: VectorSource; // External vector source to use for drawing
  onDrawStart?: () => void;
  onDrawEnd?: (feature: Feature) => void;
  onSelect?: (feature: Feature | null) => void;
  username?: string;
}

interface UseDrawingInteractionsReturn {
  activeTool: DrawingTool;
  setActiveTool: (tool: DrawingTool) => void;
  vectorSource: VectorSource;
  selectedFeature: Feature | null;
  setSelectedFeature: (feature: Feature | null) => void;
  deleteSelectedFeature: () => void;
  clearAllFeatures: () => void;
}

export function useDrawingInteractions({
  map,
  vectorSource: externalVectorSource,
  onDrawStart,
  onDrawEnd,
  onSelect,
  username = 'Anonymous',
}: UseDrawingInteractionsOptions): UseDrawingInteractionsReturn {
  const [activeTool, setActiveTool] = useState<DrawingTool>('none');
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);

  // Refs to track interactions
  const drawInteractionRef = useRef<Draw | null>(null);
  const modifyInteractionRef = useRef<Modify | null>(null);
  const snapInteractionRef = useRef<Snap | null>(null);
  const selectInteractionRef = useRef<Select | null>(null);

  // Use external vector source or create internal one
  const vectorSourceRef = useRef<VectorSource>(
    externalVectorSource ||
      new VectorSource({
        format: new GeoJSON(),
      })
  );

  const vectorSource = vectorSourceRef.current;

  /**
   * Remove all active interactions
   */
  const removeAllInteractions = useCallback(() => {
    if (!map) return;

    if (drawInteractionRef.current) {
      map.removeInteraction(drawInteractionRef.current);
      drawInteractionRef.current = null;
    }

    if (modifyInteractionRef.current) {
      map.removeInteraction(modifyInteractionRef.current);
      modifyInteractionRef.current = null;
    }

    if (snapInteractionRef.current) {
      map.removeInteraction(snapInteractionRef.current);
      snapInteractionRef.current = null;
    }

    if (selectInteractionRef.current) {
      map.removeInteraction(selectInteractionRef.current);
      selectInteractionRef.current = null;
    }
  }, [map]);

  /**
   * Update active tool by adding/removing interactions
   */
  useEffect(() => {
    if (!map || !vectorSource) return;

    // Remove all existing interactions first
    removeAllInteractions();

    // Clear selection when changing tools
    if (activeTool !== 'select') {
      setSelectedFeature(null);
      onSelect?.(null);
    }

    switch (activeTool) {
      case 'point':
      case 'line':
      case 'polygon': {
        const geometryType =
          activeTool === 'point' ? 'Point' : activeTool === 'line' ? 'LineString' : 'Polygon';

        const draw = new Draw({
          source: vectorSource,
          type: geometryType,
          style: new Style({
            image: new Circle({
              radius: 7,
              fill: new Fill({ color: '#0066ff' }),
              stroke: new Stroke({ color: '#ffffff', width: 2 }),
            }),
            stroke: new Stroke({ color: '#0066ff', width: 2 }),
            fill: new Fill({ color: 'rgba(0, 102, 255, 0.2)' }),
          }),
        });

        // Set default properties when drawing starts
        draw.on('drawstart', (event: { feature: Feature }) => {
          const feature = event.feature;
          const geometryType = feature.getGeometry()?.getType();
          const geomType = geometryType === 'Point' ? 'point' : geometryType === 'LineString' ? 'line' : 'polygon';
          feature.setProperties(getDefaultFeatureProperties(geomType, 'New Annotation', username));
          onDrawStart?.();
        });

        // Handle draw completion
        draw.on('drawend', (event: { feature: Feature }) => {
          const feature = event.feature;
          // Re-apply proper style
          feature.setStyle(annotationStyleFunction(feature));
          onDrawEnd?.(feature);
        });

        map.addInteraction(draw);
        drawInteractionRef.current = draw;
        break;
      }

      case 'modify': {
        const modify = new Modify({
          source: vectorSource,
          style: vertexStyle,
        });

        map.addInteraction(modify);
        modifyInteractionRef.current = modify;

        // Add snap for better editing experience
        const snap = new Snap({
          source: vectorSource,
          edge: true,
          vertex: true,
        });

        map.addInteraction(snap);
        snapInteractionRef.current = snap;
        break;
      }

      case 'select': {
        const select = new Select({
          source: vectorSource,
          style: (feature) => annotationStyleFunction(feature, true),
        });

        select.on('select', (event: { selected: Feature[] | null }) => {
          const features = event.selected;
          if (features && features.length > 0) {
            const feature = features[0];
            setSelectedFeature(feature);
            onSelect?.(feature);
          }
        });

        select.on('deselect', () => {
          setSelectedFeature(null);
          onSelect?.(null);
        });

        map.addInteraction(select);
        selectInteractionRef.current = select;
        break;
      }

      case 'none':
      default:
        // No interactions
        break;
    }

    // Cleanup function
    return () => {
      removeAllInteractions();
    };
  }, [map, activeTool, username, onDrawStart, onDrawEnd, onSelect, removeAllInteractions, vectorSource]);

  /**
   * Delete the currently selected feature
   */
  const deleteSelectedFeature = useCallback(() => {
    if (!selectedFeature || !vectorSource) return;

    vectorSource.removeFeature(selectedFeature);
    setSelectedFeature(null);
    onSelect?.(null);
  }, [selectedFeature, onSelect, vectorSource]);

  /**
   * Clear all features from the vector source
   */
  const clearAllFeatures = useCallback(() => {
    if (!vectorSource) return;
    vectorSource.clear();
    setSelectedFeature(null);
    onSelect?.(null);
  }, [onSelect, vectorSource]);

  return {
    activeTool,
    setActiveTool,
    vectorSource,
    selectedFeature,
    setSelectedFeature,
    deleteSelectedFeature,
    clearAllFeatures,
  };
}
