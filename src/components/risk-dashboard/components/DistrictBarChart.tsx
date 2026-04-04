import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { RiskMode, RiskAssetType } from '@/types/risk';
import {
  RISK_ASSET_SHORT_LABELS,
  RISK_ASSET_COLORS,
  formatRiskValue,
  formatRiskValueFull,
} from '@/types/risk';

interface DistrictBarChartProps {
  data: Array<{ district: string } & Record<RiskAssetType, number>>;
  mode: RiskMode;
  layout?: 'horizontal' | 'vertical';
}

function CustomTooltip({ active, payload, label, mode }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs max-w-xs">
      <p className="font-semibold text-slate-800 mb-1.5">{label}</p>
      {payload.map((entry: any) => {
        const val = entry.value as number;
        if (val === 0) return null;
        return (
          <div key={entry.dataKey} className="flex items-center gap-2 mb-0.5">
            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-600">{entry.name}:</span>
            <span className="font-medium text-slate-900">{formatRiskValueFull(val, mode)}</span>
          </div>
        );
      })}
    </div>
  );
}

export function DistrictBarChart({ data, mode, layout = 'horizontal' }: DistrictBarChartProps) {
  const assetKeys: RiskAssetType[] = ['crop', 'buildLow56', 'buildLow44', 'buildHigh'];

  if (layout === 'vertical') {
    return (
      <ResponsiveContainer width="100%" height={Math.max(300, data.length * 40)}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis type="number" tickFormatter={(v: number) => formatRiskValue(v, mode)} tick={{ fontSize: 10 }} />
          <YAxis type="category" dataKey="district" width={100} tick={{ fontSize: 10 }} />
          <Tooltip content={<CustomTooltip mode={mode} />} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          {assetKeys.map((key) => (
            <Bar
              key={key}
              dataKey={key}
              name={RISK_ASSET_SHORT_LABELS[key]}
              stackId="assets"
              fill={RISK_ASSET_COLORS[key]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="district"
          tick={{ fontSize: 9 }}
          interval={0}
          height={60}
        />
        <YAxis type="number" tickFormatter={(v: number) => formatRiskValue(v, mode)} tick={{ fontSize: 10 }} />
        <Tooltip content={<CustomTooltip mode={mode} />} />
        <Legend wrapperStyle={{ fontSize: 10 }} />
        {assetKeys.map((key) => (
          <Bar
            key={key}
            dataKey={key}
            name={RISK_ASSET_SHORT_LABELS[key]}
            stackId="assets"
            fill={RISK_ASSET_COLORS[key]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
