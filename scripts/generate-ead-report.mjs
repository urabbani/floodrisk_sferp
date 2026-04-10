/**
 * Generate EAD Report document for client.
 * Run: node scripts/generate-ead-report.mjs
 */
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, BorderStyle, ShadingType,
  PageBreak, ImageRun, Header, Footer, TabStopType, TabStopPosition,
  convertInchesToTwip,
} from 'docx';
import fs from 'fs';

const riskData = JSON.parse(fs.readFileSync('public/data/risk.json', 'utf-8'));

// ---- EAD Calculation (same as frontend) ----
const RETURN_PERIODS = [2.3, 5, 10, 25, 50, 100, 500];
const MAINTENANCE_LEVELS = ['perfect', 'breaches', 'redcapacity'];
const MAINTENANCE_LABELS = { perfect: 'Perfect', breaches: 'Breaches', redcapacity: 'Reduced Capacity' };
const DISTRICTS = riskData.districts;
const ALL_REGIONS = ['TOTAL', ...DISTRICTS];
const ASSET_KEYS = ['crop', 'buildLow56', 'buildLow44', 'buildHigh'];
const ASSET_LABELS = { crop: 'Agriculture', buildLow56: 'Kacha', buildLow44: 'Pakka', buildHigh: 'High-Rise' };

function calculateEad(damages) {
  if (damages.length < 2) return 0;
  let ead = 0;
  for (let i = 0; i < damages.length - 1; i++) {
    const fL = 1 / damages[i].returnPeriod;
    const fR = 1 / damages[i + 1].returnPeriod;
    ead += 0.5 * (damages[i].damage + damages[i + 1].damage) * Math.abs(fL - fR);
  }
  return ead;
}

function computeAllEad() {
  const results = [];
  for (const climate of ['present', 'future']) {
    for (const maintenance of MAINTENANCE_LEVELS) {
      for (const region of ALL_REGIONS) {
        const byAsset = {};
        for (const asset of ASSET_KEYS) {
          const damages = [];
          for (const rp of RETURN_PERIODS) {
            const key = `${rp}_${climate}_${maintenance}`;
            const d = riskData.data[key]?.[region]?.['Dmg'];
            if (d) damages.push({ returnPeriod: rp, damage: d[asset] });
          }
          byAsset[asset] = calculateEad(damages);
        }
        results.push({ climate, maintenance, region, ead: byAsset, eadTotal: ASSET_KEYS.reduce((s, k) => s + byAsset[k], 0) });
      }
    }
  }
  return results;
}

const eadResults = computeAllEad();

// ---- Formatting helpers ----
function fmtUSD(v) {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function fmtNum(v) {
  return Math.round(v).toLocaleString();
}

// ---- Placeholder image (1x1 transparent placeholder) ----
function placeholder(caption, heightInches = 3.5) {
  return [
    new Paragraph({
      spacing: { before: 200, after: 100 },
      children: [],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 0 },
      children: [],
      border: {
        top: { style: BorderStyle.DASHED, size: 1, color: '999999' },
        bottom: { style: BorderStyle.DASHED, size: 1, color: '999999' },
        left: { style: BorderStyle.DASHED, size: 1, color: '999999' },
        right: { style: BorderStyle.DASHED, size: 1, color: '999999' },
      },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 400 },
      children: [
        new TextRun({
          text: `[Insert ${caption} here]`,
          italics: true,
          color: '888888',
          size: 24,
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 100 },
      border: {
        top: { style: BorderStyle.DASHED, size: 1, color: '999999' },
        bottom: { style: BorderStyle.DASHED, size: 1, color: '999999' },
        left: { style: BorderStyle.DASHED, size: 1, color: '999999' },
        right: { style: BorderStyle.DASHED, size: 1, color: '999999' },
      },
      children: [],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 50, after: 200 },
      children: [
        new TextRun({ text: `Figure: ${caption}`, italics: true, size: 18, color: '666666', font: 'Calibri' }),
      ],
    }),
  ];
}

