import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  ImpactMatrixData,
  ImpactSummaryQuery,
  ScenarioImpactSummary,
} from '@/types/impact';

interface UseImpactDataOptions {
  enabled?: boolean;
  refetchInterval?: number; // ms
}

interface UseImpactDataResult {
  data: ImpactMatrixData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const API_BASE_URL = '/api/impact';

/**
 * Custom hook for fetching impact summary data from the API
 *
 * @param query - Query parameters for filtering impact data
 * @param options - Additional options (enabled, refetchInterval)
 * @returns Impact data, loading state, error, and refetch function
 */
export function useImpactData(
  query: ImpactSummaryQuery,
  options: UseImpactDataOptions = {}
): UseImpactDataResult {
  const { enabled = true, refetchInterval } = options;

  const [data, setData] = useState<ImpactMatrixData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track the last query to prevent unnecessary refetches
  const lastQueryRef = useRef<string>(JSON.stringify(query));

  /**
   * Fetch impact data from the API
   */
  const fetchData = useCallback(async () => {
    const queryString = JSON.stringify(query);
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        climate: query.climate,
        ...(query.maintenance && query.maintenance !== 'all' && { maintenance: query.maintenance }),
        ...(query.returnPeriod && { returnPeriod: query.returnPeriod }),
      });

      const response = await fetch(`${API_BASE_URL}/summary?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Unknown error');
      }

      setData(result.data);
      lastQueryRef.current = queryString;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch impact data';
      setError(errorMessage);
      console.error('Error fetching impact data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [query, enabled]);

  /**
   * Refetch data (useful for manual refresh or after updates)
   */
  const refetch = useCallback(async () => {
    lastQueryRef.current = ''; // Force refetch
    await fetchData();
  }, [fetchData]);

  // Fetch data on mount and when query changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up automatic refetch if interval is specified
  useEffect(() => {
    if (!refetchInterval) return;

    const intervalId = setInterval(() => {
      refetch();
    }, refetchInterval);

    return () => clearInterval(intervalId);
  }, [refetchInterval, refetch]);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Custom hook for fetching scenario-specific impact data
 * Returns a map keyed by scenarioId for easy lookup
 */
export function useImpactDataMap(
  query: ImpactSummaryQuery,
  options: UseImpactDataOptions = {}
): {
  dataMap: Map<string, ScenarioImpactSummary>;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const { data, isLoading, error, refetch } = useImpactData(query, options);

  // Use useRef to store the map to avoid re-renders
  const dataMapRef = useRef<Map<string, ScenarioImpactSummary>>(new Map());

  // Update the map when data changes
  useEffect(() => {
    if (data?.summaries) {
      const newMap = new Map<string, ScenarioImpactSummary>();
      data.summaries.forEach((summary) => {
        newMap.set(summary.scenarioId, summary);
      });
      dataMapRef.current = newMap;
    }
  }, [data]);

  return {
    dataMap: dataMapRef.current,
    isLoading,
    error,
    refetch,
  };
}
