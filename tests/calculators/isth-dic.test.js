import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { isthDic } from '../../js/calculators/isth-dic/index.js';

describe('ISTH DIC Score', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        cleanupDOM();
    });

    describe('Module Structure', () => {
        test('should export calculator object', () => {
            expect(isthDic).toBeDefined();
            expect(typeof isthDic.generateHTML).toBe('function');
            expect(typeof isthDic.initialize).toBe('function');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = isthDic.generateHTML();
            expect(html).toBeDefined();
            expect(html.length).toBeGreaterThan(0);
        });
    });

    describe('Initialization', () => {
        test('should initialize without errors', () => {
            container.innerHTML = isthDic.generateHTML();
            expect(() => isthDic.initialize(null, null, container)).not.toThrow();
        });
    });
});

