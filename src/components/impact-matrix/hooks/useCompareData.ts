/**
 * Hook for fetching and managing comparison data
 * Handles Present vs Future climate data fetching with parallel requests
 * and automatic delta calculations
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  CompareData,
  ScenarioImpactSummary,
  ScenarioComparison,
  ClimateDelta,
  ExposureLayerType,
} from '@/types/impact';
import { calculateDelta, getSeverityChange } from '@/types/impact';

interface UseCompareDataResult {
  data: CompareData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Find matching scenario by return period and maintenance
 */
function findMatchingScenario(
  scenarios: ScenarioImpactSummary[],
  returnPeriod: string,
  maintenance: string
): ScenarioImpactSummary | undefined {
  return scenarios.find((s) => s.returnPeriod === returnPeriod && s.maintenance === maintenance);
}

/**
 * Calculate deltas for all exposure layers between two scenarios
 */
function calculateExposureDeltas(
  baseline: ScenarioImpactSummary,
  comparison: ScenarioImpactSummary
): Record<ExposureLayerType, ClimateDelta> {
  const deltas: Record<ExposureLayerType, ClimateDelta> = {} as any;

  Object.keys(baseline.impacts).forEach((layerType) => {
    const layer = layerType as ExposureLayerType;
    const baselineImpact = baseline.impacts[layer];
    const comparisonImpact = comparison.impacts[layer];

    if (baselineImpact && comparisonImpact) {
      deltas[layer] = calculateDelta(
        baselineImpact.affectedFeatures,
        comparisonImpact.affectedFeatures
      );
    } else if (comparisonImpact && !baselineImpact) {
      // New impact in comparison scenario
      deltas[layer] = calculateDelta(0, comparisonImpact.affectedFeatures);
    } else {
      // No impact in either or impact disappeared
      const baselineFeatures = baselineImpact?.affectedFeatures ?? 0;
      const comparisonFeatures = comparisonImpact?.affectedFeatures ?? 0;
      deltas[layer] = calculateDelta(baselineFeatures, comparisonFeatures);
    }
  });

  return deltas;
}

/**
 * Calculate population delta between two scenarios
 */
function calculatePopulationDelta(
  baseline: ScenarioImpactSummary,
  comparison: ScenarioImpactSummary
): ClimateDelta | undefined {
  if (!baseline.populationImpact || !comparison.populationImpact) {
    return undefined;
  }

  return calculateDelta(
    baseline.populationImpact.affectedPopulation,
    comparison.populationImpact.affectedPopulation
  );
}

/**
 * Calculate infrastructure impact delta (average of Roads, Railways, Electric Grid, Telecom)
 */
function calculateInfrastructureDelta(
  baseline: ScenarioImpactSummary,
  comparison: ScenarioImpactSummary
): ClimateDelta | undefined {
  const infrastructureTypes: ExposureLayerType[] = ['Roads', 'Railways', 'Electric_Grid', 'Telecom_Towers'];

  let baselineAvg = 0;
  let comparisonAvg = 0;
  let count = 0;

  infrastructureTypes.forEach((type) => {
    const baselineImpact = baseline.impacts[type];
    const comparisonImpact = comparison.impacts[type];

    if (baselineImpact && comparisonImpact) {
      // Calculate percentage affected
      const baselinePct = (baselineImpact.affectedFeatures / baselineImpact.totalFeatures) * 100;
      const comparisonPct = (comparisonImpact.affectedFeatures / comparisonImpact.totalFeatures) * 100;
      baselineAvg += baselinePct;
      comparisonAvg += comparisonPct;
      count++;
    }
  });

  if (count === 0) return undefined;

  return calculateDelta(baselineAvg / count, comparisonAvg / count);
}

/**
 * Calculate agriculture impact delta (Cropped Area and Built-up Area)
 */
function calculateAgBuildingDelta(
  baseline: ScenarioImpactSummary,
  comparison: ScenarioImpactSummary
): ClimateDelta | undefined {
  const agBuildingTypes: ExposureLayerType[] = ['Built_up_Area', 'Cropped_Area'];

  let baselineAvg = 0;
  let comparisonAvg = 0;
  let count = 0;

  agBuildingTypes.forEach((type) => {
    const baselineImpact = baseline.impacts[type];
    const comparisonImpact = comparison.impacts[type];

    if (baselineImpact && comparisonImpact) {
      const baselinePct = (baselineImpact.affectedFeatures / baselineImpact.totalFeatures) * 100;
      const comparisonPct = (comparisonImpact.affectedFeatures / comparisonImpact.totalFeatures) * 100;
      baselineAvg += baselinePct;
      comparisonAvg += comparisonPct;
      count++;
    }
  });

  if (count === 0) return undefined;

  return calculateDelta(baselineAvg / count, comparisonAvg / count);
}

/**
 * Match scenarios from Present and Future and calculate deltas
 */
