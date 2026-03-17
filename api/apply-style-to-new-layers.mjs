#!/usr/bin/env node
/**
 * Apply impact_depth_simple style to all newly published impact layers in exposures workspace
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
        const success = res.statusCode === 200;
        if (success) {
          process.stdout.write('.');
        } else {
          process.stdout.write('x');
        }
        resolve(success);
      });
    });

    req.on('error', () => {
      process.stdout.write('E');
      resolve(false);
    });

    req.write(payload);
    req.end();
  });
}

async function main() {
  try {
    console.log('📋 Fetching layers from exposures workspace...');
    const layers = await getLayers();
    console.log(`\n✅ Found ${layers.length} layers`);
    console.log(`🎨 Applying ${STYLE_NAME} to all layers...\n`);

    let successCount = 0;
    let failCount = 0;

    // Process in batches of 10 to avoid overwhelming the server
    const batchSize = 10;
    for (let i = 0; i < layers.length; i += batchSize) {
      const batch = layers.slice(i, Math.min(i + batchSize, layers.length));
      const results = await Promise.all(batch.map((layerName) => applyStyle(layerName)));
      successCount += results.filter(r => r).length;
      failCount += results.filter(r => !r).length;

      // Progress indicator
      const processed = Math.min(i + batchSize, layers.length);
      console.log(`  ${processed}/${layers.length} processed...`);
    }

    console.log(`\n\n✨ Done! Applied style to ${successCount}/${layers.length} layers`);
    if (failCount > 0) {
      console.log(`⚠️  Failed: ${failCount} layers`);
    }
    console.log('\n🔄 CRITICAL: Reload GeoServer NOW:');
    console.log('   1. Go to: http://10.0.0.205:8080/geoserver/');
    console.log('   2. Click "Config" in left sidebar');
    console.log('   3. Click "Reload" button');
    console.log('   4. Click "OK" to confirm');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
