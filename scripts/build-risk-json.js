/**
 * Parse all 42 risk xlsx files into a compact static JSON file.
 * Also converts Districts.shp to GeoJSON for the choropleth map.
 *
 * Usage: node scripts/build-risk-json.js
 */
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const RISK_DIR = path.join(ROOT, 'risk');
const OUTPUT = path.join(ROOT, 'public', 'data', 'risk.json');
const GEOJSON_OUTPUT = path.join(ROOT, 'public', 'data', 'districts.geojson');

const REGIONS = [
  'TOTAL', 'Dadu', 'Jacobabad', 'Jamshoro', 'Kashmore',
  'Larkana', 'Qambar Shahdadkot', 'Shikarpur',
];

const MODES = ['Exp', 'Vul', 'Dmg'];

// All 11 asset types from columns B-L
const ASSET_KEYS = [
  'crop',           // Cropped Area (ha)
  'buildLow56',     // Buildings <3m (56%) (sq.m)
  'buildLow44',     // Buildings <3m (44%) (sq.m)
  'buildHigh',      // Buildings >=3m (sq.m)
  'telecom',        // Telecom Tower
  'electric',       // Electric lines
  'railways',       // Railways
  'hospitals',      // Hospitals
  'bhu',            // BHU
  'schools',        // Schools
  'roads',          // Roads
];

// Parse xlsx files
const files = fs.readdirSync(RISK_DIR).filter(f => f.endsWith('.xlsx'));
const result = { generated: new Date().toISOString(), scenarios: {}, data: {}, districts: REGIONS.slice(1) };

let processed = 0;
for (const file of files) {
  const match = file.match(/Risk_Analysis_T3_(.+?)yrs_(Present|Future)_(Breaches|Perfect|RedCapacity)\.xlsx/);
  if (!match) continue;
  const [, rp, climate, maint] = match;
  const key = `${rp}_${climate.toLowerCase()}_${maint.toLowerCase()}`;

  result.scenarios[key] = {
    returnPeriod: parseFloat(rp),
    climate: climate.toLowerCase(),
    maintenance: maint.toLowerCase(),
  };
  result.data[key] = {};

  const wb = XLSX.readFile(path.join(RISK_DIR, file));

  for (const region of REGIONS) {
    result.data[key][region] = {};
    for (const mode of MODES) {
      // Sheet name is truncated to 31 chars; region+mode must fit
      let sheetName = `${region}_${mode}`;
      const ws = wb.Sheets[sheetName];
      if (!ws) {
        // Try truncated name (31 char Excel limit)
        sheetName = sheetName.slice(0, 31);
        if (!wb.Sheets[sheetName]) continue;
      }

      // Compute SUM of rows 4-24 for columns B-L (11 asset columns)
      const sums = new Array(11).fill(0);
      for (let r = 4; r <= 24; r++) {
        for (let c = 0; c < 11; c++) {
          const cellRef = XLSX.utils.encode_cell({ r: r - 1, c: c + 1 });
          const cell = ws[cellRef];
          sums[c] += (cell && typeof cell.v === 'number') ? cell.v : 0;
        }
      }

      const obj = {};
      ASSET_KEYS.forEach((k, i) => obj[k] = Math.round(sums[i] * 100) / 100);
      result.data[key][region][mode] = obj;
    }
  }

  processed++;
  console.log(`  [${processed}/${files.length}] ${file}`);
}

// Write JSON
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, JSON.stringify(result));
console.log(`\nGenerated ${OUTPUT} with ${Object.keys(result.scenarios).length} scenarios`);

// Convert Districts.shp to GeoJSON (EPSG:32642)
const shpPath = path.join(RISK_DIR, 'Districts.shp');
if (fs.existsSync(shpPath)) {
  try {
    execSync(
      `ogr2ogr -f GeoJSON -t_srs EPSG:32642 -s_srs EPSG:32642 "${GEOJSON_OUTPUT}" "${shpPath}"`,
      { stdio: 'inherit' }
    );
    console.log(`\nGenerated ${GEOJSON_OUTPUT}`);
  } catch (err) {
    console.error('ogr2ogr failed, trying without reprojection:', err.message);
    // Try just converting format (shapefile may already be in 32642)
    execSync(
      `ogr2ogr -f GeoJSON "${GEOJSON_OUTPUT}" "${shpPath}"`,
      { stdio: 'inherit' }
    );
    console.log(`\nGenerated ${GEOJSON_OUTPUT} (no reprojection)`);
  }

  // Filter out excluded districts (Naushahro Feroze, Shaheed Benazirabad)
  const geojson = JSON.parse(fs.readFileSync(GEOJSON_OUTPUT, 'utf8'));
  const originalCount = geojson.features.length;
  const excludedDistricts = ['Naushahro Feroze', 'Shaheed Benazirabad'];

  geojson.features = geojson.features.filter(f => {
    const district = f.properties?.district || f.properties?.District_N || f.properties?.name || '';
    return !excludedDistricts.some(excluded => district.includes(excluded));
  });

  fs.writeFileSync(GEOJSON_OUTPUT, JSON.stringify(geojson));
  console.log(`Filtered GeoJSON: ${originalCount} → ${geojson.features.length} districts (removed: ${excludedDistricts.join(', ')})`);
} else {
  console.error(`\nWarning: ${shpPath} not found, skipping GeoJSON generation`);
}

// Quick validation
const validationScenario = result.data['25_present_perfect'];
if (validationScenario) {
  const totalDmg = validationScenario.TOTAL?.Dmg;
  if (totalDmg) {
    const totalAll = Object.values(totalDmg).reduce((a, b) => a + b, 0);
    console.log(`\nValidation (25yr Present Perfect, TOTAL Dmg): Sum of all 11 assets`);
    console.log(`  Total sum: ${totalAll.toFixed(2)}`);
    console.log(`  Crop: ${totalDmg.crop?.toFixed(0) || 0}, Kacha: ${totalDmg.buildLow56?.toFixed(0) || 0}, Pakka: ${totalDmg.buildLow44?.toFixed(0) || 0}, High-Rise: ${totalDmg.buildHigh?.toFixed(0) || 0}`);
    console.log(`  Telecom: ${totalDmg.telecom?.toFixed(0) || 0}, Electric: ${totalDmg.electric?.toFixed(0) || 0}, Railways: ${totalDmg.railways?.toFixed(0) || 0}`);
    console.log(`  Hospitals: ${totalDmg.hospitals?.toFixed(0) || 0}, BHU: ${totalDmg.bhu?.toFixed(0) || 0}, Schools: ${totalDmg.schools?.toFixed(0) || 0}, Roads: ${totalDmg.roads?.toFixed(0) || 0}`);
  }
}
