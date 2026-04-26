/**
 * Hotspot Intensity Layer
 *
 * Displays spatially distributed hotspot scores based on population density.
 * Uses XYZ tiles generated from WorldPop × District Hotspot Scores.
 */

import { useEffect, useRef } from 'react';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';

interface HotspotIntensityLayerProps {
  map: any;
  visible: boolean;
  opacity?: number;
}

const TILES_URL = '/tiles/hotspot/{z}/{x}/{y}.png';

export function HotspotIntensityLayer({ map, visible, opacity = 0.6 }: HotspotIntensityLayerProps) {
  const layerRef = useRef<TileLayer<XYZ> | null>(null);

  useEffect(() => {
    if (!map) return;

    // Create XYZ tile layer
    const source = new XYZ({
      url: TILES_URL,
      crossOrigin: 'anonymous',
      minZoom: 7,
      maxZoom: 10,
    });

    const layer = new TileLayer({
      source,
      visible,
      opacity,
      zIndex: 15, // Above base layers, below flood layers
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

  useEffect(() => {
    if (layerRef.current) {
      layerRef.current.setVisible(visible);
    }
  }, [visible]);

  useEffect(() => {
    if (layerRef.current) {
      layerRef.current.setOpacity(opacity);
    }
  }, [opacity]);

  return null;
}

export default HotspotIntensityLayer;
