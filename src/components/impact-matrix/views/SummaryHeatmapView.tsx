import { useState, useCallback, useMemo } from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ScenarioImpactSummary } from '@/types/impact';
import { returnPeriods, maintenanceLevels } from '@/types/layers';
import { formatMaintenanceLabel } from '@/types/impact';
import { ImpactCell } from '../components/ImpactCell';

// Return period intensity levels for color gradient (lightest to darkest)
const RETURN_PERIOD_COLORS = {
  '2.3': { h: 0, s: 80, l: 90 },   // Lightest red
  '5': { h: 0, s: 82, l: 82 },
  '10': { h: 0, s: 84, l: 74 },
  '25': { h: 0, s: 86, l: 66 },
  '50': { h: 0, s: 88, l: 58 },
  '100': { h: 0, s: 90, l: 50 },
  '500': { h: 0, s: 95, l: 35 },   // Darkest red
};

interface SummaryHeatmapViewProps {
  /**
   * Array of scenario summaries to display
   */
  scenarios: ScenarioImpactSummary[];

  /**
   * Currently selected scenario (for highlighting)
   */
  selectedScenario?: ScenarioImpactSummary | null;

  /**
   * Loading state
   */
  isLoading?: boolean;

  /**
   * Click handler for a scenario cell
   */
  onScenarioClick: (scenario: ScenarioImpactSummary) => void;

  /**
   * Additional class names
   */
  className?: string;
}

/**
 * SummaryHeatmapView - Displays a matrix of impact cells organized by return period and maintenance
 *
 * Layout:
 * Rows: Return Periods (2.3, 5, 10, 25, 50, 100, 500 years)
 * Columns: Maintenance Levels (Breaches, RedCapacity, Perfect)
 *
 * Each cell shows:
 * - Number of affected exposure types (0-9)
 * - Background color based on severity
 * - Click to view detailed breakdown
 */
