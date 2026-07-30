import React, { useMemo, useState, useEffect } from 'react';
import { TrendingUp, Map, BarChart3, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { EalResult, AssetSubKey, SectorKey, DistrictName } from '@/types/risk';
import {
  MAINTENANCE_LEVELS,
  MAINTENANCE_LABELS,
  DISTRICTS,
  DISPLAY_ASSET_KEYS,
  ASSET_SUB_KEY_LABELS,
  SECTOR_KEYS,
  SECTOR_ASSETS,
  SECTOR_LABELS,
  SECTOR_COLORS,
  SECTOR_ICONS,
  formatRiskValueFull,
  getRiskColor,
  RISK_ASSET_COLORS,
} from '@/types/risk';
import { EalBarChart } from '../components/EalBarChart';
import type { EalBarChartData } from '../components/EalBarChart';

interface RiskEalViewProps {
  ealResults: EalResult[];
  climate: 'present' | 'future';
  onChoroplethData?: (data: Record<DistrictName, number> | null) => void;
  className?: string;
}

export function RiskEalView({ ealResults, climate, onChoroplethData, className }: RiskEalViewProps) {
  const [selectedMaintenance, setSelectedMaintenance] = useState<'breaches' | 'redcapacity' | 'perfect'>('breaches');
  const [showOnMap, setShowOnMap] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const expandAll = () => setExpandedGroups(new Set(SECTOR_KEYS));
  const collapseAll = () => setExpandedGroups(new Set());

  // Helper to calculate sector total
  const getSectorTotal = (eal: Record<AssetSubKey, number> | undefined, sector: SectorKey): number => {
    if (!eal) return 0;
    return SECTOR_ASSETS[sector].reduce((sum, asset) => sum + (eal[asset] ?? 0), 0);
  };

  // Summary: EAL by maintenance level for TOTAL region
  const summaryData = useMemo(() => {
    return MAINTENANCE_LEVELS.map((m) => {
      const result = ealResults.find(
        (r) => r.climate === climate && r.maintenance === m && r.region === 'TOTAL'
      );
      return { maintenance: m, result };
    });
  }, [ealResults, climate]);

  // District chart data for selected maintenance
  const districtChartData: EalBarChartData[] = useMemo(() => {
    return DISTRICTS.map((district) => {
      const result = ealResults.find(
        (r) => r.climate === climate && r.maintenance === selectedMaintenance && r.region === district
      );
      const eal = result?.eal;
      const rawData: Record<string, number> = {};
      for (const asset of DISPLAY_ASSET_KEYS) {
        rawData[asset] = eal?.[asset] ?? 0;
      }
      return {
        district,
        rawData,
      };
    }).sort((a, b) =>
      DISPLAY_ASSET_KEYS.reduce((s, k) => s + (b.rawData[k] ?? 0) - (a.rawData[k] ?? 0), 0)
    );
  }, [ealResults, climate, selectedMaintenance]);

  // Ranked districts
  const rankedDistricts = useMemo(() => {
    return DISTRICTS.map((district) => {
      const result = ealResults.find(
        (r) => r.climate === climate && r.maintenance === selectedMaintenance && r.region === district
      );
      return { district, ealTotal: result?.ealTotal ?? 0, eal: result?.eal };
    }).sort((a, b) => b.ealTotal - a.ealTotal);
  }, [ealResults, climate, selectedMaintenance]);

  // Max total for bar width scaling
  const maxEal = useMemo(() => Math.max(...rankedDistricts.map((d) => d.ealTotal), 1), [rankedDistricts]);

  // Choropleth data push
  useEffect(() => {
    if (showOnMap && onChoroplethData) {
      const mapData = {} as Record<DistrictName, number>;
      for (const d of DISTRICTS) {
        const result = ealResults.find(
          (r) => r.climate === climate && r.maintenance === selectedMaintenance && r.region === d
        );
        mapData[d as DistrictName] = result?.ealTotal ?? 0;
      }
      onChoroplethData(mapData);
    } else if (!showOnMap) {
      onChoroplethData?.(null);
    }
    return () => {
      onChoroplethData?.(null);
    };
  }, [showOnMap, ealResults, climate, selectedMaintenance, onChoroplethData]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-semibold text-slate-800">Expected Annual Loss (EAL)</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Loss/Damage factors applied per sector, integrated across 7 return periods (2.3yr – 500yr)
        </p>
      </div>

      {/* Summary Table */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-slate-700">EAL by Maintenance Level (by Sector)</h4>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" className="text-xs h-6 px-2" onClick={expandAll}>
              Expand All
            </Button>
            <Button size="sm" variant="ghost" className="text-xs h-6 px-2" onClick={collapseAll}>
              Collapse All
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-1.5 px-2 font-medium text-slate-600 sticky left-0 bg-slate-50 z-10">Sector</th>
                <th className="text-right py-1.5 px-2 font-medium text-slate-600 whitespace-nowrap">Breaches</th>
                <th className="text-right py-1.5 px-2 font-medium text-slate-600 whitespace-nowrap">Reduced Cap.</th>
                <th className="text-right py-1.5 px-2 font-medium text-slate-600 whitespace-nowrap">Perfect</th>
                <th className="text-right py-1.5 px-2 font-medium text-slate-600 border-l border-slate-200 whitespace-nowrap">Avg</th>
              </tr>
            </thead>
            <tbody>
              {SECTOR_KEYS.map((sector) => {
                const isExpanded = expandedGroups.has(sector);
                const breachesTotal = getSectorTotal(summaryData.find((d) => d.maintenance === 'breaches')?.result?.eal, sector);
                const reducedTotal = getSectorTotal(summaryData.find((d) => d.maintenance === 'redcapacity')?.result?.eal, sector);
                const perfectTotal = getSectorTotal(summaryData.find((d) => d.maintenance === 'perfect')?.result?.eal, sector);
                const avgTotal = (breachesTotal + reducedTotal + perfectTotal) / 3;
                const hasAssets = SECTOR_ASSETS[sector].length > 0;

                return (
                  <React.Fragment key={sector}>
                    {/* Sector row */}
                    <tr className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-1.5 px-2 font-medium text-slate-700 sticky left-0 bg-slate-50 z-10">
                        <button
                          onClick={() => hasAssets && toggleGroup(sector)}
                          className={cn('flex items-center gap-1 transition-colors', hasAssets && 'hover:text-amber-600')}
                        >
                          {hasAssets && (isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />)}
                          <span>{SECTOR_ICONS[sector]}</span>
                          <span>{SECTOR_LABELS[sector]}</span>
                          <span className="text-slate-400 text-[10px]">({SECTOR_ASSETS[sector].length})</span>
                        </button>
                      </td>
                      <td className="py-1.5 px-2 text-right text-slate-600 whitespace-nowrap">
                        {formatRiskValueFull(breachesTotal, 'Dmg')}
                      </td>
                      <td className="py-1.5 px-2 text-right text-slate-600 whitespace-nowrap">
                        {formatRiskValueFull(reducedTotal, 'Dmg')}
                      </td>
                      <td className="py-1.5 px-2 text-right text-slate-600 whitespace-nowrap">
                        {formatRiskValueFull(perfectTotal, 'Dmg')}
                      </td>
                      <td className="py-1.5 px-2 text-right font-semibold text-slate-900 border-l border-slate-200 whitespace-nowrap">
                        {formatRiskValueFull(avgTotal, 'Dmg')}
                      </td>
                    </tr>
                    {/* Expanded asset rows */}
                    {isExpanded && SECTOR_ASSETS[sector].map((asset) => {
                      const breachesVal = summaryData.find((d) => d.maintenance === 'breaches')?.result?.eal[asset] ?? 0;
                      const reducedVal = summaryData.find((d) => d.maintenance === 'redcapacity')?.result?.eal[asset] ?? 0;
                      const perfectVal = summaryData.find((d) => d.maintenance === 'perfect')?.result?.eal[asset] ?? 0;
                      const avgVal = (breachesVal + reducedVal + perfectVal) / 3;

                      return (
                        <tr key={asset} className="border-b border-slate-50 bg-slate-50/50 hover:bg-slate-50">
                          <td className="py-1 px-2 pl-6 text-slate-600 sticky left-0 bg-slate-50/50 z-10">
                            <span className="inline-block w-1.5 h-1.5 rounded-sm mr-1.5" style={{ backgroundColor: RISK_ASSET_COLORS[asset] }} />
                            {ASSET_SUB_KEY_LABELS[asset]}
                          </td>
                          <td className="py-1 px-2 text-right text-slate-500 whitespace-nowrap">
                            {formatRiskValueFull(breachesVal, 'Dmg')}
                          </td>
                          <td className="py-1 px-2 text-right text-slate-500 whitespace-nowrap">
                            {formatRiskValueFull(reducedVal, 'Dmg')}
                          </td>
                          <td className="py-1 px-2 text-right text-slate-500 whitespace-nowrap">
                            {formatRiskValueFull(perfectVal, 'Dmg')}
                          </td>
                          <td className="py-1 px-2 text-right text-slate-600 border-l border-slate-200 whitespace-nowrap">
                            {formatRiskValueFull(avgVal, 'Dmg')}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
              {/* Total row */}
              <tr className="border-b border-slate-200 bg-slate-100 font-semibold">
                <td className="py-1.5 px-2 text-slate-800 sticky left-0 bg-slate-100 z-10">
                  Grand Total
                </td>
                <td className="py-1.5 px-2 text-right text-slate-800 whitespace-nowrap">
                  {formatRiskValueFull(summaryData.find((d) => d.maintenance === 'breaches')?.result?.ealTotal ?? 0, 'Dmg')}
                </td>
                <td className="py-1.5 px-2 text-right text-slate-800 whitespace-nowrap">
                  {formatRiskValueFull(summaryData.find((d) => d.maintenance === 'redcapacity')?.result?.ealTotal ?? 0, 'Dmg')}
                </td>
                <td className="py-1.5 px-2 text-right text-slate-800 whitespace-nowrap">
                  {formatRiskValueFull(summaryData.find((d) => d.maintenance === 'perfect')?.result?.ealTotal ?? 0, 'Dmg')}
                </td>
                <td className="py-1.5 px-2 text-right text-slate-900 border-l border-slate-200 whitespace-nowrap">
                  {formatRiskValueFull(
                    (summaryData.reduce((sum, d) => sum + (d.result?.ealTotal ?? 0), 0) / 3),
                    'Dmg'
                  )}
                </td>
              </tr>
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
          <BarChart3 className="w-3.5 h-3.5 text-amber-600" />
          <h4 className="text-sm font-semibold text-slate-700">
            EAL by District — {MAINTENANCE_LABELS[selectedMaintenance]}
          </h4>
        </div>
        <EalBarChart data={districtChartData} />
      </div>

      {/* Ranked District Table - Grouped View */}
      <div className="px-4">
        <h4 className="text-sm font-semibold text-slate-700 mb-2">Ranked by Total EAL</h4>
        <div className="space-y-2">
          {rankedDistricts.map(({ district, ealTotal, eal }, i) => (
            <div key={district} className="border border-slate-200 rounded-sm overflow-hidden">
              {/* District header with bar */}
              <div
                className="flex items-center gap-2 text-xs py-2 px-2 bg-slate-50 hover:bg-slate-100 cursor-pointer"
                onClick={() => toggleGroup(`district-${district}`)}
              >
                <span className="w-4 text-slate-400 text-right flex-shrink-0 font-medium">{i + 1}</span>
                <span className="w-28 font-semibold text-slate-700 truncate flex-shrink-0">{district}</span>
                <div className="flex-1 h-4 bg-slate-200 rounded-sm overflow-hidden min-w-[50px]">
                  <div
                    className="h-full rounded-sm"
                    style={{
                      width: `${(ealTotal / maxEal) * 100}%`,
                      backgroundColor: getRiskColor(ealTotal, 0, maxEal),
                    }}
                  />
                </div>
                <span className="w-24 text-right font-bold text-slate-900 flex-shrink-0">
                  {formatRiskValueFull(ealTotal, 'Dmg')}
                </span>
                {expandedGroups.has(`district-${district}`)
                  ? <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  : <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
                }
              </div>

              {/* Expanded sectors */}
              {expandedGroups.has(`district-${district}`) && eal && (
                <div className="text-xs bg-white">
                  {SECTOR_KEYS.filter((s) => SECTOR_ASSETS[s].length > 0).map((sector) => {
                    const sectorTotal = getSectorTotal(eal, sector);
                    const pct = ealTotal > 0 ? (sectorTotal / ealTotal) * 100 : 0;

                    return (
                      <div key={sector} className="border-b border-slate-100 last:border-0">
                        {/* Sector row */}
                        <div
                          className="flex items-center gap-2 py-1 px-2 hover:bg-slate-50 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleGroup(`${sector}-${district}`);
                          }}
                        >
                          <span className="w-4" />
                          <span className="w-28 flex items-center gap-1 text-slate-600 truncate">
                            {SECTOR_ICONS[sector]} {SECTOR_LABELS[sector]}
                          </span>
                          <div className="flex-1 h-2 bg-slate-100 rounded-sm overflow-hidden">
                            <div
                              className="h-full rounded-sm"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: SECTOR_COLORS[sector],
                              }}
                            />
                          </div>
                          <span className="w-24 text-right font-medium text-slate-700 flex-shrink-0">
                            {formatRiskValueFull(sectorTotal, 'Dmg')}
                          </span>
                          <span className="w-12 text-right text-slate-500 flex-shrink-0 text-[10px]">
                            {pct.toFixed(1)}%
                          </span>
                          {expandedGroups.has(`${sector}-${district}`)
                            ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            : <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          }
                        </div>

                        {/* Individual assets within sector */}
                        {expandedGroups.has(`${sector}-${district}`) && (
                          <div className="bg-slate-50/50">
                            {SECTOR_ASSETS[sector].map((asset) => {
                              const val = eal[asset] ?? 0;
                              const assetPct = ealTotal > 0 ? (val / ealTotal) * 100 : 0;

                              return (
                                <div key={asset} className="flex items-center gap-2 py-1 px-2 pl-8">
                                  <span className="w-4" />
                                  <span className="w-28 flex items-center gap-1 text-slate-500 truncate">
                                    <span className="inline-block w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: RISK_ASSET_COLORS[asset] }} />
                                    {ASSET_SUB_KEY_LABELS[asset]}
                                  </span>
                                  <div className="flex-1 h-1.5 bg-slate-100 rounded-sm overflow-hidden">
                                    <div
                                      className="h-full rounded-sm"
                                      style={{
                                        width: `${assetPct}%`,
                                        backgroundColor: RISK_ASSET_COLORS[asset],
                                      }}
                                    />
                                  </div>
                                  <span className="w-24 text-right text-slate-600 flex-shrink-0">
                                    {formatRiskValueFull(val, 'Dmg')}
                                  </span>
                                  <span className="w-12 text-right text-slate-400 flex-shrink-0 text-[10px]">
                                    {assetPct.toFixed(1)}%
                                  </span>
                                  <span className="w-4" />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
