import { useMemo } from 'react';
import { useImpactData } from './useImpactData';
import { RETURN_PERIODS, MAINTENANCE_LEVELS } from '@/types/risk';
import type { ScenarioImpactSummary } from '@/types/impact';

type Climate = 'present' | 'future';
type Maintenance = 'breaches' | 'redcapacity' | 'perfect';

export interface ImpactDataPoint {
  returnPeriod: number;
  croppedArea: number;
  builtUpArea: number;
}

export interface ImpactSeries {
  label: string;
  data: ImpactDataPoint[];
  color: string;
}

export interface ImpactCurveOptions {
  climate?: Climate;
  maintenance?: Maintenance;
}

const COLORS = {
  cropped: '#22c55e',  // green for crops
  builtup: '#3b82f6',  // blue for built-up
  present: '#3b82f6',
  future: '#f59e0b',
};

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
  const { data: presentData, isLoading: presentLoading, error: presentError } = useImpactData({ climate: 'present' });
  const { data: futureData, isLoading: futureLoading, error: futureError } = useImpactData({ climate: 'future' });

  const isLoading = presentLoading || futureLoading;
  const error = presentError || futureError;

  const curveData = useMemo(() => {
    if (!presentData || !futureData) return null;

    const { climate = 'present', maintenance = 'breaches' } = options;
    const climateData = climate === 'present' ? presentData : futureData;

    // Build data points for each return period
    const dataPoints: ImpactDataPoint[] = RETURN_PERIODS.map((rp) => {
      const scenario = climateData.summaries.find(
        (s) => s.returnPeriod === String(rp) && s.maintenance === maintenance
      );
      return {
        returnPeriod: rp,
        croppedArea: getAffectedArea(scenario, 'Cropped_Area'),
        builtUpArea: getAffectedArea(scenario, 'Built_up_Area'),
      };
    });

    return { dataPoints };
  }, [presentData, futureData, options]);

  return { curveData, isLoading, error };
}
