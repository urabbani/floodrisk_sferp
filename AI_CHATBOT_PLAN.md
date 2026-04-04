# AI Chatbot Assistant — Implementation Instructions

> **Purpose:** This document contains everything needed to implement the AI chatbot feature in one shot. Follow each section in order. Every file path, code block, and integration point is exact.

---

## 1. What We Are Building

A new **"AI Assistant"** sidebar tab that lets users type natural-language questions about flood risk data. The backend interprets the question, runs analytical queries against the existing PostgreSQL database and risk JSON, and returns a response containing:

- **Markdown text** — insight/explanation
- **Charts** — rendered with Recharts (already in the project)
- **Map actions** — buttons that toggle existing map layers or zoom to extents

The user never sees anything about LLMs, APIs, or tokens. It's just an "Ask AI" panel.

---

## 2. LLM Access — OpenRouter

All LLM calls go through [OpenRouter](https://openrouter.ai/) using the OpenAI-compatible API format.

```
Base URL: https://openrouter.ai/api/v1
Model: anthropic/claude-sonnet-4 (or google/gemini-2.5-flash, meta-llama/llama-4-maverick — configurable)
Auth: Bearer token via OPENROUTER_API_KEY env var
```

The backend makes standard `fetch()` calls — no SDK needed. The request format is identical to OpenAI's chat completions API:

```javascript
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://portal.srpsid-dss.gos.pk',
    'X-Title': 'Flood Risk Assessment Portal',
  },
  body: JSON.stringify({
    model: process.env.OPENROUTER_MODEL || 'anthropic/claude-sonnet-4',
    messages: [...],
    temperature: 0.1,
    max_tokens: 3000,
    response_format: { type: 'json_object' },  // Stage 1 only
  }),
});
```

---

## 3. Architecture — Two-Stage Pipeline

The LLM **never touches the database**. It only selects from pre-built analysis functions.

```
User Question
     │
     ▼
┌─────────────────────────────────────────┐
│  POST /api/chat                          │
│                                          │
│  Stage 1: LLM call (JSON mode)          │
│  "Which function should I call?"         │
│  → Returns: { function, parameters }     │
│                                          │
│  Analysis Engine:                        │
│  Run the selected function with params   │
│  → Direct SQL to PostGIS                 │
│  → Read /public/data/risk.json           │
│  → Returns: structured data              │
│                                          │
│  Stage 2: LLM call (text mode)          │
│  "Explain these results to the user"     │
│  → Returns: { text, charts, mapActions } │
└─────────────────────────────────────────┘
     │
     ▼
Frontend renders markdown + charts + buttons
```

---

## 4. Backend Implementation

### 4.1 Install dependency

```bash
cd /mnt/d/floodrisk_sferp/api
# No new npm packages needed — we use native fetch() (Node 18+)
```

### 4.2 Create `api/chat.mjs`

This is the complete backend module. Create this file:

**File: `api/chat.mjs`**

```javascript
/**
 * AI Chat API Router
 *
 * Two-stage LLM pipeline:
 * 1. Intent extraction (JSON mode) — picks an analysis function + parameters
 * 2. Response generation (text mode) — produces markdown + chart specs + map actions
 *
 * LLM access via OpenRouter (OpenAI-compatible API)
 */

import { Router } from 'express';
import pool from './db.mjs';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const router = Router();
const __dirname = dirname(fileURLToPath(import.meta.url));

// ============================================================================
// CONFIG
// ============================================================================

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-sonnet-4';

// Rate limiting: simple in-memory tracker
const rateLimiter = new Map(); // ip -> { count, resetAt }
const RATE_LIMIT = 20;         // requests per window
const RATE_WINDOW = 60_000;    // 1 minute

// ============================================================================
// DOMAIN CONSTANTS (used in LLM prompts and analysis functions)
// ============================================================================

const RETURN_PERIODS = ['2.3', '5', '10', '25', '50', '100', '500'];
const MAINTENANCE_LEVELS = ['breaches', 'redcapacity', 'perfect'];
const CLIMATES = ['present', 'future'];
const EXPOSURE_TYPES = [
  'BHU', 'Buildings', 'Built_up_Area', 'Cropped_Area',
  'Electric_Grid', 'Railways', 'Roads', 'Settlements', 'Telecom_Towers'
];
const EXPOSURE_LABELS = {
  BHU: 'Basic Health Units', Buildings: 'Buildings', Built_up_Area: 'Built-up Area',
  Cropped_Area: 'Cropped Area', Electric_Grid: 'Electric Grid', Railways: 'Railways',
  Roads: 'Roads', Settlements: 'Settlements', Telecom_Towers: 'Telecom Towers'
};
const DISTRICTS = [
  'Dadu', 'Jacobabad', 'Jamshoro', 'Kashmore', 'Larkana',
  'Naushahro Feroze', 'Qambar Shahdadkot', 'Shaheed Benazirabad', 'Shikarpur'
];
const DEPTH_BINS = ['15-100cm', '1-2m', '2-3m', '3-4m', '4-5m', 'above5m'];
const RISK_MODES = ['Exp', 'Vul', 'Dmg'];
const RISK_ASSETS = ['crop', 'buildLow56', 'buildLow44', 'buildHigh'];
const RISK_ASSET_LABELS = {
  crop: 'Agriculture (ha)', buildLow56: 'Kacha (sqm)',
  buildLow44: 'Pakka (sqm)', buildHigh: 'High-Rise (sqm)'
};
const MAINTENANCE_LABELS = {
  breaches: 'Flood 2022 (Breaches)', redcapacity: 'Reduced Capacity', perfect: 'Perfect'
};

// ============================================================================
// RISK JSON LOADER (cached in memory)
// ============================================================================

let riskDataCache = null;

function loadRiskData() {
  if (riskDataCache) return riskDataCache;
  try {
    const riskPath = join(__dirname, '..', 'public', 'data', 'risk.json');
    riskDataCache = JSON.parse(readFileSync(riskPath, 'utf-8'));
    console.log('[Chat] Loaded risk.json:', Object.keys(riskDataCache.scenarios).length, 'scenarios');
  } catch (err) {
    console.error('[Chat] Failed to load risk.json:', err.message);
    riskDataCache = null;
  }
  return riskDataCache;
}

// ============================================================================
// ANALYSIS FUNCTIONS
// ============================================================================

/**
 * 1. get_impact_summary — Fetch impact data for one or more scenarios
 */
async function get_impact_summary({ climate, maintenance, returnPeriod }) {
  let query = `
    SELECT m.*, p.total_population, p.affected_population, p.affected_percentage as pop_pct,
           p.pop_15_100cm, p.pop_1_2m, p.pop_2_3m, p.pop_3_4m, p.pop_4_5m, p.pop_above5m
    FROM impact_summary_matview m
    LEFT JOIN impact.population_stats p
      ON m.climate = p.climate AND m.maintenance = p.maintenance AND m.return_period = p.return_period
    WHERE m.climate = $1
  `;
  const params = [climate];
  let idx = 2;
  if (maintenance && maintenance !== 'all') {
    query += ` AND m.maintenance = $${idx++}`;
    params.push(maintenance);
  }
  if (returnPeriod) {
    query += ` AND m.return_period = $${idx++}`;
    params.push(returnPeriod);
  }
  query += ` ORDER BY m.return_period_num, m.maintenance, m.exposure_type`;

  const result = await pool.query(query, params);
  return groupImpactRows(result.rows);
}

/**
 * 2. compare_scenarios — Delta between two specific scenarios
 */
async function compare_scenarios({ climateA, maintenanceA, returnPeriodA, climateB, maintenanceB, returnPeriodB }) {
  const [a, b] = await Promise.all([
    get_impact_summary({ climate: climateA, maintenance: maintenanceA, returnPeriod: returnPeriodA }),
    get_impact_summary({ climate: climateB, maintenance: maintenanceB, returnPeriod: returnPeriodB }),
  ]);
  const scenarioA = a[0] || {};
  const scenarioB = b[0] || {};

  const deltas = {};
  for (const exp of EXPOSURE_TYPES) {
    const aImp = scenarioA.impacts?.[exp];
    const bImp = scenarioB.impacts?.[exp];
    const aPct = (aImp && aImp.total > 0) ? (aImp.affected / aImp.total * 100) : 0;
    const bPct = (bImp && bImp.total > 0) ? (bImp.affected / bImp.total * 100) : 0;
    deltas[exp] = {
      label: EXPOSURE_LABELS[exp],
      scenarioA_pct: round2(aPct),
      scenarioB_pct: round2(bPct),
      delta_pct: round2(bPct - aPct),
    };
  }

  return {
    scenarioA: { climate: climateA, maintenance: maintenanceA, returnPeriod: returnPeriodA, summary: scenarioA },
    scenarioB: { climate: climateB, maintenance: maintenanceB, returnPeriod: returnPeriodB, summary: scenarioB },
    deltas,
  };
}

/**
 * 3. convergence_analysis — Find RP where maintenance levels converge
 */
async function convergence_analysis({ climate, metric, threshold_pct }) {
  climate = climate || 'present';
  metric = metric || 'totalAffected';
  threshold_pct = threshold_pct || 5;

  // Fetch all scenarios for this climate
  const allScenarios = await get_impact_summary({ climate, maintenance: 'all' });

  // Group by return period
  const byRP = {};
  for (const s of allScenarios) {
    if (!byRP[s.returnPeriod]) byRP[s.returnPeriod] = {};
    byRP[s.returnPeriod][s.maintenance] = s;
  }

  const trend = [];
  let convergenceRP = null;

  for (const rp of RETURN_PERIODS) {
    const group = byRP[rp];
    if (!group) continue;

    const values = {};
    for (const m of MAINTENANCE_LEVELS) {
      if (!group[m]) continue;
      if (metric === 'totalAffected') {
        values[m] = Object.values(group[m].impacts || {}).reduce((sum, imp) => sum + (imp?.affected || 0), 0);
      } else if (metric === 'affectedExposureCount') {
        values[m] = group[m].totalAffectedExposures || 0;
      } else if (metric === 'population') {
        values[m] = group[m].populationAffected || 0;
      } else if (EXPOSURE_TYPES.includes(metric)) {
        const imp = group[m].impacts?.[metric];
        values[m] = (imp && imp.total > 0) ? round2(imp.affected / imp.total * 100) : 0;
      }
    }

    const vals = Object.values(values);
    const maxVal = Math.max(...vals);
    const minVal = Math.min(...vals);
    const diff = maxVal > 0 ? round2((maxVal - minVal) / maxVal * 100) : 0;

    trend.push({
      returnPeriod: rp,
      breaches: values.breaches ?? null,
      redcapacity: values.redcapacity ?? null,
      perfect: values.perfect ?? null,
      diff_pct: diff,
    });

    if (diff <= threshold_pct && !convergenceRP) {
      convergenceRP = rp;
    }
  }

  return { climate, metric, threshold_pct, convergenceRP, trend };
}

/**
 * 4. trend_analysis — How a metric changes across return periods
 */
async function trend_analysis({ climate, maintenance, exposureType }) {
  climate = climate || 'present';
  maintenance = maintenance || 'breaches';

  const scenarios = await get_impact_summary({ climate, maintenance });

  const trend = [];
  for (const rp of RETURN_PERIODS) {
    const s = scenarios.find(sc => sc.returnPeriod === rp);
    if (!s) continue;

    const entry = { returnPeriod: rp };
    if (exposureType && s.impacts?.[exposureType]) {
      const imp = s.impacts[exposureType];
      entry.affected = imp.affected;
      entry.total = imp.total;
      entry.pct = imp.total > 0 ? round2(imp.affected / imp.total * 100) : 0;
    } else {
      // All exposures summary
      let totalAffected = 0, totalFeatures = 0;
      for (const exp of EXPOSURE_TYPES) {
        if (s.impacts?.[exp]) {
          totalAffected += s.impacts[exp].affected;
          totalFeatures += s.impacts[exp].total;
        }
      }
      entry.totalAffected = totalAffected;
      entry.affectedExposureTypes = s.totalAffectedExposures;
      entry.populationAffected = s.populationAffected;
    }
    trend.push(entry);
  }

  return { climate, maintenance, exposureType, trend };
}

/**
 * 5. threshold_analysis — Find when an exposure crosses X% affected
 */
async function threshold_analysis({ exposureType, threshold_pct, climate }) {
  climate = climate || 'present';
  threshold_pct = threshold_pct || 50;

  const allScenarios = await get_impact_summary({ climate, maintenance: 'all' });

  const results = [];
  for (const m of MAINTENANCE_LEVELS) {
    const scenarios = allScenarios.filter(s => s.maintenance === m);
    let crossingRP = null;

    for (const rp of RETURN_PERIODS) {
      const s = scenarios.find(sc => sc.returnPeriod === rp);
      if (!s) continue;
      const imp = s.impacts?.[exposureType];
      const pct = (imp && imp.total > 0) ? round2(imp.affected / imp.total * 100) : 0;

      results.push({ maintenance: m, returnPeriod: rp, pct });

      if (pct >= threshold_pct && !crossingRP) {
        crossingRP = rp;
      }
    }
  }

  return { exposureType, label: EXPOSURE_LABELS[exposureType], threshold_pct, climate, data: results };
}

/**
 * 6. population_by_depth — Population depth distribution for scenario(s)
 */
async function population_by_depth({ climate, maintenance, returnPeriod }) {
  let query = `
    SELECT climate, maintenance, return_period, total_population, affected_population,
           affected_percentage, pop_15_100cm, pop_1_2m, pop_2_3m, pop_3_4m, pop_4_5m, pop_above5m
    FROM impact.population_stats
    WHERE climate = $1
  `;
  const params = [climate];
  let idx = 2;
  if (maintenance && maintenance !== 'all') {
    query += ` AND maintenance = $${idx++}`;
    params.push(maintenance);
  }
  if (returnPeriod) {
    query += ` AND return_period = $${idx++}`;
    params.push(returnPeriod);
  }
  query += ` ORDER BY return_period::numeric`;

  const result = await pool.query(query, params);
  return result.rows.map(r => ({
    climate: r.climate,
    maintenance: r.maintenance,
    returnPeriod: r.return_period,
    totalPopulation: parseFloat(r.total_population),
    affectedPopulation: parseFloat(r.affected_population),
    affectedPct: parseFloat(r.affected_percentage),
    depthBins: {
      '15-100cm': parseFloat(r.pop_15_100cm) || 0,
      '1-2m': parseFloat(r.pop_1_2m) || 0,
      '2-3m': parseFloat(r.pop_2_3m) || 0,
      '3-4m': parseFloat(r.pop_3_4m) || 0,
      '4-5m': parseFloat(r.pop_4_5m) || 0,
      'above5m': parseFloat(r.pop_above5m) || 0,
    },
  }));
}

/**
 * 7. district_risk_ranking — Rank districts by a risk metric
 */
async function district_risk_ranking({ returnPeriod, climate, maintenance, mode, asset }) {
  const risk = loadRiskData();
  if (!risk) return { error: 'Risk data not available' };

  const key = `${returnPeriod}_${climate}_${maintenance}`;
  const scenarioData = risk.data[key];
  if (!scenarioData) return { error: `Scenario ${key} not found` };

  mode = mode || 'Dmg';
  const ranking = [];

  for (const district of DISTRICTS) {
    const d = scenarioData[district];
    if (!d || !d[mode]) continue;

    if (asset) {
      ranking.push({ district, value: d[mode][asset] || 0 });
    } else {
      const total = (d[mode].crop || 0) + (d[mode].buildLow56 || 0) +
                    (d[mode].buildLow44 || 0) + (d[mode].buildHigh || 0);
      ranking.push({
        district,
        total: round2(total),
        crop: round2(d[mode].crop || 0),
        buildLow56: round2(d[mode].buildLow56 || 0),
        buildLow44: round2(d[mode].buildLow44 || 0),
        buildHigh: round2(d[mode].buildHigh || 0),
      });
    }
  }

  ranking.sort((a, b) => (b.total || b.value || 0) - (a.total || a.value || 0));
  return { scenario: key, mode, asset: asset || 'all', ranking };
}

/**
 * 8. district_risk_comparison — Compare risk across scenarios for a district
 */
async function district_risk_comparison({ district, mode, climate }) {
  const risk = loadRiskData();
  if (!risk) return { error: 'Risk data not available' };

  mode = mode || 'Dmg';
  const results = [];

  for (const rp of RETURN_PERIODS) {
    for (const m of MAINTENANCE_LEVELS) {
      const key = `${rp}_${climate || 'present'}_${m}`;
      const d = risk.data[key]?.[district];
      if (!d || !d[mode]) continue;

      const total = (d[mode].crop || 0) + (d[mode].buildLow56 || 0) +
                    (d[mode].buildLow44 || 0) + (d[mode].buildHigh || 0);
      results.push({
        returnPeriod: rp,
        maintenance: m,
        total: round2(total),
        crop: round2(d[mode].crop || 0),
        buildLow56: round2(d[mode].buildLow56 || 0),
        buildLow44: round2(d[mode].buildLow44 || 0),
        buildHigh: round2(d[mode].buildHigh || 0),
      });
    }
  }

  return { district, mode, climate: climate || 'present', data: results };
}

/**
 * 9. exposure_detail — Depth-bin breakdown for a specific exposure in a scenario
 */
async function exposure_detail({ climate, maintenance, returnPeriod, exposureType }) {
  const query = `
    SELECT exposure_type, total_features, affected_features,
           bin_15_100cm_count, bin_1_2m_count, bin_2_3m_count,
           bin_3_4m_count, bin_4_5m_count, bin_above5m_count
    FROM impact_summary_matview
    WHERE climate = $1 AND maintenance = $2 AND return_period = $3 AND exposure_type = $4
  `;
  const result = await pool.query(query, [climate, maintenance, returnPeriod, exposureType]);
  if (result.rows.length === 0) return { error: 'No data found' };

  const r = result.rows[0];
  return {
    exposureType, label: EXPOSURE_LABELS[exposureType],
    climate, maintenance, returnPeriod,
    totalFeatures: parseInt(r.total_features),
    affectedFeatures: parseInt(r.affected_features),
    depthBins: [
      { range: '15-100cm', count: parseInt(r.bin_15_100cm_count) || 0 },
      { range: '1-2m', count: parseInt(r.bin_1_2m_count) || 0 },
      { range: '2-3m', count: parseInt(r.bin_2_3m_count) || 0 },
      { range: '3-4m', count: parseInt(r.bin_3_4m_count) || 0 },
      { range: '4-5m', count: parseInt(r.bin_4_5m_count) || 0 },
      { range: 'above5m', count: parseInt(r.bin_above5m_count) || 0 },
    ],
  };
}

/**
 * 10. cross_scenario_matrix — Full 7×3 matrix of a metric for one climate
 */
async function cross_scenario_matrix({ climate, metric, exposureType }) {
  climate = climate || 'present';
  const allScenarios = await get_impact_summary({ climate, maintenance: 'all' });

  const matrix = [];
  for (const rp of RETURN_PERIODS) {
    const row = { returnPeriod: rp };
    for (const m of MAINTENANCE_LEVELS) {
      const s = allScenarios.find(sc => sc.returnPeriod === rp && sc.maintenance === m);
      if (!s) { row[m] = null; continue; }

      if (metric === 'population') {
        row[m] = s.populationAffected || 0;
      } else if (metric === 'severity') {
        row[m] = s.totalAffectedExposures || 0;
      } else if (exposureType && s.impacts?.[exposureType]) {
        const imp = s.impacts[exposureType];
        row[m] = imp.total > 0 ? round2(imp.affected / imp.total * 100) : 0;
      } else {
        // Default: total affected features across all exposures
        row[m] = Object.values(s.impacts || {}).reduce((sum, imp) => sum + (imp?.affected || 0), 0);
      }
    }
    matrix.push(row);
  }

  return { climate, metric: metric || 'totalAffected', exposureType, matrix };
}

/**
 * 11. infrastructure_impact — Focused analysis on infrastructure layers
 */
async function infrastructure_impact({ climate, returnPeriod }) {
  climate = climate || 'present';
  const infraTypes = ['Roads', 'Railways', 'Electric_Grid', 'Telecom_Towers', 'BHU'];
  const allScenarios = await get_impact_summary({ climate, maintenance: 'all' });

  const results = [];
  for (const rp of (returnPeriod ? [returnPeriod] : RETURN_PERIODS)) {
    for (const m of MAINTENANCE_LEVELS) {
      const s = allScenarios.find(sc => sc.returnPeriod === rp && sc.maintenance === m);
      if (!s) continue;

      const entry = { returnPeriod: rp, maintenance: m };
      for (const exp of infraTypes) {
        const imp = s.impacts?.[exp];
        entry[exp] = {
          affected: imp?.affected || 0,
          total: imp?.total || 0,
          pct: (imp && imp.total > 0) ? round2(imp.affected / imp.total * 100) : 0,
        };
      }
      results.push(entry);
    }
  }

  return { climate, returnPeriod: returnPeriod || 'all', data: results };
}

/**
 * 12. aggregate_stats — Compute min/max/avg across scenarios
 */
async function aggregate_stats({ climate, exposureType, metric }) {
  climate = climate || 'present';
  const allScenarios = await get_impact_summary({ climate, maintenance: 'all' });

  const values = [];
  for (const s of allScenarios) {
    let val;
    if (exposureType && s.impacts?.[exposureType]) {
      const imp = s.impacts[exposureType];
      val = imp.total > 0 ? round2(imp.affected / imp.total * 100) : 0;
    } else if (metric === 'population') {
      val = s.populationAffected || 0;
    } else {
      val = Object.values(s.impacts || {}).reduce((sum, imp) => sum + (imp?.affected || 0), 0);
    }
    values.push({ returnPeriod: s.returnPeriod, maintenance: s.maintenance, value: val });
  }

  const nums = values.map(v => v.value);
  return {
    climate, exposureType, metric,
    min: Math.min(...nums), max: Math.max(...nums),
    avg: round2(nums.reduce((a, b) => a + b, 0) / nums.length),
    count: nums.length,
    values,
  };
}

// ============================================================================
// ANALYSIS FUNCTION REGISTRY
// ============================================================================

const ANALYSIS_FUNCTIONS = {
  get_impact_summary,
  compare_scenarios,
  convergence_analysis,
  trend_analysis,
  threshold_analysis,
  population_by_depth,
  district_risk_ranking,
  district_risk_comparison,
  exposure_detail,
  cross_scenario_matrix,
  infrastructure_impact,
  aggregate_stats,
};

// ============================================================================
// HELPERS
// ============================================================================

function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Group flat matview rows into scenario objects
 */
function groupImpactRows(rows) {
  const map = new Map();
  for (const r of rows) {
    const key = `${r.climate}_${r.maintenance}_${r.return_period}`;
    if (!map.has(key)) {
      map.set(key, {
        climate: r.climate,
        maintenance: r.maintenance,
        returnPeriod: r.return_period,
        totalAffectedExposures: 0,
        populationAffected: parseFloat(r.affected_population) || 0,
        populationTotal: parseFloat(r.total_population) || 0,
        impacts: {},
      });
    }
    const s = map.get(key);
    s.impacts[r.exposure_type] = {
      affected: parseInt(r.affected_features) || 0,
      total: parseInt(r.total_features) || 0,
      maxDepthBin: r.max_depth_bin,
    };
    if ((parseInt(r.affected_features) || 0) > 0) {
      s.totalAffectedExposures++;
    }
  }
  return Array.from(map.values());
}

// ============================================================================
// LLM PROMPTS
// ============================================================================

const SYSTEM_PROMPT_STAGE1 = `You are an intent classifier for the Sindh Province Flood Risk Assessment Portal.

DOMAIN:
- 42 flood scenarios = 7 return periods × 3 maintenance levels × 2 climates
- Return periods: ${RETURN_PERIODS.join(', ')} years
- Maintenance: breaches (Flood 2022 actual levee breaches), redcapacity (reduced canal capacity), perfect (ideal maintenance)
- Climate: present, future
- 9 exposure layers: ${EXPOSURE_TYPES.join(', ')}
  - Point layers: BHU (Basic Health Units), Telecom_Towers, Settlements
  - Line layers: Electric_Grid, Railways, Roads
  - Polygon layers: Buildings, Built_up_Area, Cropped_Area
- 9 districts: ${DISTRICTS.join(', ')}
- Risk analysis: 3 modes (Exp=Exposure area, Vul=Vulnerability, Dmg=Economic Damage in USD)
- Risk assets: crop (Agriculture ha), buildLow56 (Kacha sqm), buildLow44 (Pakka sqm), buildHigh (High-Rise sqm)
- Depth bins: ${DEPTH_BINS.join(', ')}
- Population impact data per scenario with depth bin breakdown

AVAILABLE FUNCTIONS:

1. get_impact_summary({ climate, maintenance?, returnPeriod? })
   → Fetch impact data. Use maintenance="all" or omit to get all 3 levels.

2. compare_scenarios({ climateA, maintenanceA, returnPeriodA, climateB, maintenanceB, returnPeriodB })
   → Compare two specific scenarios side by side.

3. convergence_analysis({ climate?, metric?, threshold_pct? })
   → Find the return period where maintenance levels stop making a significant difference.
   → metric: "totalAffected" | "affectedExposureCount" | "population" | any exposure type name
   → threshold_pct: default 5 (percentage difference considered insignificant)

4. trend_analysis({ climate?, maintenance?, exposureType? })
   → How a metric changes across all 7 return periods.

5. threshold_analysis({ exposureType, threshold_pct?, climate? })
   → Find when a specific exposure crosses X% affected.

6. population_by_depth({ climate, maintenance?, returnPeriod? })
   → Population distribution across flood depth bins.

7. district_risk_ranking({ returnPeriod, climate, maintenance, mode?, asset? })
   → Rank districts by risk. mode: Exp|Vul|Dmg (default Dmg). asset: optional specific asset.

8. district_risk_comparison({ district, mode?, climate? })
   → Compare risk for one district across all scenarios.

9. exposure_detail({ climate, maintenance, returnPeriod, exposureType })
   → Detailed depth-bin breakdown for one exposure in one scenario.

10. cross_scenario_matrix({ climate?, metric?, exposureType? })
    → Full 7×3 matrix (RP × maintenance) for one metric.
    → metric: "population" | "severity" | "totalAffected". Use exposureType for layer-specific %.

11. infrastructure_impact({ climate?, returnPeriod? })
    → Focused on Roads, Railways, Electric Grid, Telecom Towers, BHU.

12. aggregate_stats({ climate?, exposureType?, metric? })
    → Min/max/avg across all scenarios.

INSTRUCTIONS:
- Analyze the question and return a JSON object with:
  { "function": "<function_name>", "parameters": { ... } }
- Pick the single best function. Fill parameters from the question context.
- For ambiguous questions, make reasonable defaults (climate="present", etc.)
- If the question cannot be answered by any function, return:
  { "function": "none", "message": "explanation of what data is available" }
- Return ONLY valid JSON, nothing else.`;

function buildStage2Prompt(question, functionName, analysisResult) {
  return `You are a flood risk analysis assistant for the Sindh Province Flood Risk Portal. A user asked a question, and an analysis function has returned data. Your job is to provide an insightful response.

USER QUESTION: "${question}"

ANALYSIS FUNCTION CALLED: ${functionName}
ANALYSIS RESULT:
${JSON.stringify(analysisResult, null, 2)}

RESPOND WITH A JSON OBJECT containing these fields:

{
  "text": "Markdown-formatted explanation. Use **bold** for key numbers. Be concise but insightful. 3-6 sentences for simple questions, more for complex analysis. Include specific numbers from the data.",

  "charts": [
    {
      "type": "bar" | "line" | "horizontalBar",
      "title": "Chart title",
      "data": [ { "label": "X-value", "seriesKey1": number, "seriesKey2": number, ... } ],
      "xKey": "label",
      "series": [ { "key": "seriesKey1", "label": "Display Name", "color": "#hex" } ],
      "xLabel": "X axis label",
      "yLabel": "Y axis label"
    }
  ],

  "mapActions": [
    {
      "action": "showLayer",
      "layerId": "GeoServer layer name (e.g., t3_100yrs_present_breaches_maxdepth)",
      "workspace": "results",
      "label": "Button text shown to user"
    }
  ]
}

CHART GUIDELINES:
- Include 1-2 charts when the data has trends, comparisons, or distributions.
- Use "line" for trends across return periods.
- Use "bar" for comparing categories (maintenance levels, exposure types, districts).
- Use "horizontalBar" for rankings.
- Color palette: breaches=#ef4444, redcapacity=#f59e0b, perfect=#22c55e, present=#3b82f6, future=#f97316
- Depth bin colors: 15-100cm=#90EE90, 1-2m=#FFD700, 2-3m=#FFA500, 3-4m=#FF6347, 4-5m=#DC143C, above5m=#8B0000
- Keep chart data arrays reasonable (max ~25 data points).
- Every chart data point must have numeric values for all series keys (use 0 for missing).

MAP LAYER GUIDELINES:
- Only include when the question is about a specific scenario.
- Layer naming: t3_{rp}yrs_{climate}_{maintenance}_{parameter}
  - Parameters: maxdepth, maxvelocity, duration, vh
  - Example: t3_25yrs_present_breaches_maxdepth
- Workspace is always "results" for flood layers.
- Omit mapActions if no specific scenario is relevant.

Return ONLY valid JSON.`;
}

// ============================================================================
// LLM CALLER
// ============================================================================

async function callLLM(messages, jsonMode = false) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  const body = {
    model: OPENROUTER_MODEL,
    messages,
    temperature: 0.1,
    max_tokens: 3000,
  };
  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const response = await fetch(OPENROUTER_BASE, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://portal.srpsid-dss.gos.pk',
      'X-Title': 'Flood Risk Assessment Portal',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty LLM response');

  return content;
}

// ============================================================================
// MAIN CHAT ENDPOINT
// ============================================================================

router.post('/', async (req, res) => {
  try {
    // Rate limiting
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();
    const limiter = rateLimiter.get(ip);
    if (limiter && now < limiter.resetAt) {
      if (limiter.count >= RATE_LIMIT) {
        return res.status(429).json({ success: false, error: 'Rate limit exceeded. Try again in a minute.' });
      }
      limiter.count++;
    } else {
      rateLimiter.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    }

    const { message, history } = req.body;
    if (!message || typeof message !== 'string' || message.length > 1000) {
      return res.status(400).json({ success: false, error: 'Invalid message (max 1000 chars).' });
    }

    console.log(`[Chat] Question: "${message}"`);

    // ── Stage 1: Intent extraction ──
    const stage1Messages = [
      { role: 'system', content: SYSTEM_PROMPT_STAGE1 },
    ];

    // Include last 4 turns of history for context
    if (history && Array.isArray(history)) {
      const recent = history.slice(-4);
      for (const h of recent) {
        stage1Messages.push({ role: h.role, content: h.content });
      }
    }

    stage1Messages.push({ role: 'user', content: message });

    const stage1Raw = await callLLM(stage1Messages, true);
    console.log('[Chat] Stage 1 raw:', stage1Raw);

    let intent;
    try {
      intent = JSON.parse(stage1Raw);
    } catch {
      // Try to extract JSON from markdown code block
      const match = stage1Raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) {
        intent = JSON.parse(match[1]);
      } else {
        throw new Error('Failed to parse Stage 1 JSON');
      }
    }

    // If no function matches, return the LLM's explanation directly
    if (intent.function === 'none') {
      return res.json({
        success: true,
        reply: {
          text: intent.message || "I couldn't find a matching analysis for that question. Try asking about flood scenarios, impact comparisons, population, infrastructure, or district-level risk.",
          charts: [],
          mapActions: [],
        },
      });
    }

    // ── Execute analysis function ──
    const fn = ANALYSIS_FUNCTIONS[intent.function];
    if (!fn) {
      return res.json({
        success: true,
        reply: {
          text: `I understood your question but encountered an internal error (unknown function: ${intent.function}). Please try rephrasing.`,
          charts: [],
          mapActions: [],
        },
      });
    }

    console.log(`[Chat] Running: ${intent.function}(${JSON.stringify(intent.parameters)})`);
    const analysisResult = await fn(intent.parameters || {});
    console.log('[Chat] Analysis result keys:', Object.keys(analysisResult));

    // ── Stage 2: Response generation ──
    const stage2Messages = [
      { role: 'user', content: buildStage2Prompt(message, intent.function, analysisResult) },
    ];

    const stage2Raw = await callLLM(stage2Messages, true);
    console.log('[Chat] Stage 2 response length:', stage2Raw.length);

    let reply;
    try {
      reply = JSON.parse(stage2Raw);
    } catch {
      const match = stage2Raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) {
        reply = JSON.parse(match[1]);
      } else {
        // Fallback: use raw text as response
        reply = { text: stage2Raw, charts: [], mapActions: [] };
      }
    }

    // Ensure required fields
    reply.text = reply.text || 'Analysis complete but I could not format the response.';
    reply.charts = Array.isArray(reply.charts) ? reply.charts : [];
    reply.mapActions = Array.isArray(reply.mapActions) ? reply.mapActions : [];

    // Validate chart data (prevent NaN/undefined in frontend)
    reply.charts = reply.charts.filter(chart => {
      if (!chart.data || !Array.isArray(chart.data) || chart.data.length === 0) return false;
      if (!chart.xKey || !chart.series || !Array.isArray(chart.series)) return false;
      return true;
    });

    return res.json({ success: true, reply });

  } catch (error) {
    console.error('[Chat] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process your question. Please try again.',
    });
  }
});

export default router;
```

### 4.3 Mount the router in `api/impact-summary.mjs`

Add these two lines to the existing server file:

**Location:** After the existing `import authRouter from './auth.mjs';` line

```javascript
import chatRouter from './chat.mjs';
```

**Location:** After the existing `app.use('/api/auth', authRouter);` line

```javascript
app.use('/api/chat', chatRouter);
```

### 4.4 Add env var to systemd service

**File: `api/floodrisk-impact-api.service`** — add this line in the `[Service]` section:

```
Environment=OPENROUTER_API_KEY=<your-key-here>
Environment=OPENROUTER_MODEL=anthropic/claude-sonnet-4
```

Then reload:
```bash
sudo systemctl daemon-reload
sudo systemctl restart floodrisk-impact-api
```

For local development, set the env var before running:
```bash
OPENROUTER_API_KEY=sk-or-... node api/impact-summary.mjs
```

---

## 5. Frontend Implementation

### 5.1 Types

**File: `src/components/chat/types.ts`** (NEW)

```typescript
export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: Date;
  charts?: ChartSpec[];
  mapActions?: MapAction[];
  isLoading?: boolean;
};

export type ChartSpec = {
  type: 'bar' | 'line' | 'horizontalBar';
  title: string;
  data: Record<string, any>[];
  xKey: string;
  series: { key: string; label: string; color: string }[];
  xLabel?: string;
  yLabel?: string;
};

export type MapAction = {
  action: 'showLayer' | 'zoomTo';
  layerId?: string;
  workspace?: string;
  extent?: number[];
  label: string;
};

export type ChatReply = {
  text: string;
  charts: ChartSpec[];
  mapActions: MapAction[];
};

export type ChatAPIResponse = {
  success: boolean;
  reply?: ChatReply;
  error?: string;
};
```

### 5.2 useChat hook

**File: `src/components/chat/hooks/useChat.ts`** (NEW)

```typescript
import { useState, useCallback, useRef } from 'react';
import type { ChatMessage, ChatAPIResponse, ChatReply } from '../types';

let msgCounter = 0;
function nextId() { return `msg_${++msgCounter}_${Date.now()}`; }

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: ChatMessage = {
      id: nextId(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    const loadingMsg: ChatMessage = {
      id: nextId(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setIsLoading(true);

    try {
      abortRef.current = new AbortController();

      // Build history for context (last 6 messages, text only)
      const history = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
        signal: abortRef.current.signal,
      });

      const data: ChatAPIResponse = await response.json();

      const assistantMsg: ChatMessage = {
        id: loadingMsg.id,
        role: 'assistant',
        content: data.success && data.reply ? data.reply.text : (data.error || 'Something went wrong.'),
        timestamp: new Date(),
        charts: data.reply?.charts,
        mapActions: data.reply?.mapActions,
      };

      setMessages(prev => prev.map(m => m.id === loadingMsg.id ? assistantMsg : m));
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setMessages(prev => prev.map(m =>
        m.id === loadingMsg.id
          ? { ...m, content: 'Failed to get a response. Please try again.', isLoading: false }
          : m
      ));
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [messages]);

  const clearChat = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setMessages([]);
  }, []);

  return { messages, isLoading, sendMessage, clearChat };
}
```

### 5.3 ChatChart component

**File: `src/components/chat/ChatChart.tsx`** (NEW)

```tsx
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from 'recharts';
import type { ChartSpec } from './types';

export function ChatChart({ spec }: { spec: ChartSpec }) {
  const { type, title, data, xKey, series, xLabel, yLabel } = spec;

  const commonProps = {
    data,
    margin: { top: 5, right: 20, left: 10, bottom: 5 },
  };

  const xAxisProps = {
    dataKey: xKey,
    tick: { fontSize: 11 },
    label: xLabel ? { value: xLabel, position: 'insideBottom' as const, offset: -2, fontSize: 11 } : undefined,
  };

  const yAxisProps = {
    tick: { fontSize: 11 },
    label: yLabel ? { value: yLabel, angle: -90, position: 'insideLeft' as const, fontSize: 11 } : undefined,
    width: 60,
  };

  return (
    <div className="my-3 bg-slate-50 rounded-lg p-3 border border-slate-200">
      {title && <h4 className="text-xs font-semibold text-slate-700 mb-2">{title}</h4>}
      <ResponsiveContainer width="100%" height={220}>
        {type === 'line' ? (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip contentStyle={{ fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {series.map(s => (
              <Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color}
                    name={s.label} strokeWidth={2} dot={{ r: 3 }} />
            ))}
          </LineChart>
        ) : type === 'horizontalBar' ? (
          <BarChart {...commonProps} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis dataKey={xKey} type="category" tick={{ fontSize: 11 }} width={120} />
            <Tooltip contentStyle={{ fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {series.map(s => (
              <Bar key={s.key} dataKey={s.key} fill={s.color} name={s.label} />
            ))}
          </BarChart>
        ) : (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip contentStyle={{ fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {series.map(s => (
              <Bar key={s.key} dataKey={s.key} fill={s.color} name={s.label} />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
```

### 5.4 ChatPanel (main component)

**File: `src/components/chat/ChatPanel.tsx`** (NEW)

```tsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Trash2, Loader2, Map, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useChat } from './hooks/useChat';
import { ChatChart } from './ChatChart';
import type { MapAction } from './types';

const SUGGESTED_QUESTIONS = [
  "At what return period does maintenance level stop mattering?",
  "Compare present vs future climate for the 100-year flood",
  "Which district has the highest economic damage?",
  "How does population impact change with return period?",
  "What percentage of roads are affected in each scenario?",
  "Show depth distribution for Electric Grid in 50yr present breaches",
];

interface ChatPanelProps {
  onMapAction?: (action: MapAction) => void;
  className?: string;
}

export function ChatPanel({ onMapAction, className }: ChatPanelProps) {
  const { messages, isLoading, sendMessage, clearChat } = useChat();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    sendMessage(text);
  }, [input, isLoading, sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleSuggestion = useCallback((q: string) => {
    setInput('');
    sendMessage(q);
  }, [sendMessage]);

  const isEmpty = messages.length === 0;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-slate-50 shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-slate-700">AI Assistant</span>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearChat} title="Clear chat">
            <Trash2 className="w-3.5 h-3.5 text-slate-400" />
          </Button>
        )}
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Bot className="w-10 h-10 text-blue-200 mb-3" />
            <p className="text-sm font-medium text-slate-600 mb-1">Ask me about flood risk data</p>
            <p className="text-xs text-slate-400 mb-4">
              I can analyze scenarios, compare impacts, find thresholds, and show results on the map.
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestion(q)}
                  className="text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full px-3 py-1.5 text-left transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={cn(
              'flex',
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            )}>
              <div className={cn(
                'max-w-[90%] rounded-lg px-3 py-2 text-sm',
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-700'
              )}>
                {/* Loading indicator */}
                {msg.isLoading ? (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-xs">Analyzing...</span>
                  </div>
                ) : (
                  <>
                    {/* Text content — render markdown-like bold */}
                    <div className="whitespace-pre-wrap text-sm leading-relaxed [&_strong]:font-bold">
                      {renderMarkdown(msg.content)}
                    </div>

                    {/* Charts */}
                    {msg.charts?.map((chart, i) => (
                      <ChatChart key={i} spec={chart} />
                    ))}

                    {/* Map actions */}
                    {msg.mapActions && msg.mapActions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-slate-100">
                        {msg.mapActions.map((action, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={() => onMapAction?.(action)}
                          >
                            <Map className="w-3 h-3" />
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-slate-200 p-2 bg-white">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about flood risk..."
            className="flex-1 text-sm border border-slate-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
            maxLength={1000}
          />
          <Button
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Simple markdown renderer: handles **bold**, ## headings, and \n
 * For a full markdown library, install react-markdown.
 */
function renderMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  // Split by lines, handle headings and bold
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    let node: React.ReactNode;

    if (line.startsWith('## ')) {
      node = <h3 key={i} className="text-sm font-bold mt-2 mb-1">{processBold(line.slice(3))}</h3>;
    } else if (line.startsWith('### ')) {
      node = <h4 key={i} className="text-xs font-bold mt-2 mb-1">{processBold(line.slice(4))}</h4>;
    } else if (line.startsWith('- ')) {
      node = <div key={i} className="ml-2">• {processBold(line.slice(2))}</div>;
    } else if (line.trim() === '') {
      node = <div key={i} className="h-2" />;
    } else {
      node = <div key={i}>{processBold(line)}</div>;
    }

    elements.push(node);
  });

  return <>{elements}</>;
}

function processBold(text: string): React.ReactNode {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  if (parts.length === 1) return text;

  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? <strong key={i}>{part}</strong> : part
      )}
    </>
  );
}
```

### 5.5 Index file

**File: `src/components/chat/index.ts`** (NEW)

```typescript
export { ChatPanel } from './ChatPanel';
export type { ChatMessage, ChartSpec, MapAction, ChatReply } from './types';
```

---

## 6. App.tsx Integration

These are the exact changes needed in `src/App.tsx`:

### 6.1 Add import

After the existing import block (e.g., after `import { useAuth } from '@/hooks/useAuth';`), add:

```typescript
import { ChatPanel } from '@/components/chat';
import type { MapAction } from '@/components/chat/types';
```

### 6.2 Add `Bot` to lucide-react import

Find the existing lucide-react import line and add `Bot`:

```typescript
import { PanelLeft, X, GripVertical, ArrowLeftRight, Layers, BarChart3, MessageSquarePlus, Shield, Bot } from 'lucide-react';
```

### 6.3 Widen sidebarView union type

Change:
```typescript
const [sidebarView, setSidebarView] = useState<'layers' | 'risk' | 'impact' | 'interventions'>('layers');
```
To:
```typescript
const [sidebarView, setSidebarView] = useState<'layers' | 'risk' | 'impact' | 'interventions' | 'chat'>('layers');
```

### 6.4 Expand sidebar width for chat view

Find the `MAX_WIDTH` line and add `sidebarView === 'chat'` to the wide condition:

Change:
```typescript
const MAX_WIDTH = currentImpactView === 'compare' || sidebarView === 'risk' || currentRiskView === 'spatial'
```
To:
```typescript
const MAX_WIDTH = currentImpactView === 'compare' || sidebarView === 'risk' || currentRiskView === 'spatial' || sidebarView === 'chat'
```

### 6.5 Add map action handler

After the existing `handleToggleAnnotationsPanel` callback, add:

```typescript
const handleChatMapAction = useCallback((action: MapAction) => {
  if (action.action === 'showLayer' && action.layerId) {
    handleLayerVisibilityChange(action.layerId, true);
  }
  if (action.action === 'zoomTo' && action.extent) {
    const mapInstance = mapViewerRef.current?.getMap();
    if (mapInstance) {
      mapInstance.getView().fit(action.extent, { padding: [50, 50, 50, 50], duration: 500 });
    }
  }
}, [handleLayerVisibilityChange]);
```

### 6.6 Add tab button in mobile close header

Find the mobile header text:
```typescript
{sidebarView === 'layers' ? 'Hazard' : sidebarView === 'impact' ? 'Impact Analysis' : sidebarView === 'risk' ? 'Risk Dashboard' : 'Interventions'}
```
Change to:
```typescript
{sidebarView === 'layers' ? 'Hazard' : sidebarView === 'impact' ? 'Impact Analysis' : sidebarView === 'risk' ? 'Risk Dashboard' : sidebarView === 'chat' ? 'AI Assistant' : 'Interventions'}
```

### 6.7 Add tab button in desktop tab bar

Find the desktop tab bar section (the `<div>` containing the 4 `<Button>` elements for Hazard, Impact, Risk, Interventions). After the Interventions button, add:

```tsx
<Button
  variant={sidebarView === 'chat' ? 'default' : 'ghost'}
  size="sm"
  onClick={() => setSidebarView('chat')}
  className="flex-1 gap-1.5 h-8 text-xs"
>
  <Bot className="w-3.5 h-3.5" />
  AI
</Button>
```

### 6.8 Add ChatPanel render in content area

Find the content switch section — the block that renders `<LayerTree>`, `<ImpactMatrix>`, `<RiskDashboard>`, or `<InterventionPanel>` based on `sidebarView`.

The current last `else` block renders `<InterventionPanel>`. Change the conditional to add a `chat` case **before** the interventions fallback.

Find this pattern:
```tsx
) : sidebarView === 'risk' ? (
  <RiskDashboard ... />
) : (
  <InterventionPanel ... />
)
```

Change to:
```tsx
) : sidebarView === 'risk' ? (
  <RiskDashboard ... />
) : sidebarView === 'chat' ? (
  <ChatPanel
    onMapAction={handleChatMapAction}
    className="h-full"
  />
) : (
  <InterventionPanel ... />
)
```

---

## 7. No Other File Changes Needed

- **`vite.config.ts`** — already proxies `/api` → `http://localhost:3001`. The `/api/chat` route is automatically proxied.
- **`api/package.json`** — no new npm packages. We use native `fetch()` (Node 18+) and `fs.readFileSync` (built-in).
- **Frontend `package.json`** — no new packages. We reuse `recharts` (already installed) and `lucide-react` (`Bot` icon already available).

---

## 8. File Checklist

| Action | File | Description |
|--------|------|-------------|
| **CREATE** | `api/chat.mjs` | Complete backend: LLM calls, 12 analysis functions, chat endpoint |
| **CREATE** | `src/components/chat/types.ts` | TypeScript types for chat messages, charts, map actions |
| **CREATE** | `src/components/chat/hooks/useChat.ts` | React hook: message state, API calls, history |
| **CREATE** | `src/components/chat/ChatChart.tsx` | Recharts renderer for bar/line/horizontalBar |
| **CREATE** | `src/components/chat/ChatPanel.tsx` | Main UI: messages, input, suggestions, map buttons |
| **CREATE** | `src/components/chat/index.ts` | Barrel export |
| **EDIT** | `api/impact-summary.mjs` | Add 2 lines: import + mount chatRouter |
| **EDIT** | `src/App.tsx` | Add import, widen union type, add tab + panel + handler (6 small edits) |
| **EDIT** | `api/floodrisk-impact-api.service` | Add OPENROUTER_API_KEY env var |

---

## 9. Testing Checklist

After implementation, verify these:

```bash
# 1. Backend starts without errors
OPENROUTER_API_KEY=sk-or-... node api/impact-summary.mjs

# 2. Chat endpoint responds
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"How many exposure layers are affected in the 100-year present breaches scenario?"}'

# 3. Frontend shows AI tab in sidebar
# 4. Clicking suggested question sends request and renders response
# 5. Charts render correctly (line chart for trends, bar chart for comparisons)
# 6. "Show on Map" button toggles the correct layer
# 7. Chat history provides context for follow-up questions
# 8. Rate limiting works (20 req/min)
# 9. Long messages are rejected (>1000 chars)
```

---

## 10. Production Deployment

```bash
# 1. Set env var in systemd service
sudo nano /etc/systemd/system/floodrisk-impact-api.service
# Add: Environment=OPENROUTER_API_KEY=sk-or-...
# Add: Environment=OPENROUTER_MODEL=anthropic/claude-sonnet-4

# 2. Reload and restart
sudo systemctl daemon-reload
sudo systemctl restart floodrisk-impact-api

# 3. Build and deploy frontend
npm run build
sshpass -p '<pw>' scp -r dist/* umair@10.0.0.205:/mnt/d/Scenario_results/floodrisk_sferp/dist/

# 4. Apache already proxies /api → localhost:3001 — no config change needed
```
