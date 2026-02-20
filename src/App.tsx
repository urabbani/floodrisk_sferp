import { useState, useCallback, useMemo } from 'react';
import { Header } from '@/components/Header';
import { LayerTree } from '@/components/layer-tree/LayerTree';
import { MapViewer } from '@/components/map/MapViewer';
import { LegendPanel } from '@/components/map/LegendPanel';
import type { LayerInfo, LayerGroup } from '@/types/layers';
import { isLayerGroup } from '@/types/layers';
import { layerTree } from '@/config/layers';
import { cn } from '@/lib/utils';
import { PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [visibleLayerIds, setVisibleLayerIds] = useState<Set<string>>(() => collectVisibleLayerIds(layerTree));
  const [layerOpacities, setLayerOpacities] = useState<Map<string, number>>(new Map());
  const [selectedLayer, setSelectedLayer] = useState<LayerInfo | null>(null);

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
      <div className="flex flex-1 overflow-hidden min-w-0">
        {/* Sidebar with layer tree */}
        <aside
          className={cn(
            'bg-white border-r border-slate-200 transition-all duration-300 ease-in-out flex flex-col',
            sidebarOpen ? 'w-80' : 'w-0 overflow-hidden'
          )}
        >
          <LayerTree
            root={layerTree}
            onLayerVisibilityChange={handleLayerVisibilityChange}
            onLayerOpacityChange={handleLayerOpacityChange}
            onLayerSelect={handleLayerSelect}
            selectedLayerId={selectedLayer?.id}
            visibleLayerIds={visibleLayerIds}
          />
        </aside>

        {/* Sidebar toggle button (when closed) */}
        {!sidebarOpen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="absolute left-4 top-20 z-10 bg-white shadow-md hover:bg-slate-50"
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

          {/* Layer info overlay */}
          {visibleLayers.length > 0 && (
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 z-10 max-w-xs">
              <h3 className="text-xs font-semibold text-slate-700 mb-1">
                Active Layers
              </h3>
              <p className="text-xs text-slate-500">
                {visibleLayers.length} layer{visibleLayers.length !== 1 ? 's' : ''} visible
              </p>
              <div className="mt-2 max-h-32 overflow-y-auto">
                {visibleLayers.slice(0, 5).map((layer) => (
                  <div
                    key={layer.id}
                    className="text-xs text-slate-600 py-0.5 truncate"
                    title={layer.name}
                  >
                    • {layer.name}
                  </div>
                ))}
                {visibleLayers.length > 5 && (
                  <div className="text-xs text-slate-400 py-0.5">
                    + {visibleLayers.length - 5} more...
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
