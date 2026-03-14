#!/usr/bin/env node
/**
 * Set impact_depth_simple as default style for all impact layers
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

async function setDefaultStyle(layerName) {
  return new Promise((resolve) => {
    // First assign the style
    const payload = JSON.stringify({
      style: {
        name: STYLE_NAME,
        workspace: WORKSPACE,
      },
    });

    const options = {
      hostname: GEOSERVER_HOST,
      port: GEOSERVER_PORT,
      path: `/geoserver/rest/layers/${WORKSPACE}:${layerName}/styles`,
      method: 'POST',
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
        const success = res.statusCode === 200 || res.statusCode === 201;
        process.stdout.write(success ? '.' : 'x');
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
    console.log(`🎨 Setting ${STYLE_NAME} as default style...\n`);

    // Process in batches to avoid overwhelming the server
    const batchSize = 20;
    for (let i = 0; i < layers.length; i += batchSize) {
      const batch = layers.slice(i, Math.min(i + batchSize, layers.length));
      await Promise.all(batch.map((layerName) => setDefaultStyle(layerName)));

      const processed = Math.min(i + batchSize, layers.length);
      console.log(`  ${processed}/${layers.length} processed...`);
    }

    console.log(`\n\n✨ Done! Style set as default for layers`);
    console.log('\n🔄 CRITICAL: Reload GeoServer NOW:');
    console.log('   curl -u admin:geoserver -X POST http://10.0.0.205:8080/geoserver/rest/reload');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
