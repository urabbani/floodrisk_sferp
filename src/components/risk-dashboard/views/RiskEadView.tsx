import React, { useMemo, useState, useEffect } from 'react';
import { Calculator, Map, BarChart3, ChevronDown, ChevronRight } from 'lucide-react';
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

// Asset groups for EAD table
const ASSET_GROUPS = {
  agriculture: { label: 'Agriculture', assets: ['crop' as AssetSubKey], icon: '🌾', color: RISK_ASSET_COLORS.crop },
  buildings: { label: 'Buildings', assets: ['buildLow56' as AssetSubKey, 'buildLow44' as AssetSubKey, 'buildHigh' as AssetSubKey], icon: '🏗️', color: RISK_ASSET_COLORS.buildLow44 },
  infrastructure: { label: 'Infrastructure', assets: ['telecom' as AssetSubKey, 'electric' as AssetSubKey, 'railways' as AssetSubKey, 'roads' as AssetSubKey, 'embankments' as AssetSubKey, 'mainCanals' as AssetSubKey, 'branchCanals' as AssetSubKey, 'drains' as AssetSubKey], icon: '🛣️', color: '#f59e0b' },
  facilities: { label: 'Facilities', assets: ['hospitals' as AssetSubKey, 'bhu' as AssetSubKey, 'schools' as AssetSubKey], icon: '🏥', color: '#a855f7' },
  livestock: { label: 'Livestock', assets: ['livestock' as AssetSubKey], icon: '🐄', color: '#f97316' },
} as const;

type AssetGroupKey = keyof typeof ASSET_GROUPS;

interface RiskEadViewProps {
  eadResults: EadResult[];
  climate: 'present' | 'future';
  onChoroplethData?: (data: Record<DistrictName, number> | null) => void;
  className?: string;
}

