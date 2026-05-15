/**
 * Ring Bunds Impact Analysis
 *
 * Compares baseline risk with ring bunds scenario to calculate
 * exposure and damage reduction across all scenarios, districts, and assets.
 *
 * Usage: node scripts/analyze-ringbunds-impact.js
 *
 * Outputs:
 * - ringbunds-impact-analysis/comparison.csv
 * - ringbunds-impact-analysis/report.html (self-contained)
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
const MODES = ['Exp', 'Dmg']; // Vul excluded per requirements
const ASSET_KEYS = ['crop', 'buildLow56', 'buildLow44', 'buildHigh', 'telecom', 'electric', 'railways', 'hospitals', 'bhu', 'schools', 'roads', 'hydraulic'];
const ASSET_LABELS = {
  crop: 'Crops',
  buildLow56: 'Kacha Buildings',
  buildLow44: 'Pakka Buildings',
  buildHigh: 'High-Rise Buildings',
  telecom: 'Telecom Towers',
  electric: 'Electric Lines',
  railways: 'Railways',
  hospitals: 'Hospitals',
  bhu: 'BHU',
  schools: 'Schools',
  roads: 'Roads',
  hydraulic: 'Hydraulic Structures'
};
const RETURN_PERIODS = [2.3, 5, 10, 25, 50, 100, 500];

console.log('=== Ring Bunds Impact Analysis ===\n');

// Step 1: Parse all Excel files
console.log('Step 1: Parsing Excel files...');

const baselineData = {};
const ringbundsData = {};
const scenarios = [];

const baselineFiles = fs.readdirSync(RISK_DIR).filter(f => f.match(/Risk_Analysis_T3_.+\.xlsx$/) && !f.includes('ringbunds'));
const ringbundsFiles = fs.readdirSync(RISK_DIR).filter(f => f.includes('ringbunds'));

console.log(`  Found ${baselineFiles.length} baseline files`);
console.log(`  Found ${ringbundsFiles.length} ring bunds files`);

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

const comparisons = [];
const summary = {
  totalBaselineDamage: 0,
  totalRingbundsDamage: 0,
  totalReduction: 0,
  totalReductionPct: 0,
  scenariosAnalyzed: scenarios.length
};

for (const scenario of scenarios) {
  const key = scenario.key;
  const baseline = baselineData[key];
  const ringbunds = ringbundsData[key];

  if (!baseline || !ringbunds) {
    console.warn(`  Missing data for: ${key}`);
    continue;
  }

  for (const region of REGIONS) {
    for (const mode of MODES) {
      for (const asset of ASSET_KEYS) {
        const baselineValue = baseline[region]?.[mode]?.[asset] || 0;
        const ringbundsValue = ringbunds[region]?.[mode]?.[asset] || 0;
        const reduction = baselineValue - ringbundsValue;
        const reductionPct = baselineValue > 0 ? (reduction / baselineValue) * 100 : 0;

        comparisons.push({
          scenario: key,
          returnPeriod: scenario.returnPeriod,
          climate: scenario.climate,
          maintenance: scenario.maintenance,
          region,
          mode,
          asset,
          baselineValue,
          ringbundsValue,
          reduction,
          reductionPct
        });

        // Track summary for damage mode only
        if (mode === 'Dmg' && region === 'TOTAL') {
          summary.totalBaselineDamage += baselineValue;
          summary.totalRingbundsDamage += ringbundsValue;
          summary.totalReduction += reduction;
        }
      }
    }
  }
}

summary.totalReductionPct = summary.totalBaselineDamage > 0
  ? (summary.totalReduction / summary.totalBaselineDamage) * 100
  : 0;

console.log(`  Generated ${comparisons.length} comparison records`);
console.log(`  Total baseline damage: $${(summary.totalBaselineDamage / 1e9).toFixed(2)}B`);
console.log(`  Total ring bunds damage: $${(summary.totalRingbundsDamage / 1e9).toFixed(2)}B`);
console.log(`  Total reduction: $${(summary.totalReduction / 1e9).toFixed(2)}B (${summary.totalReductionPct.toFixed(1)}%)\n`);

// Step 3: Generate CSV
console.log('Step 3: Generating CSV...');

const csvPath = path.join(OUTPUT_DIR, 'comparison.csv');
const csvHeader = 'Scenario,ReturnPeriod,Climate,Maintenance,Region,Mode,Asset,Baseline_Value,RingBunds_Value,Reduction_Absolute,Reduction_Percentage\n';
const csvRows = comparisons.map(c =>
  `${c.scenario},${c.returnPeriod},${c.climate},${c.maintenance},${c.region},${c.mode},${c.asset},` +
  `${c.baselineValue},${c.ringbundsValue},${c.reduction},${c.reductionPct.toFixed(2)}`
);
fs.writeFileSync(csvPath, csvHeader + csvRows.join('\n'));

console.log(`  Saved: ${csvPath}\n`);

// Step 4: Calculate EAD
console.log('Step 4: Calculating EAD...');

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

// Group by climate and maintenance for EAD calculation
const eadData = {};

for (const climate of ['present', 'future']) {
  for (const maintenance of ['perfect', 'breaches', 'redcapacity']) {
    eadData[`${climate}_${maintenance}`] = {
      baseline: {},
      ringbunds: {}
    };

    for (const region of REGIONS) {
      eadData[`${climate}_${maintenance}`].baseline[region] = {};
      eadData[`${climate}_${maintenance}`].ringbunds[region] = {};

      for (const asset of ASSET_KEYS) {
        // Baseline EAD
        const baselineDamages = RETURN_PERIODS.map(rp => {
          const key = `${rp}_${climate}_${maintenance}`;
          return {
            returnPeriod: rp,
            damage: baselineData[key]?.[region]?.['Dmg']?.[asset] || 0
          };
        });
        eadData[`${climate}_${maintenance}`].baseline[region][asset] = calculateEad(baselineDamages);

        // Ring bunds EAD
        const ringbundsDamages = RETURN_PERIODS.map(rp => {
          const key = `${rp}_${climate}_${maintenance}`;
          return {
            returnPeriod: rp,
            damage: ringbundsData[key]?.[region]?.['Dmg']?.[asset] || 0
          };
        });
        eadData[`${climate}_${maintenance}`].ringbunds[region][asset] = calculateEad(ringbundsDamages);
      }
    }
  }
}

console.log('  EAD calculated for all combinations\n');

// Step 5: Generate HTML Report
console.log('Step 5: Generating HTML report...');

const htmlPath = path.join(OUTPUT_DIR, 'report.html');
const logoData = fs.readFileSync(path.join(ROOT, 'public', 'logo.png'), 'base64');

const html = generateHtmlReport(comparisons, eadData, summary, logoData);
fs.writeFileSync(htmlPath, html);

console.log(`  Saved: ${htmlPath}`);
console.log(`  File size: ${(fs.statSync(htmlPath).size / 1024).toFixed(0)} KB\n`);

console.log('=== Analysis Complete ===');
console.log(`Output directory: ${OUTPUT_DIR}/`);
console.log('  - comparison.csv');
console.log('  - report.html');

/**
 * Parse an Excel file and extract data for all regions and modes.
 * IMPORTANT: Always calculates TOTAL from the 7 active districts,
 * never uses the pre-calculated TOTAL sheet from Excel.
 */
