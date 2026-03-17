#!/usr/bin/env node
/**
 * Apply depth-based styling to all impact layers in GeoServer
 *
 * This script:
 * 1. Uploads the SLD style to GeoServer
 * 2. Applies it to all layers in the exposures workspace
 *
 * Usage: node api/apply-impact-style.mjs
 */

import fs from 'fs';
import http from 'http';

const GEOSERVER_HOST = '10.0.0.205';
const GEOSERVER_PORT = 8080;
const WORKSPACE = 'exp_revised';
const STYLE_NAME = 'impact_depth_style';

// GeoServer credentials (if security is enabled)
const AUTH = Buffer.from('admin:geoserver').toString('base64');

/**
 * Upload SLD style to GeoServer
 */
async function uploadStyle() {
  return new Promise((resolve, reject) => {
    const sldContent = fs.readFileSync('./impact_depth_style.sld', 'utf-8');

    const options = {
      hostname: GEOSERVER_HOST,
      port: GEOSERVER_PORT,
      path: `/geoserver/rest/styles/${STYLE_NAME}`,
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
        if (res.statusCode === 201 || res.statusCode === 200) {
          console.log('✅ Style uploaded successfully');
          resolve(true);
        } else {
          console.error('❌ Failed to upload style:', res.statusCode, data);
          reject(new Error(`Failed to upload style: ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.write(sldContent);
    req.end();
  });
}

/**
 * Get all layers in the workspace
 */
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
          console.log(`📋 Found ${layers.length} layers in workspace '${WORKSPACE}'`);
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

/**
 * Apply style to a layer
 */
async function applyStyleToLayer(layerName) {
  return new Promise((resolve, reject) => {
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
          console.log(`  ✅ Applied style to: ${layerName}`);
          resolve(true);
        } else {
          console.log(`  ⚠️  Failed to apply style to ${layerName}:`, res.statusCode);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`  ❌ Error applying style to ${layerName}:`, error.message);
      resolve(false);
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🎨 Starting impact layer styling...\n');

    // Step 1: Upload the SLD style
    console.log('Step 1: Uploading SLD style to GeoServer...');
    await uploadStyle();
    console.log('');

    // Step 2: Get all layers
    console.log('Step 2: Fetching layers from workspace...');
    const layers = await getLayers();
    console.log('');

    // Step 3: Apply style to each layer
    console.log('Step 3: Applying style to layers...');
    let successCount = 0;
    for (const layerName of layers) {
      const success = await applyStyleToLayer(layerName);
      if (success) successCount++;
    }

    console.log(`\n✨ Done! Applied style to ${successCount}/${layers.length} layers`);
    console.log('\n🔄 Please clear your GeoServer cache:');
    console.log('   - GeoServer Web UI → Config → Reload');
    console.log('   - Or reload the layer in your application');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
