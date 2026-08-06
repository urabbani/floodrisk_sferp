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
  /** Full WFS typeName, e.g. `interventions:smallDams`. */
  typeName: string;
  /** Bare table name (used as a stable key), e.g. `smallDams`. */
  key: string;
  /** Human-readable label shown in the UI. */
  displayName: string;
  /** Geometry category — drives the list icon and map styling. */
  geometryType: SchemaGeometryType;
  /** Distinct colour used to render this layer on the map. */
  color: string;
}

/** The 9 intervention layers (verified live via WFS GetCapabilities). */
export const INTERVENTION_LAYERS: readonly InterventionLayer[] = [
  {
    typeName: 'interventions:S1_FloodChannel',
    key: 'S1_FloodChannel',
    displayName: 'S1 Flood Channel',
    geometryType: 'polygon',
    color: '#16a34a', // green
  },
  {
    typeName: 'interventions:S2_ZeroPoint',
    key: 'S2_ZeroPoint',
    displayName: 'S2 Zero Point',
    geometryType: 'point',
    color: '#0891b2', // cyan
  },
  {
    typeName: 'interventions:S3_FloodChannel',
    key: 'S3_FloodChannel',
    displayName: 'S3 Flood Channel',
    geometryType: 'polygon',
    color: '#9333ea', // purple
  },
  {
    typeName: 'interventions:S4_MoriaLoopBund',
    key: 'S4_MoriaLoopBund',
    displayName: 'S4 Moria Loop Bund',
    geometryType: 'point',
    color: '#ea580c', // orange
  },
  {
    typeName: 'interventions:S6_DiversionBunds',
    key: 'S6_DiversionBunds',
    displayName: 'S6 Diversion Bunds',
    geometryType: 'line',
    color: '#f59e0b', // amber
  },
  {
    typeName: 'interventions:S6_SmallDams',
    key: 'S6_SmallDams',
    displayName: 'S6 Small Dams',
    geometryType: 'point',
    color: '#2563eb', // blue
  },
  {
    typeName: 'interventions:S7_RingBunds',
    key: 'S7_RingBunds',
    displayName: 'S7 Ring Bunds',
    geometryType: 'polygon',
    color: '#be185d', // pink
  },
  {
    typeName: 'interventions:S9_BottlenecksRemoval',
    key: 'S9_BottlenecksRemoval',
    displayName: 'S9 Bottlenecks Removal',
    geometryType: 'point',
    color: '#65a30d', // lime
  },
  {
    typeName: 'interventions:S14_FPBundHotspots',
    key: 'S14_FPBundHotspots',
    displayName: 'S14 FP Bund Hotspots',
    geometryType: 'point',
    color: '#dc2626', // red
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

/**
 * Pick a human-readable label for a feature from its properties.
 * `title` (S6_DiversionBunds), `Protection` (S1/S3_FloodChannel),
 * or `Name` (S6_SmallDams, S7_RingBunds, S4_MoriaLoopBund,
 * S14_FPBundHotspots, S9_BottlenecksRemoval). S2_ZeroPoint carries no
 * attributes and falls back to 'Unnamed feature'.
 */
export function featureLabel(properties: Record<string, unknown> | null): string {
  if (!properties) return 'Unnamed feature';
  const candidates = [
    'title',
    'Protection',
    'Name',
    'INV_CODE',
    'descriptio',
    'Pt',
  ];
  for (const key of candidates) {
    const value = properties[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  // Fallback: first non-empty string property.
  for (const value of Object.values(properties)) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return 'Unnamed feature';
}

/** A short secondary attribute to show under a row label, if present. */
export function featureSecondary(
  properties: Record<string, unknown> | null,
): string | null {
  if (!properties) return null;
  const candidates = ['interventi', 'District', 'River', 'Zone', 'created_by'];
  for (const key of candidates) {
    const value = properties[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}
