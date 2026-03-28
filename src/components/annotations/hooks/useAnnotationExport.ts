/**
 * useAnnotationExport Hook
 *
 * Exports annotations as GeoJSON file using OpenLayers format.
 */

import { useCallback } from 'react';
import GeoJSON from 'ol/format/GeoJSON';
import type Feature from 'ol/Feature';

interface ExportOptions {
  filename?: string;
  projection?: string;
}

export function useAnnotationExport() {
  /**
   * Export features to GeoJSON file
   */
  const exportToGeoJSON = useCallback((
    features: Feature[],
    options: ExportOptions = {}
  ) => {
    const {
      filename = `annotations_${new Date().toISOString().slice(0, 10)}.geojson`,
      projection = 'EPSG:32642',
    } = options;

    try {
      const format = new GeoJSON();
      const geojson = format.writeFeatures(features, {
        featureProjection: projection,
        dataProjection: 'EPSG:4326',
      });

      const blob = new Blob([JSON.stringify(JSON.parse(geojson), null, 2)], {
        type: 'application/geo+json',
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting annotations:', error);
      throw new Error('Failed to export annotations');
    }
  }, []);

  return {
    exportToGeoJSON,
  };
}
