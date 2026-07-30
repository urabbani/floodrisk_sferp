import { useMemo } from 'react';
import { useRiskData } from './useRiskData';
import {
  RETURN_PERIODS,
  MAINTENANCE_LEVELS,
  DISTRICTS,
  ASSET_SUB_KEYS,
  ASSET_SECTOR_FACTOR,
  buildScenarioKey,
  calculateEad,
  type EalResult,
  type AssetSubKey,
} from '@/types/risk';

/**
 * Expected Annual Loss (EAL).
 *
 * Mirrors useEadData, but each asset's damage is scaled by its sector's
 * Loss/Damage factor BEFORE trapezoidal integration. Since the factor is
 * constant across return periods, EAL[asset] = factor × EAD[asset].
 *
 * TOTAL is computed dynamically as the sum of the 7 active districts.
 */
export function useEalData() {
  const { data, isLoading, error } = useRiskData();

  const ealResults = useMemo(() => {
    if (!data) return null;

    const results: EalResult[] = [];

    for (const climate of ['present', 'future'] as const) {
      for (const maintenance of MAINTENANCE_LEVELS) {
        // First, compute EAL for each district
        const districtResults: EalResult[] = [];

        for (const region of DISTRICTS) {
          // Loss series per asset across return periods
          const lossesByAsset = Object.fromEntries(
            ASSET_SUB_KEYS.map(asset => [asset, [] as { returnPeriod: number; damage: number }[]])
          ) as Record<AssetSubKey, { returnPeriod: number; damage: number }[]>;

          for (const rp of RETURN_PERIODS) {
            const key = buildScenarioKey(rp, climate, maintenance);
            const regionData = data.data[key]?.[region]?.['Dmg'];
            if (!regionData) continue;

            for (const asset of ASSET_SUB_KEYS) {
              const factor = ASSET_SECTOR_FACTOR[asset];
              lossesByAsset[asset].push({ returnPeriod: rp, damage: (regionData[asset] ?? 0) * factor });
            }
          }

          // Integrate loss per asset
          const eal = Object.fromEntries(
            ASSET_SUB_KEYS.map(asset => [asset, calculateEad(lossesByAsset[asset])])
          ) as Record<AssetSubKey, number>;

          const ealTotal = Object.values(eal).reduce((sum, val) => sum + val, 0);

          const result: EalResult = {
            climate,
            maintenance,
            region,
            eal,
            ealTotal,
          };
          districtResults.push(result);
          results.push(result);
        }

        // Calculate TOTAL as sum of 7 districts
        const totalEal = Object.fromEntries(
          ASSET_SUB_KEYS.map(asset => [asset, 0])
        ) as Record<AssetSubKey, number>;

        for (const districtResult of districtResults) {
          for (const asset of ASSET_SUB_KEYS) {
            totalEal[asset] += districtResult.eal[asset];
          }
        }

        const totalSum = Object.values(totalEal).reduce((sum, val) => sum + val, 0);

        results.push({
          climate,
          maintenance,
          region: 'TOTAL',
          eal: totalEal,
          ealTotal: totalSum,
        });
      }
    }

    return results;
  }, [data]);

  return { ealResults, isLoading, error };
}
