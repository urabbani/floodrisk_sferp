import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CurveDataPoint, CurveSeries } from '../hooks/useRiskCurveData';
import type { RiskMode } from '@/types/risk';
import { formatRiskValue, formatRiskValueFull } from '@/types/risk';

interface RiskCurveChartProps {
  series: CurveSeries[];
  mode: RiskMode;
  logScale?: boolean;
  height?: number;
  className?: string;
}

function CustomTooltip({ active, payload, label, mode }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm max-w-xs">
      <p className="font-semibold text-slate-800 mb-1.5">
        Return Period: {label} years
      </p>
      {payload.map((entry: any) => {
        const val = entry.value as number;
        if (val === 0 || val === undefined) return null;
        return (
          <div key={entry.name} className="flex items-center gap-2 mb-0.5">
            <div
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-600">{entry.name}:</span>
            <span className="font-medium text-slate-900">
              {formatRiskValueFull(val, mode)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function RiskCurveChart({
  series,
  mode,
  logScale = false,
  height = 400,
  className,
}: RiskCurveChartProps) {
  // Transform series data into format expected by Recharts
  // Each data point should have all series values as named properties
  const chartData = series[0]?.data.map((point, index) => {
    const dataPoint: Record<string, number> = { returnPeriod: point.returnPeriod };
    series.forEach((s) => {
      dataPoint[s.label] = s.data[index]?.value || 0;
    });
    return dataPoint;
  }) || [];

  const maxValue = Math.max(...series.flatMap((s) => s.data.map((d) => d.value)));

  const domain = logScale
    ? ['dataMin', 'dataMax']
    : [0, maxValue * 1.1];

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="returnPeriod"
            label={{
              value: 'Return Period (years)',
              position: 'insideBottom',
              offset: -10,
              style: { textAnchor: 'middle', fontSize: 12, fill: '#64748b' },
            }}
            scale={logScale ? 'log' : 'auto'}
            tickFormatter={(v: number) => {
              if (v >= 100) return `${v}yr`;
              if (v >= 10) return `${v}yr`;
              return `${v}yr`;
            }}
            tick={{ fontSize: 11 }}
            ticks={logScale ? [2.3, 5, 10, 25, 50, 100, 500] : undefined}
          />
          <YAxis
            label={{
              value: mode === 'Dmg' ? 'Economic Damage (USD)' : 'Area / Count',
              angle: -90,
              position: 'insideLeft',
              style: { textAnchor: 'middle', fontSize: 12, fill: '#64748b' },
            }}
            tickFormatter={(v: number) => formatRiskValue(v, mode)}
            tick={{ fontSize: 11 }}
            domain={domain}
            scale={logScale ? 'log' : 'auto'}
          />
          <Tooltip content={<CustomTooltip mode={mode} />} />
          <Legend
            wrapperStyle={{ paddingTop: '10px' }}
            iconType="line"
          />
          {series.map((s) => (
            <Line
              key={s.label}
              name={s.label}
              dataKey={s.label}
              type="monotone"
              stroke={s.color}
              strokeWidth={2}
              dot={{ r: 4, fill: s.color, strokeWidth: 2 }}
              activeDot={{ r: 6, fill: s.color, strokeWidth: 2 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