function parseExcelFile(filePath) {
  const wb = XLSX.readFile(filePath);
  const result = {};

  // Only parse the 7 active districts (not Naushahro Feroze, Shaheed Benazirabad)
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

  // Calculate TOTAL as sum of 7 active districts (never use Excel's TOTAL sheet)
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

/**
 * Generate self-contained HTML report with embedded Chart.js
 */
function generateHtmlReport(comparisons, eadData, summary, logoData) {
  // Prepare data for charts
  const rpReductions = RETURN_PERIODS.map(rp => {
    const baseline = comparisons
      .filter(c => c.returnPeriod === rp && c.region === 'TOTAL' && c.mode === 'Dmg')
      .reduce((sum, c) => sum + c.baselineValue, 0);
    const ringbunds = comparisons
      .filter(c => c.returnPeriod === rp && c.region === 'TOTAL' && c.mode === 'Dmg')
      .reduce((sum, c) => sum + c.ringbundsValue, 0);
    return {
      rp: rp.toString(),
      baseline: baseline / 1e9,
      ringbunds: ringbunds / 1e9,
      reduction: ((baseline - ringbunds) / baseline * 100).toFixed(1)
    };
  });

  const districtReductions = REGIONS.filter(r => r !== 'TOTAL').map(region => {
    const baseline = comparisons
      .filter(c => c.region === region && c.mode === 'Dmg')
      .reduce((sum, c) => sum + c.baselineValue, 0);
    const ringbunds = comparisons
      .filter(c => c.region === region && c.mode === 'Dmg')
      .reduce((sum, c) => sum + c.ringbundsValue, 0);
    return {
      region,
      baseline: baseline / 1e6,
      ringbunds: ringbunds / 1e6,
      reduction: ((baseline - ringbunds) / baseline * 100).toFixed(1)
    };
  }).sort((a, b) => b.baseline - a.baseline);

  const assetReductions = ASSET_KEYS.map(asset => {
    const baseline = comparisons
      .filter(c => c.asset === asset && c.region === 'TOTAL' && c.mode === 'Dmg')
      .reduce((sum, c) => sum + c.baselineValue, 0);
    const ringbunds = comparisons
      .filter(c => c.asset === asset && c.region === 'TOTAL' && c.mode === 'Dmg')
      .reduce((sum, c) => sum + c.ringbundsValue, 0);
    return {
      asset: ASSET_LABELS[asset],
      baseline: baseline / 1e6,
      ringbunds: ringbunds / 1e6,
      reduction: ((baseline - ringbunds) / baseline * 100).toFixed(1)
    };
  }).sort((a, b) => b.reduction - a.reduction);

  // EAD comparison for Present Perfect
  const eadPresentPerfect = {
    baseline: eadData['present_perfect'].baseline.TOTAL,
    ringbunds: eadData['present_perfect'].ringbunds.TOTAL,
    byAsset: ASSET_KEYS.map(asset => ({
      asset: ASSET_LABELS[asset],
      baseline: eadData['present_perfect'].baseline.TOTAL[asset],
      ringbunds: eadData['present_perfect'].ringbunds.TOTAL[asset],
      reduction: ((eadData['present_perfect'].baseline.TOTAL[asset] - eadData['present_perfect'].ringbunds.TOTAL[asset]) / eadData['present_perfect'].baseline.TOTAL[asset] * 100).toFixed(1)
    })).sort((a, b) => b.baseline - a.baseline)
  };
  eadPresentPerfect.totalBaseline = Object.values(eadPresentPerfect.baseline).reduce((a, b) => a + b, 0);
  eadPresentPerfect.totalRingbunds = Object.values(eadPresentPerfect.ringbunds).reduce((a, b) => a + b, 0);
  eadPresentPerfect.totalReduction = ((eadPresentPerfect.totalBaseline - eadPresentPerfect.totalRingbunds) / eadPresentPerfect.totalBaseline * 100).toFixed(1);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ring Bunds Impact Assessment</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }

    .header { background: white; border-radius: 12px; padding: 30px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header-content { display: flex; align-items: center; gap: 20px; }
    .logo { height: 60px; }
    .header-text h1 { font-size: 28px; color: #0f172a; margin-bottom: 8px; }
    .header-text p { color: #64748b; font-size: 14px; }
    .header-text .date { color: #94a3b8; font-size: 12px; margin-top: 4px; }

    .summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px; }
    .card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .card-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .card-value { font-size: 32px; font-weight: 700; color: #0f172a; margin-top: 8px; }
    .card-value.reduction { color: #10b981; }
    .card-sub { font-size: 12px; color: #94a3b8; margin-top: 4px; }

    .tabs { display: flex; gap: 4px; background: white; border-radius: 12px; padding: 6px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .tab { flex: 1; padding: 12px 20px; border: none; background: transparent; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; color: #64748b; transition: all 0.2s; }
    .tab:hover { background: #f1f5f9; }
    .tab.active { background: #3b82f6; color: white; }
    .tab-content { display: none; }
    .tab-content.active { display: block; }

    .chart-container { background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .chart-title { font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 20px; }
    canvas { width: 100%; }

    .data-table { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow-x: auto; }
    .data-table table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; padding: 12px; border-bottom: 2px solid #e2e8f0; font-size: 12px; color: #64748b; text-transform: uppercase; }
    .data-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .data-table tr:hover { background: #f8fafc; }
    .data-table .number { text-align: right; font-family: 'SF Mono', monospace; }
    .data-table .reduction { color: #10b981; font-weight: 500; }

    .footer { text-align: center; padding: 40px 20px; color: #94a3b8; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-content">
        <img src="data:image/png;base64,${logoData}" alt="Logo" class="logo">
        <div class="header-text">
          <h1>Ring Bunds Impact Assessment</h1>
          <p>Risk reduction analysis for flood protection scenarios in Sindh Province, Pakistan</p>
          <div class="date">Generated: ${new Date().toISOString().split('T')[0]}</div>
        </div>
      </div>
    </div>

    <div class="summary-cards">
      <div class="card">
        <div class="card-label">Total Baseline Damage</div>
        <div class="card-value">$${(summary.totalBaselineDamage / 1e9).toFixed(2)}B</div>
        <div class="card-sub">Across all scenarios</div>
      </div>
      <div class="card">
        <div class="card-label">With Ring Bunds</div>
        <div class="card-value">$${(summary.totalRingbundsDamage / 1e9).toFixed(2)}B</div>
        <div class="card-sub">Protected scenario</div>
      </div>
      <div class="card">
        <div class="card-label">Risk Reduction</div>
        <div class="card-value reduction">$${(summary.totalReduction / 1e9).toFixed(2)}B</div>
        <div class="card-sub">${summary.totalReductionPct.toFixed(1)}% decrease</div>
      </div>
      <div class="card">
        <div class="card-label">Scenarios Analyzed</div>
        <div class="card-value">${summary.scenariosAnalyzed}</div>
        <div class="card-sub">7 RP × 2 climates × 3 maintenance</div>
      </div>
    </div>

    <div class="tabs">
      <button class="tab active" onclick="showTab('overview')">Overview</button>
      <button class="tab" onclick="showTab('damage')">Damage Reduction</button>
      <button class="tab" onclick="showTab('districts')">By District</button>
      <button class="tab" onclick="showTab('assets')">By Asset</button>
      <button class="tab" onclick="showTab('ead')">EAD Analysis</button>
    </div>

    <div id="overview" class="tab-content active">
      <div class="chart-container">
        <div class="chart-title">Damage Reduction by Return Period (Dmg Mode, All Scenarios Avg)</div>
        <canvas id="rpChart"></canvas>
      </div>
      <div class="chart-container">
        <div class="chart-title">Top 5 Districts by Damage Reduction (All Scenarios Sum)</div>
        <canvas id="districtChart"></canvas>
      </div>
    </div>

    <div id="damage" class="tab-content">
      <div class="chart-container">
        <div class="chart-title">Baseline vs Ring Bunds - Damage by Return Period (All Scenarios Avg)</div>
        <canvas id="damageLineChart"></canvas>
      </div>
      <div class="chart-container">
        <div class="chart-title">Damage Reduction Percentage by Return Period</div>
        <canvas id="reductionPctChart"></canvas>
      </div>
    </div>

    <div id="districts" class="tab-content">
      <div class="chart-container">
        <div class="chart-title">District-Level Damage Comparison (All Scenarios Sum, $M)</div>
        <canvas id="districtBarChart"></canvas>
      </div>
    </div>

    <div id="assets" class="tab-content">
      <div class="chart-container">
        <div class="chart-title">Asset-Level Damage Comparison (All Scenarios Sum, $M)</div>
        <canvas id="assetChart"></canvas>
      </div>
    </div>

    <div id="ead" class="tab-content">
      <div class="chart-container">
        <div class="chart-title">Expected Annual Damage (EAD) - Present Perfect Maintenance</div>
        <canvas id="eadChart"></canvas>
      </div>
      <div class="data-table">
        <table>
          <thead>
            <tr>
              <th>Asset</th>
              <th class="number">Baseline EAD</th>
              <th class="number">Ring Bunds EAD</th>
              <th class="number">Reduction</th>
            </tr>
          </thead>
          <tbody>
            ${eadPresentPerfect.byAsset.map(a => `
            <tr>
              <td>${a.asset}</td>
              <td class="number">$${(a.baseline / 1e6).toFixed(2)}M</td>
              <td class="number">$${(a.ringbunds / 1e6).toFixed(2)}M</td>
              <td class="number reduction">${a.reduction}%</td>
            </tr>`).join('')}
          </tbody>
          <tfoot>
            <tr style="font-weight: 700; background: #f8fafc;">
              <td>TOTAL</td>
              <td class="number">$${(eadPresentPerfect.totalBaseline / 1e9).toFixed(3)}B</td>
              <td class="number">$${(eadPresentPerfect.totalRingbunds / 1e9).toFixed(3)}B</td>
              <td class="number reduction">${eadPresentPerfect.totalReduction}%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <div class="footer">
      Flood Risk Assessment - Indus River | Sindh Province, Pakistan<br>
      Report generated using risk analysis data from GeoServer WMS services<br>
      Full data available in <a href="comparison.csv" style="color: #3b82f6;">comparison.csv</a>
    </div>
  </div>

  <script>
    // Simple self-contained chart implementation
    const Chart = (function() {
      function createChart(canvas, config) {
        const data = config.data;
        const type = config.type;
        const yAxisLabel = config.options?.yAxisLabel || '';

        // Set canvas size
        const containerWidth = canvas.parentElement.offsetWidth - 48;
        canvas.width = containerWidth;
        canvas.height = 300;
        canvas.style.width = containerWidth + 'px';
        canvas.style.height = '300px';

        const ctx = canvas.getContext('2d');
        const width = containerWidth;
        const height = 300;

        function draw() {
          ctx.clearRect(0, 0, width, height);
          ctx.font = '12px sans-serif';
          ctx.fillStyle = '#374151';
          ctx.strokeStyle = '#e5e7eb';
          ctx.lineWidth = 1;

          const padding = { top: 30, right: 20, bottom: 60, left: 70 };
          const chartWidth = width - padding.left - padding.right;
          const chartHeight = height - padding.top - padding.bottom;

          const allValues = type === 'bar'
            ? [...data.datasets[0].data, ...data.datasets[1].data]
            : data.datasets[0].data;
          const maxValue = Math.max(...allValues) * 1.1;
          const minValue = Math.min(...allValues);
          const minVal = minValue < 0 ? minValue * 1.1 : 0;

          // Draw grid lines
          ctx.strokeStyle = '#e5e7eb';
          ctx.lineWidth = 1;
          for (let i = 0; i <= 5; i++) {
            const y = padding.top + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();
          }

          // Draw Y-axis labels
          ctx.fillStyle = '#64748b';
          ctx.textAlign = 'right';
          ctx.font = '11px sans-serif';
          for (let i = 0; i <= 5; i++) {
            const y = padding.top + (chartHeight / 5) * i;
            const value = maxValue - ((maxValue - minVal) / 5) * i;
            ctx.fillText(value.toFixed(1), padding.left - 10, y + 4);
          }

          // Draw Y-axis title
          ctx.save();
          ctx.fillStyle = '#374151';
          ctx.font = 'bold 12px sans-serif';
          ctx.translate(15, padding.top + chartHeight / 2);
          ctx.rotate(-Math.PI / 2);
          ctx.fillText(yAxisLabel, 0, 0);
          ctx.restore();

          // Draw axes
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(padding.left, padding.top);
          ctx.lineTo(padding.left, height - padding.bottom);
          ctx.lineTo(width - padding.right, height - padding.bottom);
          ctx.stroke();

          if (type === 'bar') {
            const labels = data.labels;
            const dataset0 = data.datasets[0];
            const dataset1 = data.datasets[1];
            const barWidth = Math.min((chartWidth / labels.length) / 3, 40);

            labels.forEach((label, i) => {
              const x = padding.left + (chartWidth / labels.length) * i;

              const val0 = dataset0.data[i];
              const h0 = (val0 / maxValue) * chartHeight;
              ctx.fillStyle = dataset0.backgroundColor || '#3b82f6';
              ctx.fillRect(x + barWidth * 0.1, height - padding.bottom - h0, barWidth * 0.8, h0);

              const val1 = dataset1.data[i];
              const h1 = (val1 / maxValue) * chartHeight;
              ctx.fillStyle = dataset1.backgroundColor || '#10b981';
              ctx.fillRect(x + barWidth, height - padding.bottom - h1, barWidth * 0.8, h1);

              // X-axis labels
              ctx.fillStyle = '#64748b';
              ctx.textAlign = 'center';
              ctx.font = '11px sans-serif';
              ctx.save();
              ctx.translate(x + barWidth, height - padding.bottom + 15);
              ctx.rotate(-Math.PI / 6);
              ctx.fillText(label, 0, 0);
              ctx.restore();
            });

            // Legend
            ctx.textAlign = 'left';
            ctx.font = '12px sans-serif';
            ctx.fillStyle = dataset0.backgroundColor || '#3b82f6';
            ctx.fillRect(width / 2 - 100, padding.top - 25, 16, 16);
            ctx.fillStyle = '#374151';
            ctx.fillText(dataset0.label, width / 2 - 78, padding.top - 13);

            ctx.fillStyle = dataset1.backgroundColor || '#10b981';
            ctx.fillRect(width / 2 + 20, padding.top - 25, 16, 16);
            ctx.fillStyle = '#374151';
            ctx.fillText(dataset1.label, width / 2 + 42, padding.top - 13);

          } else if (type === 'line') {
            const labels = data.labels;
            const dataset0 = data.datasets[0];
            const dataset1 = data.datasets[1];
            const pointRadius = 5;

            function drawDataset(dataset, color) {
              ctx.strokeStyle = color;
              ctx.fillStyle = color;
              ctx.lineWidth = 3;

              let prevX, prevY;
              dataset.data.forEach((val, i) => {
                const x = padding.left + (chartWidth / (labels.length - 1)) * i;
                const y = height - padding.bottom - (val / maxValue) * chartHeight;

                if (i > 0) {
                  ctx.beginPath();
                  ctx.moveTo(prevX, prevY);
                  ctx.lineTo(x, y);
                  ctx.stroke();
                }

                ctx.beginPath();
                ctx.arc(x, y, pointRadius, 0, Math.PI * 2);
                ctx.fill();

                prevX = x; prevY = y;
              });
            }

            drawDataset(dataset0, dataset0.borderColor || '#3b82f6');
            drawDataset(dataset1, dataset1.borderColor || '#10b981');

            // X-axis labels
            labels.forEach((label, i) => {
              const x = padding.left + (chartWidth / (labels.length - 1)) * i;
              ctx.fillStyle = '#64748b';
              ctx.textAlign = 'center';
              ctx.font = '11px sans-serif';
              ctx.fillText(label, x, height - padding.bottom + 20);
            });

            // Legend
            ctx.textAlign = 'left';
            ctx.font = '12px sans-serif';
            ctx.fillStyle = dataset0.borderColor || '#3b82f6';
            ctx.beginPath();
            ctx.arc(width / 2 - 90, padding.top - 17, pointRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#374151';
            ctx.fillText(dataset0.label, width / 2 - 78, padding.top - 13);

            ctx.fillStyle = dataset1.borderColor || '#10b981';
            ctx.beginPath();
            ctx.arc(width / 2 + 30, padding.top - 17, pointRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#374151';
            ctx.fillText(dataset1.label, width / 2 + 42, padding.top - 13);
          }
        }

        draw();

        return { canvas, resize: draw };
      }

      return { create: createChart };
    })();

    function showTab(tabId) {
      document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
      document.getElementById(tabId).classList.add('active');
      event.target.classList.add('active');

      setTimeout(() => {
        if (tabId === 'overview') initOverviewCharts();
        if (tabId === 'damage') initDamageCharts();
        if (tabId === 'districts') initDistrictChart();
        if (tabId === 'assets') initAssetChart();
        if (tabId === 'ead') initEadChart();
      }, 100);
    }

    const rpData = ${JSON.stringify(rpReductions)};
    const districtData = ${JSON.stringify(districtReductions)};
    const assetData = ${JSON.stringify(assetReductions)};

    function initOverviewCharts() {
      const rpCtx = document.getElementById('rpChart');
      if (rpCtx) {
        Chart.create(rpCtx, {
          type: 'bar',
          data: {
            labels: rpData.map(d => d.rp + 'yr'),
            datasets: [{
              label: 'Baseline',
              data: rpData.map(d => d.baseline),
              backgroundColor: '#3b82f6'
            }, {
              label: 'Ring Bunds',
              data: rpData.map(d => d.ringbunds),
              backgroundColor: '#10b981'
            }]
          },
          options: { responsive: true, yAxisLabel: 'Damage ($B)' }
        });
      }

      const districtCtx = document.getElementById('districtChart');
      if (districtCtx) {
        Chart.create(districtCtx, {
          type: 'bar',
          data: {
            labels: districtData.slice(0, 5).map(d => d.region),
            datasets: [{
              label: 'Baseline',
              data: districtData.slice(0, 5).map(d => d.baseline),
              backgroundColor: '#3b82f6'
            }, {
              label: 'Ring Bunds',
              data: districtData.slice(0, 5).map(d => d.ringbunds),
              backgroundColor: '#10b981'
            }]
          },
          options: { responsive: true, yAxisLabel: 'Damage ($M)' }
        });
      }
    }

    function initDistrictChart() {
      const ctx = document.getElementById('districtBarChart');
      if (ctx) {
        Chart.create(ctx, {
          type: 'bar',
          data: {
            labels: districtData.map(d => d.region),
            datasets: [{
              label: 'Baseline',
              data: districtData.map(d => d.baseline),
              backgroundColor: '#3b82f6'
            }, {
              label: 'Ring Bunds',
              data: districtData.map(d => d.ringbunds),
              backgroundColor: '#10b981'
            }]
          },
          options: { responsive: true, yAxisLabel: 'Damage ($M)' }
        });
      }
    }

    function initDamageCharts() {
      // Damage Line Chart
      const lineCtx = document.getElementById('damageLineChart');
      if (lineCtx) {
        Chart.create(lineCtx, {
          type: 'line',
          data: {
            labels: rpData.map(d => d.rp + 'yr'),
            datasets: [{
              label: 'Baseline',
              data: rpData.map(d => d.baseline),
              borderColor: '#3b82f6'
            }, {
              label: 'Ring Bunds',
              data: rpData.map(d => d.ringbunds),
              borderColor: '#10b981'
            }]
          },
          options: { responsive: true, yAxisLabel: 'Damage ($B)' }
        });
      }

      // Reduction Percentage Chart
      const pctCtx = document.getElementById('reductionPctChart');
      if (pctCtx) {
        Chart.create(pctCtx, {
          type: 'bar',
          data: {
            labels: rpData.map(d => d.rp + 'yr'),
            datasets: [{
              label: 'Reduction %',
              data: rpData.map(d => parseFloat(d.reduction)),
              backgroundColor: '#10b981'
            }]
          },
          options: { responsive: true, yAxisLabel: 'Reduction (%)' }
        });
      }
    }

    function initAssetChart() {
      const ctx = document.getElementById('assetChart');
      if (ctx) {
        Chart.create(ctx, {
          type: 'bar',
          data: {
            labels: assetData.map(d => d.asset),
            datasets: [{
              label: 'Baseline',
              data: assetData.map(d => d.baseline),
              backgroundColor: '#3b82f6'
            }, {
              label: 'Ring Bunds',
              data: assetData.map(d => d.ringbunds),
              backgroundColor: '#10b981'
            }]
          },
          options: { responsive: true, yAxisLabel: 'Damage ($M)' }
        });
      }
    }

    function initEadChart() {
      const ctx = document.getElementById('eadChart');
      const eadData = ${JSON.stringify(eadPresentPerfect.byAsset)};
      if (ctx) {
        Chart.create(ctx, {
          type: 'bar',
          data: {
            labels: eadData.map(d => d.asset),
            datasets: [{
              label: 'Baseline EAD',
              data: eadData.map(d => d.baseline / 1e6),
              backgroundColor: '#3b82f6'
            }, {
              label: 'Ring Bunds EAD',
              data: eadData.map(d => d.ringbunds / 1e6),
              backgroundColor: '#10b981'
            }]
          },
          options: { responsive: true, yAxisLabel: 'EAD ($M/year)' }
        });
      }
    }

    document.addEventListener('DOMContentLoaded', initOverviewCharts);
    window.addEventListener('resize', () => {
      initOverviewCharts();
      initDistrictChart();
      initAssetChart();
      initEadChart();
    });
  </script>
</body>
</html>`;
}
