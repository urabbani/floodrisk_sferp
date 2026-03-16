/**
 * Flood Impact & Exposure API Endpoint (ES Module version)
 *
 * This is a standalone Node.js/Express API server for querying impact data
 * from PostGIS and returning it to the frontend.
 *
 * To run:
 *   1. Install dependencies: npm install express pg cors
 *   2. Set DATABASE_URL environment variable
 *   3. Run: node api/impact-summary.mjs
 *
 * Or integrate this into your existing backend.
 */

import express from 'express';
import { Pool } from 'pg';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || '10.0.0.205',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'maltanadirSRV0',
  max: 10, // Reduced from 20 to prevent connection exhaustion
  min: 2, // Keep minimum connections alive
  idleTimeoutMillis: 10000, // Reduced from 30000 - release idle connections faster
  connectionTimeoutMillis: 5000, // Increased from 2000 - give more time for connection
  idleInTransactionSessionTimeout: 60000, // Kill idle transactions after 60 seconds
  statement_timeout: 30000, // Kill queries running longer than 30 seconds
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Cleanup on shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, closing pool...');
  await pool.end();
  process.exit(0);
});

// Middleware
app.use(cors());
app.use(express.json());

/**
 * Get total feature counts from Exposure_InputData schema
 * These represent the true total count of each exposure type
 */
async function getTotalFeatureCounts(pool) {
  const exposureTypes = [
    'BHU', 'Buildings', 'Built_up_Area', 'Cropped_Area',
    'Electric_Grid', 'Railways', 'Roads', 'Settlements', 'Telecom_Towers'
  ];

  const totals = {};

  for (const exposureType of exposureTypes) {
    try {
      const query = `SELECT COUNT(*) as count FROM "Exposure_InputData"."${exposureType}"`;
      const result = await pool.query(query);
      totals[exposureType] = parseInt(result.rows[0].count) || 0;
    } catch (error) {
      console.error(`Error getting total count for ${exposureType}:`, error);
      totals[exposureType] = 0;
    }
  }

  return totals;
}

/**
 * Helper function to get area-based percentages for zonal layers
 * Queries the actual geometry to calculate area distribution across depth bins
 */
async function getZonalLayerAreaPercentages(pool, climate, maintenance, returnPeriod, exposureType) {
  try {
    // Build schema name: T3_{rp}yrs_{climate}_{maintenance}_Impacted
    const rpFormatted = returnPeriod === '2.3' ? '2.3' : returnPeriod;
    const climateFormatted = climate.charAt(0).toUpperCase() + climate.slice(1);
    const maintenanceFormatted = maintenance === 'breaches' ? 'Breaches' :
                               maintenance === 'redcapacity' ? 'RedCapacity' :
                               maintenance.charAt(0).toUpperCase() + maintenance.slice(1);

    const schemaName = `T3_${rpFormatted}yrs_${climateFormatted}_${maintenanceFormatted}_Impacted`;
    const tableName = `"${schemaName}"."${exposureType}"`;

    // Query area by depth bin
    const query = `
      SELECT
        depth_bin,
        (ST_Area(geom) / 10000.0) as area_hectares
      FROM ${tableName}
      ORDER BY depth_bin
    `;

    const result = await pool.query(query);

    // Calculate total area
    const totalArea = result.rows.reduce((sum, row) => sum + parseFloat(row.area_hectares), 0);

    // Build percentage mapping
    const percentages = {};
    const depthBinMapping = {
      '15-100cm': '15-100cm',
      '1-2m': '1-2m',
      '2-3m': '2-3m',
      '3-4m': '3-4m',
      '4-5m': '4-5m',
      'above5m': 'above5m'
    };

    result.rows.forEach((row) => {
      const binKey = row.depth_bin;
      if (binKey && depthBinMapping[binKey]) {
        const percentage = totalArea > 0 ? (parseFloat(row.area_hectares) / totalArea) * 100 : 0;
        percentages[depthBinMapping[binKey]] = Math.round(percentage * 100) / 100; // Round to 2 decimal places
      }
    });

    return percentages;
  } catch (error) {
    console.error(`Error querying zonal layer areas for ${exposureType}:`, error.message);
    // Return empty percentages on error - let the frontend handle missing data
    return {
      '15-100cm': 0,
      '1-2m': 0,
      '2-3m': 0,
      '3-4m': 0,
      '4-5m': 0,
      'above5m': 0
    };
  }
}

