#!/usr/bin/env node
/**
 * Delete all stores in exp_revised workspace and recreate them properly
 * Then publish all layers
 */

import http from 'http';
import { Pool } from 'pg';

const GEOSERVER_HOST = '10.0.0.205';
const GEOSERVER_PORT = 8080;
const WORKSPACE = 'exp_revised';
const AUTH = Buffer.from('admin:geoserver').toString('base64');

const pool = new Pool({
  host: '10.0.0.205',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'maltanadirSRV0',
});

const EXPOSURE_TYPES = ['BHU', 'Buildings', 'Built_up_Area', 'Cropped_Area', 'Electric_Grid', 'Railways', 'Roads', 'Settlements', 'Telecom_Towers'];

async function getAllStores() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: GEOSERVER_HOST,
      port: GEOSERVER_PORT,
      path: `/geoserver/rest/workspaces/${WORKSPACE}/datastores.json`,
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
          const stores = Array.isArray(json.dataStores.dataStore)
            ? json.dataStores.dataStore.map(s => s.name)
            : [json.dataStores.dataStore.name];
          resolve(stores);
        } else {
          resolve([]);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function deleteStore(storeName) {
  return new Promise((resolve) => {
    const options = {
      hostname: GEOSERVER_HOST,
      port: GEOSERVER_PORT,
      path: `/geoserver/rest/workspaces/${WORKSPACE}/datastores/${storeName}?recurse=true`,
      method: 'DELETE',
      headers: {
        'Authorization': `Basic ${AUTH}`,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const success = res.statusCode === 200;
        process.stdout.write(success ? '.' : 'x');
        resolve(success);
      });
    });

    req.on('error', () => {
      process.stdout.write('E');
      resolve(false);
    });

    req.end();
  });
}

