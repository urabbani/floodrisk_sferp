/**
 * Annotation Panel Component
 *
 * Sidebar panel displaying list of annotations with search and filter.
 */

import { useState, useMemo, useRef } from 'react';
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
import { Separator } from '@/components/ui/separator';
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
import type { Annotation, AnnotationCategory, DrawingTool } from '@/types/annotations';
import { CATEGORY_INFO, formatCategory, formatTimestamp, TOOL_INFO } from '@/types/annotations';
import { cn } from '@/lib/utils';

interface AnnotationPanelProps {
  annotations: Annotation[];
  isLoading?: boolean;
  onAnnotationClick?: (annotation: Annotation) => void;
  onAnnotationEdit?: (annotation: Annotation) => void;
  onAnnotationDelete?: (id: number) => void;
  onAnnotationToggleVisibility?: (id: number, visible: boolean) => void;
  onToolChange?: (tool: DrawingTool) => void;
}

export function AnnotationPanel({
  annotations,
  isLoading = false,
  onAnnotationClick,
  onAnnotationEdit,
  onAnnotationDelete,
  onAnnotationToggleVisibility,
  onToolChange,
}: AnnotationPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Track visibility state for each annotation using useRef to persist across renders
  const visibilityStateRef = useRef<Map<number, boolean>>(new Map());

  // Initialize visibility state for new annotations
  annotations.forEach((a) => {
    if (!visibilityStateRef.currentRef.current.has(a.id)) {
      visibilityStateRef.currentRef.current.set(a.id, true);
    }
  });

  // Filter annotations based on search and category
  const filteredAnnotations = useMemo(() => {
    return annotations.filter((annotation) => {
      const matchesSearch =
        !searchQuery ||
        annotation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        annotation.created_by.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        categoryFilter === 'all' || annotation.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [annotations, searchQuery, categoryFilter]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: annotations.length };
    annotations.forEach((a) => {
      counts[a.category] = (counts[a.category] || 0) + 1;
    });
    return counts;
  }, [annotations]);

  const handleDelete = () => {
    if (deleteId !== null) {
      onAnnotationDelete?.(deleteId);
      setDeleteId(null);
    }
  };

  const handleZoomTo = (annotation: Annotation) => {
    onAnnotationClick?.(annotation);
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
            placeholder="Search annotations..."
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
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{filteredAnnotations.length} annotations</span>
          <span>by {new Set(annotations.map((a) => a.created_by)).size} contributors</span>
        </div>
      </div>

      {/* Annotation list */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-sm text-slate-500">
            Loading annotations...
          </div>
        ) : filteredAnnotations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <MapPin className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">
              {searchQuery || categoryFilter !== 'all'
                ? 'No annotations match your search'
                : 'No annotations yet. Start drawing on the map!'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAnnotations.map((annotation) => {
              const isVisible = visibilityStateRef.current.get(annotation.id) ?? true;
              const categoryInfo = CATEGORY_INFO[annotation.category];

              return (
                <div
                  key={annotation.id}
                  className={cn(
                    "flex items-start gap-3 p-3 hover:bg-slate-50 cursor-pointer transition-colors",
                    !isVisible && "opacity-50"
                  )}
                  onClick={() => handleZoomTo(annotation)}
                >
                  {/* Visibility toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      visibilityStateRef.current.set(annotation.id, !isVisible);
                      onAnnotationToggleVisibility?.(annotation.id, !isVisible);
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
                        {annotation.title}
                      </h4>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          categoryInfo?.color && `border-[${categoryInfo.color}] text-[${categoryInfo.color}]`
                        )}
                      >
                        {formatCategory(annotation.category)}
                      </Badge>
                    </div>

                    {annotation.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mb-1">
                        {annotation.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        {annotation.geometry_type === 'point' && <MapPin className="w-3 h-3" />}
                        {annotation.geometry_type === 'line' && <Minus className="w-3 h-3" />}
                        {annotation.geometry_type === 'polygon' && <Pentagon className="w-3 h-3" />}
                        {annotation.geometry_type}
                      </span>
                      <span>by {annotation.created_by}</span>
                      <span>{formatTimestamp(annotation.updated_at)}</span>
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
                        onAnnotationEdit?.(annotation);
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
                        setDeleteId(annotation.id);
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
            <AlertDialogTitle>Delete Annotation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this annotation? This action cannot be undone.
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
