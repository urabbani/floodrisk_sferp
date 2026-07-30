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
  SECTOR_KEYS,
  SECTOR_ASSETS,
  SECTOR_COLORS,
  SECTOR_LABELS,
  formatRiskValueFull,
} from '@/types/risk';

export interface EalBarChartData {
  district: string;
  rawData: Record<string, number>;
}

interface EalBarChartProps {
  data: EalBarChartData[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const rawData: Record<string, number> | undefined = payload[0]?.payload?.rawData;
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
            {/* Show asset breakdown for each sector */}
            {rawData && entry.dataKey && (
              <div className="ml-4 mb-1">
                {SECTOR_KEYS.map((sector) => {
                  if (sector !== entry.dataKey) return null;
                  return SECTOR_ASSETS[sector].map((asset) => {
                    const assetVal = rawData[asset];
                    if (!assetVal) return null;
                    return (
                      <div key={asset} className="flex items-center gap-2 text-xs text-slate-500">
                        <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: RISK_ASSET_COLORS[asset] }} />
                        <span>{RISK_ASSET_SHORT_LABELS[asset]}:</span>
                        <span className="font-medium text-slate-700">{formatRiskValueFull(assetVal, 'Dmg')}</span>
                      </div>
                    );
                  });
                })}
              </div>
            )}
          </div>
        );
      })}
      <div className="border-t border-slate-100 mt-1.5 pt-1.5 flex items-center gap-2">
        <span className="text-slate-700 font-medium">Total EAL:</span>
        <span className="font-bold text-slate-900">{formatRiskValueFull(total, 'Dmg')}</span>
      </div>
    </div>
  );
}

export function EalBarChart({ data }: EalBarChartProps) {
  // Group raw asset values into sector totals per district
  const chartData = data.map((item) => {
    const grouped: any = { district: item.district, rawData: item.rawData };
    for (const sector of SECTOR_KEYS) {
      grouped[sector] = SECTOR_ASSETS[sector].reduce(
        (sum, asset) => sum + (item.rawData[asset] ?? 0),
        0
      );
    }
    return grouped;
  });

  const renderLegend = () => (
    <div className="flex items-center justify-center gap-4 pt-2 text-xs flex-wrap">
      {SECTOR_KEYS.filter((s) => SECTOR_ASSETS[s].length > 0).map((sector) => (
        <div key={sector} className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: SECTOR_COLORS[sector] }} />
          <span className="text-slate-600">{SECTOR_LABELS[sector]}</span>
        </div>
      ))}
    </div>
  );

  return (
    <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 40)}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis type="number" tickFormatter={(v: number) => (v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : `$${(v / 1e3).toFixed(0)}K`)} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="district" width={130} tick={{ fontSize: 11 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend content={renderLegend} />
        {SECTOR_KEYS.map((sector) => (
          <Bar
            key={sector}
            dataKey={sector}
            name={SECTOR_LABELS[sector]}
            stackId="eal"
            fill={SECTOR_COLORS[sector]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
