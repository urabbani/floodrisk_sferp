#!/usr/bin/env node
/**
 * Ring Bunds Impact Analysis - Excel Export
 *
 * Generates a comprehensive Excel file with all analysis results.
 * Climate (Present/Future) and Maintenance (Perfect/Breaches/Reduced Capacity)
 * are separate scenarios - NEVER summed together.
 *
 * Usage: node scripts/generate-ringbunds-excel.js
 *
 * Output: ringbunds-impact-analysis/RingBunds_Impact_Analysis.xlsx
 */

import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const RISK_DIR = path.join(ROOT, 'risk');
const OUTPUT_DIR = path.join(ROOT, 'ringbunds-impact-analysis');

// Ensure output directory exists
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Constants
const REGIONS = ['TOTAL', 'Dadu', 'Jacobabad', 'Jamshoro', 'Kashmore', 'Larkana', 'Qambar Shahdadkot', 'Shikarpur'];
const MODES = ['Exp', 'Dmg'];
const ASSET_KEYS = ['crop', 'buildLow56', 'buildLow44', 'buildHigh', 'telecom', 'electric', 'railways', 'hospitals', 'bhu', 'schools', 'roads', 'hydraulic'];
const ASSET_LABELS = {
  crop: 'Crops',
  buildLow56: 'Kacha Buildings (<3m, 56%)',
  buildLow44: 'Pakka Buildings (<3m, 44%)',
  buildHigh: 'High-Rise Buildings (>=3m)',
  telecom: 'Telecom Towers',
  electric: 'Electric Lines',
  railways: 'Railways',
  hospitals: 'Hospitals',
  bhu: 'Basic Health Units (BHU)',
  schools: 'Schools',
  roads: 'Roads',
  hydraulic: 'Hydraulic Structures'
};
const RETURN_PERIODS = [2.3, 5, 10, 25, 50, 100, 500];
const CLIMATES = ['present', 'future'];
const MAINTENANCE = ['perfect', 'breaches', 'redcapacity'];
const MAINT_LABELS = {
  perfect: 'Perfect',
  breaches: 'Breaches',
  redcapacity: 'Reduced Capacity'
};

console.log('=== Ring Bunds Excel Generator ===\n');

// Step 1: Parse all Excel files
console.log('Step 1: Parsing Excel files...');

const baselineData = {};
const ringbundsData = {};
const scenarios = [];

const baselineFiles = fs.readdirSync(RISK_DIR).filter(f => f.match(/Risk_Analysis_T3_.+\.xlsx$/) && !f.includes('ringbunds'));
const ringbundsFiles = fs.readdirSync(RISK_DIR).filter(f => f.includes('ringbunds'));

// Parse baseline files
for (const file of baselineFiles) {
  const match = file.match(/Risk_Analysis_T3_(.+?)yrs_(Present|Future)_(Breaches|Perfect|RedCapacity)\.xlsx/);
  if (!match) continue;
  const [, rp, climate, maint] = match;
  const key = `${rp}_${climate.toLowerCase()}_${maint.toLowerCase()}`;

  if (!scenarios.find(s => s.key === key)) {
    scenarios.push({
      key,
      returnPeriod: parseFloat(rp),
      climate: climate.toLowerCase(),
      maintenance: maint.toLowerCase()
    });
  }

  baselineData[key] = parseExcelFile(path.join(RISK_DIR, file));
}

// Parse ring bunds files
for (const file of ringbundsFiles) {
  const match = file.match(/Risk_Analysis_w_ringbunds_T3_(.+?)yrs_(Present|Future)_(Breaches|Perfect|RedCapacity)\.xlsx/);
  if (!match) continue;
  const [, rp, climate, maint] = match;
  const key = `${rp}_${climate.toLowerCase()}_${maint.toLowerCase()}`;

  ringbundsData[key] = parseExcelFile(path.join(RISK_DIR, file));
}

