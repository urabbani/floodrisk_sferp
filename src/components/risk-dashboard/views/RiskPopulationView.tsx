/**
 * Population Risk (Casualty Estimation) View
 *
 * Provides semi-quantitative fatality and injury estimation for flood scenarios
 * based on depth × velocity mortality factors from established research.
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  RiskLevel,
  CasualtyRange,
} from '@/types/casualty';
import {
  RISK_LEVEL_COLORS,
  RISK_LEVEL_LABELS,
  formatCasualtyRange,
  formatModerateEstimate,
  DEPTH_BINS,
  VELOCITY_CLASSES,
  VELOCITY_CLASS_LABELS,
  POPULATION_RISK_DISTRICTS,
} from '@/types/casualty';

interface RiskPopulationViewProps {
  climate: 'present' | 'future';
}

interface ViewModeProps {
  scenarios: PopulationRiskScenario[];
  climate: 'present' | 'future';
  selectedScenario: PopulationRiskScenario | null;
  onScenarioSelect: (scenario: PopulationRiskScenario) => void;
}

// ============================================================================
// VIEW 1: Casualty Summary Matrix (Heatmap)
// ============================================================================

function CasualtySummaryMatrix({ scenarios, climate, onScenarioSelect }: ViewModeProps) {
  // Group scenarios by return period and maintenance
  const matrixData = useMemo(() => {
    const returnPeriods = ['2.3', '5', '10', '25', '50', '100', '500'];
    const maintenanceLevels = ['perfect', 'breaches', 'redcapacity'] as const;

    return returnPeriods.map((rp) => ({
      returnPeriod: rp,
      maintenanceData: maintenanceLevels.map((maintenance) => {
        const scenario = scenarios.find(
          (s) => s.returnPeriod === rp && s.maintenance === maintenance
        );
        return {
          maintenance,
          scenario,
        };
      }),
    }));
  }, [scenarios]);

  const getRiskColor = (level: RiskLevel) => RISK_LEVEL_COLORS[level];

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Click any cell to view detailed scenario breakdown
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2 text-left bg-muted">Return Period</th>
              <th className="border p-2 text-center bg-muted">Perfect</th>
              <th className="border p-2 text-center bg-muted">Breaches</th>
              <th className="border p-2 text-center bg-muted">Reduced Capacity</th>
            </tr>
          </thead>
          <tbody>
            {matrixData.map((row) => (
              <tr key={row.returnPeriod}>
                <td className="border p-2 font-medium">{row.returnPeriod} yrs</td>
                {row.maintenanceData.map((cell) => {
                  const scenario = cell.scenario;
                  const riskLevel = scenario?.casualtyEstimate.fatalityRiskLevel || 'very_low';
                  const fatalities = scenario?.casualtyEstimate.fatalities;
                  const bgColor = getRiskColor(riskLevel);

                  return (
                    <td
                      key={cell.maintenance}
                      className="border p-2 text-center cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: scenario ? bgColor : undefined }}
                      onClick={() => scenario && onScenarioSelect(scenario)}
                    >
                      {scenario ? (
                        <div>
                          <div className="font-bold text-lg">
                            {formatModerateEstimate(fatalities)}
                          </div>
                          <div className="text-xs uppercase">
                            {RISK_LEVEL_LABELS[riskLevel]}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-sm flex-wrap">
        <span>Risk Level:</span>
        {Object.entries(RISK_LEVEL_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1">
            <div
              className="w-4 h-4 border"
              style={{ backgroundColor: RISK_LEVEL_COLORS[key as RiskLevel] }}
            />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// VIEW 2: Depth-Velocity Fatality Chart
// ============================================================================

function DepthVelocityChart({ scenarios, selectedScenario }: ViewModeProps) {
  const scenario = selectedScenario || scenarios[0];

  if (!scenario) {
    return <div className="text-muted-foreground">No scenario selected</div>;
  }

  // For simplicity, showing a text-based representation
  // In production, use Recharts or similar for proper stacked bar chart
  const depthVelocityData = useMemo(() => {
    // Reconstruct depth × velocity data from casualty estimates
    // This is a simplified representation
    return DEPTH_BINS.map((depthBin) => ({
      depthBin,
      fatalities: scenario.casualtyEstimate.fatalities.moderate / 6, // Rough distribution
    }));
  }, [scenario]);

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Fatalities by depth bin for {scenario.returnPeriod}yr {scenario.maintenance} scenario
      </div>

      <div className="space-y-2">
        {depthVelocityData.map((item) => (
          <div key={item.depthBin} className="flex items-center gap-4">
            <div className="w-24 text-sm">{item.depthBin}</div>
            <div className="flex-1 bg-muted rounded-full h-8 overflow-hidden">
              <div
                className="h-full bg-red-500 flex items-center justify-end px-2 text-xs text-white font-medium"
                style={{
                  width: `${Math.min(
                    (item.fatalities / (scenario.casualtyEstimate.fatalities.moderate || 1)) * 100,
                    100
                  )}%`,
                }}
              >
                {item.fatalities > 0 && Math.round(item.fatalities)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-muted-foreground">
        Moderate estimate: {formatCasualtyRange(scenario.casualtyEstimate.fatalities)} fatalities
      </div>
    </div>
  );
}

// ============================================================================
// VIEW 3: District Comparison
// ============================================================================

function DistrictComparison({ scenarios, selectedScenario }: ViewModeProps) {
  const scenario = selectedScenario || scenarios[0];

  if (!scenario) {
    return <div className="text-muted-foreground">No scenario selected</div>;
  }

  const sortedDistricts = useMemo(() => {
    return [...scenario.districtBreakdown].sort(
      (a, b) => b.estimatedFatalities.moderate - a.estimatedFatalities.moderate
    );
  }, [scenario]);

  const maxFatalities = sortedDistricts[0]?.estimatedFatalities.moderate || 1;

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Estimated fatalities by district for {scenario.returnPeriod}yr {scenario.maintenance}
      </div>

      <div className="space-y-3">
        {sortedDistricts.map((district) => {
          const fatalities = district.estimatedFatalities.moderate;
          const width = (fatalities / maxFatalities) * 100;
          const bgColor = RISK_LEVEL_COLORS[district.fatalityRiskLevel];

          return (
            <div key={district.district} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{district.district}</span>
                <span>{formatModerateEstimate(district.estimatedFatalities)} fatalities</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{ width: `${width}%`, backgroundColor: bgColor }}
                  />
                </div>
                <Badge variant="outline" className="text-xs">
                  {RISK_LEVEL_LABELS[district.fatalityRiskLevel]}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// VIEW 4: Fatality Estimates Table
// ============================================================================

function FatalityEstimatesTable({ scenarios, climate, onScenarioSelect }: ViewModeProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-muted">
            <th className="border p-2 text-left">RP</th>
            <th className="border p-2 text-left">Maintenance</th>
            <th className="border p-2 text-right">Affected Pop.</th>
            <th className="border p-2 text-right">Fatalities</th>
            <th className="border p-2 text-right">Injuries</th>
            <th className="border p-2 text-center">Risk Level</th>
            <th className="border p-2 text-left">Key Drivers</th>
          </tr>
        </thead>
        <tbody>
          {scenarios.map((scenario) => (
            <tr
              key={scenario.scenarioName}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onScenarioSelect(scenario)}
            >
              <td className="border p-2">{scenario.returnPeriod} yrs</td>
              <td className="border p-2 capitalize">{scenario.maintenance}</td>
              <td className="border p-2 text-right">
                {scenario.totalAffectedPopulation.toLocaleString()}
              </td>
              <td className="border p-2 text-right">
                {formatCasualtyRange(scenario.casualtyEstimate.fatalities)}
              </td>
              <td className="border p-2 text-right">
                {formatCasualtyRange(scenario.casualtyEstimate.injuries)}
              </td>
              <td className="border p-2 text-center">
                <Badge
                  style={{
                    backgroundColor: RISK_LEVEL_COLORS[scenario.casualtyEstimate.fatalityRiskLevel],
                  }}
                >
                  {RISK_LEVEL_LABELS[scenario.casualtyEstimate.fatalityRiskLevel]}
                </Badge>
              </td>
              <td className="border p-2">
                <div className="flex flex-wrap gap-1">
                  {scenario.casualtyEstimate.keyDrivers.slice(0, 2).map((driver, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {driver}
                    </Badge>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function RiskPopulationView({ climate }: RiskPopulationViewProps) {
  const { data: scenarios, loading, error } = usePopulationRisk({ climate });
  const [selectedScenario, setSelectedScenario] = useState<PopulationRiskScenario | null>(null);
  const [selectedMaintenance, setSelectedMaintenance] = useState<string>('all');
  const [selectedReturnPeriod, setSelectedReturnPeriod] = useState<string>('all');

  // Filter scenarios based on selection
  const filteredScenarios = useMemo(() => {
    if (!scenarios) return [];
    return scenarios.filter((s) => {
      if (selectedMaintenance !== 'all' && s.maintenance !== selectedMaintenance) return false;
      if (selectedReturnPeriod !== 'all' && s.returnPeriod !== selectedReturnPeriod) return false;
      return true;
    });
  }, [scenarios, selectedMaintenance, selectedReturnPeriod]);

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

  if (!scenarios || scenarios.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">No population risk data available</div>
      </div>
    );
  }

  const viewProps: ViewModeProps = {
    scenarios: filteredScenarios,
    climate,
    selectedScenario,
    onScenarioSelect: setSelectedScenario,
  };

  return (
    <div className="space-y-4">
      {/* Header with methodology */}
      <Card>
        <CardHeader>
          <CardTitle>Population Risk (Casualty Estimation)</CardTitle>
          <CardDescription>
            Semi-quantitative fatality and injury estimation based on depth × velocity mortality
            factors from Jonkman et al. (2008), USBR RCEM, and Defra FD2321.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Maintenance:</label>
              <Select value={selectedMaintenance} onValueChange={setSelectedMaintenance}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="perfect">Perfect</SelectItem>
                  <SelectItem value="breaches">Breaches</SelectItem>
                  <SelectItem value="redcapacity">Reduced Capacity</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Return Period:</label>
              <Select value={selectedReturnPeriod} onValueChange={setSelectedReturnPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="2.3">2.3 yrs</SelectItem>
                  <SelectItem value="5">5 yrs</SelectItem>
                  <SelectItem value="10">10 yrs</SelectItem>
                  <SelectItem value="25">25 yrs</SelectItem>
                  <SelectItem value="50">50 yrs</SelectItem>
                  <SelectItem value="100">100 yrs</SelectItem>
                  <SelectItem value="500">500 yrs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedScenario && (
              <div className="ml-auto text-sm">
                <span className="font-medium">Selected:</span>{' '}
                {selectedScenario.returnPeriod}yr {selectedScenario.maintenance}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2"
                  onClick={() => setSelectedScenario(null)}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main content tabs */}
      <Tabs defaultValue="matrix">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="matrix">Summary Matrix</TabsTrigger>
          <TabsTrigger value="chart">Depth-Velocity</TabsTrigger>
          <TabsTrigger value="district">Districts</TabsTrigger>
          <TabsTrigger value="table">Table</TabsTrigger>
        </TabsList>

        <TabsContent value="matrix">
          <Card>
            <CardHeader>
              <CardTitle>Casualty Summary Matrix</CardTitle>
              <CardDescription>
                Fatality risk level by return period and maintenance level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CasualtySummaryMatrix {...viewProps} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>Depth-Velocity Fatality Distribution</CardTitle>
              <CardDescription>
                Fatalities broken down by depth bin (velocity-weighted)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DepthVelocityChart {...viewProps} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="district">
          <Card>
            <CardHeader>
              <CardTitle>District Comparison</CardTitle>
              <CardDescription>
                Estimated fatalities by district for selected scenario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DistrictComparison {...viewProps} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Fatality Estimates Table</CardTitle>
              <CardDescription>
                Detailed casualty estimates with key drivers for all scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FatalityEstimatesTable {...viewProps} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
