import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { calculateEthanolConcentration } from './calculation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runVerification = () => {
    const datasetPath = path.join(__dirname, 'verification_dataset.csv');

    if (!fs.existsSync(datasetPath)) {
        console.error("Error: Standard verification dataset not found. Please run verify.py first.");
        process.exit(1);
    }

    const content = fs.readFileSync(datasetPath, 'utf8');
    const lines = content.trim().split('\n');
    let passed = 0;
    let failed = 0;
    let total = 0;

    console.log("Running Ethanol Verification...");
    console.log("------------------------------------------------");

    // Skip header
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        total++;
        const row = lines[i].split(',');
        const inputs = {
            volumeMl: parseFloat(row[0]),
            abv: parseFloat(row[1]),
            weightKg: parseFloat(row[2]),
            gender: row[3]
        };
        const expected = parseFloat(row[4]);

        try {
            const result = calculateEthanolConcentration(inputs);
            const actual = result.concentrationMgDl;

            const diff = Math.abs(actual - expected);
            const tolerance = 0.0001;

            if (diff <= tolerance) {
                passed++;
            } else {
                failed++;
                console.error(`[FAIL] Case #${i}: Expected ${expected.toFixed(4)}, Got ${actual.toFixed(4)} (Diff: ${diff})`);
            }
        } catch (e) {
            failed++;
            console.error(`[ERROR] Case #${i}: ${e.message}`);
        }
    }

    console.log("------------------------------------------------");
    console.log(`Verification Complete.`);
    console.log(`Passed: ${passed}/${total}`);

    if (failed === 0) {
        console.log("RESULT: PASS ✅");
        process.exit(0);
    } else {
        console.log("RESULT: FAIL ❌");
        process.exit(1);
    }
};

runVerification();