scenarios.sort((a, b) => a.returnPeriod - b.returnPeriod || a.climate.localeCompare(b.climate) || a.maintenance.localeCompare(b.maintenance));

console.log(`  Parsed ${scenarios.length} scenarios\n`);

// Step 2: Calculate comparisons
console.log('Step 2: Calculating comparisons...');

const comparisons = {};

for (const scenario of scenarios) {
  const key = scenario.key;
  const baseline = baselineData[key];
  const ringbunds = ringbundsData[key];

  if (!baseline || !ringbunds) continue;

  comparisons[key] = {};

  for (const region of REGIONS) {
    comparisons[key][region] = {};
    for (const mode of MODES) {
      comparisons[key][region][mode] = {};
      for (const asset of ASSET_KEYS) {
        const baselineValue = baseline[region]?.[mode]?.[asset] || 0;
        const ringbundsValue = ringbunds[region]?.[mode]?.[asset] || 0;
        const reduction = baselineValue - ringbundsValue;
        const reductionPct = baselineValue > 0 ? (reduction / baselineValue) * 100 : 0;

        comparisons[key][region][mode][asset] = {
          baseline: baselineValue,
          ringbunds: ringbundsValue,
          reduction: reduction,
          reductionPct: reductionPct
        };
      }
    }
  }
}

console.log('  Comparisons calculated\n');

// Step 3: Calculate EAD
console.log('Step 3: Calculating EAD...');

function calculateEad(damages) {
  if (damages.length < 2) return 0;
  let ead = 0;
  for (let i = 0; i < damages.length - 1; i++) {
    const freqLeft = 1 / damages[i].returnPeriod;
    const freqRight = 1 / damages[i + 1].returnPeriod;
    ead += 0.5 * (damages[i].damage + damages[i + 1].damage) * Math.abs(freqLeft - freqRight);
  }
  return ead;
}

// EAD by climate, maintenance, region, asset
const eadResults = {};

for (const climate of CLIMATES) {
  for (const maintenance of MAINTENANCE) {
    eadResults[`${climate}_${maintenance}`] = { baseline: {}, ringbunds: {} };

    for (const region of REGIONS) {
      eadResults[`${climate}_${maintenance}`].baseline[region] = {};
      eadResults[`${climate}_${maintenance}`].ringbunds[region] = {};

      for (const asset of ASSET_KEYS) {
        const baselineDamages = RETURN_PERIODS.map(rp => {
          const key = `${rp}_${climate}_${maintenance}`;
          return {
            returnPeriod: rp,
            damage: baselineData[key]?.[region]?.['Dmg']?.[asset] || 0
          };
        });
        eadResults[`${climate}_${maintenance}`].baseline[region][asset] = calculateEad(baselineDamages);

        const ringbundsDamages = RETURN_PERIODS.map(rp => {
          const key = `${rp}_${climate}_${maintenance}`;
          return {
            returnPeriod: rp,
            damage: ringbundsData[key]?.[region]?.['Dmg']?.[asset] || 0
          };
        });
        eadResults[`${climate}_${maintenance}`].ringbunds[region][asset] = calculateEad(ringbundsDamages);
      }
    }
  }
}

console.log('  EAD calculated\n');

// Step 4: Create Excel workbook
console.log('Step 4: Creating Excel workbook...');

const wb = XLSX.utils.book_new();

