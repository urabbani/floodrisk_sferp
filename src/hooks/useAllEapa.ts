/**
 * React hook for fetching all EAPA combinations (2 climates × 3 maintenance levels)
 *
 * Returns a comparison dataset for displaying EAPA across all scenarios.
 */

import { useState, useEffect } from 'react';
import type { EapaResult } from '@/types/risk';

interface AllEapaResult {
  data: EapaResult[] | null;
  loading: boolean;
  error: string | null;
}

const CLIMATES: ('present' | 'future')[] = ['present', 'future'];
const MAINTENANCE_LEVELS: ('breaches' | 'perfect' | 'redcapacity')[] = ['breaches', 'perfect', 'redcapacity'];

/**
 * Hook for fetching all EAPA combinations
 *
 * Fetches 6 scenarios (2 climates × 3 maintenance levels) for comparison.
 *
 * @returns Array of 6 EapaResult objects
 */
export function useAllEapa(): AllEapaResult {
  const [data, setData] = useState<EapaResult[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setError(null);

      try {
        const results: EapaResult[] = [];

        for (const climate of CLIMATES) {
          for (const maintenance of MAINTENANCE_LEVELS) {
            const params = new URLSearchParams({
              climate,
              maintenance,
              returnPeriod: 'all',
            });

            const response = await fetch(`/api/population-risk?${params.toString()}`);
            const result = await response.json();

            if (!result.success) {
              throw new Error(result.error || 'Failed to fetch population risk data');
            }

            const scenarios = result.data.scenarios;
            if (!scenarios || scenarios.length === 0) continue;

            // Sort by return period and extract population
            const sortedScenarios = scenarios.sort(
              (a: any, b: any) => parseFloat(a.returnPeriod) - parseFloat(b.returnPeriod)
            );

            const populationByRP = sortedScenarios.map((s: any) => ({
              returnPeriod: parseFloat(s.returnPeriod),
              population: s.totalAffectedPopulation,
            }));

            // Calculate EAPA using trapezoidal integration
            let eapa = 0;
            for (let i = 0; i < populationByRP.length - 1; i++) {
              const freqLeft = 1 / populationByRP[i].returnPeriod;
              const freqRight = 1 / populationByRP[i + 1].returnPeriod;
              eapa += 0.5 * (populationByRP[i].population + populationByRP[i + 1].population)
                    * Math.abs(freqLeft - freqRight);
            }

            results.push({
              climate,
              maintenance,
              region: 'TOTAL',
              eapa: Math.round(eapa),
            });
          }
        }

        setData(results);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('Error fetching all EAPA:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, []);

  return { data, loading, error };
}

export default useAllEapa;
