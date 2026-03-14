import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { ScenarioImpactSummary, SeverityLevel } from '@/types/impact';

// Return period intensity levels for color gradient (lightest to darkest)
const RETURN_PERIOD_COLORS = {
  '2.3': { h: 0, s: 80, l: 90 },   // Lightest red
  '5': { h: 0, s: 82, l: 82 },
  '10': { h: 0, s: 84, l: 74 },
  '25': { h: 0, s: 86, l: 66 },
  '50': { h: 0, s: 88, l: 58 },
  '100': { h: 0, s: 90, l: 50 },
  '500': { h: 0, s: 95, l: 35 },   // Darkest red
};

interface ImpactCellProps {
  /**
   * Scenario summary data
   */
  scenario: ScenarioImpactSummary;

  /**
   * Whether the cell is currently selected
   */
  isSelected?: boolean;

  /**
   * Whether the cell is being hovered
   */
  isHovered?: boolean;

  /**
   * Click handler
   */
  onClick?: (scenario: ScenarioImpactSummary) => void;

  /**
   * Hover enter handler
   */
  onHoverEnter?: (scenario: ScenarioImpactSummary) => void;

  /**
   * Hover leave handler
   */
  onHoverLeave?: () => void;

  /**
   * Additional class names
   */
  className?: string;

  /**
   * Display mode
   */
  mode?: 'compact' | 'detailed';
}

/**
 * ImpactCell - Displays a single scenario cell with severity-based coloring
 *
 * The cell shows:
 * - Number of affected exposure types (out of 9)
 * - Background color based on severity level
 * - Interactive hover and click states
 */
export const ImpactCell = memo<ImpactCellProps>(function ImpactCell({
  scenario,
  isSelected = false,
  isHovered = false,
  onClick,
  onHoverEnter,
  onHoverLeave,
  className,
  mode = 'compact',
}) {
  const { totalAffectedExposures, severity, returnPeriod, maintenance } = scenario;

  // Get background color based on return period intensity
  const getBackgroundColor = () => {
    if (isSelected) return 'rgb(37, 99, 235)'; // blue-600
    if (isHovered) return 'rgb(59, 130, 246)'; // blue-500
    // Use return period-based color gradient
    const colors = RETURN_PERIOD_COLORS[returnPeriod as keyof typeof RETURN_PERIOD_COLORS];
    if (colors) {
      return `hsl(${colors.h}, ${colors.s}%, ${colors.l}%)`;
    }
    // Fallback for unknown return periods
    return 'hsl(0, 80%, 70%)';
  };

  const getTextColor = () => {
    if (isSelected || isHovered) return 'white';
    // For very light backgrounds (2.3 yrs), use dark text
    if (returnPeriod === '2.3' || returnPeriod === '5') return 'rgb(71, 85, 105)'; // slate-600
    return 'white';
  };

  const handleClick = () => {
    onClick?.(scenario);
  };

  const handleMouseEnter = () => {
    onHoverEnter?.(scenario);
  };

  const handleMouseLeave = () => {
    onHoverLeave?.();
  };

  // Maintenance label (shortened)
  const maintenanceLabel = {
    breaches: '2022',
    redcapacity: 'Reduced Cap.',
    perfect: 'Perfect',
  }[maintenance] || maintenance;

  if (mode === 'detailed') {
    return (
      <button
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          'relative w-full p-3 rounded-lg border-2 transition-all duration-200',
          'hover:scale-105 hover:shadow-lg',
          'focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2',
          isSelected ? 'border-blue-600' : 'border-transparent',
          className
        )}
        style={{
          backgroundColor: getBackgroundColor(),
          color: getTextColor(),
        }}
      >
        {/* Return Period Badge */}
        <div className="text-xs font-bold mb-1">
          {returnPeriod === '2.3' ? '2.3' : returnPeriod} yrs
        </div>

        {/* Maintenance Label */}
        <div className="text-[10px] opacity-90 mb-2">
          {maintenanceLabel}
        </div>

        {/* Affected Count */}
        <div className="flex items-center justify-between">
          <div className="text-xs">
            <span className="font-semibold">{totalAffectedExposures}</span>
            <span className="opacity-75">/9</span>
          </div>

          {/* Severity Indicator */}
          <div className="flex gap-0.5">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: i < (severity === 'extreme' ? 3 : severity === 'high' ? 2 : severity === 'medium' ? 1 : 0)
                    ? 'rgba(255,255,255,0.9)'
                    : 'rgba(255,255,255,0.3)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Severity Label */}
        <div className="text-[9px] uppercase tracking-wider opacity-75 mt-1">
          {severity}
        </div>
      </button>
    );
  }

  // Compact mode (default)
  return (
    <button
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'relative w-12 h-12 rounded border transition-all duration-200',
        'hover:scale-110 hover:shadow-sm',
        'focus:outline-none focus:ring-1 focus:ring-blue-400 focus:ring-offset-0',
        isSelected ? 'border-blue-600 border-2' : 'border-transparent border',
        'flex items-center justify-center',
        className
      )}
      style={{
        backgroundColor: getBackgroundColor(),
        color: getTextColor(),
      }}
      title={`${returnPeriod}yrs • ${maintenanceLabel} • ${totalAffectedExposures}/9 affected (${severity})`}
    >
      {/* Affected Count */}
      <div className="text-sm font-bold leading-none">
        {totalAffectedExposures}
        <span className="text-[10px] font-normal opacity-75 leading-none">/9</span>
      </div>

      {/* Hover Tooltip (CSS-based) */}
      {isHovered && (
        <div className="absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] rounded whitespace-nowrap pointer-events-none">
          {returnPeriod}yrs • {maintenanceLabel} • {totalAffectedExposures}/9 affected
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </button>
  );
});

ImpactCell.displayName = 'ImpactCell';
