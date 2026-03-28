/**
 * Annotations Hooks Barrel Export
 */

export { useDrawingInteractions } from './useDrawingInteractions';
export { useAnnotationLayer } from './useAnnotationLayer';
export { useAnnotations } from './useAnnotations';
export { useAnnotationExport } from './useAnnotationExport';

// Re-export types for convenience
export type { DrawingTool } from '@/types/annotations';
export type { Annotation, NewAnnotation, UpdateAnnotation, StyleConfig } from '@/types/annotations';
