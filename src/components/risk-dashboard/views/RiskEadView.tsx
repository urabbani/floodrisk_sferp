import { useMemo, useState, useEffect } from 'react';
import { Calculator, Map, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { EadResult, AssetSubKey, DistrictName } from '@/types/risk';
import {
  MAINTENANCE_LEVELS,
  MAINTENANCE_LABELS,
  DISTRICTS,
  DISPLAY_ASSET_KEYS,
  ASSET_SUB_KEY_LABELS,
  formatRiskValueFull,
  getRiskColor,
  RISK_ASSET_COLORS,
} from '@/types/risk';
import { EadBarChart } from '../components/EadBarChart';
import type { EadBarChartData } from '../components/EadBarChart';

interface RiskEadViewProps {
  eadResults: EadResult[];
  climate: 'present' | 'future';
  onChoroplethData?: (data: Record<DistrictName, number> | null) => void;
  className?: string;
}

export function RiskEadView({ eadResults, climate, onChoroplethData, className }: RiskEadViewProps) {
  const [selectedMaintenance, setSelectedMaintenance] = useState<'breaches' | 'redcapacity' | 'perfect'>('breaches');
  const [showOnMap, setShowOnMap] = useState(true);

  // Summary: EAD by maintenance level for TOTAL region
  const summaryData = useMemo(() => {
    return MAINTENANCE_LEVELS.map((m) => {
      const result = eadResults.find(
        (r) => r.climate === climate && r.maintenance === m && r.region === 'TOTAL'
      );
      return { maintenance: m, result };
    });
  }, [eadResults, climate]);

  // District chart data for selected maintenance
  const districtChartData: EadBarChartData[] = useMemo(() => {
    return DISTRICTS.map((district) => {
      const result = eadResults.find(
        (r) => r.climate === climate && r.maintenance === selectedMaintenance && r.region === district
      );
      const ead = result?.ead;
      const rawData: Record<string, number> = {};
      for (const asset of DISPLAY_ASSET_KEYS) {
        rawData[asset] = ead?.[asset] ?? 0;
      }
      return {
        district,
        rawData,
        eadTotal: result?.eadTotal ?? 0,
      };
    }).sort((a, b) => b.eadTotal - a.eadTotal);
  }, [eadResults, climate, selectedMaintenance]);

  // Ranked districts
  const rankedDistricts = useMemo(() => {
    return DISTRICTS.map((district) => {
      const result = eadResults.find(
        (r) => r.climate === climate && r.maintenance === selectedMaintenance && r.region === district
      );
      return { district, eadTotal: result?.eadTotal ?? 0, ead: result?.ead };
    }).sort((a, b) => b.eadTotal - a.eadTotal);
  }, [eadResults, climate, selectedMaintenance]);

  // Max total for bar width scaling
  const maxEad = useMemo(() => Math.max(...rankedDistricts.map((d) => d.eadTotal), 1), [rankedDistricts]);

  // Choropleth data push
  useEffect(() => {
    if (showOnMap && onChoroplethData) {
      const mapData = {} as Record<DistrictName, number>;
      for (const d of DISTRICTS) {
        const result = eadResults.find(
          (r) => r.climate === climate && r.maintenance === selectedMaintenance && r.region === d
        );
        mapData[d as DistrictName] = result?.eadTotal ?? 0;
      }
      onChoroplethData(mapData);
    } else if (!showOnMap) {
      onChoroplethData?.(null);
    }
    return () => {
      onChoroplethData?.(null);
    };
  }, [showOnMap, eadResults, climate, selectedMaintenance, onChoroplethData]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-semibold text-slate-800">Expected Annual Damage (EAD)</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Trapezoidal integration across 7 return periods (2.3yr – 500yr)
        </p>
      </div>

      {/* Summary Table */}
      <div className="px-4">
        <h4 className="text-sm font-semibold text-slate-700 mb-2">EAD by Maintenance Level</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-1.5 px-2 font-medium text-slate-600 sticky left-0 bg-slate-50">Maintenance</th>
                {DISPLAY_ASSET_KEYS.map((k) => (
                  <th key={k} className="text-right py-1.5 px-2 font-medium text-slate-600 whitespace-nowrap">
                    <span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ backgroundColor: RISK_ASSET_COLORS[k] }} />
                    {ASSET_SUB_KEY_LABELS[k]}
                  </th>
                ))}
                <th className="text-right py-1.5 px-2 font-medium text-slate-600 border-l border-slate-200 whitespace-nowrap">Total</th>
              </tr>
            </thead>
            <tbody>
              {summaryData.map(({ maintenance, result }) => (
                <tr key={maintenance} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-1.5 px-2 font-medium text-slate-700 sticky left-0 bg-slate-50">
                    {MAINTENANCE_LABELS[maintenance]}
                  </td>
                  {DISPLAY_ASSET_KEYS.map((k) => (
                    <td key={k} className="py-1.5 px-2 text-right text-slate-600 whitespace-nowrap">
                      {formatRiskValueFull(result?.ead[k] ?? 0, 'Dmg')}
                    </td>
                  ))}
                  <td className="py-1.5 px-2 text-right font-semibold text-slate-900 border-l border-slate-200 whitespace-nowrap">
                    {formatRiskValueFull(result?.eadTotal ?? 0, 'Dmg')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Maintenance Toggle + Map Toggle */}
      <div className="px-4 flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {MAINTENANCE_LEVELS.map((m) => (
            <Button
              key={m}
              variant={selectedMaintenance === m ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedMaintenance(m as typeof selectedMaintenance)}
              className="text-xs h-7"
            >
              {MAINTENANCE_LABELS[m]}
            </Button>
          ))}
        </div>
        <div className="ml-auto">
          <Button
            variant={showOnMap ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowOnMap(!showOnMap)}
            className="text-xs h-7"
          >
            <Map className="w-3.5 h-3.5 mr-1" />
            {showOnMap ? 'Hide Map' : 'Show on Map'}
          </Button>
        </div>
      </div>

      {/* District Bar Chart */}
      <div className="px-4">
        <div className="flex items-center gap-1.5 mb-2">
          <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
          <h4 className="text-sm font-semibold text-slate-700">
            EAD by District — {MAINTENANCE_LABELS[selectedMaintenance]}
          </h4>
        </div>
        <EadBarChart data={districtChartData} />
      </div>

      {/* Ranked District Table */}
      <div className="px-4">
        <h4 className="text-sm font-semibold text-slate-700 mb-2">Ranked by Total EAD</h4>
        <div className="space-y-1">
          {/* Header row */}
          <div className="flex items-center gap-2 text-xs px-1 pb-1 border-b border-slate-200 overflow-x-auto">
            <span className="w-4 text-right text-slate-500 flex-shrink-0">#</span>
            <span className="w-32 font-medium text-slate-600 flex-shrink-0">District</span>
            <span className="flex-1 min-w-[50px]" />
            <span className="w-24 text-right font-medium text-slate-600 flex-shrink-0">Total EAD</span>
            <div className="hidden md:flex gap-1">
              {DISPLAY_ASSET_KEYS.map((k) => (
                <span key={k} className="w-16 text-right font-medium text-slate-500 flex-shrink-0">
                  {ASSET_SUB_KEY_LABELS[k]}
                </span>
              ))}
            </div>
          </div>
          {rankedDistricts.map(({ district, eadTotal, ead }, i) => (
            <div
              key={district}
              className="flex items-center gap-2 text-xs py-1 px-1 rounded hover:bg-slate-50"
            >
              <span className="w-4 text-slate-400 text-right flex-shrink-0">{i + 1}</span>
              <span className="w-32 font-medium text-slate-700 truncate flex-shrink-0">{district}</span>
              <div className="flex-1 h-4 bg-slate-100 rounded-sm overflow-hidden min-w-[50px]">
                <div
                  className="h-full rounded-sm"
                  style={{
                    width: `${(eadTotal / maxEad) * 100}%`,
                    backgroundColor: getRiskColor(eadTotal, 0, maxEad),
                  }}
                />
              </div>
              <span className="w-24 text-right font-semibold text-slate-900 flex-shrink-0">
                {formatRiskValueFull(eadTotal, 'Dmg')}
              </span>
              {ead && (
                <div className="hidden md:flex gap-1 text-slate-500">
                  {DISPLAY_ASSET_KEYS.map((k) => (
                    <span key={k} className="w-16 text-right flex-shrink-0">
                      {formatRiskValueFull(ead[k], 'Dmg')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
