import { useMemo } from 'react';
import { useRiskData } from './useRiskData';
import {
  RETURN_PERIODS,
  MAINTENANCE_LEVELS,
  DISTRICTS,
  ASSET_SUB_KEYS,
  buildScenarioKey,
  calculateEad,
  type EadResult,
  type AssetSubKey,
} from '@/types/risk';

export function useEadData() {
  const { data, isLoading, error } = useRiskData();

  const eadResults = useMemo(() => {
    if (!data) return null;

    const results: EadResult[] = [];

    for (const climate of ['present', 'future'] as const) {
      for (const maintenance of MAINTENANCE_LEVELS) {
        // First, compute EAD for each district
        const districtResults: EadResult[] = [];

        for (const region of DISTRICTS) {
          // Initialize damages array for each of the 11 assets
          const damagesByAsset = Object.fromEntries(
            ASSET_SUB_KEYS.map(asset => [asset, [] as { returnPeriod: number; damage: number }[]])
          ) as Record<AssetSubKey, { returnPeriod: number; damage: number }[]>;

          for (const rp of RETURN_PERIODS) {
            const key = buildScenarioKey(rp, climate, maintenance);
            const regionData = data.data[key]?.[region]?.['Dmg'];
            if (!regionData) continue;

            for (const asset of ASSET_SUB_KEYS) {
              damagesByAsset[asset].push({ returnPeriod: rp, damage: regionData[asset] ?? 0 });
            }
          }

          // Calculate EAD for each asset
          const ead = Object.fromEntries(
            ASSET_SUB_KEYS.map(asset => [asset, calculateEad(damagesByAsset[asset])])
          ) as Record<AssetSubKey, number>;

          const eadTotal = Object.values(ead).reduce((sum, val) => sum + val, 0);

          const result: EadResult = {
            climate,
            maintenance,
            region,
            ead,
            eadTotal,
          };
          districtResults.push(result);
          results.push(result);
        }

        // Calculate TOTAL as sum of 7 districts
        const totalEad = Object.fromEntries(
          ASSET_SUB_KEYS.map(asset => [asset, 0])
        ) as Record<AssetSubKey, number>;

        for (const districtResult of districtResults) {
          for (const asset of ASSET_SUB_KEYS) {
            totalEad[asset] += districtResult.ead[asset];
          }
        }

        const totalSum = Object.values(totalEad).reduce((sum, val) => sum + val, 0);

        results.push({
          climate,
          maintenance,
          region: 'TOTAL',
          ead: totalEad,
          eadTotal: totalSum,
        });
      }
    }

    return results;
  }, [data]);

  return { eadResults, isLoading, error };
}
