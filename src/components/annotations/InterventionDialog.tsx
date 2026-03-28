/**
 * Intervention Dialog Component
 *
 * Form dialog for creating/editing interventions.
 * Uses react-hook-form and shadcn Form components.
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { AnnotationCategory, StyleConfig } from '@/types/annotations';
import { CATEGORY_INFO, COLOR_PRESETS } from '@/types/annotations';

const annotationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.enum(['general', 'observation', 'infrastructure', 'hazard', 'field_note', 'other']),
  color: z.string().optional(),
});

type AnnotationFormValues = z.infer<typeof annotationSchema>;

interface InterventionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    category: AnnotationCategory;
    styleConfig: Partial<StyleConfig>;
  }) => void;
  defaultValues?: {
    title?: string;
    description?: string;
    category?: AnnotationCategory;
    color?: string;
  };
  mode: 'create' | 'edit';
}

export function InterventionDialog({
  isOpen,
  onClose,
  onSubmit,
  defaultValues = {},
  mode = 'create',
}: AnnotationDialogProps) {
  const [selectedColor, setSelectedColor] = useState(defaultValues.color || COLOR_PRESETS[0].value);

  const form = useForm<AnnotationFormValues>({
    resolver: zodResolver(annotationSchema),
    defaultValues: {
      title: defaultValues.title || '',
      description: defaultValues.description || '',
      category: defaultValues.category || 'general',
    },
  });

  const handleSubmit = (data: AnnotationFormValues) => {
    const styleConfig: Partial<StyleConfig> = {
      color: selectedColor,
      fillColor: COLOR_PRESETS.find((c) => c.value === selectedColor)?.fill || 'rgba(255, 0, 0, 0.2)',
      opacity: 0.2,
    };

    onSubmit({
      title: data.title,
      description: data.description || '',
      category: data.category,
      styleConfig,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Intervention' : 'Edit Intervention'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Add details to your drawn intervention'
              : 'Update intervention properties'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter intervention title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(CATEGORY_INFO).map(([key, { label, color }]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            {label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add notes or details..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setSelectedColor(preset.value)}
                    className={`
                      w-8 h-8 rounded-full border-2 transition-all
                      ${selectedColor === preset.value
                        ? 'border-slate-800 scale-110'
                        : 'border-slate-200 hover:border-slate-400'}
                    `}
                    style={{ backgroundColor: preset.fill }}
                    title={preset.name}
                  />
                ))}
              </div>
            </div>

            <DialogFooter className="sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button type="submit">
                {mode === 'create' ? 'Create' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
