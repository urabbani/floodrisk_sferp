#!/usr/bin/env node
/**
 * Create and upload geometry-specific styles for impact layers
 * - impact_depth_point: For point layers (BHU, Telecom_Towers)
 * - impact_depth_line: For line layers (Electric_Grid, Railways, Roads)
 * - impact_depth_polygon: For polygon layers (Buildings, Built_up_Area, Cropped_Area, Settlements)
 */

import http from 'http';
import fs from 'fs';

const GEOSERVER_HOST = '10.0.0.205';
const GEOSERVER_PORT = 8080;
const WORKSPACE = 'exposures';
const AUTH = Buffer.from('admin:geoserver').toString('base64');

// Geometry type mappings
const POINT_LAYERS = ['BHU', 'Telecom_Towers', 'Settlements'];
const LINE_LAYERS = ['Electric_Grid', 'Railways', 'Roads'];
const POLYGON_LAYERS = ['Buildings', 'Built_up_Area', 'Cropped_Area'];

async function uploadStyle(styleName, sldContent) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: GEOSERVER_HOST,
      port: GEOSERVER_PORT,
      path: `/geoserver/rest/workspaces/${WORKSPACE}/styles/${styleName}`,
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${AUTH}`,
        'Content-Type': 'application/vnd.ogc.sld+xml',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 201 || res.statusCode === 200 || res.statusCode === 405) {
          // 405 means method not allowed but style might exist, try POST
          resolve(true);
        } else {
          reject(new Error(`Failed to upload ${styleName}: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(sldContent);
    req.end();
  });
}

