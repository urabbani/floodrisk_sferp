/**
 * Population Risk API Endpoint
 *
 * Provides casualty estimation (fatalities and injuries) for flood scenarios
 * based on population hazard statistics and depth × velocity matrices.
 *
 * Endpoint: GET /api/population-risk
 */

import express from 'express';
import pool from './db.mjs';
import casualtyEstimator from './casualty-estimator.mjs';

const router = express.Router();

/**
 * Districts to include in the response (7 active districts)
 */
const ACTIVE_DISTRICTS = [
  'Dadu',
  'Jacobabad',
  'Jamshoro',
  'Kashmore',
  'Larkana',
  'Qambar Shahdadkot',
  'Shikarpur',
];

/**
 * Normalize depth bin key from database to response format
 */
function normalizeDepthBinKey(key) {
  if (key.includes('15') || key.includes('100cm')) return '15-100cm';
  if (key.includes('1-2')) return '1-2m';
  if (key.includes('2-3')) return '2-3m';
  if (key.includes('3-4')) return '3-4m';
  if (key.includes('4-5')) return '4-5m';
  if (key.includes('above') || key.includes('5m')) return 'above5m';
  return key;
}

/**
 * Parse scenario name to extract components
 */
function parseScenarioName(scenarioName) {
  // Format: T3_{rp}yrs_{Climate}_{Maintenance}
  // Example: T3_25yrs_Present_Breaches
  const match = scenarioName.match(/^T3_(\d+(?:\.\d+)?)yrs_(Present|Future)_(Breaches|Perfect|RedCapacity)$/);
  if (!match) return null;

  return {
    returnPeriod: match[1],
    climate: match[2].toLowerCase(),
    maintenance: match[3].toLowerCase(),
  };
}

/**
 * GET /api/population-risk
 *
 * Query parameters:
 *   - climate (required): 'present' | 'future'
 *   - maintenance (optional): 'breaches' | 'perfect' | 'redcapacity' | 'all'
 *   - returnPeriod (optional): '2.3' | '5' | '10' | '25' | '50' | '100' | '500' | 'all'
 */
router.get('/', async (req, res) => {
  try {
    const {
      climate,
      maintenance = 'all',
      returnPeriod = 'all',
    } = req.query;

    // Validate required parameters
    if (!climate || (climate !== 'present' && climate !== 'future')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid climate parameter. Must be "present" or "future".',
      });
    }

    // Build query
    let query = `
      SELECT
        id,
        scenario_name,
        climate,
        maintenance,
        return_period,
        total_affected_population,
        depth_15_100cm,
        depth_1_2m,
        depth_2_3m,
        depth_3_4m,
        depth_4_5m,
        depth_above5m,
        vel_low_depth_15_100cm,
        vel_low_depth_1_2m,
        vel_low_depth_2_3m,
        vel_low_depth_3_4m,
        vel_low_depth_4_5m,
        vel_low_depth_above5m,
        vel_moderate_depth_15_100cm,
        vel_moderate_depth_1_2m,
        vel_moderate_depth_2_3m,
        vel_moderate_depth_3_4m,
        vel_moderate_depth_4_5m,
        vel_moderate_depth_above5m,
        vel_high_depth_15_100cm,
        vel_high_depth_1_2m,
        vel_high_depth_2_3m,
        vel_high_depth_3_4m,
        vel_high_depth_4_5m,
        vel_high_depth_above5m,
        dur_short_depth_15_100cm,
        dur_short_depth_1_2m,
        dur_short_depth_2_3m,
        dur_short_depth_3_4m,
        dur_short_depth_4_5m,
        dur_short_depth_above5m,
        dur_medium_depth_15_100cm,
        dur_medium_depth_1_2m,
        dur_medium_depth_2_3m,
        dur_medium_depth_3_4m,
        dur_medium_depth_4_5m,
        dur_medium_depth_above5m,
        dur_long_depth_15_100cm,
        dur_long_depth_1_2m,
        dur_long_depth_2_3m,
        dur_long_depth_3_4m,
        dur_long_depth_4_5m,
        dur_long_depth_above5m,
        vh_exceed_population,
        district_stats
      FROM impact.population_hazard_stats
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

    if (returnPeriod && returnPeriod !== 'all') {
      query += ` AND return_period = $${paramIndex}`;
      params.push(returnPeriod);
      paramIndex++;
    }

    query += ` ORDER BY return_period`;

    // Execute query
    const result = await pool.query(query, params);

    // Process results
    const scenarios = [];
    for (const row of result.rows) {
      // Calculate casualties for the scenario
      const casualtyEstimate = casualtyEstimator.calculateScenarioCasualties(row);

      // Build depth bins object
      const depthBins = {
        '15-100cm': Math.round(parseFloat(row.depth_15_100cm) || 0),
        '1-2m': Math.round(parseFloat(row.depth_1_2m) || 0),
        '2-3m': Math.round(parseFloat(row.depth_2_3m) || 0),
        '3-4m': Math.round(parseFloat(row.depth_3_4m) || 0),
        '4-5m': Math.round(parseFloat(row.depth_4_5m) || 0),
        'above5m': Math.round(parseFloat(row.depth_above5m) || 0),
      };

      // Process district breakdown
      const districtBreakdown = [];
      const districtStats = row.district_stats || {};

      for (const district of ACTIVE_DISTRICTS) {
        const districtData = districtStats[district];
        if (!districtData) {
          // District not in data - skip or add with zeros
          continue;
        }

        // Calculate casualties for this district
        const districtCasualties = casualtyEstimator.calculateDistrictCasualties(
          districtData,
          parseFloat(row.vh_exceed_population) || 0
        );

        districtBreakdown.push({
          district,
          affectedPopulation: Math.round(parseFloat(districtData.affected_population) || 0),
          fatalityRiskLevel: districtCasualties.fatalityRiskLevel,
          injuryRiskLevel: districtCasualties.injuryRiskLevel,
          estimatedFatalities: districtCasualties.fatalities,
          estimatedInjuries: districtCasualties.injuries,
        });
      }

      // Build scenario object
      scenarios.push({
        scenarioName: row.scenario_name,
        climate: row.climate,
        maintenance: row.maintenance,
        returnPeriod: row.return_period,
        totalAffectedPopulation: Math.round(parseFloat(row.total_affected_population) || 0),
        depthBins,
        casualtyEstimate: {
          ...casualtyEstimate,
          keyDrivers: casualtyEstimate.keyDrivers,
        },
        districtBreakdown,
      });
    }

    // Build response
    const response = {
      success: true,
      data: {
        climate,
        scenarios,
        metadata: {
          lastUpdated: new Date().toISOString(),
          totalScenarios: scenarios.length,
          methodology: {
            sources: [
              'Jonkman, S.N. et al. (2008). Loss of life estimation in flood risk assessment. Journal of Flood Risk Management.',
              'USBR (2015). RCEM – Reclamation Consequence Estimating Methodology.',
              'AIDR (2017). Managing the Floodplain: Handbook 7.',
              'Defra/Environment Agency (2006). Flood Risks to People – Phase 2. R&D Technical Report FD2321.',
            ],
            notes: [
              'Casualty estimates use depth × velocity mortality factors from established flood risk research.',
              'Low, moderate, and high estimates reflect uncertainty in flood warning effectiveness and evacuation.',
              'Injuries estimated as 3× fatalities (international convention).',
              'V×h > 1.5 m²/s threshold indicates hazardous conditions for stability.',
            ],
          },
        },
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching population risk:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: null,
    });
  }
});

export default router;