/**
 * GET /api/impact/summary
 *
 * Query parameters:
 *   - climate: 'present' | 'future' (required)
 *   - maintenance: 'breaches' | 'redcapacity' | 'perfect' | 'all' (optional, default: 'all')
 *   - returnPeriod: string (optional)
 *   - depthThreshold: number (optional, default: 0)
 *
 * Returns: ImpactSummaryResponse (JSON)
 */
app.get('/api/impact/summary', async (req, res) => {
  try {
    const {
      climate,
      maintenance = 'all',
      returnPeriod,
      depthThreshold = '0',
    } = req.query;

    // Validate required parameters
    if (!climate || (climate !== 'present' && climate !== 'future')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid climate parameter. Must be "present" or "future".',
      });
    }

    // Build the query - use materialized view for better performance
    let query = `
      SELECT
        climate,
        maintenance,
        return_period,
        exposure_type,
        total_features,
        affected_features,
        max_depth_bin,
        bin_15_100cm_count,
        bin_1_2m_count,
        bin_2_3m_count,
        bin_3_4m_count,
        bin_4_5m_count,
        bin_above5m_count
      FROM impact_summary_matview
      WHERE climate = $1
    `;

    const params = [climate];
    let paramIndex = 2;

    // Add optional filters
    if (maintenance && maintenance !== 'all') {
      query += ` AND maintenance = $${paramIndex}`;
      params.push(maintenance);
      paramIndex++;
    }

    if (returnPeriod) {
      query += ` AND return_period = $${paramIndex}`;
      params.push(returnPeriod);
      paramIndex++;
    }

    query += ` ORDER BY return_period_num, maintenance, exposure_type`;

    // Execute query
    const result = await pool.query(query, params);

    // Process results into the expected format
    const summaries = await processResults(result.rows, parseFloat(depthThreshold), pool);

    // Build response
    const response = {
      success: true,
      data: {
        climate,
        summaries,
        metadata: {
          lastUpdated: new Date().toISOString(),
          totalScenarios: summaries.length,
        },
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching impact summary:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: null,
    });
  }
});

/**
 * Process database rows into ScenarioImpactSummary format
 */