async function createStore(schemaName) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      dataStore: {
        name: schemaName,
        description: `PostGIS store for ${schemaName}`,
        type: 'PostGIS',
        enabled: true,
        workspace: { name: WORKSPACE },
        connectionParameters: {
          host: '10.0.0.205',
          port: '5432',
          database: 'postgres',
          user: 'postgres',
          passwd: 'maltanadirSRV0',
          schema: schemaName,
          'dbtype': 'postgis',
        },
      },
    });

    const options = {
      hostname: GEOSERVER_HOST,
      port: GEOSERVER_PORT,
      path: `/geoserver/rest/workspaces/${WORKSPACE}/datastores`,
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
        const success = res.statusCode === 201 || res.statusCode === 200;
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

async function publishLayer(storeName, tableName) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      featureType: { name: tableName },
    });

    const options = {
      hostname: GEOSERVER_HOST,
      port: GEOSERVER_PORT,
      path: `/geoserver/rest/workspaces/${WORKSPACE}/datastores/${storeName}/featuretypes`,
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
        const success = res.statusCode === 201 || res.statusCode === 200 || res.statusCode === 401;
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

async function tableExists(schemaName, tableName) {
  try {
    const result = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = $1 AND table_name = $2
      )`,
      [schemaName, tableName]
    );
    return result.rows[0].exists;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🧹 Cleaning up and recreating GeoServer stores...\n');

  try {
    // Step 1: Delete all existing stores
    console.log('Step 1: Deleting existing stores...');
    const existingStores = await getAllStores();
    console.log(`   Found ${existingStores.length} stores to delete`);
    process.stdout.write('   Deleting: ');

    for (const storeName of existingStores) {
      await deleteStore(storeName);
      // Small delay to avoid overwhelming GeoServer
      await new Promise(r => setTimeout(r, 100));
    }
    console.log('\n');

    // Step 2: Get all schemas
    console.log('Step 2: Getting impacted schemas from database...');
    const schemasResult = await pool.query(
      `SELECT schema_name FROM information_schema.schemata
       WHERE schema_name LIKE '%Impacted'
       ORDER BY schema_name`
    );
    const schemas = schemasResult.rows.map(r => r.schema_name);
    console.log(`   Found ${schemas.length} schemas\n`);

    // Step 3: Recreate stores (in batches)
    console.log('Step 3: Recreating stores...');
    console.log('   Creating: ');

    for (const schema of schemas) {
      await createStore(schema);
      // Wait a bit between stores to avoid overwhelming GeoServer
      await new Promise(r => setTimeout(r, 500));
    }
    console.log('\n');

    // Wait for all stores to initialize
    console.log('   Waiting 5 seconds for stores to initialize...');
    await new Promise(r => setTimeout(r, 5000));
    console.log('');

    // Step 4: Publish all layers
    console.log('Step 4: Publishing layers...');
    let totalLayers = 0;
    let successfulLayers = 0;

    for (const schema of schemas) {
      process.stdout.write(`   ${schema}: `);
      let schemaLayers = 0;

      for (const exposureType of EXPOSURE_TYPES) {
        const exists = await tableExists(schema, exposureType);
        if (exists) {
          totalLayers++;
          const published = await publishLayer(schema, exposureType);
          if (published) {
            schemaLayers++;
            successfulLayers++;
          }
        }
      }

      console.log(` ${schemaLayers}/9`);
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total layers published: ${successfulLayers}/${totalLayers}`);

    // Step 5: Apply style
    console.log('\nStep 5: Uploading and applying style...');
    const sldContent = require('fs').readFileSync('./impact_depth_simple.sld', 'utf-8');

    // Upload style
    await new Promise((resolve, reject) => {
      const options = {
        hostname: GEOSERVER_HOST,
        port: GEOSERVER_PORT,
        path: '/geoserver/rest/styles/impact_depth_simple',
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
            console.log('   ✅ Style uploaded');
          } else {
            console.log(`   ⚠️  Style upload: ${res.statusCode}`);
          }
          resolve();
        });
      });

      req.on('error', () => resolve());
      req.write(sldContent);
      req.end();
    });

    // Apply style to all layers
    const allLayers = await getAllPublishedLayers();
    console.log(`   Found ${allLayers.length} layers`);
    console.log('   Applying style: ');

    for (const layer of allLayers) {
      await new Promise((resolve) => {
        const payload = JSON.stringify({
          layer: {
            defaultStyle: { name: 'impact_depth_simple', workspace: WORKSPACE },
          },
        });

        const options = {
          hostname: GEOSERVER_HOST,
          port: GEOSERVER_PORT,
          path: `/geoserver/rest/layers/${WORKSPACE}:${layer}`,
          method: 'PUT',
          headers: {
            'Authorization': `Basic ${AUTH}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          },
        };

        const req = http.request(options, (res) => {
          res.on('data', () => {});
          res.on('end', () => {
            process.stdout.write(res.statusCode === 200 ? '.' : 'x');
            resolve();
          });
        });

        req.on('error', () => {
          process.stdout.write('E');
          resolve();
        });

        req.write(payload);
        req.end();
      });
    }
    console.log('\n');

    console.log('✨ Done!');
    console.log('\n🔄 Reload GeoServer:');
    console.log('   http://10.0.0.205:8080/geoserver/web/');
    console.log('   Config → Reload\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function getAllPublishedLayers() {
  return new Promise((resolve) => {
    const options = {
      hostname: GEOSERVER_HOST,
      port: GEOSERVER_PORT,
      path: `/geoserver/rest/workspaces/${WORKSPACE}/layers.json`,
      method: 'GET',
      headers: { 'Authorization': `Basic ${AUTH}` },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            if (json.layers?.layer) {
              const layers = Array.isArray(json.layers.layer)
                ? json.layers.layer.map(l => l.name)
                : [json.layers.layer.name];
              resolve(layers);
            } else {
              resolve([]);
            }
          } catch {
            resolve([]);
          }
        } else {
          resolve([]);
        }
      });
    });

    req.on('error', () => resolve([]));
    req.end();
  });
}

main();
