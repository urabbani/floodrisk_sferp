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

/** The 7 intervention layers (verified live via WFS GetCapabilities). */
export const INTERVENTION_LAYERS: readonly InterventionLayer[] = [
  {
    typeName: 'interventions:smallDams',
    key: 'smallDams',
    displayName: 'Small Dams',
    geometryType: 'point',
    color: '#2563eb', // blue
  },
  {
    typeName: 'interventions:DiversionBunds',
    key: 'DiversionBunds',
    displayName: 'Diversion Bunds',
    geometryType: 'line',
    color: '#f59e0b', // amber
  },
  {
    typeName: 'interventions:FloodChannel_Choki-ZeroPoint',
    key: 'FloodChannel_Choki-ZeroPoint',
    displayName: 'Flood Channel: Choki–Zero Point',
    geometryType: 'polygon',
    color: '#16a34a', // green
  },
  {
    typeName: 'interventions:FloodChannel_Hamal-Manchar',
    key: 'FloodChannel_Hamal-Manchar',
    displayName: 'Flood Channel: Hamal–Manchar',
    geometryType: 'polygon',
    color: '#9333ea', // purple
  },
  {
    typeName: 'interventions:FloodChannel_hamalDrain',
    key: 'FloodChannel_hamalDrain',
    displayName: 'Flood Channel: Hamal Drain',
    geometryType: 'polygon',
    color: '#dc2626', // red
  },
  {
    typeName: 'interventions:ChokingPoints',
    key: 'ChokingPoints',
    displayName: 'Choking Points',
    geometryType: 'point',
    color: '#0891b2', // cyan
  },
  {
    typeName: 'interventions:RingBunds',
    key: 'RingBunds',
    displayName: 'Ring Bunds',
    geometryType: 'polygon',
    color: '#be185d', // pink
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
 * Shape A tables (smallDams, DiversionBunds) carry `title`;
 * Shape B tables (FloodChannel_*) carry `Protection`;
 * RingBunds carries `Name`; ChokingPoints carries `Pt` (a numeric id).
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
