import { useState, useCallback, useMemo } from 'react';
import { X, RefreshCw, Layers, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ScenarioImpactSummary, ExposureLayerType } from '@/types/impact';
import { EXPOSURE_LAYER_TYPES, formatDepthBinLabel, formatClimateLabel, formatMaintenanceLabel } from '@/types/impact';
import { ExposureRow } from '../components/ExposureRow';
import { DepthDistributionChart } from '../components/DepthDistributionChart';
import { DepthThresholdSlider } from '../components/DepthThresholdSlider';
import { filterScenarioByThreshold } from '@/lib/depth-filter';

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
   * Current depth threshold value (in meters)
   */
  depthThreshold: number;

  /**
   * Callback when depth threshold changes
   */
  onDepthThresholdChange: (threshold: number) => void;

  /**
   * CQL filter to apply to map layers (based on depth threshold)
   */
  cqlFilter?: string;

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
 * - 4 summary cards: Population, Infrastructure, Agriculture/Buildings, Overall Severity
 * - Population depth distribution chart (if data available)
 * - All 9 exposure layers with their impact details
 * - Layer toggles for map visibility
 * - Depth distribution charts per exposure layer
 * - Zoom to extent functionality
 */
export function DetailedBreakdownView({
  scenario,
  visibleLayers,
  onLayerToggle,
  onClose,
  onRefresh,
  isLoading = false,
  depthThreshold,
  onDepthThresholdChange,
  cqlFilter: _cqlFilter,
  className,
}: DetailedBreakdownViewProps) {
  const [sortBy, setSortBy] = useState<'name' | 'affected' | 'depth'>('affected');

  // Filter scenario based on depth threshold
  const filteredScenario = useMemo(() => {
    if (depthThreshold === 0) return scenario;
    return filterScenarioByThreshold(scenario, depthThreshold);
  }, [scenario, depthThreshold]);

  // Sort exposure layers
  const sortedExposures = useMemo(() => {
    const exposures = [...EXPOSURE_LAYER_TYPES];

    switch (sortBy) {
      case 'name':
        return exposures.sort();

      case 'affected':
        return exposures.sort((a, b) => {
          const aImpact = filteredScenario.impacts[a];
          const bImpact = filteredScenario.impacts[b];
          const aCount = aImpact?.affectedFeatures || 0;
          const bCount = bImpact?.affectedFeatures || 0;
          return bCount - aCount;
        });

      case 'depth':
        return exposures.sort((a, b) => {
          const aImpact = filteredScenario.impacts[a];
          const bImpact = filteredScenario.impacts[b];
          const aDepth = aImpact?.maxDepthBin || '';
          const bDepth = bImpact?.maxDepthBin || '';
          const depthOrder = ['15-100cm', '1-2m', '2-3m', '3-4m', '4-5m', 'above5m'];
          return depthOrder.indexOf(aDepth) - depthOrder.indexOf(bDepth);
        });

      default:
        return exposures;
    }
  }, [filteredScenario.impacts, sortBy]);

  // Calculate summary stats for new 4-card design
  const summaryStats = useMemo(() => {
    const impacts = filteredScenario.impacts;

    // Population Impact (if available)
    const populationImpact = filteredScenario.populationImpact ? {
      total: filteredScenario.populationImpact.totalPopulation,
      affected: filteredScenario.populationImpact.affectedPopulation,
      percentage: filteredScenario.populationImpact.affectedPercentage,
    } : null;

    // Infrastructure Impact (Roads, Railways, Electric Grid, Telecom)
    const infrastructureLayers: ExposureLayerType[] = ['Roads', 'Railways', 'Electric_Grid', 'Telecom_Towers'];
    const infrastructureImpacts = infrastructureLayers
      .map(layer => impacts[layer])
      .filter(impact => impact && impact.totalFeatures > 0);

    const infrastructureTotal = infrastructureImpacts.reduce((sum, impact) => sum + (impact?.totalFeatures || 0), 0);
    const infrastructureAffected = infrastructureImpacts.reduce((sum, impact) => sum + (impact?.affectedFeatures || 0), 0);
    const infrastructurePercentage = infrastructureTotal > 0
      ? (infrastructureAffected / infrastructureTotal) * 100
      : 0;

    // Agriculture & Buildings Impact (Cropped Area, Buildings)
    const agBuildingLayers: ExposureLayerType[] = ['Cropped_Area', 'Buildings'];
    const agBuildingImpacts = agBuildingLayers
      .map(layer => impacts[layer])
      .filter(impact => impact && impact.totalFeatures > 0);

    const agBuildingTotal = agBuildingImpacts.reduce((sum, impact) => sum + (impact?.totalFeatures || 0), 0);
    const agBuildingAffected = agBuildingImpacts.reduce((sum, impact) => sum + (impact?.affectedFeatures || 0), 0);
    const agBuildingPercentage = agBuildingTotal > 0
      ? (agBuildingAffected / agBuildingTotal) * 100
      : 0;

    // Overall Severity based on affected layers
    const affectedLayersCount = Object.values(impacts).filter(
      (impact) => impact && impact.affectedFeatures > 0
    ).length;

    return {
      populationImpact,
      infrastructurePercentage,
      agBuildingPercentage,
      affectedLayersCount,
      severity: filteredScenario.severity,
    };
  }, [filteredScenario.impacts, filteredScenario.populationImpact, filteredScenario.severity]);

  // Handle layer visibility toggle
  const handleLayerToggle = useCallback((layerType: ExposureLayerType, visible: boolean) => {
    // Get the GeoServer layer name from the impact data (use original scenario, not filtered)
    const impact = scenario.impacts[layerType];
    const layerName = impact?.geoserverLayer || `${scenario.scenarioId}_${layerType}`;
    onLayerToggle(layerName, visible);
  }, [scenario.impacts, onLayerToggle]);

  // Check if a layer is visible
  const isLayerVisible = useCallback((layerType: ExposureLayerType) => {
    // Get the GeoServer layer name from the impact data (use original scenario, not filtered)
    const impact = scenario.impacts[layerType];
    const layerName = impact?.geoserverLayer || `${scenario.scenarioId}_${layerType}`;
    return visibleLayers.includes(layerName);
  }, [scenario.impacts, visibleLayers]);

  // Toggle all layers on/off
  const handleToggleAll = useCallback((visible: boolean) => {
    EXPOSURE_LAYER_TYPES.forEach((layerType) => {
      const impact = filteredScenario.impacts[layerType];
      if (impact && impact.affectedFeatures > 0) {
        handleLayerToggle(layerType, visible);
      }
    });
  }, [filteredScenario.impacts, handleLayerToggle]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-slate-50 border-b border-slate-200 rounded-t-lg">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-800 mb-1">
            {scenario.returnPeriod}yrs • {formatClimateLabel(scenario.climate)} • Maintenance Level: {formatMaintenanceLabel(scenario.maintenance)}
          </h3>
          <p className="text-xs text-slate-600">
            {summaryStats.affectedLayersCount} exposure types affected
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

      {/* Summary Stats Cards - Hybrid Design */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-4">
        {/* 1. Population Affected */}
        <div className="bg-white p-3 rounded-lg border border-slate-200">
          <div className="text-[10px] text-slate-500 mb-1">Population Affected</div>
          {summaryStats.populationImpact ? (
            <>
              <div className="text-lg font-bold text-red-600">
                {summaryStats.populationImpact.affected.toLocaleString(undefined, {maximumFractionDigits: 0})}
              </div>
              <div className="text-[9px] text-slate-400">
                People impacted
              </div>
            </>
          ) : (
            <>
              <div className="text-lg font-bold text-slate-400">--</div>
              <div className="text-[9px] text-slate-400">No data</div>
            </>
          )}
        </div>

        {/* 2. Infrastructure Impact */}
        <div className="bg-white p-3 rounded-lg border border-slate-200">
          <div className="text-[10px] text-slate-500 mb-1">Infrastructure</div>
          <div className="text-lg font-bold text-orange-600">
            {summaryStats.infrastructurePercentage.toFixed(1)}%
          </div>
          <div className="text-[9px] text-slate-400">
            Roads, Railways, Electric, Telecom
          </div>
        </div>

        {/* 3. Agriculture & Buildings */}
        <div className="bg-white p-3 rounded-lg border border-slate-200">
          <div className="text-[10px] text-slate-500 mb-1">Ag. & Buildings</div>
          <div className="text-lg font-bold text-amber-600">
            {summaryStats.agBuildingPercentage.toFixed(1)}%
          </div>
          <div className="text-[9px] text-slate-400">
            Crops, Buildings affected
          </div>
        </div>

        {/* 4. Overall Severity */}
        <div className="bg-white p-3 rounded-lg border border-slate-200">
          <div className="text-[10px] text-slate-500 mb-1">Overall Risk</div>
          <div className={cn(
            'text-lg font-bold',
            summaryStats.severity === 'extreme' ? 'text-red-700' :
            summaryStats.severity === 'high' ? 'text-red-500' :
            summaryStats.severity === 'medium' ? 'text-amber-600' :
            'text-green-600'
          )}>
            {summaryStats.severity.charAt(0).toUpperCase() + summaryStats.severity.slice(1)}
          </div>
          <div className="text-[9px] text-slate-400">
            {summaryStats.affectedLayersCount} layers affected
          </div>
        </div>
      </div>

      {/* Depth Threshold Slider */}
      <div className="px-4 py-3 bg-white rounded-lg border border-slate-200">
        <DepthThresholdSlider
          value={depthThreshold}
          onChange={onDepthThresholdChange}
          min={0}
          max={5}
          step={0.1}
        />
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
        {/* Population Depth Distribution (if available) */}
        {filteredScenario.populationImpact && (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <button
              onClick={() => {/* Population chart always expanded for now */}}
              className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-red-50 to-slate-50 hover:from-red-100 hover:to-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-slate-800">Population Impact</span>
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                  {filteredScenario.populationImpact.affectedPopulation.toLocaleString(undefined, {maximumFractionDigits: 0})} people affected
                </span>
              </div>
            </button>

            <div className="p-4">
              <DepthDistributionChart
                depthBins={filteredScenario.populationImpact.depthBins.map(bin => ({
                  range: bin.range,
                  count: bin.population,
                  percentage: bin.percentage,
                }))}
              />
            </div>
          </div>
        )}

        {sortedExposures.map((layerType) => {
          const impact = filteredScenario.impacts[layerType];
          const isVisible = isLayerVisible(layerType);

          return (
            <ExposureRow
              key={layerType}
              layerType={layerType}
              impact={impact}
              isVisible={isVisible}
              onToggleVisibility={handleLayerToggle}
              initiallyExpanded={true}
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
