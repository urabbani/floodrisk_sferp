import { useState, useCallback } from 'react';
import { Eye, EyeOff, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { returnPeriods, parameters, maintenanceLevels, climateScenarios } from '@/types/layers';

interface ScenarioMatrixProps {
  climate?: 'Present' | 'Future';
  onLayerToggle: (layerId: string, visible: boolean) => void;
  onCompareModeChange?: (mode: 'single' | 'all') => void;
  visibleLayers: Set<string>;
}

type CompareMode = 'single' | 'all';

// Build layer ID from scenario components (lowercase to match GeoServer layer names)
function buildLayerId(
  climate: string,
  maintenance: string,
  returnPeriod: string,
  parameter: string
): string {
  return `t3_${returnPeriod}yrs_${climate.toLowerCase()}_${maintenance.toLowerCase()}_${parameter.toLowerCase()}`;
}

export function ScenarioMatrix({
  climate: propClimate,
  onLayerToggle,
  onCompareModeChange,
  visibleLayers,
}: ScenarioMatrixProps) {
  const [selectedClimate, setSelectedClimate] = useState<'present' | 'future'>(propClimate?.toLowerCase() as 'present' | 'future' || 'present');
  const [selectedParameter, setSelectedParameter] = useState('maxdepth');
  const [compareMode, setCompareMode] = useState<CompareMode>('single');
  const [selectedMaintenance, setSelectedMaintenance] = useState<string[]>(['breaches']);

  // Handle maintenance selection based on compare mode
  const handleMaintenanceToggle = useCallback((maintenance: string) => {
    setSelectedMaintenance((prev) => {
      if (compareMode === 'single') {
        // Single mode: only one maintenance at a time
        return [maintenance];
      } else {
        // Compare (All) mode: toggle individually
        if (prev.includes(maintenance)) {
          return prev.filter((m) => m !== maintenance);
        }
        return [...prev, maintenance];
      }
    });
  }, [compareMode]);

  // Handle compare mode change
  const handleCompareModeChange = useCallback((mode: CompareMode) => {
    setCompareMode(mode);
    onCompareModeChange?.(mode);

    // Adjust selected maintenances based on mode
    if (mode === 'single') {
      setSelectedMaintenance((prev) => [prev[0] || 'breaches']);
    } else {
      setSelectedMaintenance(['breaches', 'redcapacity', 'perfect']);
    }
  }, [onCompareModeChange]);

  // Check if a cell (return period + maintenance) is active
  const isCellActive = (returnPeriod: string, maintenance: string): boolean => {
    const layerId = buildLayerId(selectedClimate, maintenance, returnPeriod, selectedParameter);
    return visibleLayers.has(layerId);
  };

  // Toggle a specific cell
  const toggleCell = (returnPeriod: string, maintenance: string) => {
    const layerId = buildLayerId(selectedClimate, maintenance, returnPeriod, selectedParameter);
    const isActive = visibleLayers.has(layerId);
    
    // In single mode, turn off other return periods for this maintenance
    if (compareMode === 'single' && selectedMaintenance.length === 1) {
      // Turn off all other layers for this maintenance+parameter combination
      returnPeriods.forEach((rp) => {
        const otherId = buildLayerId(selectedClimate, maintenance, rp.value, selectedParameter);
        if (otherId !== layerId && visibleLayers.has(otherId)) {
          onLayerToggle(otherId, false);
        }
      });
    }
    
    onLayerToggle(layerId, !isActive);
  };

  // Toggle entire row (return period across all selected maintenances)
  const toggleRow = (returnPeriod: string) => {
    const anyActive = selectedMaintenance.some((m) => 
      isCellActive(returnPeriod, m)
    );
    
    selectedMaintenance.forEach((maintenance) => {
      const layerId = buildLayerId(selectedClimate, maintenance, returnPeriod, selectedParameter);
      onLayerToggle(layerId, !anyActive);
    });
  };

  // Toggle entire column (maintenance across all return periods)
  const toggleColumn = (maintenance: string) => {
    const anyActive = returnPeriods.some((rp) => 
      isCellActive(rp.value, maintenance)
    );
    
    returnPeriods.forEach((rp) => {
      const layerId = buildLayerId(selectedClimate, maintenance, rp.value, selectedParameter);
      onLayerToggle(layerId, !anyActive);
    });
  };

  // Get parameter label and unit
  const getParameterInfo = (paramValue: string) => {
    const param = parameters.find((p) => p.value === paramValue);
    return param || { label: paramValue, unit: '', colorScale: 'Blues' };
  };

  const currentParam = getParameterInfo(selectedParameter);

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-slate-50 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-800">Scenario Explorer</h3>
          </div>
          <span className="text-xs text-slate-500">
            {selectedMaintenance.length} maintenance{selectedMaintenance.length !== 1 ? 's' : ''} selected
          </span>
        </div>
      </div>

      {/* Climate Selector */}
      <div className="px-4 py-3 border-b border-slate-100">
        <label className="text-xs font-medium text-slate-500 mb-2 block">Climate Scenario</label>
        <ToggleGroup
          type="single"
          value={selectedClimate}
          onValueChange={(v) => v && setSelectedClimate(v as 'present' | 'future')}
          className="justify-start"
        >
          {climateScenarios.map((cs) => (
            <ToggleGroupItem
              key={cs.value}
              value={cs.value}
              className="text-xs px-3 py-1.5 data-[state=on]:bg-blue-600 data-[state=on]:text-white"
            >
              {cs.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Compare Mode */}
      <div className="px-4 py-3 border-b border-slate-100">
        <label className="text-xs font-medium text-slate-500 mb-2 block">View Mode</label>
        <div className="flex gap-2">
          {[
            { value: 'single', label: 'Single', icon: Eye },
            { value: 'all', label: 'Compare', icon: Layers },
          ].map((mode) => (
            <Button
              key={mode.value}
              variant={compareMode === mode.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCompareModeChange(mode.value as CompareMode)}
              className="flex-1 text-xs h-8"
            >
              <mode.icon className="w-3.5 h-3.5 mr-1.5" />
              {mode.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Parameter Selector */}
      <div className="px-4 py-3 border-b border-slate-100">
        <label className="text-xs font-medium text-slate-500 mb-2 block">
          Parameter {currentParam.unit && `(${currentParam.unit})`}
        </label>
        <div className="grid grid-cols-4 gap-1">
          {parameters.map((param) => (
            <button
              key={param.value}
              onClick={() => setSelectedParameter(param.value)}
              className={cn(
                'px-2 py-2 text-xs rounded-md transition-all border',
                selectedParameter === param.value
                  ? 'bg-blue-600 text-white border-blue-600 font-medium'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
              )}
            >
              {param.label}
            </button>
          ))}
        </div>
      </div>

      {/* Maintenance Level Selector */}
      <div className="px-4 py-3 border-b border-slate-100">
        <label className="text-xs font-medium text-slate-500 mb-2 block">
          Maintenance Condition
        </label>
        <div className="flex flex-col gap-1.5">
          {maintenanceLevels.map((ml) => (
            <button
              key={ml.value}
              onClick={() => handleMaintenanceToggle(ml.value)}
              className={cn(
                'flex items-center justify-between px-3 py-2 text-xs rounded-md transition-all border',
                selectedMaintenance.includes(ml.value)
                  ? 'bg-blue-50 border-blue-300 text-blue-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              )}
            >
              <span>{ml.label}</span>
              {selectedMaintenance.includes(ml.value) && (
                <div className="w-2 h-2 rounded-full bg-blue-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Return Period Matrix */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-medium text-slate-500">Return Period</label>
          <button
            onClick={() => returnPeriods.forEach((rp) => toggleRow(rp.value))}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            Toggle All
          </button>
        </div>

        {/* Matrix Grid */}
        <div className="space-y-2">
          {/* Column headers for maintenance */}
          {compareMode !== 'single' && (
            <div className="grid grid-cols-8 gap-1">
              <div className="col-span-1" /> {/* Empty corner */}
              {selectedMaintenance.map((m) => (
                <button
                  key={m}
                  onClick={() => toggleColumn(m)}
                  className="col-span-1 text-[10px] text-center text-slate-500 hover:text-blue-600 truncate px-1"
                  title={maintenanceLevels.find((ml) => ml.value === m)?.label}
                >
                  {m === 'breaches' ? '2022' : m === 'redcapacity' ? 'RedCap' : 'Perfect'}
                </button>
              ))}
            </div>
          )}

          {/* Return period rows */}
          <div className="space-y-1">
            {returnPeriods.map((rp) => (
              <div key={rp.value} className="grid grid-cols-8 gap-1">
                {/* Return period label */}
                <button
                  onClick={() => toggleRow(rp.value)}
                  className="col-span-1 text-[10px] text-right text-slate-600 hover:text-blue-600 pr-2 py-2"
                >
                  {rp.label.replace(' Years', '')}
                </button>

                {/* Maintenance cells */}
                {compareMode === 'single' ? (
                  // Single mode: one button per return period
                  <button
                    onClick={() => toggleRow(rp.value)}
                    className={cn(
                      'col-span-7 py-2 px-3 rounded-md text-xs font-medium transition-all border',
                      selectedMaintenance.some((m) => isCellActive(rp.value, m))
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                    )}
                  >
                    {selectedMaintenance.length > 0 
                      ? maintenanceLevels.find((ml) => ml.value === selectedMaintenance[0])?.label 
                      : 'Select'}
                  </button>
                ) : (
                  // Compare/All mode: separate buttons for each maintenance
                  selectedMaintenance.map((m) => (
                    <button
                      key={m}
                      onClick={() => toggleCell(rp.value, m)}
                      className={cn(
                        'col-span-1 py-2 rounded-md text-xs transition-all border flex items-center justify-center',
                        isCellActive(rp.value, m)
                          ? m === selectedMaintenance[0]
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-green-600 text-white border-green-600'
                          : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-blue-300'
                      )}
                      title={`${rp.label} - ${maintenanceLevels.find((ml) => ml.value === m)?.label}`}
                    >
                      {isCellActive(rp.value, m) ? (
                        <Eye className="w-3.5 h-3.5" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 opacity-30" />
                      )}
                    </button>
                  ))
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Legend for compare mode */}
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
        <label className="text-xs font-medium text-slate-500 mb-2 block">Quick Select</label>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Show all return periods for selected maintenances
              returnPeriods.forEach((rp) => {
                selectedMaintenance.forEach((m) => {
                  const layerId = buildLayerId(selectedClimate, m, rp.value, selectedParameter);
                  onLayerToggle(layerId, true);
                });
              });
            }}
            className="flex-1 text-xs h-8"
          >
            All Return Periods
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Show common events: 25, 50, 100 years
              ['25', '50', '100'].forEach((rp) => {
                selectedMaintenance.forEach((m) => {
                  const layerId = buildLayerId(selectedClimate, m, rp, selectedParameter);
                  onLayerToggle(layerId, true);
                });
              });
            }}
            className="flex-1 text-xs h-8"
          >
            Common Events
          </Button>
        </div>
      </div>
    </div>
  );
}
