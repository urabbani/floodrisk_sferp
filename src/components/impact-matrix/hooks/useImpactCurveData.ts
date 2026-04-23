import { useMemo } from 'react';
import { useImpactData } from './useImpactData';
import { RETURN_PERIODS, MAINTENANCE_LEVELS } from '@/types/risk';
import type { ScenarioImpactSummary } from '@/types/impact';

type Climate = 'present' | 'future';
type Maintenance = 'breaches' | 'redcapacity' | 'perfect';

export type ImpactSeriesType =
  | 'climate'      // Compare Present vs Future
  | 'maintenance'  // Compare maintenance levels
  | 'district';    // Compare districts (not available for Impact)

export type ImpactRegion = 'TOTAL';

export type ImpactLayerType = 'Cropped_Area' | 'Built_up_Area';

export interface ImpactDataPoint {
  returnPeriod: number;
  value: number;
}

export interface ImpactSeries {
  label: string;
  data: ImpactDataPoint[];
  color: string;
}

export interface ImpactCurveOptions {
  climate?: Climate;
  maintenance?: Maintenance;
  region?: ImpactRegion;
  seriesBy: ImpactSeriesType;
  layerType: ImpactLayerType;
  includeTotal?: boolean;
}

const COLORS = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

/**
 * Extract affected area (in square meters) from scenario impact data
 */
function getAffectedArea(
  scenario: ScenarioImpactSummary | undefined,
  layerType: ImpactLayerType
): number {
  if (!scenario) return 0;

  const impact = scenario.impacts?.[layerType];
  if (!impact) return 0;

  // For polygon layers (Cropped_Area, Built_up_Area), the affectedFeatures is affected area in sq meters
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

    const {
      climate = 'present',
      maintenance = 'breaches',
      region = 'TOTAL',
      seriesBy,
      layerType,
    } = options;

    let series: ImpactSeries[] = [];

    switch (seriesBy) {
      case 'climate': {
        // Compare Present vs Future
        const climates: Climate[] = ['present', 'future'];
        series = climates.map((clim, idx) => {
          const climateData = clim === 'present' ? presentData : futureData;
          return {
            label: clim === 'present' ? 'Present Climate' : 'Future Climate',
            data: RETURN_PERIODS.map((rp) => {
              const scenario = climateData.summaries.find(
                (s) => s.returnPeriod === String(rp) && s.maintenance === maintenance
              );
              return {
                returnPeriod: rp,
                value: getAffectedArea(scenario, layerType),
              };
            }),
            color: COLORS[idx],
          };
        });
        break;
      }

      case 'maintenance': {
        // Compare maintenance levels
        const allMaintenances: Maintenance[] = MAINTENANCE_LEVELS;
        const maintLabels: Record<Maintenance, string> = {
          breaches: 'Breaches',
          redcapacity: 'Reduced Capacity',
          perfect: 'Perfect Maintenance',
        };

        const climateData = climate === 'present' ? presentData : futureData;

        series = allMaintenances.map((maint, idx) => ({
          label: maintLabels[maint],
          data: RETURN_PERIODS.map((rp) => {
            const scenario = climateData.summaries.find(
              (s) => s.returnPeriod === String(rp) && s.maintenance === maint
            );
            return {
              returnPeriod: rp,
              value: getAffectedArea(scenario, layerType),
            };
          }),
          color: COLORS[idx],
        }));
        break;
      }

      case 'district': {
        // District comparison is not available for Impact data
        // The Impact API only returns TOTAL data, not per-district
        const climateData = climate === 'present' ? presentData : futureData;
        series = [
          {
            label: 'TOTAL',
            data: RETURN_PERIODS.map((rp) => {
              const scenario = climateData.summaries.find(
                (s) => s.returnPeriod === String(rp) && s.maintenance === maintenance
              );
              return {
                returnPeriod: rp,
                value: getAffectedArea(scenario, layerType),
              };
            }),
            color: COLORS[0],
          },
        ];
        break;
      }
    }

    return { series, maxValues: calculateMaxValues(series) };
  }, [presentData, futureData, options]);

  return { curveData, isLoading, error };
}

function calculateMaxValues(series: ImpactSeries[]): Record<string, number> {
  const maxValues: Record<string, number> = {};
  for (const s of series) {
    const max = Math.max(...s.data.map((d) => d.value));
    maxValues[s.label] = max;
  }
  return maxValues;
}
