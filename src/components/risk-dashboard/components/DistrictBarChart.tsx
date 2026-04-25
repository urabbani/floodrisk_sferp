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
import type { RiskMode } from '@/types/risk';
import {
  RISK_ASSET_SHORT_LABELS,
  RISK_ASSET_COLORS,
  formatRiskValue,
  formatRiskValueFull,
  ASSET_SUB_KEYS,
} from '@/types/risk';
import type { RegionRiskData } from '@/types/risk';

interface DistrictBarChartData {
  district: string;
  rawData: RegionRiskData;
}

interface DistrictBarChartProps {
  data: DistrictBarChartData[];
  mode: RiskMode;
  layout?: 'horizontal' | 'vertical';
}

// Group assets into categories for better visualization
const ASSET_GROUPS = {
  agriculture: ['crop'],
  buildings: ['buildLow56', 'buildLow44', 'buildHigh'],
  infrastructure: ['telecom', 'electric', 'railways', 'roads'],
  facilities: ['hospitals', 'bhu', 'schools'],
} as const;

const GROUP_COLORS: Record<string, string> = {
  agriculture: RISK_ASSET_COLORS.crop,
  buildings: RISK_ASSET_COLORS.buildLow44,
  infrastructure: '#f59e0b',
  facilities: '#a855f7',
};

const GROUP_LABELS: Record<string, string> = {
  agriculture: 'Agriculture',
  buildings: 'Buildings',
  infrastructure: 'Infrastructure',
  facilities: 'Facilities',
};

function CustomTooltip({ active, payload, label, mode }: any) {
  if (!active || !payload?.length) return null;

  const rawData: RegionRiskData | undefined = payload[0]?.payload?.rawData;
  const total = payload.reduce((sum: number, entry: any) => sum + (entry.value as number), 0);

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm max-w-xs">
      <p className="font-semibold text-slate-800 mb-1.5">{label}</p>
      {payload.map((entry: any) => {
        const val = entry.value as number;
        if (val === 0) return null;
        return (
          <div key={entry.dataKey}>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-600">{entry.name}:</span>
              <span className="font-medium text-slate-900">{formatRiskValueFull(val, mode)}</span>
            </div>
            {/* Show asset breakdown for each group */}
            {rawData && entry.dataKey && (
              <div className="ml-4 mb-1">
                {ASSET_SUB_KEYS.map((asset) => {
                  const assetVal = rawData[asset];
                  if (assetVal === 0) return null;
                  // Find which group this asset belongs to
                  for (const [group, assets] of Object.entries(ASSET_GROUPS)) {
                    if (assets.includes(asset) && group === entry.dataKey) {
                      return (
                        <div key={asset} className="flex items-center gap-2 text-xs text-slate-500">
                          <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: RISK_ASSET_COLORS[asset] }} />
                          <span>{RISK_ASSET_SHORT_LABELS[asset]}:</span>
                          <span className="font-medium text-slate-700">{formatRiskValueFull(assetVal, mode)}</span>
                        </div>
                      );
                    }
                  }
                  return null;
                })}
              </div>
            )}
          </div>
        );
      })}
      <div className="border-t border-slate-100 mt-1.5 pt-1.5 flex items-center gap-2">
        <span className="text-slate-700 font-medium">Total:</span>
        <span className="font-bold text-slate-900">{formatRiskValueFull(total, mode)}</span>
      </div>
    </div>
  );
}

export function DistrictBarChart({ data, mode, layout = 'horizontal' }: DistrictBarChartProps) {
  // Transform data to have grouped values
  const chartData = data.map((item) => {
    const grouped: any = { district: item.district, rawData: item.rawData };
    for (const [group, assets] of Object.entries(ASSET_GROUPS)) {
      grouped[group] = assets.reduce((sum, asset) => sum + (item.rawData[asset] ?? 0), 0);
    }
    return grouped;
  });

  const renderLegend = () => (
    <div className="flex items-center justify-center gap-4 pt-2 text-xs flex-wrap">
      {Object.entries(GROUP_LABELS).map(([key, label]) => (
        <div key={key} className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: GROUP_COLORS[key] }} />
          <span className="text-slate-600">{label}</span>
        </div>
      ))}
    </div>
  );

  if (layout === 'vertical') {
    return (
      <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 40)}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis type="number" tickFormatter={(v: number) => formatRiskValue(v, mode)} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="district" width={110} tick={{ fontSize: 11 }} />
          <Tooltip content={<CustomTooltip mode={mode} />} />
          <Legend content={renderLegend} />
          {Object.keys(ASSET_GROUPS).map((group) => (
            <Bar
              key={group}
              dataKey={group}
              name={GROUP_LABELS[group]}
              stackId="assets"
              fill={GROUP_COLORS[group]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ left: 10, right: 20, top: 5, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="district"
          tick={{ fontSize: 11, angle: -30, textAnchor: 'end' }}
          interval={0}
          height={70}
        />
        <YAxis type="number" tickFormatter={(v: number) => formatRiskValue(v, mode)} tick={{ fontSize: 11 }} />
        <Tooltip content={<CustomTooltip mode={mode} />} />
        <Legend content={renderLegend} />
        {Object.keys(ASSET_GROUPS).map((group) => (
          <Bar
            key={group}
            dataKey={group}
            name={GROUP_LABELS[group]}
            stackId="assets"
            fill={GROUP_COLORS[group]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
