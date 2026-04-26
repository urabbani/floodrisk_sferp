/**
 * Population Risk (Casualty Estimation) View
 *
 * Shows fatality/injury estimates by district with depth distribution charts,
 * summary cards, and choropleth map integration.
 */

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import usePopulationRisk from '@/hooks/usePopulationRisk';
import type {
  PopulationRiskScenario,
  PopulationRiskDistrict,
} from '@/types/casualty';
import {
  formatCasualtyRange,
  formatCasualtyWithSigma,
  calculateCasualtySigma,
  formatModerateEstimate,
  DEPTH_BINS,
  type DepthBinRange,
} from '@/types/casualty';
import type { DistrictName } from '@/types/risk';

interface RiskPopulationViewProps {
  climate: 'present' | 'future';
  onChoroplethData?: (data: Record<DistrictName, number> | null) => void;
}

const RETURN_PERIODS = [
  { value: '2.3', label: '2.3 years' },
  { value: '5', label: '5 years' },
  { value: '10', label: '10 years' },
  { value: '25', label: '25 years' },
  { value: '50', label: '50 years' },
  { value: '100', label: '100 years' },
  { value: '500', label: '500 years' },
];

const MAINTENANCE_LEVELS = [
  { value: 'perfect', label: 'Perfect' },
  { value: 'breaches', label: 'Breaches' },
  { value: 'redcapacity', label: 'Reduced Capacity' },
];

const DEPTH_BIN_COLORS: Record<DepthBinRange, string> = {
  '15-100cm': '#93c5fd',
  '1-2m': '#60a5fa',
  '2-3m': '#f59e0b',
  '3-4m': '#f97316',
  '4-5m': '#ef4444',
  'above5m': '#7f1d1d',
};

function DepthTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium text-slate-800 mb-1">{payload[0]?.payload?.range}</p>
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: payload[0]?.payload?.fill }} />
        <span className="text-slate-600">Population:</span>
        <span className="font-medium">{Math.round(payload[0]?.value ?? 0).toLocaleString()}</span>
      </div>
    </div>
  );
}

function DistrictTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm max-w-xs">
      <p className="font-semibold text-slate-800 mb-1">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-600">Affected Population:</span>
          <span className="font-medium">{Math.round(data?.affected ?? 0).toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-600">Est. Fatalities:</span>
          <span className="font-medium text-red-600">{data?.fatalityWithSigma ?? '0'}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-600">Est. Injuries:</span>
          <span className="font-medium text-orange-600">{data?.injuryWithSigma ?? '0'}</span>
        </div>
      </div>
    </div>
  );
}

