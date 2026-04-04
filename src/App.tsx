import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import GeoJSON from 'ol/format/GeoJSON';
import KML from 'ol/format/KML';
import { Header } from '@/components/Header';
import { LayerTree } from '@/components/layer-tree/LayerTree';
import { MapViewer } from '@/components/map/MapViewer';
import type { MapViewerHandle } from '@/components/map/MapViewer';
import { LegendPanel } from '@/components/map/LegendPanel';
import { FeaturePopup } from '@/components/popups/FeaturePopup';
import { SwipeCompare } from '@/components/swipe/SwipeCompare';
import { ImpactMatrix } from '@/components/impact-matrix';
import { RiskDashboard } from '@/components/risk-dashboard';
import type { RiskView, DistrictName } from '@/types/risk';
import { useChoroplethLayer } from '@/components/risk-dashboard/hooks/useChoroplethLayer';
import { InterventionPanel } from '@/components/annotations/InterventionPanel';
import { InterventionDialog } from '@/components/annotations/InterventionDialog';
import { LoginDialog } from '@/components/annotations/LoginDialog';
import { useDrawingInteractions } from '@/components/annotations/hooks/useDrawingInteractions';
import { useAnnotationLayer } from '@/components/annotations/hooks/useAnnotationLayer';
import { useAnnotations } from '@/components/annotations/hooks/useAnnotations';
import { useAnnotationExport } from '@/components/annotations/hooks/useAnnotationExport';
import { useAuth } from '@/hooks/useAuth';
import type { LayerInfo, LayerGroup } from '@/types/layers';
import { isLayerGroup } from '@/types/layers';
import { layerTree } from '@/config/layers';
import { cn } from '@/lib/utils';
import { PanelLeft, X, GripVertical, ArrowLeftRight, Layers, BarChart3, MessageSquarePlus, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import type { DrawingTool, NewAnnotation } from '@/types/annotations';
import type Feature from 'ol/Feature';
import type { Annotation } from '@/types/annotations';

// Recursively collect all layers from the tree
function collectAllLayers(tree: LayerGroup): LayerInfo[] {
  const layers: LayerInfo[] = [];

  const traverse = (node: LayerGroup | LayerInfo) => {
    if (isLayerGroup(node)) {
      node.children.forEach(traverse);
    } else {
      layers.push(node);
    }
  };

  traverse(tree);
  return layers;
}

// Recursively collect initially visible layer IDs
function collectVisibleLayerIds(tree: LayerGroup): string[] {
  const visibleIds: string[] = [];

  const traverse = (node: LayerGroup | LayerInfo) => {
    if (isLayerGroup(node)) {
      node.children.forEach(traverse);
    } else if (node.visible) {
      visibleIds.push(node.id);
    }
  };

  traverse(tree);
  return visibleIds;
}

function App() {
  const isMobile = useIsMobile();
  // Sidebar starts closed on mobile, open on desktop
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [sidebarWidth, setSidebarWidth] = useState(352);
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarView, setSidebarView] = useState<'layers' | 'risk' | 'impact' | 'interventions'>('layers');
  const [currentImpactView, setCurrentImpactView] = useState<'summary' | 'detail' | 'compare'>('summary');
  const [currentRiskView, setCurrentRiskView] = useState<RiskView>('summary');
  const [choroplethData, setChoroplethData] = useState<Record<DistrictName, number> | null>(null);
  const [visibleLayerIds, setVisibleLayerIds] = useState<string[]>(() => collectVisibleLayerIds(layerTree));
  const [layerOpacities, setLayerOpacities] = useState<Record<string, number>>({});
  const [selectedLayer, setSelectedLayer] = useState<LayerInfo | null>(null);
  const [identifyPopup, setIdentifyPopup] = useState<{ coordinate: number[]; position: { x: number; y: number }; features: any[] } | null>(null);
  const [swipeCompareOpen, setSwipeCompareOpen] = useState(false);
  const [impactLayers, setImpactLayers] = useState<LayerInfo[]>([]);
  const sidebarRef = useRef<HTMLElement>(null);

  // Interventions state
  const [drawingTool, setDrawingTool] = useState<DrawingTool>('none');
  const { user, isAuthenticated } = useAuth();
  // Derive username from auth (for backward compatibility with hooks)
  const username = user?.displayName || '';
  const mapViewerRef = useRef<MapViewerHandle>(null);
  const [editingAnnotation, setEditingAnnotation] = useState<{ id: number; feature: Feature } | null>(null);
  const [annotationDialogOpen, setAnnotationDialogOpen] = useState(false);
  const [annotationDialogMode, setAnnotationDialogMode] = useState<'create' | 'edit'>('create');
  const [pendingDrawFeature, setPendingDrawFeature] = useState<Feature | null>(null);
  const [pendingInterventionData, setPendingInterventionData] = useState<{
    name: string;
    interventionType: string;
    featureType: 'point' | 'line' | 'polygon';
    hydrologicalParams: string;
    interventionInfo?: {
      shortDescription: string;
      shapeAndHydroParams: string;
    };
  } | null>(null);
  // Ref to track latest pendingInterventionData for callbacks
  const pendingInterventionDataRef = useRef(pendingInterventionData);
  useEffect(() => {
    pendingInterventionDataRef.current = pendingInterventionData;
  }, [pendingInterventionData]);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  // Ref for features pending upload (set during upload, consumed on dialog submit)
  const pendingUploadFeaturesRef = useRef<Feature[] | null>(null);
  // State for upload dialog defaultValues (feature type auto-detected from file)
  const [uploadDefaultValues, setUploadDefaultValues] = useState<{
    featureType: 'point' | 'line' | 'polygon';
  } | null>(null);

  // Get map instance for hooks
  const map = mapViewerRef.current?.getMap() || null;

  // Choropleth layer for Risk spatial view
  const choroplethValues = choroplethData ? Object.values(choroplethData).filter((v) => v > 0) : [];
  const choroplethMin = choroplethValues.length > 0 ? Math.min(...choroplethValues) : 0;
  const choroplethMax = choroplethValues.length > 0 ? Math.max(...choroplethValues) : 0;
  useChoroplethLayer({
    map,
    data: choroplethData,
    min: choroplethMin,
    max: choroplethMax,
    visible: sidebarView === 'risk' && currentRiskView === 'spatial',
  });

  // Handle login dialog events from header
  useEffect(() => {
    const handleShowLogin = () => {
      setLoginDialogOpen(true);
    };

    window.addEventListener('show-login-dialog', handleShowLogin);
    return () => {
      window.removeEventListener('show-login-dialog', handleShowLogin);
    };
  }, []);

  // Interventions hooks (using the annotations hook for interventions)
  const {
    annotations: interventions,
    isLoading: interventionsLoading,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    refetch: loadInterventions,
  } = useAnnotations({ enabled: !!map });

  const {
    vectorSource,
    vectorLayer,
  } = useAnnotationLayer({
    map,
  });

  const { activeTool, setActiveTool } = useDrawingInteractions({
    map,
    vectorSource,
    username,
    onDrawStart: () => {
      // Clear selection when starting to draw
      // Selection is handled by useDrawingInteractions internally
    },
    onDrawEnd: async (feature) => {
      // Check if we have pending intervention data (new flow)
      const data = pendingInterventionDataRef.current;
      if (data) {
        // Save intervention immediately using the pending data
        const newAnnotation: NewAnnotation = {
          title: data.name,
          description: data.hydrologicalParams,
          category: 'general',
          geometry_type: data.featureType,
          geometry: JSON.parse(JSON.stringify(
            JSON.parse(new GeoJSON().writeGeometry(feature.getGeometry()!, {
              featureProjection: 'EPSG:32642',
              dataProjection: 'EPSG:4326',
            }))
          )),
          style_config: {
            color: '#ff0000',
            strokeWidth: 2,
            fillColor: '#ff0000',
            opacity: 0.2,
          },
          created_by: username,
        };

        try {
          const created = await createAnnotation(newAnnotation);
          feature.set('id', created.id);
          feature.set('title', data.name);
          feature.set('description', data.hydrologicalParams);
          feature.set('category', 'general');
          feature.set('geometry_type', data.featureType);
          feature.set('styleConfig', {
            color: '#ff0000',
            strokeWidth: 2,
            fillColor: '#ff0000',
            opacity: 0.2,
          });
          feature.set('interventionType', data.interventionType);
          feature.set('interventionInfo', data.interventionInfo);
          feature.changed();
          // Clear pending data and reset tool
          setPendingInterventionData(null);
          setActiveTool('none');
          setDrawingTool('none');
        } catch (error) {
          console.error('Failed to create intervention:', error);
          alert('Failed to save intervention');
          vectorSource?.removeFeature(feature);
        }
      } else {
        // Old flow: Open dialog to enter intervention details
        setPendingDrawFeature(feature);
        setAnnotationDialogMode('create');
        setAnnotationDialogOpen(true);
      }
    },
    onSelect: (feature) => {
      if (feature) {
        setEditingAnnotation({ id: feature.get('id'), feature });
        setAnnotationDialogMode('edit');
        setAnnotationDialogOpen(true);
      }
    },
  });

  const { exportToGeoJSON } = useAnnotationExport();

  // Tool change handler - require authentication before drawing/editing
  const handleToolChange = useCallback((tool: DrawingTool) => {
    if (tool !== 'none' && !isAuthenticated) {
      setLoginDialogOpen(true);
      return;
    }
    // For drawing tools (point, line, polygon), open the dialog first
    if (tool === 'point' || tool === 'line' || tool === 'polygon') {
      setAnnotationDialogMode('create');
      setAnnotationDialogOpen(true);
      // Clear any pending data
      setPendingInterventionData(null);
      setPendingDrawFeature(null);
    } else {
      // For other tools (modify, delete, none), activate directly
      setActiveTool(tool);
      setDrawingTool(tool);
    }
  }, [isAuthenticated]);

  // Detect feature type from an OpenLayers geometry
  const detectFeatureType = useCallback((geometry: any): 'point' | 'line' | 'polygon' => {
    const type = geometry.getType();
    if (type === 'Point' || type === 'MultiPoint') return 'point';
    if (type === 'LineString' || type === 'MultiLineString') return 'line';
    if (type === 'Polygon' || type === 'MultiPolygon') return 'polygon';
    return 'polygon'; // fallback
  }, []);

  // Detect source projection from GeoJSON text
  const detectDataProjection = useCallback((text: string, ext: string): string => {
    // KML is always EPSG:4326
    if (ext === 'kml') return 'EPSG:4326';

    try {
      const json = JSON.parse(text);
      // Check for CRS property in GeoJSON
      if (json.crs?.properties?.name) {
        const crsName = json.crs.properties.name;
        if (crsName.includes('32642')) return 'EPSG:32642';
        if (crsName.includes('4326') || crsName.includes('WGS 84')) return 'EPSG:4326';
      }

      // Heuristic: check first coordinate to determine projection
      let firstCoord: number[] | null = null;
      if (json.type === 'FeatureCollection' && json.features?.[0]) {
        const geom = json.features[0].geometry;
        if (geom?.type === 'Point') firstCoord = geom.coordinates;
        else if (geom?.coordinates?.flat) firstCoord = geom.coordinates.flat(Infinity).slice(0, 2);
      } else if (json.type === 'Feature' && json.geometry) {
        const geom = json.geometry;
        if (geom?.type === 'Point') firstCoord = geom.coordinates;
        else if (geom?.coordinates?.flat) firstCoord = geom.coordinates.flat(Infinity).slice(0, 2);
      } else if (json.coordinates) {
        if (json.type === 'Point') firstCoord = json.coordinates;
        else firstCoord = json.coordinates.flat(Infinity).slice(0, 2);
      }

      if (firstCoord && firstCoord.length >= 2) {
        const [x, y] = firstCoord;
        // UTM Zone 42N: easting ~100000-900000, northing ~0-10000000
        if (Math.abs(x) > 180 || Math.abs(y) > 90) {
          return 'EPSG:32642'; // Already projected
        }
      }
    } catch {
      // Fall through to default
    }

    return 'EPSG:4326'; // Default GeoJSON standard
  }, []);

  // Upload intervention handler
  const handleUploadIntervention = useCallback(() => {
    if (!isAuthenticated) {
      setLoginDialogOpen(true);
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.geojson,.json,.kml,.zip';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        document.body.removeChild(input);
        return;
      }

      try {
        const text = await file.text();
        const ext = file.name.split('.').pop()?.toLowerCase();
        let features: Feature[];

        // Detect source projection from file content
        const dataProjection = detectDataProjection(text, ext || 'json');

        if (ext === 'kml') {
          const format = new KML();
          features = format.readFeatures(text, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:32642',
          });
        } else if (ext === 'zip') {
          alert('Shapefile (.zip) support requires conversion to GeoJSON first. Please convert your shapefile to GeoJSON format.');
          document.body.removeChild(input);
          return;
        } else {
          // GeoJSON or JSON — use detected projection
          const format = new GeoJSON();
          features = format.readFeatures(text, {
            dataProjection,
            featureProjection: 'EPSG:32642',
          });
        }

        if (features.length === 0) {
          alert('No features found in the uploaded file.');
          document.body.removeChild(input);
          return;
        }

        // Detect feature type from first feature
        const firstGeom = features[0].getGeometry();
        if (!firstGeom) {
          alert('No geometry found in the uploaded features.');
          document.body.removeChild(input);
          return;
        }

        const featureType = detectFeatureType(firstGeom);
        pendingUploadFeaturesRef.current = features;

        // Add features to vector source so they're visible on the map
        for (const f of features) {
          if (!vectorSource?.getFeatures().includes(f)) {
            vectorSource?.addFeature(f);
          }
        }

        // Open the intervention dialog with detected feature type
        setUploadDefaultValues({ featureType });
        setAnnotationDialogMode('create');
        setAnnotationDialogOpen(true);
      } catch (error) {
        console.error('Failed to parse uploaded file:', error);
        alert('Failed to parse the uploaded file. Please ensure it is a valid GeoJSON or KML file.');
      } finally {
        document.body.removeChild(input);
      }
    };

    input.click();
  }, [isAuthenticated, detectFeatureType, detectDataProjection]);

  // Sync drawingTool state with setActiveTool
  useEffect(() => {
    setActiveTool(drawingTool);
  }, [drawingTool, setActiveTool]);

  // Add vector layer to map (managed by useAnnotationLayer, but we need to ensure it's there)
  useEffect(() => {
    if (map && vectorLayer && !map.getLayers().getArray().includes(vectorLayer)) {
      map.addLayer(vectorLayer);
    }
    return () => {
      if (map && vectorLayer) {
        // Don't remove - useAnnotationLayer manages this
      }
    };
  }, [map, vectorLayer]);

  // Minimum and maximum sidebar width
  const MIN_WIDTH = 200;
  // Dynamic max width: 75% for Compare view, 600px otherwise
  const MAX_WIDTH = currentImpactView === 'compare' || currentRiskView === 'spatial'
    ? Math.floor(window.innerWidth * 0.75)
    : 600;

  // Handle sidebar resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !sidebarRef.current) return;

      const sidebarRect = sidebarRef.current.getBoundingClientRect();
      const newWidth = e.clientX - sidebarRect.left;

      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // Close sidebar when switching to mobile view
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  // Get all layers
  const allLayers = useMemo(() => collectAllLayers(layerTree), []);

  // Combine regular layers with impact layers for MapViewer
  const combinedLayers = useMemo(() => {
    return [...allLayers, ...impactLayers];
  }, [allLayers, impactLayers]);

  // Get currently visible layers (for feature identification and UI display)
  const visibleLayers = useMemo(() => {
    return combinedLayers.filter((layer) => visibleLayerIds.includes(layer.id));
  }, [combinedLayers, visibleLayerIds]);

  // Handle layer visibility change
  const handleLayerVisibilityChange = useCallback((id: string, visible: boolean) => {
    setVisibleLayerIds((prev) => {
      if (visible) {
        // Add ID if not already present (avoid duplicates)
        return prev.includes(id) ? prev : [...prev, id];
      } else {
        // Remove ID
        return prev.filter((layerId) => layerId !== id);
      }
    });
  }, []);

  // Handle layer opacity change
  const handleLayerOpacityChange = useCallback((id: string, opacity: number) => {
    setLayerOpacities((prev) => ({
      ...prev,
      [id]: opacity,
    }));
  }, []);

  // Handle layer selection
  const handleLayerSelect = useCallback((layer: LayerInfo) => {
    setSelectedLayer(layer);
  }, []);

  // Handle impact layers change from ImpactMatrix
  const handleImpactLayersChange = useCallback((layers: LayerInfo[]) => {
    console.log('[App] Impact layers changed:', {
      count: layers.length,
      layers: layers.map(l => l.id)
    });
    setImpactLayers(layers);
  }, []);

  // Annotation handlers
  const handleAnnotationSubmit = useCallback(async (data: {
    name: string;
    interventionType: string;
    featureType: 'point' | 'line' | 'polygon';
    hydrologicalParams: string;
    interventionInfo?: {
      shortDescription: string;
      locationShapeInfo: string;
      hydrologicalParameters: string;
    };
  }) => {
    if (!isAuthenticated) {
      alert('Please sign in first');
      return;
    }

    if (annotationDialogMode === 'create') {
      if (pendingUploadFeaturesRef.current) {
        // UPLOAD FLOW: Features already parsed from file, save each one
        const features = pendingUploadFeaturesRef.current;
        pendingUploadFeaturesRef.current = null;

        let savedCount = 0;
        for (const feature of features) {
          const geom = feature.getGeometry();
          if (!geom) continue;

          const geometryJson = JSON.parse(
            new GeoJSON().writeGeometry(geom, {
              featureProjection: 'EPSG:32642',
              dataProjection: 'EPSG:4326',
            })
          );

          const newAnnotation: NewAnnotation = {
            title: data.name,
            description: data.hydrologicalParams,
            category: 'general',
            geometry_type: data.featureType,
            geometry: geometryJson,
            style_config: {
              color: '#ff0000',
              strokeWidth: 2,
              fillColor: '#ff0000',
              opacity: 0.2,
            },
            created_by: username,
          };

          try {
            const created = await createAnnotation(newAnnotation);
            // Update the uploaded feature in-place with API-returned ID and metadata
            // (don't remove it — useAnnotations.createAnnotation doesn't add to vector source)
            feature.set('id', created.id);
            feature.set('title', data.name);
            feature.set('description', data.hydrologicalParams);
            feature.set('category', 'general');
            feature.set('geometry_type', data.featureType);
            feature.set('styleConfig', {
              color: '#ff0000',
              strokeWidth: 2,
              fillColor: '#ff0000',
              opacity: 0.2,
            });
            feature.set('interventionType', data.interventionType);
            feature.set('interventionInfo', data.interventionInfo);
            feature.set('created_by', username);
            feature.set('created_at', created.created_at);
            feature.set('updated_at', created.updated_at);
            feature.changed();
            savedCount++;
          } catch (error) {
            console.error('Failed to create intervention from upload:', error);
          }
        }

        if (savedCount === 0) {
          alert('Failed to save any interventions from the uploaded file.');
        }

        // Close dialog and reset
        setAnnotationDialogOpen(false);
        setActiveTool('none');
        setDrawingTool('none');
        setUploadDefaultValues(null);
        return;
      } else if (pendingDrawFeature) {
        // OLD FLOW: Drawing already happened, save immediately
        const newAnnotation: NewAnnotation = {
          title: data.name,
          description: data.hydrologicalParams,
          category: 'general',
          geometry_type: data.featureType,
          geometry: JSON.parse(JSON.stringify(
            JSON.parse(new GeoJSON().writeGeometry(pendingDrawFeature.getGeometry()!, {
              featureProjection: 'EPSG:32642',
              dataProjection: 'EPSG:4326',
            }))
          )),
          style_config: {
            color: '#ff0000',
            strokeWidth: 2,
            fillColor: '#ff0000',
            opacity: 0.2,
          },
          created_by: username,
        };

        try {
          const created = await createAnnotation(newAnnotation);
          pendingDrawFeature.set('id', created.id);
          pendingDrawFeature.set('title', data.name);
          pendingDrawFeature.set('description', data.hydrologicalParams);
          pendingDrawFeature.set('category', 'general');
          pendingDrawFeature.set('geometry_type', data.featureType);
          pendingDrawFeature.set('styleConfig', {
            color: '#ff0000',
            strokeWidth: 2,
            fillColor: '#ff0000',
            opacity: 0.2,
          });
          pendingDrawFeature.set('interventionType', data.interventionType);
          pendingDrawFeature.set('interventionInfo', data.interventionInfo);
          pendingDrawFeature.changed();
          setPendingDrawFeature(null);
        } catch (error) {
          console.error('Failed to create intervention:', error);
          alert('Failed to save intervention');
          vectorSource?.removeFeature(pendingDrawFeature);
        }
        // Old flow: close dialog and reset tool immediately
        setAnnotationDialogOpen(false);
        setPendingDrawFeature(null);
        setActiveTool('none');
        setDrawingTool('none');
      } else {
        // NEW FLOW: Store form data and start drawing
        // Do NOT close dialog or reset pendingInterventionData here —
        // those will be cleaned up after drawing completes in onDrawEnd
        setPendingInterventionData(data);
        setAnnotationDialogOpen(false);
        setActiveTool(data.featureType);
        setDrawingTool(data.featureType);
        return; // Don't fall through to the reset block below
      }
    } else if (annotationDialogMode === 'edit' && editingAnnotation) {
      // Update existing intervention
      try {
        const updated = await updateAnnotation(editingAnnotation.id, {
          title: data.name,
          description: data.hydrologicalParams,
          category: 'general',
          geometry_type: data.featureType,
          style_config: {
            color: '#ff0000',
            strokeWidth: 2,
            fillColor: '#ff0000',
            opacity: 0.2,
          },
        });

        // Update feature properties
        editingAnnotation.feature.set('title', updated.title);
        editingAnnotation.feature.set('description', updated.description);
        editingAnnotation.feature.set('category', updated.category);
        editingAnnotation.feature.set('geometry_type', updated.geometry_type);
        editingAnnotation.feature.changed();

        // Refresh interventions list
        await loadInterventions();
      } catch (error) {
        console.error('Failed to update intervention:', error);
        alert('Failed to update intervention');
      }
      // Deactivate modify tool after editing
      setActiveTool('none');
      setDrawingTool('none');
    }

    // Close dialog and reset state (only reached for old flow and edit flow)
    setAnnotationDialogOpen(false);
    setAnnotationDialogMode('create');
    setPendingInterventionData(null);
    setEditingAnnotation(null);
  }, [
    isAuthenticated,
    annotationDialogMode,
    pendingDrawFeature,
    editingAnnotation,
    username,
    createAnnotation,
    updateAnnotation,
    loadInterventions,
    vectorSource,
    setActiveTool,
    setDrawingTool,
  ]);

  const handleAnnotationDelete = useCallback(async (id: number) => {
    try {
      // Remove feature from vector source immediately
      const feature = vectorSource?.getFeatures().find((f: Feature) => f.get('id') === id);
      if (feature) {
        vectorSource?.removeFeature(feature);
      }
      await deleteAnnotation(id);
    } catch (error) {
      console.error('Failed to delete intervention:', error);
      alert('Failed to delete intervention');
    }
  }, [deleteAnnotation, vectorSource]);

  const handleAnnotationClick = useCallback((annotation: Annotation) => {
    // Find feature and zoom to it
    const feature = vectorSource?.getFeatures().find((f: Feature) => f.get('id') === annotation.id);
    if (feature && feature.getGeometry()) {
      const extent = feature.getGeometry()!.getExtent();
      const mapInstance = mapViewerRef.current?.getMap();
      if (mapInstance) {
        mapInstance.getView().fit(extent, { padding: [50, 50, 50, 50], duration: 500 });
      }
    }
  }, [vectorSource]);

  const handleExportAnnotations = useCallback(() => {
    const features = vectorSource?.getFeatures() || [];
    if (features.length === 0) {
      alert('No interventions to export');
      return;
    }
    exportToGeoJSON(features);
  }, [vectorSource, exportToGeoJSON]);

  const handleToggleAnnotationsPanel = useCallback(() => {
    setSidebarView('interventions');
    if (!sidebarOpen) {
      setSidebarOpen(true);
    }
  }, [sidebarOpen]);

  // Handle map click (stable reference to prevent map re-initialization)
  const handleMapClick = useCallback(async (coord: number[], pixel: number[]) => {
    // Skip WMS feature identification when in drawing mode
    if (drawingTool !== 'none') {
      console.log('Drawing mode active, skipping feature identification');
      return;
    }

    console.log('Map clicked at:', coord, 'pixel:', pixel);

    // Show identify popup at click position
    const mapElement = document.querySelector('.ol-viewport');
    if (!mapElement) return;

    // Get visible WMS layer names (all layers, including vector)
    const visibleWmsLayers = visibleLayers
      .map(l => ({ name: l.geoserverName, workspace: l.workspace, layerInfo: l }));

    console.log('Visible WMS layers:', visibleWmsLayers);

    let features: any[] = [];

    // Query GeoServer for each visible WMS layer
    for (const layer of visibleWmsLayers) {
      try {
        // Use smaller bbox for point features to avoid getting multiple nearby points
        const isPointLayer = layer.layerInfo.geometryType === 'point';
        const bboxSize = isPointLayer ? 5 : 50; // 5m for points, 50m for others
        const featureCount = isPointLayer ? 1 : 10; // Limit to 1 for points
        const bbox = `${coord[0] - bboxSize},${coord[1] - bboxSize},${coord[0] + bboxSize},${coord[1] + bboxSize}`;

        const params = new URLSearchParams();
        params.append('SERVICE', 'WMS');
        params.append('VERSION', '1.1.1');
        params.append('REQUEST', 'GetFeatureInfo');
        if (layer.name) {
          params.append('LAYERS', layer.name);
          params.append('QUERY_LAYERS', layer.name);
        }
        params.append('INFO_FORMAT', 'application/json');
        params.append('FEATURE_COUNT', String(featureCount));
        params.append('SRS', 'EPSG:32642');
        params.append('BBOX', bbox);
        params.append('WIDTH', '11');
        params.append('HEIGHT', '11');
        params.append('X', '5');
        params.append('Y', '5');

        const url = `/geoserver/${layer.workspace}/wms?${params}`;
        console.log('GetFeatureInfo URL:', url);

        const response = await fetch(url);
        console.log('Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('Feature data:', data);

          if (data.features && data.features.length > 0) {
            // For point layers, find the closest feature to click point
            let featuresToAdd = data.features;
            if (isPointLayer && data.features.length > 1) {
              featuresToAdd = data.features
                .map((f: any) => ({
                  feature: f,
                  distance: f.geometry?.coordinates
                    ? Math.sqrt(
                        Math.pow((f.geometry.coordinates[0] ?? 0) - coord[0], 2) +
                        Math.pow((f.geometry.coordinates[1] ?? 0) - coord[1], 2)
                      )
                    : Infinity,
                }))
                .sort((a: any, b: any) => a.distance - b.distance)
                .slice(0, 1)
                .map((item: any) => item.feature);
            }

            features.push(...featuresToAdd.map((f: any) => ({
              layer: layer.layerInfo.name,
              properties: f.properties || {},
            })));
          }
        } else {
          console.warn('GetFeatureInfo failed:', response.status, response.statusText);
        }
      } catch (error) {
        console.warn('GetFeatureInfo failed for layer:', layer.name, error);
      }
    }

    console.log('Final features:', features);

    setIdentifyPopup({
      coordinate: coord,
      position: { x: pixel[0], y: pixel[1] },
      features,
    });
  }, [visibleLayers, drawingTool]);

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <Header
        onToggleSidebar={toggleSidebar}
        sidebarOpen={sidebarOpen}
        activeTool={activeTool}
        onToolChange={handleToolChange}
        onExport={handleExportAnnotations}
        onUpload={handleUploadIntervention}
        onToggleInterventionsPanel={handleToggleAnnotationsPanel}
        interventionsCount={interventions.length}
        isAuthenticated={isAuthenticated}
      />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden min-w-0 relative">
        {/* Mobile sidebar overlay backdrop */}
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={toggleSidebar}
          />
        )}

        {/* Sidebar with layer tree */}
        <aside
          ref={sidebarRef}
          style={!isMobile && sidebarOpen ? { width: `${sidebarWidth}px` } : undefined}
          className={cn(
            'bg-white border-r border-slate-200 transition-all duration-300 ease-in-out flex flex-col z-50',
            // Desktop: slide in from left
            !isMobile && (sidebarOpen ? '' : 'w-0 overflow-hidden'),
            // Mobile: full-width overlay
            isMobile && (sidebarOpen ? 'w-full absolute inset-y-0 left-0' : 'w-0 overflow-hidden')
          )}
        >
          {/* Mobile close button */}
          {isMobile && sidebarOpen && (
            <div className="flex items-center justify-between p-3 border-b border-slate-200">
              <h2 className="text-sm font-semibold text-slate-800">
                {sidebarView === 'layers' ? 'Hazard' : sidebarView === 'impact' ? 'Impact Analysis' : sidebarView === 'risk' ? 'Risk Dashboard' : 'Interventions'}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Desktop tab switcher */}
          {!isMobile && sidebarOpen && (
            <div className="flex items-center gap-1 p-2 border-b border-slate-200 bg-slate-50">
              <Button
                variant={sidebarView === 'layers' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSidebarView('layers')}
                className="flex-1 gap-1.5 h-8 text-xs"
              >
                <Layers className="w-3.5 h-3.5" />
                Hazard
              </Button>
              <Button
                variant={sidebarView === 'impact' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSidebarView('impact')}
                className="flex-1 gap-1.5 h-8 text-xs"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Impact
              </Button>
              <Button
                variant={sidebarView === 'risk' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSidebarView('risk')}
                className="flex-1 gap-1.5 h-8 text-xs"
              >
                <Shield className="w-3.5 h-3.5" />
                Risk
              </Button>
              <Button
                variant={sidebarView === 'interventions' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSidebarView('interventions')}
                className="flex-1 gap-1.5 h-8 text-xs"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                Interventions
              </Button>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {sidebarView === 'layers' ? (
                <LayerTree
                root={layerTree}
                onLayerVisibilityChange={handleLayerVisibilityChange}
                onLayerOpacityChange={handleLayerOpacityChange}
                onLayerSelect={handleLayerSelect}
                selectedLayerId={selectedLayer?.id}
                visibleLayerIds={visibleLayerIds}
              />
            ) : sidebarView === 'impact' ? (
              <ImpactMatrix
                onLayerToggle={handleLayerVisibilityChange}
                visibleLayers={visibleLayerIds}
                onImpactLayersChange={handleImpactLayersChange}
                onViewChange={setCurrentImpactView}
                className="h-full"
              />
            ) : sidebarView === 'risk' ? (
              <RiskDashboard
                onViewChange={setCurrentRiskView}
                onChoroplethData={setChoroplethData}
                className="h-full"
              />
            ) : (
              <InterventionPanel
                interventions={interventions}
                isLoading={interventionsLoading}
                onInterventionClick={handleAnnotationClick}
                onInterventionEdit={(intervention) => {
                  const feature = vectorSource?.getFeatures().find((f: Feature) => f.get('id') === intervention.id);
                  if (feature) {
                    setEditingAnnotation({ id: intervention.id, feature });
                    setAnnotationDialogMode('edit');
                    setAnnotationDialogOpen(true);
                  }
                }}
                onInterventionDelete={handleAnnotationDelete}
                onInterventionToggleVisibility={(id, visible) => {
                  const feature = vectorSource?.getFeatures().find((f: Feature) => f.get('id') === id);
                  if (feature) {
                    feature.set('visible', visible);
                    // Trigger both source and layer to re-render
                    vectorSource?.changed();
                    vectorLayer?.changed();
                  }
                }}
                onToolChange={handleToolChange}
              />
            )}
          </div>
        </aside>

        {/* Sidebar resize handle */}
        {!isMobile && sidebarOpen && (
          <div
            className="absolute top-0 bottom-0 w-1 bg-slate-200 hover:bg-blue-500 cursor-col-resize z-50 flex items-center justify-center group"
            style={{ left: `${sidebarWidth}px` }}
            onMouseDown={handleMouseDown}
          >
            <GripVertical className="w-4 h-4 text-slate-400 group-hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}

        {/* Sidebar toggle button (when closed) */}
        {!sidebarOpen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn(
              "z-10 bg-white shadow-md hover:bg-slate-50",
              isMobile
                ? "absolute bottom-4 right-4 h-12 w-12 rounded-full"
                : "absolute left-4 top-20"
            )}
          >
            <PanelLeft className="w-5 h-5 text-slate-600" />
          </Button>
        )}

        {/* Swipe Compare button */}
        <Button
          variant="default"
          size="sm"
          onClick={() => setSwipeCompareOpen(true)}
          className="absolute top-4 right-20 z-10 bg-blue-600 hover:bg-blue-700 shadow-lg"
        >
          <ArrowLeftRight className="w-4 h-4 mr-2" />
          Swipe Compare
        </Button>

        {/* Map container */}
        <main className="flex-1 relative overflow-hidden">
          <MapViewer
            ref={mapViewerRef}
            visibleLayerIds={visibleLayerIds}
            allLayers={combinedLayers}
            layerOpacities={layerOpacities}
            onMapClick={handleMapClick}
          />

          {/* Legend panel */}
          <LegendPanel
            layer={selectedLayer}
            onClose={() => setSelectedLayer(null)}
          />

          {/* Feature identify popup */}
          {identifyPopup && (
            <FeaturePopup
              position={identifyPopup.position}
              coordinate={identifyPopup.coordinate}
              features={identifyPopup.features}
              onClose={() => setIdentifyPopup(null)}
            />
          )}

          {/* Layer info overlay - hidden on mobile */}
          {!isMobile && visibleLayers.length > 0 && (
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 z-10 max-w-xs">
              <h3 className="text-xs font-semibold text-slate-700 mb-1">
                Active Layers
              </h3>
              <p className="text-xs text-slate-500">
                {visibleLayers.length} layer{visibleLayers.length !== 1 ? 's' : ''} visible
              </p>
              <div className="mt-2 max-h-48 overflow-y-auto scrollbar-thin">
                {visibleLayers.map((layer) => (
                  <div
                    key={layer.id}
                    className="text-xs text-slate-600 py-0.5 truncate"
                    title={layer.name}
                  >
                    • {layer.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Swipe Compare Modal */}
      {swipeCompareOpen && (
        <SwipeCompare
          onClose={() => setSwipeCompareOpen(false)}
        />
      )}

      {/* Intervention Dialog */}
      <InterventionDialog
        isOpen={annotationDialogOpen}
        onClose={() => {
          setAnnotationDialogOpen(false);
          setPendingDrawFeature(null);
          setEditingAnnotation(null);
          setUploadDefaultValues(null);
          // Remove uploaded features from map on cancel
          if (pendingUploadFeaturesRef.current && vectorSource) {
            for (const f of pendingUploadFeaturesRef.current) {
              vectorSource.removeFeature(f);
            }
          }
          pendingUploadFeaturesRef.current = null;
          // Clear the drawn feature if cancelling from create mode
          if (annotationDialogMode === 'create' && pendingDrawFeature) {
            vectorSource?.removeFeature(pendingDrawFeature);
          }
        }}
        onSubmit={handleAnnotationSubmit}
        defaultValues={
          editingAnnotation
            ? {
                name: editingAnnotation.feature.get('title') || '',
                interventionType: editingAnnotation.feature.get('interventionType') || '',
                featureType: editingAnnotation.feature.get('geometry_type') || 'point',
                hydrologicalParams: editingAnnotation.feature.get('description') || '',
              }
            : uploadDefaultValues
              ? { featureType: uploadDefaultValues.featureType }
              : undefined
        }
        mode={annotationDialogMode}
      />

      {/* Login Dialog - shown only when user clicks a draw/edit tool without authentication */}
      <LoginDialog
        isOpen={loginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
        onLoginSuccess={() => {
          setLoginDialogOpen(false);
          // After successful login, if a tool was selected, activate it
          if (drawingTool !== 'none') {
            setActiveTool(drawingTool);
          }
        }}
      />
    </div>
  );
}

export default App;
