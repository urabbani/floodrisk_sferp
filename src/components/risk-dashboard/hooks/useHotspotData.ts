/**
 * Hook for computing flood risk hotspot scores
 *
 * Combines EAD (physical risk), population risk (fatalities),
 * and socioeconomic vulnerability into composite hotspot scores.
 */

import { useMemo, useState } from 'react';
import { useEadData } from './useEadData';
import { useSocioeconomicData } from '@/hooks/useSocioeconomicData';
import usePopulationRisk from '@/hooks/usePopulationRisk';
import { calculateVulnerabilityIndicesWithPoverty } from '@/lib/vulnerability';
import { computeHotspotScores } from '@/lib/hotspot';
import type { HotspotWeights, HotspotDistrictResult } from '@/types/socioeconomic';
import { DEFAULT_HOTSPOT_WEIGHTS } from '@/types/socioeconomic';

interface UseHotspotDataResult {
  hotspotResults: HotspotDistrictResult[] | null;
  isLoading: boolean;
  error: string | null;
  returnPeriod: string;
  maintenance: string;
  setReturnPeriod: (rp: string) => void;
  setMaintenance: (m: string) => void;
  weights: HotspotWeights;
  setWeights: (w: HotspotWeights) => void;
}

/**
 * Hook for computing hotspot scores
 *
 * @param climate - 'present' or 'future' climate scenario
 * @returns Hotspot results, loading state, and control functions
 */
export function useHotspotData(
  climate: 'present' | 'future'
): UseHotspotDataResult {
  const [returnPeriod, setReturnPeriod] = useState('25');
  const [maintenance, setMaintenance] = useState('breaches');
  const [weights, setWeights] = useState<HotspotWeights>(DEFAULT_HOTSPOT_WEIGHTS);

  // Load all three data sources
  const { eadResults, isLoading: eadLoading, error: eadError } = useEadData();
  const { data: socioeconomicData, loading: socioLoading, error: socioError } = useSocioeconomicData();
  const { data: popScenarios, loading: popLoading, error: popError } = usePopulationRisk({
    climate,
    maintenance: maintenance as any,
    returnPeriod: returnPeriod as any,
  });

  // Compute hotspot scores when all data is available
  const hotspotResults = useMemo(() => {
    if (!eadResults || !socioeconomicData || !popScenarios?.[0]) return null;

    // Build fatality map from population risk scenario
    const scenario = popScenarios[0];
    const fatalityMap: Record<string, number> = {};
    scenario.districtBreakdown.forEach((d) => {
      fatalityMap[d.district] = d.estimatedFatalities.moderate;
    });

    // Calculate vulnerability indices from census + poverty data
    const vulnerabilityIndices = calculateVulnerabilityIndicesWithPoverty(socioeconomicData);

    return computeHotspotScores({
      eadResults,
      fatalityMap,
      vulnerabilityIndices,
      climate,
      maintenance: maintenance as 'breaches' | 'redcapacity' | 'perfect',
      weights,
    });
  }, [eadResults, socioeconomicData, popScenarios, climate, maintenance, weights]);

  const isLoading = eadLoading || socioLoading || popLoading;
  const error = eadError || socioError || popError;

  return {
    hotspotResults,
    isLoading,
    error,
    returnPeriod,
    maintenance,
    setReturnPeriod,
    setMaintenance,
    weights,
    setWeights,
  };
}

export default useHotspotData;
