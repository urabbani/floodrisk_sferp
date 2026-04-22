import { useState, useCallback, useEffect, useMemo } from 'react';
import { Layers, BarChart3, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type {
  ScenarioImpactSummary,
  ExposureLayerType,
  ImpactSummaryQuery,
} from '@/types/impact';
import { useImpactData } from './hooks/useImpactData';
import { SummaryHeatmapView } from './views/SummaryHeatmapView';
import { DetailedBreakdownView } from './views/DetailedBreakdownView';
import { CompareView } from './views/CompareView';
import type { LayerInfo } from '@/types/layers';
import { EXPOSURE_LAYER_GEOMETRY, formatClimateLabel, formatMaintenanceLabel } from '@/types/impact';
import { filterScenariosByThreshold, createCQLFilterForThreshold } from '@/lib/depth-filter';

// View types for the impact matrix
type ImpactView = 'summary' | 'detail' | 'compare';

/**
 * Props for the ImpactMatrix component
 */
export interface ImpactMatrixProps {
  /**
   * Callback when a layer should be toggled on/off on the map
   */
  onLayerToggle: (layerId: string, visible: boolean) => void;

  /**
   * Currently visible layers on the map
   */
  visibleLayers: string[];

  /**
   * Callback when available impact layers change
   * Provides layer metadata for the currently selected scenario
   */
  onImpactLayersChange?: (layers: LayerInfo[]) => void;

  /**
   * Callback when the current view changes
   * Notifies parent component of view state for dynamic UI adjustments
   */
  onViewChange?: (view: 'summary' | 'detail' | 'compare') => void;

  /**
   * Initial climate to display
   */
  initialClimate?: 'present' | 'future';

  /**
   * Additional class names
   */
  className?: string;
}

/**
 * ImpactMatrix - Main container for flood impact and exposure display
 *
 * This component provides three views:
 * 1. Summary Heatmap - Quick overview of impact severity across all scenarios
 * 2. Detailed Breakdown - Per-scenario exposure details with layer controls
 * 3. Comparative Analysis - Side-by-side scenario comparison
 */
export function ImpactMatrix({
  onLayerToggle,
  visibleLayers,
  onImpactLayersChange,
  onViewChange,
  initialClimate = 'present',
  className,
}: ImpactMatrixProps) {
  // UI State
  const [currentView, setCurrentView] = useState<ImpactView>('summary');
  const [selectedClimate, setSelectedClimate] = useState<'present' | 'future'>(initialClimate);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioImpactSummary | null>(null);
  const [depthThreshold, setDepthThreshold] = useState<number>(0); // Depth filter in meters

  // Build query for the hook (memoized to prevent unnecessary refetches)
  const query: ImpactSummaryQuery = useMemo(() => ({
    climate: selectedClimate,
  }), [selectedClimate]);

  // Fetch impact data using the custom hook
  const { data: impactData, isLoading, error, refetch } = useImpactData(query, {
    enabled: true,
  });

  /**
   * Handle depth threshold change
   * This filters both the impact data and the map layers
   */
  const handleDepthThresholdChange = useCallback((threshold: number) => {
    setDepthThreshold(threshold);
    console.log('[ImpactMatrix] Depth threshold changed:', threshold);
  }, []);

  /**
   * Filter impact data based on depth threshold
   */
  const filteredImpactData = useMemo(() => {
    if (!impactData) return null;

    if (depthThreshold === 0) {
      // No filtering needed
      return impactData;
    }

    // Apply depth threshold filtering
    return {
      ...impactData,
      summaries: filterScenariosByThreshold(impactData.summaries, depthThreshold),
    };
  }, [impactData, depthThreshold]);

  /**
   * Get CQL filter for map layers based on depth threshold
   */
  const cqlFilter = useMemo(() => {
    if (depthThreshold === 0) return undefined;
    return createCQLFilterForThreshold(depthThreshold, true); // Use discrete bins
  }, [depthThreshold]);

  /**
   * Handle climate change
   */
  const handleClimateChange = useCallback((climate: 'present' | 'future') => {
    setSelectedClimate(climate);
    setSelectedScenario(null); // Reset selected scenario when climate changes
    setCurrentView('summary'); // Reset to summary view when climate changes
  }, []);

  /**
   * Handle scenario cell click in summary view
   */
  const handleScenarioClick = useCallback((scenario: ScenarioImpactSummary) => {
    setSelectedScenario(scenario);
    setCurrentView('detail');
  }, []);

  /**
   * Handle exposure layer toggle
   * Receives layer ID (geoserverLayer name) and visibility state
   */
  const handleExposureToggle = useCallback((
    layerId: string,
    visible: boolean
  ) => {
    console.log('[ImpactMatrix] Toggle layer:', {
      layerId,
      visible
    });

    // Just pass through to parent - the layerId is already the correct GeoServer layer name
    onLayerToggle(layerId, visible);
  }, [onLayerToggle]);

  /**
   * Return to summary view
   */
  const handleBackToSummary = useCallback(() => {
    setCurrentView('summary');
    setSelectedScenario(null);
  }, []);

  /**
   * Clear impact layers when climate changes
   */
  useEffect(() => {
    // Clear impact layers when climate changes to prevent stale data
    console.log('[ImpactMatrix] Climate changed, clearing impact layers');
    onImpactLayersChange?.([]);
  }, [selectedClimate, onImpactLayersChange]);

  /**
   * Notify parent when current view changes
   * This allows parent to adjust UI constraints (e.g., max sidebar width)
   */
  useEffect(() => {
    onViewChange?.(currentView);
  }, [currentView, onViewChange]);

  /**
   * Build LayerInfo objects from impact data for the selected scenario
   * This allows MapViewer to display impact layers
   */
  useEffect(() => {
    if (!selectedScenario || !onImpactLayersChange) {
      // No scenario selected, clear impact layers
      console.log('[ImpactMatrix] No scenario selected, clearing impact layers');
      onImpactLayersChange?.([]);
      return;
    }

    // Build LayerInfo for each exposure type in the selected scenario
    const impactLayers: LayerInfo[] = Object.entries(selectedScenario.impacts)
      .filter(([, impact]) => impact !== null)
      .map(
      ([exposureType, impact]) => {
        // Map geometry type to LayerInfo geometry type
        const geometryType = EXPOSURE_LAYER_GEOMETRY[exposureType as ExposureLayerType] === 'point'
          ? ('point' as const)
          : EXPOSURE_LAYER_GEOMETRY[exposureType as ExposureLayerType] === 'line'
            ? ('line' as const)
            : ('polygon' as const);

        return {
          id: impact!.geoserverLayer,
          name: `${selectedScenario.returnPeriod}yrs ${formatClimateLabel(selectedScenario.climate)} - ${formatMaintenanceLabel(selectedScenario.maintenance)} - ${exposureType}`,
          type: 'wms',
          geometryType,
          visible: false,
          opacity: 0.7,
          geoserverName: impact!.geoserverLayer,
          workspace: impact!.workspace || 'exposures',
          style: undefined,
          legendUrl: undefined,
          zIndex: geometryType === 'point' ? 150 : geometryType === 'line' ? 100 : 50,
          filter: cqlFilter, // Apply CQL filter based on depth threshold
        };
      }
    );

    console.log('[ImpactMatrix] Impact layers created:', {
      scenarioId: selectedScenario.scenarioId,
      totalLayers: impactLayers.length,
      layers: impactLayers.map(l => ({ id: l.id, workspace: l.workspace, name: l.name, filter: l.filter }))
    });

    onImpactLayersChange(impactLayers);
  }, [selectedScenario, onImpactLayersChange, cqlFilter]);

  return (
    <div className={cn('bg-white rounded-lg border border-slate-200 flex flex-col h-full', className)}>
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-slate-50 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-800">Flood Impact & Exposure</h3>
          </div>

          {/* View Toggle */}
          <div className="flex gap-1">
            <Button
              variant={currentView === 'summary' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('summary')}
              className="text-sm h-7"
            >
              <Layers className="w-3.5 h-3.5 mr-1" />
              Summary
            </Button>
            {/* Compare tab hidden - functionality preserved in code */}
            {/* <Button
              variant={currentView === 'compare' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('compare')}
              className="text-sm h-7"
            >
              <BarChart3 className="w-3.5 h-3.5 mr-1" />
              Compare
            </Button> */}
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      {currentView !== 'compare' && (
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            {/* Climate Selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-600">Climate:</label>
              <div className="flex gap-1">
                {['present', 'future'].map((climate) => (
                  <button
                    key={climate}
                    onClick={() => handleClimateChange(climate as 'present' | 'future')}
                    className={cn(
                      'px-3 py-1.5 text-sm rounded-md transition-all capitalize',
                      selectedClimate === climate
                        ? 'bg-blue-600 text-white font-medium'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'
                    )}
                  >
                    {climate}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="relative flex-1 overflow-y-auto">
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-600">Loading impact data...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="text-red-600 font-medium mb-2">Error Loading Data</p>
              <p className="text-sm text-slate-600 mb-4">{error}</p>
              <div className="flex gap-2 justify-center">
                <Button
                  size="sm"
                  onClick={() => refetch()}
                >
                  Retry
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedClimate(selectedClimate === 'present' ? 'future' : 'present')}
                >
                  Switch Climate
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Summary View */}
        {currentView === 'summary' && !isLoading && !error && filteredImpactData && (
          <SummaryHeatmapView
            scenarios={filteredImpactData.summaries}
            selectedScenario={selectedScenario}
            isLoading={isLoading}
            onScenarioClick={handleScenarioClick}
          />
        )}

        {/* Detail View */}
        {currentView === 'detail' && selectedScenario && !isLoading && !error && (
          <DetailedBreakdownView
            scenario={selectedScenario}
            visibleLayers={visibleLayers}
            onLayerToggle={handleExposureToggle}
            onClose={handleBackToSummary}
            onRefresh={refetch}
            depthThreshold={depthThreshold}
            onDepthThresholdChange={handleDepthThresholdChange}
            cqlFilter={cqlFilter}
          />
        )}

        {/* Compare View */}
        {currentView === 'compare' && !isLoading && !error && (
          <CompareView className="h-full" />
        )}
      </div>

      {/* Footer */}
      {impactData && !error && !isLoading && (
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex-shrink-0">
          <p className="text-sm text-slate-500">
            Last updated: {new Date(impactData.metadata.lastUpdated).toLocaleString()}
            {' • '}
            {impactData.metadata.totalScenarios} scenarios loaded
          </p>
        </div>
      )}
    </div>
  );
}