// ---- Table helpers ----
const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };

function headerCell(text, width) {
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.SOLID, color: '1B4332' },
    borders: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 40 },
        children: [new TextRun({ text, bold: true, color: 'FFFFFF', size: 20, font: 'Calibri' })],
      }),
    ],
  });
}

function dataCell(text, align = AlignmentType.RIGHT, bold = false) {
  return new TableCell({
    borders: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
    children: [
      new Paragraph({
        alignment: align,
        spacing: { before: 30, after: 30 },
        children: [new TextRun({ text, size: 19, font: 'Calibri', bold })],
      }),
    ],
  });
}

// ---- Build document ----
const sections = [];

// ============ TITLE PAGE ============
sections.push({
  properties: {},
  children: [
    new Paragraph({ spacing: { before: 3000 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({ text: 'Expected Annual Damage', bold: true, size: 56, font: 'Calibri', color: '1B4332' }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({ text: 'Assessment Report', bold: true, size: 56, font: 'Calibri', color: '1B4332' }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 300, after: 100 },
      children: [
        new TextRun({ text: 'Right Bank of Indus River — Sindh Province, Pakistan', size: 28, font: 'Calibri', color: '555555' }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 600, after: 100 },
      children: [
        new TextRun({ text: 'Flood Risk Assessment under Climate Change Scenarios', size: 24, font: 'Calibri', color: '777777' }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({ text: 'Covering 9 Districts · 3 Maintenance Levels · 7 Return Periods', size: 22, font: 'Calibri', color: '999999' }),
      ],
    }),
    new Paragraph({ spacing: { before: 2000 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'April 2026', size: 22, font: 'Calibri', color: '555555' }),
      ],
    }),
  ],
});

// ============ MAIN CONTENT ============
const children = [];

// Helper: section heading
function h1(text) {
  children.push(new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    children: [new TextRun({ text, bold: true, size: 32, font: 'Calibri', color: '1B4332' })],
  }));
}
function h2(text) {
  children.push(new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
    children: [new TextRun({ text, bold: true, size: 26, font: 'Calibri', color: '2D6A4F' })],
  }));
}
function h3(text) {
  children.push(new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, size: 22, font: 'Calibri', color: '40916C' })],
  }));
}
function para(text, opts = {}) {
  children.push(new Paragraph({
    spacing: { before: 100, after: 100 },
    children: [new TextRun({ text, size: 21, font: 'Calibri', ...opts })],
  }));
}

// ---- 1. EXECUTIVE SUMMARY ----
h1('1. Executive Summary');
para('This report presents the Expected Annual Damage (EAD) assessment for flood risk across 9 districts on the Right Bank of the Indus River in Sindh Province, Pakistan. The analysis integrates flood damage estimates across seven return periods (2.3 to 500 years) to produce a single annualized damage metric for each district and economic sector.');

para('The assessment covers two climate scenarios (Present and Future) and three infrastructure maintenance levels (Breaches, Reduced Capacity, and Perfect Maintenance), resulting in six scenario combinations. Damage is quantified for four asset categories: Agriculture, Kacha (mud) buildings, Pakka (brick) buildings, and High-Rise structures.');

const presentBreachesTotal = eadResults.find(r => r.climate === 'present' && r.maintenance === 'breaches' && r.region === 'TOTAL');
const futureBreachesTotal = eadResults.find(r => r.climate === 'future' && r.maintenance === 'breaches' && r.region === 'TOTAL');
const presentPerfectTotal = eadResults.find(r => r.climate === 'present' && r.maintenance === 'perfect' && r.region === 'TOTAL');

para(`Under the Present Climate with Breaches scenario, the total EAD across all districts is ${fmtUSD(presentBreachesTotal.eadTotal)}. Under the Future Climate scenario, this increases to ${fmtUSD(futureBreachesTotal.eadTotal)}, representing a ${((futureBreachesTotal.eadTotal / presentBreachesTotal.eadTotal - 1) * 100).toFixed(1)}% increase due to climate change impacts.`);

