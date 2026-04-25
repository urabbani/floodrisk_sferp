import { useMemo } from 'react';
import { useRiskData } from './useRiskData';
import {
  RETURN_PERIODS,
  MAINTENANCE_LEVELS,
  DISTRICTS,
  ASSET_SUB_KEYS,
  buildScenarioKey,
  totalRiskValue,
  ASSET_SUB_KEY_LABELS,
  RISK_ASSET_COLORS,
  type RiskJsonData,
  type RiskMode,
  type AssetSubKey,
} from '@/types/risk';

export type CurveSeriesType =
  | 'climate'      // Compare Present vs Future
  | 'district'     // Compare districts
  | 'asset';       // Compare all 11 assets

export type CurveRegion = 'TOTAL' | typeof DISTRICTS[number];

export type CurveDataPoint = {
  returnPeriod: number;
  value: number;
};

export type CurveSeries = {
  label: string;
  data: CurveDataPoint[];
  color: string;
};

export type RiskCurveOptions = {
  climate?: 'present' | 'future';
  maintenance?: 'breaches' | 'redcapacity' | 'perfect';
  region?: CurveRegion;
  mode: RiskMode;
  seriesBy: CurveSeriesType;
  includeTotal?: boolean;
  selectedAssets?: AssetSubKey[];
};

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

export function useRiskCurveData(options: RiskCurveOptions) {
  const { data, isLoading, error } = useRiskData();

  const curveData = useMemo(() => {
    if (!data) return null;

    const {
      climate = 'present',
      maintenance = 'breaches',
      region = 'TOTAL',
      mode,
      seriesBy,
      includeTotal = true,
      selectedAssets = ASSET_SUB_KEYS,
    } = options;

    const getSeriesValue = (
      rp: number,
      clim: 'present' | 'future',
      maint: 'breaches' | 'redcapacity' | 'perfect',
      reg: CurveRegion
    ): number => {
      const key = buildScenarioKey(rp, clim, maint);
      const regionData = data.data[key]?.[reg]?.[mode];
      if (!regionData) return 0;

      // Filter by selected assets
      if (selectedAssets.length === ASSET_SUB_KEYS.length) {
        return totalRiskValue(regionData);
      }

      return selectedAssets.reduce((sum, asset) => sum + (regionData[asset] || 0), 0);
    };

    let series: CurveSeries[] = [];

    switch (seriesBy) {
      case 'climate': {
        // Compare Present vs Future
        const climates: ('present' | 'future')[] = ['present', 'future'];
        series = climates.map((clim, idx) => ({
          label: clim === 'present' ? 'Present Climate' : 'Future Climate',
          data: RETURN_PERIODS.map((rp) => ({
            returnPeriod: rp,
            value: getSeriesValue(rp, clim, maintenance, region),
          })),
          color: COLORS[idx],
        }));
        break;
      }

      case 'district': {
        // Compare districts (optionally with TOTAL)
        const regions = includeTotal ? (['TOTAL', ...DISTRICTS] as const) : DISTRICTS;
        series = regions.map((reg, idx) => ({
          label: reg,
          data: RETURN_PERIODS.map((rp) => ({
            returnPeriod: rp,
            value: getSeriesValue(rp, climate, maintenance, reg),
          })),
          color: idx < COLORS.length ? COLORS[idx] : COLORS[idx % COLORS.length],
        }));
        break;
      }

      case 'asset': {
        // Compare all 11 asset types
        series = selectedAssets.map((asset, idx) => ({
          label: ASSET_SUB_KEY_LABELS[asset],
          data: RETURN_PERIODS.map((rp) => {
            const key = buildScenarioKey(rp, climate, maintenance);
            const regionData = data.data[key]?.[region]?.[mode];
            return {
              returnPeriod: rp,
              value: regionData?.[asset] || 0,
            };
          }),
          color: RISK_ASSET_COLORS[asset],
        }));
        break;
      }
    }

    return { series, maxValues: calculateMaxValues(series) };
  }, [data, options]);

  return { curveData, isLoading, error };
}

function calculateMaxValues(series: CurveSeries[]): Record<string, number> {
  const maxValues: Record<string, number> = {};
  for (const s of series) {
    const max = Math.max(...s.data.map((d) => d.value));
    maxValues[s.label] = max;
  }
  return maxValues;
}
