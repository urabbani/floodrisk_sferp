import { useState, useCallback, memo } from 'react';
import { Eye, EyeOff, MapPin, MoreHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ExposureLayerType, ExposureImpact } from '@/types/impact';
import { EXPOSURE_LAYER_LABELS, EXPOSURE_LAYER_GEOMETRY } from '@/types/impact';
import { DepthDistributionChart } from './DepthDistributionChart';

interface ExposureRowProps {
  /**
   * Type of exposure layer
   */
  layerType: ExposureLayerType;

  /**
   * Impact data for this exposure layer
   */
  impact: ExposureImpact | null;

  /**
   * Whether this layer is visible on the map
   */
  isVisible: boolean;

  /**
   * Callback when layer visibility is toggled
   */
  onToggleVisibility: (layerType: ExposureLayerType, visible: boolean) => void;

  /**
   * Additional class names
   */
  className?: string;

  /**
   * Whether to show expanded details
   */
  initiallyExpanded?: boolean;
}

/**
 * ExposureRow - Displays a single exposure layer with toggle, stats, and depth distribution
 *
 * Shows:
 * - Layer name and geometry type icon
 * - Toggle checkbox for map visibility
 * - Affected/total feature counts
 * - Maximum depth bin
 * - Expandable depth distribution chart
 * - Actions (zoom to extent, view details)
 */
export const ExposureRow = memo<ExposureRowProps>(function ExposureRow({
  layerType,
  impact,
  isVisible,
  onToggleVisibility,
  className,
  initiallyExpanded = false,
}) {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

  // Determine geometry icon component
  const GeometryIcon = {
    point: MapPin,
    line: MoreHorizontal,
    polygon: ChevronDown,
  }[EXPOSURE_LAYER_GEOMETRY[layerType]] || MapPin;

  const hasImpact = impact && impact.affectedFeatures > 0;

  const handleToggle = useCallback(() => {
    onToggleVisibility(layerType, !isVisible);
  }, [layerType, isVisible, onToggleVisibility]);

  const handleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  if (!impact) {
    // No impact data row
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50 opacity-60',
          className
        )}
      >
        <div className="flex items-center gap-3 flex-1">
          {/* Checkbox */}
          <div className="w-5 h-5 rounded border border-slate-300 bg-slate-100" />

          {/* Info */}
          <GeometryIcon className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-600">{EXPOSURE_LAYER_LABELS[layerType]}</span>
        </div>

        <div className="text-xs text-slate-400">No data</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'border border-slate-200 rounded-lg overflow-hidden transition-all',
        !isVisible && 'opacity-60',
        className
      )}
    >
      {/* Main Row */}
      <div className="flex items-center gap-3 p-3 bg-white hover:bg-slate-50 transition-colors">
        {/* Toggle Checkbox */}
        <button
          onClick={handleToggle}
          className={cn(
            'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
            'hover:border-blue-400',
            isVisible ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'
          )}
          title={isVisible ? 'Hide on map' : 'Show on map'}
        >
          {isVisible && <Eye className="w-3.5 h-3.5 text-white" />}
          {!isVisible && <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
        </button>

        {/* Layer Info */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <GeometryIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span className="text-sm font-medium text-slate-700 truncate">
            {EXPOSURE_LAYER_LABELS[layerType]}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs">
          <div className="text-center">
            <div className="font-semibold text-slate-800">{impact.affectedFeatures}</div>
            <div className="text-slate-500">of {impact.totalFeatures}</div>
          </div>

          {hasImpact && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md" style={{
              backgroundColor: `${DEPTH_BIN_COLOR(impact.maxDepthBin)}20`,
              color: DEPTH_BIN_COLOR(impact.maxDepthBin)
            }}>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: DEPTH_BIN_COLOR(impact.maxDepthBin) }} />
              <span className="font-medium">{impact.maxDepthBin}</span>
            </div>
          )}
        </div>

        {/* Expand Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExpand}
          className="h-7 w-7 p-0"
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-600" />
          )}
        </Button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-3">
          {/* Depth Distribution Chart */}
          <div>
            <div className="text-[10px] font-medium text-slate-600 mb-2">Depth Distribution</div>
            <DepthDistributionChart
              depthBins={impact.depthBins}
              showLabels={true}
              orientation="horizontal"
            />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <div className="bg-white p-2 rounded border border-slate-200">
              <div className="text-slate-500">Total</div>
              <div className="font-semibold text-slate-800">{impact.totalFeatures}</div>
            </div>
            <div className="bg-white p-2 rounded border border-slate-200">
              <div className="text-slate-500">Affected</div>
              <div className="font-semibold text-blue-600">{impact.affectedFeatures}</div>
            </div>
            <div className="bg-white p-2 rounded border border-slate-200">
              <div className="text-slate-500">Max Depth</div>
              <div className="font-semibold text-slate-800">{impact.maxDepthBin}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

// Helper function for depth bin colors
function DEPTH_BIN_COLOR(range: string): string {
  const colors: Record<string, string> = {
    '15-100cm': '#90EE90',
    '1-2m': '#FFD700',
    '2-3m': '#FFA500',
    '3-4m': '#FF6347',
    '4-5m': '#DC143C',
    'above5m': '#8B0000',
  };
  return colors[range] || '#94a3b8';
}

ExposureRow.displayName = 'ExposureRow';
