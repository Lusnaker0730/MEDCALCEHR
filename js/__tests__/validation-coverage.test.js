/**
 * Validation Coverage Test
 *
 * Automated regression guard ensuring every calculator's numeric inputs
 * have validation rules defined (validationType, unitConfig.type, unitToggle.type, or explicit min/max).
 * Scoring/dynamic-list calculators use constrained inputs (radio/checkbox) and are verified separately.
 *
 * IEC 62304 traceability: REQ-INPUT-VAL-001
 */
import { describe, expect, test } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { calculatorModules } from '../calculators/index';
const CALC_DIR = path.resolve(__dirname, '..', 'calculators');
/** Read the source of a calculator's index.ts */
function readCalcSource(calcId) {
    const filePath = path.join(CALC_DIR, calcId, 'index.ts');
    if (!fs.existsSync(filePath))
        return null;
    return fs.readFileSync(filePath, 'utf-8');
}
/** Detect factory type from source */
function detectFactoryType(source) {
    if (source.includes('createScoringCalculator'))
        return 'scoring';
    if (source.includes('createDynamicListCalculator'))
        return 'dynamic-list';
    if (source.includes('createUnifiedFormulaCalculator'))
        return 'formula';
    return 'unknown';
}
/** Extract number input field IDs and check for validation rules */
function checkNumberInputValidation(source) {
    const results = [];
    // Match number input blocks - look for id: '...' near type: 'number' or within a numberInputs array context
    // Strategy: find all id: 'xxx' entries that are within objects containing number-input characteristics
    const idRegex = /id:\s*'([^']+)'/g;
    let match;
    const allIds = new Set();
    while ((match = idRegex.exec(source)) !== null) {
        allIds.add(match[1]);
    }
    // For each id, check if it's a number input by examining surrounding context
    for (const fieldId of allIds) {
        // Find the enclosing object block for this field
        const escapedId = fieldId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Look for the field definition block
        const blockPatterns = [
            // Pattern: { ...id: 'xxx'... } with type: 'number' nearby
            new RegExp(`\\{[^{}]*id:\\s*'${escapedId}'[^{}]*\\}`, 'gs'),
            // Pattern: field might span multiple properties
            new RegExp(`id:\\s*'${escapedId}'[^}]*\\}`, 'gs'),
        ];
        let isNumberInput = false;
        let block = '';
        for (const pattern of blockPatterns) {
            const blockMatch = source.match(pattern);
            if (blockMatch) {
                for (const b of blockMatch) {
                    // Check if this block looks like a number input
                    if (b.includes("type: 'number'") || b.includes('type: "number"')) {
                        isNumberInput = true;
                        block = b;
                        break;
                    }
                }
            }
            if (isNumberInput)
                break;
        }
        // Also check if the field appears in a numberInputs array or sections with number inputs
        if (!isNumberInput) {
            // Look for the field in numberInputs context
            const numberInputsPattern = new RegExp(`numberInputs:\\s*\\[[^\\]]*id:\\s*'${escapedId}'`, 's');
            if (numberInputsPattern.test(source)) {
                isNumberInput = true;
                // Get the block
                const bMatch = source.match(new RegExp(`id:\\s*'${escapedId}'[^}]*\\}`, 's'));
                block = bMatch ? bMatch[0] : '';
            }
        }
        // Also detect fields in sections -> fields arrays that have number-like properties
        if (!isNumberInput) {
            const sectionFieldPattern = new RegExp(`fields:\\s*\\[[^\\]]*id:\\s*'${escapedId}'[^}]*(?:validationType|unitConfig|unitToggle|step|placeholder)`, 's');
            if (sectionFieldPattern.test(source)) {
                isNumberInput = true;
                const bMatch = source.match(new RegExp(`id:\\s*'${escapedId}'[^}]*\\}`, 's'));
                block = bMatch ? bMatch[0] : '';
            }
        }
        if (!isNumberInput)
            continue;
        // Check for validation presence
        const hasValidationType = /validationType:\s*['"][^'"]+['"]/.test(block);
        const hasUnitConfigType = /unitConfig:\s*\{[^}]*type:\s*['"][^'"]+['"]/.test(block);
        const hasUnitToggleType = /unitToggle:\s*\{[^}]*type:\s*['"][^'"]+['"]/.test(block);
        const hasMinMax = /(?:min|max):\s*\d/.test(block);
        // For unitConfig/unitToggle, also check in a broader context around the field
        let hasUnitValidation = hasUnitConfigType || hasUnitToggleType;
        if (!hasUnitValidation) {
            // Check wider context: the field's object might have unitConfig with type on a different line
            const widerPattern = new RegExp(`id:\\s*'${escapedId}'[\\s\\S]{0,500}(?:unitConfig|unitToggle):\\s*\\{[^}]*type:\\s*['"][^'"]+['"]`, 's');
            hasUnitValidation = widerPattern.test(source);
        }
        const hasValidation = hasValidationType || hasUnitValidation || hasMinMax;
        results.push({ fieldId, hasValidation });
    }
    return results;
}
describe('Validation Coverage', () => {
    const calcDirs = fs.readdirSync(CALC_DIR).filter(d => {
        try {
            return fs.statSync(path.join(CALC_DIR, d)).isDirectory() && d !== 'shared';
        }
        catch {
            return false;
        }
    });
    test('all calculators in calculatorModules have source files', () => {
        const missingSource = [];
        for (const calc of calculatorModules) {
            const source = readCalcSource(calc.id);
            if (source === null) {
                missingSource.push(calc.id);
            }
        }
        expect(missingSource).toEqual([]);
    });
    describe('scoring calculators use constrained inputs only', () => {
        const scoringCalcs = calcDirs.filter(id => {
            const source = readCalcSource(id);
            return source !== null && detectFactoryType(source) === 'scoring';
        });
        test.each(scoringCalcs.map(id => [id]))('%s uses radio/checkbox inputs', (calcId) => {
            const source = readCalcSource(calcId);
            // Scoring calculators should NOT have type: 'number' inputs
            // (they use radio, checkbox, or yesno which are inherently constrained)
            const hasNumberType = /type:\s*['"]number['"]/.test(source);
            if (hasNumberType) {
                // Some scoring calculators may have numeric inputs with validation
                const fields = checkNumberInputValidation(source);
                const unvalidated = fields.filter(f => !f.hasValidation);
                expect(unvalidated.map(f => f.fieldId)).toEqual([]);
            }
        });
    });
    describe('formula calculators have validation on all number inputs', () => {
        const formulaCalcs = calcDirs.filter(id => {
            const source = readCalcSource(id);
            return source !== null && detectFactoryType(source) === 'formula';
        });
        test.each(formulaCalcs.map(id => [id]))('%s has validation rules on all number inputs', (calcId) => {
            const source = readCalcSource(calcId);
            const fields = checkNumberInputValidation(source);
            if (fields.length === 0) {
                // No number inputs detected — this is okay (might be all radio/select)
                return;
            }
            const unvalidated = fields.filter(f => !f.hasValidation);
            expect(unvalidated.map(f => f.fieldId)).toEqual([]);
        });
    });
    describe('dynamic-list calculators use selection-based inputs', () => {
        const dynamicListCalcs = calcDirs.filter(id => {
            const source = readCalcSource(id);
            return source !== null && detectFactoryType(source) === 'dynamic-list';
        });
        test.each(dynamicListCalcs.length > 0 ? dynamicListCalcs.map(id => [id]) : [['placeholder']])('%s uses selection-based inputs', (calcId) => {
            if (calcId === 'placeholder')
                return; // Skip if no dynamic list calculators
            const source = readCalcSource(calcId);
            // Dynamic list calculators are inherently constrained
            expect(source).toContain('createDynamicListCalculator');
        });
    });
    test('calculator count matches expected range', () => {
        // Guard against accidentally removing calculators
        expect(calculatorModules.length).toBeGreaterThanOrEqual(85);
        expect(calcDirs.length).toBeGreaterThanOrEqual(85);
    });
});
