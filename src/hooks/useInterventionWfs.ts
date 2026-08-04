/**
 * useInterventionWfs — loads the GeoServer WFS intervention layers with caching.
 *
 * One fetch per layer, cached in a ref so re-expanding never re-requests.
 * Geometries arrive in EPSG:32642 (map projection).
 */

import { useCallback, useRef, useState } from 'react';
import {
  INTERVENTION_LAYERS,
  buildWfsUrl,
} from '@/types/interventions-schema';

/** Minimal GeoJSON FeatureCollection shape returned by GeoServer WFS JSON. */
export interface SchemaFeatureCollection {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    id?: string | number;
    geometry: { type: string; coordinates: unknown } | null;
    geometry_name?: string;
    properties: Record<string, unknown> | null;
  }>;
  totalFeatures?: number;
}

export function useInterventionWfs() {
  const cacheRef = useRef<Map<string, SchemaFeatureCollection>>(new Map());
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});

  const getFeatures = useCallback(
    async (key: string): Promise<SchemaFeatureCollection | null> => {
      const cached = cacheRef.current.get(key);
      if (cached) return cached;

      const layer = INTERVENTION_LAYERS.find((l) => l.key === key);
      if (!layer) return null;

      setLoadingKey(key);
      setErrors((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });

      try {
        const response = await fetch(buildWfsUrl(layer.typeName));
        if (!response.ok) {
          throw new Error(`WFS request failed: HTTP ${response.status}`);
        }
        const collection = (await response.json()) as SchemaFeatureCollection;
        cacheRef.current.set(key, collection);
        if (typeof collection.totalFeatures === 'number') {
          setCounts((prev) => ({
            ...prev,
            [key]: collection.totalFeatures as number,
          }));
        }
        return collection;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setErrors((prev) => ({ ...prev, [key]: message }));
        return null;
      } finally {
        setLoadingKey(null);
      }
    },
    [],
  );

  return {
    layers: INTERVENTION_LAYERS,
    getFeatures,
    loadingKey,
    errors,
    counts,
  };
}
