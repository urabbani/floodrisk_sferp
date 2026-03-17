#!/usr/bin/env node
/**
 * Diagnose which layers are failing to apply the style
 */

import http from 'http';

const GEOSERVER_HOST = '10.0.0.205';
const GEOSERVER_PORT = 8080;
const WORKSPACE = 'exposures';
const STYLE_NAME = 'impact_depth_simple';
const AUTH = Buffer.from('admin:geoserver').toString('base64');

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
          reject(new Error(`Failed: ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function applyStyle(layerName) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      layer: {
        defaultStyle: {
          name: STYLE_NAME,
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

async function main() {
  try {
    console.log('📋 Fetching layers from exposures workspace...');
    const layers = await getLayers();
    console.log(`✅ Found ${layers.length} layers\n`);

    console.log('🔍 Testing style application...\n');

    const failedLayers = [];
    const successLayers = [];

    for (let i = 0; i < layers.length; i++) {
      const result = await applyStyle(layers[i]);
      if (result.success) {
        successLayers.push(result.layer);
        process.stdout.write('.');
      } else {
        failedLayers.push(result);
        process.stdout.write('x');
      }

      // Progress indicator every 50 layers
      if ((i + 1) % 50 === 0) {
        console.log(`  ${i + 1}/${layers.length} processed...`);
      }
    }

    console.log(`\n\n✅ Success: ${successLayers.length}`);
    console.log(`❌ Failed: ${failedLayers.length}`);

    if (failedLayers.length > 0) {
      console.log('\n📋 Failed layers:');
      failedLayers.forEach(f => {
        console.log(`  - ${f.layer} (status: ${f.status || 'error'})`);
      });

      // Analyze patterns
      console.log('\n🔍 Pattern analysis:');
      const failedByType = {};
      failedLayers.forEach(f => {
        const parts = f.layer.split('_');
        const layerType = parts[parts.length - 1]; // Last part is the layer type
        failedByType[layerType] = (failedByType[layerType] || 0) + 1;
      });

      console.log('  Failures by layer type:');
      Object.entries(failedByType).forEach(([type, count]) => {
        console.log(`    ${type}: ${count}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
