import { X, MapPin, Droplets, Gauge, Clock } from 'lucide-react';

interface FeaturePopupProps {
  position: { x: number; y: number } | null;
  coordinate: number[] | null;
  features?: any[];
  onClose: () => void;
}

/**
 * Popup to show clicked coordinates and feature info from WMS
 */
export function FeaturePopup({ position, coordinate, features = [], onClose }: FeaturePopupProps) {
  if (!position || !coordinate) return null;

  const hasFeatures = features.length > 0;

  return (
    <div
      className="absolute bg-white rounded-lg shadow-xl border border-slate-200 max-w-xs z-50"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%) translateY(-10px)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-sm text-slate-700">Location Info</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-200 rounded transition-colors"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Content */}
      <div className="p-3 text-sm max-h-64 overflow-y-auto">
        {/* Coordinate info */}
        <div className="mb-3 pb-3 border-b border-slate-100">
          <div className="text-xs text-slate-500 mb-1">UTM Zone 42N</div>
          <div className="font-mono text-slate-800">
            E: {coordinate[0].toFixed(0)}, N: {coordinate[1].toFixed(0)}
          </div>
        </div>

        {/* Feature info */}
        {hasFeatures ? (
          <div className="space-y-3">
            {features.map((feature, idx) => (
              <div key={idx} className="border-b border-slate-100 last:border-0 pb-3 last:pb-0">
                <div className="text-xs font-medium text-blue-600 mb-2">
                  {feature.layer}
                </div>
                <div className="space-y-1">
                  {Object.entries(feature.properties).map(([key, value]) => (
                    <FeatureAttribute key={key} name={key} value={value} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-slate-500 italic text-xs">
            No data found. Try clicking on a visible flood layer.
          </div>
        )}
      </div>

      {/* Arrow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-3 h-3 bg-white border-r border-b border-slate-200" />
    </div>
  );
}

/**
 * Display a single feature attribute with appropriate icon
 */
function FeatureAttribute({ name, value }: { name: string; value: unknown }) {
  // Skip null/undefined values
  if (value === null || value === undefined) return null;

  // Get icon based on attribute name
  const Icon = getIconForAttribute(name);

  // Format the value
  const displayValue = formatValue(name, value);

  return (
    <div className="flex items-center gap-2 text-sm">
      {Icon && <Icon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
      <span className="text-slate-600 text-xs">{name}:</span>
      <span className="font-medium text-slate-700">{displayValue}</span>
    </div>
  );
}

/**
 * Get appropriate icon for attribute type
 */
function getIconForAttribute(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('depth') || lower.includes('maxdepth')) return Droplets;
  if (lower.includes('velocity') || lower.includes('speed')) return Gauge;
  if (lower.includes('duration') || lower.includes('time')) return Clock;
  return null;
}

/**
 * Format value for display
 */
function formatValue(name: string, value: unknown): string {
  if (typeof value === 'number') {
    const lower = name.toLowerCase();

    // Depth values - display in meters
    if (lower.includes('depth') || lower.includes('elevation')) {
      if (Math.abs(value) < 1) {
        return `${value.toFixed(3)} m`;
      }
      return `${value.toFixed(2)} m`;
    }

    // Velocity values - display in m/s
    if (lower.includes('velocity') || lower.includes('speed')) {
      return `${value.toFixed(2)} m/s`;
    }

    // Duration values - display in hours or days
    if (lower.includes('duration') || lower.includes('time')) {
      if (value > 24) {
        return `${(value / 24).toFixed(1)} days`;
      }
      return `${value.toFixed(1)} hrs`;
    }

    // Default number formatting
    return value.toFixed(2);
  }

  return String(value);
}
