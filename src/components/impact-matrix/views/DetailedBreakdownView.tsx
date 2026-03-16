import { useState, useCallback, useMemo } from 'react';
import { X, RefreshCw, Layers, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ScenarioImpactSummary, ExposureLayerType } from '@/types/impact';
import { EXPOSURE_LAYER_TYPES, formatDepthBinLabel, formatClimateLabel, formatMaintenanceLabel } from '@/types/impact';
import { ExposureRow } from '../components/ExposureRow';

interface DetailedBreakdownViewProps {
  /**
   * Selected scenario to display details for
   */
  scenario: ScenarioImpactSummary;

  /**
   * Currently visible layers on the map
   */
  visibleLayers: string[];

  /**
   * Callback when layer visibility is toggled
   */
  onLayerToggle: (layerId: string, visible: boolean) => void;

  /**
   * Callback to close this view
   */
  onClose: () => void;

  /**
   * Callback to refresh data
   */
  onRefresh?: () => void;

  /**
   * Whether data is loading
   */
  isLoading?: boolean;

  /**
   * Additional class names
   */
  className?: string;
}

/**
 * DetailedBreakdownView - Shows detailed impact breakdown for a specific scenario
 *
 * Displays:
 * - Scenario header with summary stats
 * - All 9 exposure layers with their impact details
 * - Layer toggles for map visibility
 * - Depth distribution charts
 * - Zoom to extent functionality
 */
