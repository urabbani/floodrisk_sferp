/**
 * Paired Heatmap Grid Component
 *
 * Side-by-side grids showing Present vs Future climate scenarios
 * with synchronized vertical scrolling
 *
 * Follows ui-skills guidelines:
 * - Synchronized scrolling with requestAnimationFrame throttling
 * - Keyboard navigation (arrow keys, Tab)
 * - h-dvh for container height
 * - text-balance for headings
 * - tabular-nums for data
 */

import { useRef, useCallback, useEffect, useMemo } from 'react';
import { DeltaHeatmapCell } from './DeltaHeatmapCell';
import type { ScenarioComparison, ScenarioImpactSummary } from '@/types/impact';
import { returnPeriods, maintenanceLevels } from '@/types/layers';
import { formatMaintenanceLabel } from '@/types/impact';
import { cn } from '@/lib/utils';

interface PairedHeatmapGridProps {
  comparisons: ScenarioComparison[];
  onScenarioClick?: (scenario: ScenarioImpactSummary) => void;
  className?: string;
}

/**
 * Get value for a scenario from present or future data
 */
function getScenarioValue(
  scenario: ScenarioImpactSummary
): number {
  return scenario.totalAffectedExposures;
}

/**
 * Paired Heatmap Grid Component
 */
export function PairedHeatmapGrid({
  comparisons,
  onScenarioClick,
  className,
}: PairedHeatmapGridProps) {
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | undefined>(undefined);

  // Build comparison matrix keyed by return period and maintenance
  const comparisonMatrix = useMemo(() => {
    const matrix: Record<
      string,
      Record<string, ScenarioComparison | undefined>
    > = {};

    comparisons.forEach((comp) => {
      if (!matrix[comp.baseline.returnPeriod]) {
        matrix[comp.baseline.returnPeriod] = {};
      }
      matrix[comp.baseline.returnPeriod][comp.baseline.maintenance] = comp;
    });

    return matrix;
  }, [comparisons]);

  // Synchronized scrolling with RAF throttling (ui-skills: performance)
  const handleLeftScroll = useCallback(() => {
    if (rafRef.current) return; // Already scheduled

    rafRef.current = requestAnimationFrame(() => {
      const left = leftScrollRef.current;
      const right = rightScrollRef.current;
      if (left && right) {
        right.scrollTop = left.scrollTop;
      }
      rafRef.current = undefined;
    });
  }, []);

  const handleRightScroll = useCallback(() => {
    if (rafRef.current) return; // Already scheduled

    rafRef.current = requestAnimationFrame(() => {
      const left = leftScrollRef.current;
      const right = rightScrollRef.current;
      if (left && right) {
        left.scrollTop = right.scrollTop;
      }
      rafRef.current = undefined;
    });
  }, []);

  // Clean up RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Handle scenario cell click
  const handleCellClick = useCallback(
    (comparison: ScenarioComparison) => {
      // Open detailed view for the future scenario
      onScenarioClick?.(comparison.comparison);
    },
    [onScenarioClick]
  );

  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-2 gap-4', className)}>
      {/* Present Climate Grid */}
      <div className="overflow-hidden flex flex-col">
        <h2 className="text-balance text-sm font-semibold text-slate-800 mb-3 px-1">
          Present Climate
        </h2>
        <div
          ref={leftScrollRef}
          onScroll={handleLeftScroll}
          className="flex-1 overflow-auto pr-2"
          style={{ maxHeight: 'calc(100dvh - 300px)' }}
        >
          <HeatmapGrid
            scenarios={comparisons.map((c) => c.baseline)}
            comparisonMatrix={comparisonMatrix}
            onCellClick={handleCellClick}
            side="present"
          />
        </div>
      </div>

      {/* Future Climate Grid */}
      <div className="overflow-hidden flex flex-col">
        <h2 className="text-balance text-sm font-semibold text-slate-800 mb-3 px-1">
          Future Climate
        </h2>
        <div
          ref={rightScrollRef}
          onScroll={handleRightScroll}
          className="flex-1 overflow-auto pr-2"
          style={{ maxHeight: 'calc(100dvh - 300px)' }}
        >
          <HeatmapGrid
            scenarios={comparisons.map((c) => c.comparison)}
            comparisonMatrix={comparisonMatrix}
            onCellClick={handleCellClick}
            side="future"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Individual Heatmap Grid
 */
interface HeatmapGridProps {
  scenarios: ScenarioImpactSummary[];
  comparisonMatrix: Record<string, Record<string, ScenarioComparison | undefined>>;
  onCellClick: (comparison: ScenarioComparison) => void;
  side: 'present' | 'future';
}

function HeatmapGrid({
  scenarios,
  comparisonMatrix,
  onCellClick,
  side,
}: HeatmapGridProps) {
  return (
    <div className="space-y-2">
      {/* Header row with maintenance labels */}
      <div className="grid grid-cols-4 gap-2 sticky top-0 bg-white z-10 py-2 border-b">
        <div className="col-span-1"></div>
        {maintenanceLevels.map((ml) => (
          <div
            key={ml.value}
            className="col-span-1 text-center text-xs font-medium text-slate-600"
          >
            {ml.value === 'breaches' ? 'Flood 2022' : formatMaintenanceLabel(ml.value)}
          </div>
        ))}
      </div>

      {/* Data rows */}
      {returnPeriods.map((rp) => (
        <div key={rp.value} className="grid grid-cols-4 gap-2">
          {/* Return period label */}
          <div className="flex items-center">
            <span className="text-xs font-medium text-slate-600 tabular-nums pr-2">
              {rp.label.replace(' Years', '')}
            </span>
          </div>

          {/* Maintenance cells */}
          {maintenanceLevels.map((ml) => {
            const comparison = comparisonMatrix[rp.value]?.[ml.value];
            const scenario = scenarios.find(
              (s) => s.returnPeriod === rp.value && s.maintenance === ml.value
            );

            if (!comparison || !scenario) {
              return (
                <div
                  key={ml.value}
                  className="h-14 flex items-center justify-center bg-slate-50 rounded-md border border-slate-200"
                  aria-hidden="true"
                >
                  <span className="text-xs text-slate-400">—</span>
                </div>
              );
            }

            const presentValue = getScenarioValue(comparison.baseline);
            const futureValue = getScenarioValue(comparison.comparison);
            const delta = comparison.deltas.Built_up_Area?.relative || 0;

            // Show delta cell only on future side, present side shows just value
            if (side === 'future') {
              return (
                <DeltaHeatmapCell
                  key={ml.value}
                  presentValue={presentValue}
                  futureValue={futureValue}
                  delta={delta}
                  returnPeriod={rp.value}
                  maintenance={ml.value}
                  onClick={() => onCellClick(comparison)}
                />
              );
            }

            // Present side: simple value display
            return (
              <div
                key={ml.value}
                className="h-14 flex items-center justify-center bg-slate-50 rounded-md border border-slate-200"
              >
                <span className="tabular-nums text-sm font-semibold text-slate-800">
                  {presentValue}
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
