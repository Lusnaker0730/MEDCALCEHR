import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { guptaMica } from '../../js/calculators/gupta-mica/index.js';

describe('Gupta MICA Score', () => {
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
            expect(guptaMica).toBeDefined();
            expect(typeof guptaMica.generateHTML).toBe('function');
            expect(typeof guptaMica.initialize).toBe('function');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = guptaMica.generateHTML();
            expect(html).toBeDefined();
            expect(html.length).toBeGreaterThan(0);
        });
    });

    describe('Initialization', () => {
        test('should initialize without errors', () => {
            container.innerHTML = guptaMica.generateHTML();
            expect(() => guptaMica.initialize(null, null, container)).not.toThrow();
        });
    });
});