export function DetailedBreakdownView({
  scenario,
  visibleLayers,
  onLayerToggle,
  onClose,
  onRefresh,
  isLoading = false,
  className,
}: DetailedBreakdownViewProps) {
  const [sortBy, setSortBy] = useState<'name' | 'affected' | 'depth'>('affected');

  // Sort exposure layers
  const sortedExposures = useMemo(() => {
    const exposures = [...EXPOSURE_LAYER_TYPES];

    switch (sortBy) {
      case 'name':
        return exposures.sort();

      case 'affected':
        return exposures.sort((a, b) => {
          const aImpact = scenario.impacts[a];
          const bImpact = scenario.impacts[b];
          const aCount = aImpact?.affectedFeatures || 0;
          const bCount = bImpact?.affectedFeatures || 0;
          return bCount - aCount;
        });

      case 'depth':
        return exposures.sort((a, b) => {
          const aImpact = scenario.impacts[a];
          const bImpact = scenario.impacts[b];
          const aDepth = aImpact?.maxDepthBin || '';
          const bDepth = bImpact?.maxDepthBin || '';
          const depthOrder = ['15-100cm', '1-2m', '2-3m', '3-4m', '4-5m', 'above5m'];
          return depthOrder.indexOf(aDepth) - depthOrder.indexOf(bDepth);
        });

      default:
        return exposures;
    }
  }, [scenario.impacts, sortBy]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalFeatures = Object.values(scenario.impacts).reduce((sum, impact) => {
      return sum + (impact?.totalFeatures || 0);
    }, 0);

    const totalAffected = Object.values(scenario.impacts).reduce((sum, impact) => {
      return sum + (impact?.affectedFeatures || 0);
    }, 0);

    const affectedLayers = Object.values(scenario.impacts).filter(
      (impact) => impact && impact.affectedFeatures > 0
    ).length;

    const maxDepthAll = Object.values(scenario.impacts).reduce((maxDepth, impact) => {
      if (!impact || !impact.maxDepthBin) return maxDepth;
      const depthOrder = ['15-100cm', '1-2m', '2-3m', '3-4m', '4-5m', 'above5m'];
      const currentIndex = depthOrder.indexOf(impact.maxDepthBin);
      const maxIndex = depthOrder.indexOf(maxDepth);
      return currentIndex > maxIndex ? impact.maxDepthBin : maxDepth;
    }, '15-100cm');

    return {
      totalFeatures,
      totalAffected,
      affectedLayers,
      maxDepthAll,
      impactPercentage: totalFeatures > 0 ? (totalAffected / totalFeatures) * 100 : 0,
    };
  }, [scenario.impacts]);

  // Handle layer visibility toggle
  const handleLayerToggle = useCallback((layerType: ExposureLayerType, visible: boolean) => {
    // Get the GeoServer layer name from the impact data
    const impact = scenario.impacts[layerType];
    const layerName = impact?.geoserverLayer || `${scenario.scenarioId}_${layerType}`;
    onLayerToggle(layerName, visible);
  }, [scenario.impacts, onLayerToggle]);

  // Check if a layer is visible
  const isLayerVisible = useCallback((layerType: ExposureLayerType) => {
    // Get the GeoServer layer name from the impact data
    const impact = scenario.impacts[layerType];
    const layerName = impact?.geoserverLayer || `${scenario.scenarioId}_${layerType}`;
    return visibleLayers.includes(layerName);
  }, [scenario.impacts, visibleLayers]);

  // Toggle all layers on/off
  const handleToggleAll = useCallback((visible: boolean) => {
    EXPOSURE_LAYER_TYPES.forEach((layerType) => {
      const impact = scenario.impacts[layerType];
      if (impact && impact.affectedFeatures > 0) {
        handleLayerToggle(layerType, visible);
      }
    });
  }, [scenario.impacts, handleLayerToggle]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-slate-50 border-b border-slate-200 rounded-t-lg">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-800 mb-1">
            {scenario.returnPeriod}yrs • {formatClimateLabel(scenario.climate)} • Maintenance Level: {formatMaintenanceLabel(scenario.maintenance)}
          </h3>
          <p className="text-xs text-slate-600">
            {summaryStats.affectedLayers} of 9 exposure types affected
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="h-7"
              disabled={isLoading}
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-4">
        <div className="bg-white p-3 rounded-lg border border-slate-200">
          <div className="text-[10px] text-slate-500 mb-1">Total Features</div>
          <div className="text-lg font-bold text-slate-800">{summaryStats.totalFeatures.toLocaleString()}</div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200">
          <div className="text-[10px] text-slate-500 mb-1">Affected</div>
          <div className="text-lg font-bold text-blue-600">{summaryStats.totalAffected.toLocaleString()}</div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200">
          <div className="text-[10px] text-slate-500 mb-1">Impact</div>
          <div className="text-lg font-bold text-slate-800">{summaryStats.impactPercentage.toFixed(1)}%</div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200">
          <div className="text-[10px] text-slate-500 mb-1">Max Depth</div>
          <div className="text-lg font-bold text-red-600">{formatDepthBinLabel(summaryStats.maxDepthAll)}</div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="px-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600">Sort by:</span>
          <div className="flex gap-1">
            {[
              { value: 'name', label: 'Name' },
              { value: 'affected', label: 'Affected' },
              { value: 'depth', label: 'Depth' },
            ].map((sort) => (
              <button
                key={sort.value}
                onClick={() => setSortBy(sort.value as 'name' | 'affected' | 'depth')}
                className={cn(
                  'px-2 py-1 text-[10px] rounded transition-all',
                  sortBy === sort.value
                    ? 'bg-blue-600 text-white font-medium'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {sort.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleToggleAll(true)}
            className="text-xs h-7"
          >
            <Layers className="w-3.5 h-3.5 mr-1" />
            Show All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleToggleAll(false)}
            className="text-xs h-7"
          >
            <EyeOff className="w-3.5 h-3.5 mr-1" />
            Hide All
          </Button>
        </div>
      </div>

      {/* Exposure Layers List */}
      <div className="px-4 space-y-2">
        {sortedExposures.map((layerType) => {
          const impact = scenario.impacts[layerType];
          const isVisible = isLayerVisible(layerType);

          return (
            <ExposureRow
              key={layerType}
              layerType={layerType}
              impact={impact}
              isVisible={isVisible}
              onToggleVisibility={handleLayerToggle}
              initiallyExpanded={impact?.affectedFeatures === impact?.totalFeatures}
            />
          );
        })}
      </div>

      {/* Footer with legend */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 rounded-b-lg">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-[10px] text-slate-600">
            <strong>Legend:</strong> Click layer name to see depth distribution
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-600">
            <span>Depth:</span>
            {['15-100cm', '1-2m', '2-3m', '3-4m', '4-5m', 'above5m'].map((range) => (
              <div
                key={range}
                className="px-1.5 py-0.5 rounded text-white"
                style={{ backgroundColor: DEPTH_BIN_COLOR(range) }}
              >
                {formatDepthBinLabel(range)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

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
