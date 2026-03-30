/**
 * Intervention Dialog Component
 *
 * Form dialog for creating/editing interventions.
 * Uses react-hook-form and shadcn Form components.
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useEffect } from 'react';
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
import { INTERVENTION_TYPES } from '@/types/interventions';

const annotationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  interventionType: z.string().min(1, 'Please select an intervention type'),
  featureType: z.enum(['point', 'line', 'polygon']),
  hydrologicalParams: z.string().optional(),
});

type AnnotationFormValues = z.infer<typeof annotationSchema>;

interface InterventionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    interventionType: string;
    featureType: 'point' | 'line' | 'polygon';
    hydrologicalParams: string;
    interventionInfo?: {
      shortDescription: string;
      shapeAndHydroParams: string;
    };
  }) => void;
  defaultValues?: {
    name?: string;
    interventionType?: string;
    featureType?: 'point' | 'line' | 'polygon';
    hydrologicalParams?: string;
  };
  mode: 'create' | 'edit';
}

export function InterventionDialog({
  isOpen,
  onClose,
  onSubmit,
  defaultValues = {},
  mode = 'create',
}: InterventionDialogProps) {
  const form = useForm<AnnotationFormValues>({
    resolver: zodResolver(annotationSchema),
    defaultValues: {
      name: defaultValues.name || '',
      interventionType: defaultValues.interventionType || '',
      featureType: defaultValues.featureType || 'point',
      hydrologicalParams: defaultValues.hydrologicalParams || '',
    },
  });

  // Update info boxes and placeholder when intervention type changes
  useEffect(() => {
    if (form.watch('interventionType')) {
      const selectedIntervention = INTERVENTION_TYPES.find(
        (it) => it.id === form.watch('interventionType')
      );

      if (selectedIntervention) {
        // Auto-set the feature type based on intervention type
        if (selectedIntervention.featureType !== 'none') {
          form.setValue('featureType', selectedIntervention.featureType);
        }

        // Update the info box with short description
        const shortDescEl = document.getElementById('short-description-info');
        if (shortDescEl) {
          shortDescEl.textContent = selectedIntervention.shortDescription;
        }

        // Update the hydrological params textarea placeholder with shape+hydro info
        const hydroInput = document.querySelector('textarea[name="hydrologicalParams"]') as HTMLTextAreaElement | null;
        if (hydroInput) {
          hydroInput.placeholder = selectedIntervention.shapeAndHydroParams || 'Select an intervention type to see required parameters';
        }
      }
    }
  }, [form.watch, form]);

  const handleSubmit = (data: AnnotationFormValues) => {
    // Find the selected intervention type to get details
    const selectedIntervention = INTERVENTION_TYPES.find(
      (it) => it.id === data.interventionType
    );

    onSubmit({
      name: data.name,
      interventionType: data.interventionType,
      featureType: data.featureType,
      hydrologicalParams: data.hydrologicalParams,
      interventionInfo: {
        shortDescription: selectedIntervention?.shortDescription || '',
        shapeAndHydroParams: selectedIntervention?.shapeAndHydroParams || '',
      }
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
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter intervention name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Intervention Type Dropdown */}
            <FormField
              control={form.control}
              name="interventionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Intervention Type *</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select intervention type" />
                      </SelectTrigger>
                      <SelectContent>
                        {INTERVENTION_TYPES.filter(it => it.featureType !== 'none').map((intervention) => (
                          <SelectItem key={intervention.id} value={intervention.id}>
                            <div className="flex items-center gap-2">
                              <span className="font-mono">{intervention.id}</span>
                              <span>- {intervention.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Info Box - Shows short description of selected intervention type */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="space-y-2">
                <div className="font-semibold text-slate-800">Description:</div>
                <p className="text-slate-600 text-sm" id="short-description-info">
                  Select an intervention type to see description
                </p>
              </div>
            </div>

            {/* Feature Type Dropdown */}
            <FormField
              control={form.control}
              name="featureType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feature Type *</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select feature type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="point">Point</SelectItem>
                        <SelectItem value="line">Line</SelectItem>
                        <SelectItem value="polygon">Polygon</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hydrological Parameter Required Field */}
            <FormField
              control={form.control}
              name="hydrologicalParams"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hydrological Parameter Required</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Select an intervention type to see required parameters"
                      className="min-h-[120px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
