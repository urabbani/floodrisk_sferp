import { useState } from 'react';
import type { LayerInfo } from '@/types/layers';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { GEOSERVER_CONFIG } from '@/config/layers';
import { cn } from '@/lib/utils';

interface LegendPanelProps {
  layer: LayerInfo | null;
  onClose: () => void;
}

export function LegendPanel({ layer, onClose }: LegendPanelProps) {
  const [expanded, setExpanded] = useState(true);

  if (!layer) return null;

  const legendUrl = layer.legendUrl || 
    `${GEOSERVER_CONFIG.baseUrl}/wms?REQUEST=GetLegendGraphic&VERSION=1.1.1&FORMAT=image/png&LAYER=${layer.workspace}:${layer.geoserverName}&WIDTH=20&HEIGHT=20`;

  return (
    <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg z-10 max-w-xs">
      {/* Header */}
      <div 
        className="flex items-center justify-between px-3 py-2 border-b border-slate-200 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-800">Legend</span>
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Content */}
      <div className={cn(
        'px-3 py-2 transition-all',
        expanded ? 'block' : 'hidden'
      )}>
        <p className="text-xs text-slate-600 mb-2 truncate" title={layer.name}>
          {layer.name}
        </p>
        <div className="flex items-start gap-2">
          <img
            src={legendUrl}
            alt={`Legend for ${layer.name}`}
            className="max-w-full"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      </div>
    </div>
  );
}
