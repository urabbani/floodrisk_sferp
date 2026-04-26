/**
 * Flood Risk Hotspots View
 *
 * Combines physical risk, population risk, and socioeconomic vulnerability
 * into composite hotspot scores for prioritized intervention.
 *
 * METHODOLOGY UPDATE (April 2026):
 * - Physical Risk: Uses Expected Annual Damage (EAD) - integrated across ALL 7 return periods
 * - Population Risk: Uses Expected Annual Fatalities (EAF) - integrated across ALL 7 return periods
 * - Socioeconomic Vulnerability: Static census + poverty composite index
 *
 * This ensures consistent methodology across both risk dimensions.
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Flame, Map, TrendingUp, AlertTriangle } from 'lucide-react';
import useHotspotData from '../hooks/useHotspotData';
import type { HotspotDistrictResult } from '@/types/socioeconomic';
import type { DistrictName } from '@/types/risk';
import {
  MAINTENANCE_LEVELS,
  MAINTENANCE_LABELS,
  DISTRICTS,
  getRiskColor,
} from '@/types/risk';

interface RiskHotspotViewProps {
  climate: 'present' | 'future';
  onChoroplethData?: (data: Record<DistrictName, number> | null) => void;
}

// District colors for radar chart (7 distinct colors)
const DISTRICT_COLORS: Record<string, string> = {
  Dadu: '#dc2626',
  Jacobabad: '#f97316',
  Jamshoro: '#eab308',
  Kashmore: '#22c55e',
  Larkana: '#3b82f6',
  'Qambar Shahdadkot': '#8b5cf6',
  Shikarpur: '#ec4899',
};

export function RiskHotspotView({ climate, onChoroplethData }: RiskHotspotViewProps) {
  const [showOnMap, setShowOnMap] = useState(true);

  const {
    hotspotResults,
    loading,
    error,
    maintenance,
    setMaintenance,
  } = useHotspotData(climate);

  // Push hotspot scores as choropleth data
  useEffect(() => {
    if (showOnMap && hotspotResults && onChoroplethData) {
      const mapData: Record<DistrictName, number> = {} as any;
      for (const r of hotspotResults) {
        mapData[r.district as DistrictName] = r.hotspotScore;
      }
      onChoroplethData(mapData);
    } else if (!showOnMap) {
      onChoroplethData?.(null);
    }
    return () => {
      onChoroplethData?.(null);
    };
  }, [showOnMap, hotspotResults, onChoroplethData]);

  // Summary stats
  const summary = useMemo(() => {
    if (!hotspotResults || hotspotResults.length === 0) return null;
    return {
      topDistrict: hotspotResults[0],
      averageScore: Math.round(
        hotspotResults.reduce((sum, r) => sum + r.hotspotScore, 0) / hotspotResults.length
      ),
      highRiskCount: hotspotResults.filter((r) => r.hotspotScore >= 60).length,
    };
  }, [hotspotResults]);

  // Radar chart data: 3 axes × 7 districts
  const radarData = useMemo(() => {
    if (!hotspotResults) return [];
    return [
      {
        dimension: 'Physical Risk',
        ...Object.fromEntries(
          hotspotResults.map((r) => [r.district, r.dimensions.physicalRisk])
        ),
      },
      {
        dimension: 'Population Risk',
        ...Object.fromEntries(
          hotspotResults.map((r) => [r.district, r.dimensions.populationRisk])
        ),
      },
      {
        dimension: 'Socioeconomic',
        ...Object.fromEntries(
          hotspotResults.map((r) => [r.district, r.dimensions.socioeconomicVulnerability])
        ),
      },
    ];
  }, [hotspotResults]);

  // Custom tooltip with access to hotspotResults for full district data
  function renderHotspotTooltip({ active, payload }: any) {
    if (!active || !payload?.length || !hotspotResults) return null;

    const districtName = payload[0]?.name;
    if (!districtName) return null;

    // Find this district's full data from hotspotResults
    const districtData = hotspotResults.find((r) => r.district === districtName);
    if (!districtData) return null;

    const { dimensions, hotspotScore } = districtData;

    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium text-slate-800 mb-2">{districtName}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-600">Physical Risk:</span>
            <span className="font-medium">{dimensions.physicalRisk}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-600">Population Risk:</span>
            <span className="font-medium">{dimensions.populationRisk}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-600">Socioeconomic:</span>
            <span className="font-medium">{dimensions.socioeconomicVulnerability}</span>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-1 mt-1">
            <span className="text-slate-700 font-medium">Hotspot Score:</span>
            <span className="font-bold text-orange-600">{hotspotScore}</span>
          </div>
        </div>
      </div>
    );
  }

  // Max score for bar scaling
  const maxScore = 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-600">Loading hotspot data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-1">Error Loading Data</p>
          <p className="text-sm text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!hotspotResults || hotspotResults.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">No hotspot data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-1">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3 bg-gradient-to-r from-orange-50 to-slate-50">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-600" />
            <CardTitle className="text-lg">Flood Risk Hotspots</CardTitle>
          </div>
          <CardDescription>
            Multi-Criteria Analysis (MCA) using EAD, EAF, and Socioeconomic vulnerability — integrated across all 7 return periods for stable, comparable hotspot scores
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Controls */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Maintenance Level</label>
              <div className="flex gap-1">
                {MAINTENANCE_LEVELS.map((m) => (
                  <Button
                    key={m}
                    variant={maintenance === m ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setMaintenance(m)}
                    className="text-xs h-8"
                  >
                    {MAINTENANCE_LABELS[m]}
                  </Button>
                ))}
              </div>
            </div>
            <div className="ml-auto">
              <Button
                variant={showOnMap ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowOnMap(!showOnMap)}
                className="text-xs h-8"
              >
                <Map className="w-3.5 h-3.5 mr-1" />
                {showOnMap ? 'Hide Map' : 'Show on Map'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <p className="text-xs text-muted-foreground">Top Hotspot</p>
              </div>
              <p className="text-xl font-bold text-slate-900">{summary.topDistrict.district}</p>
              <p className="text-xs text-muted-foreground">
                Score: <span className="font-semibold text-orange-600">{summary.topDistrict.hotspotScore}</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <p className="text-xs text-muted-foreground">Average Score</p>
              </div>
              <p className="text-xl font-bold text-slate-900">{summary.averageScore}</p>
              <p className="text-xs text-muted-foreground">
                across {hotspotResults.length} districts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-4 h-4 text-red-600" />
                <p className="text-xs text-muted-foreground">High-Risk Districts</p>
              </div>
              <p className="text-xl font-bold text-red-600">{summary.highRiskCount}</p>
              <p className="text-xs text-muted-foreground">
                scores ≥ 60 (threshold)
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ranked District Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">District Hotspot Rankings</CardTitle>
          <CardDescription>
            MCA-based composite scores integrating EAD, EAF, and Vulnerability across all return periods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {hotspotResults.map((result, i) => (
              <div
                key={result.district}
                className="flex items-center gap-3 text-sm py-2 px-2 rounded hover:bg-slate-50"
              >
                <span className="w-6 text-slate-400 text-right flex-shrink-0 font-medium">{result.overallRank}</span>
                <span className="w-32 font-medium text-slate-700 truncate flex-shrink-0">{result.district}</span>
                <div className="flex-1 flex items-center gap-2 min-w-[100px]">
                  <div className="flex-1 h-5 bg-slate-100 rounded-sm overflow-hidden">
                    <div
                      className="h-full rounded-sm"
                      style={{
                        width: `${(result.hotspotScore / maxScore) * 100}%`,
                        backgroundColor: getRiskColor(result.hotspotScore, 0, maxScore),
                      }}
                    />
                  </div>
                  <span className="w-10 text-right font-bold text-slate-900 flex-shrink-0">
                    {result.hotspotScore}
                  </span>
                </div>
                <Badge
                  variant={result.hotspotScore >= 60 ? 'destructive' : result.hotspotScore >= 40 ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {result.hotspotScore >= 60 ? 'High' : result.hotspotScore >= 40 ? 'Moderate' : 'Low'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Radar Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Dimension Comparison</CardTitle>
          <CardDescription>
            Multi-dimensional risk profile by district
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip content={renderHotspotTooltip} />
              <Legend />
              {DISTRICTS.map((district) => (
                <Radar
                  key={district}
                  name={district}
                  dataKey={district}
                  stroke={DISTRICT_COLORS[district]}
                  fill={DISTRICT_COLORS[district]}
                  fillOpacity={0.15}
                />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Methodology */}
      <Card>
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong>Methodology:</strong> Multi-Criteria Analysis combining EAD, EAF, and Socioeconomic vulnerability (equal weights).
            <br />• <strong>Physical Risk (EAD):</strong> Expected Annual Damage integrated across 7 return periods (2.3yr–500yr) using trapezoidal integration
            <br />• <strong>Population Risk (EAF):</strong> Expected Annual Fatalities integrated across 7 return periods using trapezoidal integration
            <br />• <strong>Socioeconomic Vulnerability:</strong> Composite index from census 2017 + poverty 2019
            <br />Both EAD and EAF use identical probabilistic methodology, integrating across the full probability spectrum.
            <br /><strong className="text-green-700">✓ Stable Rankings:</strong> Hotspot scores remain consistent regardless of single return period selection, as they capture the complete risk distribution rather than one specific scenario.
            Each dimension is min-max normalized across districts, then weighted equally (1/3 each).
            Higher scores indicate greater overall flood risk and intervention priority.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default RiskHotspotView;