function createPointStyleSLD() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xlink="http://www.w3.org/1999/xlink">
  <NamedLayer>
    <Name>impact_depth_point</Name>
    <UserStyle>
      <Title>Impact Depth - Point Layers</Title>
      <FeatureTypeStyle>
        <Rule>
          <Name>above5m</Name>
          <ogc:Filter>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>depth_bin</ogc:PropertyName>
              <ogc:Literal>above5m</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <PointSymbolizer>
            <Graphic>
              <Mark>
                <WellKnownName>circle</WellKnownName>
                <Fill>
                  <CssParameter name="fill">#8B0000</CssParameter>
                  <CssParameter name="fill-opacity">0.8</CssParameter>
                </Fill>
                <Stroke>
                  <CssParameter name="stroke">#5A0000</CssParameter>
                  <CssParameter name="stroke-width">1</CssParameter>
                </Stroke>
              </Mark>
              <Size>8</Size>
            </Graphic>
          </PointSymbolizer>
        </Rule>
        <Rule>
          <Name>4-5m</Name>
          <ogc:Filter>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>depth_bin</ogc:PropertyName>
              <ogc:Literal>4-5m</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <PointSymbolizer>
            <Graphic>
              <Mark>
                <WellKnownName>circle</WellKnownName>
                <Fill>
                  <CssParameter name="fill">#DC143C</CssParameter>
                  <CssParameter name="fill-opacity">0.8</CssParameter>
                </Fill>
                <Stroke>
                  <CssParameter name="stroke">#A00E2A</CssParameter>
                  <CssParameter name="stroke-width">1</CssParameter>
                </Stroke>
              </Mark>
              <Size>8</Size>
            </Graphic>
          </PointSymbolizer>
        </Rule>
        <Rule>
          <Name>3-4m</Name>
          <ogc:Filter>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>depth_bin</ogc:PropertyName>
              <ogc:Literal>3-4m</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <PointSymbolizer>
            <Graphic>
              <Mark>
                <WellKnownName>circle</WellKnownName>
                <Fill>
                  <CssParameter name="fill">#FF6347</CssParameter>
                  <CssParameter name="fill-opacity">0.8</CssParameter>
                </Fill>
                <Stroke>
                  <CssParameter name="stroke">#CC3F2E</CssParameter>
                  <CssParameter name="stroke-width">1</CssParameter>
                </Stroke>
              </Mark>
              <Size>8</Size>
            </Graphic>
          </PointSymbolizer>
        </Rule>
        <Rule>
          <Name>2-3m</Name>
          <ogc:Filter>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>depth_bin</ogc:PropertyName>
              <ogc:Literal>2-3m</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <PointSymbolizer>
            <Graphic>
              <Mark>
                <WellKnownName>circle</WellKnownName>
                <Fill>
                  <CssParameter name="fill">#FFA500</CssParameter>
                  <CssParameter name="fill-opacity">0.8</CssParameter>
                </Fill>
                <Stroke>
                  <CssParameter name="stroke">#CC8400</CssParameter>
                  <CssParameter name="stroke-width">1</CssParameter>
                </Stroke>
              </Mark>
              <Size>8</Size>
            </Graphic>
          </PointSymbolizer>
        </Rule>
        <Rule>
          <Name>1-2m</Name>
          <ogc:Filter>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>depth_bin</ogc:PropertyName>
              <ogc:Literal>1-2m</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <PointSymbolizer>
            <Graphic>
              <Mark>
                <WellKnownName>circle</WellKnownName>
                <Fill>
                  <CssParameter name="fill">#FFD700</CssParameter>
                  <CssParameter name="fill-opacity">0.8</CssParameter>
                </Fill>
                <Stroke>
                  <CssParameter name="stroke">#CCAD00</CssParameter>
                  <CssParameter name="stroke-width">1</CssParameter>
                </Stroke>
              </Mark>
              <Size>8</Size>
            </Graphic>
          </PointSymbolizer>
        </Rule>
        <Rule>
          <Name>15-100cm</Name>
          <ogc:Filter>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>depth_bin</ogc:PropertyName>
              <ogc:Literal>15-100cm</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <PointSymbolizer>
            <Graphic>
              <Mark>
                <WellKnownName>circle</WellKnownName>
                <Fill>
                  <CssParameter name="fill">#90EE90</CssParameter>
                  <CssParameter name="fill-opacity">0.8</CssParameter>
                </Fill>
                <Stroke>
                  <CssParameter name="stroke">#73BC73</CssParameter>
                  <CssParameter name="stroke-width">1</CssParameter>
                </Stroke>
              </Mark>
              <Size>8</Size>
            </Graphic>
          </PointSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>`;
}

function createLineStyleSLD() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xlink="http://www.w3.org/1999/xlink">
  <NamedLayer>
    <Name>impact_depth_line</Name>
    <UserStyle>
      <Title>Impact Depth - Line Layers</Title>
      <FeatureTypeStyle>
        <Rule>
          <Name>above5m</Name>
          <ogc:Filter>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>depth_bin</ogc:PropertyName>
              <ogc:Literal>above5m</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <LineSymbolizer>
            <Stroke>
              <CssParameter name="stroke">#8B0000</CssParameter>
              <CssParameter name="stroke-width">3</CssParameter>
              <CssParameter name="stroke-opacity">0.8</CssParameter>
            </Stroke>
          </LineSymbolizer>
        </Rule>
        <Rule>
          <Name>4-5m</Name>
          <ogc:Filter>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>depth_bin</ogc:PropertyName>
              <ogc:Literal>4-5m</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <LineSymbolizer>
            <Stroke>
              <CssParameter name="stroke">#DC143C</CssParameter>
              <CssParameter name="stroke-width">3</CssParameter>
              <CssParameter name="stroke-opacity">0.8</CssParameter>
            </Stroke>
          </LineSymbolizer>
        </Rule>
        <Rule>
          <Name>3-4m</Name>
          <ogc:Filter>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>depth_bin</ogc:PropertyName>
              <ogc:Literal>3-4m</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <LineSymbolizer>
            <Stroke>
              <CssParameter name="stroke">#FF6347</CssParameter>
              <CssParameter name="stroke-width">3</CssParameter>
              <CssParameter name="stroke-opacity">0.8</CssParameter>
            </Stroke>
          </LineSymbolizer>
        </Rule>
        <Rule>
          <Name>2-3m</Name>
          <ogc:Filter>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>depth_bin</ogc:PropertyName>
              <ogc:Literal>2-3m</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <LineSymbolizer>
            <Stroke>
              <CssParameter name="stroke">#FFA500</CssParameter>
              <CssParameter name="stroke-width">3</CssParameter>
              <CssParameter name="stroke-opacity">0.8</CssParameter>
            </Stroke>
          </LineSymbolizer>
        </Rule>
        <Rule>
          <Name>1-2m</Name>
          <ogc:Filter>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>depth_bin</ogc:PropertyName>
              <ogc:Literal>1-2m</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <LineSymbolizer>
            <Stroke>
              <CssParameter name="stroke">#FFD700</CssParameter>
              <CssParameter name="stroke-width">3</CssParameter>
              <CssParameter name="stroke-opacity">0.8</CssParameter>
            </Stroke>
          </LineSymbolizer>
        </Rule>
        <Rule>
          <Name>15-100cm</Name>
          <ogc:Filter>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>depth_bin</ogc:PropertyName>
              <ogc:Literal>15-100cm</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <LineSymbolizer>
            <Stroke>
              <CssParameter name="stroke">#90EE90</CssParameter>
              <CssParameter name="stroke-width">3</CssParameter>
              <CssParameter name="stroke-opacity">0.8</CssParameter>
            </Stroke>
          </LineSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>`;
}