// ============================================================
// SHEET 1: OVERVIEW TABLE (All 6 scenarios)
// ============================================================
const overviewSheet = [
  ['RING BUNDS IMPACT ANALYSIS - Overview', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['Climate', 'Maintenance', 'Total Damage Reduction ($M)', 'Reduction %', 'EAD Reduction ($M/year)', 'EAD Reduction %']
];

for (const climate of CLIMATES) {
  for (const maintenance of MAINTENANCE) {
    let totalBaselineDmg = 0;
    let totalRingbundsDmg = 0;
    let totalBaselineEAD = 0;
    let totalRingbundsEAD = 0;

    // Sum across all return periods
    for (const rp of RETURN_PERIODS) {
      const key = `${rp}_${climate}_${maintenance}`;
      if (comparisons[key]?.TOTAL?.Dmg) {
        for (const asset of ASSET_KEYS) {
          totalBaselineDmg += comparisons[key].TOTAL.Dmg[asset].baseline;
          totalRingbundsDmg += comparisons[key].TOTAL.Dmg[asset].ringbunds;
        }
      }
    }

    // Sum EAD across all regions and assets
    const eadKey = `${climate}_${maintenance}`;
    for (const region of REGIONS) {
      for (const asset of ASSET_KEYS) {
        totalBaselineEAD += eadResults[eadKey].baseline[region]?.[asset] || 0;
        totalRingbundsEAD += eadResults[eadKey].ringbunds[region]?.[asset] || 0;
      }
    }

    const dmgReduction = totalBaselineDmg - totalRingbundsDmg;
    const dmgReductionPct = totalBaselineDmg > 0 ? (dmgReduction / totalBaselineDmg) * 100 : 0;
    const eadReduction = totalBaselineEAD - totalRingbundsEAD;
    const eadReductionPct = totalBaselineEAD > 0 ? (eadReduction / totalBaselineEAD) * 100 : 0;

    overviewSheet.push([
      climate.charAt(0).toUpperCase() + climate.slice(1),
      MAINT_LABELS[maintenance],
      (dmgReduction / 1e6).toFixed(2),
      dmgReductionPct.toFixed(1) + '%',
      (eadReduction / 1e6).toFixed(2),
      eadReductionPct.toFixed(1) + '%'
    ]);
  }
}

XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(overviewSheet), 'Overview');

// ============================================================
// Helper function to create scenario sheets
// ============================================================
function createScenarioSheet(climate, maintenance) {
  const sheet = [];
  const climateLabel = climate.charAt(0).toUpperCase() + climate.slice(1);
  const maintLabel = MAINT_LABELS[maintenance];
  const scenarioTitle = `${climateLabel} Climate - ${maintLabel} Maintenance`;

  sheet.push([scenarioTitle, '', '', '', '']);
  sheet.push(['', '', '', '', '']);
  sheet.push(['Return Period', 'Baseline Damage ($M)', 'Ring Bunds Damage ($M)', 'Reduction ($M)', 'Reduction %']);

  let totalBaseline = 0;
  let totalRingbunds = 0;

  for (const rp of RETURN_PERIODS) {
    const key = `${rp}_${climate}_${maintenance}`;
    if (!comparisons[key]) continue;

    let baselineDmg = 0;
    let ringbundsDmg = 0;

    for (const asset of ASSET_KEYS) {
      baselineDmg += comparisons[key].TOTAL.Dmg[asset].baseline;
      ringbundsDmg += comparisons[key].TOTAL.Dmg[asset].ringbunds;
    }

    totalBaseline += baselineDmg;
    totalRingbunds += ringbundsDmg;

    const reduction = baselineDmg - ringbundsDmg;
    const pct = baselineDmg > 0 ? ((reduction / baselineDmg) * 100) : 0;

    sheet.push([
      rp.toString(),
      (baselineDmg / 1e6).toFixed(2),
      (ringbundsDmg / 1e6).toFixed(2),
      (reduction / 1e6).toFixed(2),
      pct.toFixed(1) + '%'
    ]);
  }

  const totalReduction = totalBaseline - totalRingbunds;
  const totalPct = totalBaseline > 0 ? ((totalReduction / totalBaseline) * 100) : 0;

  sheet.push(['', '', '', '', '']);
  sheet.push(['TOTAL', (totalBaseline / 1e6).toFixed(2), (totalRingbunds / 1e6).toFixed(2), (totalReduction / 1e6).toFixed(2), totalPct.toFixed(1) + '%']);

  return sheet;
}

