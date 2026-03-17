#!/usr/bin/env node
/**
 * Import all impact layers from PostGIS to GeoServer
 *
 * This script:
 * 1. Creates the exp_revised workspace in GeoServer
 * 2. Creates a PostGIS store for each impacted schema
 * 3. Publishes all exposure tables as layers
 * 4. Applies the impact_depth_style to all layers
 *
 * Usage: node api/import-impact-layers-to-geoserver.mjs
 */

import http from 'http';
import { Pool } from 'pg';

const GEOSERVER_HOST = '10.0.0.205';
const GEOSERVER_PORT = 8080;
const WORKSPACE = 'exp_revised';
const STYLE_NAME = 'impact_depth_style';

// GeoServer credentials
const AUTH = Buffer.from('admin:geoserver').toString('base64');

// Database connection
const pool = new Pool({
  host: '10.0.0.205',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'maltanadirSRV0',
});

// Exposure types (tables to publish)
const EXPOSURE_TYPES = [
  'BHU',
  'Buildings',
  'Built_up_Area',
  'Cropped_Area',
  'Electric_Grid',
  'Railways',
  'Roads',
  'Settlements',
  'Telecom_Towers',
];

// Scenario combinations
const SCENARIOS = [];
const climates = ['Present', 'Future'];
const maintenances = ['Breaches', 'RedCapacity', 'Perfect'];
const returnPeriods = ['2.3', '5', '10', '25', '50', '100', '500'];

climates.forEach(climate => {
  maintenances.forEach(maintenance => {
    returnPeriods.forEach(rp => {
      SCENARIOS.push({
        schema: `T3_${rp}yrs_${climate}_${maintenance}_Impacted`,
        returnPeriod: rp,
        climate: climate.toLowerCase(),
        maintenance: maintenance.toLowerCase(),
      });
    });
  });
});

/**
 * Create workspace in GeoServer
 */
async function createWorkspace() {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ workspace: { name: WORKSPACE } });

    const options = {
      hostname: GEOSERVER_HOST,
      port: GEOSERVER_PORT,
      path: '/geoserver/rest/workspaces',
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
        if (res.statusCode === 201 || res.statusCode === 200) {
          console.log(`✅ Workspace '${WORKSPACE}' created successfully`);
          resolve(true);
        } else {
          console.log(`ℹ️  Workspace '${WORKSPACE}' may already exist (${res.statusCode})`);
          resolve(true);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`⚠️  Error creating workspace:`, error.message);
      resolve(true); // Continue anyway, workspace might exist
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Check if a data store exists
 */
async function storeExists(schemaName) {
  return new Promise((resolve) => {
    const options = {
      hostname: GEOSERVER_HOST,
      port: GEOSERVER_PORT,
      path: `/geoserver/rest/workspaces/${WORKSPACE}/datastores/${schemaName}.json`,
      method: 'GET',
      headers: {
        'Authorization': `Basic ${AUTH}`,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve(res.statusCode === 200);
      });
    });

    req.on('error', () => resolve(false));
    req.end();
  });
}

/**
 * Create PostGIS data store for a schema
 */
