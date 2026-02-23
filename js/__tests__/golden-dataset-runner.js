/**
 * Golden Dataset Test Runner
 *
 * Centralized test infrastructure for clinical validation of all calculators.
 * Loads JSON golden datasets and runs parametric tests with tolerance-based assertions.
 *
 * Supports three calculator patterns:
 * - Pattern A (SimpleCalculateFn): Direct formula calculators with flat input objects
 * - Pattern B (ScoringCalculator): Config-based scoring with calculateScoringResult utility
 * - Pattern C (ComplexCalculateFn): Complex calculators using getValue/getStdValue/getRadioValue
 *
 * @module golden-dataset-runner
 */
import * as fs from 'fs';
import * as path from 'path';
// ==========================================
// Loader
// ==========================================
const GOLDEN_DATASETS_DIR = path.join(__dirname, 'golden-datasets');
export function loadGoldenDataset(calculatorId) {
    const filePath = path.join(GOLDEN_DATASETS_DIR, `${calculatorId}.json`);
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
}
export function loadAllGoldenDatasets() {
    if (!fs.existsSync(GOLDEN_DATASETS_DIR)) {
        return [];
    }
    const files = fs.readdirSync(GOLDEN_DATASETS_DIR).filter(f => f.endsWith('.json'));
    return files.map(f => {
        const raw = fs.readFileSync(path.join(GOLDEN_DATASETS_DIR, f), 'utf-8');
        return JSON.parse(raw);
    });
}
// ==========================================
// Value Comparison
// ==========================================
export function compareValues(actual, expected, tolerance, tolerancePercent) {
    // String comparison
    if (typeof expected === 'string' && typeof actual === 'string') {
        const pass = actual === expected;
        return {
            pass,
            message: pass
                ? `Matched: "${actual}"`
                : `Expected "${expected}", got "${actual}"`
        };
    }
    // Numeric comparison with tolerance
    const actualNum = typeof actual === 'string' ? parseFloat(actual) : actual;
    const expectedNum = typeof expected === 'string' ? parseFloat(expected) : expected;
    if (isNaN(actualNum) || isNaN(expectedNum)) {
        // Fallback to string comparison
        const pass = String(actual) === String(expected);
        return {
            pass,
            message: pass
                ? `Matched: "${actual}"`
                : `Expected "${expected}", got "${actual}"`
        };
    }
    // Determine effective tolerance
    let effectiveTolerance = tolerance ?? 0;
    if (tolerancePercent !== undefined && expectedNum !== 0) {
        const percentTol = Math.abs(expectedNum * tolerancePercent / 100);
        effectiveTolerance = Math.max(effectiveTolerance, percentTol);
    }
    // Default tolerance of 0.1 if none specified
    if (tolerance === undefined && tolerancePercent === undefined) {
        effectiveTolerance = 0.1;
    }
    const diff = Math.abs(actualNum - expectedNum);
    const pass = diff <= effectiveTolerance;
    return {
        pass,
        message: pass
            ? `Matched: ${actualNum} (expected ${expectedNum} ± ${effectiveTolerance})`
            : `Expected ${expectedNum} ± ${effectiveTolerance}, got ${actualNum} (diff: ${diff.toFixed(4)})`
    };
}
// ==========================================
// Test Runners
// ==========================================
/**
 * Run golden dataset tests for a SimpleCalculateFn calculator.
 * The calculateFn takes Record<string, number|string|boolean> and returns FormulaResultItem[]|null.
 */
export function runSimpleGoldenTests(dataset, calculateFn) {
    describe(`[Golden Dataset] ${dataset.calculatorName}`, () => {
        dataset.cases.forEach(testCase => {
            test(`${testCase.id}: ${testCase.description}`, () => {
                const results = calculateFn(testCase.inputs);
                expect(results).not.toBeNull();
                expect(results.length).toBeGreaterThanOrEqual(testCase.expected.length);
                testCase.expected.forEach(exp => {
                    const match = results.find(r => r.label === exp.label);
                    expect(match).toBeDefined();
                    if (!match)
                        return;
                    const comparison = compareValues(match.value, exp.value, exp.tolerance, exp.tolerancePercent);
                    expect(comparison.pass).toBe(true);
                    if (!comparison.pass) {
                        // eslint-disable-next-line no-console
                        console.error(`  [${testCase.id}] ${exp.label}: ${comparison.message}`);
                    }
                });
            });
        });
    });
}
/**
 * Run golden dataset tests for a scoring calculator.
 * Uses the calculateScoringResult utility from test-utils.
 */
export function runScoringGoldenTests(dataset, config, calculateScoringResult) {
    describe(`[Golden Dataset] ${dataset.calculatorName}`, () => {
        dataset.cases.forEach(testCase => {
            test(`${testCase.id}: ${testCase.description}`, () => {
                const result = calculateScoringResult(config, testCase.inputs);
                testCase.expected.forEach(exp => {
                    if (exp.label === 'Total Score' || exp.label === 'Score') {
                        const comparison = compareValues(result.totalScore, exp.value, exp.tolerance, exp.tolerancePercent);
                        expect(comparison.pass).toBe(true);
                    }
                    else if (exp.label === 'Risk Level') {
                        expect(result.riskLevel?.label).toBe(exp.value);
                    }
                });
            });
        });
    });
}
/**
 * Run golden dataset tests for a ComplexCalculateFn calculator.
 * Wraps flat inputs into getValue/getStdValue/getRadioValue accessors.
 */
export function runComplexGoldenTests(dataset, calculateFn) {
    describe(`[Golden Dataset] ${dataset.calculatorName}`, () => {
        dataset.cases.forEach(testCase => {
            test(`${testCase.id}: ${testCase.description}`, () => {
                const inputs = testCase.inputs;
                const getValue = (id) => {
                    const v = inputs[id];
                    if (v === undefined || v === null)
                        return null;
                    const n = Number(v);
                    return isNaN(n) ? null : n;
                };
                const getStdValue = (id, _unit) => getValue(id);
                const getRadioValue = (name) => {
                    const v = inputs[name];
                    return v !== undefined ? String(v) : null;
                };
                const getCheckboxValue = (id) => {
                    return inputs[id] === true || inputs[id] === 'true';
                };
                const result = calculateFn(getValue, getStdValue, getRadioValue, getCheckboxValue);
                expect(result).not.toBeNull();
                testCase.expected.forEach(exp => {
                    if (exp.label === 'Score' || exp.label === 'Total Score') {
                        const comparison = compareValues(result.score ?? result.value, exp.value, exp.tolerance, exp.tolerancePercent);
                        expect(comparison.pass).toBe(true);
                    }
                    else if (exp.label === 'Interpretation') {
                        expect(result.interpretation).toContain(exp.value);
                    }
                    else {
                        // Check additionalResults
                        const addResult = result.additionalResults?.find((r) => r.label === exp.label);
                        if (addResult) {
                            const comparison = compareValues(addResult.value, exp.value, exp.tolerance, exp.tolerancePercent);
                            expect(comparison.pass).toBe(true);
                        }
                    }
                });
            });
        });
    });
}
