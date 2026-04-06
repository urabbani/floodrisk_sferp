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
  BUILDING_KEYS,
  BUILDING_SUB_LABELS,
  BUILDING_SUB_COLORS,
  formatRiskValue,
  formatRiskValueFull,
} from '@/types/risk';
import type { RegionRiskData } from '@/types/risk';

interface DistrictBarChartData {
  district: string;
  crop: number;
  buildings: number;
  rawData: RegionRiskData;
}

interface DistrictBarChartProps {
  data: DistrictBarChartData[];
  mode: RiskMode;
  layout?: 'horizontal' | 'vertical';
}

function CustomTooltip({ active, payload, label, mode }: any) {
  if (!active || !payload?.length) return null;

  // Find the raw data from the first payload entry
  const rawData: RegionRiskData | undefined = payload[0]?.payload?.rawData;

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
            {/* Show building subcomponents when hovering the buildings bar */}
            {entry.dataKey === 'buildings' && rawData && (
              <div className="ml-4 mb-1">
                {BUILDING_KEYS.map((bk) => {
                  const subVal = rawData[bk];
                  if (subVal === 0) return null;
                  return (
                    <div key={bk} className="flex items-center gap-2 text-xs text-slate-500">
                      <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: BUILDING_SUB_COLORS[bk] }} />
                      <span>{BUILDING_SUB_LABELS[bk]}:</span>
                      <span className="font-medium text-slate-700">{formatRiskValueFull(subVal, mode)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function DistrictBarChart({ data, mode, layout = 'horizontal' }: DistrictBarChartProps) {
  // Custom legend to show Agriculture + Buildings (with sub-shades)
  const renderLegend = () => (
    <div className="flex items-center justify-center gap-4 pt-2 text-xs">
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: RISK_ASSET_COLORS.crop }} />
        <span className="text-slate-600">Agriculture</span>
      </div>
      <div className="flex items-center gap-1">
        {BUILDING_KEYS.map((bk) => (
          <div key={bk} className="w-2.5 h-3 rounded-sm" style={{ backgroundColor: BUILDING_SUB_COLORS[bk] }} />
        ))}
        <span className="text-slate-600 ml-0.5">Buildings</span>
      </div>
    </div>
  );

  if (layout === 'vertical') {
    return (
      <ResponsiveContainer width="100%" height={Math.max(300, data.length * 40)}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis type="number" tickFormatter={(v: number) => formatRiskValue(v, mode)} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="district" width={110} tick={{ fontSize: 11 }} />
          <Tooltip content={<CustomTooltip mode={mode} />} />
          <Legend content={renderLegend} />
          <Bar dataKey="crop" name={RISK_ASSET_SHORT_LABELS.crop} stackId="assets" fill={RISK_ASSET_COLORS.crop} />
          {/* 3 building sub-bars stacked to form "Buildings" */}
          {BUILDING_KEYS.map((bk) => (
            <Bar
              key={bk}
              dataKey={`rawData.${bk}`}
              name={BUILDING_SUB_LABELS[bk]}
              stackId="assets"
              fill={BUILDING_SUB_COLORS[bk]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ left: 10, right: 20, top: 5, bottom: 40 }}>
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
        <Bar dataKey="crop" name={RISK_ASSET_SHORT_LABELS.crop} stackId="assets" fill={RISK_ASSET_COLORS.crop} />
        {BUILDING_KEYS.map((bk) => (
          <Bar
            key={bk}
            dataKey={`rawData.${bk}`}
            name={BUILDING_SUB_LABELS[bk]}
            stackId="assets"
            fill={BUILDING_SUB_COLORS[bk]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
