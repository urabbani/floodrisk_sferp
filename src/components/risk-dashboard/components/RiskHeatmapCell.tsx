import { cn } from '@/lib/utils';
import { getRiskColor, formatRiskValue, type RiskMode, type RegionRiskData, totalRiskValue } from '@/types/risk';

interface RiskHeatmapCellProps {
  data: RegionRiskData;
  mode: RiskMode;
  min: number;
  max: number;
  label: string;
  isSelected?: boolean;
  onClick?: () => void;
}

export function RiskHeatmapCell({
  data,
  mode,
  min,
  max,
  label,
  isSelected = false,
  onClick,
}: RiskHeatmapCellProps) {
  const total = totalRiskValue(data);
  const bgColor = total > 0 ? getRiskColor(total, min, max) : '#f8fafc';
  const displayValue = formatRiskValue(total, mode);

  return (
    <button
      onClick={onClick}
      title={`${label}: ${displayValue}`}
      className={cn(
        'h-14 w-full rounded border transition-all text-center flex flex-col items-center justify-center px-1',
        total === 0
          ? 'border-dashed border-slate-300 bg-slate-50'
          : 'border-slate-400/50 cursor-pointer hover:ring-2 hover:ring-blue-400',
        isSelected && 'ring-2 ring-blue-600 border-blue-600',
      )}
      style={total > 0 ? { backgroundColor: bgColor } : undefined}
    >
      <span className={cn('text-[10px] font-bold leading-tight', total === 0 ? 'text-slate-400' : 'text-slate-900')}>
        {total === 0 ? '—' : displayValue}
      </span>
    </button>
  );
}