export function RiskPopulationView({ climate, onChoroplethData }: RiskPopulationViewProps) {
  const [selectedReturnPeriod, setSelectedReturnPeriod] = useState<string>('25');
  const [selectedMaintenance, setSelectedMaintenance] = useState<string>('breaches');

  const { data: scenarios, loading, error } = usePopulationRisk({
    climate,
    maintenance: selectedMaintenance as any,
    returnPeriod: selectedReturnPeriod as any,
  });

  const selectedScenario = useMemo(() => {
    if (!scenarios || scenarios.length === 0) return null;
    return scenarios[0];
  }, [scenarios]);

  // Push district fatality counts as choropleth data
  useEffect(() => {
    if (!selectedScenario || !onChoroplethData) return;

    const result = {} as Record<DistrictName, number>;
    selectedScenario.districtBreakdown.forEach((d) => {
      result[d.district as DistrictName] = Math.round(d.estimatedFatalities.moderate);
    });
    onChoroplethData(result);
  }, [selectedScenario, onChoroplethData]);

  // Clean up choropleth on unmount
  useEffect(() => {
    return () => {
      onChoroplethData?.(null);
    };
  }, [onChoroplethData]);

  // Depth distribution chart data
  const depthChartData = useMemo(() => {
    if (!selectedScenario) return [];
    return DEPTH_BINS.map((bin) => ({
      range: bin,
      population: selectedScenario.depthBins[bin] ?? 0,
      fill: DEPTH_BIN_COLORS[bin],
    }));
  }, [selectedScenario]);

  // District bar chart data (sorted by fatalities descending)
  const districtChartData = useMemo(() => {
    if (!selectedScenario) return [];
    return [...selectedScenario.districtBreakdown]
      .sort((a, b) => b.estimatedFatalities.moderate - a.estimatedFatalities.moderate)
      .map((d) => ({
        district: d.district,
        fatalities: Math.round(d.estimatedFatalities.moderate),
        affected: d.affectedPopulation,
        fatalityWithSigma: formatCasualtyWithSigma(d.estimatedFatalities),
        injuryWithSigma: formatCasualtyWithSigma(d.estimatedInjuries),
      }));
  }, [selectedScenario]);

  // Summary totals
  const summary = useMemo(() => {
    if (!selectedScenario) return null;
    const ce = selectedScenario.casualtyEstimate;
    return {
      affected: selectedScenario.totalAffectedPopulation,
      fatalities: ce.fatalities,
      injuries: ce.injuries,
    };
  }, [selectedScenario]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-600">Loading population risk data...</p>
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

  if (!selectedScenario) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-slate-500">No data available for selected scenario</p>
          <p className="text-xs text-slate-400 mt-1">
            {selectedReturnPeriod}yr {selectedMaintenance} ({climate})
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-1">
      {/* Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Casualty Estimation</CardTitle>
          <CardDescription>
            Semi-quantitative fatality estimation using depth &times; velocity mortality factors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6 items-end">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Return Period</label>
              <Select value={selectedReturnPeriod} onValueChange={setSelectedReturnPeriod}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RETURN_PERIODS.map((rp) => (
                    <SelectItem key={rp.value} value={rp.value}>
                      {rp.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Maintenance</label>
              <Select value={selectedMaintenance} onValueChange={setSelectedMaintenance}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MAINTENANCE_LEVELS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Affected Population */}
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground mb-1">Affected Population</p>
              <p className="text-xl font-bold text-slate-900">
                {Math.round(summary.affected).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                people in flood zone
              </p>
            </CardContent>
          </Card>

          {/* Fatalities */}
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground mb-1">Estimated Fatalities</p>
              <p className="text-xl font-bold text-red-600">
                {formatCasualtyWithSigma(summary.fatalities)}
              </p>
            </CardContent>
          </Card>

          {/* Injuries */}
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground mb-1">Estimated Injuries</p>
              <p className="text-xl font-bold text-orange-600">
                {formatCasualtyWithSigma(summary.injuries)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                approx. 3&times; fatalities
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Depth Distribution Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Population by Flood Depth</CardTitle>
          <CardDescription>
            Distribution of affected population across depth zones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={depthChartData} margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="range"
                tick={{ fontSize: 11 }}
                interval={0}
              />
              <YAxis
                type="number"
                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)}
                tick={{ fontSize: 11 }}
              />
              <Tooltip content={<DepthTooltip />} />
              <Bar dataKey="population" radius={[4, 4, 0, 0]}>
                {depthChartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-3 mt-2 text-xs">
            {DEPTH_BINS.map((bin) => (
              <div key={bin} className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: DEPTH_BIN_COLORS[bin] }} />
                <span className="text-slate-500">{bin}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* District Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">District Fatalities</CardTitle>
          <CardDescription>
            Estimated fatalities by district ({selectedReturnPeriod}yr, {selectedMaintenance})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={Math.max(250, districtChartData.length * 45)}>
            <BarChart
              data={districtChartData}
              layout="vertical"
              margin={{ left: 20, right: 30, top: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="district"
                width={120}
                tick={{ fontSize: 11 }}
              />
              <Tooltip content={<DistrictTooltip />} />
              <Bar dataKey="fatalities" fill="#dc2626" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* District table */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="pb-2 pr-3 font-medium text-slate-600">District</th>
                  <th className="pb-2 pr-3 font-medium text-slate-600 text-right">Affected</th>
                  <th className="pb-2 pr-3 font-medium text-slate-600 text-right">Fatalities</th>
                  <th className="pb-2 pr-3 font-medium text-slate-600 text-right">Injuries</th>
                </tr>
              </thead>
              <tbody>
                {districtChartData.map((d) => (
                  <tr key={d.district} className="border-b border-slate-100">
                    <td className="py-2 pr-3 font-medium">{d.district}</td>
                    <td className="py-2 pr-3 text-right text-slate-600">
                      {Math.round(d.affected).toLocaleString()}
                    </td>
                    <td className="py-2 pr-3 text-right text-red-600 font-medium">
                      {d.fatalityWithSigma}
                    </td>
                    <td className="py-2 pr-3 text-right text-orange-600 font-medium">
                      {d.injuryWithSigma}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Methodology */}
      <Card>
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong>Methodology:</strong> Casualty estimates use depth × velocity mortality factors from
            Jonkman et al. (2008), USBR RCEM, and Defra FD2321, calibrated to Flood 2022 event.
            Values shown as <strong>estimate ± σ</strong> (moderate ± standard deviation). The σ represents uncertainty
            due to flood warning effectiveness and evacuation. Injuries estimated as 3× fatalities (international convention).
            V×h &gt; 1.5 m²/s threshold indicates hazardous conditions for stability. Map choropleth shows moderate fatality estimate per district.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default RiskPopulationView;
