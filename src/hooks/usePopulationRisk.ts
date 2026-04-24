/**
 * React hook for fetching population risk (casualty estimation) data
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  PopulationRiskResponse,
  PopulationRiskScenario,
  PopulationRiskQuery,
} from '@/types/casualty';

const API_BASE = '/api/population-risk';

interface UsePopulationRiskResult {
  data: PopulationRiskScenario[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching population risk data
 *
 * @param query - Query parameters for the API
 * @returns Population risk data, loading state, error, and refetch function
 */
export function usePopulationRisk(
  query: PopulationRiskQuery
): UsePopulationRiskResult {
  const [data, setData] = useState<PopulationRiskScenario[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('climate', query.climate);
      if (query.maintenance && query.maintenance !== 'all') {
        params.append('maintenance', query.maintenance);
      }
      if (query.returnPeriod && query.returnPeriod !== 'all') {
        params.append('returnPeriod', query.returnPeriod);
      }

      const response = await fetch(`${API_BASE}?${params.toString()}`);
      const result: PopulationRiskResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch population risk data');
      }

      setData(result.data.scenarios);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Error fetching population risk:', err);
    } finally {
      setLoading(false);
    }
  }, [query.climate, query.maintenance, query.returnPeriod]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

/**
 * Hook for fetching population risk data for a single scenario
 */
export function useScenarioPopulationRisk(
  climate: 'present' | 'future',
  returnPeriod: string,
  maintenance: string
): UsePopulationRiskResult {
  const query: PopulationRiskQuery = {
    climate,
    returnPeriod: returnPeriod as any,
    maintenance: maintenance as any,
  };

  return usePopulationRisk(query);
}

export default usePopulationRisk;