function createComparisons(
  present: ScenarioImpactSummary[],
  future: ScenarioImpactSummary[]
): ScenarioComparison[] {
  const comparisons: ScenarioComparison[] = [];

  // Iterate through all present scenarios
  present.forEach((presentScenario) => {
    // Find matching future scenario
    const futureScenario = findMatchingScenario(
      future,
      presentScenario.returnPeriod,
      presentScenario.maintenance
    );

    if (futureScenario) {
      const exposureDeltas = calculateExposureDeltas(presentScenario, futureScenario);

      comparisons.push({
        baseline: presentScenario,
        comparison: futureScenario,
        deltas: exposureDeltas,
        populationDelta: calculatePopulationDelta(presentScenario, futureScenario),
        infrastructureDelta: calculateInfrastructureDelta(presentScenario, futureScenario),
        agBuildingDelta: calculateAgBuildingDelta(presentScenario, futureScenario),
        severityChange: getSeverityChange(presentScenario.severity, futureScenario.severity),
      });
    }
  });

  return comparisons;
}

/**
 * Hook for fetching comparison data
 * Fetches both Present and Future climate data in parallel
 * and calculates deltas between matching scenarios
 */
export function useCompareData(mode: 'climate' | 'maintenance'): UseCompareDataResult {
  const [data, setData] = useState<CompareData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch both climates in parallel for better performance
      const [presentRes, futureRes] = await Promise.all([
        fetch('/api/impact/summary?climate=present'),
        fetch('/api/impact/summary?climate=future'),
      ]);

      if (!presentRes.ok) {
        throw new Error(`Failed to fetch Present climate data: ${presentRes.statusText}`);
      }
      if (!futureRes.ok) {
        throw new Error(`Failed to fetch Future climate data: ${futureRes.statusText}`);
      }

      const [presentData, futureData] = await Promise.all([
        presentRes.json() as Promise<{ success: boolean; data: { climate: string; summaries: ScenarioImpactSummary[]; metadata: { lastUpdated: string } } }>,
        futureRes.json() as Promise<{ success: boolean; data: { climate: string; summaries: ScenarioImpactSummary[]; metadata: { lastUpdated: string } } }>,
      ]);

      if (!presentData.success || !futureData.success) {
        throw new Error('Invalid response format from API');
      }

      // Calculate deltas between matching scenarios
      const deltas = createComparisons(presentData.data.summaries, futureData.data.summaries);

      setData({
        present: presentData.data.summaries,
        future: futureData.data.summaries,
        deltas,
        metadata: {
          presentLastUpdated: presentData.data.metadata.lastUpdated,
          futureLastUpdated: futureData.data.metadata.lastUpdated,
        },
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      console.error('Error fetching comparison data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

/**
 * Calculate summary deltas for the summary cards
 * Aggregates deltas across all scenarios
 */
export function useSummaryDeltas(comparisons: ScenarioComparison[]) {
  const calculateAggregates = useCallback(() => {
    if (comparisons.length === 0) {
      return {
        population: { absolute: 0, relative: 0, direction: 'neutral' as const },
        infrastructure: { absolute: 0, relative: 0, direction: 'neutral' as const },
        agBuilding: { absolute: 0, relative: 0, direction: 'neutral' as const },
        severityChange: 'unchanged' as const,
      };
    }

    // Sum up all deltas
    let totalPopulationDelta = 0;
    let totalInfrastructureDelta = 0;
    let totalAgBuildingDelta = 0;
    let severityIncreasedCount = 0;

    comparisons.forEach((comp) => {
      if (comp.populationDelta) {
        totalPopulationDelta += comp.populationDelta.absolute;
      }
      if (comp.infrastructureDelta) {
        totalInfrastructureDelta += comp.infrastructureDelta.relative;
      }
      if (comp.agBuildingDelta) {
        totalAgBuildingDelta += comp.agBuildingDelta.relative;
      }
      if (comp.severityChange === 'increased') {
        severityIncreasedCount++;
      }
    });

    // Calculate averages
    const avgPopulationDelta = totalPopulationDelta / comparisons.length;
    const avgInfrastructureDelta = totalInfrastructureDelta / comparisons.length;
    const avgAgBuildingDelta = totalAgBuildingDelta / comparisons.length;

    // Determine overall severity change
    let severityChange: 'increased' | 'decreased' | 'unchanged' = 'unchanged';
    if (severityIncreasedCount > comparisons.length / 2) {
      severityChange = 'increased';
    }

    return {
      population: {
        absolute: avgPopulationDelta,
        relative: avgPopulationDelta,
        direction: avgPopulationDelta > 5 ? ('increase' as const) : avgPopulationDelta < -5 ? ('decrease' as const) : ('neutral' as const),
      },
      infrastructure: {
        absolute: avgInfrastructureDelta,
        relative: avgInfrastructureDelta,
        direction: avgInfrastructureDelta > 5 ? ('increase' as const) : avgInfrastructureDelta < -5 ? ('decrease' as const) : ('neutral' as const),
      },
      agBuilding: {
        absolute: avgAgBuildingDelta,
        relative: avgAgBuildingDelta,
        direction: avgAgBuildingDelta > 5 ? ('increase' as const) : avgAgBuildingDelta < -5 ? ('decrease' as const) : ('neutral' as const),
      },
      severityChange,
    };
  }, [comparisons]);

  return calculateAggregates();
}