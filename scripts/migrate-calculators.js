// f:/EHRCALC_2/MEDCALCEHR/scripts/migrate-calculators.js
const fs = require('fs');
const path = require('path');

const calculatorsRoot = path.resolve('f:/EHRCALC_2/MEDCALCEHR/js/calculators');

function migrate(dir) {
    const jsFile = path.join(dir, 'index.js');
    const tsFile = path.join(dir, 'index.ts');
    if (!fs.existsSync(jsFile)) return;
    let content = fs.readFileSync(jsFile, 'utf8');
    // Remove .js extensions from import statements
    content = content.replace(/(import\s+[^'";]+['"])(\.\/[^'";]+)\.js(['"])/g, '$1$2$3');
    // Add type imports if missing
    if (!/Calculator/.test(content)) {
        content = "import { Calculator } from '../../types/calculator';\n" + content;
    }
    if (!/FHIRClient/.test(content) || !/Patient/.test(content)) {
        content = "import { FHIRClient, Patient } from '../../types/fhir';\n" + content;
    }
    // Ensure generateHTML returns string
    content = content.replace(/generateHTML:\s*function\s*\([^)]*\)\s*{/, 'generateHTML: function (): string {');
    // Ensure initialize signature typed
    content = content.replace(/initialize:\s*function\s*\([^)]*\)\s*{/, 'initialize: function (client: FHIRClient | null, patient: Patient | null, container: HTMLElement): void {');
    // Write the .ts file
    fs.writeFileSync(tsFile, content, 'utf8');
    console.log(`Migrated ${jsFile} -> ${tsFile}`);
    // Optionally delete original .js (commented out for safety)
    // fs.unlinkSync(jsFile);
}

fs.readdirSync(calculatorsRoot, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .forEach(d => migrate(path.join(calculatorsRoot, d.name)));

console.log('Migration complete.');
