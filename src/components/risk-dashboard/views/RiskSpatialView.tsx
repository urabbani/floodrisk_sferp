import { useMemo } from 'react';
import { Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RiskJsonData, RiskMode, ScenarioKey, DistrictName } from '@/types/risk';
import {
  RETURN_PERIODS,
  MAINTENANCE_LEVELS,
  MAINTENANCE_LABELS,
  getRiskColor,
  formatRiskValueFull,
  RISK_MODE_LABELS,
  buildScenarioKey,
} from '@/types/risk';
import { RiskColorLegend } from '../components/RiskColorLegend';

interface RiskSpatialViewProps {
  data: RiskJsonData;
  climate: 'present' | 'future';
  maintenance: 'breaches' | 'redcapacity' | 'perfect';
  returnPeriod: number;
  mode: RiskMode;
  choroplethData: Record<DistrictName, number> | null;
  hoveredDistrict: string | null;
  onScenarioChange: (key: ScenarioKey) => void;
  onHoverDistrict: (district: string | null) => void;
  className?: string;
}

export function RiskSpatialView({
  data,
  climate,
  maintenance,
  returnPeriod,
  mode,
  choroplethData,
  hoveredDistrict,
  onScenarioChange,
  onHoverDistrict,
  className,
}: RiskSpatialViewProps) {
  const scenarioKey = buildScenarioKey(returnPeriod, climate, maintenance);

  // Compute min/max for color scale
  const { min, max } = useMemo(() => {
    if (!choroplethData) return { min: 0, max: 0 };
    const values = Object.values(choroplethData).filter((v) => v > 0);
    if (values.length === 0) return { min: 0, max: 0 };
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [choroplethData]);

  // District ranking
  const rankedDistricts = useMemo(() => {
    if (!choroplethData) return [];
    return Object.entries(choroplethData)
      .filter(([, v]) => v > 0)
      .sort(([, a], [, b]) => b - a);
  }, [choroplethData]);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Map className="w-4 h-4 text-green-600" />
          <span className="text-sm font-semibold text-slate-800">Spatial Risk Map</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Districts colored by {RISK_MODE_LABELS[mode].toLowerCase()} on the map
        </p>
      </div>

      {/* Scenario Selectors */}
      <div className="px-4 space-y-2">
        {/* Return Period */}
        <div>
          <label className="text-sm font-medium text-slate-600 block mb-1">Return Period</label>
          <div className="flex flex-wrap gap-1">
            {RETURN_PERIODS.map((rp) => (
              <button
                key={rp}
                onClick={() => onScenarioChange(buildScenarioKey(rp, climate, maintenance))}
                className={cn(
                  'px-2 py-1 text-xs rounded transition-all',
                  returnPeriod === rp
                    ? 'bg-green-600 text-white font-medium'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-green-300',
                )}
              >
                {rp}yr
              </button>
            ))}
          </div>
        </div>

        {/* Maintenance */}
        <div>
          <label className="text-sm font-medium text-slate-600 block mb-1">Maintenance</label>
          <div className="flex gap-1">
            {MAINTENANCE_LEVELS.map((m) => (
              <button
                key={m}
                onClick={() => onScenarioChange(buildScenarioKey(returnPeriod, climate, m))}
                className={cn(
                  'px-2 py-1 text-xs rounded transition-all',
                  maintenance === m
                    ? 'bg-green-600 text-white font-medium'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-green-300',
                )}
              >
                {MAINTENANCE_LABELS[m]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Color Legend */}
      <div className="px-4">
        <RiskColorLegend min={min} max={max} mode={mode} />
      </div>

      {/* Hovered District Info */}
      {hoveredDistrict && choroplethData?.[hoveredDistrict as DistrictName] !== undefined && (
        <div className="mx-4 p-3 bg-white rounded-lg border border-green-200 shadow-sm">
          <div className="text-sm font-semibold text-slate-800">{hoveredDistrict}</div>
          <div className="text-sm font-bold text-green-700">
            {formatRiskValueFull(choroplethData[hoveredDistrict as DistrictName], mode)}
          </div>
        </div>
      )}

      {/* District Rankings */}
      <div className="px-4">
        <h4 className="text-sm font-semibold text-slate-700 mb-2">District Rankings</h4>
        <div className="space-y-1">
          {rankedDistricts.map(([district, value], i) => {
            const pct = max > 0 ? (value / max) * 100 : 0;
            return (
              <div
                key={district}
                className={cn(
                  "flex items-center gap-2 group cursor-default rounded px-1 py-0.5 transition-colors",
                  hoveredDistrict === district ? "bg-green-50" : "hover:bg-slate-50",
                )}
                onMouseEnter={() => onHoverDistrict(district)}
                onMouseLeave={() => onHoverDistrict(null)}
              >
                <span className="text-sm text-slate-400 w-5 text-right">{i + 1}</span>
                <span className={cn(
                  "text-xs w-28 truncate transition-all",
                  hoveredDistrict === district ? "font-bold text-green-700" : "text-slate-700",
                )}>{district}</span>
                <div className="flex-1 h-4 bg-slate-100 rounded overflow-hidden">
                  <div
                    className="h-full rounded transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: getRiskColor(value, min, max),
                    }}
                  />
                </div>
                <span className="text-sm text-slate-600 font-medium w-20 text-right">
                  {formatRiskValueFull(value, mode)}
                </span>
              </div>
            );
          })}
          {rankedDistricts.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">No data for this scenario</p>
          )}
        </div>
      </div>
    </div>
  );
}