function createPolygonStyleSLD() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xlink="http://www.w3.org/1999/xlink">
  <NamedLayer>
    <Name>impact_depth_polygon</Name>
    <UserStyle>
      <Title>Impact Depth - Polygon Layers</Title>
      <FeatureTypeStyle>
        <Rule>
          <Name>above5m</Name>
          <ogc:Filter>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>depth_bin</ogc:PropertyName>
              <ogc:Literal>above5m</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <PolygonSymbolizer>
            <Fill>
              <CssParameter name="fill">#8B0000</CssParameter>
              <CssParameter name="fill-opacity">0.7</CssParameter>
            </Fill>
            <Stroke>
              <CssParameter name="stroke">#5A0000</CssParameter>
              <CssParameter name="stroke-width">1</CssParameter>
              <CssParameter name="stroke-opacity">0.8</CssParameter>
            </Stroke>
          </PolygonSymbolizer>
        </Rule>
        <Rule>
          <Name>4-5m</Name>
          <ogc:Filter>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>depth_bin</ogc:PropertyName>
              <ogc:Literal>4-5m</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <PolygonSymbolizer>
            <Fill>
              <CssParameter name="fill">#DC143C</CssParameter>
              <CssParameter name="fill-opacity">0.7</CssParameter>
            </Fill>
            <Stroke>
              <CssParameter name="stroke">#A00E2A</CssParameter>
              <CssParameter name="stroke-width">1</CssParameter>
              <CssParameter name="stroke-opacity">0.8</CssParameter>
            </Stroke>
          </PolygonSymbolizer>
        </Rule>
        <Rule>
          <Name>3-4m</Name>
          <ogc:Filter>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>depth_bin</ogc:PropertyName>
              <ogc:Literal>3-4m</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <PolygonSymbolizer>
            <Fill>
              <CssParameter name="fill">#FF6347</CssParameter>
              <CssParameter name="fill-opacity">0.7</CssParameter>
            </Fill>
            <Stroke>
              <CssParameter name="stroke">#CC3F2E</CssParameter>
              <CssParameter name="stroke-width">1</CssParameter>
              <CssParameter name="stroke-opacity">0.8</CssParameter>
            </Stroke>
          </PolygonSymbolizer>
        </Rule>
        <Rule>
          <Name>2-3m</Name>
          <ogc:Filter>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>depth_bin</ogc:PropertyName>
              <ogc:Literal>2-3m</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <PolygonSymbolizer>
            <Fill>
              <CssParameter name="fill">#FFA500</CssParameter>
              <CssParameter name="fill-opacity">0.7</CssParameter>
            </Fill>
            <Stroke>
              <CssParameter name="stroke">#CC8400</CssParameter>
              <CssParameter name="stroke-width">1</CssParameter>
              <CssParameter name="stroke-opacity">0.8</CssParameter>
            </Stroke>
          </PolygonSymbolizer>
        </Rule>
        <Rule>
          <Name>1-2m</Name>
          <ogc:Filter>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>depth_bin</ogc:PropertyName>
              <ogc:Literal>1-2m</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <PolygonSymbolizer>
            <Fill>
              <CssParameter name="fill">#FFD700</CssParameter>
              <CssParameter name="fill-opacity">0.7</CssParameter>
            </Fill>
            <Stroke>
              <CssParameter name="stroke">#CCAD00</CssParameter>
              <CssParameter name="stroke-width">1</CssParameter>
              <CssParameter name="stroke-opacity">0.8</CssParameter>
            </Stroke>
          </PolygonSymbolizer>
        </Rule>
        <Rule>
          <Name>15-100cm</Name>
          <ogc:Filter>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>depth_bin</ogc:PropertyName>
              <ogc:Literal>15-100cm</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <PolygonSymbolizer>
            <Fill>
              <CssParameter name="fill">#90EE90</CssParameter>
              <CssParameter name="fill-opacity">0.7</CssParameter>
            </Fill>
            <Stroke>
              <CssParameter name="stroke">#73BC73</CssParameter>
              <CssParameter name="stroke-width">1</CssParameter>
              <CssParameter name="stroke-opacity">0.8</CssParameter>
            </Stroke>
          </PolygonSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>`;
}

async function getLayers() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: GEOSERVER_HOST,
      port: GEOSERVER_PORT,
      path: `/geoserver/rest/workspaces/${WORKSPACE}/layers.json`,
      method: 'GET',
      headers: {
        'Authorization': `Basic ${AUTH}`,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          const json = JSON.parse(data);
          const layers = json.layers.layer.map(l => l.name);
          resolve(layers);
        } else {
          reject(new Error(`Failed to get layers: ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

