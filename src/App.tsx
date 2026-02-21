import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Header } from '@/components/Header';
import { LayerTree } from '@/components/layer-tree/LayerTree';
import { MapViewer } from '@/components/map/MapViewer';
import { LegendPanel } from '@/components/map/LegendPanel';
import type { LayerInfo, LayerGroup } from '@/types/layers';
import { isLayerGroup } from '@/types/layers';
import { layerTree } from '@/config/layers';
import { cn } from '@/lib/utils';
import { PanelLeft, X, GripVertical } from 'lucide-react';
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
function collectVisibleLayerIds(tree: LayerGroup): Set<string> {
  const visibleIds = new Set<string>();

  const traverse = (node: LayerGroup | LayerInfo) => {
    if (isLayerGroup(node)) {
      node.children.forEach(traverse);
    } else if (node.visible) {
      visibleIds.add(node.id);
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
  const [visibleLayerIds, setVisibleLayerIds] = useState<Set<string>>(() => collectVisibleLayerIds(layerTree));
  const [layerOpacities, setLayerOpacities] = useState<Map<string, number>>(new Map());
  const [selectedLayer, setSelectedLayer] = useState<LayerInfo | null>(null);
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

  // Get currently visible layers with their opacities
  const visibleLayers = useMemo(() => {
    return allLayers
      .filter((layer) => visibleLayerIds.has(layer.id))
      .map((layer) => ({
        ...layer,
        opacity: layerOpacities.get(layer.id) ?? layer.opacity,
      }));
  }, [allLayers, visibleLayerIds, layerOpacities]);

  // Handle layer visibility change
  const handleLayerVisibilityChange = useCallback((id: string, visible: boolean) => {
    setVisibleLayerIds((prev) => {
      const newSet = new Set(prev);
      if (visible) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }, []);

  // Handle layer opacity change
  const handleLayerOpacityChange = useCallback((id: string, opacity: number) => {
    setLayerOpacities((prev) => {
      const newMap = new Map(prev);
      newMap.set(id, opacity);
      return newMap;
    });
  }, []);

  // Handle layer selection
  const handleLayerSelect = useCallback((layer: LayerInfo) => {
    setSelectedLayer(layer);
  }, []);

  // Handle map click (stable reference to prevent map re-initialization)
  const handleMapClick = useCallback((coord: number[]) => {
    console.log('Map clicked at:', coord);
  }, []);

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
              <h2 className="text-sm font-semibold text-slate-800">Layers</h2>
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
          <LayerTree
            root={layerTree}
            onLayerVisibilityChange={handleLayerVisibilityChange}
            onLayerOpacityChange={handleLayerOpacityChange}
            onLayerSelect={handleLayerSelect}
            selectedLayerId={selectedLayer?.id}
            visibleLayerIds={visibleLayerIds}
          />
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

        {/* Map container */}
        <main className="flex-1 relative overflow-hidden">
          <MapViewer
            visibleLayers={visibleLayers}
            onMapClick={handleMapClick}
          />

          {/* Legend panel */}
          <LegendPanel
            layer={selectedLayer}
            onClose={() => setSelectedLayer(null)}
          />

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
    </div>
  );
}

export default App;
