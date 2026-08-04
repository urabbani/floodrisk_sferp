/**
 * useSchemaLayer — read-only OpenLayers vector layer for the WFS intervention
 * layers. Mirrors useChoroplethLayer: a single VectorLayer added directly to
 * the OL map, features read in EPSG:32642 (no reprojection).
 *
 * Supports multiple layers, per-layer show/hide, feature zoom-to + highlight.
 */

import { useCallback, useEffect, useRef } from 'react';
import type Map from 'ol/Map';
import type { Feature } from 'ol';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { GeoJSON } from 'ol/format';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import Circle from 'ol/style/Circle';
import {
  INTERVENTION_LAYER_BY_KEY,
  type InterventionLayer,
  type SchemaGeometryType,
} from '@/types/interventions-schema';
import type { SchemaFeatureCollection } from '@/hooks/useInterventionWfs';

interface UseSchemaLayerOptions {
  map: Map | null;
}

const SELECTED_STROKE_WIDTH = 4;

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Build the OL style for a feature given its layer colour + geometry type. */
function buildStyle(
  color: string,
  geometryType: SchemaGeometryType,
  selected: boolean,
): Style {
  const width = selected ? SELECTED_STROKE_WIDTH : 2;

  switch (geometryType) {
    case 'point':
      return new Style({
        image: new Circle({
          radius: selected ? 8 : 6,
          fill: new Fill({ color }),
          stroke: new Stroke({ color: '#ffffff', width: 2 }),
        }),
      });
    case 'line':
      return new Style({
        stroke: new Stroke({ color, width: selected ? width + 1 : 3 }),
      });
    case 'polygon':
    default:
      return new Style({
        fill: new Fill({ color: hexToRgba(color, selected ? 0.55 : 0.3) }),
        stroke: new Stroke({ color, width }),
      });
  }
}

export function useSchemaLayer({ map }: UseSchemaLayerOptions) {
  const sourceRef = useRef(new VectorSource({ format: new GeoJSON() }));
  const layerRef = useRef<VectorLayer | null>(null);
  const selectedRef = useRef<{ key: string; id: string | number } | null>(null);
  const loadedKeysRef = useRef<Set<string>>(new Set());

  // Create and add the layer to the map once.
  useEffect(() => {
    if (!map || layerRef.current) return;

    const styleFn = (feature: Feature) => {
      if (feature.get('visible') === false) return null;

      const key = feature.get('layerKey') as string | undefined;
      const layer = key ? INTERVENTION_LAYER_BY_KEY[key] : undefined;
      if (!layer) return null;

      const selected =
        selectedRef.current?.key === key &&
        String(selectedRef.current.id) === String(feature.get('featureId'));

      return buildStyle(layer.color, layer.geometryType, selected);
    };

    const layer = new VectorLayer({
      source: sourceRef.current,
      zIndex: 175,
      visible: true,
      style: styleFn,
    });

    map.addLayer(layer);
    layerRef.current = layer;

    return () => {
      map.removeLayer(layer);
      layerRef.current = null;
      loadedKeysRef.current.clear();
      sourceRef.current.clear();
      selectedRef.current = null;
    };
  }, [map]);

  const refresh = useCallback(() => {
    sourceRef.current.changed();
    layerRef.current?.changed();
  }, []);

  /** Add (or replace) a layer's features on the map. */
  const showLayer = useCallback(
    (layer: InterventionLayer, collection: SchemaFeatureCollection) => {
      const format = new GeoJSON({
        dataProjection: 'EPSG:32642',
        featureProjection: 'EPSG:32642',
      });

      // Remove any previously-loaded features for this layer first.
      const existing = sourceRef.current.getFeatures();
      existing.forEach((f) => {
        if (f.get('layerKey') === layer.key) {
          sourceRef.current.removeFeature(f);
        }
      });

      const features = format.readFeatures(collection) as Feature[];
      features.forEach((f, index) => {
        const rawId = collection.features[index]?.id ?? index;
        f.set('layerKey', layer.key);
        f.set('featureId', rawId);
        f.set('visible', true);
      });
      sourceRef.current.addFeatures(features);
      loadedKeysRef.current.add(layer.key);
      refresh();
    },
    [refresh],
  );

  /** Remove a layer's features from the map. */
  const hideLayer = useCallback(
    (key: string) => {
      const existing = sourceRef.current.getFeatures();
      existing.forEach((f) => {
        if (f.get('layerKey') === key) {
          sourceRef.current.removeFeature(f);
        }
      });
      loadedKeysRef.current.delete(key);
      if (selectedRef.current?.key === key) selectedRef.current = null;
      refresh();
    },
    [refresh],
  );

  /** Is a layer currently rendered on the map? */
  const isLayerShown = useCallback(
    (key: string) => loadedKeysRef.current.has(key),
    [],
  );

  /** Zoom to a feature and highlight it. */
  const zoomToFeature = useCallback(
    (key: string, id: string | number) => {
      const targetMap = map;
      if (!targetMap) return;

      const feature = sourceRef.current
        .getFeatures()
        .find(
          (f) =>
            f.get('layerKey') === key &&
            String(f.get('featureId')) === String(id),
        );

      if (!feature) return;

      const geometry = feature.getGeometry();
      if (!geometry) return;

      selectedRef.current = { key, id };
      targetMap.getView().fit(geometry.getExtent(), {
        padding: [80, 80, 80, 80],
        maxZoom: 16,
        duration: 500,
      });
      refresh();
    },
    [map, refresh],
  );

  /** Clear all rendered features (e.g. on unmount / view switch). */
  const clear = useCallback(() => {
    sourceRef.current.clear();
    loadedKeysRef.current.clear();
    selectedRef.current = null;
    refresh();
  }, [refresh]);

  return { showLayer, hideLayer, isLayerShown, zoomToFeature, clear };
}
