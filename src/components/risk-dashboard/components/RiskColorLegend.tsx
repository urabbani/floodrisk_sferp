import { RISK_COLORS, formatRiskValue, type RiskMode } from '@/types/risk';

interface RiskColorLegendProps {
  min: number;
  max: number;
  mode: RiskMode;
}

export function RiskColorLegend({ min, max, mode }: RiskColorLegendProps) {

  return (
    <div className="flex items-center gap-2 text-[10px] text-slate-600">
      <span>{formatRiskValue(min, mode)}</span>
      <div className="flex h-3 flex-1 rounded overflow-hidden border border-slate-300">
        {RISK_COLORS.map((color, i) => (
          <div
            key={i}
            className="flex-1"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <span>{formatRiskValue(max, mode)}</span>
    </div>
  );
}
