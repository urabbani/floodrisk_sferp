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
import {
  RISK_ASSET_COLORS,
  RISK_ASSET_SHORT_LABELS,
  BUILDING_KEYS,
  BUILDING_SUB_LABELS,
  BUILDING_SUB_COLORS,
  formatRiskValue,
  formatRiskValueFull,
} from '@/types/risk';

export interface EadBarChartData {
  district: string;
  crop: number;
  buildings: number;
  rawData: { buildLow56: number; buildLow44: number; buildHigh: number };
}

interface EadBarChartProps {
  data: EadBarChartData[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const rawData: { buildLow56: number; buildLow44: number; buildHigh: number } | undefined =
    payload[0]?.payload?.rawData;
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
              <span className="font-medium text-slate-900">{formatRiskValueFull(val, 'Dmg')}</span>
            </div>
            {entry.dataKey === 'buildings' && rawData && (
              <div className="ml-4 mb-1">
                {BUILDING_KEYS.map((bk) => {
                  const subVal = rawData[bk];
                  if (subVal === 0) return null;
                  return (
                    <div key={bk} className="flex items-center gap-2 text-xs text-slate-500">
                      <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: BUILDING_SUB_COLORS[bk] }} />
                      <span>{BUILDING_SUB_LABELS[bk]}:</span>
                      <span className="font-medium text-slate-700">{formatRiskValueFull(subVal, 'Dmg')}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      <div className="border-t border-slate-100 mt-1.5 pt-1.5 flex items-center gap-2">
        <span className="text-slate-700 font-medium">Total EAD:</span>
        <span className="font-bold text-slate-900">{formatRiskValueFull(total, 'Dmg')}</span>
      </div>
    </div>
  );
}

export function EadBarChart({ data }: EadBarChartProps) {
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

  return (
    <ResponsiveContainer width="100%" height={Math.max(300, data.length * 40)}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis type="number" tickFormatter={(v: number) => formatRiskValue(v, 'Dmg')} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="district" width={130} tick={{ fontSize: 11 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend content={renderLegend} />
        <Bar dataKey="crop" name={RISK_ASSET_SHORT_LABELS.crop} stackId="ead" fill={RISK_ASSET_COLORS.crop} />
        {BUILDING_KEYS.map((bk) => (
          <Bar
            key={bk}
            dataKey={`rawData.${bk}`}
            name={BUILDING_SUB_LABELS[bk]}
            stackId="ead"
            fill={BUILDING_SUB_COLORS[bk]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
