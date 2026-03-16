/**
 * Population Statistics Loader from Excel Files
 *
 * This script reads all Exposure_Consolidated_T3_*.xlsx files from the
 * Exposure_Stats folder and loads population impact data into the database.
 *
 * Usage:
 *   node api/load-population-stats.mjs
 *
 * Requirements:
 *   - npm install xlsx pg
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import xlsx from 'xlsx';
import { Pool } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection (same as impact-summary.mjs)
const pool = new Pool({
  host: process.env.DB_HOST || '10.0.0.205',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'maltanadirSRV0',
});

/**
 * Parse scenario parameters from Excel filename
 * Format: Exposure_Consolidated_T3_{rp}yrs_{Climate}_{Maintenance}.xlsx
 * Example: Exposure_Consolidated_T3_2.3yrs_Future_Breaches.xlsx
 */
function parseScenarioFromFilename(filename) {
  // Remove extension and prefix
  const baseName = filename.replace('.xlsx', '').replace('Exposure_Consolidated_', '');

  // Parse: T3_2.3yrs_Future_Breaches
  const parts = baseName.split('_');

  if (parts.length < 4) {
    throw new Error(`Invalid filename format: ${filename}`);
  }

  const returnPeriod = parts[1].replace('yrs', ''); // "2.3", "10", "100", etc.
  const climate = parts[2].toLowerCase(); // "future" or "present"
  const maintenance = parts[3].toLowerCase(); // "breaches", "perfect", or "redcapacity"

  return {
    returnPeriod,
    climate,
    maintenance,
    filename,
  };
}

/**
 * Extract population data from Excel file
 * Population data is in row 12 (0-indexed: row 11)
 */
function extractPopulationData(filePath, filename) {
  console.log(`  Reading: ${filename}`);

  // Read Excel file
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0]; // 'Exposure Results'
  const worksheet = workbook.Sheets[sheetName];

  // Convert to array of arrays (raw values)
  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

  // Find the population row (contains "Population" in column 1)
  let populationRow = null;
  let rowIndex = -1;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row[1] === 'Population') {
      populationRow = row;
      rowIndex = i;
      break;
    }
  }

  if (!populationRow) {
    throw new Error(`Population row not found in ${filename}`);
  }

  // Verify the row structure
  // Expected: [null, 'Population', null, 'count', 15-100cm, 1-2m, 2-3m, 3-4m, 4-5m, above5m, Total]
  // Indices:                                            4      5     6     7     8      9      10

  const pop_15_100cm = parseFloat(populationRow[4]) || 0;
  const pop_1_2m = parseFloat(populationRow[5]) || 0;
  const pop_2_3m = parseFloat(populationRow[6]) || 0;
  const pop_3_4m = parseFloat(populationRow[7]) || 0;
  const pop_4_5m = parseFloat(populationRow[8]) || 0;
  const pop_above5m = parseFloat(populationRow[9]) || 0;
  const totalPopulation = parseFloat(populationRow[10]) || 0;

  // Calculate affected population (sum of all depth bins)
  const affectedPopulation = pop_15_100cm + pop_1_2m + pop_2_3m + pop_3_4m + pop_4_5m + pop_above5m;

  // Calculate percentage
  const affectedPercentage = totalPopulation > 0
    ? (affectedPopulation / totalPopulation) * 100
    : 0;

  return {
    totalPopulation,
    affectedPopulation,
    affectedPercentage,
    depthBins: {
      '15-100cm': pop_15_100cm,
      '1-2m': pop_1_2m,
      '2-3m': pop_2_3m,
      '3-4m': pop_3_4m,
      '4-5m': pop_4_5m,
      'above5m': pop_above5m,
    },
  };
}

/**
 * Insert or update population stats in database
 */
