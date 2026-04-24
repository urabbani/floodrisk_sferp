## Prompt: Integrate Population Risk (Casualty Estimation) into Flood Risk Dashboard

### Context

I have added a new database table called `impact.population_hazard_stats` that contains population exposure data cross-tabulated against multiple hazard parameters (depth, velocity, duration, V×h) for all 42 flood scenarios. This data is intended to power a new **Population Risk** module in the dashboard that performs semi-quantitative loss-of-life and injury estimation, as required by my Terms of Reference (Task 4).

### Database Connection

The database is PostgreSQL/PostGIS at `10.0.0.205:5432`, database `postgres`, same credentials as the existing dashboard.

### New Source Table

**Schema:** `impact`
**Table:** `population_hazard_stats`
**Rows:** 42 (one per scenario, matching the existing 7 return periods × 2 climates × 3 maintenance levels)

### Table Schema

```sql
impact.population_hazard_stats
├── id                              SERIAL PRIMARY KEY
├── scenario_name                   VARCHAR(255) UNIQUE   -- e.g., 'T3_25yrs_Present_Breaches'
├── climate                         VARCHAR(20)           -- 'present' | 'future'
├── maintenance                     VARCHAR(20)           -- 'breaches' | 'perfect' | 'redcapacity'
├── return_period                   VARCHAR(10)           -- '2.3' | '5' | '10' | '25' | '50' | '100' | '500'
├── total_affected_population       NUMERIC
│
│   -- Depth-only bins (6 bins, matches existing depth bins)
├── depth_15_100cm                  NUMERIC               -- 0.15m to 1.0m
├── depth_1_2m                      NUMERIC               -- 1.0m to 2.0m
├── depth_2_3m                      NUMERIC               -- 2.0m to 3.0m
├── depth_3_4m                      NUMERIC               -- 3.0m to 4.0m
├── depth_4_5m                      NUMERIC               -- 4.0m to 5.0m
├── depth_above5m                   NUMERIC               -- >5.0m
│
│   -- Depth × Velocity cross-tab (18 columns: 6 depth bins × 3 velocity classes)
│   -- Velocity classes: v_low (<0.5 m/s), v_moderate (0.5-1.5 m/s), v_high (>1.5 m/s)
├── vel_low_depth_15_100cm          NUMERIC
├── vel_low_depth_1_2m              NUMERIC
├── vel_low_depth_2_3m              NUMERIC
├── vel_low_depth_3_4m              NUMERIC
├── vel_low_depth_4_5m              NUMERIC
├── vel_low_depth_above5m           NUMERIC
├── vel_moderate_depth_15_100cm     NUMERIC
├── vel_moderate_depth_1_2m         NUMERIC
├── vel_moderate_depth_2_3m         NUMERIC
├── vel_moderate_depth_3_4m         NUMERIC
├── vel_moderate_depth_4_5m         NUMERIC
├── vel_moderate_depth_above5m      NUMERIC
├── vel_high_depth_15_100cm         NUMERIC
├── vel_high_depth_1_2m             NUMERIC
├── vel_high_depth_2_3m             NUMERIC
├── vel_high_depth_3_4m             NUMERIC
├── vel_high_depth_4_5m             NUMERIC
├── vel_high_depth_above5m          NUMERIC
│
│   -- Depth × Duration cross-tab (18 columns: 6 depth bins × 3 duration classes)
│   -- Duration classes: d_short (<6h), d_medium (6-24h), d_long (>24h)
├── dur_short_depth_15_100cm        NUMERIC
├── dur_short_depth_1_2m            NUMERIC
├── dur_short_depth_2_3m            NUMERIC
├── dur_short_depth_3_4m            NUMERIC
├── dur_short_depth_4_5m            NUMERIC
├── dur_short_depth_above5m         NUMERIC
├── dur_medium_depth_15_100cm       NUMERIC
├── dur_medium_depth_1_2m           NUMERIC
├── dur_medium_depth_2_3m           NUMERIC
├── dur_medium_depth_3_4m           NUMERIC
├── dur_medium_depth_4_5m           NUMERIC
├── dur_medium_depth_above5m        NUMERIC
├── dur_long_depth_15_100cm         NUMERIC
├── dur_long_depth_1_2m             NUMERIC
├── dur_long_depth_2_3m             NUMERIC
├── dur_long_depth_3_4m             NUMERIC
├── dur_long_depth_4_5m             NUMERIC
├── dur_long_depth_above5m          NUMERIC
│
│   -- V×h exceedance
├── vh_exceed_population            NUMERIC               -- Population where V×h > 1.5 m²/s
│
│   -- District-level breakdown (JSONB)
└── district_stats                  JSONB                 -- See structure below
```

