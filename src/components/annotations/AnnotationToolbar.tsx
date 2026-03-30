/**
 * Annotation Toolbar Component
 *
 * Drawing tools toolbar with ToggleGroup for tool selection.
 * Can be placed in the header or floating on the map.
 */

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MapPin,
  Minus,
  Pentagon,
  MousePointer2,
  Pencil,
  Trash2,
  Download,
  MessageSquarePlus,
  Plus,
} from 'lucide-react';
import type { DrawingTool } from '@/types/annotations';
import { TOOL_INFO } from '@/types/annotations';

interface AnnotationToolbarProps {
  activeTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  onExport?: () => void;
  onToggleInterventionsPanel?: () => void;
  interventionsCount?: number;
  variant?: 'header' | 'floating';
  isAuthenticated?: boolean;
}

export function AnnotationToolbar({
  activeTool,
  onToolChange,
  onExport,
  onToggleInterventionsPanel,
  interventionsCount = 0,
  variant = 'header',
  isAuthenticated = false,
}: AnnotationToolbarProps) {
  const drawTools: DrawingTool[] = ['point', 'line', 'polygon'];
  const editTools: DrawingTool[] = ['select', 'modify'];

  const handleExport = () => {
    onExport?.();
  };

  if (variant === 'floating') {
    // Floating toolbar on the map
    return (
      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 p-1 z-10">
        <TooltipProvider>
          <ToggleGroup
            type="single"
            value={activeTool}
            onValueChange={(value) => onToolChange(value as DrawingTool)}
          >
            {drawTools.map((tool) => {
              const Icon = tool === 'point' ? MapPin : tool === 'line' ? Minus : Pentagon;
              return (
                <TooltipProvider key={tool}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem
                        value={tool}
                        aria-label={TOOL_INFO[tool].label}
                        title={TOOL_INFO[tool].description}
                      >
                        <Icon className="w-4 h-4" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {TOOL_INFO[tool].label}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </ToggleGroup>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value="delete"
                  aria-label="Delete selected"
                  onClick={(e) => {
                    e.preventDefault();
                    onToolChange('none');
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent side="bottom">Delete Selected</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TooltipProvider>
      </div>
    );
  }

  // Header toolbar variant
  return (
    <div className="flex items-center gap-1">
      {/* Interventions Panel */}
      {onToggleInterventionsPanel && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 relative"
                onClick={onToggleInterventionsPanel}
              >
                <MessageSquarePlus className="w-4 h-4" />
                {interventionsCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {interventionsCount > 99 ? '99+' : interventionsCount}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Interventions Panel</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Create Intervention Dropdown */}
      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <DropdownMenuTrigger asChild>
              <Button
                variant={(activeTool === 'point' || activeTool === 'line' || activeTool === 'polygon') ? 'default' : 'ghost'}
                size="icon"
                className="h-9 w-9"
                disabled={!isAuthenticated}
                asChild
              >
                <div>
                  <Plus className="w-4 h-4" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <TooltipContent>Create Intervention</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onToolChange('point')}>
            <MapPin className="w-4 h-4 mr-2" />
            Point Intervention
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onToolChange('line')}>
            <Minus className="w-4 h-4 mr-2" />
            Line Intervention
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onToolChange('polygon')}>
            <Pentagon className="w-4 h-4 mr-2" />
            Polygon Intervention
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modify Intervention */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeTool === 'modify' ? 'default' : 'ghost'}
              size="icon"
              className="h-9 w-9"
              onClick={() => onToolChange('modify')}
              title="Modify Intervention"
              disabled={!isAuthenticated}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Modify Intervention</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Delete Intervention */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hover:text-red-600"
              onClick={() => onToolChange('delete')}
              title="Delete Selected Intervention"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete Selected Intervention</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Export Interventions */}
      {onExport && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={handleExport}
                title="Export Interventions (GeoJSON)"
              >
                <Download className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export Interventions (GeoJSON)</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