export function RiskEadView({ eadResults, climate, onChoroplethData, className }: RiskEadViewProps) {
  const [selectedMaintenance, setSelectedMaintenance] = useState<'breaches' | 'redcapacity' | 'perfect'>('breaches');
  const [showOnMap, setShowOnMap] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<AssetGroupKey>>(new Set());

  const toggleGroup = (group: AssetGroupKey) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  };

  const expandAll = () => setExpandedGroups(new Set(Object.keys(ASSET_GROUPS) as AssetGroupKey[]));
  const collapseAll = () => setExpandedGroups(new Set());

  // Helper to calculate group total
  const getGroupTotal = (ead: Record<AssetSubKey, number> | undefined, groupKey: AssetGroupKey): number => {
    if (!ead) return 0;
    return ASSET_GROUPS[groupKey].assets.reduce((sum, asset) => sum + (ead[asset] ?? 0), 0);
  };

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
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-slate-700">EAD by Maintenance Level</h4>
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
                <th className="text-left py-1.5 px-2 font-medium text-slate-600 sticky left-0 bg-slate-50 z-10">Asset Group</th>
                <th className="text-right py-1.5 px-2 font-medium text-slate-600 whitespace-nowrap">Breaches</th>
                <th className="text-right py-1.5 px-2 font-medium text-slate-600 whitespace-nowrap">Reduced Cap.</th>
                <th className="text-right py-1.5 px-2 font-medium text-slate-600 whitespace-nowrap">Perfect</th>
                <th className="text-right py-1.5 px-2 font-medium text-slate-600 border-l border-slate-200 whitespace-nowrap">Avg</th>
              </tr>
            </thead>
            <tbody>
              {(Object.keys(ASSET_GROUPS) as AssetGroupKey[]).map((groupKey) => {
                const group = ASSET_GROUPS[groupKey];
                const isExpanded = expandedGroups.has(groupKey);
                const breachesTotal = getGroupTotal(summaryData.find((d) => d.maintenance === 'breaches')?.result?.ead, groupKey);
                const reducedTotal = getGroupTotal(summaryData.find((d) => d.maintenance === 'redcapacity')?.result?.ead, groupKey);
                const perfectTotal = getGroupTotal(summaryData.find((d) => d.maintenance === 'perfect')?.result?.ead, groupKey);
                const avgTotal = (breachesTotal + reducedTotal + perfectTotal) / 3;

                return (
                  <React.Fragment key={groupKey}>
                    {/* Group row */}
                    <tr className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-1.5 px-2 font-medium text-slate-700 sticky left-0 bg-slate-50 z-10">
                        <button
                          onClick={() => toggleGroup(groupKey)}
                          className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                        >
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          <span>{group.icon}</span>
                          <span>{group.label}</span>
                          <span className="text-slate-400 text-[10px]">({group.assets.length})</span>
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
                    {isExpanded && group.assets.map((asset) => {
                      const breachesVal = summaryData.find((d) => d.maintenance === 'breaches')?.result?.ead[asset] ?? 0;
                      const reducedVal = summaryData.find((d) => d.maintenance === 'redcapacity')?.result?.ead[asset] ?? 0;
                      const perfectVal = summaryData.find((d) => d.maintenance === 'perfect')?.result?.ead[asset] ?? 0;
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
                  {formatRiskValueFull(summaryData.find((d) => d.maintenance === 'breaches')?.result?.eadTotal ?? 0, 'Dmg')}
                </td>
                <td className="py-1.5 px-2 text-right text-slate-800 whitespace-nowrap">
                  {formatRiskValueFull(summaryData.find((d) => d.maintenance === 'redcapacity')?.result?.eadTotal ?? 0, 'Dmg')}
                </td>
                <td className="py-1.5 px-2 text-right text-slate-800 whitespace-nowrap">
                  {formatRiskValueFull(summaryData.find((d) => d.maintenance === 'perfect')?.result?.eadTotal ?? 0, 'Dmg')}
                </td>
                <td className="py-1.5 px-2 text-right text-slate-900 border-l border-slate-200 whitespace-nowrap">
                  {formatRiskValueFull(
                    (summaryData.reduce((sum, d) => sum + (d.result?.eadTotal ?? 0), 0) / 3),
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
          <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
          <h4 className="text-sm font-semibold text-slate-700">
            EAD by District — {MAINTENANCE_LABELS[selectedMaintenance]}
          </h4>
        </div>
        <EadBarChart data={districtChartData} />
      </div>

      {/* Ranked District Table - Grouped View */}
      <div className="px-4">
        <h4 className="text-sm font-semibold text-slate-700 mb-2">Ranked by Total EAD</h4>
        <div className="space-y-2">
          {rankedDistricts.map(({ district, eadTotal, ead }, i) => (
            <div key={district} className="border border-slate-200 rounded-sm overflow-hidden">
              {/* District header with bar */}
              <div
                className="flex items-center gap-2 text-xs py-2 px-2 bg-slate-50 hover:bg-slate-100 cursor-pointer"
                onClick={() => {
                  const districtGroupKey = `district-${district}` as AssetGroupKey;
                  toggleGroup(districtGroupKey);
                }}
              >
                <span className="w-4 text-slate-400 text-right flex-shrink-0 font-medium">{i + 1}</span>
                <span className="w-28 font-semibold text-slate-700 truncate flex-shrink-0">{district}</span>
                <div className="flex-1 h-4 bg-slate-200 rounded-sm overflow-hidden min-w-[50px]">
                  <div
                    className="h-full rounded-sm"
                    style={{
                      width: `${(eadTotal / maxEad) * 100}%`,
                      backgroundColor: getRiskColor(eadTotal, 0, maxEad),
                    }}
                  />
                </div>
                <span className="w-24 text-right font-bold text-slate-900 flex-shrink-0">
                  {formatRiskValueFull(eadTotal, 'Dmg')}
                </span>
                {expandedGroups.has(`district-${district}` as AssetGroupKey)
                  ? <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  : <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
                }
              </div>

              {/* Expanded asset groups */}
              {expandedGroups.has(`district-${district}` as AssetGroupKey) && ead && (
                <div className="text-xs bg-white">
                  {(Object.keys(ASSET_GROUPS) as AssetGroupKey[]).map((groupKey) => {
                    const group = ASSET_GROUPS[groupKey];
                    const groupTotal = getGroupTotal(ead, groupKey);
                    const pct = eadTotal > 0 ? (groupTotal / eadTotal) * 100 : 0;

                    return (
                      <div key={groupKey} className="border-b border-slate-100 last:border-0">
                        {/* Group row */}
                        <div
                          className="flex items-center gap-2 py-1 px-2 hover:bg-slate-50 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleGroup(`${groupKey}-${district}` as AssetGroupKey);
                          }}
                        >
                          <span className="w-4" />
                          <span className="w-28 flex items-center gap-1 text-slate-600 truncate">
                            {group.icon} {group.label}
                          </span>
                          <div className="flex-1 h-2 bg-slate-100 rounded-sm overflow-hidden">
                            <div
                              className="h-full rounded-sm"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: group.color,
                              }}
                            />
                          </div>
                          <span className="w-24 text-right font-medium text-slate-700 flex-shrink-0">
                            {formatRiskValueFull(groupTotal, 'Dmg')}
                          </span>
                          <span className="w-12 text-right text-slate-500 flex-shrink-0 text-[10px]">
                            {pct.toFixed(1)}%
                          </span>
                          {expandedGroups.has(`${groupKey}-${district}` as AssetGroupKey)
                            ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            : <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          }
                        </div>

                        {/* Individual assets within group */}
                        {expandedGroups.has(`${groupKey}-${district}` as AssetGroupKey) && (
                          <div className="bg-slate-50/50">
                            {group.assets.map((asset) => {
                              const val = ead[asset] ?? 0;
                              const assetPct = eadTotal > 0 ? (val / eadTotal) * 100 : 0;

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
