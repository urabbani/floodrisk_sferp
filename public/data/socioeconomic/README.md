# Socioeconomic Data for Flood Risk Hotspot Analysis

This directory contains socioeconomic and demographic data for the 7 study districts in Sindh Province, Pakistan.

## Data Files

### census2017.json
**Source:** Pakistan Bureau of Statistics - Census 2017
**Source URL:** https://www.pbs.gov.pk/content/district-wise-results-tables-census-2017

**Available Indicators:**
- `totalPopulation` - Total population count
- `male` / `female` - Population by sex
- `sexRatio` - Females per 1000 males
- `populationDensity` - Persons per square km
- `urbanProportion` - Percentage of urban population
- `avgHouseholdSize` - Average persons per household
- `areaSqKm` - District area in square kilometers
- `annualGrowthRate` - Average annual growth rate (1998-2017)

**Usage in Dashboard:**
- Population density → Demographic vulnerability weighting
- Urban proportion → Urban vulnerability factor
- Household size → Economic vulnerability proxy
- Sex ratio → Gender vulnerability analysis
- Growth rate → Population pressure indicator

### poverty2019.json
**Source:** Pakistan Social and Living Standards Measurement (PSLM) Survey 2019-20 / World Bank
**Source File:** Poverty_Data_District_level.xlsx

**Available Indicators:**
- `povertyRate` - Percentage of population below poverty line
- `povertyHeadcount` - Number of people below poverty line
- `meanMonthlyConsumption` - Mean monthly per adult-equivalent consumption (PKR)
- `poorConsumption` - Mean consumption of the poor (PKR)
- `povertyGap` - Depth of poverty measure
- `populationPSLM` - Population from PSLM survey

**Usage in Dashboard:**
- Poverty rate → Economic vulnerability (primary indicator)
- Poverty gap → Severity of poverty
- Mean consumption → Economic capacity indicator

## District Coverage

All 7 study districts have complete census and poverty data:

| District | 2017 Population | Density (per km²) | Urban % | Poverty Rate % |
|----------|----------------|-------------------|---------|----------------|
| Dadu | 1,550,390 | 197.1 | 24.7% | 29.41% |
| Jacobabad | 1,007,009 | 373.2 | 29.5% | 27.67% |
| Jamshoro | 993,908 | 88.7 | 43.5% | 25.81% |
| Kashmore | 1,090,336 | 422.6 | 23.3% | 25.21% |
| Larkana | 1,521,786 | 781.2 | 45.9% | 21.92% |
| Qambar Shahdadkot | 1,338,035 | 244.4 | 29.7% | 22.41% |
| Shikarpur | 1,233,760 | 491.2 | 24.7% | 24.47% |

## Data Pipeline

```
Raw Data (PBS Census, PSLM Survey)
    ↓
Extract & Transform (Python/Node.js scripts)
    ↓
public/data/socioeconomic/*.json
    ↓
useSocioeconomicData() hook
    ↓
Dashboard Components (Hotspot Analysis, Vulnerability Index)
```

## API Integration

### Census Data Endpoint
`/data/socioeconomic/census2017.json`

### Poverty Data Endpoint
`/data/socioeconomic/poverty2019.json`

Example usage:
```typescript
import { useSocioeconomicData } from '@/hooks/useSocioeconomicData';

function MyComponent() {
  const { data, loading, error, getDistrictData } = useSocioeconomicData();

  const daduData = getDistrictData('Dadu');
  console.log(daduData.census.populationDensity); // 197.1
  console.log(daduData.poverty?.povertyRate); // 29.41
}
```

## Vulnerability Index Calculation

The vulnerability index combines four dimensions:

### 1. Demographic Vulnerability (40% weight)
- Population density (30%): Higher density = more exposed
- Urban proportion (20%): Urban poor often more exposed
- Household size (20%): Larger households = more dependents
- Growth rate (15%): Higher growth = more pressure
- Sex ratio deviation (15%): Gender imbalance vulnerability

### 2. Economic Vulnerability (30% weight)
- **Poverty rate** (primary indicator from PSLM 2019-20)
- Higher poverty rate = higher economic vulnerability
- Range: 21.92% (Larkana) to 29.41% (Dadu)

### 3. Housing Vulnerability (20% weight)
- Proxy from urban proportion
- Urban poor in informal settlements are highly vulnerable

### 4. Service Access Vulnerability (10% weight)
- Inverse of urban proportion
- Rural areas have less access to emergency services

**Calculation:**
```typescript
Overall Vulnerability Score = (
  Demographic Vulnerability × 0.40 +
  Economic Vulnerability × 0.30 +
  Housing Vulnerability × 0.20 +
  Service Access Vulnerability × 0.10
)
```

## Using Vulnerability Functions

```typescript
import {
  calculateVulnerabilityIndex,
  calculateVulnerabilityIndicesWithPoverty,
  getVulnerabilityLevel,
  VULNERABILITY_LEVEL_COLORS,
  VULNERABILITY_LEVEL_LABELS
} from '@/lib/vulnerability';

// Calculate single district index
const daduIndex = calculateVulnerabilityIndex(
  'Dadu',
  censusData,
  povertyData // Optional - uses real poverty rate if available
);

// Calculate all districts with poverty data
const allIndices = calculateVulnerabilityIndicesWithPoverty(socioeconomicData);

// Get vulnerability level category
const level = getVulnerabilityLevel(daduIndex.overallScore);
// Returns: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high'

// Get color for level
const color = VULNERABILITY_LEVEL_COLORS[level]; // e.g., '#FF6347'
```

## Hotspot Identification

For flood risk hotspot identification, combine:
1. **Physical Risk** - Hazard probability and intensity
2. **Vulnerability** - Socioeconomic susceptibility (from this data)
3. **Criticality** - Infrastructure and economic importance
4. **Capacity** - Response and recovery capability

Hotspot Priority = (Physical Risk × Vulnerability) + Criticality

## Poverty Data Summary

| Rank | District | Poverty Rate | Poverty Headcount | Mean Consumption (PKR) |
|------|----------|--------------|-------------------|------------------------|
| 1 (Highest) | Dadu | 29.41% | 487,586 | 4,900 |
| 2 | Jacobabad | 27.67% | 190,286 | 5,224 |
| 3 | Jamshoro | 25.81% | 147,417 | 5,449 |
| 4 | Kashmore | 25.21% | 273,604 | 5,275 |
| 5 | Shikarpur | 24.47% | 308,544 | 5,485 |
| 6 | Qambar Shahdadkot | 22.41% | 403,524 | 5,414 |
| 7 (Lowest) | Larkana | 21.92% | 303,338 | 5,331 |

## Last Updated

April 26, 2026
