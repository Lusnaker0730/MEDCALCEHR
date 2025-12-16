import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { calculateIntraopFluid } from './calculation.js';

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

    console.log("Running Intraop Fluid Verification...");
    console.log("------------------------------------------------");

    // Skip header
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        total++;
        const row = lines[i].split(',');
        const inputs = {
            weightKg: parseFloat(row[0]),
            npoHours: parseFloat(row[1]),
            traumaLevel: parseFloat(row[2])
        };

        const expected = {
            maint: parseFloat(row[3]),
            npoDeficit: parseFloat(row[4]),
            first: parseFloat(row[5]),
            second: parseFloat(row[6]),
            third: parseFloat(row[7]),
            fourth: parseFloat(row[8])
        };

        try {
            const result = calculateIntraopFluid(inputs);

            // Check all outputs
            const diffs = [
                Math.abs(result.maintenanceRate - expected.maint),
                Math.abs(result.npoDeficit - expected.npoDeficit),
                Math.abs(result.firstHourFluids - expected.first),
                Math.abs(result.secondHourFluids - expected.second),
                Math.abs(result.thirdHourFluids - expected.third),
                Math.abs(result.fourthHourFluids - expected.fourth)
            ];

            const tolerance = 0.1;
            const maxDiff = Math.max(...diffs);

            if (maxDiff <= tolerance) {
                passed++;
            } else {
                failed++;
                console.error(`[FAIL] Case #${i}: Max Diff ${maxDiff}`);
                console.error(`       Expected: ${JSON.stringify(expected)}`);
                console.error(`       Actual:   ${JSON.stringify(result)}`);
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
