import { ChevronRight, ChevronDown, Eye, EyeOff, Layers, Image, MapPin } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { LayerGroup, LayerInfo } from '@/types/layers';
import { isLayerGroup } from '@/types/layers';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface LayerTreeItemProps {
  node: LayerGroup | LayerInfo;
  level: number;
  onToggleVisibility: (id: string, visible: boolean) => void;
  onToggleExpand: (id: string, expanded: boolean) => void;
  onOpacityChange: (id: string, opacity: number) => void;
  selectedLayerId?: string;
  onSelectLayer?: (layer: LayerInfo) => void;
}

export function LayerTreeItem({
  node,
  level,
  onToggleVisibility,
  onToggleExpand,
  onOpacityChange,
  selectedLayerId,
  onSelectLayer,
}: LayerTreeItemProps) {
  const isGroup = isLayerGroup(node);
  const paddingLeft = level * 12 + 8;

  // Debounce opacity changes for smoother performance
  const opacityChangeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleOpacityChange = (value: number) => {
    // Clear any pending opacity change
    if (opacityChangeTimeoutRef.current) {
      clearTimeout(opacityChangeTimeoutRef.current);
    }

    // Debounce the opacity change callback
    opacityChangeTimeoutRef.current = setTimeout(() => {
      onOpacityChange(node.id, value);
    }, 50); // 50ms debounce for smooth but responsive feel
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (opacityChangeTimeoutRef.current) {
        clearTimeout(opacityChangeTimeoutRef.current);
      }
    };
  }, []);

  const handleVisibilityClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleVisibility(node.id, !node.visible);
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGroup) {
      onToggleExpand(node.id, !node.expanded);
    }
  };

  const handleLayerClick = () => {
    if (!isGroup && onSelectLayer) {
      onSelectLayer(node as LayerInfo);
    }
  };

  const getIcon = () => {
    if (isGroup) {
      return <Layers className="w-4 h-4 text-slate-500" />;
    }
    const layer = node as LayerInfo;
    if (layer.type === 'wms') {
      return <Image className="w-4 h-4 text-blue-500" />;
    }
    return <MapPin className="w-4 h-4 text-green-500" />;
  };

  return (
    <div className="select-none">
      <div
        className={cn(
          'flex items-center gap-1 py-2 px-2 hover:bg-slate-100/50 transition-colors cursor-pointer group min-h-[44px]',
          !isGroup && selectedLayerId === node.id && 'bg-blue-50 hover:bg-blue-100/50',
          !isGroup && 'cursor-pointer'
        )}
        style={{ paddingLeft: `${paddingLeft}px` }}
        onClick={isGroup ? handleExpandClick : handleLayerClick}
      >
        {/* Expand/Collapse button for groups */}
        {isGroup ? (
          <button
            onClick={handleExpandClick}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-200/50 transition-colors touch-manipulation"
          >
            {node.expanded ? (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-500" />
            )}
          </button>
        ) : (
          <span className="w-8" />
        )}

        {/* Visibility toggle */}
        <button
          onClick={handleVisibilityClick}
          className={cn(
            'w-9 h-9 flex items-center justify-center rounded transition-colors touch-manipulation',
            node.visible
              ? 'text-blue-600 hover:bg-blue-100/50'
              : 'text-slate-400 hover:bg-slate-200/50'
          )}
        >
          {node.visible ? (
            <Eye className="w-5 h-5" />
          ) : (
            <EyeOff className="w-5 h-5" />
          )}
        </button>

        {/* Icon */}
        <span className="ml-1">{getIcon()}</span>

        {/* Name */}
        <span
          className={cn(
            'ml-2 text-sm truncate flex-1',
            node.visible ? 'text-slate-800' : 'text-slate-500',
            isGroup && 'font-medium'
          )}
          title={node.name}
        >
          {node.name}
        </span>
      </div>

      {/* Opacity slider for visible layers */}
      {!isGroup && node.visible && (
        <div
          className="px-4 py-2 min-h-[44px] flex items-center"
          style={{ paddingLeft: `${paddingLeft + 48}px` }}
        >
          <div className="flex items-center gap-2 w-full">
            <span className="text-xs text-slate-500">Opacity</span>
            <Slider
              value={[node.opacity * 100]}
              onValueChange={(value) => handleOpacityChange(value[0] / 100)}
              min={0}
              max={100}
              step={5}
              className="flex-1 h-2"
            />
            <span className="text-xs text-slate-500 w-10 text-right">
              {Math.round(node.opacity * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Children for groups */}
      {isGroup && node.expanded && (
        <div className="">
          {(node as LayerGroup).children.map((child) => (
            <LayerTreeItem
              key={child.id}
              node={child}
              level={level + 1}
              onToggleVisibility={onToggleVisibility}
              onToggleExpand={onToggleExpand}
              onOpacityChange={onOpacityChange}
              selectedLayerId={selectedLayerId}
              onSelectLayer={onSelectLayer}
            />
          ))}
        </div>
      )}
    </div>
  );
}
