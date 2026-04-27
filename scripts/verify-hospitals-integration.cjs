#!/usr/bin/env node
/**
 * Verify Hospitals Data Integration Across Dashboard
 */

const data = require('/mnt/d/floodrisk_sferp/public/data/risk.json');
const fs = require('fs');

console.log('='.repeat(70));
console.log('HOSPITALS DATA INTEGRATION VERIFICATION');
console.log('='.repeat(70));

// ============================================================================
// 1. Verify risk.json has hospital data
// ============================================================================
console.log('\n1. RISK.JSON DATA VERIFICATION');
console.log('-'.repeat(70));

const scenarios = ['2.3_present_breaches', '25_present_breaches', '100_present_breaches', '500_present_breaches'];
let hasHospitalData = true;

for (const key of scenarios) {
  const dmg = data.data[key]?.TOTAL?.Dmg?.hospitals ?? 0;
  const exp = data.data[key]?.TOTAL?.Exp?.hospitals ?? 0;
  const vul = data.data[key]?.TOTAL?.Vul?.hospitals ?? 0;

  console.log(`${key}:`);
  console.log(`  Exp (Count):    ${exp}`);
  console.log(`  Vul (Factor):    ${vul.toFixed(4)}`);
  console.log(`  Dmg (PKR):      ${dmg.toLocaleString()}`);

  if (dmg === 0) hasHospitalData = false;
}

console.log(`\n✓ Hospital data present: ${hasHospitalData ? 'YES' : 'NO'}`);

// ============================================================================
// 2. Calculate EAD manually to verify hospitals are included
// ============================================================================
console.log('\n2. EAD CALCULATION VERIFICATION (Present Breaches)');
console.log('-'.repeat(70));

const RETURN_PERIODS = [2.3, 5, 10, 25, 50, 100, 500];

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

// Calculate EAD for hospitals
const hospitalDamages = [];
for (const rp of RETURN_PERIODS) {
  const key = `${rp}_present_breaches`;
  const dmg = data.data[key]?.TOTAL?.Dmg?.hospitals ?? 0;
  hospitalDamages.push({ returnPeriod: rp, damage: dmg });
}

const hospitalEad = calculateEad(hospitalDamages);
console.log(`Hospital EAD: ${hospitalEad.toLocaleString()} PKR/year`);

// Calculate EAD for all other assets
const ASSET_KEYS = ['crop', 'buildLow56', 'buildLow44', 'buildHigh', 'telecom', 'electric', 'railways', 'bhu', 'roads'];
let totalOtherEad = 0;

for (const asset of ASSET_KEYS) {
  const damages = [];
  for (const rp of RETURN_PERIODS) {
    const key = `${rp}_present_breaches`;
    const dmg = data.data[key]?.TOTAL?.Dmg?.[asset] ?? 0;
    damages.push({ returnPeriod: rp, damage: dmg });
  }
  totalOtherEad += calculateEad(damages);
}

const totalEadWithHospitals = totalOtherEad + hospitalEad;
const totalEadWithoutHospitals = totalOtherEad;

console.log(`Other assets EAD: ${totalOtherEad.toLocaleString()} PKR/year`);
console.log(`Total EAD (with hospitals): ${totalEadWithHospitals.toLocaleString()} PKR/year`);
console.log(`Total EAD (without hospitals): ${totalEadWithoutHospitals.toLocaleString()} PKR/year`);
console.log(`Hospital contribution: ${((hospitalEad / totalEadWithHospitals) * 100).toFixed(2)}%`);

// ============================================================================
// 3. Verify EAD includes hospitals in useEadData.ts logic
// ============================================================================
console.log('\n3. CODE VERIFICATION');
console.log('-'.repeat(70));

const eadHook = fs.readFileSync('/mnt/d/floodrisk_sferp/src/components/risk-dashboard/hooks/useEadData.ts', 'utf8');

const usesAssetSubKeys = eadHook.includes('ASSET_SUB_KEYS');
const assetSubKeysHasHospitals = eadHook.includes("'hospitals'") || eadHook.includes('"hospitals"');

console.log(`useEadData.ts uses ASSET_SUB_KEYS: ${usesAssetSubKeys ? 'YES' : 'NO'}`);
console.log(`ASSET_SUB_KEYS includes hospitals: ${assetSubKeysHasHospitals ? 'YES' : 'NO'}`);

// ============================================================================
// 4. Verify DISPLAY_ASSET_KEYS includes hospitals
// ============================================================================
const riskTypes = fs.readFileSync('/mnt/d/floodrisk_sferp/src/types/risk.ts', 'utf8');
const displayKeysMatch = riskTypes.match(/DISPLAY_ASSET_KEYS.*?\[(.*?)\]/s);
const displayKeys = displayKeysMatch ? displayKeysMatch[1] : '';
const includesHospitals = displayKeys.includes("'hospitals'") || displayKeys.includes('"hospitals"');

console.log(`DISPLAY_ASSET_KEYS includes hospitals: ${includesHospitals ? 'YES' : 'NO'}`);

// ============================================================================
// 5. Verify EadBarChart includes hospitals in facilities group
// ============================================================================
const barChart = fs.readFileSync('/mnt/d/floodrisk_sferp/src/components/risk-dashboard/components/EadBarChart.tsx', 'utf8');
const facilitiesGroup = barChart.match(/facilities.*?\[(.*?)\]/s);
const facilitiesAssets = facilitiesGroup ? facilitiesGroup[1] : '';
const facilitiesHasHospitals = facilitiesAssets.includes("'hospitals'") || facilitiesAssets.includes('"hospitals"');

console.log(`EadBarChart facilities group includes hospitals: ${facilitiesHasHospitals ? 'YES' : 'NO'}`);

// ============================================================================
// 6. Summary
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('SUMMARY');
console.log('='.repeat(70));

const allChecks = [
  { name: 'Hospital data in risk.json', pass: hasHospitalData },
  { name: 'Hospital EAD calculated', pass: hospitalEad > 0 },
  { name: 'useEadData uses ASSET_SUB_KEYS', pass: usesAssetSubKeys },
  { name: 'DISPLAY_ASSET_KEYS includes hospitals', pass: includesHospitals },
  { name: 'EadBarChart includes hospitals', pass: facilitiesHasHospitals },
];

const passCount = allChecks.filter(c => c.pass).length;
const totalCount = allChecks.length;

allChecks.forEach(check => {
  console.log(`${check.pass ? '✓' : '✗'} ${check.name}`);
});

console.log(`\nOverall: ${passCount}/${totalCount} checks passed`);

if (passCount === totalCount) {
  console.log('\n✓ Hospitals data is fully integrated across the dashboard!');
} else {
  console.log('\n✗ Some issues found - please review failed checks above.');
}
