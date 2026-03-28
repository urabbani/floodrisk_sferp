/**
 * useAnnotations Hook
 *
 * Provides CRUD operations for annotations with the backend API.
 * Caches annotations in memory to reduce API calls.
 */

import { useState, useCallback, useEffect } from 'react';
import type { Annotation, NewAnnotation, UpdateAnnotation, AnnotationsListResponse } from '@/types/annotations';

const DEFAULT_API_URL = '/api/annotations';

interface UseAnnotationsOptions {
  apiUrl?: string;
  enabled?: boolean;
}

interface UseAnnotationsReturn {
  annotations: Annotation[];
  isLoading: boolean;
  error: string | null;
  fetchAnnotations: () => Promise<void>;
  createAnnotation: (annotation: NewAnnotation) => Promise<Annotation>;
  updateAnnotation: (id: number, updates: UpdateAnnotation) => Promise<Annotation>;
  deleteAnnotation: (id: number) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useAnnotations({
  apiUrl = DEFAULT_API_URL,
  enabled = true,
}: UseAnnotationsOptions = {}): UseAnnotationsReturn {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all annotations from the API
   */
  const fetchAnnotations = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(apiUrl);
      const result: AnnotationsListResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch annotations');
      }

      setAnnotations(result.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Error fetching annotations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, enabled]);

  /**
   * Create a new annotation
   */
  const createAnnotation = useCallback(async (newAnnotation: NewAnnotation): Promise<Annotation> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAnnotation),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create annotation');
      }

      const created: Annotation = result.data;

      // Update local state
      setAnnotations((prev) => [...prev, created]);

      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Error creating annotation:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl]);

  /**
   * Update an existing annotation
   */
  const updateAnnotation = useCallback(async (id: number, updates: UpdateAnnotation): Promise<Annotation> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update annotation');
      }

      const updated: Annotation = result.data;

      // Update local state
      setAnnotations((prev) =>
        prev.map((a) => (a.id === id ? updated : a))
      );

      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Error updating annotation:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl]);

  /**
   * Delete an annotation
   */
  const deleteAnnotation = useCallback(async (id: number): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete annotation');
      }

      // Update local state
      setAnnotations((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Error deleting annotation:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl]);

  /**
   * Refetch annotations (alias for fetchAnnotations)
   */
  const refetch = fetchAnnotations;

  // Load annotations on mount
  useEffect(() => {
    fetchAnnotations();
  }, [fetchAnnotations]);

  return {
    annotations,
    isLoading,
    error,
    fetchAnnotations,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    refetch,
  };
}
