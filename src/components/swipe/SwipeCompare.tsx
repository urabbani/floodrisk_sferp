import { useState, useRef, useEffect, useCallback } from 'react';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';
import XYZ from 'ol/source/XYZ';
import { get as getProjection } from 'ol/proj';
import { register } from 'ol/proj/proj4';
import proj4 from 'proj4';
import { Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import 'ol/ol.css';
import type { LayerInfo } from '@/types/layers';
import { GEOSERVER_CONFIG, MAP_CONFIG, baseMaps, layerTree } from '@/config/layers';
import { cn } from '@/lib/utils';
import type { LayerGroup } from '@/types/layers';
import { isLayerGroup } from '@/types/layers';

// Register UTM Zone 42N projection (EPSG:32642)
proj4.defs(
  'EPSG:32642',
  '+proj=utm +zone=42 +datum=WGS84 +units=m +no_defs'
);
register(proj4);

interface SwipeCompareProps {
  onClose: () => void;
}

interface LayerWithPath extends LayerInfo {
  path: string[];
}

// Recursively collect all raster layers with their group path
function collectLayersWithPath(tree: LayerGroup, path: string[] = []): LayerWithPath[] {
  const layers: LayerWithPath[] = [];

  const traverse = (node: LayerGroup | LayerInfo, currentPath: string[]) => {
    if (isLayerGroup(node)) {
      node.children.forEach((child) => traverse(child, [...currentPath, node.name]));
    } else {
      if (node.geometryType === 'raster') {
        layers.push({ ...node, path: currentPath });
      }
    }
  };

  traverse(tree, path);
  return layers;
}

interface SwipePosition {
  x: number;
  percentage: number;
}

export function SwipeCompare({ onClose }: SwipeCompareProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftMapRef = useRef<HTMLDivElement>(null);
  const rightMapRef = useRef<HTMLDivElement>(null);
  const leftMapInstance = useRef<Map | null>(null);
  const rightMapInstance = useRef<Map | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [swipePosition, setSwipePosition] = useState<SwipePosition>({ x: 50, percentage: 50 });
  const [leftLayerId, setLeftLayerId] = useState<string>('');
  const [rightLayerId, setRightLayerId] = useState<string>('');
  const initializedRef = useRef(false);

  // Collect raster layers with their paths - computed once, stored in ref
  const rasterLayersRef = useRef<LayerWithPath[]>([]);

  // Initialize raster layers ref
  useEffect(() => {
    rasterLayersRef.current = collectLayersWithPath(layerTree);
  }, []);

  // Initialize maps
  useEffect(() => {
    if (initializedRef.current || !leftMapRef.current || !rightMapRef.current) return;

    const projection = getProjection(MAP_CONFIG.projection);
    if (!projection) {
      console.error('Projection not found:', MAP_CONFIG.projection);
      return;
    }

    // Create base layers for left map
    const leftBaseLayers = baseMaps.map((bm) =>
      new TileLayer({
        source: new XYZ({
          url: bm.url,
          attributions: bm.id === 'satellite' ? '© Google' : '© OpenStreetMap',
        }),
        visible: bm.visible,
        zIndex: -1,
      })
    );

    // Create base layers for right map
    const rightBaseLayers = baseMaps.map((bm) =>
      new TileLayer({
        source: new XYZ({
          url: bm.url,
          attributions: bm.id === 'satellite' ? '© Google' : '© OpenStreetMap',
        }),
        visible: bm.visible,
        zIndex: -1,
      })
    );

    // Create left map
    const leftMap = new Map({
      target: leftMapRef.current,
      layers: leftBaseLayers,
      view: new View({ projection }),
      controls: [],
    });

    // Create right map
    const rightMap = new Map({
      target: rightMapRef.current,
      layers: rightBaseLayers,
      view: new View({ projection }),
      controls: [],
    });

    // Fit both views to extent
    if (MAP_CONFIG.extent) {
      leftMap.getView()?.fit(MAP_CONFIG.extent, { padding: [50, 50, 50, 50] });
      rightMap.getView()?.fit(MAP_CONFIG.extent, { padding: [50, 50, 50, 50] });
    }

    // Sync views
    let syncingLeft = false;
    let syncingRight = false;

    leftMap.on('moveend', () => {
      if (!syncingLeft) {
        syncingRight = true;
        const leftView = leftMap.getView();
        const rightView = rightMap.getView();
        if (leftView && rightView) {
          rightView.setCenter(leftView.getCenter());
          rightView.setZoom(leftView.getZoom() || 10);
          rightView.setRotation(leftView.getRotation() || 0);
        }
        syncingRight = false;
      }
    });

    rightMap.on('moveend', () => {
      if (!syncingRight) {
        syncingLeft = true;
        const leftView = leftMap.getView();
        const rightView = rightMap.getView();
        if (leftView && rightView) {
          leftView.setCenter(rightView.getCenter());
          leftView.setZoom(rightView.getZoom() || 10);
          leftView.setRotation(rightView.getRotation() || 0);
        }
        syncingLeft = false;
      }
    });

    leftMapInstance.current = leftMap;
    rightMapInstance.current = rightMap;
    initializedRef.current = true;

    // Set default layers after initialization
    const rasterLayers = rasterLayersRef.current;
    if (rasterLayers.length >= 2) {
      setLeftLayerId(rasterLayers[0].id);
      setRightLayerId(rasterLayers[1].id);
    }

    return () => {
      leftMap.setTarget(undefined);
      rightMap.setTarget(undefined);
      initializedRef.current = false;
    };
  }, []); // Empty deps - run only once

  // Update left layer when selection changes
  useEffect(() => {
    if (!leftMapInstance.current || !leftLayerId) return;

    const map = leftMapInstance.current;
    const layerInfo = rasterLayersRef.current.find(l => l.id === leftLayerId);
    if (!layerInfo) return;

    // Remove existing WMS layers (keep base layers)
    const layersToRemove: TileLayer<TileWMS>[] = [];
    map.getLayers().forEach((layer) => {
      if (layer instanceof TileLayer && layer.get('isWMS')) {
        layersToRemove.push(layer);
      }
    });
    layersToRemove.forEach(l => map.removeLayer(l));

    // Add new WMS layer
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
      zIndex: 10,
      visible: true,
    });
    wmsLayer.set('isWMS', true);
    map.addLayer(wmsLayer);
  }, [leftLayerId]);

  // Update right layer when selection changes
  useEffect(() => {
    if (!rightMapInstance.current || !rightLayerId) return;

    const map = rightMapInstance.current;
    const layerInfo = rasterLayersRef.current.find(l => l.id === rightLayerId);
    if (!layerInfo) return;

    // Remove existing WMS layers (keep base layers)
    const layersToRemove: TileLayer<TileWMS>[] = [];
    map.getLayers().forEach((layer) => {
      if (layer instanceof TileLayer && layer.get('isWMS')) {
        layersToRemove.push(layer);
      }
    });
    layersToRemove.forEach(l => map.removeLayer(l));

    // Add new WMS layer
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
      zIndex: 10,
      visible: true,
    });
    wmsLayer.set('isWMS', true);
    map.addLayer(wmsLayer);
  }, [rightLayerId]);

  // Handle swipe drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = (x / rect.width) * 100;

      if (percentage >= 10 && percentage <= 90) {
        setSwipePosition({ x, percentage });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  const rasterLayers = rasterLayersRef.current;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl w-[95vw] h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-800">Swipe Compare</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Layer selectors */}
        <div className="flex items-center gap-4 px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-600 mb-1">Left Layer</label>
            <select
              value={leftLayerId}
              onChange={(e) => setLeftLayerId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select layer...</option>
              {rasterLayers.map((layer) => (
                <option key={layer.id} value={layer.id}>
                  {layer.path.length > 0 ? `${layer.path.join(' › ')} › ` : ''}{layer.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-center">
            <div className="bg-blue-100 rounded-full p-2">
              <ChevronLeft className="w-4 h-4 text-blue-600" />
              <ChevronRight className="w-4 h-4 text-blue-600 -ml-3" />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-600 mb-1">Right Layer</label>
            <select
              value={rightLayerId}
              onChange={(e) => setRightLayerId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select layer...</option>
              {rasterLayers.map((layer) => (
                <option key={layer.id} value={layer.id}>
                  {layer.path.length > 0 ? `${layer.path.join(' › ')} › ` : ''}{layer.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Map container with swipe */}
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden"
        >
          {/* Left map */}
          <div
            ref={leftMapRef}
            className="absolute inset-0"
            style={{ clipPath: `inset(0 ${100 - swipePosition.percentage}% 0 0)` }}
          />

          {/* Right map */}
          <div
            ref={rightMapRef}
            className="absolute inset-0"
            style={{ clipPath: `inset(0 0 0 ${swipePosition.percentage}%)` }}
          />

          {/* Swipe handle */}
          <div
            className={cn(
              "absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-col-resize z-10 flex items-center justify-center",
              isDragging && "bg-blue-500"
            )}
            style={{ left: `${swipePosition.percentage}%` }}
            onMouseDown={handleMouseDown}
          >
            <div className="bg-white rounded-full shadow-md p-1 -ml-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                <div className="w-1 h-4 bg-white rounded-full" />
              </div>
            </div>
          </div>

          {/* Labels */}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow px-3 py-1.5 text-sm font-medium text-slate-700 z-10">
            {leftLayerId ? (() => {
              const layer = rasterLayers.find(l => l.id === leftLayerId);
              return layer ? `${layer.path.length > 0 ? layer.path.join(' › ') + ' › ' : ''}${layer.name}` : 'No layer';
            })() : 'No layer'}
          </div>
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow px-3 py-1.5 text-sm font-medium text-slate-700 z-10">
            {rightLayerId ? (() => {
              const layer = rasterLayers.find(l => l.id === rightLayerId);
              return layer ? `${layer.path.length > 0 ? layer.path.join(' › ') + ' › ' : ''}${layer.name}` : 'No layer';
            })() : 'No layer'}
          </div>
        </div>

        {/* Footer with instructions */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 text-center">
          Drag the center handle to compare layers. Pan and zoom are synchronized.
        </div>
      </div>
    </div>
  );
}
