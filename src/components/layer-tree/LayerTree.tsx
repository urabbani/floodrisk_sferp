import { useState, useCallback, useEffect, useRef } from 'react';
import type { LayerGroup, LayerInfo } from '@/types/layers';
import { isLayerGroup } from '@/types/layers';
import { LayerTreeItem } from './LayerTreeItem';
import { ScenarioMatrix } from '@/components/scenario-explorer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, ChevronUp, ChevronDown, Grid3X3, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LayerTreeProps {
  root: LayerGroup;
  onLayerVisibilityChange: (id: string, visible: boolean) => void;
  onLayerOpacityChange: (id: string, opacity: number) => void;
  onLayerSelect?: (layer: LayerInfo) => void;
  selectedLayerId?: string;
  visibleLayerIds: Set<string>;
}

// Recursively update a node in the tree
function updateNodeInTree(
  tree: LayerGroup,
  nodeId: string,
  updater: (node: LayerGroup | LayerInfo) => LayerGroup | LayerInfo
): LayerGroup {
  if (tree.id === nodeId) {
    return updater(tree) as LayerGroup;
  }

  const updateChildren = (children: Array<LayerGroup | LayerInfo>): Array<LayerGroup | LayerInfo> => {
    return children.map((child) => {
      if (child.id === nodeId) {
        return updater(child);
      }
      if (isLayerGroup(child)) {
        return {
          ...child,
          children: updateChildren(child.children),
        };
      }
      return child;
    });
  };

  return {
    ...tree,
    children: updateChildren(tree.children),
  };
}

// Expand all groups
function expandAll(tree: LayerGroup): LayerGroup {
  return {
    ...tree,
    expanded: true,
    children: tree.children.map((child) => {
      if (isLayerGroup(child)) {
        return expandAll(child);
      }
      return child;
    }),
  };
}

// Collapse all groups (except root)
function collapseAll(tree: LayerGroup): LayerGroup {
  return {
    ...tree,
    expanded: true,
    children: tree.children.map((child) => {
      if (isLayerGroup(child)) {
        return {
          ...collapseAll(child),
          expanded: false,
        };
      }
      return child;
    }),
  };
}

// Check if a group is a climate scenario group
function isClimateGroup(node: LayerGroup): boolean {
  return node.id === 'present_climate' || node.id === 'future_climate';
}

// Recursively collect all layer IDs in a group
function collectLayerIds(node: LayerGroup | LayerInfo): string[] {
  if (isLayerGroup(node)) {
    const ids: string[] = [];
    node.children.forEach((child) => {
      ids.push(...collectLayerIds(child));
    });
    return ids;
  }
  return [node.id];
}

