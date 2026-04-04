import { useEffect, useRef, useState } from 'react';
import type Map from 'ol/Map';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { GeoJSON } from 'ol/format';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import type { DistrictName } from '@/types/risk';
import { getRiskColor } from '@/types/risk';

interface UseChoroplethLayerOptions {
  map: Map | null;
  data: Record<DistrictName, number> | null;
  min: number;
  max: number;
  visible: boolean;
  onHoverDistrict?: (district: string | null) => void;
}

export function useChoroplethLayer({
  map,
  data,
  min,
  max,
  visible,
  onHoverDistrict,
}: UseChoroplethLayerOptions) {
  const sourceRef = useRef(new VectorSource({ format: new GeoJSON() }));
  const layerRef = useRef<VectorLayer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const geojsonLoaded = useRef(false);

  // Create and add layer to map
  useEffect(() => {
    if (!map || layerRef.current) return;

    const layer = new VectorLayer({
      source: sourceRef.current,
      zIndex: 175,
      visible: false,
    });

    map.addLayer(layer);
    layerRef.current = layer;

    return () => {
      map.removeLayer(layer);
      layerRef.current = null;
    };
  }, [map]);

  // Load GeoJSON once
  useEffect(() => {
    if (geojsonLoaded.current || !sourceRef.current) return;

    setIsLoading(true);
    fetch('/data/districts.geojson')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((geojson) => {
        const format = new GeoJSON({
          dataProjection: 'EPSG:32642',
          featureProjection: 'EPSG:32642',
        });
        const features = format.readFeatures(geojson);
        sourceRef.current.addFeatures(features);
        geojsonLoaded.current = true;
      })
      .catch((err) => {
        console.error('Failed to load districts GeoJSON:', err);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Style features based on data
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    layer.setVisible(visible);

    if (!visible || !data) return;

    const styleFn = (feature: any) => {
      const districtName = feature.get('district') as string;
      const value = data[districtName as DistrictName];
      const hexColor = value !== undefined && value > 0
        ? getRiskColor(value, min, max)
        : '#c8c8c8';

      // Convert hex to rgba with 0.7 opacity
      const r = parseInt(hexColor.slice(1, 3), 16);
      const g = parseInt(hexColor.slice(3, 5), 16);
      const b = parseInt(hexColor.slice(5, 7), 16);
      const rgba = `rgba(${r},${g},${b},0.7)`;

      return new Style({
        fill: new Fill({ color: rgba }),
        stroke: new Stroke({ color: '#334155', width: 1.5 }),
      });
    };

    layer.setStyle(styleFn);
  }, [data, min, max, visible]);

  // Handle pointer move for hover
  useEffect(() => {
    if (!map || !visible) return;

    const handlePointerMove = (evt: any) => {
      const feature = map.forEachFeatureAtPixel(evt.pixel, (f: any) => f, {
        layerFilter: (l: any) => l === layerRef.current,
      });

      if (feature) {
        const district = feature.get('district') as string;
        onHoverDistrict?.(district);
        map.getTargetElement().style.cursor = 'pointer';
      } else {
        onHoverDistrict?.(null);
        map.getTargetElement().style.cursor = '';
      }
    };

    map.on('pointermove', handlePointerMove);
    return () => {
      map.un('pointermove', handlePointerMove);
    };
  }, [map, visible, onHoverDistrict]);

  return { isLoading };
}