### District Stats JSONB Structure

The `district_stats` column contains a JSON object keyed by district name (matching the 7 active districts: Dadu, Jacobabad, Jamshoro, Kashmore, Larkana, Qambar Shahdadkot, Shikarpur). Each district entry has this structure:

```json
{
  "Dadu": {
    "affected_population": 345678.90,
    "depth_bins": {
      "15-100cm": 198765.43,
      "1-2m": 87654.32,
      "2-3m": 34567.89,
      "3-4m": 15678.90,
      "4-5m": 5678.90,
      "above5m": 3333.46
    },
    "depth_velocity_cross": {
      "15-100cm": {"v_low": 178901.23, "v_moderate": 18765.43, "v_high": 1098.77},
      "1-2m":    {"v_low": 70123.45,  "v_moderate": 15432.10, "v_high": 2098.77},
      "2-3m":    {"v_low": 20740.73,  "v_moderate": 12345.67, "v_high": 1481.49},
      "3-4m":    {"v_low": 7845.12,   "v_moderate": 6543.21,  "v_high": 1290.57},
      "4-5m":    {"v_low": 1987.62,   "v_moderate": 2469.14,  "v_high": 1222.14},
      "above5m": {"v_low": 666.69,    "v_moderate": 1333.38,  "v_high": 1333.39}
    },
    "depth_duration_cross": {
      "15-100cm": {"d_short": 67890.12, "d_medium": 98765.43, "d_long": 32109.68},
      "1-2m":    {"d_short": 29012.34, "d_medium": 40123.45, "d_long": 18518.53},
      "2-3m":    {"d_short": 8723.45,  "d_medium": 17283.95, "d_long": 8560.49},
      "3-4m":    {"d_short": 3123.45,  "d_medium": 6543.21,  "d_long": 6012.24},
      "4-5m":    {"d_short": 1135.78,  "d_medium": 2271.56,  "d_long": 2271.56},
      "above5m": {"d_short": 333.35,   "d_medium": 666.69,   "d_long": 2333.42}
    },
    "vh_exceed_population": 23456.78
  },
  "Jacobabad": { ... },
  ...
}
```

---

### Requirements

#### 1. New API Endpoint

Create a new endpoint:

```
GET /api/population-risk
```