export function LayerTree({
  root: initialRoot,
  onLayerVisibilityChange,
  onLayerOpacityChange,
  onLayerSelect,
  selectedLayerId,
  visibleLayerIds: externalVisibleLayerIds,
}: LayerTreeProps) {
  const [tree, setTree] = useState<LayerGroup>(initialRoot);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'tree' | 'matrix'>('matrix');

  const prevVisibleIdsRef = useRef<string[]>([]);

  // Sync tree visibility with external visibleLayerIds
  useEffect(() => {
    const currentIds = Array.from(externalVisibleLayerIds).sort();
    const prevIds = prevVisibleIdsRef.current;

    const idsChanged =
      currentIds.length !== prevIds.length ||
      currentIds.some((id, i) => id !== prevIds[i]);

    if (!idsChanged) return;

    prevVisibleIdsRef.current = currentIds;

    setTree((prev) => {
      const syncVisibility = (node: LayerGroup | LayerInfo): LayerGroup | LayerInfo => {
        if (isLayerGroup(node)) {
          return {
            ...node,
            children: node.children.map(syncVisibility),
          };
        }
        return {
          ...node,
          visible: externalVisibleLayerIds.has(node.id),
        };
      };

      return syncVisibility(prev) as LayerGroup;
    });
  }, [externalVisibleLayerIds]);

  // FIXED: Notify parent BEFORE updating local state
  const handleToggleVisibility = useCallback((id: string, visible: boolean) => {
    // Find the node being toggled
    const findNode = (node: LayerGroup | LayerInfo, targetId: string): LayerGroup | LayerInfo | null => {
      if (node.id === targetId) return node;
      if (isLayerGroup(node)) {
        for (const child of node.children) {
          const found = findNode(child, targetId);
          if (found) return found;
        }
      }
      return null;
    };

    const node = findNode(tree, id);
    if (!node) return;

    // If it's a group, collect all layer IDs within it and toggle each
    if (isLayerGroup(node)) {
      const layerIds = collectLayerIds(node);
      layerIds.forEach((layerId) => {
        onLayerVisibilityChange(layerId, visible);
      });
    } else {
      // Single layer - just toggle it
      onLayerVisibilityChange(id, visible);
    }

    // Then update local state
    setTree((prev) => {
      const updateVisibility = (node: LayerGroup | LayerInfo): LayerGroup | LayerInfo => {
        if (node.id === id) {
          // If this is the target node, update it
          return { ...node, visible };
        }
        if (isLayerGroup(node)) {
          // Check if any parent groups should have their visibility updated
          const hasVisibleChildren = node.children.some((child) => {
            if (child.id === id) return visible;
            if (isLayerGroup(child)) {
              // For nested groups, check if any children are visible
              const checkChildVisible = (n: LayerGroup | LayerInfo): boolean => {
                if (n.id === id) return visible;
                if (isLayerGroup(n)) {
                  return n.children.some(checkChildVisible);
                }
                return n.visible;
              };
              return checkChildVisible(child);
            }
            return child.visible;
          });
          return {
            ...node,
            visible: hasVisibleChildren,
            children: node.children.map(updateVisibility),
          };
        }
        return node;
      };

      return updateVisibility(prev) as LayerGroup;
    });
  }, [onLayerVisibilityChange, tree]);

  const handleToggleExpand = useCallback((id: string, expanded: boolean) => {
    setTree((prev) =>
      updateNodeInTree(prev, id, (node) => ({
        ...node,
        expanded,
      }))
    );
  }, []);

  // FIXED: Notify parent BEFORE updating local state
  const handleOpacityChange = useCallback((id: string, opacity: number) => {
    // Notify parent first
    onLayerOpacityChange(id, opacity);
    
    // Then update local state
    setTree((prev) =>
      updateNodeInTree(prev, id, (node) => ({
        ...node,
        opacity,
      }))
    );
  }, [onLayerOpacityChange]);

  const handleLayerSelect = useCallback((layer: LayerInfo) => {
    onLayerSelect?.(layer);
  }, [onLayerSelect]);

  const handleExpandAll = useCallback(() => {
    setTree((prev) => expandAll(prev));
  }, []);

  const handleCollapseAll = useCallback(() => {
    setTree((prev) => collapseAll(prev));
  }, []);

  const filterTree = (node: LayerGroup | LayerInfo, query: string): boolean => {
    if (!query) return true;
    
    const matches = node.name.toLowerCase().includes(query.toLowerCase());
    
    if (isLayerGroup(node)) {
      const childMatches = node.children.some((child) => filterTree(child, query));
      return matches || childMatches;
    }
    
    return matches;
  };

  const visibleCount = externalVisibleLayerIds.size;
  const otherGroups = tree.children.filter(
    (child) => !(isLayerGroup(child) && isClimateGroup(child))
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-3 border-b border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-slate-800">Layer Tree</h2>
          <span className="text-xs text-slate-500">
            {visibleCount} visible
          </span>
        </div>
        
        {/* Search */}
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search layers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex bg-slate-100 rounded-md p-0.5">
            <button
              onClick={() => setViewMode('matrix')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-all ${
                viewMode === 'matrix'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              Matrix
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-all ${
                viewMode === 'tree'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Tree
            </button>
          </div>
          
          {viewMode === 'tree' && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExpandAll}
                className="h-7 text-xs px-2"
              >
                <ChevronDown className="w-3 h-3 mr-1" />
                Expand
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCollapseAll}
                className="h-7 text-xs px-2"
              >
                <ChevronUp className="w-3 h-3 mr-1" />
                Collapse
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="py-2">
          {viewMode === 'matrix' ? (
            <div className="px-3">
              <Tabs defaultValue="present" className="w-full">
                <TabsList className="w-full grid grid-cols-2 mb-3">
                  <TabsTrigger value="present" className="text-xs">Present Climate</TabsTrigger>
                  <TabsTrigger value="future" className="text-xs">Future Climate</TabsTrigger>
                </TabsList>
                
                <TabsContent value="present" className="mt-0">
                  <ScenarioMatrix
                    climate="Present"
                    onLayerToggle={handleToggleVisibility}
                    visibleLayers={externalVisibleLayerIds}
                  />
                </TabsContent>
                
                <TabsContent value="future" className="mt-0">
                  <ScenarioMatrix
                    climate="Future"
                    onLayerToggle={handleToggleVisibility}
                    visibleLayers={externalVisibleLayerIds}
                  />
                </TabsContent>
              </Tabs>

              {/* Other Layers */}
              <div className="mt-4 pt-4 border-t border-slate-200">
                <h3 className="text-xs font-semibold text-slate-700 mb-2 px-1">Other Layers</h3>
                {otherGroups
                  .filter((child) => filterTree(child, searchQuery))
                  .map((child) => (
                    <LayerTreeItem
                      key={child.id}
                      node={child}
                      level={0}
                      onToggleVisibility={handleToggleVisibility}
                      onToggleExpand={handleToggleExpand}
                      onLayerSelect={handleLayerSelect}
                      onOpacityChange={handleOpacityChange}
                      selectedLayerId={selectedLayerId}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="px-3">
                {tree.children
                  .filter((child) => filterTree(child, searchQuery))
                  .map((child) => (
                    <LayerTreeItem
                      key={child.id}
                      node={child}
                      level={0}
                      onToggleVisibility={handleToggleVisibility}
                      onToggleExpand={handleToggleExpand}
                      onLayerSelect={handleLayerSelect}
                      onOpacityChange={handleOpacityChange}
                      selectedLayerId={selectedLayerId}
                    />
                  ))}
              </div>
            )}
          </div>
      </ScrollArea>
    </div>
  );
}

