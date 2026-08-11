/**
 * Interventions schema (GeoServer WFS layers)
 *
 * Read-only intervention data published as WFS layers in the GeoServer
 * `interventions` workspace. Surfaced in the Interventions sidebar tab as a
 * browser + map. Distinct from the annotation-based interventions in
 * `interventions.ts` (which drive the drawing dialog).
 */

import { GEOSERVER_CONFIG } from '@/config/layers';

/** Geometry category of an intervention layer. */
export type SchemaGeometryType = 'point' | 'line' | 'polygon';

/** A single WFS intervention layer to show in the Interventions tab. */
export interface InterventionLayer {
  /** Full WFS typeName, e.g. `interventions:s6_small_dams`. */
  typeName: string;
  /** Bare table name (used as a stable key), e.g. `s6_small_dams`. */
  key: string;
  /** Human-readable label shown in the UI. */
  displayName: string;
  /** Geometry category — drives the list icon and map styling. */
  geometryType: SchemaGeometryType;
  /** Distinct colour used to render this layer on the map. */
  color: string;
}

/**
 * The 12 intervention layers imported from Interventions.gpkg into the
 * PostGIS `interventions` schema and published in the GeoServer
 * `interventions` workspace. Table/column names are laundered to lowercase by
 * the PostGIS driver.
 */
export const INTERVENTION_LAYERS: readonly InterventionLayer[] = [
  {
    typeName: 'interventions:s1_s3_compound_flood_channel',
    key: 's1_s3_compound_flood_channel',
    displayName: 'S1/S3 Compound Flood Channel',
    geometryType: 'line',
    color: '#16a34a', // green
  },
  {
    typeName: 'interventions:s2_zero_point',
    key: 's2_zero_point',
    displayName: 'S2 Zero Point (Miro Khan)',
    geometryType: 'point',
    color: '#0891b2', // cyan
  },
  {
    typeName: 'interventions:s4_moria_loop_bund',
    key: 's4_moria_loop_bund',
    displayName: 'S4 Moria Loop Bund',
    geometryType: 'point',
    color: '#ea580c', // orange
  },
  {
    typeName: 'interventions:s6_diversion_bunds',
    key: 's6_diversion_bunds',
    displayName: 'S6 Diversion Bunds',
    geometryType: 'line',
    color: '#d97706', // amber
  },
  {
    typeName: 'interventions:s6_small_dams',
    key: 's6_small_dams',
    displayName: 'S6 Small Dams',
    geometryType: 'point',
    color: '#2563eb', // blue
  },
  {
    typeName: 'interventions:s7_large_town_ring_bunds',
    key: 's7_large_town_ring_bunds',
    displayName: 'S7 Ring Bunds (Large Town)',
    geometryType: 'polygon',
    color: '#be185d', // pink
  },
  {
    typeName: 'interventions:s7_small_town_ring_bunds',
    key: 's7_small_town_ring_bunds',
    displayName: 'S7 Ring Bunds (Small Town)',
    geometryType: 'point',
    color: '#e11d48', // rose
  },
  {
    typeName: 'interventions:s9_bottlenecks_removal',
    key: 's9_bottlenecks_removal',
    displayName: 'S9 Hydraulic Bottlenecks Removal',
    geometryType: 'point',
    color: '#65a30d', // lime
  },
  {
    typeName: 'interventions:s12_aral_tail_bottleneck',
    key: 's12_aral_tail_bottleneck',
    displayName: 'S12 Aral Tail Bottleneck Removal',
    geometryType: 'point',
    color: '#0d9488', // teal
  },
  {
    typeName: 'interventions:s14_fp_bund_hotspots',
    key: 's14_fp_bund_hotspots',
    displayName: 'S14 FP Bund Hotspots',
    geometryType: 'point',
    color: '#dc2626', // red
  },
  {
    typeName: 'interventions:s16_hamal_lake',
    key: 's16_hamal_lake',
    displayName: 'S16 Hamal Lake Capacity Enhancement',
    geometryType: 'polygon',
    color: '#4f46e5', // indigo
  },
  {
    typeName: 'interventions:s17_bridge_remodeling',
    key: 's17_bridge_remodeling',
    displayName: 'S17 Qazi Ahmed-Aamri Bridge Remodeling',
    geometryType: 'point',
    color: '#7c3aed', // violet
  },
] as const;

/** Map a layer key back to its config (O(1) lookup). */
export const INTERVENTION_LAYER_BY_KEY: Record<string, InterventionLayer> =
  Object.fromEntries(INTERVENTION_LAYERS.map((l) => [l.key, l]));

/**
 * Build a GeoJSON-returning WFS GetFeature URL for a typeName.
 *
 * GeoServer returns geometries in EPSG:32642 (the map projection), so no
 * client-side reprojection is needed. Reached via the existing `/geoserver`
 * Vite/Apache proxy.
 */
export function buildWfsUrl(typeName: string): string {
  const params = new URLSearchParams({
    service: 'WFS',
    version: '2.0.0',
    request: 'GetFeature',
    typeNames: typeName,
    outputFormat: 'application/json',
  });
  return `${GEOSERVER_CONFIG.baseUrl}/interventions/ows?${params.toString()}`;
}

/** KML/QML artefact fields to ignore when falling back to the first string prop. */
const JUNK_LABEL_KEYS = new Set([
  'id',
  'ogc_fid',
  'timestamp',
  'begin',
  'end',
  'altitudemode',
  'altitudemo',
  'altitude_1',
  'tessellate',
  'extrude',
  'visibility',
  'draworder',
  'icon',
  'layer',
  'path',
  'cat',
]);

/**
 * Pick a human-readable label for a feature from its properties (all keys are
 * laundered to lowercase). `protection` (S1/S3 compound flood channel), then
 * `name` (most layers), then `title`, `inv_code`, and description variants.
 * Falls back to the first non-empty string property, skipping known KML/QML
 * artefact fields so labels like "Mazarani 3 Dam" surface instead of junk.
 */
export function featureLabel(properties: Record<string, unknown> | null): string {
  if (!properties) return 'Unnamed feature';
  const candidates = [
    'protection',
    'name',
    'title',
    'inv_code',
    'description',
    'descriptio',
    'descript_1',
  ];
  for (const key of candidates) {
    const value = properties[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  // Fallback: first non-empty string property that isn't a known artefact field.
  for (const [key, value] of Object.entries(properties)) {
    if (JUNK_LABEL_KEYS.has(key)) continue;
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return 'Unnamed feature';
}

/** A short secondary attribute to show under a row label, if present. */
export function featureSecondary(
  properties: Record<string, unknown> | null,
): string | null {
  if (!properties) return null;
  const candidates = ['interventi', 'district', 'river', 'zone', 'created_by'];
  for (const key of candidates) {
    const value = properties[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}