function createDistrictSheet(climate, maintenance) {
  const sheet = [];
  const climateLabel = climate.charAt(0).toUpperCase() + climate.slice(1);
  const maintLabel = MAINT_LABELS[maintenance];
  const scenarioTitle = `${climateLabel} Climate - ${maintLabel} Maintenance`;

  sheet.push([scenarioTitle, '', '', '', '']);
  sheet.push(['', '', '', '', '']);
  sheet.push(['District', 'Baseline Damage ($M)', 'Ring Bunds Damage ($M)', 'Reduction ($M)', 'Reduction %']);

  for (const region of REGIONS.filter(r => r !== 'TOTAL')) {
    let baselineSum = 0;
    let ringbundsSum = 0;

    for (const rp of RETURN_PERIODS) {
      const key = `${rp}_${climate}_${maintenance}`;
      if (comparisons[key]?.[region]?.Dmg) {
        for (const asset of ASSET_KEYS) {
          baselineSum += comparisons[key][region].Dmg[asset].baseline;
          ringbundsSum += comparisons[key][region].Dmg[asset].ringbunds;
        }
      }
    }

    const reduction = baselineSum - ringbundsSum;
    const pct = baselineSum > 0 ? ((reduction / baselineSum) * 100) : 0;

    sheet.push([
      region,
      (baselineSum / 1e6).toFixed(2),
      (ringbundsSum / 1e6).toFixed(2),
      (reduction / 1e6).toFixed(2),
      pct.toFixed(1) + '%'
    ]);
  }

  return sheet;
}

function createAssetSheet(climate, maintenance) {
  const sheet = [];
  const climateLabel = climate.charAt(0).toUpperCase() + climate.slice(1);
  const maintLabel = MAINT_LABELS[maintenance];
  const scenarioTitle = `${climateLabel} Climate - ${maintLabel} Maintenance`;

  sheet.push([scenarioTitle, '', '', '', '']);
  sheet.push(['', '', '', '', '']);
  sheet.push(['Asset', 'Baseline Damage ($M)', 'Ring Bunds Damage ($M)', 'Reduction ($M)', 'Reduction %']);

  for (const asset of ASSET_KEYS) {
    let baselineSum = 0;
    let ringbundsSum = 0;

    for (const rp of RETURN_PERIODS) {
      const key = `${rp}_${climate}_${maintenance}`;
      if (comparisons[key]?.TOTAL?.Dmg) {
        baselineSum += comparisons[key].TOTAL.Dmg[asset].baseline;
        ringbundsSum += comparisons[key].TOTAL.Dmg[asset].ringbunds;
      }
    }

    const reduction = baselineSum - ringbundsSum;
    const pct = baselineSum > 0 ? ((reduction / baselineSum) * 100) : 0;

    sheet.push([
      ASSET_LABELS[asset],
      (baselineSum / 1e6).toFixed(2),
      (ringbundsSum / 1e6).toFixed(2),
      (reduction / 1e6).toFixed(2),
      pct.toFixed(1) + '%'
    ]);
  }

  return sheet;
}

function createEADSheet(climate, maintenance) {
  const sheet = [];
  const climateLabel = climate.charAt(0).toUpperCase() + climate.slice(1);
  const maintLabel = MAINT_LABELS[maintenance];
  const scenarioTitle = `${climateLabel} Climate - ${maintLabel} Maintenance`;
  const eadKey = `${climate}_${maintenance}`;

  sheet.push([scenarioTitle, '', '', '', '']);
  sheet.push(['', '', '', '', '']);
  sheet.push(['District', 'Baseline EAD ($M/year)', 'Ring Bunds EAD ($M/year)', 'Reduction ($M/year)', 'Reduction %']);

  for (const region of REGIONS.filter(r => r !== 'TOTAL')) {
    let baselineSum = 0;
    let ringbundsSum = 0;

    for (const asset of ASSET_KEYS) {
      baselineSum += eadResults[eadKey].baseline[region]?.[asset] || 0;
      ringbundsSum += eadResults[eadKey].ringbunds[region]?.[asset] || 0;
    }

    const reduction = baselineSum - ringbundsSum;
    const pct = baselineSum > 0 ? ((reduction / baselineSum) * 100) : 0;

    sheet.push([
      region,
      (baselineSum / 1e6).toFixed(2),
      (ringbundsSum / 1e6).toFixed(2),
      (reduction / 1e6).toFixed(2),
      pct.toFixed(1) + '%'
    ]);
  }

  return sheet;
}