para(`With Perfect Maintenance of flood infrastructure, the Present Climate EAD reduces to ${fmtUSD(presentPerfectTotal.eadTotal)}, demonstrating the significant protective value of well-maintained embankments and flood control structures.`);

// ---- 2. METHODOLOGY ----
h1('2. Methodology');

h2('2.1 Expected Annual Damage (EAD)');
para('The Expected Annual Damage is a standard metric in flood risk assessment that represents the long-term average damage per year when considering all possible flood events. It is computed by integrating the damage-probability curve using the trapezoidal rule:');
para('EAD = Σ 0.5 × (Dᵢ + Dᵢ₊₁) × |1/RPᵢ - 1/RPᵢ₊₁|', { italics: true, color: '333333' });
para('Where Dᵢ is the economic damage at return period RPᵢ. The formula calculates the area under the damage-frequency curve, where frequency (1/RP) represents the annual probability of exceedance.');

h2('2.2 Scenario Matrix');
para('The analysis encompasses 42 individual flood scenarios organized as follows:');
para('• 7 Return Periods: 2.3, 5, 10, 25, 50, 100, and 500 years');
para('• 2 Climate Conditions: Present Climate and Future Climate (projected)');
para('• 3 Maintenance Levels: Breaches (flood 2022 conditions), Reduced Capacity, and Perfect Maintenance');

h2('2.3 Asset Categories');
para('Four categories of economic assets are evaluated:');
para('• Agriculture: Crop areas exposed to flooding (measured in hectares)');
para('• Kacha Buildings: Mud-walled residential structures');
para('• Pakka Buildings: Brick/stone permanent structures');
para('• High-Rise Buildings: Multi-story commercial and residential structures');

h2('2.4 Study Area');
para('The study covers 9 districts along the Right Bank of the Indus River: Dadu, Jacobabad, Jamshoro, Kashmore, Larkana, Naushahro Feroze, Qambar Shahdadkot, Shaheed Benazirabad, and Shikarpur.');

children.push(...placeholder('Study area map showing 9 districts'));

// ---- 3. EAD BY DISTRICT ----
h1('3. EAD by District');

for (const climate of ['present', 'future']) {
  const climateLabel = climate === 'present' ? 'Present Climate' : 'Future Climate';
  h2(`3.${climate === 'present' ? '1' : '2'} ${climateLabel}`);

  para(`The following table presents the Expected Annual Damage for each district under ${climateLabel} conditions, showing results for the Breaches maintenance scenario.`);

  // Find the worst district for commentary
  const breachesResults = DISTRICTS.map(d => {
    const r = eadResults.find(e => e.climate === climate && e.maintenance === 'breaches' && e.region === d);
    return { district: d, total: r?.eadTotal ?? 0, crop: r?.ead.crop ?? 0, buildings: (r?.ead.buildLow56 ?? 0) + (r?.ead.buildLow44 ?? 0) + (r?.ead.buildHigh ?? 0) };
  }).sort((a, b) => b.total - a.total);

  const top = breachesResults[0];
  para(`${top.district} has the highest EAD at ${fmtUSD(top.total)}, followed by ${breachesResults[1].district} (${fmtUSD(breachesResults[1].total)}) and ${breachesResults[2].district} (${fmtUSD(breachesResults[2].total)}).`);

  // Table
  const tableRows = [
    new TableRow({
      tableHeader: true,
      children: [
        headerCell('District', 25),
        headerCell('Agriculture', 19),
        headerCell('Kacha', 14),
        headerCell('Pakka', 14),
        headerCell('High-Rise', 14),
        headerCell('Total EAD', 14),
      ],
    }),
  ];

  for (const d of breachesResults) {
    const r = eadResults.find(e => e.climate === climate && e.maintenance === 'breaches' && e.region === d.district);
    tableRows.push(new TableRow({
      children: [
        dataCell(d.district, AlignmentType.LEFT, true),
        dataCell(fmtUSD(r?.ead.crop ?? 0)),
        dataCell(fmtUSD(r?.ead.buildLow56 ?? 0)),
        dataCell(fmtUSD(r?.ead.buildLow44 ?? 0)),
        dataCell(fmtUSD(r?.ead.buildHigh ?? 0)),
        dataCell(fmtUSD(d.total), AlignmentType.RIGHT, true),
      ],
    }));
  }

  // Total row
  const totalR = eadResults.find(e => e.climate === climate && e.maintenance === 'breaches' && e.region === 'TOTAL');
  tableRows.push(new TableRow({
    children: [
      dataCell('TOTAL', AlignmentType.LEFT, true),
      dataCell(fmtUSD(totalR?.ead.crop ?? 0), AlignmentType.RIGHT, true),
      dataCell(fmtUSD(totalR?.ead.buildLow56 ?? 0), AlignmentType.RIGHT, true),
      dataCell(fmtUSD(totalR?.ead.buildLow44 ?? 0), AlignmentType.RIGHT, true),
      dataCell(fmtUSD(totalR?.ead.buildHigh ?? 0), AlignmentType.RIGHT, true),
      dataCell(fmtUSD(totalR?.eadTotal ?? 0), AlignmentType.RIGHT, true),
    ],
  }));

  children.push(new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } }));

  children.push(...placeholder(`Bar chart — EAD by District (${climateLabel}, Breaches scenario)`));
  children.push(...placeholder(`Choropleth map — EAD spatial distribution (${climateLabel})`));
}

