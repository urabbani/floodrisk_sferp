# Flood Risk Hotspots - Technical Documentation

**Version:** 1.0  
**Last Updated:** April 26, 2026  
**Status:** Production (https://portal.srpsid-dss.gos.pk)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Purpose and Objectives](#purpose-and-objectives)
3. [Methodology](#methodology)
4. [Data Sources](#data-sources)
5. [Technical Implementation](#technical-implementation)
6. [Current Limitations](#current-limitations)
7. [Future Improvements](#future-improvements)
8. [References](#references)

---

## Executive Summary

The Flood Risk Hotspots module is a decision-support tool that identifies geographic areas prioritized for flood risk intervention in Sindh Province, Pakistan. It combines three dimensions of risk into a composite 0-100 hotspot score:

1. **Physical Risk** - Economic damage potential from flooding
2. **Population Risk** - Potential loss of life from flooding
3. **Socioeconomic Vulnerability** - Community susceptibility to flood impacts

The tool provides ranked district rankings, interactive visualizations, and map-based outputs to support evidence-based planning and resource allocation.

**Target Users:** Government planners, disaster management authorities, NGOs, funding bodies

**Geographic Scope:** 7 districts in Sindh Province (Dadu, Jacobabad, Jamshoro, Kashmore, Larkana, Qambar Shahdadkot, Shikarpur)

---

## Purpose and Objectives

### Client Requirement

> *"First, identify hotspots in terms of flood risk, as well as additional areas of interest that may be prioritized based on complementary objectives (e.g., areas with vulnerable populations, areas of economic importance, etc.)"*
> 
> — Sindh Government / Funding Body Requirements

### Core Objectives

1. **Identify Priority Areas** - Rank districts by composite flood risk to guide intervention targeting
2. **Multi-Dimensional Analysis** - Move beyond single-metric risk assessment to holistic evaluation
3. **Transparent Methodology** - Clear, documented calculation methods for stakeholder trust
4. **Interactive Visualization** - Enable exploration through ranked tables, radar charts, and maps
5. **Scenario Flexibility** - Support multiple climate scenarios, return periods, and maintenance levels

### Decision Context

The hotspot analysis supports:
- **Pre-disaster planning** - Where to invest in mitigation infrastructure
- **Emergency preparedness** - Which districts need contingency plans
- **Resource allocation** - Prioritizing limited response and recovery resources
- **Development planning** - Targeting socioeconomic development to reduce vulnerability

---

## Methodology

### Conceptual Framework

The hotspot methodology follows a **composite risk index** approach:

```
Hotspot Score = w₁ × Physical Risk + w₂ × Population Risk + w₃ × Socioeconomic Vulnerability
```

Where:
- Each dimension is normalized to 0-100 scale (min-max normalization)
- Current weights: w₁ = w₂ = w₃ = 1/3 (equal weights)
- Higher scores = higher priority for intervention

### Dimension 1: Physical Risk (Economic Damage)

**Source:** Expected Annual Damage (EAD) from economic risk analysis

**Calculation:**
```
EAD = Σ 0.5 × (Dᵢ + Dᵢ₊₁) × |1/RPᵢ - 1/RPᵢ₊₁|
```

Where:
- Dᵢ = Economic damage for return period RPᵢ
- Integration across 7 return periods: 2.3, 5, 10, 25, 50, 100, 500 years
- Accounts for full spectrum of flood probability

**Assets Included:**
- Agriculture (cropped area)
- Buildings (kacha, pakka, high-rise)
- Infrastructure (telecom, electric, railways, roads)
- Critical facilities (BHU, schools, hospitals)

**Normalization:**
```
Physical Risk (normalized) = (EAD - min_EAD) / (max_EAD - min_EAD) × 100
```

### Dimension 2: Population Risk (Expected Annual Fatalities)

**Source:** Semi-quantitative fatality estimation using depth × velocity mortality factors

**UPDATE (April 2026):** Now uses **Expected Annual Fatalities (EAF)** - integrated across all 7 return periods using trapezoidal integration. This provides consistent methodology with EAD.

**Primary Method:** Depth × velocity (V×h) threshold approach

**Mortality Factors:**

| V×h (m²/s) | Mortality Factor | Description |
|------------|-----------------|-------------|
| < 0.5 | 0.0001 | Minimal risk |
| 0.5 - 1.5 | 0.003 | Low risk |
| 1.5 - 3.0 | 0.03 | Moderate risk |
| 3.0 - 6.0 | 0.15 | High risk |
| > 6.0 | 0.50 | Very high risk |

**Fatality Calculation:**
```
Fatalities = Σ (Population in depth zone × Mortality Factor × Calibration Factor)
```

**Calibration Factor:** 0.05 (calibrated to 2022 flood event: 14.5M affected, 1,739 deaths = 0.012% fatality rate)

**Uncertainty:** Estimates presented as moderate ± σ (standard deviation)

**Expected Annual Fatalities Calculation:**
```
EAF = Σ 0.5 × (Fᵢ + Fᵢ₊₁) × |1/RPᵢ - 1/RPᵢ₊₁|
```

Where Fᵢ = Moderate fatality estimate for return period RPᵢ

**Normalization:**
```
Population Risk (normalized) = (EAF - min_EAF) / (max_EAF - min_EAF) × 100
```

### Dimension 3: Socioeconomic Vulnerability

**Source:** Census 2017 + Poverty 2019 (PSLM) composite index

**Sub-Components:**

1. **Demographic Vulnerability (40% weight)**
   - Population density (30%) - Higher density = more exposure
   - Urban proportion (20%) - Urban poor often more exposed
   - Household size (20%) - Larger households = more dependents
   - Growth rate (15%) - Higher growth = more pressure
   - Sex ratio deviation (15%) - Gender imbalance vulnerability

2. **Economic Vulnerability (30% weight)**
   - **Poverty rate** from PSLM 2019-20
   - Direct use of poverty rate as vulnerability indicator

3. **Housing Vulnerability (20% weight)**
   - Urban poor in informal settlements are highly vulnerable
   - Proxy calculation: `Urban% × 0.6 + Rural% × 0.3`

4. **Service Access Vulnerability (10% weight)**
   - Inverse of urban proportion (rural areas have less access)
   - Calculation: `100 - Urban%`

**Composite Score:**
```
Vulnerability = 0.4 × Demographic + 0.3 × Economic + 0.2 × Housing + 0.1 × Service Access
```

**Normalization:** Not needed - vulnerability already on 0-100 scale

### Composite Hotspot Score

**Final Calculation:**
```
Hotspot Score = 0.33 × Physical Risk (normalized EAD) + 
                0.33 × Population Risk (normalized EAF) + 
                0.33 × Socioeconomic Vulnerability
```

Where:
- **EAD** = Expected Annual Damage (economic)
- **EAF** = Expected Annual Fatalities (population)

**Interpretation:**
- **0-30**: Low priority hotspot
- **30-50**: Moderate priority hotspot
- **50-70**: High priority hotspot
- **70-100**: Very high priority hotspot

**Methodology Consistency:**
Both EAD and EAF use trapezoidal integration across 7 return periods (2.3, 5, 10, 25, 50, 100, 500 years), providing a consistent probabilistic approach to risk quantification.

---

## Data Sources

### 1. Economic Risk Data

**File:** `public/data/risk.json`

**Source:** Pre-computed from 42 Excel files (risk/ folder)

**Scenarios:** 42 scenarios = 7 return periods × 2 climates × 3 maintenance levels

**Structure:**
```json
{
  "scenarios": {
    "25_present_breaches": {
      "returnPeriod": 25,
      "climate": "present",
      "maintenance": "breaches"
    }
  },
  "data": {
    "25_present_breaches": {
      "TOTAL": { "Exp": {...}, "Vul": {...}, "Dmg": {...} },
      "Dadu": { "Exp": {...}, "Vul": {...}, "Dmg": {...} },
      ...
    }
  }
}
```

**Update Process:**
```bash
# Regenerate from Excel files
node scripts/build-risk-json.js
```

### 2. Population Risk Data

**API Endpoint:** `/api/population-risk`

**Backend:** `api/casualty-estimator.mjs`

**Database:** PostGIS with depth bin statistics

**Request Parameters:**
- `climate`: present | future
- `maintenance`: breaches | redcapacity | perfect
- `returnPeriod`: 2.3 | 5 | 10 | 25 | 50 | 100 | 500

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "scenarios": [{
      "totalAffectedPopulation": 262993,
      "depthBins": { "15-100cm": 50000, "1-2m": 80000, ... },
      "casualtyEstimate": {
        "fatalities": { "low": 67, "moderate": 89, "high": 111 },
        "injuries": { "low": 201, "moderate": 267, "high": 333 }
      },
      "districtBreakdown": [...]
    }]
  }
}
```

### 3. Census 2017 Data

**File:** `public/data/socioeconomic/census2017.json`

**Source:** Pakistan Bureau of Statistics (PBS)

**URL:** https://www.pbs.gov.pk/content/district-wise-results-tables-census-2017

**Districts Covered:** 7 study districts

**Indicators:**
- Total population, male, female
- Sex ratio (females per 1000 males)
- Population density (persons/km²)
- Urban proportion (%)
- Average household size
- Area (km²)
- Annual growth rate (1998-2017)

### 4. Poverty 2019 Data

**File:** `public/data/socioeconomic/poverty2019.json`

**Source:** Pakistan Social and Living Standards Measurement (PSLM) Survey 2019-20 / World Bank

**Source File:** `public/Poverty_Data_District_level.xlsx`

**Indicators:**
- Poverty rate (% below poverty line)
- Poverty headcount (number of people)
- Mean monthly consumption per adult-equivalent (PKR)
- Poor consumption (for below-poverty-line households)
- Poverty gap (depth of poverty measure)

**Poverty Rankings:**
| Rank | District | Poverty Rate | Headcount |
|------|----------|--------------|-----------|
| 1 | Dadu | 29.41% | 487,586 |
| 2 | Jacobabad | 27.67% | 190,286 |
| 3 | Jamshoro | 25.81% | 147,417 |
| 4 | Kashmore | 25.21% | 273,604 |
| 5 | Shikarpur | 24.47% | 308,544 |
| 6 | Qambar Shahdadkot | 22.41% | 403,524 |
| 7 | Larkana | 21.92% | 303,338 |

---

## Technical Implementation

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Risk Dashboard                              │
│  ┌───────────┬───────────┬───────────┬───────────┬───────────┐   │
│  │ Summary   │ District  │  Spatial  │    EAD    │ Population │   │
│  └───────────┴───────────┴───────────┴───────────┴───────────┘   │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    HOTSPOTS (NEW)                              ││
│  │  ┌─────────────┬─────────────┬─────────────┬─────────────┐   ││
│  │  │ useEadData  │ usePopRisk  │  useSocio   │   hotspot   │   ││
│  │  │             │             │   economic   │  _calc.ts   │   ││
│  │  └─────────────┴─────────────┴─────────────┴─────────────┘   ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

### File Structure

```
src/
├── lib/
│   ├── hotspot.ts                    # Pure calculation functions
│   └── vulnerability.ts              # Vulnerability index calculation
├── hooks/
│   ├── useSocioeconomicData.ts       # Census + poverty data loader
│   ├── usePovertyData.ts             # Poverty data loader
│   └── components/risk-dashboard/hooks/
│       └── useHotspotData.ts         # Hotspots data composer
├── types/
│   └── socioeconomic.ts              # Hotspot types
└── components/risk-dashboard/
    ├── RiskDashboard.tsx             # Main container (adds tab)
    └── views/
        └── RiskHotspotView.tsx       # Hotspots UI component
```

### Key Functions

**`computeHotspotScores()`** - Core calculation
```typescript
// src/lib/hotspot.ts
export function computeHotspotScores(params: {
  eadResults: EadResult[];
  fatalityMap: Record<DistrictName, number>;
  vulnerabilityIndices: VulnerabilityIndex[];
  climate: 'present' | 'future';
  maintenance: 'breaches' | 'redcapacity' | 'perfect';
  weights: HotspotWeights;
}): HotspotDistrictResult[]
```

**`calculateVulnerabilityIndicesWithPoverty()`** - Vulnerability calculation
```typescript
// src/lib/vulnerability.ts
export function calculateVulnerabilityIndicesWithPoverty(
  socioeconomicData: Record<DistrictName, SocioeconomicData>
): VulnerabilityIndex[]
```

**`useHotspotData()`** - React hook
```typescript
// src/components/risk-dashboard/hooks/useHotspotData.ts
export function useHotspotData(
  climate: 'present' | 'future'
): UseHotspotDataResult
```

### UI Components

**RiskHotspotView** displays:
1. **Controls Bar** - Return period selector, maintenance buttons, map toggle
2. **Summary Cards** - Top hotspot, average score, high-risk count
3. **Ranked Table** - Districts with progress bars and badges
4. **Radar Chart** - Dimension comparison (Recharts)
5. **Methodology Note** - Documentation footer

### Choropleth Integration

**Data Flow:**
```
RiskHotspotView.useEffect()
  → onChoroplethData(hotspotScores)
    → App.setChoroplethData()
      → useChoroplethLayer()
        → OpenLayers VectorLayer styling
```

**Styling:**
- Uses `getRiskColor()` from risk types
- Min-max normalization for color scale
- District labels with scores
- 70% opacity fills with dark strokes

---

## Current Limitations

### Data Limitations

1. **Population Risk Calibration**
   - Calibrated to single event (2022 flood)
   - Assumes mortality factors from international studies apply locally
   - Does not account for warning effectiveness variations

2. **Economic Risk Scope**
   - Only includes direct damage to assets
   - Excludes: indirect economic losses, business interruption, supply chain impacts
   - Asset values may not reflect current replacement costs

3. **Socioeconomic Data Age**
   - Census 2017 (nearly 10 years old at time of writing)
   - Poverty 2019 (7 years old)
   - Does not capture COVID-19 impacts, 2022 flood effects

4. **District-Level Analysis**
   - No sub-district (tehsil/UC) granularity
   - Within-district heterogeneity masked
   - Hotspot villages not identified

### Methodological Limitations

1. **Equal Weighting**
   - Currently uses 1/3 weights for all dimensions
   - No empirical justification for equal weights
   - Stakeholder priorities may vary by context

2. **Normalization Method**
   - Min-max normalization sensitive to outliers
   - Relative ranking depends on which districts are included
   - Adding/removing a district changes all scores

3. **No Criticality Dimension**
   - Infrastructure criticality not included (mentioned in client requirements)
   - Economic importance of districts not weighted
   - Strategic facilities (hospitals, admin centers) not prioritized

4. **Static Analysis**
   - No temporal trends (increasing/decreasing risk over time)
   - Climate change impacts only via future climate scenarios
   - Development trajectories not modeled

5. **EAF Assumptions**
   - Assumes linear interpolation between return periods
   - Uses same mortality factors for all return periods
   - Does not account for potential scenario dependencies

### Technical Limitations

1. **Performance**
   - Multiple API calls (risk.json, population-risk, socioeconomic)
   - No caching beyond browser
   - Radar chart busy with 7 districts

2. **Scenarios**
   - User can only select one return period for population risk
   - EAD uses all return periods (integrated)
   - Inconsistent scenario handling

3. **Export/Reporting**
   - No PDF/Excel export of hotspot rankings
   - No permalink to specific hotspot configuration
   - No annotation capability

---

## Future Improvements

### Priority 1: Methodology Refinement

**A. Weight Sensitivity Analysis**
```
Task: Test different weight combinations
- Economic-focused: (0.5, 0.25, 0.25)
- Lives-focused: (0.25, 0.5, 0.25)
- Vulnerability-focused: (0.25, 0.25, 0.5)
- Stakeholder-defined weights via UI sliders
```

**B. Add Criticality Dimension**
```typescript
interface HotspotDistrictResult {
  // Existing
  hotspotScore: number;
  dimensions: HotspotDimensionScores;
  
  // New
  criticality: number;  // Infrastructure + economic importance
  hotspotScoreV2: number; // 4-dimension composite
}
```

**Sources for Criticality:**
- Major highways (N55, N65)
- Railway junctions
- Hospitals (by bed capacity)
- Industrial areas
- Agricultural production value

**C. Sub-District Analysis**
- Implement tehsil-level scoring where data available
- Use spatial interpolation for within-district variation
- Identify hotspot villages

### Priority 2: Data Enhancement

**A. Fresh Socioeconomic Data**
- Pursue 2023-24 census if available
- Incorporate post-2022 flood poverty assessments
- Add housing quality indicators (kacha vs pakka)

**B. Improved Mortality Estimation**
- Local mortality factors from Pakistan flood history
- Age-stratified vulnerability (children, elderly)
- Disability-adjusted estimates

**C. Asset Value Updates**
- Current replacement costs
- Agricultural value by crop type
- Infrastructure criticality ratings

### Priority 3: Technical Enhancements

**A. Scenario Comparison**
- Side-by-side present vs future hotspots
- Track hotspot migration over climate scenarios
- Identify "emerging hotspots" and "disappearing hotspots"

**B. Export Capabilities**
- PDF hotspot report with charts
- Excel export with all dimension scores
- Shareable URLs for specific configurations

**C. Advanced Visualization**
- Heat map with grid cells (not just district boundaries)
- Time slider showing hotspot evolution
- 3D terrain visualization

### Priority 4: Integration

**A. Link to Interventions**
- Show proposed interventions for top hotspots
- Cost-benefit analysis by hotspot
- Intervention priority ranking

**B. Alert Thresholds**
- SMS/email when hotspot score exceeds threshold
- Monitor hotspot changes over time
- Early warning hotspot identification

**C. Stakeholder Engagement**
- Multi-criteria decision analysis (MCDA) workshops
- Weight elicitation from domain experts
- Scenario planning with stakeholders

---

## References

### Academic Sources

1. **Jonkman, S.N., et al. (2008)** - "An overview of quantitative risk measures for loss of life and economic damage"
   - Source: Journal of Flood Risk Management
   - Used: Mortality factors for depth × velocity

2. **USBR (United States Bureau of Reclamation)** - RCEM (Risk-Cost Evaluation Model)
   - Used: Depth-fatality relationships

3. **Defra (UK Department for Environment, Food and Rural Affairs)** - FD2321
   - Used: Depth-damage curves

### Data Sources

1. **PBS Census 2017** - https://www.pbs.gov.pk/content/district-wise-results-tables-census-2017
2. **PSLM 2019-20** - Pakistan Social and Living Standards Measurement
3. **World Bank** - Poverty data for Pakistan districts
4. **Flood 2022 Event Data** - Sindh Disaster Management Authority

### Technical Documentation

- **Project CLAUDE.md** - Project architecture and development guidelines
- **API Documentation** - `/api/population-risk` endpoint specification
- **Socioeconomic README** - `public/data/socioeconomic/README.md`

---

## Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.1 | 2026-04-26 | **EAF Integration**: Changed Population Risk to use Expected Annual Fatalities integrated across all return periods, matching EAD methodology. Removed return period selector. |
| 1.0 | 2026-04-26 | Initial release with 3-dimension hotspot scoring |

---

## Contributors

- **Development:** SRPSID-DSS Technical Team
- **Methodology:** Based on international flood risk assessment best practices
- **Data:** PBS, PSLM, World Bank, in-situ assessments

---

## Contact

For questions or improvement suggestions, contact the SRPSID-DSS project team through the project portal at https://portal.srpsid-dss.gos.pk
