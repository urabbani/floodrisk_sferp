import type { LayerGroup, LayerInfo, GeometryType, Z_INDEX_PRIORITY } from '@/types/layers';

// GeoServer configuration
export const GEOSERVER_CONFIG = {
  baseUrl: '/geoserver', // Proxied to http://10.0.0.205:8080/geoserver via Vite
  workspaces: {
    results: 'results',
    dem: 'DEM',
  },
  wmsVersion: '1.1.1',
};

// Map configuration
export const MAP_CONFIG = {
  projection: 'EPSG:32642', // WGS 84 / UTM zone 42N
  center: [439335, 3080045], // Center of AOI
  zoom: 10,
  extent: [309082.5, 2853827.75, 569587.5, 3306262.25],
};

// Build layer name for GeoServer (matches actual layer naming: lowercase t3, scenario, parameter)
function buildLayerName(
  scenario: string,
  maintenance: string,
  returnPeriod: string,
  parameter: string
): string {
  // Convert to match actual GeoServer layer names: t3_{rp}yrs_{scenario}_{maintenance}_{parameter}
  return `t3_${returnPeriod}yrs_${scenario.toLowerCase()}_${maintenance.toLowerCase()}_${parameter.toLowerCase()}`;
}

// Create raster layer info
function createRasterLayer(
  name: string,
  geoserverName: string,
  visible: boolean = false,
  opacity: number = 0.8,
  workspace: string = GEOSERVER_CONFIG.workspaces.results,
  geometryType: GeometryType = 'raster'
): LayerInfo {
  return {
    id: geoserverName,
    name,
    type: 'wms',
    geometryType,
    visible,
    opacity,
    geoserverName,
    workspace,
    legendUrl: `${GEOSERVER_CONFIG.baseUrl}/wms?REQUEST=GetLegendGraphic&VERSION=1.1.1&FORMAT=image/png&LAYER=${workspace}:${geoserverName}`,
  };
}

// Create vector layer info
function createVectorLayer(
  name: string,
  geoserverName: string,
  visible: boolean = false,
  opacity: number = 1,
  workspace: string = GEOSERVER_CONFIG.workspaces.results,
  geometryType: GeometryType = 'line'
): LayerInfo {
  return {
    id: geoserverName,
    name,
    type: 'wms',
    geometryType,
    visible,
    opacity,
    geoserverName,
    workspace,
  };
}

// Generate flood scenario layers for a given scenario and maintenance level
function generateFloodScenarioLayers(
  scenario: string,
  maintenance: string
): LayerGroup[] {
  // Parameter names match actual GeoServer layer naming (lowercase)
  const parameters = ['maxdepth', 'maxvelocity', 'duration', 'vh'];
  const returnPeriods = ['2.3', '5', '10', '25', '50', '100', '500'];

  const paramLabels: Record<string, string> = {
    maxdepth: 'Depth',
    maxvelocity: 'Velocity',
    duration: 'Duration',
    vh: 'V × h',
  };

  return parameters.map((param) => ({
    id: `${scenario}_${maintenance}_${param}`,
    name: paramLabels[param],
    expanded: false,
    visible: false,
    children: returnPeriods.map((rp) =>
      createRasterLayer(
        `${rp} Years`,
        buildLayerName(scenario, maintenance, rp, param),
        false,
        0.8
      )
    ),
  }));
}