**Query Parameters:**
| Parameter | Type | Required | Values | Default |
|-----------|------|----------|--------|---------|
| `climate` | string | Yes | `present`, `future` | - |
| `maintenance` | string | No | `breaches`, `perfect`, `redcapacity`, `all` | `all` |
| `returnPeriod` | string | No | `2.3`, `5`, `10`, `25`, `50`, `100`, `500`, `all` | `all` |

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "climate": "present",
    "scenarios": [
      {
        "scenarioName": "T3_25yrs_Present_Breaches",
        "climate": "present",
        "maintenance": "breaches",
        "returnPeriod": "25",
        "totalAffectedPopulation": 2427826,
        "depthBins": {
          "15-100cm": 1380968,
          "1-2m": 619945,
          "2-3m": 277513,
          "3-4m": 109078,
          "4-5m": 27857,
          "above5m": 12462
        },
        "casualtyEstimate": {
          "fatalities": { "low": 45, "moderate": 120, "high": 350 },
          "injuries": { "low": 320, "moderate": 850, "high": 2400 },
          "fatalityRiskLevel": "high",
          "injuryRiskLevel": "very_high",
          "keyDrivers": [
            "Large population in >3m depth zones",
            "High velocity in populated areas",
            "V×h > 1.5 m²/s affecting 145,698 people"
          ]
        },
        "districtBreakdown": [
          {
            "district": "Dadu",
            "affectedPopulation": 345678,
            "fatalityRiskLevel": "moderate",
            "estimatedFatalities": { "low": 12, "moderate": 35, "high": 98 }
          }
        ]
      }
    ],
    "metadata": {
      "lastUpdated": "2026-04-24T...",
      "totalScenarios": 42
    }
  }
}
```

#### 2. Casualty Estimation Logic (Server-Side)

Implement the semi-quantitative fatality and injury estimation **on the server** (in the API endpoint or a helper module). Use the following mortality and injury factors from established literature. These produce **low**, **moderate**, and **high** estimates to transparently communicate uncertainty.

**Base Mortality Factors (fraction of exposed population):**

| Condition | Fatality Rate (Low) | Fatality Rate (Moderate) | Fatality Rate (High) |
|-----------|---------------------|--------------------------|----------------------|
| Depth < 1m, v_low | 0.0001 (0.01%) | 0.0005 (0.05%) | 0.001 (0.1%) |
| Depth < 1m, v_moderate | 0.0005 (0.05%) | 0.001 (0.1%) | 0.002 (0.2%) |
| Depth < 1m, v_high | 0.001 (0.1%) | 0.002 (0.2%) | 0.005 (0.5%) |
| Depth 1-2m, v_low | 0.001 (0.1%) | 0.002 (0.2%) | 0.005 (0.5%) |
| Depth 1-2m, v_moderate | 0.002 (0.2%) | 0.005 (0.5%) | 0.01 (1.0%) |
| Depth 1-2m, v_high | 0.005 (0.5%) | 0.01 (1.0%) | 0.02 (2.0%) |
| Depth 2-3m, v_low | 0.002 (0.2%) | 0.005 (0.5%) | 0.01 (1.0%) |
| Depth 2-3m, v_moderate | 0.005 (0.5%) | 0.01 (1.0%) | 0.025 (2.5%) |
| Depth 2-3m, v_high | 0.01 (1.0%) | 0.025 (2.5%) | 0.05 (5.0%) |
| Depth > 3m, any velocity | 0.01 (1.0%) | 0.025 (2.5%) | 0.05 (5.0%) |
| V×h > 1.5 m²/s, any depth | 0.025 (2.5%) | 0.05 (5.0%) | 0.10 (10.0%) |

**Injury Rate:** Multiply fatality rates by **3×** (international convention: injuries are approximately 3 times fatalities in flood events).

**Modifiers (apply to all estimates):**
| Condition | Multiplier |
|-----------|-----------|
| Duration < 6h (flash flood) | × 1.5 |
| Duration > 24h (prolonged) | × 1.2 (reduced rescue access) |
| The population in the cell is in a flood-prone sub-catchment | × 1.5 |

**Classification Thresholds:**

| Risk Level | Fatality Count | Percentage of Affected Population |
|------------|---------------|-----------------------------------|
| Very Low | < 10 | < 0.01% |
| Low | 10-50 | 0.01-0.05% |
| Moderate | 50-200 | 0.05-0.2% |
| High | 200-1000 | 0.2-1.0% |
| Very High | > 1000 | > 1.0% |

**Key Driver Identification Rules:**
- If population in depth >3m exceeds 20% of affected → add "Large population in >3m depth zones"
- If vh_exceed_population > 50,000 → add "V×h > 1.5 m²/s affecting [N] people"
- If population in d_short exceeds 50% of affected → add "Flash-flood type event with rapid onset"
- If any district has >100,000 affected → add "High concentration in [district name]"

#### 3. Frontend: New "Population Risk" Tab

Add a new tab to the **Risk Dashboard** called **"Population Risk"** (or **"Casualty"**) with the following views:

**View A: Casualty Summary Matrix**
- A heatmap matrix similar to the existing Risk Summary view
- **Rows:** Return periods (2.3, 5, 10, 25, 50, 100, 500)
- **Columns:** Maintenance levels (Perfect, Breaches, Reduced Capacity)
- **Cell color:** Fatality risk level (Very Low = green, Low = light green, Moderate = gold, High = orange, Very High = red)
- **Cell content:** Estimated fatalities (moderate estimate) and risk level label
- **Filter:** Climate toggle (Present / Future) at the top

**View B: Depth-Velocity Fatality Chart**
- A stacked bar chart or heatmap showing fatality estimates broken down by the combination of depth bin and velocity class
- X-axis: Depth bins (15-100cm, 1-2m, 2-3m, 3-4m, 4-5m, above5m)
- Stack segments: Velocity classes (v_low, v_moderate, v_high) colored distinctly
- This helps identify which depth-velocity combinations contribute most to casualties

**View C: District Comparison**
- A horizontal bar chart comparing estimated fatalities across the 7 districts for a selected scenario
- Bars colored by fatality risk level
- Allow selection of return period and maintenance via dropdowns

**View D: Fatality Estimates Table**
- A detailed table showing for each scenario:
  - Return period, maintenance
  - Total affected population
  - Fatalities (low / moderate / high)
  - Injuries (low / moderate / high)
  - Fatality risk level
  - Injury risk level
  - Key drivers (shown as tags or badges)
- Sortable columns (default sort: return period ascending, then maintenance)
- Row click opens district breakdown

#### 4. TypeScript Types

Add to `src/types/`:

```typescript
// src/types/casualty.ts