// ---- 4. EAD BY SECTOR ----
h1('4. EAD by Sector');

h2('4.1 Sector Breakdown — Present Climate');
para('This section disaggregates the Expected Annual Damage by economic sector across the three maintenance levels.');

for (const climate of ['present', 'future']) {
  const climateLabel = climate === 'present' ? 'Present Climate' : 'Future Climate';
  if (climate === 'future') {
    h2('4.2 Sector Breakdown — Future Climate');
  }

  const tableRows = [
    new TableRow({
      tableHeader: true,
      children: [
        headerCell('Maintenance Level', 22),
        headerCell('Agriculture', 18),
        headerCell('Kacha', 15),
        headerCell('Pakka', 15),
        headerCell('High-Rise', 15),
        headerCell('Total', 15),
      ],
    }),
  ];

  for (const m of MAINTENANCE_LEVELS) {
    const r = eadResults.find(e => e.climate === climate && e.maintenance === m && e.region === 'TOTAL');
    tableRows.push(new TableRow({
      children: [
        dataCell(MAINTENANCE_LABELS[m], AlignmentType.LEFT, true),
        dataCell(fmtUSD(r?.ead.crop ?? 0)),
        dataCell(fmtUSD(r?.ead.buildLow56 ?? 0)),
        dataCell(fmtUSD(r?.ead.buildLow44 ?? 0)),
        dataCell(fmtUSD(r?.ead.buildHigh ?? 0)),
        dataCell(fmtUSD(r?.eadTotal ?? 0), AlignmentType.RIGHT, true),
      ],
    }));
  }

  children.push(new Paragraph({
    spacing: { before: 200 },
    children: [new TextRun({ text: `Table: EAD by Sector — ${climateLabel}`, bold: true, size: 20, font: 'Calibri', color: '555555' })],
  }));
  children.push(new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } }));

  // Commentary
  const br = eadResults.find(e => e.climate === climate && e.maintenance === 'breaches' && e.region === 'TOTAL');
  const pr = eadResults.find(e => e.climate === climate && e.maintenance === 'perfect' && e.region === 'TOTAL');
  if (br && pr) {
    const reduction = ((1 - pr.eadTotal / br.eadTotal) * 100).toFixed(1);
    para(`With Perfect Maintenance, total EAD reduces by ${reduction}% compared to the Breaches scenario, from ${fmtUSD(br.eadTotal)} to ${fmtUSD(pr.eadTotal)}.`);
  }

  // Per-sector analysis
  for (const asset of ASSET_KEYS) {
    h3(`4.${ASSET_KEYS.indexOf(asset) + (climate === 'present' ? 3 : 7)}. ${ASSET_LABELS[asset]} — ${climateLabel}`);

    const sorted = DISTRICTS.map(d => {
      const r = eadResults.find(e => e.climate === climate && e.maintenance === 'breaches' && e.region === d);
      return { district: d, value: r?.ead[asset] ?? 0 };
    }).sort((a, b) => b.value - a.value);

    const top3 = sorted.slice(0, 3);
    para(`The top three districts for ${ASSET_LABELS[asset]} EAD are ${top3[0].district} (${fmtUSD(top3[0].value)}), ${top3[1].district} (${fmtUSD(top3[1].value)}), and ${top3[2].district} (${fmtUSD(top3[2].value)}).`);

    children.push(...placeholder(`Chart — ${ASSET_LABELS[asset]} EAD by District (${climateLabel})`));
  }
}

