import { useMemo } from 'react';
import { Filter } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface DepthThresholdSliderProps {
  /**
   * Current depth threshold value (in meters)
   */
  value: number;

  /**
   * Callback when threshold changes
   */
  onChange: (value: number) => void;

  /**
   * Minimum depth value (default: 0)
   */
  min?: number;

  /**
   * Maximum depth value (default: 5)
   */
  max?: number;

  /**
   * Step size (default: 0.1)
   */
  step?: number;

  /**
   * Additional class names
   */
  className?: string;

  /**
   * Whether to show the "All" option (threshold = 0)
   */
  showAllOption?: boolean;
}

/**
 * DepthThresholdSlider - Slider for filtering flood impact by depth threshold
 *
 * Allows users to filter impact data and map layers to show only features
 * with flood depth >= threshold value.
 *
 * Example:
 * - Threshold: 1.5m → Shows only features with depth >= 1.5m
 * - Threshold: 0m → Shows all features (no filtering)
 */
export function DepthThresholdSlider({
  value,
  onChange,
  min = 0,
  max = 5,
  step = 0.1,
  className,
  showAllOption = true,
}: DepthThresholdSliderProps) {
  // Depth markers for common thresholds
  const depthMarkers = useMemo(() => {
    if (showAllOption && min === 0) {
      return [
        { value: 0, label: 'All' },
        { value: 0.5, label: '0.5m' },
        { value: 1, label: '1m' },
        { value: 2, label: '2m' },
        { value: 3, label: '3m' },
        { value: 5, label: '5m+' },
      ];
    }
    return [
      { value: 0.5, label: '0.5m' },
      { value: 1, label: '1m' },
      { value: 2, label: '2m' },
      { value: 3, label: '3m' },
      { value: 5, label: '5m+' },
    ];
  }, [showAllOption, min]);

  const handleValueChange = (values: number[]) => {
    const newValue = values[0];
    onChange(newValue);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-shrink-0">
          <Filter className="w-3.5 h-3.5 text-blue-600" />
          <label className="text-sm font-medium text-slate-700">
            Depth Filter:
          </label>
        </div>

        {/* Current Value Display */}
        <div className="flex items-center gap-2">
          {value === 0 ? (
            <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              Show All
            </span>
          ) : (
            <span className="text-sm font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
              ≥ {value.toFixed(1)}m
            </span>
          )}
          <button
            onClick={() => onChange(0)}
            className="text-sm text-slate-500 hover:text-blue-600 underline"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Slider */}
      <div className="px-1">
        <Slider
          value={[value]}
          onValueChange={handleValueChange}
          min={min}
          max={max}
          step={step}
          className={cn(
            'data-[orientation=horizontal]:h-2',
            value === 0 && '[&_[data-slot=slider-range]]:bg-blue-500',
            value > 0 && value < 1.5 && '[&_[data-slot=slider-range]]:bg-yellow-500',
            value >= 1.5 && value < 3 && '[&_[data-slot=slider-range]]:bg-orange-500',
            value >= 3 && '[&_[data-slot=slider-range]]:bg-red-500'
          )}
        />
      </div>

      {/* Depth Markers */}
      <div className="flex items-center justify-between px-1 mt-1">
        {depthMarkers.map((marker) => (
          <button
            key={marker.value}
            onClick={() => onChange(marker.value)}
            className={cn(
              'text-[9px] px-1.5 py-0.5 rounded transition-all',
              value === marker.value
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'text-slate-500 hover:bg-slate-100'
            )}
          >
            {marker.label}
          </button>
        ))}
      </div>

      {/* Description */}
      {value > 0 && (
        <p className="text-sm text-slate-600 bg-slate-50 px-2 py-1.5 rounded border border-slate-200">
          Showing only impacts with flood depth <strong>≥ {value.toFixed(1)}m</strong>
        </p>
      )}
    </div>
  );
}
