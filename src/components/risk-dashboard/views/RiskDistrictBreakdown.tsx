import { useMemo } from 'react';
import { ArrowLeft, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { RiskJsonData, RiskMode, ScenarioKey, RegionRiskData } from '@/types/risk';
import {
  DISTRICTS,
  totalRiskValue,
  formatRiskValueFull,
  MAINTENANCE_LABELS,
  RISK_MODE_LABELS,
  calculateTotalRisk,
  RISK_ASSET_COLORS,
  ASSET_SUB_KEYS,
  ASSET_SUB_KEY_LABELS,
} from '@/types/risk';
import { DistrictBarChart } from '../components/DistrictBarChart';

interface RiskDistrictBreakdownProps {
  data: RiskJsonData;
  scenarioKey: ScenarioKey;
  mode: RiskMode;
  onBack: () => void;
  className?: string;
}

export function RiskDistrictBreakdown({
  data,
  scenarioKey,
  mode,
  onBack,
  className,
}: RiskDistrictBreakdownProps) {
  const meta = data.scenarios[scenarioKey];
  const scenarioData = data.data[scenarioKey];

  // Build chart data
  const chartData = useMemo(() => {
    if (!scenarioData) return [];

    return DISTRICTS.map((district) => {
      const regionData = scenarioData[district]?.[mode];
      if (!regionData) {
        return {
          district,
          rawData: {
            crop: 0,
            buildLow56: 0,
            buildLow44: 0,
            buildHigh: 0,
            telecom: 0,
            electric: 0,
            railways: 0,
            hospitals: 0,
            bhu: 0,
            schools: 0,
            roads: 0,
          } as RegionRiskData,
        };
      }
      return {
        district,
        rawData: regionData,
      };
    });
  }, [scenarioData, mode]);

  // Ranked table data
  const rankedDistricts = useMemo(() => {
    if (!scenarioData) return [];

    return DISTRICTS.map((district) => {
      const regionData = scenarioData[district]?.[mode];
      const total = regionData ? totalRiskValue(regionData) : 0;
      return { district, total, data: regionData };
    })
      .sort((a, b) => b.total - a.total);
  }, [scenarioData, mode]);

  // TOTAL region data (sum of 7 districts)
  const totalData = calculateTotalRisk(data, scenarioKey, mode);
  const grandTotal = totalData ? totalRiskValue(totalData) : 0;

  if (!meta) {
    return (
      <div className={cn('p-4', className)}>
        <p className="text-sm text-slate-500">Scenario not found.</p>
        <Button size="sm" variant="outline" onClick={onBack} className="mt-2">Back</Button>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with back button */}
      <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <Button size="sm" variant="ghost" onClick={onBack} className="h-7 w-7 p-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <MapPin className="w-4 h-4 text-orange-600" />
          <span className="text-sm font-semibold text-slate-800">
            {meta.returnPeriod}yr {meta.climate === 'present' ? 'Present' : 'Future'} — {MAINTENANCE_LABELS[meta.maintenance]}
          </span>
        </div>
        <p className="text-sm text-slate-500 ml-14">
          {RISK_MODE_LABELS[mode]} by District
        </p>
      </div>

      {/* Grand Total Card */}
      {totalData && (
        <div className="mx-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="text-sm text-slate-500 mb-1">Grand Total (All Districts)</div>
          <div className="text-lg font-bold text-slate-900">
            {formatRiskValueFull(grandTotal, mode)}
          </div>
        </div>
      )}

      {/* Bar Chart */}
      <div className="px-4">
        <h4 className="text-sm font-semibold text-slate-700 mb-2">District Comparison</h4>
        <DistrictBarChart data={chartData} mode={mode} />
      </div>

      {/* Ranked Table */}
      <div className="px-4">
        <h4 className="text-sm font-semibold text-slate-700 mb-2">Ranked by Total</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-1.5 px-1 font-medium text-slate-600">#</th>
                <th className="text-left py-1.5 px-1 font-medium text-slate-600">District</th>
                <th className="text-right py-1.5 px-1 font-medium text-slate-600">Total</th>
                {ASSET_SUB_KEYS.map((k) => (
                  <th key={k} className="text-right py-1.5 px-1 font-medium text-slate-600 whitespace-nowrap">
                    <span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ backgroundColor: RISK_ASSET_COLORS[k] }} />
                    {ASSET_SUB_KEY_LABELS[k]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rankedDistricts.map(({ district, total, data: rd }, i) => (
                <tr key={district} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-1.5 px-1 text-slate-400">{i + 1}</td>
                  <td className="py-1.5 px-1 font-medium text-slate-700">{district}</td>
                  <td className="py-1.5 px-1 text-right font-semibold text-slate-900">
                    {formatRiskValueFull(total, mode)}
                  </td>
                  {ASSET_SUB_KEYS.map((k) => (
                    <td key={k} className="py-1.5 px-1 text-right text-slate-600 whitespace-nowrap">
                      {rd ? formatRiskValueFull(rd[k] ?? 0, mode) : '0'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