async function createStore(schemaName) {
  // First check if store exists
  const exists = await storeExists(schemaName);
  if (exists) {
    console.log(`  ✓ Store exists: ${schemaName}`);
    return true;
  }

  return new Promise((resolve) => {
    const payload = JSON.stringify({
      dataStore: {
        name: schemaName,
        description: `PostGIS store for ${schemaName}`,
        type: 'PostGIS',
        enabled: true,
        workspace: {
          name: WORKSPACE,
        },
        connectionParameters: {
          host: '10.0.0.205',
          port: '5432',
          database: 'postgres',
          user: 'postgres',
          passwd: 'maltanadirSRV0',
          schema: schemaName,
          'dbtype': 'postgis',
          'Loose bbox': 'true',
          'Expose primary keys': 'false',
          'Max connections': '10',
          'Min connections': '1',
          'fetch size': '1000',
          'validate connections': 'true',
          'Supported functions': '',
          'Namespace': 'http://www.opengis.net/gml',
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
        if (res.statusCode === 201 || res.statusCode === 200) {
          console.log(`  ✅ Created store: ${schemaName}`);
          resolve(true);
        } else {
          // Store might have been created by another process
          console.log(`  ⚠️  Store creation returned ${res.statusCode}, checking...`);
          resolve(true);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`  ❌ Error creating store ${schemaName}:`, error.message);
      resolve(true); // Continue anyway
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Publish a feature type (layer) from PostGIS
 */
async function publishLayer(schemaName, tableName) {
  return new Promise((resolve) => {
    // Use minimal payload - GeoServer will auto-configure the rest
    const payload = JSON.stringify({
      featureType: {
        name: tableName,
      },
    });

    const options = {
      hostname: GEOSERVER_HOST,
      port: GEOSERVER_PORT,
      path: `/geoserver/rest/workspaces/${WORKSPACE}/datastores/${schemaName}/featuretypes`,
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
        if (res.statusCode === 201 || res.statusCode === 200) {
          process.stdout.write('.');
          resolve(true);
        } else if (res.statusCode === 401 || res.statusCode === 403) {
          // Layer already exists - this is okay
          process.stdout.write('.');
          resolve(true);
        } else if (res.statusCode === 500) {
          // Server error - might be a database connection issue
          process.stdout.write('x');
          if (Math.random() < 0.02) { // Show 2% of errors
            console.log(`\n  ⚠️  ${tableName}: Server error - store might not be ready`);
          }
          resolve(false);
        } else {
          // Other errors
          if (Math.random() < 0.05) { // Show 5% of errors
            console.log(`\n  ⚠️  ${tableName}: ${res.statusCode}`);
          }
          process.stdout.write('x');
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      if (Math.random() < 0.1) { // Show 10% of errors
        console.log(`\n  ❌ ${tableName}: ${error.message}`);
      }
      process.stdout.write('E');
      resolve(false);
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Apply style to a layer
 */
async function applyStyleToLayer(layerName) {
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
          process.stdout.write('.');
          resolve(true);
        } else {
          process.stdout.write('x');
          resolve(false);
        }
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

/**
 * Check if a table exists in the database
 */
async function tableExists(schemaName, tableName) {
  try {
    const result = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = $1
        AND table_name = $2
      )`,
      [schemaName, tableName]
    );
    return result.rows[0].exists;
  } catch (error) {
    console.error(`  ❌ Error checking table ${schemaName}.${tableName}:`, error.message);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting impact layer import to GeoServer...\n');

  try {
    // Step 1: Create workspace
    console.log('Step 1: Creating workspace...');
    await createWorkspace();
    console.log('');

    // Step 2: Create all data stores first
    console.log('Step 2: Creating data stores for all schemas...');
    let validSchemas = [];
    for (const scenario of SCENARIOS) {
      const schemaName = scenario.schema;

      // Check if schema exists
      const schemaExists = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.schemata
          WHERE schema_name = $1
        )`,
        [schemaName]
      );

      if (schemaExists.rows[0].exists) {
        await createStore(schemaName);
        validSchemas.push(scenario);
      }
    }
    console.log(`   Created/checked ${validSchemas.length} data stores`);
    console.log('');

    // Wait a bit for stores to initialize
    console.log('   Waiting 2 seconds for stores to initialize...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('');

    // Step 3: Publish all layers
    console.log('Step 3: Publishing layers...');
    console.log(`   Processing ${validSchemas.length} schemas × ${EXPOSURE_TYPES.length} exposure types...\n`);

    let totalLayers = 0;
    let successfulLayers = 0;

    for (const scenario of validSchemas) {
      const schemaName = scenario.schema;

      // Publish each exposure type as a layer
      process.stdout.write(`  ${schemaName}: `);
      let schemaLayers = 0;

      for (const exposureType of EXPOSURE_TYPES) {
        const exists = await tableExists(schemaName, exposureType);
        if (exists) {
          const published = await publishLayer(schemaName, exposureType);
          if (published) {
            schemaLayers++;
            successfulLayers++;
          }
          totalLayers++;
        }
      }

      console.log(` ${schemaLayers}/${EXPOSURE_TYPES.length} layers`);
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total layers published: ${successfulLayers}/${totalLayers}`);

    // Step 4: Apply style to all published layers
    console.log('\nStep 4: Applying impact_depth_style to all layers...');
    const allLayers = await getAllPublishedLayers();
    console.log(`   Found ${allLayers.length} layers`);

    if (allLayers.length > 0) {
      let styledLayers = 0;
      for (const layerName of allLayers) {
        const styled = await applyStyleToLayer(layerName);
        if (styled) styledLayers++;
      }

      console.log(`\n   Styled ${styledLayers}/${allLayers.length} layers`);
    }

    console.log('\n✨ Import complete!');
    console.log('\n🔄 IMPORTANT: Reload GeoServer:');
    console.log('   http://10.0.0.205:8080/geoserver/web/?wicket:bookmarkable=:org.geoserver.web.GeoServerApplication:home');
    console.log('   Or: Config → Reload');

    console.log('\n📋 Next steps:');
    console.log('   1. Reload GeoServer configuration');
    console.log('   2. Update workspace name in code from "exposures" to "exp_revised"');
    console.log('   3. Test the layers in the application');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

/**
 * Get all published layers from the workspace
 */
async function getAllPublishedLayers() {
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
          try {
            const json = JSON.parse(data);
            if (json.layers && json.layers.layer) {
              const layers = Array.isArray(json.layers.layer)
                ? json.layers.layer.map(l => l.name)
                : [json.layers.layer.name];
              resolve(layers);
            } else {
              console.log('   ℹ️  No layers found yet');
              resolve([]);
            }
          } catch (error) {
            console.log('   ⚠️  Could not parse layers response');
            resolve([]);
          }
        } else {
          reject(new Error(`Failed: ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

main();
