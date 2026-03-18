/**
 * Comparison Skeleton Component
 *
 * Structural skeleton shown during data fetch
 *
 * Follows ui-skills guidelines:
 * - Structural skeleton (matches final layout)
 * - Pulse animation on opacity only (no layout thrashing)
 * - Max 200ms duration
 * - aria-busy="true" and aria-live="polite"
 */

export function ComparisonSkeleton() {
  return (
    <div
      className="p-4 space-y-4"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading comparison data"
    >
      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={`card-${i}`}
            className="h-24 bg-slate-100 rounded-lg animate-pulse"
            style={{ animationDuration: '200ms' }}
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Heatmap Grids Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Present Grid Skeleton */}
        <div className="space-y-3" aria-hidden="true">
          <div className="h-6 bg-slate-100 rounded w-32 animate-pulse" style={{ animationDuration: '200ms' }} />
          <div className="space-y-2">
            {/* Header row */}
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-1" />
              <div className="h-8 bg-slate-50 rounded animate-pulse" style={{ animationDuration: '200ms' }} />
              <div className="h-8 bg-slate-50 rounded animate-pulse" style={{ animationDuration: '200ms' }} />
              <div className="h-8 bg-slate-50 rounded animate-pulse" style={{ animationDuration: '200ms' }} />
            </div>
            {/* Data rows */}
            {[...Array(7)].map((_, i) => (
              <div key={`present-row-${i}`} className="grid grid-cols-4 gap-2">
                <div className="h-14 bg-slate-50 rounded animate-pulse" style={{ animationDuration: '200ms' }} />
                <div className="h-14 bg-slate-50 rounded animate-pulse" style={{ animationDuration: '200ms' }} />
                <div className="h-14 bg-slate-50 rounded animate-pulse" style={{ animationDuration: '200ms' }} />
                <div className="h-14 bg-slate-50 rounded animate-pulse" style={{ animationDuration: '200ms' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Future Grid Skeleton */}
        <div className="space-y-3" aria-hidden="true">
          <div className="h-6 bg-slate-100 rounded w-32 animate-pulse" style={{ animationDuration: '200ms' }} />
          <div className="space-y-2">
            {/* Header row */}
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-1" />
              <div className="h-8 bg-slate-50 rounded animate-pulse" style={{ animationDuration: '200ms' }} />
              <div className="h-8 bg-slate-50 rounded animate-pulse" style={{ animationDuration: '200ms' }} />
              <div className="h-8 bg-slate-50 rounded animate-pulse" style={{ animationDuration: '200ms' }} />
            </div>
            {/* Data rows */}
            {[...Array(7)].map((_, i) => (
              <div key={`future-row-${i}`} className="grid grid-cols-4 gap-2">
                <div className="h-14 bg-slate-50 rounded animate-pulse" style={{ animationDuration: '200ms' }} />
                <div className="h-14 bg-slate-50 rounded animate-pulse" style={{ animationDuration: '200ms' }} />
                <div className="h-14 bg-slate-50 rounded animate-pulse" style={{ animationDuration: '200ms' }} />
                <div className="h-14 bg-slate-50 rounded animate-pulse" style={{ animationDuration: '200ms' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
