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

export interface ImpactDataPoint {
  returnPeriod: number;
  croppedArea: number;
  builtUpArea: number;
}

interface ImpactCurveChartProps {
  series: {
    data: ImpactDataPoint[];
  };
  height?: number;
  className?: string;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white border border-slate-300 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-slate-800 mb-2">
        Return Period: {payload[0].payload.returnPeriod} years
      </p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-600">{entry.name}:</span>
          <span className="font-semibold text-slate-800">
            {entry.value.toLocaleString()} m²
          </span>
        </div>
      ))}
    </div>
  );
}

export function ImpactCurveChart({
  series,
  height = 350,
  className,
}: ImpactCurveChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={series.data}
          margin={{ top: 20, right: 30, left: 80, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="returnPeriod"
            tick={{ fill: '#64748b', fontSize: 12 }}
            tickFormatter={(value) => `${value}y`}
            label={{
              value: 'Return Period (years)',
              position: 'insideBottom',
              offset: -5,
              style: { fill: '#475569', fontSize: 13, fontWeight: 500 },
            }}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickFormatter={(value) => {
              if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M m²`;
              if (value >= 1000) return `${(value / 1000).toFixed(0)}K m²`;
              return `${value} m²`;
            }}
            label={{
              value: 'Affected Area (square meters)',
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#475569', fontSize: 13, fontWeight: 500 },
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 13, paddingTop: '10px' }}
            iconType="circle"
          />
          <Line
            type="monotone"
            dataKey="croppedArea"
            name="Cropped Area"
            stroke="#22c55e"
            strokeWidth={2.5}
            dot={{ r: 5, fill: '#22c55e', strokeWidth: 2 }}
            activeDot={{ r: 7, fill: '#22c55e' }}
          />
          <Line
            type="monotone"
            dataKey="builtUpArea"
            name="Built-up Area"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={{ r: 5, fill: '#3b82f6', strokeWidth: 2 }}
            activeDot={{ r: 7, fill: '#3b82f6' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
