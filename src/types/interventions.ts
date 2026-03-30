export interface InterventionType {
  id: string;
  name: string;
  shortDescription: string;
  locationShapeInfo: string;
  hydrologicalParameters: string;
  featureType: 'point' | 'line' | 'polygon';
}

export const INTERVENTION_TYPES: InterventionType[] = [
  // M Series Interventions
  {
    id: 'M1',
    name: 'Check Dam Delay Action',
    shortDescription: 'Small barriers built across valleys to slow runoff, trap sediment, and enhance groundwater recharge during high-flow events.',
    locationShapeInfo: '- Weir / wall represented as vector polyline\n- Crest level of the Weir above m.s.l (in meters)\n- An outline/polygon of expected ponded surface will be useful for validating mesh modification',
    hydrologicalParameters: '- CN values and Manning’s n if changes are expected\n- Spatial extent (vector polygon) if the location of change is different from location in A.\n- Note: Any associated canal abstraction / diversions should be mentioned but may not be modeled due to scale',
    featureType: 'line'
  },
  {
    id: 'M2',
    name: 'Infiltration Galleries (CCTs)',
    shortDescription: 'Shallow contour trenches constructed along slopes to capture rainfall, reduce erosion, and increase soil moisture.',
    locationShapeInfo: '- Vector Polygon marking region where infiltration galleries are to be implemented (can be delineated as one contiguous polygon for each mountain slope)',
    hydrologicalParameters: '- CN values and Manning’s n if changes are expected\n- Total effective surface storage / pondage resulting from this\n- Note: cannot be modeled as a single gallery / trench or represented using a vector polyline',
    featureType: 'polygon'
  },
  {
    id: 'M3',
    name: 'Small Ponds',
    shortDescription: 'Small storage ponds in upper catchments used to collect rainwater for livestock, supplemental irrigation, and recharge.',
    locationShapeInfo: '- Weir / wall represented as vector polyline\n- Crest level of the Weir above m.s.l (in meters)\n- An outline/polygon of expected ponded surface will be useful for validating mesh modification',
    hydrologicalParameters: '- CN values and Manning’s n if changes are expected\n- Crest level of the Weir above m.s.l (in meters)\n- An outline/polygon of expected ponded surface will be useful for validating mesh modification',
    featureType: 'polygon'
  },
  {
    id: 'M4',
    name: 'Afforestation',
    shortDescription: 'Planting trees on degraded slopes to stabilize soil, reduce surface runoff, and enhance watershed resilience.',
    locationShapeInfo: '- Vector Polygon marking region where intervention is to be implemented',
    hydrologicalParameters: '- CN values and Manning’s n if changes are expected\n- Note: Provide vector Polygon marking region where intervention is to be implemented',
    featureType: 'polygon'
  },
  {
    id: 'M5',
    name: 'Slope Stabilizers',
    shortDescription: 'Structural or vegetative measures installed along vulnerable slopes to reduce landslides and dissipate runoff energy.',
    locationShapeInfo: '- Vector Polygon marking region where intervention is to be implemented',
    hydrologicalParameters: '- CN values and Manning’s n if changes are expected\n- Note: Provide vector Polygon marking region where intervention is to be implemented',
    featureType: 'polygon'
  },
  {
    id: 'M6',
    name: 'Community-Based Eco-system Adaptation',
    shortDescription: 'Locally driven watershed interventions such as soil conservation, vegetation planting, and water harvesting designed and maintained by communities.',
    locationShapeInfo: '- Vector Polygon marking region where intervention is to be implemented',
    hydrologicalParameters: '- CN values and Manning’s n if changes are expected\n- Note: Provide vector Polygon marking region where intervention is to be implemented',
    featureType: 'polygon'
  },
  {
    id: 'M7',
    name: 'Flood Diversion Bunds',
    shortDescription: 'Earthen bunds constructed to redirect peak flows away from settlements and agricultural lands.',
    locationShapeInfo: '- vector polyline + proposed name of the embankment',
    hydrologicalParameters: '- Elevation of the embankement\n- Vector polyline + proposed name of the embankment',
    featureType: 'line'
  },
  {
    id: 'M8',
    name: 'Sustainable Spate Irrigation System',
    shortDescription: 'Traditional flood-based irrigation using controlled diversion of hill-torrents to irrigate command areas sustainably.',
    locationShapeInfo: '- Not modeled',
    hydrologicalParameters: '- Default: No hydrological implication',
    featureType: 'none' // This would be handled differently
  },
  {
    id: 'M9',
    name: 'Bank Vegetation & Erosion Control',
    shortDescription: 'Use of grasses, shrubs, or bio-engineering to stabilize banks, reduce erosion, and improve channel health.',
    locationShapeInfo: '- Vector Polygon marking region where intervention is to be implemented\n- In case of existing embankment, vector polyline + name of the existing embankment\n- In case of existing embankment, vector polyline + name of the existing embankment',
    hydrologicalParameters: '- CN values and Manning’s n if changes are expected\n- Vector Polygon marking region where intervention is to be implemented\n- Vector Polygon marking region where intervention is to be implemented',
    featureType: 'polygon'
  },
  {
    id: 'M10',
    name: 'Gabion Structures',
    shortDescription: 'Rock-filled wire mesh structures used to protect banks, prevent scouring, and strengthen vulnerable channel sections.',
    locationShapeInfo: '- Weir / wall represented as vector polyline\n- Crest level of the Weir above m.s.l (in meters)',
    hydrologicalParameters: '- Default: No hydrological implication\n- Optional: CN values and Manning’s n (only if changes are expected)\n- Note: Sediment transport and channel training cannot be modeled',
    featureType: 'line'
  },
  {
    id: 'M11',
    name: 'Gabar Dams (traditional)',
    shortDescription: 'Low-cost stone or earth dams built by communities to store runoff, recharge aquifers, and support downstream use.',
    locationShapeInfo: '- Weir / wall represented as vector polyline\n- An outline/polygon of expected ponded surface will be useful for validating mesh modification',
    hydrologicalParameters: '- CN values and Manning’s n if changes are expected\n- Weir / wall represented as vector polyline\n- An outline/polygon of expected ponded surface will be useful for validating mesh modification',
    featureType: 'line'
  },

  // P Series Interventions
  {
    id: 'P1',
    name: 'Flood Embankments',
    shortDescription: 'Raised earthen or engineered barriers constructed along rivers and drains to prevent floodwater from spreading into settlements and farmlands.',
    locationShapeInfo: '- Weir / wall represented as vector polyline\n- Alternatively, height above terrain (meters above n.s.l) is needed',
    hydrologicalParameters: '- Default: No hydrological implication\n- Elevation of the embankment (m)\n- Alternatively, height above terrain (meters above n.s.l) is needed\n- Optional: CN values and Manning’s n (only if changes are expected)',
    featureType: 'line'
  },
  {
    id: 'P2',
    name: 'Embankment Reinforcement',
    shortDescription: 'Strengthening weak embankment sections using stone pitching, geo-bags, riprap, or concrete works to prevent breaches during high flows.',
    locationShapeInfo: '- Weir / wall represented as vector polyline\n- Crest level of the Weir above m.s.l (in meters)\n- Alternatively, height above terrain (meters above n.s.l) is needed',
    hydrologicalParameters: '- Weir / wall represented as vector polyline\n- Crest level of the Weir above m.s.l (in meters)\n- Alternatively, height above terrain (meters above n.s.l) is needed\n- Optional: CN values and Manning’s n (only if changes are expected)',
    featureType: 'line'
  },
  {
    id: 'P3',
    name: 'Relief Cuts',
    shortDescription: 'Controlled breaching or fuse-plug cuts designed to divert excess floodwater into designated areas, reducing pressure on critical embankments.',
    locationShapeInfo: '- Dimensions of the relief cut – final width, final bottom elevation in meters\n- Name of embankment and location of the relief cut (as vector point or vector polyline)',
    hydrologicalParameters: '- Dimensions of the relief cut – final width, final bottom elevation in meters\n- Name of embankment and location of the relief cut (as vector point or vector polyline)',
    featureType: 'point' // Can be point or line based on description
  },
  {
    id: 'P4',
    name: 'Pumping Stations',
    shortDescription: 'High-capacity pumps installed to remove trapped water from low-lying depressions and enhance drainage during prolonged flooding.',
    locationShapeInfo: '- Not modeled',
    hydrologicalParameters: '- N/A',
    featureType: 'point' // Points for pump locations
  },
  {
    id: 'P5',
    name: 'Rainwater Harvesting',
    shortDescription: 'Capturing and storing monsoon rainfall through ponds, tanks, or recharge wells to reduce runoff and enhance groundwater replenishment.',
    locationShapeInfo: '- Total volumetric storage of rainwater harvesting system.\n- Note: cannot be modeled as an individual well/tank due to scale',
    hydrologicalParameters: '- Default: No hydrological implication\n- Total volumetric storage of rainwater harvesting system.\n- Note: cannot be modeled as an individual well/tank due to scale',
    featureType: 'polygon' // Areas for ponds/tanks
  },
  {
    id: 'P6',
    name: 'Retarding Basin',
    shortDescription: 'Designated temporary storage areas that hold excess floodwater and release it gradually, lowering downstream flood peaks.',
    locationShapeInfo: '- Weir / wall(s) represented as vector polyline\n- Crest level of the Weir above m.s.l (in meters)\n- Weir / embankments above m.s.l (in meters)\n- Note: Any associated canal abstraction / diversions should be mentioned but may not be modeled due to scale',
    hydrologicalParameters: '- CN values and Manning’s n if changes are expected\n- Weir / wall(s) represented as vector polyline\n- Crest level of the Weir above m.s.l (in meters)\n- Weir / embankments above m.s.l (in meters)\n- Note: Any associated canal abstraction / diversions should be mentioned but may not be modeled due to scale',
    featureType: 'line'
  },
  {
    id: 'P7',
    name: 'Raising & Rehabilitation of Embankments',
    shortDescription: 'Increasing the height and structural integrity of existing embankments to improve flood protection under extreme rainfall scenarios.',
    locationShapeInfo: '- Weir / wall represented as vector polyline\n- Crest level of the Weir above m.s.l (in meters)\n- Alternatively, height above terrain (meters above n.s.l) is needed\n- (meters above n.s.l) is needed',
    hydrologicalParameters: '- Weir / wall represented as vector polyline\n- Crest level of the Weir above m.s.l (in meters)\n- Alternatively, height above terrain (meters above n.s.l) is needed\n- (meters above n.s.l) is needed\n- Optional: CN values and Manning’s n (only if changes are expected)',
    featureType: 'line'
  },
  {
    id: 'P8',
    name: 'Removing Anthropogenic Obstructions',
    shortDescription: 'Clearing man-made encroachments, undersized culverts, siphons, and cross-drainage structures to restore natural drainage pathways.',
    locationShapeInfo: '- Note: Can be modeled only for linear floodplain obstructions, e.g. existing embankments, major roads/highways.\n- Vector (poly/line) of the hydraulic structures/encorachments to be removed\n- Vector (poly/line) of the hydraulic structures/encorachments to be removed',
    hydrologicalParameters: '- Note: Can be modeled only for linear floodplain obstructions, e.g. existing embankments, major roads/highways.\n- Note: Can be modeled only for linear floodplain obstructions, e.g. existing embankments, major roads/highways.',
    featureType: 'line' // Linear features for removal
  },
  {
    id: 'P9',
    name: 'Climate Smart Agriculture',
    shortDescription: 'Adoption of resilient farming practices such as laser leveling, raised beds, zero tillage, drought-tolerant crops, and efficient irrigation systems.',
    locationShapeInfo: '- Not modeled',
    hydrologicalParameters: '- Default: No hydrological implication',
    featureType: 'none' // Practices, not physical features
  },

  // H Series Interventions
  {
    id: 'H1',
    name: 'Flood Protection Bunds',
    shortDescription: 'Perimeter embankments constructed around Hamal Lake to protect nearby villages and agricultural land from overflow and high flood levels.',
    locationShapeInfo: '- bund / wall represented as vector polyline\n- Alternatively, height above terrain (meters above n.s.l) is needed',
    hydrologicalParameters: '- Default: No hydrological implication\n- Optional: CN values and Manning’s n (only if changes are expected)\n- bund / wall represented as vector polyline\n- Crest level of the bund above m.s.l (in meters) if constant.\n- height above terrain (meters above n.s.l) is needed',
    featureType: 'line'
  },
  {
    id: 'H2',
    name: 'Guide Bunds',
    shortDescription: 'Engineered bunds placed strategically to direct and control the flow of floodwater entering or leaving the lake, reducing erosion and channel instability.',
    locationShapeInfo: '- bund / wall represented as vector polyline\n- Crest level of the bund above m.s.l (in meters) if constant.\n- Alternatively, height above terrain (meters above n.s.l) is needed',
    hydrologicalParameters: '- Optional: CN values and Manning’s n (only if changes are expected)\n- bund / wall represented as vector polyline\n- Crest level of the bund above m.s.l (in meters) if constant.\n- Alternatively, height above terrain (meters above n.s.l) is needed',
    featureType: 'line'
  },
  {
    id: 'H3',
    name: 'Escape Channels',
    shortDescription: 'Designated emergency drainage pathways that allow excess lake water to be safely conveyed toward downstream channels during extreme flood events.',
    locationShapeInfo: '- Please provide channel shape: cross-sections, slope, and flow capacity\n- Location: Vector polyline\n- Please provide channel shape: cross-sections, slope, and flow capacity\n- Location: Vector polyline',
    hydrologicalParameters: '- Manning’s n\n- Please provide channel shape: cross-sections, slope, and flow capacity\n- Please provide channel shape: cross-sections, slope, and flow capacity\n- Location: Vector polyline\n- Location: Vector polyline',
    featureType: 'line'
  },
  {
    id: 'H4',
    name: 'Gabion Apron (Bed Stabilization)',
    shortDescription: 'Rock-filled wire mattresses installed along lake outlets and channels to prevent scouring, stabilize the bed, and protect structures from erosion.',
    locationShapeInfo: '- Not modeled',
    hydrologicalParameters: '- N/A',
    featureType: 'line' // For channels where apron is installed
  },
  {
    id: 'H5',
    name: 'Excavation of Flow Path',
    shortDescription: 'Clearing and deepening of silted or blocked flow paths to improve drainage from Hamal Lake toward Aral and Manchar systems.',
    locationShapeInfo: '- Not modeled',
    hydrologicalParameters: '- N/A',
    featureType: 'line' // For flow paths being cleared
  },
  {
    id: 'H6',
    name: 'Large & Small Retention Ponds / Lakes',
    shortDescription: 'Creation of additional storage ponds to temporarily hold floodwater, reduce peak flows, and enhance controlled lake-level water storage management.',
    locationShapeInfo: '- wall represented as vector polyline\n- Crest level of the Weir above m.s.l (in meters)\n- volume of any major excavation leading to increase in water storage\n- An outline/polygon of expected ponded surface will be useful for validating mesh modification\n- Note: Any significant associated canal abstraction / diversions should be mentioned but may not be modeled due to scale',
    hydrologicalParameters: '- Optional: CN values and Manning’s n (only if changes are expected)\n- wall represented as vector polyline\n- Crest level of the Weir above m.s.l (in meters)\n- volume of any major excavation leading to increase in water storage\n- An outline/polygon of expected ponded surface will be useful for validating mesh modification\n- Note: Any significant associated canal abstraction / diversions should be mentioned but may not be modeled due to scale',
    featureType: 'polygon'
  },

  // M L Series Interventions
  {
    id: 'ML1',
    name: 'Wetland Rehabilitation',
    shortDescription: 'Restoring degraded wetland areas around Manchar and the Indus floodplain to improve biodiversity, flood buffering, and water quality.',
    locationShapeInfo: '- Vector polygon outlining the location(s) of the intervention to be implemented',
    hydrologicalParameters: '- CN values and Manning’s n (only if changes are expected)\n- Vector polygon outlining the location(s) of the intervention to be implemented',
    featureType: 'polygon'
  },
  {
    id: 'ML2',
    name: 'Aamri Bridge Culvert',
    shortDescription: 'Upgrading and expanding culvert capacity at Aamri Bridge to improve water flow connectivity between Hamal–Aral–Manchar–Indus systems.',
    locationShapeInfo: '- Location as Vector point / line\n- A CAD drawing of the culvert outlining its dimensions',
    hydrologicalParameters: '- Default: No hydrological implication\n- Location as Vector point / line\n- A CAD drawing of the culvert outlining its dimensions',
    featureType: 'line' // For the culvert/bridge
  },
  {
    id: 'ML3',
    name: 'Remodeling of Tail Channel',
    shortDescription: 'Deepening, widening, and clearing the Aral Tail Channel to increase drainage efficiency and reduce waterlogging around Manchar Lake.',
    locationShapeInfo: '- A CAD drawing of the channel cross-sections outlining its dimensions',
    hydrologicalParameters: '- A CAD drawing of the channel cross-sections outlining its dimensions\n- Peak design discharge capacity for model validation',
    featureType: 'line' // For the channel
  },
  {
    id: 'ML4',
    name: 'Raising & Rehabilitation of Embankments',
    shortDescription: 'Strengthening and elevating protective embankments to prevent Indus backflow and reduce flood risk for surrounding communities.',
    locationShapeInfo: '- Vector (poly/line) of the embankment\n- If existing embankment, name of existing embankment\n- New elevation of the embankment',
    hydrologicalParameters: '- Default: No hydrological implication\n- Vector (poly/line) of the embankment\n- If existing embankment, name of existing embankment\n- New elevation of the embankment',
    featureType: 'line' // Can be polygon or line
  },
  {
    id: 'ML5',
    name: 'Increased Capacity',
    shortDescription: 'Expanding the lake’s effective storage volume to hold excess floodwater, reduce downstream peak flows, and delay flood waves.',
    locationShapeInfo: '- Crest level of the bund above m.s.l (in meters)\n- If constant.\n- Alternatively, height above terrain (meters above n.s.l) is needed\n- (meters above n.s.l) is needed if constant.',
    hydrologicalParameters: '- Default: No hydrological implication\n- Crest level of the bund above m.s.l (in meters)\n- If constant.\n- Alternatively, height above terrain (meters above n.s.l) is needed\n- (meters above n.s.l) is needed if constant.',
    featureType: 'line' // For the bund
  },
  {
    id: 'ML6',
    name: 'Natural Wetland Systems',
    shortDescription: 'Using reed beds, buffer strips, and natural filtration systems to reduce pollution loads and improve ecological health of Manchar Lake.',
    locationShapeInfo: '- Vector polygon outlining the location(s) of the intervention to be implemented',
    hydrologicalParameters: '- CN values and Manning’s n (only if changes are expected)\n- Vector polygon outlining the location(s) of the intervention to be implemented',
    featureType: 'polygon'
  },
  {
    id: 'ML7',
    name: 'Solar-Powered Pumping Stations',
    shortDescription: 'Deploying solar-driven pumps to improve drainage, support irrigation, and enhance climate-resilient water management around the lake.',
    locationShapeInfo: '- Not modeled',
    hydrologicalParameters: '- N/A',
    featureType: 'point' // Points for pump locations
  },
  {
    id: 'ML8',
    name: 'Elevated Storage Tanks / Cross-Basin Water Transfer Systems',
    shortDescription: 'Installing elevated storage or transfer pipelines to move excess water to safer basins, reduce local flooding, and improve supply reliability.',
    locationShapeInfo: '- Not modeled',
    hydrologicalParameters: '- N/A',
    featureType: 'line' // For pipelines
  },
  {
    id: 'ML9',
    name: 'Restoration of Flood Plains',
    shortDescription: 'Clearing illegal encroachments and restoring natural floodplain corridors to enhance flood spread, storage, and river-channel resilience.',
    locationShapeInfo: '- Note: Can be modeled only for linear floodplain obstructions, e.g. existing embankments, major roads/highways.\n- Vector (poly/line) of the hydraulic structures/encorachments to be removed\n- Vector (poly/line) of the hydraulic structures/encorachments to be removed',
    hydrologicalParameters: '- Default: No hydrological implication\n- Note: Can be modeled only for linear floodplain obstructions, e.g. existing embankments, major roads/highways.\n- Note: Can be modeled only for linear floodplain obstructions, e.g. existing embankments, major roads/highways.',
    featureType: 'line' // For removal of obstructions
  }
];