async function upsertPopulationStats(pool, scenario, popData) {
  const query = `
    INSERT INTO impact.population_stats (
      climate,
      maintenance,
      return_period,
      total_population,
      affected_population,
      affected_percentage,
      pop_15_100cm,
      pop_1_2m,
      pop_2_3m,
      pop_3_4m,
      pop_4_5m,
      pop_above5m,
      source_file,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
    ON CONFLICT (climate, maintenance, return_period)
    DO UPDATE SET
      total_population = EXCLUDED.total_population,
      affected_population = EXCLUDED.affected_population,
      affected_percentage = EXCLUDED.affected_percentage,
      pop_15_100cm = EXCLUDED.pop_15_100cm,
      pop_1_2m = EXCLUDED.pop_1_2m,
      pop_2_3m = EXCLUDED.pop_2_3m,
      pop_3_4m = EXCLUDED.pop_3_4m,
      pop_4_5m = EXCLUDED.pop_4_5m,
      pop_above5m = EXCLUDED.pop_above5m,
      source_file = EXCLUDED.source_file,
      updated_at = CURRENT_TIMESTAMP
    RETURNING id
  `;

  const values = [
    scenario.climate,
    scenario.maintenance,
    scenario.returnPeriod,
    popData.totalPopulation,
    popData.affectedPopulation,
    popData.affectedPercentage,
    popData.depthBins['15-100cm'],
    popData.depthBins['1-2m'],
    popData.depthBins['2-3m'],
    popData.depthBins['3-4m'],
    popData.depthBins['4-5m'],
    popData.depthBins['above5m'],
    scenario.filename,
  ];

  const result = await pool.query(query, values);
  return result.rows[0].id;
}

/**
 * Main loading function
 */
async function loadPopulationStats() {
  console.log('📊 Population Statistics Loader\n');

  try {
    // Connect to database
    console.log('🔌 Connecting to database...');
    await pool.query('SELECT 1');
    console.log('✅ Database connected\n');

    // Get all Excel files from Exposure_Stats folder
    const exposureStatsPath = path.join(__dirname, '../Exposure_Stats');

    if (!fs.existsSync(exposureStatsPath)) {
      throw new Error(`Exposure_Stats folder not found: ${exposureStatsPath}`);
    }

    const files = fs.readdirSync(exposureStatsPath)
      .filter(f => f.startsWith('Exposure_Consolidated_T3_') && f.endsWith('.xlsx'))
      .sort();

    console.log(`📁 Found ${files.length} Excel files\n`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process each file
    for (const file of files) {
      try {
        const filePath = path.join(exposureStatsPath, file);

        // Parse scenario from filename
        const scenario = parseScenarioFromFilename(file);

        // Extract population data
        const popData = extractPopulationData(filePath, file);

        // Insert/Update in database
        const recordId = await upsertPopulationStats(pool, scenario, popData);

        console.log(`  ✅ Loaded: ${scenario.climate} / ${scenario.maintenance} / ${scenario.returnPeriod}yrs`);
        console.log(`     Population: ${popData.affectedPopulation.toLocaleString()} of ${popData.totalPopulation.toLocaleString()} (${popData.affectedPercentage.toFixed(1)}%)`);
        console.log(`     Record ID: ${recordId}\n`);

        successCount++;
      } catch (error) {
        console.error(`  ❌ Error processing ${file}:`, error.message);
        errors.push({ file, error: error.message });
        errorCount++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Loading Summary');
    console.log('='.repeat(60));
    console.log(`✅ Successfully loaded: ${successCount} scenarios`);
    console.log(`❌ Failed: ${errorCount} scenarios`);

    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach(({ file, error }) => {
        console.log(`  - ${file}: ${error}`);
      });
    }

    // Verify database has all 42 scenarios
    const verifyQuery = `
      SELECT climate, maintenance, return_period,
             affected_population, affected_percentage
      FROM impact.population_stats
      ORDER BY climate DESC, maintenance,
               CASE return_period
                 WHEN '2.3' THEN 2.3
                 ELSE CAST(return_period AS FLOAT)
               END
    `;
    const verifyResult = await pool.query(verifyQuery);
    console.log(`\n📋 Database now has ${verifyResult.rows.length} population records\n`);

    // Display sample data
    console.log('Sample data:');
    console.table(verifyResult.rows.slice(0, 10));

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    throw error;
  } finally {
    await pool.end();
    console.log('\n👋 Database connection closed');
  }
}

// Run the loader
loadPopulationStats()
  .then(() => {
    console.log('\n✅ Population statistics loaded successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to load population statistics:', error);
    process.exit(1);
  });