// Main layer tree structure matching QGIS project
export const layerTree: LayerGroup = {
  id: 'root',
  name: 'Layers',
  expanded: true,
  visible: true,
  children: [
    // Survey Group
    {
      id: 'survey',
      name: 'Survey',
      expanded: false,
      visible: false,
      children: [
        createVectorLayer('DGPS Survey Points', 'dgps_11apr_09aug2025', false, 1, GEOSERVER_CONFIG.workspaces.results, 'point'),
      ],
    },

    // Structures Group
    {
      id: 'structures',
      name: 'Structures',
      expanded: false,
      visible: false,
      children: [
        createVectorLayer('Structures', 'structures', false, 1, GEOSERVER_CONFIG.workspaces.results, 'polygon'),
        createVectorLayer('Canal Network', 'canal_network', false, 1, GEOSERVER_CONFIG.workspaces.results, 'line'),
        createVectorLayer('Drains', 'drains', false, 1, GEOSERVER_CONFIG.workspaces.results, 'line'),
      ],
    },

    // Supporting Layers
    {
      id: 'supporting',
      name: 'Supporting Layers',
      expanded: false,
      visible: true,
      children: [
        createVectorLayer('Area of Interest', 'aoi', false, 0.6, GEOSERVER_CONFIG.workspaces.results, 'polygon'),
        createVectorLayer('Sindh Province', 'sindh_province', false, 0.4, GEOSERVER_CONFIG.workspaces.results, 'polygon'),
        createVectorLayer('Sub-Catchments', 'subcatchments', false, 0.5, GEOSERVER_CONFIG.workspaces.results, 'polygon'),
      ],
    },
    
    // Present Climate
    {
      id: 'present_climate',
      name: 'Present Climate',
      expanded: true,
      visible: true,
      children: [
        {
          id: 'present_breaches',
          name: 'Maintenance - Breaches',
          expanded: false,
          visible: false,
          children: generateFloodScenarioLayers('Present', 'Breaches'),
        },
        {
          id: 'present_redcapacity',
          name: 'Maintenance - Reduced Capacity',
          expanded: false,
          visible: false,
          children: generateFloodScenarioLayers('Present', 'RedCapacity'),
        },
        {
          id: 'present_perfect',
          name: 'Maintenance - Perfect',
          expanded: false,
          visible: false,
          children: generateFloodScenarioLayers('Present', 'Perfect'),
        },
      ],
    },
    
    // Future Climate
    {
      id: 'future_climate',
      name: 'Future Climate',
      expanded: false,
      visible: false,
      children: [
        {
          id: 'future_breaches',
          name: 'Maintenance - Breaches',
          expanded: false,
          visible: false,
          children: generateFloodScenarioLayers('Future', 'Breaches'),
        },
        {
          id: 'future_redcapacity',
          name: 'Maintenance - Reduced Capacity',
          expanded: false,
          visible: false,
          children: generateFloodScenarioLayers('Future', 'RedCapacity'),
        },
        {
          id: 'future_perfect',
          name: 'Maintenance - Perfect',
          expanded: false,
          visible: false,
          children: generateFloodScenarioLayers('Future', 'Perfect'),
        },
      ],
    },
    
    // Flood 2022 Actual Event
    {
      id: 'flood2022',
      name: 'Flood 2022 (Actual Event)',
      expanded: false,
      visible: false,
      children: [
        createRasterLayer('Max Depth', 't3_flood2022_maxdepth', false),
        createRasterLayer('Max Velocity', 't3_flood2022_maxvelocity', false),
        createRasterLayer('Duration', 't3_flood2022_duration', false),
        createRasterLayer('V × h', 't3_flood2022_vh', false),
      ],
    },
    
    // HDTM (DEM workspace)
    {
      id: 'hdtm',
      name: 'HDTM',
      expanded: false,
      visible: false,
      children: [
        createRasterLayer('HDTM Tile 1 (e68n26)', '1_e68n26_HDTM1mV2', false, 1, GEOSERVER_CONFIG.workspaces.dem),
        createRasterLayer('HDTM Tile 2 (e67n26)', '2_e67n26_HDTM1mV3', false, 1, GEOSERVER_CONFIG.workspaces.dem),
        createRasterLayer('HDTM Tile 3 (e68n27)', '3_e68n27_HDTM1mV2', false, 1, GEOSERVER_CONFIG.workspaces.dem),
        createRasterLayer('HDTM Tile 4 (e67n27)', '4_e67n27_HDTM1mV2', false, 1, GEOSERVER_CONFIG.workspaces.dem),
        createRasterLayer('HDTM Tile 5 (e69n28)', '5_e69n28_HDTM1m', false, 1, GEOSERVER_CONFIG.workspaces.dem),
        createRasterLayer('HDTM Tile 6 (e68n28)', '6_e68n28_HDTM1m', false, 1, GEOSERVER_CONFIG.workspaces.dem),
        createRasterLayer('HDTM Tile 7 (e67n28)', '7_e67n28_HDTM1m', false, 1, GEOSERVER_CONFIG.workspaces.dem),
        createRasterLayer('HDTM Tile 8 (e68n29)', '8_e68n29_HDTM1m', false, 1, GEOSERVER_CONFIG.workspaces.dem),
        createRasterLayer('HDTM Tile 9 (e67n29)', '9_e67n29_HDTM1m', false, 1, GEOSERVER_CONFIG.workspaces.dem),
      ],
    },
  ],
};

// Base map options
export const baseMaps = [
  {
    id: 'satellite',
    name: 'Google Satellite',
    url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    visible: true,
  },
  {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    visible: false,
  },
  {
    id: 'terrain',
    name: 'Terrain',
    url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
    visible: false,
  },
];
