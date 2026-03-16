import { useEffect, useRef, useCallback, useState } from 'react';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';
import XYZ from 'ol/source/XYZ';
import { get as getProjection, toLonLat } from 'ol/proj';
import { register } from 'ol/proj/proj4';
import proj4 from 'proj4';
import { Compass, Copy } from 'lucide-react';
import 'ol/ol.css';
import type { LayerInfo, GeometryType } from '@/types/layers';
import { GEOSERVER_CONFIG, MAP_CONFIG, baseMaps } from '@/config/layers';

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
  visibleLayerIds: string[];
  allLayers: LayerInfo[];
  layerOpacities: Record<string, number>;
  onMapClick?: (coordinate: number[], pixel: number[]) => void;
}

export function MapViewer({ visibleLayerIds, allLayers, layerOpacities, onMapClick }: MapViewerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const layerRefs = useRef<globalThis.Map<string, TileLayer<TileWMS>>>(new globalThis.Map());
  const layerOpacitiesRef = useRef<Record<string, number>>({});
  const baseLayerRefs = useRef<globalThis.Map<string, TileLayer<XYZ>>>(new globalThis.Map());
  const onMapClickRef = useRef(onMapClick);
  const [activeBaseMap, setActiveBaseMap] = useState('satellite');
  const [rotation, setRotation] = useState(0);
  const [mousePosition, setMousePosition] = useState<{ utm: string; latlon: string } | null>(null);
  const [copied, setCopied] = useState(false);
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
      }),
      controls: [],
    });

    console.log('[MapViewer] Map initialized. Base layers:', baseLayerRefs.current.size);
    console.log('[MapViewer] Initial map layer count:', map.getLayers().getLength());

    // Fit view to extent on initialization
    const view = map.getView();
    if (view && MAP_CONFIG.extent) {
      view.fit(MAP_CONFIG.extent, { padding: [50, 50, 50, 50] });
    }

    mapInstance.current = map;

    map.on('click', (event) => {
      event.stopPropagation();
      onMapClickRef.current?.(event.coordinate, event.pixel);
    });

    map.getViewport().addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    // Track map rotation for north arrow
    const updateRotation = () => {
      const view = map.getView();
      if (view) {
        const rotation = view.getRotation() || 0;
        setRotation(-rotation * (180 / Math.PI)); // Convert to degrees, negate for compass
      }
    };
    updateRotation();
    view.on('change:rotation', updateRotation);

    return () => {
      map.setTarget(undefined);
      mapInstance.current = null;
      initializedRef.current = false;
    };
  }, []); // Empty deps - initialize map ONLY once

  // Update the click handler ref when onMapClick changes
  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  // Track previous visible layer IDs to detect add/remove operations
  const prevVisibleIdsRef = useRef<Set<string>>(new Set());

  // Manage layer add/remove when visibleLayerIds changes
  // NOTE: Deliberately NOT including allLayers or layerOpacities in dependencies
  // to prevent removing/re-adding layers when those change. Layer properties should
  // be updated in-place, not by recreating layers.
  useEffect(() => {
    if (!mapInstance.current) return;

    const map = mapInstance.current;
    const currentLayerIds = new Set(visibleLayerIds);
    const previousLayerIds = prevVisibleIdsRef.current;

    console.log('[MapViewer] Layer management effect triggered');
    console.log('[MapViewer] Previous visible IDs:', Array.from(previousLayerIds));
    console.log('[MapViewer] Current visible IDs:', Array.from(currentLayerIds));
    console.log('[MapViewer] Layers in layerRefs BEFORE:', Array.from(layerRefs.current.keys()));

    // Check if the set of visible layers has changed
    const layersChanged =
      currentLayerIds.size !== previousLayerIds.size ||
      Array.from(currentLayerIds).some((id) => !previousLayerIds.has(id)) ||
      Array.from(previousLayerIds).some((id) => !currentLayerIds.has(id));

    if (!layersChanged) {
      console.log('[MapViewer] No layers changed, returning');
      return;
    }

    prevVisibleIdsRef.current = currentLayerIds;

    // Remove layers that are no longer visible
    console.log('[MapViewer] Checking for layers to remove...');
    Array.from(layerRefs.current.entries()).forEach(([id, layer]) => {
      if (!currentLayerIds.has(id)) {
        console.log(`[MapViewer] Removing layer: ${id}`);
        map.removeLayer(layer);
        layerRefs.current.delete(id);
        delete layerOpacitiesRef.current[id];
      }
    });

    console.log('[MapViewer] Layers in layerRefs AFTER removal:', Array.from(layerRefs.current.keys()));

    // Add new layers
    console.log('[MapViewer] Adding new layers...');
    visibleLayerIds.forEach((layerId) => {
      if (!layerRefs.current.has(layerId)) {
        const layerInfo = allLayers.find((l) => l.id === layerId);
        if (!layerInfo) {
          console.warn(`[MapViewer] Layer not found in allLayers: ${layerId}`);
          console.log('[MapViewer] Available layers:', allLayers.map(l => l.id));
          return;
        }

        const zIndex = getZIndexForGeometryType(layerInfo.geometryType);
        const opacity = layerOpacities[layerId] ?? layerInfo.opacity;
        layerOpacitiesRef.current[layerId] = opacity;

        console.log(`[MapViewer] Adding layer: ${layerId}`, {
          workspace: layerInfo.workspace,
          geoserverName: layerInfo.geoserverName,
          geometryType: layerInfo.geometryType,
          zIndex,
          opacity
        });

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
          opacity,
          zIndex,
          visible: true,
        });

        console.log(`[MapViewer] WMS URL will be: ${GEOSERVER_CONFIG.baseUrl}/${layerInfo.workspace}/wms?LAYERS=${layerInfo.workspace}:${layerInfo.geoserverName}`);

        map.addLayer(wmsLayer);
        layerRefs.current.set(layerId, wmsLayer);
        console.log(`[MapViewer] Layer added to map. Total layers: ${map.getLayers().getLength()}`);
      } else {
        console.log(`[MapViewer] Layer ${layerId} already exists in layerRefs, skipping`);
      }
    });

    console.log('[MapViewer] Final layers in layerRefs:', Array.from(layerRefs.current.keys()));
    console.log('[MapViewer] Final map layer count:', map.getLayers().getLength());

    // Debug: List all layers in the map
    const mapLayers = map.getLayers();
    console.log('[MapViewer] All map layers:');
    mapLayers.forEach((layer, index) => {
      const visible = layer.getVisible();
      const zIndex = layer.getZIndex();
      console.log(`  [${index}] zIndex=${zIndex}, visible=${visible}`);
    });
  }, [visibleLayerIds]);

  // Update opacity for existing layers when layerOpacities changes
  // NOTE: We DON'T update z-index here because it's set when layers are created
  useEffect(() => {
    if (!mapInstance.current) return;

    console.log('[MapViewer] Opacity effect triggered');
    console.log('[MapViewer] visibleLayerIds:', visibleLayerIds);
    console.log('[MapViewer] layerRefs keys:', Array.from(layerRefs.current.keys()));

    visibleLayerIds.forEach((layerId) => {
      const layer = layerRefs.current.get(layerId);
      const layerInfo = allLayers.find((l) => l.id === layerId);
      if (!layer) {
        console.warn(`[MapViewer] Opacity effect: Layer ${layerId} not found in layerRefs`);
        return;
      }
      if (!layerInfo) {
        console.warn(`[MapViewer] Opacity effect: Layer ${layerId} not found in allLayers`);
        return;
      }

      const currentOpacity = layerOpacities[layerId] ?? layerInfo.opacity;
      const previousOpacity = layerOpacitiesRef.current[layerId];

      if (previousOpacity === undefined || Math.abs(previousOpacity - currentOpacity) > 0.01) {
        console.log(`[MapViewer] Updating opacity for ${layerId}: ${previousOpacity} → ${currentOpacity}`);
        layer.setOpacity(currentOpacity);
        layerOpacitiesRef.current[layerId] = currentOpacity;
      }
    });
  }, [visibleLayerIds, layerOpacities, allLayers]);

  // Switch base map
  const switchBaseMap = useCallback((baseMapId: string) => {
    setActiveBaseMap(baseMapId);
    baseLayerRefs.current.forEach((layer, id) => {
      layer.setVisible(id === baseMapId);
    });
  }, []);

  // Track mouse position for coordinate display
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    const pointerMove = (evt: any) => {
      const coord = evt.coordinate;
      if (!coord) return;

      // UTM coordinates
      const utmX = coord[0].toFixed(0);
      const utmY = coord[1].toFixed(0);

      // Convert to lat/lon
      const [lon, lat] = toLonLat(coord, 'EPSG:32642');
      const latStr = Math.abs(lat).toFixed(5) + (lat >= 0 ? '°N' : '°S');
      const lonStr = Math.abs(lon).toFixed(5) + (lon >= 0 ? '°E' : '°W');

      setMousePosition({
        utm: `E: ${utmX} N: ${utmY}`,
        latlon: `${latStr}, ${lonStr}`,
      });
    };

    map.on('pointermove', pointerMove);

    return () => {
      map.un('pointermove', pointerMove);
    };
  }, []);

  // Copy coordinates to clipboard
  const copyCoordinates = useCallback(() => {
    if (!mousePosition) return;

    // Try modern Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(mousePosition.utm).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
      return;
    }

    // Fallback for older browsers or non-secure contexts
    const textArea = document.createElement('textarea');
    textArea.value = mousePosition.utm;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
    document.body.removeChild(textArea);
  }, [mousePosition]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div ref={mapRef} className="w-full h-full overflow-hidden" />

      {/* North arrow */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full shadow-lg p-2 z-10">
        <Compass
          className="w-6 h-6 text-slate-700"
          style={{ transform: `rotate(${rotation}deg)` }}
        />
        <div className="text-[10px] font-semibold text-slate-700 text-center mt-0.5">N</div>
      </div>

      {/* Attribution */}
      <div className="absolute bottom-1 left-8 text-[10px] text-slate-500 bg-white/70 px-1 rounded">
        {activeBaseMap === 'satellite' ? '© Google' : '© OpenStreetMap'}
      </div>

      {/* Base map switcher */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-2 z-10">
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

      {/* Coordinate Display */}
      {mousePosition && (
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 z-10">
          <div className="flex items-center gap-3">
            <div className="text-xs">
              <div className="font-mono text-slate-700">{mousePosition.utm}</div>
              <div className="text-slate-500">{mousePosition.latlon}</div>
            </div>
            <button
              onClick={copyCoordinates}
              className="p-1 hover:bg-slate-100 rounded transition-colors"
              title={copied ? 'Copied!' : 'Copy coordinates'}
            >
              <Copy className="w-3 h-3 text-slate-500" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