// ============================================================
// Create sheets for each scenario
// ============================================================

for (const climate of CLIMATES) {
  for (const maintenance of MAINTENANCE) {
    const climateLabel = climate === 'present' ? 'Pres' : 'Fut';
    const maintLabel = maintenance === 'perfect' ? 'Perf' : maintenance === 'breaches' ? 'Br' : 'Red';
    const shortName = `${climateLabel}_${maintLabel}`;

    // Return Period sheet
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(createScenarioSheet(climate, maintenance)), `${shortName}_ByRP`);

    // District sheet
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(createDistrictSheet(climate, maintenance)), `${shortName}_Dist`);

    // Asset sheet
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(createAssetSheet(climate, maintenance)), `${shortName}_Asset`);

    // EAD sheet
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(createEADSheet(climate, maintenance)), `${shortName}_EAD`);
  }
}

// Write Excel file
const excelPath = path.join(OUTPUT_DIR, 'RingBunds_Impact_Analysis.xlsx');
XLSX.writeFile(wb, excelPath);

console.log(`  Generated: ${excelPath}`);
console.log(`  File size: ${(fs.statSync(excelPath).size / 1024).toFixed(0)} KB`);
console.log(`  Sheets: ${wb.SheetNames.length}`);
console.log('\n  Sheets:');
wb.SheetNames.forEach((name, i) => {
  console.log(`    ${i + 1}. ${name}`);
});

console.log('\n=== Excel Generation Complete ===');
console.log('\nNote: Each sheet represents a unique climate × maintenance scenario.');
console.log('Present and Future climates are NOT summed.');
console.log('Different maintenance levels are NOT summed.');
console.log('Each scenario stands alone as a distinct real-world condition.');

/**
 * Parse an Excel file and extract data for all regions and modes
 */
function parseExcelFile(filePath) {
  const wb = XLSX.readFile(filePath);
  const result = {};

  // Only parse the 7 active districts
  const ACTIVE_REGIONS = REGIONS.filter(r => r !== 'TOTAL');

  for (const region of ACTIVE_REGIONS) {
    result[region] = {};

    for (const mode of MODES) {
      let sheetName = `${region}_${mode}`;
      let ws = wb.Sheets[sheetName];

      if (!ws) {
        sheetName = sheetName.slice(0, 31);
        ws = wb.Sheets[sheetName];
      }

      if (!ws) continue;

      const sums = new Array(12).fill(0);
      for (let r = 4; r <= 24; r++) {
        for (let c = 0; c < 12; c++) {
          const cellRef = XLSX.utils.encode_cell({ r: r - 1, c: c + 1 });
          const cell = ws[cellRef];
          sums[c] += (cell && typeof cell.v === 'number') ? cell.v : 0;
        }
      }

      result[region][mode] = {};
      ASSET_KEYS.forEach((k, i) => {
        result[region][mode][k] = Math.round(sums[i] * 100) / 100;
      });
    }
  }

  // Calculate TOTAL as sum of 7 active districts
  result['TOTAL'] = {};
  for (const mode of MODES) {
    result['TOTAL'][mode] = {};
    ASSET_KEYS.forEach(asset => {
      let sum = 0;
      ACTIVE_REGIONS.forEach(d => {
        sum += result[d]?.[mode]?.[asset] || 0;
      });
      result['TOTAL'][mode][asset] = Math.round(sum * 100) / 100;
    });
  }

  return result;
}
