/**
 * Population Risk (Casualty Estimation) View - Spatial Heatmap
 *
 * District-level choropleth map showing fatality risk with maintenance
 * and return period controls.
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import usePopulationRisk from '@/hooks/usePopulationRisk';
import type {
  PopulationRiskScenario,
  PopulationRiskDistrict,
  RiskLevel,
} from '@/types/casualty';
import {
  RISK_LEVEL_COLORS,
  RISK_LEVEL_LABELS,
  formatCasualtyRange,
  formatModerateEstimate,
  getRiskLevelFromFatalities,
} from '@/types/casualty';
import { POPULATION_RISK_DISTRICTS } from '@/types/casualty';

interface RiskPopulationViewProps {
  climate: 'present' | 'future';
  onChoroplethData?: (data: Record<string, { value: number; level: RiskLevel }>) => void;
}

// Return period options
const RETURN_PERIODS = [
  { value: '2.3', label: '2.3 years' },
  { value: '5', label: '5 years' },
  { value: '10', label: '10 years' },
  { value: '25', label: '25 years' },
  { value: '50', label: '50 years' },
  { value: '100', label: '100 years' },
  { value: '500', label: '500 years' },
];

// Maintenance options
const MAINTENANCE_LEVELS = [
  { value: 'perfect', label: 'Perfect' },
  { value: 'breaches', label: 'Breaches' },
  { value: 'redcapacity', label: 'Reduced Capacity' },
];

export function RiskPopulationView({ climate, onChoroplethData }: RiskPopulationViewProps) {
  // Filters
  const [selectedReturnPeriod, setSelectedReturnPeriod] = useState<string>('25');
  const [selectedMaintenance, setSelectedMaintenance] = useState<string>('breaches');

  // Fetch population risk data
  const { data: scenarios, loading, error } = usePopulationRisk({
    climate,
    maintenance: selectedMaintenance as any,
    returnPeriod: selectedReturnPeriod as any,
  });

  // Find the selected scenario
  const selectedScenario = useMemo(() => {
    if (!scenarios || scenarios.length === 0) return null;
    return scenarios[0]; // API returns single scenario when filtered
  }, [scenarios]);

  // Build choropleth data for map
  const choroplethData = useMemo(() => {
    if (!selectedScenario) return null;

    const result: Record<string, { value: number; level: RiskLevel }> = {};
    selectedScenario.districtBreakdown.forEach((district) => {
      result[district.district] = {
        value: Math.round(district.estimatedFatalities.moderate),
        level: district.fatalityRiskLevel,
      };
    });
    return result;
  }, [selectedScenario]);

  // Push choropleth data to parent (for map display)
  useEffect(() => {
    if (onChoroplethData && choroplethData) {
      onChoroplethData(choroplethData);
    }
  }, [choroplethData, onChoroplethData]);

  // Clean up when unmounting
  useEffect(() => {
    return () => {
      onChoroplethData?.(null);
    };
  }, [onChoroplethData]);

  // Calculate total casualties for the scenario
  const totalCasualties = useMemo(() => {
    if (!selectedScenario) return null;
    return {
      fatalities: selectedScenario.casualtyEstimate.fatalities,
      injuries: selectedScenario.casualtyEstimate.injuries,
      affectedPopulation: selectedScenario.totalAffectedPopulation,
      fatalityRiskLevel: selectedScenario.casualtyEstimate.fatalityRiskLevel,
      injuryRiskLevel: selectedScenario.casualtyEstimate.injuryRiskLevel,
    };
  }, [selectedScenario]);

  // Get sorted districts for the list
  const sortedDistricts = useMemo(() => {
    if (!selectedScenario) return [];
    return [...selectedScenario.districtBreakdown].sort(
      (a, b) => b.estimatedFatalities.moderate - a.estimatedFatalities.moderate
    );
  }, [selectedScenario]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading population risk data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">Error: {error}</div>
      </div>
    );
  }

  if (!selectedScenario) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">No data available for selected scenario</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Population Risk (Casualty Estimation)</CardTitle>
          <CardDescription>
            Semi-quantitative fatality estimation based on depth × velocity mortality factors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6 items-end">
            {/* Return Period Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Return Period</label>
              <Select value={selectedReturnPeriod} onValueChange={setSelectedReturnPeriod}>
                <SelectTrigger className="w-40">
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

            {/* Maintenance Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Maintenance</label>
              <Select value={selectedMaintenance} onValueChange={setSelectedMaintenance}>
                <SelectTrigger className="w-48">
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

            {/* Scenario Summary */}
            {totalCasualties && (
              <div className="ml-auto flex gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Affected Population:</span>{' '}
                  <span className="font-medium">{Math.round(totalCasualties.affectedPopulation).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Fatalities:</span>{' '}
                  <span className="font-medium text-red-600">
                    {formatCasualtyRange(totalCasualties.fatalities)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Risk Level:</span>{' '}
                  <Badge
                    style={{ backgroundColor: RISK_LEVEL_COLORS[totalCasualties.fatalityRiskLevel] }}
                  >
                    {RISK_LEVEL_LABELS[totalCasualties.fatalityRiskLevel]}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* District Details - Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">District Breakdown</CardTitle>
          <CardDescription>
            Estimated fatalities by district ({selectedReturnPeriod}yr, {selectedMaintenance})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedDistricts.map((district) => {
              const fatalities = district.estimatedFatalities.moderate;
              const maxFatalities = sortedDistricts[0]?.estimatedFatalities.moderate || 1;
              const barWidth = (fatalities / maxFatalities) * 100;
              const riskColor = RISK_LEVEL_COLORS[district.fatalityRiskLevel];

              return (
                <div key={district.district} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="font-medium w-28">{district.district}</span>
                      <div className="flex-1 bg-muted rounded-full h-7 overflow-hidden relative">
                        <div
                          className="h-full transition-all duration-300"
                          style={{ width: `${barWidth}%`, backgroundColor: riskColor }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white drop-shadow-sm">
                          {formatModerateEstimate(district.estimatedFatalities)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4 text-xs">
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{ backgroundColor: riskColor }}
                      >
                        {RISK_LEVEL_LABELS[district.fatalityRiskLevel]}
                      </Badge>
                      <span className="text-muted-foreground">
                        {Math.round(district.affectedPopulation).toLocaleString()} affected
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center gap-3 text-sm">
              <span className="font-medium">Risk Level:</span>
              {Object.entries(RISK_LEVEL_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center gap-1">
                  <div
                    className="w-4 h-4 border rounded-sm"
                    style={{ backgroundColor: RISK_LEVEL_COLORS[key as RiskLevel] }}
                  />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Methodology Note */}
      <Card>
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">
            <strong>Methodology:</strong> Casualty estimates use depth × velocity mortality factors from
            Jonkman et al. (2008), USBR RCEM, and Defra FD2321. Low, moderate, and high estimates
            reflect uncertainty in flood warning effectiveness and evacuation. Injuries estimated as
            3× fatalities (international convention). V×h &gt; 1.5 m²/s threshold indicates hazardous
            conditions for stability.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default RiskPopulationView;
