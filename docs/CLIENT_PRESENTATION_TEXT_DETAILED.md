# FLOOD RISK ASSESSMENT DECISION SUPPORT SYSTEM
## Complete Client Presentation - Detailed Technical Documentation

**Project:** Sindh River Basin Flood Risk Decision Support System (SRPSID-DSS)
**URL:** portal.srpsid-dss.gos.pk
**Date:** April 2026
**Scope:** 7 Districts in Sindh Province, Pakistan

---

# TABLE OF CONTENTS

1. [Introduction: Why This System Exists](#introduction-why-this-system-exists)
2. [Understanding Flood Risk: Basic Concepts](#understanding-flood-risk-basic-concepts)
3. [Hazard Assessment: The Flood Modeling Process](#hazard-assessment-the-flood-modeling-process)
4. [Risk & Vulnerability Assessment](#risk--vulnerability-assessment)
5. [Population Risk & Casualty Estimation](#population-risk--casualty-estimation)
6. [Flood Risk Hotspots: Priority Identification](#flood-risk-hotspots-priority-identification)
7. [Technical Infrastructure](#technical-infrastructure)
8. [Using the Dashboard: Complete Guide](#using-the-dashboard-complete-guide)
9. [Interpreting Results: What the Numbers Mean](#interpreting-results-what-the-numbers-mean)
10. [Assumptions, Limitations & Uncertainties](#assumptions-limitations--uncertainties)
11. [Scientific References](#scientific-references)

---

# INTRODUCTION: WHY THIS SYSTEM EXISTS

## The Problem: Flood Risk in Sindh Province

Sindh Province faces recurring flood disasters that cause:
- Loss of human life
- Destruction of homes and infrastructure
- Damage to agriculture and livelihoods
- Economic setbacks that set development back years

**Historical Context:**

The 2022 flood was a wake-up call:
- 14.5 million people affected
- 1,739 fatalities confirmed
- Estimated economic damage: billions of rupees
- Multiple embankment breaches
- Some areas inundated for weeks

**The Fundamental Questions Every Decision-Maker Faces:**

1. **Where should we invest our limited resources?**
   - Which districts need protection most urgently?
   - What type of intervention will have the most impact?
   - How do we compare different projects?

2. **How do we plan for different flood scenarios?**
   - What if we get a minor flood next year?
   - What if we get a catastrophic 100-year flood?
   - What if our embankments fail?

3. **How will climate change affect flood risk?**
   - Will floods become more frequent?
   - Will they become more severe?
   - How should this influence long-term planning?

4. **How do we protect vulnerable populations?**
   - Where are people most at risk?
   - What factors make communities vulnerable?
   - How can we reduce casualties?

## What This System Does

The SRPSID-DSS Portal is a **scientific decision-support tool** that helps answer these questions through:

**1. Scenario Exploration**
- Model 84 different flood scenarios
- See exactly where water will go under each scenario
- Understand how depth, velocity, and duration vary

**2. Impact Quantification**
- Count every building, road, hospital, school, and farm in flood zones
- Calculate economic damage in US Dollars
- Estimate population affected by depth categories

**3. Risk Assessment**
- Calculate Expected Annual Damage (EAD) — the "price of risk"
- Compare risk across districts and scenarios
- Evaluate benefits of different mitigation strategies

**4. Population Risk Analysis**
- Estimate potential fatalities and injuries
- Identify high-risk areas for emergency planning
- Calibrated to the 2022 Sindh flood experience

**5. Hotspot Identification**
- Combine physical risk, population risk, and vulnerability
- Rank districts by intervention priority
- Guide resource allocation decisions

## Who Should Use This System

**Primary Users:**
- **Government Planners** — Infrastructure investment decisions
- **Emergency Managers** — Preparedness and response planning
- **Disaster Management Authorities** — Risk assessment and mitigation
- **Development Agencies** — Targeted programming

**Secondary Users:**
- **Researchers** — Flood risk analysis and methodology
- **NGOs** — Targeting interventions and aid
- **Funding Organizations** — Project evaluation and prioritization
- **Academic Institutions** — Training and capacity building

## What This System Does NOT Do

**Important Clarifications:**

1. **This is NOT a flood forecasting system**
   - It does not predict when floods will occur
   - It does not provide early warning
   - It models hypothetical scenarios, not real-time weather

2. **This does NOT replace professional judgment**
   - It provides data to inform decisions
   - Human expertise and local knowledge remain essential
   - Results should be interpreted with professional context

3. **This does NOT account for every factor**
   - Focuses on fluvial (river) flooding
   - Does not include pluvial (rainfall) flooding
   - Does not include dam failure scenarios
   - Indirect economic impacts are not fully captured

---

# UNDERSTANDING FLOOD RISK: BASIC CONCEPTS

## The Risk Equation

Before diving into the technical details, let's establish a clear understanding of what "flood risk" means.

**Flood Risk = Hazard × Exposure × Vulnerability**

Let's break down each component:

### 1. Hazard (The Flood Itself)

**Hazard** is the dangerous natural event — the flood water.

**Characteristics of Hazard:**
- **Depth** — How deep the water gets
- **Velocity** — How fast the water flows
- **Duration** — How long the water stays
- **Extent** — How much area is covered

**Example:**
- A 1-meter deep flood that lasts 6 hours is a certain level of hazard
- A 3-meter deep flood that flows at 2 m/s and lasts 3 days is a much higher hazard

**Key Point:** Hazard exists regardless of whether people or property are present. A flood in an uninhabited area is still a hazard — it just doesn't create risk.

### 2. Exposure (What's in the Way)

**Exposure** is the presence of people, property, and assets in the flood zone.

**Examples of Exposure:**
- Houses built in a floodplain
- Roads crossing a river
- Farms located near a waterway
- Hospitals, schools, other critical facilities

**Example:**
- District A has 10,000 houses in the floodplain = high exposure
- District B has 500 houses in the floodplain = lower exposure

**Key Point:** Exposure is a necessary condition for risk, but not sufficient. Just because something is exposed doesn't mean it will be damaged.

### 3. Vulnerability (Susceptibility to Damage)

**Vulnerability** is how susceptible the exposed elements are to harm.

**Factors Affecting Vulnerability:**
- **Building Construction** — Mud houses vs. concrete buildings
- **Flood Depth** — 10cm vs. 3 meters of water
- **Warning Time** — 1 hour vs. 24 hours notice
- **Evacuation Capacity** — Ability to move people to safety
- **Poverty** — Poor households have less capacity to cope

**Example:**
- A kacha (mud) house in 1m of water = high vulnerability (will be destroyed)
- A concrete building in 1m of water = lower vulnerability (may survive with repairs)

**Key Point:** Two districts can have the same exposure (same number of houses in flood zone) but very different vulnerability based on construction quality, poverty levels, and other factors.

### 4. Risk (The Combination)

**Risk** combines all three elements.

**Example Calculation:**

| District | Hazard | Exposure | Vulnerability | Risk |
|----------|--------|----------|---------------|------|
| A | 3m deep flood | 10,000 houses | 80% mud houses | **Very High** |
| B | 3m deep flood | 10,000 houses | 80% concrete | **Moderate** |
| C | 1m deep flood | 10,000 houses | 80% mud houses | **Moderate** |
| D | 1m deep flood | 500 houses | 80% mud houses | **Low** |

**Key Point:** This system measures all three components separately and then combines them to give you a complete risk picture.

## Probability and Return Periods

**Critical Concept:** Floods are described by their probability of occurrence.

### What Is a Return Period?

A **return period** is the average time between floods of a certain size.

**Important Misconception Alert:**
A "100-year flood" does NOT mean it happens only once every 100 years.
- It means there is a 1% chance of occurrence in any given year
- You could have two 100-year floods in back-to-back years
- Or you could go 200 years without one

### Probability Calculation

| Return Period | Annual Probability | Explanation |
|---------------|-------------------|-------------|
| 2.3 years | 1/2.3 = 43.5% | ~43% chance each year — very frequent |
| 10 years | 1/10 = 10% | 10% chance each year — occurs regularly |
| 25 years | 1/25 = 4% | 4% chance each year — occasional |
| 100 years | 1/100 = 1% | 1% chance each year — rare but possible |
| 500 years | 1/500 = 0.2% | 0.2% chance each year — very rare |

### Why This Matters for Planning

**Planning Implications:**

1. **Frequent Floods (2-10 year return period)**
   - Happen regularly, multiple times in a career
   - Damage accumulates over time
   - Need infrastructure that can handle frequent events

2. **Rare Floods (100-500 year return period)**
   - May never happen in our lifetime
   - But catastrophic when they do occur
   - Need emergency plans for extreme events

3. **Expected Annual Damage (EAD)**
   - Accounts for BOTH frequent and rare events
   - Weights frequent events more heavily (because they happen more often)
   - Gives the long-term average annual cost

**Example:**
- Frequent 5-year floods: $10M damage each time, happens every 5 years
- Rare 500-year flood: $1B damage, happens every 500 years
- Which contributes more to annual risk? The frequent event!

---

# HAZARD ASSESSMENT: THE FLOOD MODELING PROCESS

## Overview: What We Mean by "Hazard Assessment"

**Hazard Assessment** means creating detailed computer simulations of floods to predict:
- Exactly where water will go
- How deep it will be at each location
- How fast it will flow
- How long it will stay

This is done through **hydrodynamic modeling** — solving the physics equations that govern water flow.

## The Modeling Framework: 84 Scenarios

### Why 84 Scenarios?

We modeled **84 unique flood scenarios** to capture the full range of possibilities:

**Breakdown:**
- 7 return periods (frequency of flooding)
- 3 maintenance conditions (state of infrastructure)
- 2 climate scenarios (present vs. future)

**Total:** 7 × 3 × 2 = 42 scenarios
**Doubled:** 42 present climate + 42 future climate = **84 scenarios**

### Scenario Dimension 1: Return Periods (7 Levels)

**Return Periods Modeled:**

1. **2.3 years** — The "2022 calibration event"
   - This represents approximately the magnitude of the 2022 flood
   - Used to calibrate and validate our models
   - This is a frequent, almost expected flood

2. **5 years** — Occasional flooding
   - 20% chance in any given year
   - Will happen multiple times in a typical career
   - Should be planned for as a regular occurrence

3. **10 years** — Moderate flooding
   - 10% chance in any given year
   - Significant but manageable with proper infrastructure

4. **25 years** — Major flooding
   - 4% chance in any given year
   - Exceeds typical design standards
   - May cause significant damage

5. **50 years** — Severe flooding
   - 2% chance in any given year
   - Approaches extreme event territory
   - Tests emergency response capacity

6. **100 years** — Extreme flooding
   - 1% chance in any given year
   - Often used as design standard for major infrastructure
   - May overwhelm conventional systems

7. **500 years** — Catastrophic flooding
   - 0.2% chance in any given year
   - Extreme event exceeding most design standards
   - Requires emergency response and disaster management

**Why This Range?**
- Captures the full spectrum from frequent to rare
- Includes design standards (10-year, 25-year, 100-year)
- Includes the 2022 event (2.3-year) for calibration
- Allows understanding of how damage scales with event magnitude

### Scenario Dimension 2: Maintenance Conditions (3 Levels)

**Critical Insight:** The 2022 flood demonstrated that embankment breaches dramatically change flood patterns. We must plan for infrastructure failure.

**Three Maintenance Levels:**

#### 1. Perfect Maintenance

**Assumption:** All embankments, levees, and flood protection structures perform as designed.

**What This Means:**
- Water stays within the designated channels
- Flood extent is minimized
- Flow velocities are controlled
- This is the "best case" scenario

**Real-World Context:**
- Requires regular maintenance
- Requires proper design and construction
- Requires no structural failures
- Represents the system working as intended

**When to Use This Scenario:**
- Setting performance targets
- Understanding what's achievable with good infrastructure
- Comparing against breach scenarios to show value of maintenance

#### 2. Reduced Capacity

**Assumption:** Embankments are partially silted, aged, or degraded — 50% reduction in effectiveness.

**What This Means:**
- Some water overtops embankments
- Flow is partially uncontrolled
- Flood extent is larger than perfect maintenance
- Represents gradual infrastructure decline

**Real-World Context:**
- Siltation reduces channel capacity over time
- Structures degrade without maintenance
- Erosion weakens embankments
- This is the "typical" scenario for aging infrastructure

**When to Use This Scenario:**
- Planning for realistic infrastructure conditions
- Understanding the cost of deferred maintenance
- Setting intermediate targets

#### 3. Breaches

**Assumption:** Structural failures at 12 historically vulnerable locations.

**What This Means:**
- Water escapes through breach points
- Flood patterns are dramatically altered
- Some areas flood that wouldn't otherwise
- Rapid onset in breach zones

**The 12 Breach Locations:**

| # | Location | District | Why It's Vulnerable |
|---|----------|----------|---------------------|
| 1 | Guddu Barrage area | Kashmore | High flow, old structure |
| 2 | Sukkur Barrage area | Sukkur | Pressure on embankments |
| 3 | Larkana Ring Embankment | Larkana | Protects urban core |
| 4 | Shikarpur Protective Bund | Shikarpur | Historical weak point |
| 5 | Dadu Circle Bund | Dadu | Protects dense population |
| 6 | Mehar | Dadu | Narrow channel, high pressure |
| 7 | KN Shah | Dadu | Downstream confluence |
| 8 | Sehwan | Jamshoro | Protective embankment |
| 9 | Manchhar Lake | Dadu/Jamshoro | Lake overflow risk |
| 10 | Bhan Syedabad | Jamshoro | Canal infrastructure |
| 11 | Hyderabad City | Jamshoro | Urban protection |
| 12 | Matiari | Jamshoro | River bend stress point |

**How Breaches Are Modeled:**
1. **Location:** Based on historical failure points
2. **Timing:** Breach occurs when water level exceeds design capacity
3. **Size:** Breach width based on embankment failure analysis
4. **Progression:** Breach grows over time (not instant)

**When to Use This Scenario:**
- Emergency planning for worst-case events
- Understanding the cost of infrastructure failure
- Identifying areas that need additional protection

### Scenario Dimension 3: Climate Conditions (2 Scenarios)

#### 1. Present Climate

**Data Used:**
- Historical river flow data from past decades
- Typical monsoon patterns
- Standard operating conditions

**What It Represents:**
- Current flood risk based on historical patterns
- The baseline for comparison
- What we've experienced in the past

**Limitations:**
- Does not account for changing climate
- Based on past, not future, conditions
- May underestimate future risk

#### 2. Future Climate

**Data Used:**
- Climate change projections from IPCC models
- RCP (Representative Concentration Pathway) scenarios
- Regional climate models for South Asia
- Increased monsoon rainfall intensity

**Key Changes:**
- **Higher peak flows** — More intense rainfall events
- **Altered timing** — Earlier or later monsoon onset
- **Increased variability** — More extreme wet and dry periods

**What It Shows:**
- How climate change will affect flood risk
- The additional risk we face in coming decades
- The importance of climate-adaptive planning

**When to Use Each:**
- **Present:** Current planning, immediate decisions
- **Future:** Long-term infrastructure, climate adaptation

## The Four Hazard Parameters

For each scenario, we calculate **four critical parameters** that determine flood impact:

### Parameter 1: Maximum Depth (maxdepth)

**Unit:** meters (m)

**Definition:** The maximum depth of water above ground level at each location

**Why It Matters:**
- Determines which buildings will be damaged
- Determines which roads become impassable
- Critical for damage estimation

**Depth Categories for Impact:**

| Depth | Impact | Example |
|-------|--------|---------|
| <0.5m | Minor | Cars can drive, houses need cleaning |
| 0.5-1m | Moderate | Cars stranded, ground floor damage |
| 1-2m | Major | Significant structural damage, evacuation needed |
| 2-3m | Severe | Buildings may collapse, dangerous for people |
| >3m | Extreme | Near-total destruction, very high fatality risk |

**How We Calculate It:**
- For each 10m × 10m grid cell
- Track water level throughout the simulation
- Record the maximum water level reached
- Subtract ground elevation to get depth

**Example:**
- Ground elevation: 50m above sea level
- Maximum water level: 52m
- Maximum depth: 52m - 50m = 2m

### Parameter 2: Maximum Velocity (maxvelocity)

**Unit:** meters per second (m/s)

**Definition:** The maximum flow speed of water at each location

**Why It Matters:**
- Fast-flowing water erodes embankments
- High velocity makes evacuation dangerous
- Determines structural stability

**Velocity Categories:**

| Velocity | Impact | Stability |
|----------|--------|-----------|
| <0.5 m/s | Low flow | People can stand, cars can drive slowly |
| 0.5-1.5 m/s | Moderate flow | Difficult to stand, cars may stall |
| 1.5-3 m/s | High flow | Cannot stand, cars swept away |
| >3 m/s | Very high flow | Extreme danger, structural damage |

**How We Calculate It:**
- Solve momentum equations for water flow
- Account for channel slope and roughness
- Include effects of obstacles and buildings
- Track maximum velocity throughout simulation

### Parameter 3: Duration (duration)

**Unit:** hours

**Definition:** How long water persists above a threshold depth (typically 15cm)

**Why It Matters:**
- Agriculture: Crops die if submerged too long
- Buildings: Longer duration = more damage
- Emergency response: Longer duration = more complex response
- Health: Standing water becomes a health hazard

**Duration Categories:**

| Duration | Impact | Example |
|----------|--------|---------|
| <6 hours | Flash flood | Rapid onset, quick recession |
| 6-24 hours | Normal flood | Typical flood event |
| 1-3 days | Extended | Significant disruption |
| 3-7 days | Prolonged | Major impact, evacuation extended |
| >7 days | Extreme | Long-term displacement |

**How We Calculate It:**
- Track when water level exceeds 15cm threshold
- Track when water level drops below threshold
- Calculate the time difference
- This is the duration for that location

### Parameter 4: Hazard Intensity (V×h)

**Unit:** square meters per second (m²/s)

**Definition:** The product of velocity × depth

**Why V×h Matters:**
- Combines the two most critical factors
- Determines stability for people and vehicles
- Used internationally for fatality risk assessment

**V×h Categories for Human Stability:**

| V×h Value | Risk Level | What It Means |
|-----------|------------|---------------|
| <0.5 m²/s | Minimal | People can stand and walk safely |
| 0.5-1.5 m²/s | Low | Difficult but possible to stand |
| 1.5-3 m²/s | Moderate | Impossible to stand, dangerous |
| 3-6 m²/s | High | Very dangerous, high fatality risk |
| >6 m²/s | Extreme | Lethal zone, near-certain fatality |

**V×h Categories for Vehicles:**

| V×h Value | Risk Level | What It Means |
|-----------|------------|---------------|
| <0.5 m²/s | Safe | Vehicles can operate |
| 0.5-1.5 m²/s | Caution | High-clearance vehicles only |
| 1.5-3 m²/s | Dangerous | Vehicles may be swept away |
| >3 m²/s | Extreme | No vehicle operation possible |

**How We Calculate It:**
- At each location: V×h = velocity × depth
- For example: 2 m/s velocity × 1.5 m depth = 3 m²/s
- This is a "very high" hazard intensity

## How the Flood Models Are Created

### The Modeling Process: Step-by-Step

#### Step 1: Data Collection

**Terrain Data:**
- **Source:** High-Resolution Digital Terrain Model (HDTM)
- **Resolution:** 10m × 10m grid cells
- **Accuracy:** Vertical accuracy <50cm
- **Coverage:** Entire study area plus buffer zones

**River Geometry:**
- **Source:** Surveyed cross-sections of Indus River
- **Spacing:** Every 1-2 km along the river
- **Detail:** Channel shape, width, depth, bank elevation
- **Structures:** Locations of barrages, bridges, weirs

**Embankment Data:**
- **Source:** Irrigation department surveys
- **Detail:** Height, width, location, condition
- **Breach Points:** Historical failure locations

**Flow Data:**
- **Source:** SUPARCO (Space and Upper Atmosphere Research Commission)
- **Type:** Historical flow records for return period estimation
- **Period:** Several decades of daily flow data

#### Step 2: Model Setup

**Software Used:**
- **HEC-RAS** (Hydrologic Engineering Center's River Analysis System)
  - Developed by US Army Corps of Engineers
  - Industry standard for 1D river modeling
  - Handles complex channel networks

- **SOBEK** (1D/2D hydrodynamic modeling)
  - Developed by Deltares (Netherlands)
  - Handles 2D overland flow
  - Couples 1D channel flow with 2D floodplain flow

**Model Configuration:**

1. **Create the River Network**
   - Input cross-section data
   - Define channel roughness (Manning's n)
   - Set bank locations and elevations

2. **Add Embankments**
   - Input levee locations and heights
   - Define failure criteria (when breaches occur)
   - Set breach parameters (size, progression)

3. **Define the Floodplain**
   - Import terrain data
   - Set roughness for different land uses
   - Define obstacles (buildings, roads)

4. **Set Boundary Conditions**
   - Input upstream flow for each return period
   - Set downstream water level
   - Define lateral inflows

#### Step 3: Running the Simulation

**What the Computer Does:**

For each 10m × 10m grid cell, the model solves:
1. **Conservation of Mass** — Water in = water out + change in storage
2. **Conservation of Momentum** — Force = mass × acceleration

**Time Steps:**
- Simulation runs in small time steps (seconds to minutes)
- Each step calculates new water levels and velocities
- Simulation may run for 30-60 days of flood time

**Computational Demand:**
- Each scenario takes 2-8 hours to compute
- Requires high-performance computing
- Generates gigabytes of output data

#### Step 4: Output Processing

**Raw Output:**
For each grid cell and each time step:
- Water depth
- Flow velocity
- Water level

**Processed Output:**
For each grid cell, we extract:
- **Maximum depth** (highest water level)
- **Maximum velocity** (fastest flow)
- **Duration** (time above 15cm threshold)
- **V×h** (velocity × depth at peak)

**Format Conversion:**
- Raw model output → GeoTIFF raster files
- GeoTIFF → GeoServer for web display
- Each scenario produces 4 rasters (one per parameter)

## Climate Change Projections

### How Future Climate Is Incorporated

**Source Data:**
- **IPCC Climate Models** — Global climate projections
- **Regional Downscaling** — South Asia specific projections
- **RCP Scenarios** — Representative Concentration Pathways

**Key Changes for Future Climate:**

1. **Increased Monsoon Intensity**
   - More extreme rainfall events
   - Higher daily rainfall totals
   - More consecutive wet days

2. **Higher Peak Flows**
   - Indus River flow increases by 15-25% for extreme events
   - Earlier peak flow timing
   - Steeper rise and fall

3. **Increased Variability**
   - More frequent droughts
   - More frequent floods
   - Less predictable patterns

**How We Apply This:**
- Use present climate simulations as baseline
- Apply flow multipliers based on climate projections
- Run same model with increased boundary conditions
- Compare present vs. future results

**What the Comparison Shows:**
- How much larger flood extents become
- How much deeper flooding gets
- How many more people are affected
- How much more economic damage occurs

---

# RISK & VULNERABILITY ASSESSMENT

## Overview: From Hazard to Risk

**Key Concept:** Hazard alone does not equal risk. Risk = Hazard × Exposure × Vulnerability.

This section explains how we:
1. Identify what's in the flood zone (Exposure)
2. Assess how susceptible it is to damage (Vulnerability)
3. Calculate the monetary value of losses (Risk)

## The Three Risk Modes

Our system progresses through three modes of risk analysis, each adding sophistication:

### Mode 1: Exposure (Exp) — What's in the Flood Zone?

**Question Answered:** *"How much stuff is located where flooding occurs?"*

**What We Measure:**
- Total area of agricultural land in flood zone
- Total area of built-up areas in flood zone
- Total count of buildings in flood zone
- Total length of roads in flood zone
- Total count of hospitals, schools, health units in flood zone

**How We Calculate It:**

For each asset type, we perform a **spatial intersection**:

```
1. Take the flood map (depth > 0.15m threshold)
2. Take the asset map (buildings, roads, etc.)
3. Find where they overlap using PostGIS
4. Calculate the overlapping area or length
```

**Example Calculation — Buildings:**

```
1. District has 50,000 buildings total
2. Flood map shows 10,000 buildings in flood zone
3. Exposure = 10,000 buildings (20% of total)
```

**Example Calculation — Roads:**

```
1. District has 2,000 km of roads total
2. Flood map shows 500 km of roads in flood zone
3. Exposure = 500 km (25% of total)
```

**Units Used:**
- **Agriculture:** Hectares (ha)
- **Built-up Area:** Hectares (ha)
- **Buildings:** Count of buildings
- **Roads:** Kilometers (km)
- **Railways:** Kilometers (km)
- **Electric Lines:** Kilometers (km)
- **Hospitals:** Count of facilities
- **BHU:** Count of facilities
- **Schools:** Count of facilities
- **Telecom Towers:** Count of towers

**What Exposure Tells You:**
- The sheer scale of assets in flood-prone areas
- Which districts have the most to lose
- Which asset types are most exposed

**Limitations of Exposure Mode:**
- Doesn't tell you what will actually be damaged
- Includes assets that might only have minor flooding
- Doesn't account for different vulnerability levels

### Mode 2: Vulnerability (Vul) — What's Actually Susceptible?

**Question Answered:** *"Of the exposed assets, which ones will actually be damaged?"*

**Key Insight:** Not all flooding causes damage. A building in 10cm of water might be fine. A building in 2m of water will be destroyed.

**Damage Thresholds:**

We apply depth thresholds to distinguish "exposed" from "vulnerable":

| Asset Type | Damage Threshold | Rationale |
|------------|------------------|------------|
| Agriculture | 15cm (0.15m) | Crops damaged when submerged beyond this depth |
| Buildings | 30cm (0.3m) | Structural damage begins, requires repair |
| Roads | 50cm (0.5m) | Impassable to vehicles, requires repair |
| Railways | 30cm (0.3m) | Track damage, safety concerns |
| Electric Lines | 30cm (0.3m) | Equipment damage, safety hazard |
| Hospitals | 15cm (0.15m) | Operations disrupted, equipment at risk |
| Schools | 30cm (0.3m) | Building damage, education disrupted |
| BHU | 15cm (0.15m) | Operations disrupted, equipment at risk |
| Telecom Towers | 30cm (0.3m) | Equipment damage, service disruption |

**How We Calculate It:**

```
1. Start with exposed assets (from Exposure mode)
2. Check flood depth at each asset location
3. Count only assets where depth > damage threshold
4. This is the "vulnerable" count
```

**Example Calculation — Buildings:**

```
District Dadu, 25-year flood, Breaches maintenance:

1. Total buildings: 50,000
2. Buildings in flood zone (depth > 0): 10,000 (Exposure)
3. Buildings with depth > 0.3m: 7,000 (Vulnerability)

Exposure = 10,000 buildings (20%)
Vulnerability = 7,000 buildings (14%)

Difference: 3,000 buildings are exposed but not vulnerable
(shallow flooding, may have minor damage only)
```

**What Vulnerability Tells You:**
- More realistic assessment of impact
- Focuses on assets that will actually need repair/replacement
- Accounts for different damage thresholds by asset type

**Limitations of Vulnerability Mode:**
- Still binary (damaged or not damaged)
- Doesn't quantify the degree of damage
- Doesn't provide monetary values

### Mode 3: Economic Damage (Dmg) — What's the Monetary Loss?

**Question Answered:** *"What is the total value of losses in US Dollars?"*

**Key Advance:** This mode uses **depth-damage curves** to convert physical damage into monetary loss.

## Depth-Damage Curves: The Foundation of Damage Assessment

### What Are Depth-Damage Curves?

A **depth-damage curve** is a mathematical function that shows the percentage of an asset's value that is lost at different flood depths.

**Visual Example — Kacha House:**

```
Damage %
  100% |████████████████████████████████████████████
       |
   80% |████████████████████████████████████
       |
   60% |███████████████████████████████  ← 56% at 1m
       |
   40% |████████████████████
       |
   20% |███████████
       |
    0% |________________________________________
       0m   0.5m  1.0m  1.5m  2.0m  2.5m  3.0m+
                 Flood Depth
```

### Why Different Curves for Different Assets?

**Different assets respond differently to flooding:**

**Example: Kacha vs. Pakka House**

| Flood Depth | Kacha Damage | Pakka Damage | Why the Difference? |
|-------------|--------------|--------------|---------------------|
| 0.5m | 35% | 15% | Mud walls absorb water, brick walls resist |
| 1.0m | 56% | 44% | Structural failure thresholds |
| 2.0m | 85% | 70% | Kacha collapses, Pakka severely damaged |
| 3.0m+ | 100% | 90% | Kacha destroyed, Pakka may survive |

**Key Point:** Construction quality dramatically affects vulnerability. This is why we distinguish kacha (mud) from pakka (brick) from high-rise (concrete) construction.

### Our 11 Asset Types and Their Damage Curves

#### Agriculture (Cropped Area)

**Unit:** Hectares (ha)
**Valuation:** Regional crop prices per hectare
**Damage Mechanism:** Crop necrosis (plants die when submerged)

**Depth-Damage Relationship:**
- **0-15cm:** Minimal damage (0-10%)
- **15-50cm:** Moderate damage (20-50%) — depends on crop type
- **50-100cm:** High damage (60-80%)
- **100cm+:** Complete loss (100%) — crops cannot survive

**Critical Factor: Duration**
- 6 hours: May recover if depth <50cm
- 24 hours: Significant damage even at shallow depths
- 48+ hours: Complete loss regardless of depth

**Example Calculation:**
```
1. Farm location: Flooded to 80cm depth for 36 hours
2. Crop type: Cotton (moderate tolerance)
3. Base value: $1,000 per hectare
4. Damage from curve: 75% at 80cm
5. Duration adjustment: ×1.1 for >24h
6. Final damage: 75% × 1.1 = 82.5%
7. Loss per hectare: $1,000 × 0.825 = $825
```

#### Buildings: Three Types

**Why Three Types?**
Construction quality in Sindh varies dramatically:
- **Kacha** — Mud/unburnt brick, poorest households
- **Pakka** — Burnt brick, middle-class households
- **High-Rise** — Multi-story concrete, wealthier households

**Type 1: Kacha Buildings (buildLow56)**

**Characteristics:**
- Mud walls, thatched or tin roof
- Poor foundation, no reinforcement
- Typically occupied by poorest households

**Depth-Damage Curve:**
| Depth | Damage % | Description |
|-------|----------|-------------|
| 0.3m | 20% | Floors damaged, walls repairable |
| 0.5m | 35% | Significant wall damage |
| 1.0m | 56% | Major structural damage — this is where "56" comes from |
| 1.5m | 75% | Near collapse |
| 2.0m+ | 100% | Complete destruction |

**Asset Value:** $5,000-10,000 per building (regional average)

**Type 2: Pakka Buildings (buildLow44)**

**Characteristics:**
- Burnt brick walls, concrete roof
- Better foundation, some reinforcement
- Typically occupied by middle-class households

**Depth-Damage Curve:**
| Depth | Damage % | Description |
|-------|----------|-------------|
| 0.3m | 10% | Floors damaged, minimal structural issues |
| 0.5m | 20% | Some wall damage, repairable |
| 1.0m | 44% | Significant damage — this is where "44" comes from |
| 1.5m | 60% | Major structural damage |
| 2.0m+ | 90% | Severe damage, may not be repairable |

**Asset Value:** $15,000-30,000 per building (regional average)

**Type 3: High-Rise Buildings (buildHigh)**

**Characteristics:**
- Multi-story reinforced concrete
- Professional construction
- Typically occupied by wealthier households/commercial

**Depth-Damage Curve:**
| Depth | Damage % | Description |
|-------|----------|-------------|
| 0.3m | 5% | Ground floor damage only |
| 0.5m | 10% | Ground floor + contents |
| 1.0m | 15% | Ground floor significant, upper floors OK |
| 1.5m | 25% | Ground floor severe, structural OK |
| 2.0m+ | 40% | Major damage but building remains standing |

**Asset Value:** $100,000+ per building (regional average)

**Why This Matters for Equity:**
- Poor households in kacha houses suffer 56% damage at 1m depth
- Wealthy households in high-rise buildings suffer only 15% at 1m depth
- Same flood event, very different impacts
- Hotspot analysis captures this equity dimension

#### Infrastructure: Four Types

**Type 1: Roads**

**Unit:** Kilometers (km)
**Valuation:** Construction cost per km (varies by road type)

**Damage Mechanism:**
- **Surface erosion** at shallow depths
- **Base course failure** at moderate depths
- **Complete washout** at high depths

**Depth-Damage Curve:**
| Depth | Damage % | Description |
|-------|----------|-------------|
| 0.3m | 10% | Surface damage, gravel roads affected |
| 0.5m | 25% | Pavement damage, requires resurfacing |
| 1.0m | 50% | Base course damage, partial reconstruction |
| 1.5m | 75% | Major damage, reconstruction needed |
| 2.0m+ | 100% | Complete washout, full reconstruction |

**Asset Value:** $100,000-500,000 per km (depending on road class)

**Type 2: Railways**

**Unit:** Kilometers (km)
**Valuation:** Construction cost per km

**Damage Mechanism:**
- **Track buckling** due to scour
- **Embankment erosion** around tracks
- **Structure damage** to bridges, culverts

**Depth-Damage Curve:**
| Depth | Damage % | Description |
|-------|----------|-------------|
| 0.3m | 15% | Track damage, some embankment erosion |
| 0.5m | 30% | Significant track damage |
| 1.0m | 60% | Major damage, requires reconstruction |
| 1.5m+ | 100% | Complete destruction |

**Asset Value:** $500,000-1M per km

**Type 3: Electric Lines**

**Unit:** Kilometers (km)
**Valuation:** Construction cost per km

**Damage Mechanism:**
- **Equipment damage** at substations, poles
- **Short circuits** due to water contact
- **Structure failure** of poles and towers

**Depth-Damage Curve:**
| Depth | Damage % | Description |
|-------|----------|-------------|
| 0.3m | 20% | Equipment damage, service interruption |
| 0.5m | 40% | Pole damage, significant repair needed |
| 1.0m | 70% | Major damage, reconstruction |
| 1.5m+ | 100% | Complete replacement needed |

**Asset Value:** $50,000-150,000 per km

**Type 4: Telecom Towers**

**Unit:** Count of towers
**Valuation:** Construction cost per tower

**Damage Mechanism:**
- **Equipment damage** at base of tower
- **Structure failure** due to foundation scour
- **Service interruption** during flood

**Depth-Damage Curve:**
| Depth | Damage % | Description |
|-------|----------|-------------|
| 0.5m | 25% | Equipment damage, repairable |
| 1.0m | 50% | Foundation damage, major repair |
| 1.5m | 75% | Structure compromised, may need replacement |
| 2.0m+ | 100% | Tower collapse, complete replacement |

**Asset Value:** $50,000-100,000 per tower

#### Critical Facilities: Three Types

**Type 1: Hospitals**

**Unit:** Count of facilities
**Valuation:** Replacement cost per facility

**Depth-Damage Curve:**
| Depth | Damage % | Description |
|-------|----------|-------------|
| 0.3m | 30% | Ground floor equipment, operations disrupted |
| 0.5m | 50% | Significant damage, evacuation needed |
| 1.0m | 80% | Major damage, may not be recoverable |
| 1.5m+ | 100% | Complete loss, replacement needed |

**Asset Value:** $5M-20M per hospital

**Additional Impact:**
- Loss of emergency services during flood
- Cost of patient evacuation
- Long-term healthcare disruption

**Type 2: Basic Health Units (BHU)**

**Unit:** Count of facilities
**Valuation:** Replacement cost per facility

**Depth-Damage Curve:**
| Depth | Damage % | Description |
|-------|----------|-------------|
| 0.3m | 40% | Equipment damage, operations disrupted |
| 0.5m | 70% | Major damage, likely total loss |
| 1.0m+ | 100% | Complete loss |

**Asset Value:** $50,000-200,000 per BHU

**Why BHUs Are More Vulnerable:**
- Smaller structures, less resilient
- Often in rural areas with poorer construction
- Limited elevation above ground
- Critical for rural healthcare access

**Type 3: Schools**

**Unit:** Count of facilities
**Valuation:** Replacement cost per facility

**Depth-Damage Curve:**
| Depth | Damage % | Description |
|-------|----------|-------------|
| 0.3m | 25% | Ground floor damage, contents loss |
| 0.5m | 45% | Significant damage, repairable |
| 1.0m | 70% | Major damage, reconstruction likely |
| 1.5m+ | 100% | Complete loss |

**Asset Value:** $200,000-1M per school

**Additional Impact:**
- Education disruption during flood
- May be used as emergency shelters
- Community focal point

### Sources for Depth-Damage Curves

Our depth-damage curves are based on international research, adapted to local conditions:

**Primary Sources:**

1. **Defra (UK Department for Environment, Food & Rural Affairs)**
   - Report: "Flood Risks to People – Phase 2" (FD2321)
   - Year: 2006
   - Focus: Depth-fatality and depth-damage relationships
   - Used for: Building and infrastructure damage functions

2. **USBR (United States Bureau of Reclamation)**
   - Methodology: RCEM (Risk-Cost Evaluation Model)
   - Year: 2015
   - Focus: Economic risk assessment for flood projects
   - Used for: Agricultural and infrastructure damage functions

3. **Flood Hazard Research Centre (UK)**
   - Authors: Penning-Rowsell, E. et al.
   - Report: "The Depth-Damage Curve Manual"
   - Year: Various editions
   - Used for: Residential building damage functions

4. **Local Adaptation**
   - Calibration to Sindh construction types
   - Adjustment for local construction costs
   - Validation against 2022 flood damage reports

**Why International Sources?**
- Pakistan lacks comprehensive depth-damage research
- International methods are scientifically validated
- Curves are adapted to local conditions
- Better to use proven international methods than develop untested local curves

## How Damage Is Calculated: The Complete Process

### Step 1: Asset Data Preparation

**Data Collection:**

We gather geospatial data for all assets in the 7 districts:

| Asset Type | Source | Format | Accuracy |
|------------|--------|--------|----------|
| Buildings | Remote sensing (satellite) | Point features | ~90% |
| Roads | Survey data, OSM | Line features | ~95% |
| Railways | Railway survey | Line features | ~95% |
| Electric Grid | Utility company data | Line features | ~85% |
| Agriculture | Land use classification | Polygon features | ~85% |
| Hospitals | Health department | Point features | 100% |
| BHU | Health department | Point features | 100% |
| Schools | Education department | Point features | 100% |
| Telecom Towers | Telecom data | Point features | ~80% |

**Data Processing:**
1. Convert all data to UTM Zone 42N projection
2. Ensure consistent coordinate system
3. Validate topology (no gaps, overlaps)
4. Populate PostgreSQL/PostGIS database

**Database Structure:**

For each asset type, we store:
```sql
CREATE TABLE exposure_buildings AS (
    id SERIAL PRIMARY KEY,
    geom GEOMETRY(Point, 32642),  -- UTM Zone 42N
    district VARCHAR(50),
    building_type VARCHAR(20),  -- 'kacha', 'pakka', 'highrise'
    value_usd NUMERIC,
    -- Additional attributes
);

CREATE TABLE exposure_roads AS (
    id SERIAL PRIMARY KEY,
    geom GEOMETRY(LineString, 32642),
    district VARCHAR(50),
    road_class VARCHAR(20),  -- 'primary', 'secondary', 'tertiary'
    value_usd_per_km NUMERIC,
    -- Additional attributes
);
```

### Step 2: Depth Assignment

For each asset, we determine the flood depth at its location:

**Process:**
```
For each building:
    1. Get its coordinates (x, y)
    2. Query the flood depth raster at (x, y)
    3. Extract the depth value
    4. Store depth with the building record
```

**SQL Example:**
```sql
-- Add depth to buildings
UPDATE exposure_buildings b
SET depth = r.depth
FROM flood_raster r
WHERE ST_Intersects(b.geom, r.geom);
```

**Result:** Each building now has its flood depth

### Step 3: Depth Bin Classification

We classify each asset into a depth bin:

**Depth Bins:**
| Bin | Range | Min Depth | Max Depth |
|-----|-------|-----------|-----------|
| 1 | 15-100cm | 0.15m | 1.0m |
| 2 | 1-2m | 1.0m | 2.0m |
| 3 | 2-3m | 2.0m | 3.0m |
| 4 | 3-4m | 3.0m | 4.0m |
| 5 | 4-5m | 4.0m | 5.0m |
| 6 | above5m | 5.0m | No maximum |

**Classification Logic:**
```sql
UPDATE exposure_buildings
SET depth_bin = CASE
    WHEN depth < 1.0 THEN '15-100cm'
    WHEN depth < 2.0 THEN '1-2m'
    WHEN depth < 3.0 THEN '2-3m'
    WHEN depth < 4.0 THEN '3-4m'
    WHEN depth < 5.0 THEN '4-5m'
    ELSE 'above5m'
END;
```

### Step 4: Damage Function Application

For each asset, we apply the appropriate damage function:

**Example: Kacha Building at 1.5m Depth**

```
1. Building type: kacha (buildLow56)
2. Flood depth: 1.5m
3. Look up damage curve for kacha buildings
4. At 1.5m: damage = 75%
5. Building value: $7,500
6. Damage = $7,500 × 0.75 = $5,625
```

**Implementation:**
```sql
UPDATE exposure_buildings b
SET damage = b.value_usd ×
    (damage_percentage FROM damage_curves
     WHERE building_type = b.building_type
     AND depth >= min_depth
     AND depth < max_depth);
```

### Step 5: Aggregation

We aggregate damage at multiple levels:

**By District:**
```sql
SELECT district, SUM(damage)
FROM exposure_buildings
WHERE depth > 0
GROUP BY district;
```

**By Scenario:**
```sql
SELECT scenario_id, district, asset_type, SUM(damage)
FROM impact_results
WHERE scenario_id = '25_present_breaches'
GROUP BY district, asset_type;
```

**By Depth Bin:**
```sql
SELECT depth_bin, COUNT(*), SUM(damage)
FROM exposure_buildings
WHERE depth > 0
GROUP BY depth_bin;
```

**By Asset Type:**
```sql
SELECT asset_type, SUM(damage)
FROM impact_results
GROUP BY asset_type;
```

### Step 6: Results Storage

**Final Results Structure:**

For each scenario (42 total), we have:
```json
{
  "scenario_id": "25_present_breaches",
  "return_period": 25,
  "climate": "present",
  "maintenance": "breaches",
  "districts": {
    "Dadu": {
      "Exp": {
        "crop": 15000,  -- hectares
        "buildLow56": 45000,  -- sqm
        "buildLow44": 32000,
        "buildHigh": 12000,
        ...
      },
      "Vul": {
        "crop": 12000,  -- hectares vulnerable
        "buildLow56": 38000,
        ...
      },
      "Dmg": {
        "crop": 45000000,  -- USD
        "buildLow56": 28000000,
        ...
      }
    },
    "Jacobabad": { ... },
    ...
  }
}
```

## Understanding Risk Curves

### What Is a Risk Curve?

A **risk curve** (also called a **damage-frequency curve**) shows how economic damage varies with flood return period.

**Visual Representation:**

```
Damage ($)
    ^
    |
$1B |                                          ●
    |                                     ●
$500M|                                 ●
    |                            ●
$250M|                       ●
    |                  ●
$100M|            ●
    |       ●
 $50M|  ●
    |__________________________________________> Return Period (years)
        2.3    5    10    25    50   100   500
```

**Key Characteristics:**

1. **Upward Sloping** — Larger return periods cause more damage
2. **Non-Linear** — Damage increases faster than return period
3. **Convex** — Steep slope means damage accelerates for large events

### How to Read a Risk Curve

**Example: Dadu District, Present Climate, Breaches Maintenance**

| Return Period | Probability | Damage | Explanation |
|---------------|-------------|--------|-------------|
| 2.3 years | 43% | $8M | Frequent event, manageable damage |
| 5 years | 20% | $20M | Occasional event, moderate damage |
| 10 years | 10% | $45M | Significant damage |
| 25 years | 4% | $120M | Major damage, exceeds typical capacity |
| 50 years | 2% | $250M | Severe damage |
| 100 years | 1% | $450M | Extreme damage |
| 500 years | 0.2% | $1.2B | Catastrophic damage |

**Plot These Points → Risk Curve**

### What the Curve Shape Tells You

**Steep Curve (Accelerating Damage):**
```
Damage
    ^
    |                                 ___● $1B
    |                            ___●
$500M|                       ___●
    |                  ___●
$250M|            ___●
    |       ___●
 $50M|  ●
    |__________________________> Return Period
```

**What This Means:**
- Damage increases rapidly for larger events
- Breaches or cascading failures
- Infrastructure overwhelmed
- **Implication:** Large events are disproportionately damaging
- **Action:** Consider investing in capacity for extreme events

**Gentle Curve (Linear Damage):**
```
Damage
    |
    |                                        ●
    |                                    ●
    |                                ●
    |                            ●
    |                        ●
    |                    ●
    |                ●
    |            ●
    |        ●
    |    ●
    |●
    |__________________________> Return Period
```

**What This Means:**
- Damage increases proportionally with return period
- No threshold effects or cascading failures
- Infrastructure performs consistently
- **Implication:** Risk is predictable and manageable
- **Action:** Standard mitigation approaches

### Comparing Risk Curves

**Comparison 1: Maintenance Impact**

```
Damage ($)
    ^
$1B |                     Breaches: ●━━━━━━●
    |                  ●
$500M|              ●━━━━━━━━━━━━━━━● Reduced Capacity
    |          ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━● Perfect
$250M|      ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━●
    |  ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━●
    |______________________________________________> Return Period
```

**What This Shows:**
- Breaches cause 3-4× more damage than perfect maintenance
- Reduced capacity is intermediate
- **Implication:** Infrastructure maintenance has high value
- **Action:** Invest in embankment maintenance and reinforcement

**Comparison 2: Climate Impact**

```
Damage ($)
    ^
$1B |                                             ● Future
    |                                        ●━━━━━●
$500M|                                  ●━━━━━●
    |                             ●━━━━━● Present
$250M|                       ●━━━━━●
    |                  ●━━━━━●
    |            ●━━━━━●
    |      ●━━━━━●
    |●━━━━━●
    |______________________________________________> Return Period
```

**What This Shows:**
- Future climate causes 1.5-2× more damage across all return periods
- Climate change increases risk at all levels
- **Implication:** Future planning must account for climate change
- **Action:** Design infrastructure for future conditions, not present

## Expected Annual Damage (EAD): The "Price of Risk"

### What Is Expected Annual Damage?

**Expected Annual Damage (EAD)** is the long-term average economic loss you should expect **every single year** from flooding.

**Critical Concept:** EAD is NOT the damage from a single flood. It's the weighted average across ALL possible floods, from frequent 2-year events to rare 500-year events.

**Why This Matters:**

EAD answers the question: *"If we could experience every possible flood over a very long time period, what would be the average annual loss?"*

This is valuable because:
1. It accounts for the full spectrum of flood risk
2. It weights frequent events appropriately (they happen more often)
3. It provides a single number for comparison and decision-making
4. It can be used for cost-benefit analysis

### How EAD Is Calculated: Trapezoidal Integration

**The Mathematics:**

EAD is calculated by integrating the area under the risk curve using **trapezoidal integration**:

```
EAD = Σ 0.5 × (Dᵢ + Dᵢ₊₁) × |1/RPᵢ - 1/RPᵢ₊₁|

Where:
  Dᵢ = Damage at return period RPᵢ
  RPᵢ = Return period in years
  Σ = Sum across all adjacent pairs of return periods
```

**Why Trapezoidal Integration?**

1. **Trapezoidal** approximates the area under the curve using trapezoids (more accurate than rectangles)
2. **Integration** sums the area across all return periods
3. **|1/RPᵢ - 1/RPᵢ₊₁|** is the probability difference between adjacent return periods

**Visual Explanation:**

```
Damage
    ^
    |                               ● (500-year, $1.2B)
    |                          ●
    |                     ●
    |                ●
    |           ●
    |      ●
    | ● (2.3-year, $8M)
    |
    |___●___●___●___●___●___●___●___ Probability
    0.43  0.2  0.1 0.04 0.02 0.01 0.002

Each trapezoid represents the contribution of one
return period interval to EAD.
```

### Step-by-Step Calculation Example

**Scenario:** Dadu District, Present Climate, Breaches Maintenance

**Data:**

| Return Period | Damage | Annual Probability (1/RP) |
|---------------|--------|---------------------------|
| 2.3 years | $8M | 0.435 (43.5%) |
| 5 years | $20M | 0.200 (20.0%) |
| 10 years | $45M | 0.100 (10.0%) |
| 25 years | $120M | 0.040 (4.0%) |
| 50 years | $250M | 0.020 (2.0%) |
| 100 years | $450M | 0.010 (1.0%) |
| 500 years | $1,200M | 0.002 (0.2%) |

**Calculation:**

**Interval 1: 2.3-year to 5-year**
```
Area = 0.5 × ($8M + $20M) × |0.435 - 0.200|
     = 0.5 × $28M × 0.235
     = $3.29M
```

**Interval 2: 5-year to 10-year**
```
Area = 0.5 × ($20M + $45M) × |0.200 - 0.100|
     = 0.5 × $65M × 0.100
     = $3.25M
```

**Interval 3: 10-year to 25-year**
```
Area = 0.5 × ($45M + $120M) × |0.100 - 0.040|
     = 0.5 × $165M × 0.060
     = $4.95M
```

**Interval 4: 25-year to 50-year**
```
Area = 0.5 × ($120M + $250M) × |0.040 - 0.020|
     = 0.5 × $370M × 0.020
     = $3.70M
```

**Interval 5: 50-year to 100-year**
```
Area = 0.5 × ($250M + $450M) × |0.020 - 0.010|
     = 0.5 × $700M × 0.010
     = $3.50M
```

**Interval 6: 100-year to 500-year**
```
Area = 0.5 × ($450M + $1,200M) × |0.010 - 0.002|
     = 0.5 × $1,650M × 0.008
     = $6.60M
```

**Total EAD:**
```
EAD = $3.29M + $3.25M + $4.95M + $3.70M + $3.50M + $6.60M
    = $25.29M per year
```

**Interpretation:**
Dadu district should expect an average of **$25.3 million per year** in flood damage under present climate with breaches maintenance.

### What EAD Tells You: Decision Rules

**EAD as Investment Guidance:**

**Rule of Thumb:** If a mitigation project costs less than 20-30 years of accumulated EAD, it's economically justified.

**Example:**
- Dadu EAD = $25M/year under breaches scenario
- Proposed embankment reinforcement = $300M
- Payback period = $300M / $25M = 12 years
- **Decision:** Project is economically justified (12 years < 20-year threshold)

**EAD for Comparison:**

| District | EAD (Present/Breaches) | EAD (Present/Perfect) | Breach Impact |
|----------|------------------------|----------------------|---------------|
| Dadu | $25.3M | $8.5M | 3.0× |
| Jacobabad | $18.2M | $6.1M | 3.0× |
| Larkana | $12.8M | $4.9M | 2.6× |
| Shikarpur | $8.4M | $3.2M | 2.6× |

**What This Shows:**
- Dadu has highest economic risk — prioritize investment
- Breaches triple risk — infrastructure maintenance is valuable
- Perfect maintenance EAD shows what's achievable

**EAD for Climate Impact:**

| District | EAD (Present) | EAD (Future) | Climate Impact |
|----------|---------------|--------------|----------------|
| Dadu | $25.3M | $38.5M | +52% |
| Jacobabad | $18.2M | $27.8M | +53% |
| Larkana | $12.8M | $19.5M | +52% |

**What This Shows:**
- Climate change increases EAD by ~50%
- Future planning must account for this increase
- Adaptation investments can be justified by avoided future damage

### EAD by Asset Type

We calculate EAD separately for each asset type:

**Example: Dadu District, Present/Breaches**

| Asset Type | EAD ($M/year) | % of Total | Interpretation |
|------------|---------------|------------|----------------|
| Agriculture | $8.5M | 34% | Largest contributor |
| Kacha Buildings | $6.2M | 25% | Poor households disproportionately affected |
| Pakka Buildings | $3.8M | 15% | Middle-class impact |
| High-Rise | $0.8M | 3% | Wealthy households less affected |
| Roads | $2.1M | 8% | Transportation disruption |
| Railways | $0.9M | 4% | Rail transport |
| Electric | $1.2M | 5% | Power infrastructure |
| Hospitals | $0.4M | 2% | Healthcare facilities |
| BHU | $0.3M | 1% | Primary healthcare |
| Schools | $0.6M | 2% | Education facilities |
| Telecom | $0.6M | 2% | Communication |
| **TOTAL** | **$25.4M** | **100%** | |

**What This Breakdown Tells You:**

1. **Agriculture is the largest risk** — 34% of total
   - Implication: Agricultural mitigation is high priority
   - Action: Crop insurance, flood-resistant crops, drainage

2. **Kacha buildings dominate housing damage** — 25% of housing damage
   - Implication: Poor households bear disproportionate risk
   - Action: Housing improvement programs, elevation, relocation

3. **Infrastructure is significant** — 21% combined
   - Implication: Service disruption compounds flood impacts
   - Action: Critical infrastructure protection, redundancy

---

# POPULATION RISK & CASUALTY ESTIMATION

## Overview: Why Population Risk Matters

Economic damage measures financial loss. **Population risk measures human loss** — fatalities and injuries.

This is critical for:
- **Emergency preparedness** — Where to focus evacuation efforts
- **Health system planning** — Hospital capacity, medical supplies
- **Early warning systems** — Which areas need most warning
- **Mortality reduction** — Where interventions will save most lives

## The Data We Use

### Primary Data Sources

**1. Population Distribution**

| Source | Year | Resolution | Data |
|--------|------|------------|------|
| Pakistan Census | 2017 | District-level | Total population, households |
| WorldPop | 2020 | 100m grid | Population distribution |
| Settlements | Survey | Point locations | Village/settlement locations |

**Processing Steps:**
1. Start with Census 2017 district populations
2. Apply growth rates to project to 2026
3. Distribute population to settlement points using density weighting
4. Create population-weighted settlement points

**2. Flood Hazard Data**

| Source | Scenarios | Parameters | Resolution |
|--------|-----------|------------|------------|
| Hydraulic Models | 84 | Depth, velocity, duration, V×h | 10m grid |

**Processing Steps:**
1. For each scenario, extract hazard rasters
2. For each settlement point, extract hazard values
3. Assign each settlement to hazard zones

**3. 2022 Flood Data (Calibration)**

| Source | Data | Use |
|--------|------|-----|
| PDMA Sindh | Affected population: 14.5M | Model validation |
| PDMA Sindh | Fatalities: 1,739 | Calibration |
| NDMA | Damage reports | Model verification |

**Why Calibration Matters:**
International mortality factors may not apply locally. We calibrate to actual Sindh experience.

## How Casualties Are Estimated: The Complete Methodology

### The Mortality Factor Matrix

**Foundation:** International peer-reviewed research on flood fatalities

**Primary Sources:**

1. **Jonkman et al. (2008)** — "Loss of life estimation in flood risk assessment"
   - Published: Journal of Flood Risk Management
   - Focus: Depth × velocity mortality factors
   - Data: Historical flood fatalities worldwide

2. **USBR (2015)** — "Reclamation Consequence Estimating Methodology (RCEM)"
   - Published: US Bureau of Reclamation
   - Focus: Dam failure and flood fatality estimation
   - Data: US flood events

3. **Defra (2006)** — "Flood Risks to People – Phase 2" (FD2321)
   - Published: UK Department for Environment
   - Focus: Flood danger to people
   - Data: UK flood events and experiments

**The Matrix Structure:**

Research shows mortality depends on **depth and velocity combined**. We use a matrix:

| Depth | Velocity | V×h | Mortality Factor | Risk Level |
|-------|----------|-----|------------------|------------|
| <1m | <0.5 m/s | <0.5 | 0.01% | Minimal |
| <1m | 0.5-1.5 m/s | 0.5-1.5 | 0.05% | Low |
| <1m | >1.5 m/s | >1.5 | 0.1% | Low-Moderate |
| 1-2m | <0.5 m/s | 0.5-1.0 | 0.1% | Low-Moderate |
| 1-2m | 0.5-1.5 m/s | 1.0-3.0 | 0.5% | Moderate |
| 1-2m | >1.5 m/s | >3.0 | 1.0% | High |
| 2-3m | <0.5 m/s | 1.0-1.5 | 0.5% | Moderate |
| 2-3m | 0.5-1.5 m/s | 1.5-4.5 | 2.5% | High |
| 2-3m | >1.5 m/s | >4.5 | 5.0% | Very High |
| >3m | Any | >3.0 | 5.0% | Very High |

**Special Case:** V×h > 1.5 m²/s — Mortality factor = 5-10% regardless of depth

**Why This Matrix?**

Human stability in flowing water depends on both depth and velocity:

- **Shallow + Slow** (0.5m × 0.5 m/s = 0.25 m²/s): People can stand and walk
- **Shallow + Fast** (0.5m × 3 m/s = 1.5 m²/s): Difficult but possible to stand
- **Deep + Slow** (2m × 0.5 m/s = 1.0 m²/s): Swimming possible
- **Deep + Fast** (2m × 2 m/s = 4 m²/s): Impossible to stand, very dangerous

### The Three Estimate Levels

We provide **three fatality estimates** for each scenario:

**1. Low Estimate (Optimistic)**
- Assumes: Effective warning, good evacuation
- Mortality factors: Lower end of ranges
- Use case: Best-case planning

**2. Moderate Estimate (Best Estimate)**
- Assumes: Typical warning and evacuation
- Mortality factors: Middle of ranges
- Use case: Most likely outcome

**3. High Estimate (Pessimistic)**
- Assumes: Poor warning, limited evacuation
- Mortality factors: Upper end of ranges
- Use case: Worst-case planning

**Why Three Estimates?**

Flood mortality is highly uncertain. Providing a range acknowledges this uncertainty and allows for robust planning.

### The Estimation Process: Step-by-Step

#### Step 1: Classify Population by Hazard Zone

For each settlement point, we determine its hazard zone:

```
For each settlement:
    1. Get flood depth at settlement location
    2. Get flood velocity at settlement location
    3. Calculate V×h = depth × velocity
    4. Assign to hazard zone from matrix
    5. Assign mortality factor based on zone
```

**Example:**

Settlement "Village A" in Dadu district:
- Flood depth: 1.8m
- Flood velocity: 1.2 m/s
- V×h = 1.8 × 1.2 = 2.16 m²/s

**Zone Assignment:**
- Depth: 1-2m
- Velocity: 0.5-1.5 m/s
- V×h: 2.16 m²/s

**Mortality Factor (Moderate):**
- From matrix: 0.5% (for 1-2m, 0.5-1.5 m/s)
- But V×h > 1.5 m²/s → Use special case: 5%
- **Final factor: 5%**

#### Step 2: Apply Mortality Factors

**Basic Calculation:**
```
Fatalities = Population × Mortality Factor × Calibration Factor
```

**The Calibration Factor:**

International mortality factors don't match Sindh experience. We calibrate to the 2022 flood:

**2022 Benchmark:**
- Affected population: 14.5 million
- Actual fatalities: 1,739
- Observed fatality rate: 1,739 / 14,500,000 = 0.012%

**Our Calibration:**
- We apply a **calibration multiplier of 0.05** to our base mortality factors
- This adjusts international factors to match Sindh's observed fatality rate

**Example Calculation:**

Village A with 5,000 people:
1. Hazard zone mortality factor (moderate): 5%
2. Calibration factor: 0.05
3. Fatalities = 5,000 × 0.05 × 0.05 = 12.5

**Rounding:**
- Low estimate: 12.5 × 0.5 = 6
- Moderate estimate: 12.5
- High estimate: 12.5 × 2 = 25

#### Step 3: Apply Duration Modifiers

**Duration affects mortality:**

- **Flash floods** (<6 hours): Higher mortality due to surprise, less warning time
  - Multiplier: ×1.5

- **Normal floods** (6-24 hours): Baseline mortality
  - Multiplier: ×1.0

- **Prolonged floods** (>24 hours): Higher mortality due to exposure, lack of access
  - Multiplier: ×1.2

**Example:**

Village A flood duration: 4 hours (flash flood)
- Base fatalities (moderate): 12.5
- Duration modifier: ×1.5
- Adjusted fatalities: 12.5 × 1.5 = 18.75 ≈ 19

#### Step 4: Calculate Injuries

**International Convention:** Injuries ≈ 3 × Fatalities

```
Injuries = Fatalities × 3
```

**Example:**
- Fatalities: 19
- Injuries: 19 × 3 = 57

**Injury Severity:**
- **Minor injuries:** 50% — Cuts, bruises, sprains
- **Moderate injuries:** 30% — Broken bones, lacerations
- **Severe injuries:** 20% — Head trauma, near-drowning

#### Step 5: Aggregate to District Level

**Summing All Settlements:**

For Dadu district, 25-year flood, breaches maintenance:
- 435 settlements affected
- Total affected population: 450,000
- Sum fatalities from all settlements: 89 (moderate estimate)
- Sum injuries: 267

### Expected Annual Fatalities (EAF)

**Same Concept as EAD, Applied to Fatalities:**

EAF integrates fatality estimates across all return periods using trapezoidal integration.

**Calculation:**
```
EAF = Σ 0.5 × (Fᵢ + Fᵢ₊₁) × |1/RPᵢ - 1/RPᵢ₊₁|

Where Fᵢ = Fatalities at return period RPᵢ
```

**Example: Dadu District**

| Return Period | Fatalities (Moderate) | Probability |
|---------------|------------------------|-------------|
| 2.3 years | 12 | 0.435 |
| 5 years | 25 | 0.200 |
| 10 years | 45 | 0.100 |
| 25 years | 89 | 0.040 |
| 50 years | 150 | 0.020 |
| 100 years | 220 | 0.010 |
| 500 years | 450 | 0.002 |

**EAF Calculation:**

Using trapezoidal integration (same as EAD):
```
EAF ≈ 8-12 fatalities per year (for Dadu, present/breaches)
```

**Interpretation:**
On average, Dadu district should expect **8-12 flood-related fatalities per year** when considering the full spectrum of flood probabilities.

**Why EAF Matters:**

- **Districts with low EAF** — Flood fatalities are rare but catastrophic when they occur
- **Districts with high EAF** — Frequent smaller floods cause cumulative fatalities

Both are important, but require different strategies:
- **Low EAD, High EAF:** Focus on emergency response, warning systems
- **High EAD, Low EAF:** Focus on mitigation infrastructure

## What the Results Mean

### Interpreting Population Risk Outputs

**Output for a Scenario:**

```json
{
  "scenario": "25_present_breaches",
  "total_affected_population": 450000,
  "affected_percentage": 32.1,
  "casualty_estimates": {
    "fatalities": {
      "low": 45,
      "moderate": 89,
      "high": 178
    },
    "injuries": {
      "low": 135,
      "moderate": 267,
      "high": 534
    }
  },
  "depth_distribution": {
    "15-100cm": 150000,
    "1-2m": 180000,
    "2-3m": 80000,
    "3-4m": 30000,
    "4-5m": 8000,
    "above5m": 2000
  }
}
```

**How to Interpret:**

1. **450,000 affected** — Nearly one-third of district population in flood zone
2. **89 moderate fatalities** — Most likely outcome
3. **Range 45-178** — Significant uncertainty, plan for both
4. **180,000 in 1-2m depth** — Highest risk zone (dangerous for people)
5. **10,000 in >3m depth** — Extreme risk zone, evacuation critical

### Using Results for Planning

**Emergency Response Planning:**

| Population Risk Metric | Use For Planning |
|------------------------|------------------|
| Total affected population | Shelter capacity, food supplies |
| Fatalities (moderate) | Mortuary capacity, body bags |
| Injuries (moderate) | Hospital capacity, medical supplies |
| Population in >1m depth | Evacuation zones |
| Population in V×h >1.5 | High-priority evacuation |

**Example:**

For Dadu, 25-year flood:
- Affected: 450,000 → Need shelters for 150,000 (assume 1/3)
- Fatalities: 89 → Prepare mortuary for 100
- Injuries: 267 → Prepare hospital beds for 300
- >1m depth: 120,000 → Evacuation zone defined

**Early Warning System Planning:**

Areas with high V×h exceedance need:
- More immediate warnings (minutes, not hours)
- Robust evacuation routes
- Regular drills and training
- Community-based warning systems

---

# FLOOD RISK HOTSPOTS: PRIORITY IDENTIFICATION

## What Hotspots Are and Why They Matter

**Definition:** A **flood risk hotspot** is a geographic area that ranks as high priority for intervention based on multiple risk dimensions.

**The Core Problem:**

Limited resources require prioritization. We cannot invest everywhere at once. Hotspots identify where investment will have the greatest impact.

**What Hotspots Are NOT:**

- ❌ Not just "the worst flooded areas"
- ❌ Not just "the poorest districts"
- ❌ Not just "the highest population"

**What Hotspots ARE:**

- ✓ Areas where multiple risk dimensions converge
- ✓ Areas where intervention will save the most lives and property
- ✓ Areas where investment has the highest return

## The Three-Dimensional Framework

### Why Three Dimensions?

**Single-Dimension Analysis Problems:**

**Economic Risk Only:**
- Identifies where financial loss is highest
- Misses poor areas with lower economic value
- Doesn't capture human cost

**Population Risk Only:**
- Identifies where fatalities are highest
- Misses areas with high economic loss
- Doesn't account for vulnerability

**Vulnerability Only:**
- Identifies where people are most susceptible
- Doesn't account for actual hazard exposure
- May target areas with low hazard

**Three-Dimension Solution:**

Combine all three to get a complete picture:
1. **Physical Risk** — Economic damage potential
2. **Population Risk** — Fatality potential
3. **Socioeconomic Vulnerability** — Community susceptibility

### Dimension 1: Physical Risk (Economic Damage)

**Source:** Expected Annual Damage (EAD) from economic risk analysis

**What It Measures:**
- Average annual monetary loss from flooding
- Based on damage to all 11 asset types
- Calculated using trapezoidal integration

**Assets Included:**

1. **Agriculture** — Cropped area damage
2. **Buildings** — Kacha, pakka, high-rise
3. **Infrastructure** — Roads, railways, electric, telecom
4. **Critical Facilities** — Hospitals, BHUs, schools

**Example EAD Values (Present Climate, Breaches):**

| District | EAD ($M/year) | Interpretation |
|----------|---------------|----------------|
| Dadu | $25.3 | Highest economic risk |
| Jacobabad | $18.2 | Second highest |
| Larkana | $12.8 | Moderate-high |
| Kashmore | $11.5 | Moderate |
| Shikarpur | $8.4 | Moderate-low |
| Qambar Shahdadkot | $7.2 | Low |
| Jamshoro | $5.8 | Lowest |

**Normalization to 0-100 Scale:**

We cannot directly add dollars to fatalities to vulnerability. We must normalize:

```
Physical Risk (normalized) = (EAD - min_EAD) / (max_EAD - min_EAD) × 100

Where:
  min_EAD = $5.8M (Jamshoro)
  max_EAD = $25.3M (Dadu)

For Dadu:
  Physical Risk (normalized) = ($25.3 - $5.8) / ($25.3 - $5.8) × 100
                          = $19.5 / $19.5 × 100
                          = 100

For Jamshoro:
  Physical Risk (normalized) = ($5.8 - $5.8) / ($25.3 - $5.8) × 100
                          = $0 / $19.5 × 100
                          = 0
```

**Why Normalization:**
- Converts all dimensions to same scale (0-100)
- Allows meaningful combination
- Preserves relative differences

### Dimension 2: Population Risk (Fatalities)

**Source:** Expected Annual Fatalities (EAF) from casualty estimation

**What It Measures:**
- Average annual fatalities from flooding
- Based on V×h mortality factors
- Calibrated to 2022 Sindh flood

**Methodology:**
- V×h mortality factor matrix
- Depth × velocity hazard zones
- Duration modifiers
- Calibration factor (0.05)

**Example EAF Values (Present Climate, Breaches):**

| District | EAF (fatalities/year) | Interpretation |
|----------|----------------------|----------------|
| Dadu | 12.5 | Highest population risk |
| Jacobabad | 10.2 | Second highest |
| Kashmore | 8.7 | Third highest |
| Larkana | 6.8 | Moderate |
| Shikarpur | 5.2 | Moderate-low |
| Qambar Shahdadkot | 4.1 | Low |
| Jamshoro | 3.5 | Lowest |

**Normalization to 0-100 Scale:**

```
Population Risk (normalized) = (EAF - min_EAF) / (max_EAF - min_EAF) × 100

Where:
  min_EAF = 3.5 (Jamshoro)
  max_EAF = 12.5 (Dadu)

For Dadu:
  Population Risk (normalized) = (12.5 - 3.5) / (12.5 - 3.5) × 100
                             = 9.0 / 9.0 × 100
                             = 100

For Jamshoro:
  Population Risk (normalized) = (3.5 - 3.5) / (12.5 - 3.5) × 100
                             = 0 / 9.0 × 100
                             = 0
```

### Dimension 3: Socioeconomic Vulnerability

**Source:** Composite index from Census 2017 and Poverty 2019 data

**What It Measures:**
- Community susceptibility to flood impacts
- Ability to cope with and recover from disasters
- Long-term vulnerability factors

**Why This Matters:**

Two districts with the same flood hazard may have very different vulnerability:

**Example:**
- **District A:** Wealthy, concrete houses, good infrastructure, low poverty
- **District B:** Poor, mud houses, limited infrastructure, high poverty

Same flood → Very different outcomes

**Four Sub-Components:**

#### 1. Demographic Vulnerability (40% weight)

**Factors:**

| Factor | Weight | Why It Matters |
|--------|--------|----------------|
| **Population Density** | 30% | Higher density = more exposure per km² |
| **Urban Proportion** | 20% | Urban poor often in informal settlements |
| **Household Size** | 20% | Larger households = more dependents |
| **Growth Rate** | 15% | Higher growth = more pressure on resources |
| **Sex Ratio Deviation** | 15% | Gender imbalance can increase vulnerability |

**Calculation:**

```
For each district:
  Density Score = min(population_density / 1000, 1.0)
  Urban Score = urban_proportion / 100
  Household Score = min(household_size / 10, 1.0)
  Growth Score = min(growth_rate / 5, 1.0)
  Sex Ratio Score = |sex_ratio - 1000| / 500

  Demographic Vulnerability =
      Density Score × 0.30 +
      Urban Score × 0.20 +
      Household Score × 0.20 +
      Growth Score × 0.15 +
      Sex Ratio Score × 0.15
```

**Example Calculation — Dadu:**

| Factor | Value | Score | Weighted |
|--------|-------|-------|----------|
| Density | 197.1/km² | 0.20 | 0.06 |
| Urban | 24.7% | 0.25 | 0.05 |
| Household | 6.2 persons | 0.62 | 0.12 |
| Growth | 2.1% | 0.42 | 0.06 |
| Sex Ratio | 915/1000 | 0.17 | 0.03 |
| **Total** | | | **0.32 × 100 = 32** |

#### 2. Economic Vulnerability (30% weight)

**Primary Factor:** Poverty rate from PSLM 2019-20

**Why Poverty Rate:**
- Poor households have zero "coping capacity"
- No savings to recover from disaster
- Limited access to credit and insurance
- Often live in vulnerable housing

**Poverty Data:**

| District | Poverty Rate | Rank |
|----------|--------------|------|
| Dadu | 29.41% | 1 (highest) |
| Jacobabad | 27.67% | 2 |
| Jamshoro | 25.81% | 3 |
| Kashmore | 25.21% | 4 |
| Shikarpur | 24.47% | 5 |
| Qambar Shahdadkot | 22.41% | 6 |
| Larkana | 21.92% | 7 (lowest) |

**Calculation:**
```
Economic Vulnerability = poverty_rate
```

**Example — Dadu:**
Economic Vulnerability = 29.41%

#### 3. Housing Vulnerability (20% weight)

**Proxy:** Urban proportion × 0.6 + Rural proportion × 0.3

**Why This Proxy:**
- Urban poor in informal settlements highly vulnerable
- Rural poor also vulnerable but more dispersed
- Urban vulnerability concentrated

**Calculation:**
```
Housing Vulnerability = urban_proportion × 0.6 + (100 - urban_proportion) × 0.3
```

**Example — Dadu (24.7% urban):**
```
Housing Vulnerability = 24.7 × 0.6 + 75.3 × 0.3
                    = 14.8 + 22.6
                    = 37.4%
```

#### 4. Service Access Vulnerability (10% weight)

**Proxy:** Inverse of urban proportion (100 - urban_proportion)

**Why This Proxy:**
- Rural areas have less access to emergency services
- Limited healthcare, rescue capacity
- Poor communication and transportation

**Calculation:**
```
Service Access Vulnerability = 100 - urban_proportion
```

**Example — Dadu (24.7% urban):**
Service Access Vulnerability = 100 - 24.7 = 75.3%

#### 5. Composite Vulnerability Score

**Combining All Sub-Components:**

```
Vulnerability = 
    Demographic × 0.40 +
    Economic × 0.30 +
    Housing × 0.20 +
    Service Access × 0.10
```

**Example — Dadu:**

| Component | Score | Weight | Weighted Score |
|-----------|-------|--------|----------------|
| Demographic | 32 | 0.40 | 12.8 |
| Economic | 29.41 | 0.30 | 8.8 |
| Housing | 37.4 | 0.20 | 7.5 |
| Service Access | 75.3 | 0.10 | 7.5 |
| **Total** | | | **36.6** |

**Example — Larkana (45.9% urban):**

| Component | Score | Weight | Weighted Score |
|-----------|-------|--------|----------------|
| Demographic | 48 | 0.40 | 19.2 |
| Economic | 21.92 | 0.30 | 6.6 |
| Housing | 47.5 | 0.20 | 9.5 |
| Service Access | 54.1 | 0.10 | 5.4 |
| **Total** | | | **40.7** |

**Why Larkana Has Higher Vulnerability Despite Lower Poverty:**
- Higher population density (781 vs 197 per km²)
- Larger urban poor population (45.9% urban vs 24.7%)
- More concentrated vulnerability

### The Composite Hotspot Score

**Final Calculation:**

```
Hotspot Score = 
    Physical Risk (normalized) × 0.33 +
    Population Risk (normalized) × 0.33 +
    Socioeconomic Vulnerability × 0.33
```

**Why Equal Weights?**

Currently, we use equal weights (1/3 each). This means:
- Economic damage, human lives, and vulnerability are equally important
- No dimension dominates the analysis
- All three must be addressed

**Future Enhancement:**
Weight sensitivity analysis could test:
- Economic-focused: (0.5, 0.25, 0.25)
- Lives-focused: (0.25, 0.5, 0.25)
- Vulnerability-focused: (0.25, 0.25, 0.5)

**Example Calculation — Dadu (Present, Breaches):**

| Dimension | Raw Value | Normalized | Weight | Weighted Score |
|-----------|-----------|------------|--------|----------------|
| Physical Risk | $25.3M | 100 | 0.33 | 33.0 |
| Population Risk | 12.5 | 100 | 0.33 | 33.0 |
| Vulnerability | 36.6 | 36.6 | 0.33 | 12.1 |
| **Hotspot Score** | | | | **78.1** |

**Example Calculation — Jacobabad (Present, Breaches):**

| Dimension | Raw Value | Normalized | Weight | Weighted Score |
|-----------|-----------|------------|--------|----------------|
| Physical Risk | $18.2M | 71 | 0.33 | 23.4 |
| Population Risk | 10.2 | 88 | 0.33 | 29.0 |
| Vulnerability | 42.8 | 42.8 | 0.33 | 14.1 |
| **Hotspot Score** | | | | **66.5** |

**Example Calculation — Jamshoro (Present, Breaches):**

| Dimension | Raw Value | Normalized | Weight | Weighted Score |
|-----------|-----------|------------|--------|----------------|
| Physical Risk | $5.8M | 0 | 0.33 | 0.0 |
| Population Risk | 3.5 | 0 | 0.33 | 0.0 |
| Vulnerability | 38.2 | 38.2 | 0.33 | 12.6 |
| **Hotspot Score** | | | | **12.6** |

**Final Rankings (Present, Breaches):**

| Rank | District | Physical | Population | Vulnerability | Hotspot Score | Priority |
|------|----------|----------|------------|---------------|---------------|----------|
| 1 | Dadu | 100 | 100 | 36.6 | **78** | Very High |
| 2 | Jacobabad | 71 | 88 | 42.8 | **67** | High |
| 3 | Kashmore | 62 | 82 | 38.5 | **61** | High |
| 4 | Larkana | 54 | 58 | 40.7 | **51** | Moderate |
| 5 | Shikarpur | 31 | 42 | 36.2 | **36** | Moderate |
| 6 | Qambar Shahdadkot | 22 | 32 | 34.8 | **30** | Low-Moderate |
| 7 | Jamshoro | 0 | 0 | 38.2 | **13** | Low |

## How to Use Hotspot Results

### For Resource Allocation

**Rule of Thumb:** Prioritize investment in Rank 1-3 districts first.

**Justification:**
- These districts have converging risks on all dimensions
- Investment here will have the highest return
- Addressing these districts reduces overall risk most effectively

**Example Investment Strategy:**

**Dadu (Rank 1, Score 78):**
- **Physical Risk 100:** High economic damage
  - Action: Embankment reinforcement, spillways
- **Population Risk 100:** High fatality risk
  - Action: Early warning system, evacuation routes
- **Vulnerability 37:** Moderate-high vulnerability
  - Action: Poverty reduction, housing improvement

**Jacobabad (Rank 2, Score 67):**
- **Physical Risk 71:** High economic damage
  - Action: Targeted infrastructure at critical points
- **Population Risk 88:** Very high fatality risk
  - Action: Community-based warning, evacuation capacity
- **Vulnerability 43:** High vulnerability
  - Action: Social safety nets, livelihood diversification

**Jamshoro (Rank 7, Score 13):**
- **Physical Risk 0:** Low economic damage
  - Action: Maintain existing protection
- **Population Risk 0:** Low fatality risk
  - Action: Standard preparedness
- **Vulnerability 38:** Moderate vulnerability
  - Action: Targeted programs for vulnerable populations

### For Understanding Risk Profiles

**Each district has a unique risk profile:**

**Type A: High on All Dimensions (Dadu)**
- Urgent action on all fronts
- Comprehensive intervention needed
- Highest priority for all types of investment

**Type B: High Population Risk (Jacobabad)**
- Focus on saving lives
- Early warning, evacuation, emergency response
- Critical infrastructure protection

**Type C: High Vulnerability (Larkana)**
- Focus on long-term resilience
- Poverty reduction, housing improvement
- Social safety nets, livelihood programs

**Type D: Low Risk (Jamshoro)**
- Maintain vigilance but lower priority
- Standard preparedness adequate
- Target specific vulnerable communities

---

# TECHNICAL INFRASTRUCTURE

## System Architecture Overview

The SRPSID-DSS Portal is a **three-tier web application**:

### Tier 1: Data Layer

**Purpose:** Store and manage all spatial and non-spatial data

**Components:**

1. **PostgreSQL/PostGIS Database**
   - **Role:** Primary data storage
   - **Data:** Asset locations, impact results, population data
   - **Advantages:** Spatial queries, ACID compliance, scalability
   - **Location:** On-premise server at 10.0.0.205

2. **GeoServer Map Server**
   - **Role:** Serve map layers via WMS (Web Map Service)
   - **Data:** Hazard rasters, exposure layers, supporting layers
   - **Layers:** 200+ map layers
   - **Protocol:** WMS 1.1.1

3. **Static Data Files**
   - **Role:** Pre-computed risk data
   - **Data:** risk.json, census data, poverty data
   - **Format:** JSON, GeoJSON
   - **Location:** public/data/ directory

### Tier 2: API Layer

**Purpose:** Provide data access and business logic

**Components:**

1. **Node.js/Express Backend**
   - **Role:** REST API server
   - **Endpoints:** Impact data, population risk, authentication
   - **Port:** 3001
   - **Management:** systemd service

2. **Key Endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/impact/summary | GET | Get impact data for scenarios |
| /api/population-risk | GET | Get casualty estimates |
| /api/auth/login | POST | Authenticate users |
| /api/annotations | GET/POST/PUT/DELETE | Manage interventions |

3. **Caching Layer**
   - **Role:** Improve performance
   - **Method:** In-memory cache
   - **TTL:** 5 minutes
   - **Invalidation:** Manual or time-based

### Tier 3: Presentation Layer

**Purpose:** User interface and data visualization

**Components:**

1. **React 19 Frontend**
   - **Role:** Single-page application
   - **Rendering:** Client-side
   - **State Management:** React hooks
   - **Routing:** Client-side routing

2. **OpenLayers Map Library**
   - **Role:** Interactive mapping
   - **Capabilities:** WMS display, feature identification, layer control
   - **Projection:** UTM Zone 42N (EPSG:32642)

3. **Recharts Library**
   - **Role:** Data visualization
   - **Chart Types:** Bar, line, pie, radar
   - **Interactivity:** Tooltips, zoom, selection

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend Framework** | React 19 | User interface |
| **Language** | TypeScript | Type safety |
| **Build Tool** | Vite 7.3 | Fast development |
| **Styling** | Tailwind CSS 3.x | Utility-first CSS |
| **UI Components** | shadcn/ui | Pre-built components |
| **Maps** | OpenLayers | Interactive mapping |
| **Charts** | Recharts | Data visualization |
| **Backend** | Node.js 20+ | Server runtime |
| **Framework** | Express 4.x | Web framework |
| **Database** | PostgreSQL 15 | Data storage |
| **Spatial** | PostGIS 3.3 | Spatial queries |
| **Maps** | GeoServer 2.23.x | WMS server |
| **Authentication** | JWT + bcryptjs | User management |
| **Web Server** | Apache 2.4 | Production hosting |
| **SSL** | Let's Encrypt | HTTPS |

## Deployment Architecture

**Production Environment:**

```
Internet
    ↓
[Apache with HTTPS]
    ↓
[Static Files: React Build]
    ↓
[/api/* → Proxy to Node.js Backend]
    ↓
[Node.js API Server :3001]
    ↓
[PostgreSQL/PostGIS :5432]
    ↓
[GeoServer :8080]
```

**Server Details:**
- **Location:** 10.0.0.205 (local network)
- **Operating System:** WSL (Windows Subsystem for Linux)
- **Document Root:** /mnt/d/Scenario_results/floodrisk_sferp/dist/
- **URL:** https://portal.srpsid-dss.gos.pk

---

# USING THE DASHBOARD: COMPLETE GUIDE

## Module 1: Hazard View

**Purpose:** Visualize flood scenarios on an interactive map

**How to Use:**

1. **Select Climate**
   - Choose "Present Climate" or "Future Climate"
   - Future climate shows climate change impacts

2. **Select Maintenance**
   - Choose "Perfect", "Breaches", or "Reduced Capacity"
   - Different maintenance = different flood patterns

3. **Select Parameter**
   - Choose "Depth", "Velocity", "Duration", or "V×h"
   - Each parameter shows different hazard aspect

4. **Select Return Period**
   - Choose from 2.3, 5, 10, 25, 50, 100, or 500 years
   - Larger return period = more severe flooding

5. **Explore the Map**
   - Pan and zoom to explore
   - Click on any location to see values
   - Toggle layer visibility on/off

**What You're Seeing:**

- **Colors:** Blue (shallow) → Green → Yellow → Orange → Red (deep)
- **Opacity:** Adjustable transparency
- **Legend:** Shows depth range for each color

**Key Features:**

- **Swipe Compare:** Compare two scenarios side-by-side
  - Drag the slider to reveal/hide scenarios
  - Useful for comparing Present vs. Future or Perfect vs. Breaches

- **Coordinate Display:** Shows your mouse position
  - UTM coordinates (for GIS users)
  - Lat/Lon (for general users)

- **Layer Tree:** Toggle layers on/off
  - Expand/collapse groups
  - Adjust opacity
  - Show multiple layers simultaneously

## Module 2: Impact Matrix

**Purpose:** Understand what gets affected in each scenario

### View 1: Summary Heatmap

**What It Shows:**
- 7×3 matrix (7 return periods × 3 maintenance levels)
- Each cell shows number of affected exposure types (0-9)
- Color-coded by severity (Green, Yellow, Orange, Red)

**How to Read:**

| Cell Color | Affected Exposures | Severity |
|------------|-------------------|----------|
| Green | 0-2 | Low |
| Yellow | 3-5 | Medium |
| Orange | 6-7 | High |
| Red | 8-9 | Extreme |

**Example:**
- Row: "25 years"
- Column: "Breaches"
- Cell: Orange, value "7"
- **Meaning:** In a 25-year flood with breaches, 7 out of 9 exposure types are affected

**Depth Threshold Filter:**
- Slider at top of view
- Set minimum depth to count as "affected"
- Example: Set to 1m → only count assets with >1m depth

### View 2: Detailed Breakdown

**What It Shows:**

1. **Four Summary Cards**
   - Population Affected: Total count and percentage
   - Infrastructure Impact: Average % affected
   - Agriculture & Buildings: Average % affected
   - Overall Risk: Severity level

2. **Nine Exposure Rows**
   - Each exposure type (BHU, Buildings, Roads, etc.)
   - Total count, affected count, percentage
   - Maximum depth bin
   - Depth distribution chart

3. **Population Impact Chart**
   - Horizontal bar chart
   - Shows population in each depth bin
   - Percentages for each bin

**How to Use:**

1. Select a climate (Present/Future)
2. Click any cell in the heatmap
3. View detailed breakdown for that scenario
4. Use depth threshold to focus on severe impacts

**Example Interpretation:**

**Scenario:** 25-year flood, Breaches, Present Climate

**Summary Cards:**
- Population Affected: 450,000 (32%)
- Infrastructure Impact: 45%
- Agriculture & Buildings: 52%
- Overall Risk: High

**Exposure Rows:**
- Buildings: 50,000 total, 12,000 affected (24%)
- Roads: 2,000 km total, 800 km affected (40%)
- Cropped Area: 150,000 ha total, 95,000 ha affected (63%)

**Depth Distribution:**
- 15-100cm: 120,000 people (27%)
- 1-2m: 180,000 people (40%)
- 2-3m: 100,000 people (22%)
- 3-4m: 40,000 people (9%)
- 4-5m: 8,000 people (2%)
- above5m: 2,000 people (0.4%)

**Interpretation:**
- Significant impact across all exposure types
- Most people in 1-2m depth zone (dangerous)
- 10% in >3m depth (extremely dangerous)
- High severity warrants major emergency response

## Module 3: Risk Dashboard

**Purpose:** Comprehensive risk analysis with six views

### View 1: Summary Heatmap

**What It Shows:**
- 7×3 matrix (7 return periods × 3 maintenance levels)
- Each cell shows risk value (damage in USD or exposure in ha/sqm)
- Color-coded from yellow (low) to red (extreme)

**How to Use:**
1. Select risk mode: Exp, Vul, or Dmg
2. Select climate: Present or Future
3. View the matrix
4. Hover over cells for exact values

**Example:**
- Risk mode: Dmg (Economic Damage)
- Cell: 25-year, Breaches
- Value: $120M (color: orange-red)

### View 2: District Breakdown

**What It Shows:**
- Bar chart comparing risk across 7 districts
- Each district has 11 bars (one per asset type)
- Stacked by asset sub-type (for buildings)

**How to Use:**
1. Select scenario (return period, maintenance, climate)
2. View district comparison
3. Identify highest-risk districts
4. Drill down into asset types

**Example:**
- Scenario: 25-year, Breaches, Present
- Dadu: $120M total (highest bar)
- Jacobabad: $95M
- Larkana: $75M
- etc.

### View 3: Spatial (Choropleth Map)

**What It Shows:**
- District boundaries colored by risk value
- Color scale from yellow (low) to red (high)
- District labels with values

**How to Use:**
1. Select scenario and risk mode
2. View map
3. Click on district for details
4. Compare neighboring districts

**Example:**
- Dadu: Dark red ($120M)
- Jacobabad: Red ($95M)
- Larkana: Orange ($75M)
- etc.

### View 4: Expected Annual Damage (EAD)

**What It Shows:**

1. **Summary Table**
   - EAD by maintenance level
   - Asset breakdown
   - Total EAD

2. **District Chart**
   - Horizontal bar chart
   - Stacked by asset type
   - EAD values for each district

3. **Ranked Table**
   - Districts ranked by EAD
   - Asset type breakdown
   - Percent of total

**How to Interpret:**

**Summary Table Example:**

| Maintenance | Crop | Kacha | Pakka | High-Rise | Total |
|-------------|------|-------|-------|-----------|-------|
| Perfect | $3.2M | $1.8M | $1.2M | $0.3M | $6.5M |
| Reduced Capacity | $5.8M | $3.2M | $2.1M | $0.5M | $11.6M |
| Breaches | $8.5M | $6.2M | $3.8M | $0.8M | $19.3M |

**Interpretation:**
- Breaches triple risk vs. Perfect
- Agriculture is largest component
- Kacha buildings disproportionately affected

**Decision Rule:**
If mitigation project costs < 20-30 × EAD, it's economically justified.

### View 5: Population Risk

**What It Shows:**

1. **Fatalities Table**
   - Low, Moderate, High estimates
   - For each scenario
   - District breakdown

2. **EAF Chart**
   - Expected Annual Fatalities
   - By district
   - Comparison chart

3. **Depth Distribution**
   - Population by depth bin
   - Hazard zones
   - V×h exceedance

**How to Interpret:**

**Example Scenario:**
- 25-year flood, Breaches, Present
- Fatalities (Moderate): 89
- Injuries (Moderate): 267
- EAF: 8.5 fatalities/year

**Emergency Planning Use:**
- Shelters for 150,000 people
- Hospital capacity for 300
- Mortuary capacity for 100
- Evacuation zones defined by >1m depth

### View 6: Flood Risk Hotspots

**What It Shows:**

1. **Summary Cards**
   - Top hotspot district
   - Average hotspot score
   - High-risk count

2. **Ranked Table**
   - All 7 districts ranked
   - Three dimension scores
   - Hotspot score

3. **Radar Chart**
   - Three dimensions for each district
   - Visual comparison
   - Identify strengths/weaknesses

**How to Interpret:**

**Example Rankings:**

| Rank | District | Physical | Population | Vulnerability | Hotspot Score | Priority |
|------|----------|----------|------------|---------------|---------------|----------|
| 1 | Dadu | 100 | 100 | 37 | **78** | Very High |
| 2 | Jacobabad | 71 | 88 | 43 | **67** | High |
| 3 | Kashmore | 62 | 82 | 38 | **61** | High |

**Interpretation:**
- Dadu: Converging risks → Urgent action on all fronts
- Jacobabad: High population risk → Focus on saving lives
- Kashmore: Balanced high risk → Comprehensive approach

## Module 4: Interventions

**Purpose:** Collaborative planning for mitigation measures

**What It Shows:**
- Map-based drawing tool
- 42 intervention types
- User authentication required
- Collaborative planning

**How to Use:**

1. **Sign In**
   - Click "Sign In" button
   - Enter username and password
   - (Contact administrator for account)

2. **Create Intervention**
   - Click "Create Intervention"
   - Fill in Name
   - Select Type (42 options)
   - Description appears automatically
   - Click "Create"

3. **Draw on Map**
   - Appropriate drawing tool activates
   - Draw point, line, or polygon
   - Intervention saves automatically

4. **Manage Interventions**
   - View list of all interventions
   - Edit or delete your own interventions
   - Export as GeoJSON

**Intervention Types (42 total):**

| Category | Examples |
|----------|----------|
| **Structural** | Embankments, spillways, reservoirs, channel improvements |
| **Non-Structural** | Early warning, land use planning, flood zoning |
| **Emergency** | Evacuation routes, shelters, emergency stockpiles |
| **Agricultural** | Crop diversification, drainage, flood-resistant crops |
| **Community** | Housing elevation, relocation, awareness programs |

---

# INTERPRETING RESULTS: WHAT THE NUMBERS MEAN

## Understanding Damage Values

### Economic Damage: What Do the Numbers Mean?

**Damage Ranges and Interpretation:**

| Damage Range | Interpretation | Example |
|--------------|----------------|---------|
| <$1M | Very low | Minor localized flooding |
| $1-10M | Low | Small to moderate event |
| $10-50M | Moderate | Significant event, district-level impact |
| $50-100M | High | Major event, multiple districts affected |
| $100-500M | Very High | Severe event, provincial impact |
| >$500M | Extreme | Catastrophic event, national impact |

**Context Matters:**

The same damage value means different things for different districts:

**Example:**
- **Dadu:** $100M damage = 6% of total assets
- **Jamshoro:** $100M damage = 15% of total assets

Same absolute damage, but Jamshoro suffers more proportionally.

### EAD: What Is a "High" Value?

**EAD Ranges:**

| EAD Range | Interpretation | Action |
|----------|----------------|--------|
| <$1M/year | Low risk | Standard preparedness |
| $1-5M/year | Moderate-low | Enhanced monitoring |
| $5-20M/year | Moderate | Targeted mitigation |
| $20-50M/year | High | Significant investment justified |
| >$50M/year | Very High | Urgent action required |

**Investment Decision Rule:**

If a mitigation project costs less than **20-30 years of EAD**, it's economically justified.

**Example:**
- District EAD: $10M/year
- Project cost: $150M
- Payback: 15 years
- **Decision:** Justified (15 < 20)

## Understanding Fatalities

### Fatality Ranges and Interpretation

| Fatalities (Moderate) | Interpretation | Emergency Response |
|------------------------|----------------|-------------------|
| <10 | Very low | Standard response |
| 10-50 | Low | Enhanced response |
| 50-200 | Moderate | Major response |
| 200-1000 | High | Emergency declared |
| >1000 | Very High | Provincial emergency |

### EAF: What Is "Acceptable" Risk?

There is no universally "acceptable" fatality risk. However:

**International Benchmarks:**
- **Netherlands:** EAF <1 fatality/year for dikes (very high standard)
- **UK:** EAF <10 fatalities/year for some flood areas
- **USA:** No formal EAF standard, uses ALARP principle

**For Sindh Context:**
- **Current EAF:** 5-15 fatalities/year (varies by district)
- **After mitigation:** Target to reduce by 50%

## Understanding Risk Scores

### Hotspot Score Interpretation

| Score Range | Priority | Action Required | Timeline |
|-------------|----------|-----------------|----------|
| 70-100 | Very High | Urgent intervention | Immediate |
| 50-70 | High | Priority intervention | 1-2 years |
| 30-50 | Moderate | Enhanced preparedness | 2-5 years |
| 0-30 | Low | Standard preparedness | Ongoing |

### Dimension Analysis

**High Physical Risk (>70):**
- Economic damage is primary concern
- Infrastructure mitigation
- Asset-level interventions

**High Population Risk (>70):**
- Saving lives is primary concern
- Early warning systems
- Evacuation capacity
- Emergency response

**High Vulnerability (>70):**
- Community susceptibility is primary concern
- Poverty reduction
- Housing improvement
- Social safety nets

---

# ASSUMPTIONS, LIMITATIONS & UNCERTAINTIES

## Key Assumptions

### Hazard Modeling Assumptions

1. **Embankment Performance**
   - Perfect: Performs as designed
   - Reduced Capacity: 50% effectiveness
   - Breaches: 12 specific failure points

2. **Climate Projections**
   - RCP scenarios accurately represent future
   - Regional downscaling is appropriate
   - No non-climatic changes (land use, etc.)

3. **Terrain Data**
   - HDTM accurately represents ground surface
   - No significant changes since survey
   - Resolution (10m) is adequate

### Exposure Assumptions

1. **Asset Locations**
   - All assets are correctly mapped
   - Asset counts are accurate
   - Building types correctly classified

2. **Asset Values**
   - Replacement costs are accurate
   - No appreciation/depreciation considered
   - Uniform values within categories

### Vulnerability Assumptions

1. **Depth-Damage Curves**
   - International curves apply locally
   - Construction quality accurately categorized
   - No adaptive capacity or mitigation

2. **Mortality Factors**
   - International factors apply locally
   - 2022 calibration is representative
   - Warning systems and evacuation are average

### Socioeconomic Assumptions

1. **Census Data**
   - 2017 Census remains accurate
   - Growth rates have remained constant
   - No major migration since 2017

2. **Poverty Data**
   - 2019 poverty data remains accurate
   - No significant change due to COVID-19 or 2022 flood

## Known Limitations

### Data Limitations

1. **Temporal Resolution**
   - Census is 10 years old (2017)
   - Poverty data is 7 years old (2019)
   - Does not reflect recent changes

2. **Spatial Resolution**
   - Analysis is district-level only
   - No sub-district (tehsil/UC) detail
   - Within-district variation masked

3. **Asset Completeness**
   - Some asset types may be undercounted
   - Informal settlements may be missed
   - Private assets not fully captured

### Methodological Limitations

1. **Risk Scope**
   - Only direct physical damage
   - Excludes indirect losses (business interruption)
   - Excludes supply chain impacts
   - Excludes long-term recovery costs

2. **Climate Uncertainty**
   - Based on IPCC RCP scenarios
   - Regional models have uncertainty
   - Downscaling introduces error

3. **Mortality Uncertainty**
   - Significant uncertainty in fatality prediction
   - Warning effectiveness not explicitly modeled
   - Age and disability not factored in

### Technical Limitations

1. **Model Resolution**
   - 10m grid may miss small features
   - Building-level detail not captured
   - Local flow effects may be missed

2. **Computational Constraints**
   - Only 84 scenarios modeled
   - Continuous probability not captured
   - Scenario combinations limited

## Uncertainty Management

### How We Communicate Uncertainty

1. **Three Estimate Levels** for fatalities
   - Low: Optimistic scenario
   - Moderate: Best estimate
   - High: Pessimistic scenario

2. **Ranges** for key outputs
   - EAD ranges: "8-12M/year"
   - Fatalities: "45-89-178"

3. **Confidence Levels** in documentation
   - High confidence: Direct measurements
   - Medium confidence: Modeled estimates
   - Low confidence: Projected values

### Managing Uncertainty in Decision-Making

**Precautionary Principle:**
- When uncertain, assume worst case
- Design for upper range of projections
- Build in safety margins

**Robust Decision-Making:**
- Choose options that work across scenarios
- Avoid fragile strategies (only work in narrow range)
- Prioritize no-regret interventions

**Adaptive Management:**
- Monitor conditions over time
- Update estimates as new data available
- Adjust strategies as needed

---

# SCIENTIFIC REFERENCES

## Hazard Modeling

1. **HEC-RAS Reference Manual**
   - US Army Corps of Engineers
   - Institute for Water Resources
   - Hydrologic Engineering Center

2. **SOBEK User Manual**
   - Deltares (Netherlands)
   - 1D/2D hydrodynamic modeling
   - Flood simulation software

3. **Chow, V.T.** (1959). *Open-Channel Hydraulics*. McGraw-Hill.
   - Classic text on open channel flow
   - Saint-Venant equations

## Depth-Damage Curves

1. **Defra (2006).** *Flood Risks to People – Phase 2.* R&D Technical Report FD2321.
   - UK Department for Environment, Food & Rural Affairs
   - Depth-fatality relationships
   - Depth-damage curves for buildings

2. **USBR (2015).** *Reclamation Consequence Estimating Methodology (RCEM).*
   - US Bureau of Reclamation
   - Flood damage estimation
   - Risk assessment methodology

3. **Penning-Rowsell, E. et al.** (various years). *The Flood Hazard Research Centre Depth-Damage Curves.*
   - Middlesex University, UK
   - Comprehensive damage function database

4. **Merz, B. et al.** (2010). "Flood risk curves and uncertainty bounds." *Natural Hazards and Earth System Sciences*.
   - Damage-frequency relationships
   - Uncertainty analysis

## Mortality Estimation

1. **Jonkman, S.N. et al.** (2008). "An overview of quantitative risk measures for loss of life and economic damage." *Journal of Flood Risk Management* 1(1): 30-43.
   - Loss of life estimation
   - Mortality factor matrix
   - V×h hazard zones

2. **USBR (2015).** *Reclamation Consequence Estimating Methodology (RCEM).*
   - Dam failure fatality estimation
   - Depth-velocity-fatality relationships

3. **Defra (2006).** *Flood Risks to People – Phase 2.* R&D Technical Report FD2321.
   - Flood danger to people
   - Stability criteria
   - Evacuation thresholds

## Risk Assessment

1. **Hall, J.W. et al.** (2003). "A methodology for national-scale flood risk assessment." *Water Resources Research*.
   - National-scale risk assessment
   - EAD methodology

2. **Merz, B. et al.** (2010). "Flood risk curves and uncertainty bounds." *Natural Hazards and Earth System Sciences*.
   - Damage-frequency curves
   - Uncertainty quantification

## Vulnerability Assessment

1. **Cutter, S.L. et al.** (2003). "Social vulnerability to environmental hazards." *Social Science Quarterly* 84(2): 242-261.
   - Social vulnerability index
   - Hazard vulnerability assessment

2. **Fekete, A.** (2009). "Validation of a social vulnerability index." *Natural Hazards and Earth System Sciences*.
   - Vulnerability index validation
   - Methodological framework

## Data Sources

1. **Pakistan Bureau of Statistics.** (2017). *Census 2017.*
   - https://www.pbs.gov.pk
   - District-level population data

2. **Pakistan Social and Living Standards Measurement.** (2019-20). *PSLM Survey.*
   - Poverty data
   - Household consumption

3. **World Bank.** (2020). *Poverty Data for Pakistan Districts.*
   - District poverty rates
   - Economic indicators

4. **SUPARCO.** (various years). *Climate Data Center.*
   - River flow data
   - Climate projections

5. **Sindh Disaster Management Authority.** (2022). *2022 Flood Report.*
   - Event data
   - Damage assessment
   - Mortality data

---

**END OF DOCUMENT**

**For questions about methodology or data interpretation, contact the SRPSID-DSS Technical Team.**

**Portal:** https://portal.srpsid-dss.gos.pk
**Last Updated:** April 27, 2026
