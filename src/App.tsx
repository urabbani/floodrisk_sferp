import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Header } from '@/components/Header';
import { LayerTree } from '@/components/layer-tree/LayerTree';
import { MapViewer } from '@/components/map/MapViewer';
import { LegendPanel } from '@/components/map/LegendPanel';
import { FeaturePopup } from '@/components/popups/FeaturePopup';
import { SwipeCompare } from '@/components/swipe/SwipeCompare';
import { ImpactMatrix } from '@/components/impact-matrix';
import type { LayerInfo, LayerGroup } from '@/types/layers';
import { isLayerGroup } from '@/types/layers';
import { layerTree } from '@/config/layers';
import { cn } from '@/lib/utils';
import { PanelLeft, X, GripVertical, ArrowLeftRight, Layers, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

// Recursively collect all layers from the tree
function collectAllLayers(tree: LayerGroup): LayerInfo[] {
  const layers: LayerInfo[] = [];

  const traverse = (node: LayerGroup | LayerInfo) => {
    if (isLayerGroup(node)) {
      node.children.forEach(traverse);
    } else {
      layers.push(node);
    }
  };

  traverse(tree);
  return layers;
}

// Recursively collect initially visible layer IDs
function collectVisibleLayerIds(tree: LayerGroup): string[] {
  const visibleIds: string[] = [];

  const traverse = (node: LayerGroup | LayerInfo) => {
    if (isLayerGroup(node)) {
      node.children.forEach(traverse);
    } else if (node.visible) {
      visibleIds.push(node.id);
    }
  };

  traverse(tree);
  return visibleIds;
}

function App() {
  const isMobile = useIsMobile();
  // Sidebar starts closed on mobile, open on desktop
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarView, setSidebarView] = useState<'layers' | 'impact'>('layers');
  const [visibleLayerIds, setVisibleLayerIds] = useState<string[]>(() => collectVisibleLayerIds(layerTree));
  const [layerOpacities, setLayerOpacities] = useState<Record<string, number>>({});
  const [selectedLayer, setSelectedLayer] = useState<LayerInfo | null>(null);
  const [identifyPopup, setIdentifyPopup] = useState<{ coordinate: number[]; position: { x: number; y: number }; features: any[] } | null>(null);
  const [swipeCompareOpen, setSwipeCompareOpen] = useState(false);
  const [impactLayers, setImpactLayers] = useState<LayerInfo[]>([]);
  const sidebarRef = useRef<HTMLElement>(null);

  // Minimum and maximum sidebar width
  const MIN_WIDTH = 200;
  const MAX_WIDTH = 600;

  // Handle sidebar resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !sidebarRef.current) return;

      const sidebarRect = sidebarRef.current.getBoundingClientRect();
      const newWidth = e.clientX - sidebarRect.left;

      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
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
  }, [isResizing]);

  // Close sidebar when switching to mobile view
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  // Get all layers
  const allLayers = useMemo(() => collectAllLayers(layerTree), []);

  // Combine regular layers with impact layers for MapViewer
  const combinedLayers = useMemo(() => {
    return [...allLayers, ...impactLayers];
  }, [allLayers, impactLayers]);

  // Get currently visible layers (for feature identification and UI display)
  const visibleLayers = useMemo(() => {
    return combinedLayers.filter((layer) => visibleLayerIds.includes(layer.id));
  }, [combinedLayers, visibleLayerIds]);

  // Handle layer visibility change
  const handleLayerVisibilityChange = useCallback((id: string, visible: boolean) => {
    setVisibleLayerIds((prev) => {
      if (visible) {
        // Add ID if not already present (avoid duplicates)
        return prev.includes(id) ? prev : [...prev, id];
      } else {
        // Remove ID
        return prev.filter((layerId) => layerId !== id);
      }
    });
  }, []);

  // Handle layer opacity change
  const handleLayerOpacityChange = useCallback((id: string, opacity: number) => {
    setLayerOpacities((prev) => ({
      ...prev,
      [id]: opacity,
    }));
  }, []);

  // Handle layer selection
  const handleLayerSelect = useCallback((layer: LayerInfo) => {
    setSelectedLayer(layer);
  }, []);

  // Handle impact layers change from ImpactMatrix
  const handleImpactLayersChange = useCallback((layers: LayerInfo[]) => {
    console.log('[App] Impact layers changed:', {
      count: layers.length,
      layers: layers.map(l => l.id)
    });
    setImpactLayers(layers);
  }, []);

  // Handle map click (stable reference to prevent map re-initialization)
  const handleMapClick = useCallback(async (coord: number[], pixel: number[]) => {
    console.log('Map clicked at:', coord, 'pixel:', pixel);

    // Show identify popup at click position
    const mapElement = document.querySelector('.ol-viewport');
    if (!mapElement) return;

    // Get visible WMS layer names (all layers, including vector)
    const visibleWmsLayers = visibleLayers
      .map(l => ({ name: l.geoserverName, workspace: l.workspace, layerInfo: l }));

    console.log('Visible WMS layers:', visibleWmsLayers);

    let features: any[] = [];

    // Query GeoServer for each visible WMS layer
    for (const layer of visibleWmsLayers) {
      try {
        // Use smaller bbox for point features to avoid getting multiple nearby points
        const isPointLayer = layer.layerInfo.geometryType === 'point';
        const bboxSize = isPointLayer ? 5 : 50; // 5m for points, 50m for others
        const featureCount = isPointLayer ? 1 : 10; // Limit to 1 for points
        const bbox = `${coord[0] - bboxSize},${coord[1] - bboxSize},${coord[0] + bboxSize},${coord[1] + bboxSize}`;

        const params = new URLSearchParams();
        params.append('SERVICE', 'WMS');
        params.append('VERSION', '1.1.1');
        params.append('REQUEST', 'GetFeatureInfo');
        if (layer.name) {
          params.append('LAYERS', layer.name);
          params.append('QUERY_LAYERS', layer.name);
        }
        params.append('INFO_FORMAT', 'application/json');
        params.append('FEATURE_COUNT', String(featureCount));
        params.append('SRS', 'EPSG:32642');
        params.append('BBOX', bbox);
        params.append('WIDTH', '11');
        params.append('HEIGHT', '11');
        params.append('X', '5');
        params.append('Y', '5');

        const url = `/geoserver/${layer.workspace}/wms?${params}`;
        console.log('GetFeatureInfo URL:', url);

        const response = await fetch(url);
        console.log('Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('Feature data:', data);

          if (data.features && data.features.length > 0) {
            // For point layers, find the closest feature to click point
            let featuresToAdd = data.features;
            if (isPointLayer && data.features.length > 1) {
              featuresToAdd = data.features
                .map((f: any) => ({
                  feature: f,
                  distance: f.geometry?.coordinates
                    ? Math.sqrt(
                        Math.pow((f.geometry.coordinates[0] ?? 0) - coord[0], 2) +
                        Math.pow((f.geometry.coordinates[1] ?? 0) - coord[1], 2)
                      )
                    : Infinity,
                }))
                .sort((a: any, b: any) => a.distance - b.distance)
                .slice(0, 1)
                .map((item: any) => item.feature);
            }

            features.push(...featuresToAdd.map((f: any) => ({
              layer: layer.layerInfo.name,
              properties: f.properties || {},
            })));
          }
        } else {
          console.warn('GetFeatureInfo failed:', response.status, response.statusText);
        }
      } catch (error) {
        console.warn('GetFeatureInfo failed for layer:', layer.name, error);
      }
    }

    console.log('Final features:', features);

    setIdentifyPopup({
      coordinate: coord,
      position: { x: pixel[0], y: pixel[1] },
      features,
    });
  }, [visibleLayers]);

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <Header onToggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden min-w-0 relative">
        {/* Mobile sidebar overlay backdrop */}
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={toggleSidebar}
          />
        )}

        {/* Sidebar with layer tree */}
        <aside
          ref={sidebarRef}
          style={!isMobile && sidebarOpen ? { width: `${sidebarWidth}px` } : undefined}
          className={cn(
            'bg-white border-r border-slate-200 transition-all duration-300 ease-in-out flex flex-col z-50',
            // Desktop: slide in from left
            !isMobile && (sidebarOpen ? '' : 'w-0 overflow-hidden'),
            // Mobile: full-width overlay
            isMobile && (sidebarOpen ? 'w-full absolute inset-y-0 left-0' : 'w-0 overflow-hidden')
          )}
        >
          {/* Mobile close button */}
          {isMobile && sidebarOpen && (
            <div className="flex items-center justify-between p-3 border-b border-slate-200">
              <h2 className="text-sm font-semibold text-slate-800">
                {sidebarView === 'layers' ? 'Layers' : 'Impact Analysis'}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Desktop tab switcher */}
          {!isMobile && sidebarOpen && (
            <div className="flex items-center gap-1 p-2 border-b border-slate-200 bg-slate-50">
              <Button
                variant={sidebarView === 'layers' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSidebarView('layers')}
                className="flex-1 gap-1.5 h-8 text-xs"
              >
                <Layers className="w-3.5 h-3.5" />
                Layers
              </Button>
              <Button
                variant={sidebarView === 'impact' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSidebarView('impact')}
                className="flex-1 gap-1.5 h-8 text-xs"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Impact
              </Button>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {sidebarView === 'layers' ? (
              <LayerTree
                root={layerTree}
                onLayerVisibilityChange={handleLayerVisibilityChange}
                onLayerOpacityChange={handleLayerOpacityChange}
                onLayerSelect={handleLayerSelect}
                selectedLayerId={selectedLayer?.id}
                visibleLayerIds={visibleLayerIds}
              />
            ) : (
              <ImpactMatrix
                onLayerToggle={handleLayerVisibilityChange}
                visibleLayers={visibleLayerIds}
                onImpactLayersChange={handleImpactLayersChange}
                className="h-full"
              />
            )}
          </div>
        </aside>

        {/* Sidebar resize handle */}
        {!isMobile && sidebarOpen && (
          <div
            className="absolute top-0 bottom-0 w-1 bg-slate-200 hover:bg-blue-500 cursor-col-resize z-50 flex items-center justify-center group"
            style={{ left: `${sidebarWidth}px` }}
            onMouseDown={handleMouseDown}
          >
            <GripVertical className="w-4 h-4 text-slate-400 group-hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}

        {/* Sidebar toggle button (when closed) */}
        {!sidebarOpen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn(
              "z-10 bg-white shadow-md hover:bg-slate-50",
              isMobile
                ? "absolute bottom-4 right-4 h-12 w-12 rounded-full"
                : "absolute left-4 top-20"
            )}
          >
            <PanelLeft className="w-5 h-5 text-slate-600" />
          </Button>
        )}

        {/* Swipe Compare button */}
        <Button
          variant="default"
          size="sm"
          onClick={() => setSwipeCompareOpen(true)}
          className="absolute top-4 right-20 z-10 bg-blue-600 hover:bg-blue-700 shadow-lg"
        >
          <ArrowLeftRight className="w-4 h-4 mr-2" />
          Swipe Compare
        </Button>

        {/* Map container */}
        <main className="flex-1 relative overflow-hidden">
          <MapViewer
            visibleLayerIds={visibleLayerIds}
            allLayers={combinedLayers}
            layerOpacities={layerOpacities}
            onMapClick={handleMapClick}
          />

          {/* Legend panel */}
          <LegendPanel
            layer={selectedLayer}
            onClose={() => setSelectedLayer(null)}
          />

          {/* Feature identify popup */}
          {identifyPopup && (
            <FeaturePopup
              position={identifyPopup.position}
              coordinate={identifyPopup.coordinate}
              features={identifyPopup.features}
              onClose={() => setIdentifyPopup(null)}
            />
          )}

          {/* Layer info overlay - hidden on mobile */}
          {!isMobile && visibleLayers.length > 0 && (
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 z-10 max-w-xs">
              <h3 className="text-xs font-semibold text-slate-700 mb-1">
                Active Layers
              </h3>
              <p className="text-xs text-slate-500">
                {visibleLayers.length} layer{visibleLayers.length !== 1 ? 's' : ''} visible
              </p>
              <div className="mt-2 max-h-48 overflow-y-auto scrollbar-thin">
                {visibleLayers.map((layer) => (
                  <div
                    key={layer.id}
                    className="text-xs text-slate-600 py-0.5 truncate"
                    title={layer.name}
                  >
                    • {layer.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Swipe Compare Modal */}
      {swipeCompareOpen && (
        <SwipeCompare
          onClose={() => setSwipeCompareOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
