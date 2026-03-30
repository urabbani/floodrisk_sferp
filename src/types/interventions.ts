export interface InterventionType {
  id: string;
  name: string;
  shortDescription: string;
  shapeAndHydroParams: string;
  featureType: 'point' | 'line' | 'polygon' | 'none';
}

export const INTERVENTION_TYPES: InterventionType[] = [
  // M Series Interventions
  {
    id: 'M1',
    name: 'Check Dam Delay Action Dams',
    shortDescription: 'Small barriers built across valleys to slow runoff, trap sediment, and enhance groundwater recharge during high-flow events.',
    shapeAndHydroParams: 'CN values and Manning\'s n if changes are expected.\nSpatial extent (vector polygon) if the location of change is different from location polygon in A.\nWeir / wall represented as vector polyline\nCrest level of the Weir above m.s.l (in meters)\nNote: Any associated canal abstraction / diversions should be mentioned but may not be modeled due to scale',
    featureType: 'line'
  },
  {
    id: 'M2',
    name: 'Infiltration Galleries (CCTs)',
    shortDescription: 'Shallow contour trenches constructed along slopes to capture rainfall, reduce erosion, and increase soil moisture.',
    shapeAndHydroParams: 'CN values and Manning\'s n if changes are expected.\nTotal effective surface storage / pondage resulting from this \nNote: cannot be modeled as a single gallery / trench or represented using a vector polyline',
    featureType: 'polygon'
  },
  {
    id: 'M3',
    name: 'Small Ponds',
    shortDescription: 'Small storage ponds in upper catchments used to collect rainwater for livestock, supplemental irrigation, and recharge.',
    shapeAndHydroParams: 'CN values and Manning\'s n if changes are expected.\nCrest level of the Weir above m.s.l (in meters)\nAn outline/polygon of expected ponded surface will be useful for validating mesh modification',
    featureType: 'polygon'
  },
  {
    id: 'M4',
    name: 'Afforestation',
    shortDescription: 'Planting trees on degraded slopes to stabilize soil, reduce surface runoff, and enhance watershed resilience.',
    shapeAndHydroParams: 'CN values and Manning\'s n if changes are expected.\nNote: Provide vector Polygon marking region where intervention is to be implemented',
    featureType: 'polygon'
  },
  {
    id: 'M5',
    name: 'Slope Stabilizers / Cascading',
    shortDescription: 'Structural or vegetative measures installed along vulnerable slopes to reduce landslides and dissipate runoff energy.',
    shapeAndHydroParams: 'CN values and Manning\'s n if changes are expected.\nNote: Provide vector Polygon marking region where intervention is to be implemented',
    featureType: 'polygon'
  },
  {
    id: 'M6',
    name: 'Community-Based Ecosystem Adaptation',
    shortDescription: 'Locally driven watershed interventions such as soil conservation, vegetation planting, and water harvesting designed and maintained by communities.',
    shapeAndHydroParams: 'CN values and Manning\'s n if changes are expected.\nNote: Provide vector Polygon marking region where intervention is to be implemented',
    featureType: 'polygon'
  },
  {
    id: 'M7',
    name: 'Flood Diversion Bunds',
    shortDescription: 'Earthen bunds constructed to redirect peak flows away from settlements and agricultural lands.',
    shapeAndHydroParams: 'Elevation of the embankement\nVector polyline + proposed name of the embankment',
    featureType: 'line'
  },
  {
    id: 'M8',
    name: 'Sustainable Spate Irrigation System',
    shortDescription: 'Traditional flood-based irrigation using controlled diversion of hill-torrents to irrigate command areas sustainably',
    shapeAndHydroParams: 'Default: No hydrological implication',
    featureType: 'none'
  },
  {
    id: 'M9',
    name: 'Bank Vegetation & Erosion Control',
    shortDescription: 'Use of grasses, shrubs, or bio-engineering to stabilize banks, reduce erosion, and improve channel health.',
    shapeAndHydroParams: 'CN values and Manning\'s n if changes are expected.\nVector Polygon marking region where intervention is to be implemented\nIn case of existing embankment, vector polyline + name of the existing embankment',
    featureType: 'polygon'
  },
  {
    id: 'M10',
    name: 'Gabion Structures',
    shortDescription: 'Rock-filled wire mesh structures used to protect banks, prevent scouring, and strengthen vulnerable channel sections.',
    shapeAndHydroParams: 'Default: No hydrological implication \nOptional: CN values and Manning\'s n (only if changes are expected).\nWeir / wall represented as vector polyline\nCrest level of the Weir above m.s.l (in meters)\nNote: Sediment transport and channel training cannot be modeled',
    featureType: 'line'
  },
  {
    id: 'M11',
    name: 'Gabar Dams (traditional rainwater harvesting)',
    shortDescription: 'Low-cost stone or earth dams built by communities to store runoff, recharge aquifers, and support downstream use.',
    shapeAndHydroParams: 'CN values and Manning\'s n if changes are expected.\nWeir / wall represented as vector polyline\nCrest level of the Weir above m.s.l (in meters)\nAn outline/polygon of expected ponded surface will be useful for validating mesh modification',
    featureType: 'line'
  },
  // P Series Interventions
  {
    id: 'P1',
    name: 'Flood Embankments',
    shortDescription: 'Raised earthen or engineered barriers constructed along rivers and drains to prevent floodwater from spreading into settlements and farmlands.',
    shapeAndHydroParams: 'Default: No hydrological implication \nElevation of the embankment (m)\nWeir / wall represented as vector polyline\nOptional: CN values and Manning\'s n (only if changes are expected).',
    featureType: 'line'
  },
  {
    id: 'P2',
    name: 'Embankment Reinforcement',
    shortDescription: 'Strengthening weak embankment sections using stone pitching, geo-bags, riprap, or concrete works to prevent breaches during high flows.',
    shapeAndHydroParams: 'Weir / wall represented as vector polyline\nCrest level of the Weir above m.s.l (in meters) if constant. Alternatively, height above terrain (meters above n.s.l) is needed \nOptional: CN values and Manning\'s n (only if changes are expected).',
    featureType: 'line'
  },
  {
    id: 'P3',
    name: 'Relief Cuts',
    shortDescription: 'Controlled breaching or fuse-plug cuts designed to divert excess floodwater into designated areas, reducing pressure on critical embankments.',
    shapeAndHydroParams: 'Dimensions of the relief cut – final width, final bottom elevation in meters\nName of embankment and location of the relief cut (as vector point or vector polyline)',
    featureType: 'point'
  },
  {
    id: 'P4',
    name: 'Pumping Stations at Drains',
    shortDescription: 'High-capacity pumps installed to remove trapped water from low-lying depressions and enhance drainage during prolonged flooding.',
    shapeAndHydroParams: 'N/A',
    featureType: 'point'
  },
  {
    id: 'P5',
    name: 'Rainwater Harvesting',
    shortDescription: 'Capturing and storing monsoon rainfall through ponds, tanks, or recharge wells to reduce runoff and enhance groundwater replenishment',
    shapeAndHydroParams: 'Default: No hydrological implication \nTotal volumetric storage of rainwater harvesting system.\nNote: cannot be modeled as an individual well/tank due to scale',
    featureType: 'polygon'
  },
  {
    id: 'P6',
    name: 'Retarding Basin',
    shortDescription: 'Designated temporary storage areas that hold excess floodwater and release it gradually, lowering downstream flood peaks.',
    shapeAndHydroParams: 'CN values and Manning\'s n if changes are expected.\nWeir / wall(s) represented as vector polyline\nCrest level of the Weir/embankments above m.s.l (in meters)\nAn outline/polygon of expected ponded surface will be useful for validating mesh modification\nNote: Any associated canal abstraction / diversions should be mentioned but may not be modeled due to scale',
    featureType: 'line'
  },
  {
    id: 'P7',
    name: 'Raising & Rehabilitation of Embankments',
    shortDescription: 'Increasing the height and structural integrity of existing embankments to improve flood protection under extreme rainfall scenarios.',
    shapeAndHydroParams: 'Weir / wall represented as vector polyline\nCrest level of the Weir above m.s.l (in meters) if constant. Alternatively, height above terrain (meters above n.s.l) is needed \nOptional: CN values and Manning\'s n (only if changes are expected).',
    featureType: 'line'
  },
  {
    id: 'P8',
    name: 'Removing Anthropogenic Obstructions',
    shortDescription: 'Clearing man-made blockages encroachments, undersized culverts, siphons, and cross-drainage structures to restore natural drainage pathways.',
    shapeAndHydroParams: 'Note: Can be modeled only for linear floodplain obstructions, e.g. existing embankments, major roads/highways. \nVector (poly/line) of the  hydraulic structures/ encorachments to be removed',
    featureType: 'line'
  },
  {
    id: 'P9',
    name: 'Climate Smart-Agriculture Interventions',
    shortDescription: 'Adoption of resilient farming practices such as laser leveling, raised beds, zero tillage, drought-tolerant crops, and efficient irrigation systems.',
    shapeAndHydroParams: 'Default: No hydrological implication',
    featureType: 'none'
  },
  // H Series Interventions
  {
    id: 'H1',
    name: 'Flood Protection Bunds',
    shortDescription: 'Perimeter embankments constructed around Hamal Lake to protect nearby villages and agricultural land from overflow and high flood levels.',
    shapeAndHydroParams: 'Default: No hydrological implication \nOptional: CN values and Manning\'s n (only if changes are expected).\nbund / wall represented as vector polyline\nCrest level of the bund above m.s.l (in meters) if constant. Alternatively, height above terrain (meters above n.s.l) is needed',
    featureType: 'line'
  },
  {
    id: 'H2',
    name: 'Guide Bunds',
    shortDescription: 'Engineered bunds placed strategically to direct and control the flow of floodwater entering or leaving the lake, reducing erosion and channel instability.',
    shapeAndHydroParams: 'Optional: CN values and Manning\'s n (only if changes are expected). \nbund / wall represented as vector polyline\nCrest level of the bund above m.s.l (in meters) if constant. Alternatively, height above terrain (meters above n.s.l) is needed',
    featureType: 'line'
  },
  {
    id: 'H3',
    name: 'Escape Channels',
    shortDescription: 'Designated emergency drainage pathways that allow excess lake water to be safely conveyed toward downstream channels during extreme flood events.',
    shapeAndHydroParams: "Manning\'s n\nPlease provide channel shape: cross- sections, slope, and flow capacity\nPlease provide channel shape: cross- sections, slope, and flow capacity\nLocation: Vector polyline",
    featureType: 'line'
  },
  {
    id: 'H4',
    name: 'Gabion Apron (Bed Stabilization)',
    shortDescription: 'Rock-filled wire mattresses installed along lake outlets and channels to prevent scouring, stabilize the bed, and protect structures from erosion.',
    shapeAndHydroParams: 'N/A',
    featureType: 'none'
  },
  {
    id: 'H5',
    name: 'Excavation of Flow Path / Drainage Area',
    shortDescription: 'Clearing and deepening of silted or blocked flow paths to improve drainage from Hamal Lake toward Aral and Manchar systems.',
    shapeAndHydroParams: 'N/A',
    featureType: 'none'
  },
  {
    id: 'H6',
    name: 'Large & Small Retention Ponds / Lakes',
    shortDescription: 'Creation of additional storage ponds to temporarily hold floodwater, reduce peak flows, and enhance controlled lake-level management.',
    shapeAndHydroParams: 'Optional: CN values and Manning\'s n if changes are expected.\nwall represented as vector polyline\nvolume of any major excavation leading to increase in water storage\nCrest level of the Weir above m.s.l (in meters)\nAn outline/polygon of expected ponded surface will be useful for validating mesh modification\nNote: Any significant associated canal abstraction / diversions should be mentioned but may not be modeled due to scale',
    featureType: 'polygon'
  },
  // ML Series Interventions
  {
    id: 'ML1',
    name: 'Wetland Rehabilitation',
    shortDescription: 'Restoring degraded wetland areas around Manchar and the Indus floodplain to improve biodiversity, flood buffering, and water quality.',
    shapeAndHydroParams: "CN values and Manning\'s n (only if changes are expected).",
    featureType: 'polygon'
  },
  {
    id: 'ML2',
    name: 'Aamri Bridge Culvert',
    shortDescription: 'Upgrading and expanding culvert capacity at Aamri Bridge to improve water flow connectivity between Hamal–Aral–Manchar–Indus systems.',
    shapeAndHydroParams: 'Default: No hydrological implication \nLocation as Vector point / line\nA CAD drawing of the culvert outlining its dimensions',
    featureType: 'line'
  },
  {
    id: 'ML3',
    name: 'Remodeling of Aral Tail Channel',
    shortDescription: 'Deepening, widening, and clearing the Aral Tail Channel to increase drainage efficiency and reduce waterlogging around Manchar Lake',
    shapeAndHydroParams: 'A CAD drawing of the channel cross-sections outlining its dimensions\nPeak design discharge capacity for model validation',
    featureType: 'line'
  },
  {
    id: 'ML4',
    name: 'Raising & Rehabilitation of Embankments',
    shortDescription: 'Strengthening and elevating protective embankments to prevent Indus backflow and reduce flood risk for surrounding communities.',
    shapeAndHydroParams: 'Default: No hydrological implication',
    featureType: 'line'
  },
  {
    id: 'ML5',
    name: 'Increased Capacity of Manchar Lake',
    shortDescription: "Expanding the lake's effective storage volume to hold excess floodwater, reduce downstream peak flows, and delay flood waves.",
    shapeAndHydroParams: 'Default: No hydrological implication \nCrest level of the bund, m.s.l (in meters) if constant. \nAlternatively, height above terrain (meters above n.s.l) is needed',
    featureType: 'line'
  },
  {
    id: 'ML6',
    name: 'Natural Wetland Interventions for Water Quality',
    shortDescription: 'Using reed beds, buffer strips, and natural filtration systems to reduce pollution loads and improve the ecological health of Manchar Lake.',
    shapeAndHydroParams: "CN values and Manning\'s n (only if changes are expected).\nVector polygon outlining the location(s) of the intervention",
    featureType: 'polygon'
  },
  {
    id: 'ML7',
    name: 'Solar-Powered Pumping Stations & Irrigation Systems',
    shortDescription: 'Deploying solar-driven pumps to improve drainage, support irrigation, and enhance climate-resilient water management around the lake.',
    shapeAndHydroParams: 'N/A',
    featureType: 'none'
  },
  {
    id: 'ML8',
    name: 'Elevated Storage Tanks / Cross-Basin Water Transfer Systems',
    shortDescription: 'Installing elevated storage or transfer pipelines to move excess water to safer basins, reduce local flooding, and improve supply reliability',
    shapeAndHydroParams: 'N/A',
    featureType: 'none'
  },
  {
    id: 'ML9',
    name: 'Restoration of Flood Plains (Encroachment Removal)',
    shortDescription: 'Clearing illegal encroachments and restoring natural floodplain corridors to enhance flood spread, storage, and river-channel resilience.',
    shapeAndHydroParams: 'Default: No hydrological implications \nNote: Can be modeled only for linear floodplain obstructions, e.g. existing embankments, major roads/highways. \nVector (poly/line) of the  hydraulic structures/ encroachments to be removed',
    featureType: 'line'
  }
];
