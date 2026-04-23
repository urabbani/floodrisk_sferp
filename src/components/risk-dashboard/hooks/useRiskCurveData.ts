import { useMemo } from 'react';
import { useRiskData } from './useRiskData';
import {
  RETURN_PERIODS,
  MAINTENANCE_LEVELS,
  DISTRICTS,
  ASSET_SUB_KEYS,
  buildScenarioKey,
  totalRiskValue,
  type RiskJsonData,
  type RiskMode,
  type AssetSubKey,
} from '@/types/risk';

export type CurveSeriesType =
  | 'climate'      // Compare Present vs Future
  | 'district'     // Compare districts
  | 'asset';       // Compare Agriculture vs Buildings

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
        // Compare asset types (Agriculture + 3 building types)
        const assetLabels: Record<AssetSubKey, string> = {
          crop: 'Agriculture',
          buildLow56: 'Kacha',
          buildLow44: 'Pakka',
          buildHigh: 'High-Rise',
        };
        const assetColors: Record<AssetSubKey, string> = {
          crop: '#22c55e',
          buildLow56: '#93c5fd',
          buildLow44: '#3b82f6',
          buildHigh: '#1e3a8a',
        };

        series = selectedAssets.map((asset, idx) => ({
          label: assetLabels[asset],
          data: RETURN_PERIODS.map((rp) => {
            const key = buildScenarioKey(rp, climate, maintenance);
            const regionData = data.data[key]?.[region]?.[mode];
            return {
              returnPeriod: rp,
              value: regionData?.[asset] || 0,
            };
          }),
          color: assetColors[asset],
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
