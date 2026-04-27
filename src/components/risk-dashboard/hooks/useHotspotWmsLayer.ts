/**
 * Hook for managing the Hotspot Intensity WMS layer from GeoServer
 *
 * Displays the spatially distributed hotspot intensity raster
 * from the exposures:hotspot_intensity layer.
 */

import { useEffect, useRef } from 'react';
import type Map from 'ol/Map';
import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';

interface UseHotspotWmsLayerOptions {
  map: Map | null;
  visible: boolean;
  opacity?: number;
}

const GEOSERVER_URL = '/geoserver/exposures/wms';
const LAYER_NAME = 'exposures:hotspot_intensity';

export function useHotspotWmsLayer({
  map,
  visible,
  opacity = 0.7,
}: UseHotspotWmsLayerOptions) {
  const layerRef = useRef<TileLayer<TileWMS> | null>(null);

  // Create and add layer to map
  useEffect(() => {
    if (!map || layerRef.current) return;

    const source = new TileWMS({
      url: GEOSERVER_URL,
      params: {
        LAYERS: LAYER_NAME,
        TILED: true,
        VERSION: '1.1.0',
        FORMAT: 'image/png',
        TRANSPARENT: true,
      },
      serverType: 'geoserver',
      transition: 0,
    });

    const layer = new TileLayer({
      source,
      visible: false,
      opacity,
      zIndex: 180, // Above choropleth (175), so raster shows on top of district polygons
    });

    map.addLayer(layer);
    layerRef.current = layer;

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, opacity]);

  // Update visibility
  useEffect(() => {
    if (layerRef.current) {
      layerRef.current.setVisible(visible);
    }
  }, [visible]);
}
