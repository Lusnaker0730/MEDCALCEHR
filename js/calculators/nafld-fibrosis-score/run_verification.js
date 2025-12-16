import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { calculateNAFLDScore } from './calculation.js';

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
    const header = lines[0].split(',');

    let passed = 0;
    let failed = 0;
    let total = 0;

    console.log("Running Verification against Golden Dataset...");
    console.log("------------------------------------------------");

    // Skip header
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        total++;
        const row = lines[i].split(',');
        const inputs = {
            age: parseFloat(row[0]),
            bmi: parseFloat(row[1]),
            diabetes: parseInt(row[2]),
            ast: parseFloat(row[3]),
            alt: parseFloat(row[4]),
            platelet: parseFloat(row[5]),
            albumin: parseFloat(row[6])
        };
        const expectedScore = parseFloat(row[7]);

        try {
            const result = calculateNAFLDScore(inputs);
            const actualScore = result.score;

            // Tolerance check (floating point)
            const diff = Math.abs(actualScore - expectedScore);
            const tolerance = 0.0001;

            if (diff <= tolerance) {
                passed++;
            } else {
                failed++;
                console.error(`[FAIL] Case #${i}: Expected ${expectedScore.toFixed(4)}, Got ${actualScore.toFixed(4)} (Diff: ${diff})`);
                console.error(`       Inputs: ${JSON.stringify(inputs)}`);
            }
        } catch (e) {
            failed++;
            console.error(`[ERROR] Case #${i}: Exception thrown - ${e.message}`);
        }
    }

    console.log("------------------------------------------------");
    console.log(`Verification Complete.`);
    console.log(`Total Cases: ${total}`);
    console.log(`Passed:      ${passed}`);
    console.log(`Failed:      ${failed}`);

    if (failed === 0) {
        console.log("RESULT: PASS ✅");
        process.exit(0);
    } else {
        console.log("RESULT: FAIL ❌");
        process.exit(1);
    }
};

runVerification();
