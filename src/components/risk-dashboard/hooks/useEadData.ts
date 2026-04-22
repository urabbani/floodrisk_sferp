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
          const damagesByAsset: Record<AssetSubKey, { returnPeriod: number; damage: number }[]> = {
            crop: [],
            buildLow56: [],
            buildLow44: [],
            buildHigh: [],
          };

          for (const rp of RETURN_PERIODS) {
            const key = buildScenarioKey(rp, climate, maintenance);
            const regionData = data.data[key]?.[region]?.['Dmg'];
            if (!regionData) continue;

            for (const asset of ASSET_SUB_KEYS) {
              damagesByAsset[asset].push({ returnPeriod: rp, damage: regionData[asset] });
            }
          }

          const ead: Record<AssetSubKey, number> = {
            crop: calculateEad(damagesByAsset.crop),
            buildLow56: calculateEad(damagesByAsset.buildLow56),
            buildLow44: calculateEad(damagesByAsset.buildLow44),
            buildHigh: calculateEad(damagesByAsset.buildHigh),
          };

          const result: EadResult = {
            climate,
            maintenance,
            region,
            ead,
            eadTotal: ead.crop + ead.buildLow56 + ead.buildLow44 + ead.buildHigh,
          };
          districtResults.push(result);
          results.push(result);
        }

        // Calculate TOTAL as sum of 7 districts
        const totalEad: Record<AssetSubKey, number> = {
          crop: 0,
          buildLow56: 0,
          buildLow44: 0,
          buildHigh: 0,
        };

        for (const districtResult of districtResults) {
          for (const asset of ASSET_SUB_KEYS) {
            totalEad[asset] += districtResult.ead[asset];
          }
        }

        results.push({
          climate,
          maintenance,
          region: 'TOTAL',
          ead: totalEad,
          eadTotal: totalEad.crop + totalEad.buildLow56 + totalEad.buildLow44 + totalEad.buildHigh,
        });
      }
    }

    return results;
  }, [data]);

  return { eadResults, isLoading, error };
}
