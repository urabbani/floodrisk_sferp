/**
 * Compare View Component
 *
 * Main container for comparison modes
 * Currently supports Climate Comparison (Present vs Future)
 *
 * Follows ui-skills guidelines:
 * - h-dvh for full-height containers
 * - Respect safe-area-inset for fixed elements
 * - Accessible Radix Tabs for navigation
 * - Focus trap for modal/overlay states
 * - Show errors next to where action happens
 */

import { useCompareData } from '../hooks/useCompareData';
import { ClimateComparisonView } from './ClimateComparisonView';
import { ComparisonSkeleton } from './components/ComparisonSkeleton';
import { ComparisonErrorState } from './components/ComparisonErrorState';
import type { ScenarioImpactSummary } from '@/types/impact';
import { cn } from '@/lib/utils';

interface CompareViewProps {
  /**
   * Callback when a scenario is selected for detailed view
   */
  onScenarioSelect?: (scenario: ScenarioImpactSummary) => void;

  /**
   * Additional class names
   */
  className?: string;
}

/**
 * Compare View Component
 */
export function CompareView({ onScenarioSelect, className }: CompareViewProps) {
  // Fetch comparison data (Present vs Future)
  const { data, isLoading, error, refetch } = useCompareData('climate');

  return (
    <div className={cn('flex flex-col h-full bg-white', className)}>
      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        {/* Loading State */}
        {isLoading && <ComparisonSkeleton />}

        {/* Error State */}
        {error && !isLoading && <ComparisonErrorState error={error} onRetry={refetch} />}

        {/* Climate Comparison View */}
        {!isLoading && !error && data && (
          <ClimateComparisonView
            data={data}
            onScenarioSelect={onScenarioSelect}
          />
        )}
      </div>
    </div>
  );
}