async function processResults(rows, depthThreshold, pool) {
  // Get true total feature counts from Exposure_InputData
  const totalFeatureCounts = await getTotalFeatureCounts(pool);

  // Group by scenario (climate + maintenance + return_period)
  const scenarioMap = new Map();

  for (const row of rows) {
    const scenarioId = `T3_${row.return_period}yrs_${row.climate.charAt(0).toUpperCase() + row.climate.slice(1)}_${row.maintenance === 'redcapacity' ? 'RedCapacity' : row.maintenance.charAt(0).toUpperCase() + row.maintenance.slice(1)}_Impacted`;

    if (!scenarioMap.has(scenarioId)) {
      scenarioMap.set(scenarioId, {
        scenarioId,
        climate: row.climate,
        maintenance: row.maintenance,
        returnPeriod: row.return_period,
        totalAffectedExposures: 0,
        severity: 'low',
        impacts: {},
      });
    }

    const scenario = scenarioMap.get(scenarioId);

    // Build depth bins
    const totalAffected = row.affected_features || 0;
    const trueTotal = totalFeatureCounts[row.exposure_type] || totalAffected;
    const depthBins = [
      { range: '15-100cm', minDepth: 0.15, maxDepth: 1.0, count: row.bin_15_100cm_count || 0, percentage: 0 },
      { range: '1-2m', minDepth: 1.0, maxDepth: 2.0, count: row.bin_1_2m_count || 0, percentage: 0 },
      { range: '2-3m', minDepth: 2.0, maxDepth: 3.0, count: row.bin_2_3m_count || 0, percentage: 0 },
      { range: '3-4m', minDepth: 3.0, maxDepth: 4.0, count: row.bin_3_4m_count || 0, percentage: 0 },
      { range: '4-5m', minDepth: 4.0, maxDepth: 5.0, count: row.bin_4_5m_count || 0, percentage: 0 },
      { range: 'above5m', minDepth: 5.0, maxDepth: null, count: row.bin_above5m_count || 0, percentage: 0 },
    ];

    // Calculate percentages for depth bins
    const isZonalLayer = row.exposure_type === 'Cropped_Area' || row.exposure_type === 'Built_up_Area';

    if (isZonalLayer && row.total_features <= 10) {
      // For zonal layers, use area-based distribution from database
      const areaPercentages = await getZonalLayerAreaPercentages(
        pool,
        row.climate,
        row.maintenance,
        row.return_period,
        row.exposure_type
      );

      depthBins.forEach((bin) => {
        bin.percentage = areaPercentages[bin.range] || 0;
        bin.count = null; // Don't show misleading count for zonal layers
      });
    } else {
      // Normal feature count based percentage
      depthBins.forEach((bin) => {
        bin.percentage = totalAffected > 0 ? (bin.count / totalAffected) * 100 : 0;
      });
    }

    // Add exposure impact
    scenario.impacts[row.exposure_type] = {
      layerType: row.exposure_type,
      totalFeatures: totalFeatureCounts[row.exposure_type] || 0, // Use true total from Exposure_InputData
      affectedFeatures: row.affected_features || 0,
      maxDepthBin: row.max_depth_bin,
      depthBins,
      geoserverLayer: `T3_${row.return_period}yrs_${row.climate.charAt(0).toUpperCase() + row.climate.slice(1)}_${row.maintenance === 'redcapacity' ? 'RedCapacity' : row.maintenance.charAt(0).toUpperCase() + row.maintenance.slice(1)}_Impacted_${row.exposure_type}`,
      workspace: 'exposures',
      geometryType: getGeometryType(row.exposure_type),
    };

    // Count affected exposures for severity calculation
    if (row.affected_features > depthThreshold) {
      scenario.totalAffectedExposures++;
    }
  }

  // Calculate severity for each scenario
  scenarioMap.forEach((scenario) => {
    scenario.severity = calculateSeverityFromExposures(scenario.totalAffectedExposures);
  });

  // Convert map to array
  return Array.from(scenarioMap.values());
}

/**
 * Get geometry type for exposure layer
 */
function getGeometryType(exposureType) {
  const pointLayers = ['BHU', 'Telecom_Towers'];
  const lineLayers = ['Electric_Grid', 'Railways', 'Roads'];
  const polygonLayers = ['Buildings', 'Built_up_Area', 'Cropped_Area', 'Settlements'];

  if (pointLayers.includes(exposureType)) return 'point';
  if (lineLayers.includes(exposureType)) return 'line';
  if (polygonLayers.includes(exposureType)) return 'polygon';
  return 'polygon';
}

/**
 * Calculate severity based on affected exposure count
 */
function calculateSeverityFromExposures(affectedCount) {
  if (affectedCount <= 2) return 'low';
  if (affectedCount <= 5) return 'medium';
  if (affectedCount <= 7) return 'high';
  return 'extreme';
}

/**
 * GET /api/health
 * Health check endpoint with connection pool status
 */
app.get('/api/health', async (req, res) => {
  try {
    const poolStatus = {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    };

    // Test database connection
    const client = await pool.connect();
    const dbResult = await client.query('SELECT NOW()');
    client.release();

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        dbTime: dbResult.rows[0].now,
        pool: poolStatus,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

/**
 * Refresh materialized view endpoint
 */
app.post('/api/impact/refresh', async (req, res) => {
  try {
    await pool.query('REFRESH MATERIALIZED VIEW impact_summary_matview');
    res.json({ success: true, message: 'Materialized view refreshed successfully' });
  } catch (error) {
    console.error('Error refreshing materialized view:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Graceful shutdown
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`Impact API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Impact summary: http://localhost:${PORT}/api/impact/summary?climate=present`);
});

/**
 * Error handler
 */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});
