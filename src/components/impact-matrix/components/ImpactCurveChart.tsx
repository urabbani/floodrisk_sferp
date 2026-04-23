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
import type { ImpactSeries } from '../hooks/useImpactCurveData';

interface ImpactCurveChartProps {
  series: ImpactSeries[];
  layerType: 'Cropped_Area' | 'Built_up_Area';
  logScale?: boolean;
  height?: number;
  className?: string;
}

function CustomTooltip({ active, payload, label, layerType }: any) {
  if (!active || !payload?.length) return null;

  const layerLabel = layerType === 'Cropped_Area' ? 'Cropped Area' : 'Built-up Area';

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm max-w-xs">
      <p className="font-semibold text-slate-800 mb-1.5">
        Return Period: {label} years
      </p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-600">{entry.name}:</span>
          <span className="font-semibold text-slate-800">
            {entry.value.toLocaleString()} m²
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * ImpactCurveChart - Line chart showing affected area vs return period
 *
 * X-axis: Return Period (years) - Log scale
 * Y-axis: Affected Area (square meters) - Linear or Log scale
 */
export function ImpactCurveChart({
  series,
  layerType,
  logScale = false,
  height = 400,
  className,
}: ImpactCurveChartProps) {
  // Create combined data array for the chart
  const chartData = series[0]?.data.map((point) => {
    const dataPoint: any = {
      returnPeriod: point.returnPeriod,
    };
    series.forEach((s) => {
      dataPoint[s.label] = point.value;
    });
    return dataPoint;
  }) || [];

  // Calculate domain for Y-axis
  const allValues = series.flatMap((s) => s.data.map((d) => d.value));
  const minValue = Math.min(...allValues.filter((v) => v > 0));
  const maxValue = Math.max(...allValues);

  const yAxisDomain = logScale
    ? [minValue / 10, maxValue * 1.1]
    : [0, maxValue * 1.1];

  const layerLabel = layerType === 'Cropped_Area' ? 'Cropped Area' : 'Built-up Area';

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
            scale="log"
            domain={[2, 600]}
            type="number"
            tick={{ fill: '#64748b', fontSize: 12 }}
            tickFormatter={(value) => `${value} yrs`}
            label={{
              value: 'Return Period (years)',
              position: 'insideBottom',
              offset: -10,
              style: { fill: '#64748b', fontSize: 13, fontWeight: 500 },
            }}
          />
          <YAxis
            scale={logScale ? 'log' : 'linear'}
            domain={yAxisDomain}
            tick={{ fill: '#64748b', fontSize: 12 }}
            tickFormatter={(value) => {
              if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M km²`;
              if (value >= 1000) return `${(value / 1000).toFixed(0)}K m²`;
              return `${value} m²`;
            }}
            label={{
              value: `Affected ${layerLabel} (m²)`,
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#64748b', fontSize: 13, fontWeight: 500 },
            }}
          />
          <Tooltip content={<CustomTooltip layerType={layerType} />} />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: '10px' }}
            iconType="circle"
          />
          {series.map((s) => (
            <Line
              key={s.label}
              type="monotone"
              dataKey={s.label}
              stroke={s.color}
              strokeWidth={2}
              dot={{ r: 4, fill: s.color }}
              activeDot={{ r: 6, fill: s.color }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
