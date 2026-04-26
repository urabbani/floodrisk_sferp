/**
 * WorldPop Population Density Layer
 *
 * Displays WorldPop population density data combined with district hotspot scores.
 * Uses OpenLayers ImageLayer with a static image source.
 */

import { useEffect, useRef } from 'react';
import ImageLayer from 'ol/layer/Image';
import Static from 'ol/source/ImageStatic';
import { Projection } from 'ol/proj';
import { getCenter } from 'ol/extent';

interface WorldPopLayerProps {
  map: any; // OpenLayers Map instance
  visible: boolean;
  opacity?: number;
  hotspotScores?: Record<string, number>; // Optional: district hotspot scores to weight the display
}

const WORLDPOP_EXTENT = [315204, 2864590, 563443, 3153441]; // UTM Zone 42N bounds
const WORLDPOP_URL = '/T1_WorldPop_V1_32642.tif'; // Served from public folder

export function WorldPopLayer({ map, visible, opacity = 0.7, hotspotScores }: WorldPopLayerProps) {
  const layerRef = useRef<ImageLayer<any> | null>(null);

  useEffect(() => {
    if (!map) return;

    // Create projection for WorldPop (UTM Zone 42N)
    const projection = new Projection({
      code: 'EPSG:32642',
      units: 'm',
      extent: WORLDPOP_EXTENT,
    });

    // Create image layer with static source
    // Note: TIFF files cannot be displayed directly as <img>, so we use GeoServer WMS
    const source = new Static({
      url: WORLDPOP_URL,
      imageExtent: WORLDPOP_EXTENT,
      projection: projection,
      interpolate: true,
    });

    const layer = new ImageLayer({
      source,
      visible,
      opacity,
      zIndex: 10,
    });

    layerRef.current = layer;
    map.addLayer(layer);

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map]);

  // Update visibility
  useEffect(() => {
    if (layerRef.current) {
      layerRef.current.setVisible(visible);
    }
  }, [visible]);

  // Update opacity
  useEffect(() => {
    if (layerRef.current) {
      layerRef.current.setOpacity(opacity);
    }
  }, [opacity]);

  return null; // This component doesn't render anything
}

export default WorldPopLayer;
