/**
 * Intervention Panel Component
 *
 * Sidebar panel displaying list of interventions with search and filter.
 */

import { useState, useMemo, useEffect } from 'react';
import { Search, Eye, EyeOff, Edit, Trash2, MapPin, Minus, Pentagon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Annotation, DrawingTool } from '@/types/annotations';
import { CATEGORY_INFO, formatCategory, formatTimestamp } from '@/types/annotations';
import { cn } from '@/lib/utils';

interface InterventionPanelProps {
  interventions: Annotation[];
  isLoading?: boolean;
  onInterventionClick?: (intervention: Annotation) => void;
  onInterventionEdit?: (intervention: Annotation) => void;
  onInterventionDelete?: (id: number) => void;
  onInterventionToggleVisibility?: (id: number, visible: boolean) => void;
  onToolChange?: (tool: DrawingTool) => void;
}

export function InterventionPanel({
  interventions,
  isLoading = false,
  onInterventionClick,
  onInterventionEdit,
  onInterventionDelete,
  onInterventionToggleVisibility,
  onToolChange,
}: InterventionPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Track visibility state for each intervention using useState to trigger re-renders
  const [visibilityState, setVisibilityState] = useState<Map<number, boolean>>(new Map());

  // Initialize visibility state for new interventions and preserve existing state
  useEffect(() => {
    const newState = new Map(visibilityState); // Start with current state
    interventions.forEach((intervention) => {
      // Only set default visibility if not already tracked (i.e., new intervention)
      if (!visibilityState.has(intervention.id)) {
        newState.set(intervention.id, true);
      }
      // If already tracked, preserve existing visibility state
    });
    setVisibilityState(newState);
  }, [interventions]);

  // Filter interventions based on search and category
  const filteredInterventions = useMemo(() => {
    return interventions.filter((intervention) => {
      const matchesSearch =
        !searchQuery ||
        intervention.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        intervention.created_by.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        categoryFilter === 'all' || intervention.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [interventions, searchQuery, categoryFilter]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: interventions.length };
    interventions.forEach((i) => {
      counts[i.category] = (counts[i.category] || 0) + 1;
    });
    return counts;
  }, [interventions]);

  const handleDelete = () => {
    if (deleteId !== null) {
      onInterventionDelete?.(deleteId);
      setDeleteId(null);
    }
  };

  const handleZoomTo = (annotation: Annotation) => {
    onInterventionClick?.(annotation);
    // Switch to select tool when clicking from list
    onToolChange?.('select');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with search and filter */}
      <div className="p-3 border-b border-slate-200 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search interventions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Category filter */}
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              All ({categoryCounts.all})
            </SelectItem>
            {Object.entries(CATEGORY_INFO).map(([key, { label, color }]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {label} ({categoryCounts[key] || 0})
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Summary */}
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>{filteredInterventions.length} interventions</span>
          <span>by {new Set(interventions.map((a) => a.created_by)).size} contributors</span>
        </div>
      </div>

      {/* Intervention list */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-sm text-slate-500">
            Loading interventions...
          </div>
        ) : filteredInterventions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <MapPin className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">
              {searchQuery || categoryFilter !== 'all'
                ? 'No interventions match your search'
                : 'No interventions yet. Start drawing on the map!'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredInterventions.map((intervention) => {
              const isVisible = visibilityState.get(intervention.id) ?? true;
              const categoryInfo = CATEGORY_INFO[intervention.category];

              return (
                <div
                  key={intervention.id}
                  className={cn(
                    "flex items-start gap-3 p-3 hover:bg-slate-50 cursor-pointer transition-colors",
                    !isVisible && "opacity-50"
                  )}
                  onClick={() => handleZoomTo(intervention)}
                >
                  {/* Visibility toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const newVisibility = !isVisible;
                      const newVisibilityState = new Map(visibilityState);
                      newVisibilityState.set(intervention.id, newVisibility);
                      setVisibilityState(newVisibilityState);
                      onInterventionToggleVisibility?.(intervention.id, newVisibility);
                    }}
                    className="mt-0.5 text-slate-400 hover:text-slate-600"
                  >
                    {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  {/* Color indicator and geometry type */}
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full flex-shrink-0 mt-1",
                      categoryInfo?.color && `bg-[${categoryInfo.color}]`
                    )}
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-slate-800 truncate">
                        {intervention.name || intervention.title || 'Unnamed Intervention'}
                      </h4>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-sm",
                          categoryInfo?.color && `border-[${categoryInfo.color}] text-[${categoryInfo.color}]`
                        )}
                      >
                        {formatCategory(intervention.category)}
                      </Badge>
                    </div>

                    {/* Intervention Type Info */}
                    {intervention.interventionType && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin className="w-3 h-3" /> {/* Using MapPin as generic icon */}
                        <span className="font-mono">{intervention.interventionType}</span>
                      </div>
                    )}

                    {/* Short Description */}
                    {intervention.interventionInfo?.shortDescription && (
                      <p className="text-sm text-slate-500 line-clamp-2 mb-1">
                        {intervention.interventionInfo.shortDescription}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        {intervention.featureType === 'point' && <MapPin className="w-3 h-3" />}
                        {intervention.featureType === 'line' && <Minus className="w-3 h-3" />}
                        {intervention.featureType === 'polygon' && <Pentagon className="w-3 h-3" />}
                        {intervention.featureType}
                      </span>
                      <span>by {intervention.created_by}</span>
                      <span>{formatTimestamp(intervention.updated_at)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        onInterventionEdit?.(intervention);
                      }}
                    >
                      <Edit className="w-3 h-3 text-slate-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(intervention.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Intervention</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this intervention? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
