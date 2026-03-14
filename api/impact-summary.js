/**
 * Flood Impact & Exposure API Endpoint
 *
 * This is a standalone Node.js/Express API server for querying impact data
 * from PostGIS and returning it to the frontend.
 *
 * To run:
 *   1. Install dependencies: npm install express pg cors
 *   2. Set DATABASE_URL environment variable
 *   3. Run: node api/impact-summary-api.js
 *
 * Or integrate this into your existing backend.
 */

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || '10.0.0.205',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'maltanadirSRV0',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Middleware
app.use(cors());
app.use(express.json());

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

    query += ` ORDER BY return_period, maintenance, exposure_type`;

    // Execute query
    const result = await pool.query(query, params);

    // Process results into the expected format
    const summaries = processResults(result.rows, parseFloat(depthThreshold));

    // Build response
    const response = {
      success: true,
      data: {
        climate,
        summaries,
        metadata: {
          lastUpdated: new Date().toISOString(),
          depthThreshold: parseFloat(depthThreshold),
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
function processResults(rows, depthThreshold) {
  // Group by scenario (climate + maintenance + return_period)
  const scenarioMap = new Map();

  rows.forEach((row) => {
    const scenarioId = `t3_${row.return_period}yrs_${row.climate}_${row.maintenance}`;

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

    // Add exposure impact
    scenario.impacts[row.exposure_type] = {
      layerType: row.exposure_type,
      totalFeatures: row.total_features,
      affectedFeatures: row.affected_features,
      maxDepthBin: row.max_depth_bin,
      depthBins: [
        { range: '15-100cm', minDepth: 0.15, maxDepth: 1.0, count: row.bin_15_100cm_count, percentage: 0 },
        { range: '1-2m', minDepth: 1.0, maxDepth: 2.0, count: row.bin_1_2m_count, percentage: 0 },
        { range: '2-3m', minDepth: 2.0, maxDepth: 3.0, count: row.bin_2_3m_count, percentage: 0 },
        { range: '3-4m', minDepth: 3.0, maxDepth: 4.0, count: row.bin_3_4m_count, percentage: 0 },
        { range: '4-5m', minDepth: 4.0, maxDepth: 5.0, count: row.bin_4_5m_count, percentage: 0 },
        { range: 'above5m', minDepth: 5.0, maxDepth: null, count: row.bin_above5m_count, percentage: 0 },
      ],
      geoserverLayer: `T3_${row.return_period}yrs_${row.climate.charAt(0).toUpperCase() + row.climate.slice(1)}_${row.maintenance === 'redcapacity' ? 'RedCapacity' : row.maintenance.charAt(0).toUpperCase() + row.maintenance.slice(1)}_Impacted.${row.exposure_type}`,
      workspace: 'postgres',
      geometryType: getGeometryType(row.exposure_type),
    };

    // Calculate percentages for depth bins
    const totalAffected = row.affected_features || 0;
    scenario.impacts[row.exposure_type].depthBins.forEach((bin) => {
      bin.percentage = totalAffected > 0 ? (bin.count / totalAffected) * 100 : 0;
    });

    // Count affected exposures for severity calculation
    if (row.affected_features > depthThreshold) {
      scenario.totalAffectedExposures++;
    }
  });

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
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
