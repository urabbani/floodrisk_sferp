# Flood Risk Assessment Decision Support System
## Client Presentation Text

**Project:** Sindh River Basin Flood Risk Decision Support System (SRPSID-DSS)
**URL:** portal.srpsid-dss.gos.pk
**Date:** April 2026
**Scope:** 7 Districts in Sindh Province, Pakistan

---

## TABLE OF CONTENTS

1. [System Overview](#system-overview)
2. [Hazard Assessment](#hazard-assessment)
3. [Risk & Vulnerability](#risk--vulnerability)
4. [Population Risk](#population-risk)
5. [Flood Risk Hotspots](#flood-risk-hotspots)
6. [Technical Infrastructure](#technical-infrastructure)
7. [What the Dashboard Shows You](#what-the-dashboard-shows-you)

---

# SYSTEM OVERVIEW

## What This System Is

The SRPSID-DSS Portal is a scientific decision-support tool that helps government officials, emergency managers, and planners understand flood risk in Sindh Province. It answers three fundamental questions:

1. **Where will flooding occur?** (Hazard)
2. **What will be damaged?** (Risk & Vulnerability)
3. **Who will be affected?** (Population Risk & Hotspots)

The system does not predict floods. Instead, it models hypothetical scenarios to help you prepare for different possibilities—from frequent small floods to rare catastrophic events.

## Geographic Scope

The system covers **7 districts in the Indus River Basin**:

- Dadu
- Jacobabad
- Jamshoro
- Kashmore
- Larkana
- Qambar Shahdadkot
- Shikarpur

These districts were selected because they are historically vulnerable to Indus River flooding and contain critical agricultural, infrastructure, and population assets.

## How the System Works: A Simple Example

Imagine you want to know: *"What happens if a 25-year flood occurs while our embankments are in poor condition?"*

The system answers this by:

1. **Showing you the flood map** — where water will be, how deep, how fast
2. **Counting affected assets** — how many buildings, roads, hospitals, schools, crops
3. **Calculating economic damage** — the cost in US Dollars
4. **Estimating population impact** — how many people affected, potential casualties
5. **Comparing scenarios** — present vs. future climate, different maintenance levels

You can explore 84 different scenarios and see results immediately through an interactive map and dashboard.

---

# HAZARD ASSESSMENT

## What "Hazard" Means

In flood science, **hazard** refers to the dangerous flood event itself—the water. We characterize hazard by measuring four things:

1. **Depth** — How deep the water gets (meters)
2. **Velocity** — How fast the water flows (meters per second)
3. **Duration** — How long the water stays (hours)
4. **Hazard Intensity (V×h)** — The product of velocity × depth

These four parameters determine how destructive a flood will be. A flood that is 3 meters deep and flowing at 2 m/s is far more dangerous than a flood that is 1 meter deep and flowing at 0.5 m/s.

## Why We Modeled 84 Scenarios

Flood risk is not a single number—it's a spectrum of possibilities. To understand this spectrum, we modeled **84 unique flood scenarios**:

### Scenario Dimension 1: Return Period (How Often?)

We modeled **7 return periods**—the statistical likelihood of a flood occurring in any given year:

| Return Period | Probability | Description |
|---------------|-------------|-------------|
| 2.3 years | 43% per year | Frequent minor flooding |
| 5 years | 20% per year | Occasional flooding |
| 10 years | 10% per year | Moderate flooding |
| 25 years | 4% per year | Significant flooding |
| 50 years | 2% per year | Major flooding |
| 100 years | 1% per year | Severe flooding |
| 500 years | 0.2% per year | Catastrophic flooding |

**Why this matters:** Frequent floods cause more cumulative damage over time. Rare floods cause extreme single-event damage. We need to understand both.

### Scenario Dimension 2: Maintenance Conditions (What If Infrastructure Fails?)

We modeled **3 maintenance levels** representing the condition of flood protection infrastructure:

| Maintenance Level | Description | What It Means |
|-------------------|-------------|---------------|
| **Perfect** | Embankments perform as designed | System works as intended |
| **Reduced Capacity** | Embankments partially silted or aged | System has 50% reduced effectiveness |
| **Breaches** | Structural failures at 12 vulnerable points | System fails catastrophically at weak points |

**Why this matters:** The 2022 flood demonstrated that embankment breaches dramatically change flood patterns. We must plan for infrastructure failure.

### Scenario Dimension 3: Climate Conditions (Present vs. Future)

We modeled **2 climate scenarios**:

| Climate | Description |
|---------|-------------|
| **Present** | Uses historical climate data from recent decades |
| **Future** | Incorporates climate change projections (increased monsoon intensity) |

**Why this matters:** Climate change will alter flood patterns. Future planning must account for changing conditions.

### Total Scenario Count

```
7 return periods × 3 maintenance levels × 2 climates = 42 scenarios
```

**For each scenario, we modeled all 4 hazard parameters** (depth, velocity, duration, V×h), resulting in comprehensive hazard maps for the entire study area.

## How the Simulations Were Created

### The Scientific Foundation

Our flood simulations are based on **1D/2D coupled hydrodynamic modeling** using industry-standard software:

- **HEC-RAS** (Hydrologic Engineering Center's River Analysis System)
- **SOBEK** (1D/2D hydrodynamic modeling software)

These models solve the physics equations that govern water flow—the Saint-Venant equations for open channel flow and the shallow water equations for overland flow.

### Input Data for Modeling

| Data Type | Source | Purpose |
|-----------|--------|---------|
| **Terrain** | High-Resolution Digital Terrain Model (HDTM) | Determines where water flows |
| **River Geometry** | Surveyed cross-sections of Indus River | Defines channel capacity |
| **Boundary Conditions** | Historical flow data from SUPARCO | Water entering the system |
| **Infrastructure** | Embankment locations and heights | Barriers that contain water |
| **Breach Locations** | Historical failure points | Where embankments may fail |

### The Modeling Process

1. **Setup the river network** — Define the Indus River channel geometry
2. **Add embankments** — Include levees, dykes, and protective structures
3. **Define breach scenarios** — Model 12 historically vulnerable locations
4. **Apply boundary conditions** — Input water flow for each return period
5. **Run the simulation** — Calculate water depth and velocity at every 10m grid cell
6. **Extract outputs** — Generate maps of depth, velocity, duration, and V×h

### What the Outputs Look Like

Each scenario produces **four raster maps** (like a digital photograph, but each pixel contains a measurement):

- **Depth map** — Every 10m pixel shows maximum water depth in meters
- **Velocity map** — Every pixel shows maximum flow velocity in m/s
- **Duration map** — Every pixel shows how long water persisted in hours
- **V×h map** — Every pixel shows the hazard intensity product

These maps are served through GeoServer (a map server) and displayed in the web dashboard.

## How Climate Change Was Incorporated

The future climate scenarios use **projected changes in monsoonal rainfall intensity** based on:

- **RCP (Representative Concentration Pathway) scenarios** from IPCC climate models
- **Regional climate projections** for South Asia
- **Increased extreme rainfall events** — the most significant climate change impact for flooding

The key difference: Future climate scenarios have **higher peak flows** entering the river system, which produces:
- Greater flood depths
- Faster flow velocities
- Larger inundated areas
- More extensive V×h exceedance zones

---

# RISK & VULNERABILITY

## What "Risk" and "Vulnerability" Mean

In flood science, these terms have specific meanings:

- **Hazard** = The dangerous flood event (the water)
- **Exposure** = The assets and people in the flood zone
- **Vulnerability** = How susceptible those assets are to damage
- **Risk** = Hazard × Exposure × Vulnerability

Our system progresses through three risk modes:

### Risk Mode 1: Exposure (Exp)

**Question:** *"How much stuff is in the flood zone?"*

We measure the physical presence of assets within flooded areas:

- **Agriculture:** Hectares of cropped area
- **Buildings:** Square meters of building footprint
- **Infrastructure:** Kilometers of roads, railways, electric lines
- **Facilities:** Count of hospitals, schools, health units

**Method:** We overlay flood maps with asset maps using PostGIS spatial operations. The system calculates the exact area or length of assets intersecting flood waters.

**What it tells you:** The sheer scale of assets exposed—useful for understanding the magnitude of potential impacts.

### Risk Mode 2: Vulnerability (Vul)

**Question:** *"Of the exposed assets, how many are actually susceptible to damage?"*

Not all flooding causes damage. A building in 10cm of water may be fine. A building in 2m of water may be destroyed. We apply **depth thresholds**:

| Asset Type | Damage Threshold | Assumption |
|------------|------------------|------------|
| Agriculture | 15cm (0.15m) | Crops damaged when submerged |
| Buildings | 30cm (0.3m) | Structural damage begins |
| Roads | 50cm (0.5m) | Impassable to vehicles |
| Infrastructure | 30cm (0.3m) | Equipment damage begins |

**Method:** We count only assets where flood depth exceeds the damage threshold.

**What it tells you:** The realistic scope of impact—assets that will actually need repair or replacement.

### Risk Mode 3: Economic Damage (Dmg)

**Question:** *"What is the monetary value of the losses?"*

We convert physical damage into **US Dollars** using depth-damage curves.

**What are Depth-Damage Curves?**

A depth-damage curve shows the percentage of an asset's value that is lost at different flood depths. Example for a kacha (mud) house:

| Flood Depth | Damage % | Explanation |
|-------------|----------|-------------|
| 0.5m | 20% | Floors damaged, walls repairable |
| 1.0m | 56% | Major structural damage (this is where "buildLow56" comes from) |
| 2.0m | 80% | Near-total loss |
| 3.0m+ | 100% | Complete destruction |

**Data Sources for Damage Curves:**

Our damage curves are based on international research, adapted to local conditions:

- **Defra (UK Department for Environment)** — Flood Risks to People Phase 2 (FD2321)
- **USBR (US Bureau of Reclamation)** — RCEM (Risk-Cost Evaluation Model)
- **Local calibration** — Adjusted to Sindh construction types and costs

### The 11 Asset Types We Evaluate

Our system calculates damage for **11 categories of assets**:

#### Agriculture (1 type)
- **Cropped Area** — Measured in hectares, valued at regional crop prices

#### Buildings (3 types)
- **Kacha (buildLow56)** — Mud/unburnt brick houses, 56% damage at 1m depth
- **Pakka (buildLow44)** — Burnt brick houses, 44% damage at 1m depth
- **High-Rise (buildHigh)** — Multi-story concrete buildings, <10% damage at 1m depth

**Why distinguish building types?** Construction quality dramatically affects vulnerability. Poor households in kacha houses suffer disproportionately.

#### Infrastructure (4 types)
- **Telecom Towers** — Communication infrastructure
- **Electric Lines** — Power transmission
- **Railways** — Transport network
- **Roads** — Transport network

#### Critical Facilities (3 types)
- **Hospitals** — Emergency healthcare
- **Basic Health Units (BHU)** — Primary healthcare
- **Schools** — Education infrastructure

## How Damage Was Calculated: The Complete Process

### Step 1: Asset Data Collection

We gathered **geospatial data for all assets** in the 7 districts:

| Asset Type | Data Source | Format | Total Count |
|------------|-------------|--------|-------------|
| Buildings | Remote sensing | Point features | ~500,000 |
| Roads | Survey data | Line features | ~15,000 km |
| Railways | Survey data | Line features | ~500 km |
| Electric Grid | Utility data | Line features | ~8,000 km |
| Cropped Area | Land use classification | Polygon features | ~2M hectares |
| Hospitals | Health department | Point features | ~100 |
| BHUs | Health department | Point features | ~500 |
| Schools | Education department | Point features | ~5,000 |
| Telecom Towers | Telecommunications data | Point features | ~2,000 |

All asset data is stored in PostgreSQL/PostGIS database with precise UTM coordinates.

### Step 2: Spatial Overlay with Hazard Layers

For each of the 42 scenarios, we performed **spatial intersection** operations:

```
For each asset:
    1. Find its location (coordinates)
    2. Check the hazard map at that location
    3. Extract: depth, velocity, duration, V×h
    4. Assign to depth bin based on depth value
    5. Apply damage function based on depth
```

**Depth Bin Classification:**

Flood depth is categorized into 6 bins for analysis:

| Depth Bin | Range | Color | Damage Level |
|-----------|-------|-------|--------------|
| 15-100cm | 0.15m - 1.0m | Light Green | Minor damage |
| 1-2m | 1.0m - 2.0m | Gold | Moderate damage |
| 2-3m | 2.0m - 3.0m | Orange | Major damage |
| 3-4m | 3.0m - 4.0m | Tomato Red | Severe damage |
| 4-5m | 4.0m - 5.0m | Crimson | Extreme damage |
| above5m | >5.0m | Dark Red | Catastrophic damage |

### Step 3: Apply Vulnerability Functions

For each asset in each depth bin, we apply the appropriate damage function:

```
Damage = Asset Value × Damage Function(depth)
```

**Example Calculation:**

A kacha house (value: 500,000 PKR) flooded to 1.5m depth:

1. Find damage curve for kacha buildings
2. At 1.5m depth, damage = 65% (interpolated from curve)
3. Damage = 500,000 × 0.65 = 325,000 PKR
4. Convert to USD (using exchange rate)

We repeat this calculation for **every asset** in **every scenario**.

### Step 4: Aggregate Results

Results are aggregated at multiple levels:

- **By district** — Each of the 7 districts
- **By scenario** — Each of the 42 scenarios
- **By asset type** — Each of the 11 asset categories
- **By depth bin** — Each of the 6 depth categories

This aggregation allows you to explore results at any scale—from total regional damage to specific district-asset combinations.

## Understanding Risk Curves

### What Is a Risk Curve?

A risk curve shows **how damage varies with return period**. It plots:

- **X-axis:** Return period (how often the flood occurs)
- **Y-axis:** Economic damage (US Dollars)

### How to Read a Risk Curve

**Example:** Dadu District, Perfect Maintenance, Present Climate

| Return Period | Annual Probability | Damage (USD) |
|---------------|-------------------|--------------|
| 2.3 years | 43% | $5M |
| 5 years | 20% | $15M |
| 10 years | 10% | $40M |
| 25 years | 4% | $120M |
| 50 years | 2% | $250M |
| 100 years | 1% | $450M |
| 500 years | 0.2% | $1.2B |

If you plot these points and connect them, you get a risk curve.

### What Risk Curves Tell You

1. **Slope** — Steeper slopes mean damage increases rapidly with larger floods
2. **Curvature** — Shows nonlinear effects (e.g., breach cascades)
3. **Area under curve** — Represents Expected Annual Damage (see below)

### Comparing Risk Curves

You can compare risk curves to understand:

- **Maintenance impact** — Breaches curve vs. Perfect curve shows infrastructure value
- **Climate impact** — Future vs. Present shows climate change effect
- **District vulnerability** — Steeper curves = more vulnerable districts

## Expected Annual Damage (EAD): The "Price of Risk"

### What EAD Means

**Expected Annual Damage (EAD)** is the average economic loss you should expect **every single year** from flooding.

It's not the damage from a single flood—it's the long-term average accounting for both frequent small floods and rare large floods.

### How EAD Is Calculated: Trapezoidal Integration

EAD integrates the area under the risk curve using a mathematical method called **trapezoidal integration**:

```
EAD = Σ 0.5 × (Dᵢ + Dᵢ₊₁) × |1/RPᵢ - 1/RPᵢ₊₁|
```

**Where:**
- Dᵢ = Damage at return period RPᵢ
- RP = Return period in years

### Why This Method?

The trapezoidal method properly weights **frequent events more heavily than rare events**. Consider:

- A 2.3-year flood happens ~43% of the time (43 out of 100 years)
- A 500-year flood happens ~0.2% of the time (2 out of 1,000 years)

Even though the 500-year flood causes massive damage, it's so rare that it contributes less to the annual average than frequent smaller floods.

### EAD Calculation Example

For a district with the damage values shown earlier:

```
Between 2.3-year and 5-year:
  Area = 0.5 × ($5M + $15M) × |0.435 - 0.2|
       = 0.5 × $20M × 0.235
       = $2.35M

Between 5-year and 10-year:
  Area = 0.5 × ($15M + $40M) × |0.2 - 0.1|
       = 0.5 × $55M × 0.1
       = $2.75M

[Continue for all intervals]

Total EAD = Sum of all areas ≈ $8-12M per year
```

### What EAD Tells You

| EAD Value | Interpretation | Use Case |
|-----------|----------------|----------|
| $1M/year | Low risk | Standard preparedness adequate |
| $10M/year | Moderate risk | Targeted mitigation needed |
| $50M/year | High risk | Major infrastructure investment justified |
| $100M/year | Very high risk | Urgent action required |

**Decision Rule:** If a mitigation project (e.g., embankment reinforcement) costs less than 20-30 years of accumulated EAD, it's economically justified.

---

# POPULATION RISK

## What Population Risk Assesses

Population risk estimates **potential loss of life and injuries** from flooding. Unlike economic damage, which can be measured in dollars, human risk requires specialized methods.

Our casualty estimation answers:

- How many people might be **affected** (in flood zone)
- How many might be **injured**
- How many might be **killed**
- **Where** the highest risk areas are

## Data Used for Population Risk

### Primary Data Sources

| Data Type | Source | Resolution | Use |
|-----------|--------|------------|-----|
| **Population Distribution** | Census 2017 (PBS) | District-level | Base population counts |
| **Settlement Locations** | Remote sensing | Point features | Where people live |
| **Flood Hazard** | Our 84 scenarios | 10m grid | Water depth, velocity, duration |
| **2022 Flood Data** | PDMA/Sindh government | Event-based | Model calibration |

### Population Data Processing

1. **Start with Census 2017** district populations
2. **Project to 2026** using growth rates
3. **Distribute to settlement points** using population density weighting
4. **Overlay with hazard maps** to determine exposure

## How Casualties Were Estimated: The Methodology

### The Scientific Foundation

Our casualty estimation is based on **semi-quantitative mortality modeling** from peer-reviewed research:

- **Jonkman et al. (2008)** — "Loss of life estimation in flood risk assessment" (Journal of Flood Risk Management)
- **USBR (2015)** — RCEM (Reclamation Consequence Estimating Methodology)
- **Defra (2006)** — "Flood Risks to People – Phase 2" (FD2321)

### The Mortality Factor Matrix

Research shows that flood mortality depends primarily on **depth and velocity** combined. We use a **mortality factor matrix** that assigns fatality rates based on hazard zones:

| Hazard Zone | Depth | Velocity | Mortality Factor | Risk Level |
|-------------|-------|----------|------------------|------------|
| Shallow, Low | <1m | <0.5 m/s | 0.01% | Minimal |
| Shallow, Moderate | <1m | 0.5-1.5 m/s | 0.05% | Low |
| Shallow, High | <1m | >1.5 m/s | 0.1% | Low-Moderate |
| Medium 1, Low | 1-2m | <0.5 m/s | 0.1% | Low-Moderate |
| Medium 1, Moderate | 1-2m | 0.5-1.5 m/s | 0.5% | Moderate |
| Medium 1, High | 1-2m | >1.5 m/s | 1.0% | High |
| Medium 2, Low | 2-3m | <0.5 m/s | 0.5% | Moderate |
| Medium 2, Moderate | 2-3m | 0.5-1.5 m/s | 2.5% | High |
| Medium 2, High | 2-3m | >1.5 m/s | 5.0% | Very High |
| Deep, Any | >3m | Any | 5.0% | Very High |

**Special Case:** If V×h > 1.5 m²/s, mortality factor = 5-10% regardless of depth

**Why V×h?** The product of velocity and depth determines **stability**:
- V×h < 0.5: People can stand and walk
- V×h > 1.5: People cannot stand; vehicles swept away; very dangerous
- V×h > 6.0: Extremely lethal; near-certain fatality zone

### The Estimation Process

**Step 1: Classify Population by Hazard Zone**

For each settlement point:
```
1. Get flood depth at location
2. Get flood velocity at location
3. Calculate V×h = depth × velocity
4. Assign to hazard zone from matrix
```

**Step 2: Apply Mortality Factors**

```
Fatalities = Population in zone × Mortality Factor × Calibration Factor
```

**Step 3: Apply Duration Modifiers**

- **Flash floods** (duration <6h): ×1.5 multiplier (less warning time)
- **Normal floods** (duration 6-24h): ×1.0 (baseline)
- **Prolonged floods** (duration >24h): ×1.2 (exposure-related deaths)

**Step 4: Calculate Injuries**

```
Injuries = Fatalities × 3
```

(The 3× multiplier is an international convention based on historical flood data)

### The 2022 Flood Calibration

**Why Calibrate?**

International mortality factors are based on global averages. Local conditions—warning systems, evacuation capacity, housing quality—affect actual fatalities.

**The 2022 Benchmark:**
- Affected population: 14.5 million
- Actual fatalities: 1,739
- Observed fatality rate: 0.012%

**Our Calibration:**

We adjusted our mortality factors with a **calibration multiplier of 0.05** so that our MODERATE estimate matches the observed 2022 fatality rate.

**Result:** Our estimates now reflect Sindh-specific conditions rather than generic international assumptions.

### Uncertainty Estimation

We provide **three fatality estimates** for each scenario:

| Estimate Type | Description | Use |
|---------------|-------------|-----|
| **Low** | Optimistic scenario (lower mortality factors) | Best-case planning |
| **Moderate** | Best estimate (calibrated to 2022) | Most likely outcome |
| **High** | Pessimistic scenario (upper bound factors) | Worst-case planning |

This range acknowledges uncertainty in flood mortality prediction.

## Expected Annual Fatalities (EAF)

### What EAF Is

Just as we calculate Expected Annual Damage (EAD) for economic risk, we calculate **Expected Annual Fatalities (EAF)** for population risk using the same trapezoidal integration method.

```
EAF = Σ 0.5 × (Fᵢ + Fᵢ₊₁) × |1/RPᵢ - 1/RPᵢ₊₁|
```

Where Fᵢ = Fatalities for return period RPᵢ

### Why EAF Matters

EAF identifies districts where the **probability of high-mortality events is statistically highest**, regardless of whether a flood happened this year.

**Example:**
- District A has high EAF because it has large shallow floods frequently
- District B has low EAF because it only floods in rare extreme events

Both districts might have similar maximum fatalities, but District A has higher *annual* risk.

### How EAF Is Used

The Population Risk view in the dashboard shows EAF for all districts under current scenario settings. This helps:

1. **Prioritize evacuation planning** for high-EAF districts
2. **Target early warning systems** where annual risk is highest
3. **Allocate emergency resources** to high-risk areas
4. **Evaluate mitigation benefits** in lives saved per year

---

# FLOOD RISK HOTSPOTS

## What Hotspots Are

A **flood risk hotspot** is an area that ranks as a high priority for intervention based on multiple risk dimensions.

Hotspots identify the **"convergence of crisis"**—areas where:
- Physical risk (economic damage) is high
- Population risk (fatalities) is high
- Socioeconomic vulnerability (community susceptibility) is high

These areas should receive priority attention for:
- Mitigation infrastructure (embankments, spillways)
- Emergency response capacity
- Development investment
- Poverty reduction programs

## How Hotspots Are Created: The Three-Dimensional Framework

### Dimension 1: Physical Risk (Economic)

**Source:** Expected Annual Damage (EAD) from economic risk analysis

**What it measures:** Average annual monetary loss from flooding

**Assets included:**
- Agriculture (cropped area)
- Buildings (kacha, pakka, high-rise)
- Infrastructure (telecom, electric, railways, roads)
- Critical facilities (hospitals, BHUs, schools)

**Normalization:** We convert EAD to a 0-100 scale using min-max normalization:
```
Physical Risk (normalized) = (EAD - min_EAD) / (max_EAD - min_EAD) × 100
```

This allows us to compare economic risk with other dimensions.

### Dimension 2: Population Risk (Loss of Life)

**Source:** Expected Annual Fatalities (EAF) from casualty estimation

**What it measures:** Average annual fatalities from flooding

**Methodology:** V×h mortality factors, calibrated to 2022 flood

**Normalization:** We convert EAF to a 0-100 scale:
```
Population Risk (normalized) = (EAF - min_EAF) / (max_EAF - min_EAF) × 100
```

**Why this matters:** A poor district with low economic damage but high population risk deserves priority. Hotspots capture this.

### Dimension 3: Socioeconomic Vulnerability

**Source:** Census 2017 + Poverty 2019 (PSLM) composite index

**What it measures:** Community susceptibility to flood impacts

**Four Sub-Components:**

1. **Demographic Vulnerability (40% weight)**
   - Population density (30%) — Higher density = more exposure
   - Urban proportion (20%) — Urban poor often more exposed
   - Household size (20%) — Larger households = more dependents
   - Growth rate (15%) — Higher growth = more pressure
   - Sex ratio deviation (15%) — Gender imbalance vulnerability

2. **Economic Vulnerability (30% weight)**
   - **Poverty rate** from PSLM 2019-20
   - Direct use of poverty rate as vulnerability indicator
   - Range: 21.92% (Larkana) to 29.41% (Dadu)

3. **Housing Vulnerability (20% weight)**
   - Proxy from urban proportion
   - Urban poor in informal settlements highly vulnerable
   - Formula: `Urban% × 0.6 + Rural% × 0.3`

4. **Service Access Vulnerability (10% weight)**
   - Inverse of urban proportion
   - Rural areas have less emergency access
   - Formula: `100 - Urban%`

**Composite Score:**
```
Vulnerability = 0.4 × Demographic + 0.3 × Economic + 0.2 × Housing + 0.1 × Service Access
```

### The Composite Hotspot Score

We combine the three dimensions using **equal weights**:

```
Hotspot Score = 0.33 × Physical Risk (normalized EAD)
             + 0.33 × Population Risk (normalized EAF)
             + 0.33 × Socioeconomic Vulnerability
```

**Score Interpretation:**

| Score Range | Priority | Action Required |
|-------------|----------|-----------------|
| 70-100 | Very High | Urgent intervention; major mitigation projects |
| 50-70 | High | Priority intervention; significant investment |
| 30-50 | Moderate | Enhanced preparedness; targeted interventions |
| 0-30 | Low | Monitor; standard preparedness |

## How Input Data Was Created

### Vulnerability Index Data Pipeline

```
Raw Data Collection
    ↓
Census 2017 (Pakistan Bureau of Statistics)
    ↓
Data Cleaning & Validation
    ↓
District-Level Aggregation
    ↓
PSLM 2019-20 Poverty Data (World Bank)
    ↓
Merge Census + Poverty
    ↓
public/data/socioeconomic/*.json
    ↓
useSocioeconomicData() hook
    ↓
Vulnerability calculation functions
    ↓
Hotspot composite score
```

### Poverty Data Summary

| Rank | District | Poverty Rate | Headcount | Mean Consumption (PKR) |
|------|----------|--------------|-----------|------------------------|
| 1 | Dadu | 29.41% | 487,586 | 4,900 |
| 2 | Jacobabad | 27.67% | 190,286 | 5,224 |
| 3 | Jamshoro | 25.81% | 147,417 | 5,449 |
| 4 | Kashmore | 25.21% | 273,604 | 5,275 |
| 5 | Shikarpur | 24.47% | 308,544 | 5,485 |
| 6 | Qambar Shahdadkot | 22.41% | 403,524 | 5,414 |
| 7 | Larkana | 21.92% | 303,338 | 5,331 |

### Census Data Summary

| District | Population | Density/km² | Urban % | HH Size | Growth Rate |
|----------|------------|-------------|---------|---------|-------------|
| Dadu | 1,550,390 | 197.1 | 24.7% | 6.2 | 2.1% |
| Jacobabad | 1,007,009 | 373.2 | 29.5% | 6.8 | 2.3% |
| Jamshoro | 993,908 | 88.7 | 43.5% | 6.1 | 2.5% |
| Kashmore | 1,090,336 | 422.6 | 23.3% | 7.1 | 2.4% |
| Larkana | 1,521,786 | 781.2 | 45.9% | 6.5 | 1.9% |
| Qambar Shahdadkot | 1,338,035 | 244.4 | 29.7% | 6.9 | 2.2% |
| Shikarpur | 1,233,760 | 491.2 | 24.7% | 6.6 | 2.0% |

## What the Results Mean

### How to Interpret Hotspot Rankings

**Example Rankings (Present Climate, Breaches Maintenance):**

| Rank | District | Physical | Population | Vulnerability | Hotspot Score |
|------|----------|----------|------------|---------------|---------------|
| 1 | Dadu | 78 | 85 | 62 | **75** |
| 2 | Jacobabad | 72 | 68 | 71 | **70** |
| 3 | Kashmore | 65 | 62 | 58 | **62** |
| 4 | Larkana | 58 | 45 | 55 | **53** |
| 5 | Shikarpur | 42 | 38 | 48 | **43** |
| 6 | Qambar Shahdadkot | 35 | 32 | 42 | **36** |
| 7 | Jamshoro | 28 | 25 | 38 | **30** |

**Interpretation:**
- **Dadu (Rank 1):** Highest economic damage, highest population risk, high vulnerability. This district has **converging risks** on all dimensions—urgent priority.
- **Jacobabad (Rank 2):** High economic and population risk, very high vulnerability. Also urgent priority.
- **Jamshoro (Rank 7):** Lowest on all dimensions. Still requires planning, but less urgent than higher-ranked districts.

### How Hotspots Guide Action

The hotspot ranking helps answer:

1. **Where to invest first?** — Start with Rank 1-3 districts
2. **What type of investment?** — Look at dimension breakdowns:
   - High Physical Risk → Infrastructure mitigation
   - High Population Risk → Early warning, evacuation capacity
   - High Vulnerability → Poverty reduction, housing improvement
3. **What will be achieved?** — EAD and EAF show quantitative benefits

---

# TECHNICAL INFRASTRUCTURE

## Brief Overview

The SRPSID-DSS Portal is a **web-based Geographic Information System (GIS)** that delivers flood risk assessment through an interactive dashboard.

### Architecture

**Three-Tier Architecture:**

1. **Data Layer**
   - PostgreSQL/PostGIS database for exposure and impact data
   - GeoServer for map services (200+ hazard and exposure layers)
   - Static risk data (JSON files from Excel analysis)

2. **API Layer**
   - Node.js/Express backend serving REST APIs
   - Impact summary endpoints with caching
   - Population risk and casualty estimation
   - JWT authentication for user management

3. **Presentation Layer**
   - React 19 web application with TypeScript
   - OpenLayers for interactive mapping
   - Real-time data visualization

### Technologies Used

| Component | Technology |
|-----------|------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Maps | OpenLayers (UTM Zone 42N projection) |
| Charts | Recharts |
| Backend | Node.js, Express |
| Database | PostgreSQL 15, PostGIS 3.3 |
| Map Server | GeoServer 2.23.x |
| Authentication | JWT tokens with bcrypt |

### Deployment

- **Live Site:** https://portal.srpsid-dss.gos.pk
- **Server:** Apache on WSL with HTTPS
- **Location:** Government data center
- **Access:** Public web access (interventions require login)

---

# WHAT THE DASHBOARD SHOWS YOU

## The Four Main Modules

### 1. Hazard View

**What it shows:**
- Interactive flood maps for all 84 scenarios
- Four hazard parameters: depth, velocity, duration, V×h
- Layer tree for toggling scenarios on/off
- Swipe compare for side-by-side scenarios

**What it means:**
- See exactly where flooding will occur under different conditions
- Understand how flood intensity varies across the landscape
- Compare present vs. future climate scenarios
- Evaluate the impact of infrastructure failures

**How to use it:**
1. Select a climate (Present/Future)
2. Select a maintenance level (Perfect/Breaches/Reduced Capacity)
3. Select a return period (2.3 to 500 years)
4. Choose a hazard parameter (Depth/Velocity/Duration/V×h)
5. View the map and explore affected areas

### 2. Impact Matrix

**What it shows:**
- Two views: Summary Heatmap and Detailed Breakdown
- For each scenario: affected counts for 9 exposure types
- Population impact by depth bin
- Severity classification (Low/Medium/High/Extreme)

**What it means:**
- Quantify exactly what is affected in each scenario
- Understand which assets are most vulnerable
- Compare impacts across scenarios
- Identify depth distribution of impacts

**How to use it:**
1. Select a climate (Present/Future)
2. View the heatmap matrix for quick comparison
3. Click any cell to see detailed breakdown
4. Use depth threshold filter to focus on severe impacts

### 3. Risk Dashboard

**What it shows:**
- Six views: Summary Heatmap, District Breakdown, Spatial, EAD, Population Risk, Hotspots
- Economic damage by asset type and district
- Expected Annual Damage (EAD) with trapezoidal integration
- Population risk with casualty estimation
- Hotspot rankings with three-dimension analysis

**What it means:**
- Understand the long-term "price of risk" (EAD)
- Compare risk across districts and scenarios
- Identify priority areas for intervention
- Evaluate benefits of different mitigation strategies

**How to use it:**
1. Select a view (start with Summary Heatmap)
2. Select climate and maintenance level
3. View EAD by district and asset type
4. Check Population Risk for casualty estimates
5. Review Hotspots for priority rankings

### 4. Interventions

**What it shows:**
- Map-based drawing tool for proposed mitigation measures
- 42 intervention types (structural, non-structural, emergency)
- Collaborative planning with user authentication
- Export to GeoJSON for external analysis

**What it means:**
- Plan specific mitigation projects
- Collaborate across agencies
- Document proposed interventions
- Link interventions to hotspot priorities

**How to use it:**
1. Sign in (authentication required)
2. Click "Create Intervention"
3. Select intervention type from dropdown
4. Draw geometry on map (point/line/polygon)
5. Save and share with team

---

# KEY ASSUMPTIONS AND LIMITATIONS

## What the System Assumes

1. **Hazard Modeling**
   - Embankment locations and heights are accurate
   - Breach locations represent realistic failure scenarios
   - Climate projections are reasonable approximations
   - Terrain data is sufficiently accurate

2. **Exposure Analysis**
   - Asset locations are correct
   - Asset counts are reasonably complete
   - Building types are correctly classified
   - Population distribution reflects reality

3. **Vulnerability Assessment**
   - Depth-damage curves are applicable to Sindh
   - Construction quality is accurately categorized
   - Asset values are reasonably estimated
   - Calibration to 2022 flood is valid for other scenarios

4. **Population Risk**
   - Mortality factors from international research apply locally
   - 2022 calibration is representative
   - Warning systems and evacuation capacity are consistent
   - Age and disability distributions are average

5. **Socioeconomic Data**
   - Census 2017 remains approximately accurate
   - Poverty 2019 data is still relevant
   - Growth rates have remained consistent

## Known Limitations

1. **Data Age**
   - Census is from 2017 (10 years old)
   - Poverty data is from 2019 (7 years old)
   - Does not reflect COVID-19 or 2022 flood impacts

2. **Spatial Resolution**
   - Analysis is at district level only
   - No sub-district (tehsil) detail
   - Within-district variation not visible

3. **Risk Scope**
   - Only direct physical damage included
   - Indirect losses (business interruption) excluded
   - Supply chain impacts not considered
   - Long-term recovery costs not included

4. **Climate Projections**
   - Based on IPCC RCP scenarios
   - Regional climate model uncertainty
   - Downscaling introduces error

5. **Mortality Estimation**
   - Significant uncertainty in fatality prediction
   - Warning effectiveness not explicitly modeled
   - Age and disability not factored in

---

# METHODOLOGY REFERENCES

## Hazard Modeling

- HEC-RAS Reference Manual, US Army Corps of Engineers
- SOBEK User Manual, Deltares
- Saint-Venant equations for open channel flow
- Shallow water equations for overland flow

## Depth-Damage Curves

- Defra (2006). "Flood Risks to People – Phase 2." R&D Technical Report FD2321.
- USBR (2015). "Reclamation Consequence Estimating Methodology (RCEM)."
- Penning-Rowsell, E. et al. (2013). "The Flood Hazard Research Centre Depth-Damage Curves."

## Mortality Estimation

- Jonkman, S.N. et al. (2008). "An overview of quantitative risk measures for loss of life and economic damage." Journal of Flood Risk Management 1(1): 30-43.
- USBR (2015). RCEM – Reclamation Consequence Estimating Methodology.
- Defra/Environment Agency (2006). R&D Technical Report FD2321.

## EAD/EAF Methodology

- Hall, J.W. et al. (2003). "A methodology for national-scale flood risk assessment." Water Resources Research.
- Merz, B. et al. (2010). "Flood risk curves and uncertainty bounds." Natural Hazards and Earth System Sciences.

## Vulnerability Assessment

- Cutter, S.L. et al. (2003). "Social vulnerability to environmental hazards." Social Science Quarterly 84(2): 242-261.
- Fekete, A. (2009). "Validation of a social vulnerability index." Natural Hazards and Earth System Sciences.

## Data Sources

- Pakistan Bureau of Statistics. Census 2017. https://www.pbs.gov.pk
- Pakistan Social and Living Standards Measurement (PSLM) 2019-20
- World Bank Poverty Data for Pakistan Districts
- SUPARCO Climate Data Center
- Sindh Disaster Management Authority (PDMA) 2022 Flood Report

---

# END OF PRESENTATION TEXT

**For questions about the methodology or data, contact:**
SRPSID-DSS Technical Team
Portal: https://portal.srpsid-dss.gos.pk

**Last Updated:** April 27, 2026
