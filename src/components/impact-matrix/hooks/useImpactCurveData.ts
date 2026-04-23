import { useMemo } from 'react';
import { useImpactData } from './useImpactData';
import { RETURN_PERIODS } from '@/types/risk';
import type { ScenarioImpactSummary } from '@/types/impact';

type Climate = 'present' | 'future';
type Maintenance = 'breaches' | 'redcapacity' | 'perfect';

export interface ImpactDataPoint {
  returnPeriod: number;
  croppedArea: number;
  builtUpArea: number;
}

export interface ImpactCurveOptions {
  climate?: Climate;
  maintenance?: Maintenance;
}

/**
 * Extract affected area (in square meters) from scenario impact data
 */
function getAffectedArea(
  scenario: ScenarioImpactSummary | undefined,
  layerType: 'Cropped_Area' | 'Built_up_Area'
): number {
  if (!scenario) return 0;
  const impact = scenario.impacts?.[layerType];
  if (!impact) return 0;
  return impact.affectedFeatures || 0;
}

/**
 * Hook to fetch and process Impact curve data
 */
export function useImpactCurveData(options: ImpactCurveOptions) {
  const { climate = 'present', maintenance = 'breaches' } = options;

  // Only fetch data for the selected climate
  const { data, isLoading, error } = useImpactData({ climate });

  const curveData = useMemo(() => {
    if (!data?.summaries) return null;

    // Build data points for each return period
    const dataPoints: ImpactDataPoint[] = RETURN_PERIODS.map((rp) => {
      const scenario = data.summaries.find(
        (s) => s.returnPeriod === String(rp) && s.maintenance === maintenance
      );
      return {
        returnPeriod: rp,
        croppedArea: getAffectedArea(scenario, 'Cropped_Area'),
        builtUpArea: getAffectedArea(scenario, 'Built_up_Area'),
      };
    });

    return { dataPoints };
  }, [data, climate, maintenance]);

  return { curveData, isLoading, error };
}
