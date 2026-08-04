/**
 * SchemaInterventionsPanel — read-only browser for the GeoServer WFS
 * `interventions` layers. Lists the 5 layers as an accordion; each layer can
 * be toggled onto the map (eye) and expanded to browse its features.
 *
 * Replaces the annotation-based InterventionPanel in the Interventions tab.
 */

import { useCallback, useState } from 'react';
import type Map from 'ol/Map';
import {
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  MapPin,
  Minus,
  Pentagon,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  INTERVENTION_LAYERS,
  featureLabel,
  featureSecondary,
  type InterventionLayer,
} from '@/types/interventions-schema';
import { useInterventionWfs, type SchemaFeatureCollection } from '@/hooks/useInterventionWfs';
import { useSchemaLayer } from './hooks/useSchemaLayer';

interface SchemaInterventionsPanelProps {
  map: Map | null;
}

const GEOMETRY_ICON = {
  point: MapPin,
  line: Minus,
  polygon: Pentagon,
} as const;

export function SchemaInterventionsPanel({ map }: SchemaInterventionsPanelProps) {
  const { getFeatures, loadingKey, errors, counts } = useInterventionWfs();
  const { showLayer, hideLayer, isLayerShown, zoomToFeature } = useSchemaLayer({ map });

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [visibleOnMap, setVisibleOnMap] = useState<Record<string, boolean>>({});
  const [featureData, setFeatureData] = useState<Record<string, SchemaFeatureCollection>>({});
  const [selected, setSelected] = useState<{ key: string; id: string | number } | null>(null);

  const loadFeatures = useCallback(
    async (key: string): Promise<SchemaFeatureCollection | null> => {
      const cached = featureData[key];
      if (cached) return cached;
      const collection = await getFeatures(key);
      if (collection) {
        setFeatureData((prev) => ({ ...prev, [key]: collection }));
      }
      return collection;
    },
    [featureData, getFeatures],
  );

  const toggleExpand = useCallback(
    async (layer: InterventionLayer) => {
      const isExpanded = expanded[layer.key];
      setExpanded((prev) => ({ ...prev, [layer.key]: !prev[layer.key] }));
      if (!isExpanded) {
        await loadFeatures(layer.key);
      }
    },
    [expanded, loadFeatures],
  );

  const toggleEye = useCallback(
    async (layer: InterventionLayer) => {
      const currentlyOn = visibleOnMap[layer.key] && isLayerShown(layer.key);
      if (currentlyOn) {
        hideLayer(layer.key);
        setVisibleOnMap((prev) => ({ ...prev, [layer.key]: false }));
        if (selected?.key === layer.key) setSelected(null);
      } else {
        const collection = await loadFeatures(layer.key);
        if (collection) {
          showLayer(layer, collection);
          setVisibleOnMap((prev) => ({ ...prev, [layer.key]: true }));
        }
      }
    },
    [visibleOnMap, isLayerShown, hideLayer, loadFeatures, showLayer, selected],
  );

  const handleRowClick = useCallback(
    async (layer: InterventionLayer, id: string | number) => {
      // Ensure the layer is on the map before zooming (otherwise zoom is a no-op).
      if (!isLayerShown(layer.key)) {
        const collection = await loadFeatures(layer.key);
        if (collection) {
          showLayer(layer, collection);
          setVisibleOnMap((prev) => ({ ...prev, [layer.key]: true }));
        }
      }
      setSelected({ key: layer.key, id });
      zoomToFeature(layer.key, id);
    },
    [isLayerShown, loadFeatures, showLayer, zoomToFeature],
  );

  const countFor = (key: string): number | undefined =>
    counts[key] ?? featureData[key]?.features.length;

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-slate-200">
        <p className="text-sm font-medium text-slate-700">Intervention Datasets</p>
        <p className="text-xs text-slate-500 mt-0.5">
          Flood-mitigation interventions. Toggle the eye to show on the map; click a row to zoom.
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="divide-y divide-slate-100">
          {INTERVENTION_LAYERS.map((layer) => {
            const Icon = GEOMETRY_ICON[layer.geometryType];
            const isExpanded = expanded[layer.key];
            const isOn = visibleOnMap[layer.key] && isLayerShown(layer.key);
            const isLoading = loadingKey === layer.key;
            const error = errors[layer.key];
            const collection = featureData[layer.key];
            const count = countFor(layer.key);

            return (
              <div key={layer.key}>
                {/* Layer header */}
                <div
                  className="flex items-center gap-2 p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => toggleExpand(layer)}
                  role="button"
                  tabIndex={0}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleEye(layer);
                    }}
                    className="text-slate-400 hover:text-slate-700 flex-shrink-0"
                    title={isOn ? 'Hide on map' : 'Show on map'}
                    aria-label={isOn ? 'Hide on map' : 'Show on map'}
                  >
                    {isOn ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: layer.color }}
                  />

                  <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-slate-800 truncate">
                        {layer.displayName}
                      </h4>
                      {count !== undefined && (
                        <span className="text-xs text-slate-400">({count})</span>
                      )}
                    </div>
                  </div>

                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  )}
                </div>

                {/* Expanded feature list */}
                {isExpanded && (
                  <div className="bg-slate-50/50">
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading…
                      </div>
                    ) : error ? (
                      <div className="flex items-center gap-2 px-4 py-3 text-sm text-red-600">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{error}</span>
                      </div>
                    ) : !collection || collection.features.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-slate-500">No features.</div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {collection.features.map((feature) => {
                          const id = feature.id ?? 0;
                          const isSelected =
                            selected?.key === layer.key && String(selected.id) === String(id);
                          const label = featureLabel(feature.properties);
                          const secondary = featureSecondary(feature.properties);

                          return (
                            <div
                              key={String(id)}
                              className={cn(
                                'flex items-start gap-2 px-4 py-2.5 hover:bg-white cursor-pointer transition-colors',
                                isSelected && 'bg-blue-50',
                              )}
                              onClick={() => handleRowClick(layer, id)}
                              role="button"
                              tabIndex={0}
                            >
                              <div
                                className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                                style={{ backgroundColor: layer.color }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-700 truncate">{label}</p>
                                {secondary && (
                                  <p className="text-xs text-slate-400 truncate">{secondary}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
