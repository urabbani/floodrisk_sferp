import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Shield, Layers, Map, BarChart3, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { RiskView, ScenarioKey, DistrictName, ScenarioMeta } from '@/types/risk';
import { totalRiskValue, buildScenarioKey } from '@/types/risk';
import { useRiskData } from './hooks/useRiskData';
import { RiskSummaryHeatmap } from './views/RiskSummaryHeatmap';
import { RiskDistrictBreakdown } from './views/RiskDistrictBreakdown';
import { RiskSpatialView } from './views/RiskSpatialView';

const MODE = 'Dmg' as const;

export interface RiskDashboardProps {
  onViewChange?: (view: RiskView) => void;
  onChoroplethData?: (data: Record<DistrictName, number> | null) => void;
  className?: string;
}

export function RiskDashboard({
  onViewChange,
  onChoroplethData,
  className,
}: RiskDashboardProps) {
  // View state
  const [currentView, setCurrentView] = useState<RiskView>('summary');
  const [selectedClimate, setSelectedClimate] = useState<'present' | 'future'>('present');
  const [selectedScenarioKey, setSelectedScenarioKey] = useState<ScenarioKey | null>(null);

  // Spatial view state
  const [spatialReturnPeriod, setSpatialReturnPeriod] = useState<number>(25);
  const [spatialMaintenance, setSpatialMaintenance] = useState<'breaches' | 'redcapacity' | 'perfect'>('breaches');
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleHoverDistrict = useCallback((district: string | null) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (district) {
      setHoveredDistrict(district);
    } else {
      // Small delay before clearing to avoid flicker on polygon edges
      hoverTimeoutRef.current = setTimeout(() => setHoveredDistrict(null), 150);
    }
  }, []);

  // Data
  const { data, isLoading, error } = useRiskData();

  // Notify parent of view changes
  useEffect(() => {
    onViewChange?.(currentView);
  }, [currentView, onViewChange]);

  // Compute choropleth data for spatial view
  const choroplethData = useMemo(() => {
    if (!data || currentView !== 'spatial') return null;

    const key = `${spatialReturnPeriod}_${selectedClimate}_${spatialMaintenance}`;
    const scenarioData = data.data[key];
    if (!scenarioData) return null;

    const result: Record<DistrictName, number> = {} as any;
    for (const district of data.districts) {
      const regionData = scenarioData[district]?.[MODE];
      result[district as DistrictName] = regionData ? totalRiskValue(regionData) : 0;
    }
    return result;
  }, [data, currentView, spatialReturnPeriod, selectedClimate, spatialMaintenance]);

  // Push choropleth data to parent
  useEffect(() => {
    onChoroplethData?.(choroplethData);
  }, [choroplethData, onChoroplethData]);

  // Clean up choropleth when leaving spatial view
  useEffect(() => {
    if (currentView !== 'spatial') {
      onChoroplethData?.(null);
    }
  }, [currentView, onChoroplethData]);

  const handleClimateChange = useCallback((climate: 'present' | 'future') => {
    setSelectedClimate((prev) => {
      if (selectedScenarioKey && currentView === 'district') {
        // Rebuild scenario key with new climate, keeping return period and maintenance
        const parts = selectedScenarioKey.split('_');
        const newKey = `${parts[0]}_${climate}_${parts.slice(2).join('_')}`;
        setSelectedScenarioKey(newKey);
      } else {
        setSelectedScenarioKey(null);
      }
      return climate;
    });
  }, [selectedScenarioKey, currentView]);

  const handleScenarioClick = useCallback((key: ScenarioKey) => {
    setSelectedScenarioKey(key);
    setCurrentView('district');
  }, []);

  const handleBackToSummary = useCallback(() => {
    setCurrentView('summary');
    setSelectedScenarioKey(null);
  }, []);

  const handleSpatialScenarioChange = useCallback((key: ScenarioKey) => {
    const parts = key.split('_');
    setSpatialReturnPeriod(parseFloat(parts[0]));
    setSpatialMaintenance(parts[2] as any);
  }, []);

  return (
    <div className={cn('bg-white rounded-lg border border-slate-200 flex flex-col h-full', className)}>
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-slate-50 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-600" />
            <h3 className="text-sm font-semibold text-slate-800">Risk Analysis</h3>
          </div>

          {/* View Toggle */}
          <div className="flex gap-1">
            <Button
              variant={currentView === 'summary' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('summary')}
              className="text-xs h-7"
            >
              <Layers className="w-3.5 h-3.5 mr-1" />
              Summary
            </Button>
            <Button
              variant={currentView === 'district' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('district')}
              className="text-xs h-7"
              disabled={!selectedScenarioKey}
            >
              <BarChart3 className="w-3.5 h-3.5 mr-1" />
              District
            </Button>
            <Button
              variant={currentView === 'spatial' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('spatial')}
              className="text-xs h-7"
            >
              <Map className="w-3.5 h-3.5 mr-1" />
              Spatial
            </Button>
          </div>
        </div>
      </div>

      {/* Controls Bar — Climate only */}
      <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-medium text-slate-600">Climate:</label>
            <div className="flex gap-1">
              {(['present', 'future'] as const).map((climate) => (
                <button
                  key={climate}
                  onClick={() => handleClimateChange(climate)}
                  className={cn(
                    'px-2.5 py-1 text-[10px] rounded-md transition-all capitalize',
                    selectedClimate === climate
                      ? 'bg-green-600 text-white font-medium'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-green-300',
                  )}
                >
                  {climate}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative flex-1 overflow-y-auto">
        {/* Loading */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-600">Loading risk data...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="text-red-600 font-medium mb-2">Error Loading Data</p>
              <p className="text-sm text-slate-600">{error}</p>
            </div>
          </div>
        )}

        {/* Summary View */}
        {currentView === 'summary' && !isLoading && !error && data && (
          <RiskSummaryHeatmap
            data={data}
            climate={selectedClimate}
            mode={MODE}
            selectedKey={selectedScenarioKey}
            onScenarioClick={handleScenarioClick}
          />
        )}

        {/* District View */}
        {currentView === 'district' && selectedScenarioKey && !isLoading && !error && data && (
          <RiskDistrictBreakdown
            data={data}
            scenarioKey={selectedScenarioKey}
            mode={MODE}
            onBack={handleBackToSummary}
          />
        )}

        {/* Spatial View */}
        {currentView === 'spatial' && !isLoading && !error && data && (
          <RiskSpatialView
            data={data}
            climate={selectedClimate}
            maintenance={spatialMaintenance}
            returnPeriod={spatialReturnPeriod}
            mode={MODE}
            choroplethData={choroplethData}
            hoveredDistrict={hoveredDistrict}
            onScenarioChange={handleSpatialScenarioChange}
            onHoverDistrict={handleHoverDistrict}
          />
        )}
      </div>

      {/* Footer */}
      {data && !error && !isLoading && (
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex-shrink-0">
          <p className="text-xs text-slate-500">
            {Object.keys(data.scenarios).length} scenarios • {data.districts.length} districts
          </p>
        </div>
      )}
    </div>
  );
}