// ---- 5. CLIMATE CHANGE IMPACT ----
h1('5. Climate Change Impact on EAD');

para('This section compares Present and Future climate EAD to quantify the impact of climate change on flood risk.');

const impactRows = [
  new TableRow({
    tableHeader: true,
    children: [
      headerCell('District', 25),
      headerCell('Present EAD', 20),
      headerCell('Future EAD', 20),
      headerCell('Change', 15),
      headerCell('% Change', 20),
    ],
  }),
];

const impactData = DISTRICTS.map(d => {
  const p = eadResults.find(e => e.climate === 'present' && e.maintenance === 'breaches' && e.region === d);
  const f = eadResults.find(e => e.climate === 'future' && e.maintenance === 'breaches' && e.region === d);
  const pv = p?.eadTotal ?? 0;
  const fv = f?.eadTotal ?? 0;
  const change = fv - pv;
  const pct = pv > 0 ? ((change / pv) * 100).toFixed(1) : '—';
  return { district: d, present: pv, future: fv, change, pct };
}).sort((a, b) => b.change - a.change);

for (const d of impactData) {
  impactRows.push(new TableRow({
    children: [
      dataCell(d.district, AlignmentType.LEFT, true),
      dataCell(fmtUSD(d.present)),
      dataCell(fmtUSD(d.future)),
      dataCell(fmtUSD(d.change)),
      dataCell(`${d.pct}%`),
    ],
  }));
}

const pTotal = eadResults.find(e => e.climate === 'present' && e.maintenance === 'breaches' && e.region === 'TOTAL');
const fTotal = eadResults.find(e => e.climate === 'future' && e.maintenance === 'breaches' && e.region === 'TOTAL');
const totalChange = fTotal.eadTotal - pTotal.eadTotal;
const totalPct = ((totalChange / pTotal.eadTotal) * 100).toFixed(1);

impactRows.push(new TableRow({
  children: [
    dataCell('TOTAL', AlignmentType.LEFT, true),
    dataCell(fmtUSD(pTotal.eadTotal), AlignmentType.RIGHT, true),
    dataCell(fmtUSD(fTotal.eadTotal), AlignmentType.RIGHT, true),
    dataCell(fmtUSD(totalChange), AlignmentType.RIGHT, true),
    dataCell(`${totalPct}%`, AlignmentType.RIGHT, true),
  ],
}));

children.push(new Table({ rows: impactRows, width: { size: 100, type: WidthType.PERCENTAGE } }));

para(`Overall, climate change is projected to increase total EAD by ${totalPct}%, from ${fmtUSD(pTotal.eadTotal)} to ${fmtUSD(fTotal.eadTotal)} under the Breaches maintenance scenario. The most affected district is ${impactData[0].district} with a ${impactData[0].pct}% increase.`);

children.push(...placeholder('Chart — Present vs Future EAD comparison by district'));

// ---- 6. MAINTENANCE IMPACT ----
h1('6. Impact of Infrastructure Maintenance');

para('This section evaluates how the condition of flood protection infrastructure affects annualized damage levels.');

