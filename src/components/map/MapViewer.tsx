import { useEffect, useRef, useCallback, useState } from 'react';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';
import XYZ from 'ol/source/XYZ';
import { get as getProjection } from 'ol/proj';
import { register } from 'ol/proj/proj4';
import proj4 from 'proj4';
import 'ol/ol.css';
import type { LayerInfo, GeometryType } from '@/types/layers';
import { GEOSERVER_CONFIG, MAP_CONFIG, baseMaps } from '@/config/layers';
import { defaults as defaultControls } from 'ol/control';

// Register UTM Zone 42N projection (EPSG:32642)
proj4.defs(
  'EPSG:32642',
  '+proj=utm +zone=42 +datum=WGS84 +units=m +no_defs'
);
register(proj4);

// Z-index priority based on geometry type - FIXED: Higher values = top layers
const Z_INDEX_PRIORITY: Record<GeometryType, number> = {
  raster: 10,      // Flood layers - bottom
  polygon: 50,     // Areas, boundaries
  line: 100,       // Canals, drains
  point: 150,      // Survey points - top
};

// Get base z-index for geometry type - FIXED: Stable, no array index
function getZIndexForGeometryType(geometryType?: GeometryType): number {
  if (!geometryType) return 50; // Default to polygon level
  return Z_INDEX_PRIORITY[geometryType] || 50;
}

interface MapViewerProps {
  visibleLayers: LayerInfo[];
  onMapClick?: (coordinate: number[]) => void;
}

export function MapViewer({ visibleLayers, onMapClick }: MapViewerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const layerRefs = useRef<globalThis.Map<string, TileLayer<TileWMS>>>(new globalThis.Map());
  const layerOpacitiesRef = useRef<Record<string, number>>({});
  const baseLayerRefs = useRef<globalThis.Map<string, TileLayer<XYZ>>>(new globalThis.Map());
  const [activeBaseMap, setActiveBaseMap] = useState('satellite');
  const initializedRef = useRef(false);

  // Initialize map (only once)
  useEffect(() => {
    if (initializedRef.current || !mapRef.current) return;
    initializedRef.current = true;

    const projection = getProjection(MAP_CONFIG.projection);
    if (!projection) {
      console.error('Projection not found:', MAP_CONFIG.projection);
      return;
    }

    // Create base layers - FIXED: zIndex -1 to ensure below all data layers
    baseMaps.forEach((bm) => {
      const layer = new TileLayer({
        source: new XYZ({
          url: bm.url,
          attributions: bm.id === 'satellite' ? '© Google' : '© OpenStreetMap',
        }),
        visible: bm.visible,
        zIndex: -1, // FIXED: Always below data layers
      });
      baseLayerRefs.current.set(bm.id, layer);
    });

    const map = new Map({
      target: mapRef.current,
      layers: Array.from(baseLayerRefs.current.values()),
      view: new View({
        projection,
        extent: MAP_CONFIG.extent,
      }),
      controls: [],
    });

    // Fit view to extent on initialization
    const view = map.getView();
    if (view && MAP_CONFIG.extent) {
      view.fit(MAP_CONFIG.extent, { padding: [50, 50, 50, 50] });
    }

    map.on('click', (event) => {
      event.stopPropagation();
      onMapClick?.(event.coordinate);
    });

    map.getViewport().addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    mapInstance.current = map;

    return () => {
      map.setTarget(undefined);
      mapInstance.current = null;
      initializedRef.current = false;
    };
  }, [onMapClick]);

  // Update WMS layers when visible layers change - FIXED: No recreation on opacity change
  useEffect(() => {
    if (!mapInstance.current) return;

    const map = mapInstance.current;
    const currentLayerIds = new Set(visibleLayers.map((l) => l.id));

    // Remove layers that are no longer visible
    Array.from(layerRefs.current.entries()).forEach(([id, layer]) => {
      if (!currentLayerIds.has(id)) {
        map.removeLayer(layer);
        layerRefs.current.delete(id);
        delete layerOpacitiesRef.current[id];
      }
    });

    // Add new layers or update existing ones
    visibleLayers.forEach((layerInfo) => {
      const existingLayer = layerRefs.current.get(layerInfo.id);
      
      // FIXED: Stable z-index calculation (no array index)
      const zIndex = getZIndexForGeometryType(layerInfo.geometryType);

      if (!existingLayer) {
        // Create new WMS layer
        layerOpacitiesRef.current[layerInfo.id] = layerInfo.opacity;

        const wmsLayer = new TileLayer({
          source: new TileWMS({
            url: `${GEOSERVER_CONFIG.baseUrl}/${layerInfo.workspace}/wms`,
            params: {
              LAYERS: `${layerInfo.workspace}:${layerInfo.geoserverName}`,
              TILED: true,
              VERSION: GEOSERVER_CONFIG.wmsVersion,
              FORMAT: 'image/png',
              TRANSPARENT: true,
            },
            serverType: 'geoserver',
            transition: 0,
          }),
          opacity: layerInfo.opacity,
          zIndex,
          visible: true,
        });

        map.addLayer(wmsLayer);
        layerRefs.current.set(layerInfo.id, wmsLayer);
      } else {
        // FIXED: Update opacity without recreating layer
        const currentOpacity = layerInfo.opacity;
        const previousOpacity = layerOpacitiesRef.current[layerInfo.id];
        
        if (previousOpacity === undefined || Math.abs(previousOpacity - currentOpacity) > 0.01) {
          existingLayer.setOpacity(currentOpacity);
          layerOpacitiesRef.current[layerInfo.id] = currentOpacity;
        }
        
        // Update z-index if needed
        existingLayer.setZIndex(zIndex);
      }
    });
  }, [visibleLayers]);

  // Switch base map
  const switchBaseMap = useCallback((baseMapId: string) => {
    setActiveBaseMap(baseMapId);
    baseLayerRefs.current.forEach((layer, id) => {
      layer.setVisible(id === baseMapId);
    });
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div ref={mapRef} className="w-full h-full overflow-hidden" />

      {/* Base map switcher */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-2 z-10">
        <div className="flex flex-col gap-1">
          {baseMaps.map((bm) => (
            <button
              key={bm.id}
              onClick={() => switchBaseMap(bm.id)}
              className={`px-3 py-1.5 text-xs rounded transition-colors text-left ${
                activeBaseMap === bm.id
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              {bm.name}
            </button>
          ))}
        </div>
      </div>

      {/* Attribution */}
      <div className="absolute bottom-1 left-8 text-[10px] text-slate-500 bg-white/70 px-1 rounded">
        {activeBaseMap === 'satellite' ? '© Google' : '© OpenStreetMap'}
      </div>
    </div>
  );
}
