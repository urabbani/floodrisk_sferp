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

interface ImpactDataPoint {
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
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-slate-800 mb-2">
        Return Period: {payload[0].payload.returnPeriod} years
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
 * Shows both Cropped Area and Built-up Area as two lines
 */
export function ImpactCurveChart({
  series,
  height = 400,
  className,
}: ImpactCurveChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={series.data}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="returnPeriod"
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
            tick={{ fill: '#64748b', fontSize: 12 }}
            tickFormatter={(value) => {
              if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
              if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
              return `${value}`;
            }}
            label={{
              value: 'Affected Area (m²)',
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#64748b', fontSize: 13, fontWeight: 500 },
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: '10px' }}
            iconType="circle"
          />
          <Line
            type="monotone"
            dataKey="croppedArea"
            name="Cropped Area"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ r: 4, fill: '#22c55e' }}
            activeDot={{ r: 6, fill: '#22c55e' }}
          />
          <Line
            type="monotone"
            dataKey="builtUpArea"
            name="Built-up Area"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 4, fill: '#3b82f6' }}
            activeDot={{ r: 6, fill: '#3b82f6' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