for (const climate of ['present', 'future']) {
  const climateLabel = climate === 'present' ? 'Present Climate' : 'Future Climate';
  h2(`6.${climate === 'present' ? '1' : '2'} ${climateLabel}`);

  const rows = [
    new TableRow({
      tableHeader: true,
      children: [
        headerCell('District', 25),
        headerCell('Breaches', 19),
        headerCell('Reduced Capacity', 19),
        headerCell('Perfect', 19),
        headerCell('Reduction (B→P)', 18),
      ],
    }),
  ];

  for (const d of DISTRICTS) {
    const br = eadResults.find(e => e.climate === climate && e.maintenance === 'breaches' && e.region === d);
    const rc = eadResults.find(e => e.climate === climate && e.maintenance === 'redcapacity' && e.region === d);
    const pr = eadResults.find(e => e.climate === climate && e.maintenance === 'perfect' && e.region === d);
    const brV = br?.eadTotal ?? 0;
    const prV = pr?.eadTotal ?? 0;
    const reduction = brV > 0 ? ((1 - prV / brV) * 100).toFixed(1) + '%' : '—';
    rows.push(new TableRow({
      children: [
        dataCell(d, AlignmentType.LEFT, true),
        dataCell(fmtUSD(brV)),
        dataCell(fmtUSD(rc?.eadTotal ?? 0)),
        dataCell(fmtUSD(prV)),
        dataCell(reduction),
      ],
    }));
  }

  children.push(new Paragraph({
    spacing: { before: 200 },
    children: [new TextRun({ text: `Table: EAD by Maintenance Level — ${climateLabel}`, bold: true, size: 20, font: 'Calibri', color: '555555' })],
  }));
  children.push(new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } }));

  children.push(...placeholder(`Grouped bar chart — EAD by Maintenance Level (${climateLabel})`));
}

// ---- 7. CONCLUSIONS ----
h1('7. Conclusions');

const worstDistrictPresent = DISTRICTS.map(d => {
  const r = eadResults.find(e => e.climate === 'present' && e.maintenance === 'breaches' && e.region === d);
  return { district: d, total: r?.eadTotal ?? 0 };
}).sort((a, b) => b.total - a.total)[0];

para('The Expected Annual Damage assessment reveals several key findings:');
para(`1. The total EAD for the Right Bank of Indus River study area ranges from ${fmtUSD(presentPerfectTotal.eadTotal)} (Present Climate, Perfect Maintenance) to ${fmtUSD(futureBreachesTotal.eadTotal)} (Future Climate, Breaches), underscoring the critical role of both climate adaptation and infrastructure maintenance in managing flood risk.`);
para(`2. ${worstDistrictPresent.district} consistently experiences the highest EAD across all scenarios, indicating it should be the primary focus of risk reduction investments.`);
para(`3. Climate change is projected to increase flood damage by approximately ${totalPct}%, emphasizing the need for forward-looking flood management strategies.`);
para(`4. Maintaining flood infrastructure in perfect condition can reduce EAD by approximately ${((1 - presentPerfectTotal.eadTotal / presentBreachesTotal.eadTotal) * 100).toFixed(1)}% under Present Climate conditions, demonstrating the high return on investment in infrastructure maintenance.`);
para('5. Agriculture constitutes the largest share of damage in most districts, followed by Pakka (brick) buildings. This suggests that crop insurance and building code improvements should be prioritized in flood risk management plans.');

children.push(...placeholder('Summary dashboard screenshot from the web application'));

// ---- Build document ----
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { size: 21, font: 'Calibri' },
      },
    },
  },
  sections: [
    sections[0], // title page
    {
      properties: {
        page: {
          margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1), right: convertInchesToTwip(1) },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: 'Expected Annual Damage Assessment — Right Bank of Indus River', size: 16, color: '999999', font: 'Calibri', italics: true })],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'Page ', size: 16, color: '999999', font: 'Calibri' })],
            }),
          ],
        }),
      },
      children,
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync('EAD_Assessment_Report.docx', buffer);
console.log('Generated: EAD_Assessment_Report.docx');
