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
  'Larkana', 'Naushahro Feroze', 'Qambar Shahdadkot',
  'Shaheed Benazirabad', 'Shikarpur',
];

const MODES = ['Exp', 'Vul', 'Dmg'];
const ASSET_KEYS = ['crop', 'buildings'];

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

      // Compute SUM of rows 4-24 for columns B(1)=crop, C+D+E(2,3,4)=buildings
      let cropSum = 0;
      let buildingsSum = 0;
      for (let r = 4; r <= 24; r++) {
        for (let c = 0; c < 4; c++) {
          const cellRef = XLSX.utils.encode_cell({ r: r - 1, c: c + 1 });
          const cell = ws[cellRef];
          const val = (cell && typeof cell.v === 'number') ? cell.v : 0;
          if (c === 0) cropSum += val;
          else buildingsSum += val;
        }
      }

      const obj = {
        crop: Math.round(cropSum * 100) / 100,
        buildings: Math.round(buildingsSum * 100) / 100,
      };
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
} else {
  console.error(`\nWarning: ${shpPath} not found, skipping GeoJSON generation`);
}

// Quick validation
const validationScenario = result.data['25_present_perfect'];
if (validationScenario) {
  const totalDmg = validationScenario.TOTAL?.Dmg;
  if (totalDmg) {
    const totalAll = totalDmg.crop + totalDmg.buildings;
    console.log(`\nValidation (25yr Present Perfect, TOTAL Dmg): $${(totalAll / 1e9).toFixed(2)}B`);
    console.log(`  Crop: ${totalDmg.crop}, Buildings: ${totalDmg.buildings}`);
  }
}
