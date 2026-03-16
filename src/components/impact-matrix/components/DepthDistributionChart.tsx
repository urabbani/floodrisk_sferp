import { memo } from 'react';
import { cn } from '@/lib/utils';
import { DEPTH_BIN_COLORS, formatDepthBinLabel, type DepthBinRange } from '@/types/impact';

interface DepthDistributionChartProps {
  /**
   * Depth bin data to display
   */
  depthBins: Array<{
    range: DepthBinRange;
    count: number;
    percentage: number;
  }>;

  /**
   * Maximum count for scaling (calculated automatically if not provided)
   */
  maxCount?: number;

  /**
   * Show count labels on bars
   */
  showLabels?: boolean;

  /**
   * Orientation of the chart
   */
  orientation?: 'horizontal' | 'vertical';

  /**
   * Additional class names
   */
  className?: string;

  /**
   * Height of the chart in pixels (for horizontal orientation)
   */
  height?: number;
}

/**
 * DepthDistributionChart - Bar chart showing flood depth distribution
 *
 * Displays horizontal or vertical bars representing the count of features
 * in each depth bin category, with color coding and optional labels.
 */
export const DepthDistributionChart = memo<DepthDistributionChartProps>(function DepthDistributionChart({
  depthBins,
  maxCount,
  showLabels = true,
  orientation = 'horizontal',
  className,
  height = 120,
}) {
  // Calculate max count if not provided (exclude null counts for zonal layers)
  const validCounts = depthBins.map((b) => b.count).filter((c) => c !== null);
  const calculatedMax = maxCount || (validCounts.length > 0 ? Math.max(...validCounts, 1) : 1);

  // Total for percentage calculation (exclude null counts for zonal layers)
  const total = depthBins.reduce((sum, bin) => sum + (bin.count || 0), 0);

  // Check if this is a zonal layer (all counts are null)
  const isZonalLayer = depthBins.every((b) => b.count === null);

  if (total === 0 && !isZonalLayer) {
    return (
      <div
        className={cn('flex items-center justify-center text-xs text-slate-500', className)}
        style={{ minHeight: orientation === 'horizontal' ? height : 'auto' }}
      >
        No affected features
      </div>
    );
  }

  if (orientation === 'horizontal') {
    return (
      <div className={cn('space-y-1.5', className)} style={{ minHeight: height }}>
        {depthBins.map((bin) => {
          const barWidth = isZonalLayer ? bin.percentage : (calculatedMax > 0 ? (bin.count || 0) / calculatedMax * 100 : 0);
          const color = DEPTH_BIN_COLORS[bin.range];

          return (
            <div key={bin.range} className="flex items-center gap-2">
              {/* Range label */}
              <div className="w-20 text-[10px] text-slate-600 text-right flex-shrink-0">
                {formatDepthBinLabel(bin.range)}
              </div>

              {/* Bar */}
              <div className="flex-1 h-5 bg-slate-100 rounded-md overflow-hidden relative">
                <div
                  className="h-full rounded-md transition-all duration-300"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: color,
                  }}
                />
                {barWidth > 15 && showLabels && (
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-medium text-white mix-blend-multiply">
                    {isZonalLayer
                      ? `${bin.percentage.toFixed(1)}%`
                      : (bin.count > 0 ? bin.count : '')
                    }
                  </span>
                )}
              </div>

              {/* Percentage */}
              <div className="w-12 text-[10px] text-slate-600 flex-shrink-0">
                {bin.percentage > 0 ? `${bin.percentage.toFixed(1)}%` : '-'}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Vertical orientation
  return (
    <div className={cn('flex items-end gap-1', className)}>
      {depthBins.map((bin) => {
        const barHeight = isZonalLayer ? bin.percentage : (calculatedMax > 0 ? (bin.count || 0) / calculatedMax * 100 : 0);
        const color = DEPTH_BIN_COLORS[bin.range];
        const showCount = !isZonalLayer && showLabels && bin.count > 0;

        return (
          <div key={bin.range} className="flex-1 flex flex-col items-center gap-1">
            {/* Bar */}
            <div
              className="w-full rounded-t-md transition-all duration-300"
              style={{
                height: `${barHeight}%`,
                minHeight: barHeight > 0 ? '4px' : '0',
                backgroundColor: color,
              }}
            />

            {/* Count */}
            {showCount && barHeight > 15 && (
              <span className="text-[9px] font-medium text-slate-700">
                {bin.count}
              </span>
            )}

            {/* Range label */}
            <div className="text-[9px] text-slate-500 truncate w-full text-center" title={bin.range}>
              {formatDepthBinLabel(bin.range).replace('m', '')}
            </div>
          </div>
        );
      })}
    </div>
  );
});

DepthDistributionChart.displayName = 'DepthDistributionChart';
