/**
 * Script to generate basic tests for calculators that don't have tests yet
 * Usage: node tests/generate-basic-tests.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Calculators that need tests
const calculatorsToTest = [
    'calcium-correction',
    'serum-anion-gap',
    'serum-osmolality',
    'sodium-correction',
    'free-water-deficit',
    'phenytoin-correction',
    'ettETT',
    'maintenance-fluids',
    'intraop-fluid',
    'homa-ir',
    'fib-4',
    'nafld-fibrosis-score',
    'ranson',
    'centor',
    'cpis',
    'kawasaki',
    'pecarn',
    'perc',
    'bacterial-meningitis-score',
    '6mwd',
    'dasi',
    'ariscat',
    'stop-bang',
    'due-date',
    'apgar'
];

const generateBasicTest = (calculatorId, calculatorTitle) => {
    return `import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { cleanupDOM } from './test-helpers.js';
import { ${calculatorId.replace(/-/g, '')} } from '../../js/calculators/${calculatorId}/index.js';

describe('${calculatorTitle} Calculator', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        container.id = 'test-container';
        document.body.appendChild(container);
    });

    afterEach(() => {
        cleanupDOM();
    });

    describe('Module Structure', () => {
        test('should export calculator object', () => {
            expect(${calculatorId.replace(/-/g, '')}).toBeDefined();
            expect(typeof ${calculatorId.replace(/-/g, '')}.generateHTML).toBe('function');
            expect(typeof ${calculatorId.replace(/-/g, '')}.initialize).toBe('function');
        });

        test('should have correct calculator ID', () => {
            expect(${calculatorId.replace(/-/g, '')}.id).toBe('${calculatorId}');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = ${calculatorId.replace(/-/g, '')}.generateHTML();
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include result container', () => {
            const html = ${calculatorId.replace(/-/g, '')}.generateHTML();
            container.innerHTML = html;

            const resultContainer = container.querySelector('.result-container, .result, [id$="-result"]');
            expect(resultContainer).toBeTruthy();
        });
    });

    describe('FHIR Integration', () => {
        test('should work without FHIR client', () => {
            const html = ${calculatorId.replace(/-/g, '')}.generateHTML();
            container.innerHTML = html;

            expect(() => {
                ${calculatorId.replace(/-/g, '')}.initialize(null, null, container);
            }).not.toThrow();
        });
    });

    describe('Basic Functionality', () => {
        beforeEach(() => {
            const html = ${calculatorId.replace(/-/g, '')}.generateHTML();
            container.innerHTML = html;
            ${calculatorId.replace(/-/g, '')}.initialize(null, null, container);
        });

        test('should initialize without errors', () => {
            expect(container.innerHTML.length).toBeGreaterThan(0);
        });

        test('should have input fields', () => {
            const inputs = container.querySelectorAll('input');
            expect(inputs.length).toBeGreaterThan(0);
        });
    });
});
`;
};

// Generate tests for each calculator
calculatorsToTest.forEach(calcId => {
    const testFilePath = path.join(__dirname, 'calculators', `${calcId}.test.js`);
    
    // Only generate if file doesn't exist
    if (!fs.existsSync(testFilePath)) {
        const calculatorTitle = calcId
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        
        const testContent = generateBasicTest(calcId, calculatorTitle);
        fs.writeFileSync(testFilePath, testContent, 'utf8');
        console.log(`✓ Generated test for ${calcId}`);
    } else {
        console.log(`- Test already exists for ${calcId}`);
    }
});

console.log('\n✅ Test generation complete!');