export interface CasualtyRange {
  low: number;
  moderate: number;
  high: number;
}

export type RiskLevel = 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';

export interface PopulationRiskScenario {
  scenarioName: string;
  climate: 'present' | 'future';
  maintenance: 'breaches' | 'perfect' | 'redcapacity';
  returnPeriod: string;
  totalAffectedPopulation: number;
  depthBins: Record<string, number>;  // "15-100cm", "1-2m", etc.
  casualtyEstimate: {
    fatalities: CasualtyRange;
    injuries: CasualtyRange;
    fatalityRiskLevel: RiskLevel;
    injuryRiskLevel: RiskLevel;
    keyDrivers: string[];
  };
  districtBreakdown: PopulationRiskDistrict[];
}

export interface PopulationRiskDistrict {
  district: string;
  affectedPopulation: number;
  fatalityRiskLevel: RiskLevel;
  estimatedFatalities: CasualtyRange;
  estimatedInjuries?: CasualtyRange;
}

export interface PopulationRiskResponse {
  success: boolean;
  data: {
    climate: string;
    scenarios: PopulationRiskScenario[];
    metadata: {
      lastUpdated: string;
      totalScenarios: number;
    };
  };
}
```

#### 5. Integration with Existing Dashboard

- The new tab should sit alongside the existing **Summary Heatmap**, **District Breakdown**, **Spatial**, and **EAD** tabs in the Risk Dashboard. Move them slightly to left to fit them.
- Use the same color scale conventions where possible (the existing yellow-to-red scale for severity)
- Reuse the existing `useRiskData` pattern but create a new `usePopulationRisk` hook
- Cache population risk responses with the same 5-minute TTL as the impact API
- Respect the district filtering — only show the 7 active districts (Dadu, Jacobabad, Jamshoro, Kashmore, Larkana, Qambar Shahdadkot, Shikarpur). Exclude Naushahro Feroze and Shaheed Benazirabad

#### 6. Data Flow

```
impact.population_hazard_stats (PostgreSQL)
    ↓
GET /api/population-risk (new Express endpoint)
    ↓  (applies casualty estimation logic here)
    ↓
usePopulationRisk hook (new React hook)
    ↓
Population Risk Tab component
    ├── Casualty Summary Matrix
    ├── Depth-Velocity Fatality Chart
    ├── District Comparison Chart
    └── Fatality Estimates Table
```

#### 7. Methodology Citation

The casualty estimation methodology should be documented in the UI (e.g., an info tooltip or methodology footnote) citing:

- Jonkman, S.N. et al. (2008). *Loss of life estimation in flood risk assessment*. Journal of Flood Risk Management.
- USBR (2015). *RCEM – Reclamation Consequence Estimating Methodology*.
- AIDR (2017). *Managing the Floodplain: Handbook 7*.
- Defra/Environment Agency (2006). *Flood Risks to People – Phase 2*. R&D Technical Report FD2321.

---

### Summary of Deliverables

| # | Deliverable | Type |
|---|-------------|------|
| 1 | `GET /api/population-risk` endpoint | Backend |
| 2 | Casualty estimation logic (server-side) | Backend |
| 3 | `src/types/casualty.ts` type definitions | Frontend |
| 4 | `usePopulationRisk` data fetching hook | Frontend |
| 5 | Population Risk tab component | Frontend |
| 6 | Casualty Summary Matrix view | Frontend |
| 7 | Depth-Velocity Fatality Chart view | Frontend |
| 8 | District Comparison Chart view | Frontend |
| 9 | Fatality Estimates Table view | Frontend |
| 10 | Integration into existing Risk Dashboard | Frontend |