export function SummaryHeatmapView({
  scenarios,
  selectedScenario,
  isLoading = false,
  onScenarioClick,
  className,
}: SummaryHeatmapViewProps) {
  const [hoveredScenario, setHoveredScenario] = useState<ScenarioImpactSummary | null>(null);

  /**
   * Organize scenarios into a matrix for easy lookup
   * Key: "{returnPeriod}|{maintenance}"
   */
  const scenarioMatrix = useMemo(() => {
    const matrix = new Map<string, ScenarioImpactSummary>();
    scenarios.forEach((scenario) => {
      const key = `${scenario.returnPeriod}|${scenario.maintenance}`;
      matrix.set(key, scenario);
    });
    return matrix;
  }, [scenarios]);

  /**
   * Get scenario for a specific cell
   */
  const getScenario = useCallback((returnPeriod: string, maintenance: string) => {
    const key = `${returnPeriod}|${maintenance}`;
    return scenarioMatrix.get(key);
  }, [scenarioMatrix]);

  /**
   * Check if a scenario is selected
   */
  const isScenarioSelected = useCallback((scenario: ScenarioImpactSummary) => {
    return selectedScenario?.scenarioId === scenario.scenarioId;
  }, [selectedScenario]);

  /**
   * Check if a scenario is hovered
   */
  const isScenarioHovered = useCallback((scenario: ScenarioImpactSummary) => {
    return hoveredScenario?.scenarioId === scenario.scenarioId;
  }, [hoveredScenario]);

  /**
   * Calculate statistics for the summary
   */
  const stats = useMemo(() => {
    const totalScenarios = scenarios.length;
    const withImpact = scenarios.filter((s) => s.totalAffectedExposures > 0).length;
    const extremeScenarios = scenarios.filter((s) => s.severity === 'extreme').length;
    const highScenarios = scenarios.filter((s) => s.severity === 'high').length;

    return {
      totalScenarios,
      withImpact,
      extremeScenarios,
      highScenarios,
      averageAffected: totalScenarios > 0
        ? scenarios.reduce((sum, s) => sum + s.totalAffectedExposures, 0) / totalScenarios
        : 0,
    };
  }, [scenarios]);

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-16', className)}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-600">Loading impact data...</p>
        </div>
      </div>
    );
  }

  if (scenarios.length === 0) {
    return (
      <div className={cn('flex items-center justify-center py-16', className)}>
        <div className="text-center">
          <p className="text-slate-600 mb-2">No impact data available</p>
          <p className="text-xs text-slate-500">Try selecting a different climate scenario</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Summary Statistics */}
      <div className="px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-slate-700">Summary</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <div className="text-slate-500">Total Scenarios</div>
            <div className="font-semibold text-slate-800">{stats.totalScenarios}</div>
          </div>
          <div>
            <div className="text-slate-500">With Impact</div>
            <div className="font-semibold text-orange-600">{stats.withImpact}</div>
          </div>
          <div>
            <div className="text-slate-500">Avg Affected</div>
            <div className="font-semibold text-slate-800">{stats.averageAffected.toFixed(1)}</div>
          </div>
          <div>
            <div className="text-slate-500">High/Extreme</div>
            <div className="font-semibold text-red-600">{stats.extremeScenarios + stats.highScenarios}</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 bg-white rounded border border-slate-200">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs text-slate-600">Return Period:</span>
          <div className="flex items-center gap-1">
            {returnPeriods.map((rp) => (
              <div
                key={rp.value}
                className="flex items-center gap-1"
              >
                <div
                  className="w-4 h-3 rounded-sm border border-slate-300"
                  style={{
                    backgroundColor: `hsl(${RETURN_PERIOD_COLORS[rp.value as keyof typeof RETURN_PERIOD_COLORS]?.h || 0}, ${RETURN_PERIOD_COLORS[rp.value as keyof typeof RETURN_PERIOD_COLORS]?.s || 80}%, ${RETURN_PERIOD_COLORS[rp.value as keyof typeof RETURN_PERIOD_COLORS]?.l || 70}%)`
                  }}
                />
                <span className="text-[10px] text-slate-600 hidden sm:inline">{rp.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Heatmap Matrix */}
      <div className="overflow-x-auto">
        <div className="min-w-[500px]">
          {/* Column Headers */}
          <div className="grid grid-cols-[80px_repeat(3,60px)] gap-2 mb-2 px-4">
            <div />
            {maintenanceLevels.map((ml) => (
              <div
                key={ml.value}
                className="text-center text-[10px] font-medium text-slate-600"
              >
                {ml.value === 'breaches' ? '2022' :
                 ml.value === 'redcapacity' ? formatMaintenanceLabel(ml.value) :
                 ml.label}
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="space-y-1 px-4">
            {returnPeriods.map((rp) => (
              <div
                key={rp.value}
                className="grid grid-cols-[80px_repeat(3,60px)] gap-2 items-center"
              >
                {/* Row Header */}
                <div className="text-[10px] font-medium text-slate-600 text-right pr-2">
                  {rp.label}
                </div>

                {/* Cells */}
                {maintenanceLevels.map((ml) => {
                  const scenario = getScenario(rp.value, ml.value);

                  if (!scenario) {
                    // Empty cell (no data)
                    return (
                      <div
                        key={ml.value}
                        className="h-12 w-12 rounded border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center"
                      >
                        <span className="text-[10px] text-slate-400">—</span>
                      </div>
                    );
                  }

                  return (
                    <ImpactCell
                      key={ml.value}
                      scenario={scenario}
                      isSelected={isScenarioSelected(scenario)}
                      isHovered={isScenarioHovered(scenario)}
                      onClick={onScenarioClick}
                      onHoverEnter={setHoveredScenario}
                      onHoverLeave={() => setHoveredScenario(null)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="px-4 py-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-900">
            <p className="font-medium mb-1">How to read this matrix:</p>
            <ul className="space-y-0.5 text-blue-800">
              <li>• Each cell shows the number of exposure types affected (out of 9)</li>
              <li>• Colors indicate return period intensity: Light red (2.3yrs) → Dark red (500yrs)</li>
              <li>• Click any cell to see detailed breakdown of affected exposures</li>
              <li>• Hover over cells for quick info</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="text-xs"
        >
          Scroll to Top
        </Button>
      </div>
    </div>
  );
}
