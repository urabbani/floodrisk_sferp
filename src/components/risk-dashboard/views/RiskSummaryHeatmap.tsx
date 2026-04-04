import { useMemo } from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RiskJsonData, RiskMode, ScenarioKey } from '@/types/risk';
import {
  RETURN_PERIODS,
  MAINTENANCE_LEVELS,
  MAINTENANCE_LABELS,
  totalRiskValue,
  buildScenarioKey,
  formatRiskValue,
} from '@/types/risk';
import { RiskHeatmapCell } from '../components/RiskHeatmapCell';
import { RiskColorLegend } from '../components/RiskColorLegend';

interface RiskSummaryHeatmapProps {
  data: RiskJsonData;
  climate: 'present' | 'future';
  mode: RiskMode;
  selectedKey: ScenarioKey | null;
  onScenarioClick: (key: ScenarioKey) => void;
  className?: string;
}

export function RiskSummaryHeatmap({
  data,
  climate,
  mode,
  selectedKey,
  onScenarioClick,
  className,
}: RiskSummaryHeatmapProps) {
  // Build matrix and compute min/max for color scale
  const { matrix, min, max, stats } = useMemo(() => {
    const mat = new Map<string, { key: ScenarioKey; total: number }>();
    let mn = Infinity;
    let mx = -Infinity;
    let totalDamage = 0;
    let worstKey: ScenarioKey | null = null;
    let worstVal = -Infinity;

    for (const rp of RETURN_PERIODS) {
      for (const m of MAINTENANCE_LEVELS) {
        const key = buildScenarioKey(rp, climate, m);
        const regionData = data.data[key]?.['TOTAL']?.[mode];
        if (!regionData) continue;

        const total = totalRiskValue(regionData);
        mat.set(key, { key, total });

        if (total > 0) {
          mn = Math.min(mn, total);
          mx = Math.max(mx, total);
          totalDamage += total;
          if (total > worstVal) {
            worstVal = total;
            worstKey = key;
          }
        }
      }
    }

    if (mn === Infinity) mn = 0;
    if (mx === -Infinity) mx = 0;

    return {
      matrix: mat,
      min: mn,
      max: mx,
      stats: { totalDamage, worstKey, worstVal },
    };
  }, [data, climate, mode]);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Summary Stats */}
      <div className="px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-slate-700">Risk Summary</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-slate-500">Total Across Scenarios</div>
            <div className="font-semibold text-slate-800">{formatRiskValue(stats.totalDamage, mode)}</div>
          </div>
          <div>
            <div className="text-slate-500">Worst Scenario</div>
            <div className="font-semibold text-red-600">
              {stats.worstKey ? formatRiskValue(stats.worstVal, mode) : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Color Legend */}
      <div className="px-4">
        <RiskColorLegend min={min} max={max} mode={mode} />
      </div>

      {/* Heatmap Matrix */}
      <div className="overflow-x-auto">
        <div className="min-w-[440px]">
          {/* Column Headers */}
          <div className="grid grid-cols-[60px_repeat(3,1fr)] gap-1.5 mb-1 px-4">
            <div />
            {MAINTENANCE_LEVELS.map((m) => (
              <div key={m} className="text-center text-[10px] font-medium text-slate-600">
                {MAINTENANCE_LABELS[m]}
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="space-y-1 px-4">
            {RETURN_PERIODS.map((rp) => (
              <div key={rp} className="grid grid-cols-[60px_repeat(3,1fr)] gap-1.5 items-center">
                <div className="text-[10px] font-medium text-slate-600 text-right pr-1">
                  {rp}yr
                </div>
                {MAINTENANCE_LEVELS.map((m) => {
                  const key = buildScenarioKey(rp, climate, m);
                  const entry = matrix.get(key);
                  const regionData = data.data[key]?.['TOTAL']?.[mode];

                  if (!regionData || !entry) {
                    return (
                      <div
                        key={m}
                        className="h-14 rounded border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center"
                      >
                        <span className="text-[10px] text-slate-400">—</span>
                      </div>
                    );
                  }

                  return (
                    <RiskHeatmapCell
                      key={m}
                      data={regionData}
                      mode={mode}
                      min={min}
                      max={max}
                      label={`${rp}yr ${climate} ${m}`}
                      isSelected={selectedKey === key}
                      onClick={() => onScenarioClick(key)}
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
              <li>• Colors indicate risk magnitude: Yellow (low) → Red (high)</li>
              <li>• Each cell shows total risk for a scenario across all districts</li>
              <li>• Click any cell to see district-level breakdown</li>
              <li>• Toggle between Vulnerability and Damage using controls above</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