function getGeometryType(layerName) {
  // Check if layer name ends with any of the known layer types
  for (const layerType of POINT_LAYERS) {
    if (layerName.endsWith(layerType)) return 'point';
  }
  for (const layerType of LINE_LAYERS) {
    if (layerName.endsWith(layerType)) return 'line';
  }
  for (const layerType of POLYGON_LAYERS) {
    if (layerName.endsWith(layerType)) return 'polygon';
  }
  return null;
}

function getStyleForGeometry(geometryType) {
  switch (geometryType) {
    case 'point': return 'impact_depth_point';
    case 'line': return 'impact_depth_line';
    case 'polygon': return 'impact_depth_polygon';
    default: return null;
  }
}

async function applyStyle(layerName, styleName) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      layer: {
        defaultStyle: {
          name: styleName,
          workspace: WORKSPACE,
        },
      },
    });

    const options = {
      hostname: GEOSERVER_HOST,
      port: GEOSERVER_PORT,
      path: `/geoserver/rest/layers/${WORKSPACE}:${layerName}`,
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${AUTH}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ success: true, layer: layerName });
        } else {
          resolve({ success: false, layer: layerName, status: res.statusCode, error: data });
        }
      });
    });

    req.on('error', () => {
      resolve({ success: false, layer: layerName, error: 'Connection error' });
    });

    req.write(payload);
    req.end();
  });
}

async function reloadGeoServer() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: GEOSERVER_HOST,
      port: GEOSERVER_PORT,
      path: '/geoserver/rest/reload',
      method: 'POST',
      headers: {
        'Authorization': `Basic ${AUTH}`,
      },
    };

    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ GeoServer configuration reloaded');
        resolve(true);
      } else {
        reject(new Error(`Failed to reload: ${res.statusCode}`));
      }
      res.on('error', reject);
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  try {
    console.log('🎨 Applying Geometry-Specific Impact Layer Styles');
    console.log('=================================================\n');

    // Skip upload - styles already uploaded via curl

    // Step 1: Get all layers
    console.log('Step 1: Fetching all exposure layers...');
    const layers = await getLayers();
    console.log(`✅ Found ${layers.length} layers\n`);

    // Step 2: Apply appropriate style to each layer
    console.log('Step 2: Applying geometry-specific styles...');
    console.log('Progress:');

    const failedLayers = [];
    const successLayers = [];

    for (let i = 0; i < layers.length; i++) {
      const geometryType = getGeometryType(layers[i]);
      const styleName = getStyleForGeometry(geometryType);

      if (styleName) {
        const result = await applyStyle(layers[i], styleName);
        if (result.success) {
          successLayers.push(result.layer);
          process.stdout.write('.');
        } else {
          failedLayers.push(result);
          process.stdout.write('x');
        }
      } else {
        console.log(`\n  ⚠️  Unknown geometry type for: ${layers[i]}`);
      }

      if ((i + 1) % 50 === 0) {
        console.log(`  ${i + 1}/${layers.length} processed...`);
      }
    }

    console.log(`\n\n✅ Success: ${successLayers.length}`);
    console.log(`❌ Failed: ${failedLayers.length}`);

    if (failedLayers.length > 0) {
      console.log('\n📋 Failed layers:');
      failedLayers.slice(0, 10).forEach(f => {
        console.log(`  - ${f.layer} (status: ${f.status || 'error'})`);
      });
      if (failedLayers.length > 10) {
        console.log(`  ... and ${failedLayers.length - 10} more`);
      }
    }

    // Step 3: Reload GeoServer
    console.log('\nStep 3: Reloading GeoServer configuration...');
    await reloadGeoServer();

    console.log('\n✨ Done! Layers now use geometry-specific styles:');
    console.log('  - Point layers (BHU, Telecom_Towers, Settlements) → impact_depth_point');
    console.log('  - Line layers (Electric_Grid, Railways, Roads) → impact_depth_line');
    console.log('  - Polygon layers (Buildings, Built_up_Area, Cropped_Area) → impact_depth_polygon');
    console.log('\nNo more centroid points on polygons and lines!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
