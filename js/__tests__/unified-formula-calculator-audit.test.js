/**
 * Tests for audit logging integration in unified-formula-calculator.
 *
 * Verifies that successful calculations trigger debounced audit events,
 * failed calculations trigger immediate audit events, and audit failures
 * do not break calculator functionality.
 */
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { createUnifiedFormulaCalculator } from '../calculators/shared/unified-formula-calculator';
import { auditEventService } from '../audit-event-service';
// Mock auditEventService.logCalculation
jest.mock('../audit-event-service', () => {
    const logCalculation = jest.fn().mockResolvedValue(undefined);
    return {
        auditEventService: { logCalculation },
        AuditEventService: jest.fn()
    };
});
// Mock fhir-data-service
jest.mock('../fhir-data-service', () => ({
    fhirDataService: {
        initialize: jest.fn(),
        isReady: jest.fn().mockReturnValue(false),
        getPatientAge: jest.fn().mockReturnValue(null),
        getPatientGender: jest.fn().mockReturnValue(null)
    },
    FieldDataRequirement: {}
}));
// Mock security
jest.mock('../security', () => ({
    sanitizeHTML: (html) => html,
    escapeHTML: (html) => html,
    secureLocalStore: jest.fn(),
    secureLocalRetrieve: jest.fn()
}));
// Mock security-labels-service
jest.mock('../security-labels-service', () => ({
    securityLabelsService: {
        detectSensitivities: jest.fn().mockReturnValue([])
    }
}));
describe('Unified Formula Calculator — Audit Integration', () => {
    let container;
    const mockLogCalculation = auditEventService.logCalculation;
    beforeEach(() => {
        jest.useFakeTimers();
        mockLogCalculation.mockClear();
        mockLogCalculation.mockResolvedValue(undefined);
        container = document.createElement('div');
        document.body.appendChild(container);
    });
    afterEach(() => {
        jest.useRealTimers();
        document.body.removeChild(container);
    });
    /**
     * Helper: create a simple calculator, render it, initialize, and return the container.
     * The calculator has a single numeric input "val" and returns [{label: 'Result', value: 'OK'}]
     * whenever the value is a valid number.
     */
    function setupSimpleCalculator(options) {
        const calc = createUnifiedFormulaCalculator({
            id: 'test-calc',
            title: 'Test Calculator',
            description: 'A test calculator',
            inputs: [
                { type: 'number', id: 'val', label: 'Value', required: true, min: 0, max: 1000 }
            ],
            calculate: options?.calculate ?? ((values) => {
                return [{ label: 'Result', value: String(values.val * 2) }];
            })
        });
        container.innerHTML = calc.generateHTML();
        calc.initialize({}, {}, container);
        return calc;
    }
    /**
     * Helper: create a complex calculator.
     */
    function setupComplexCalculator(options) {
        const calc = createUnifiedFormulaCalculator({
            id: 'test-complex',
            title: 'Test Complex Calculator',
            description: 'A test complex calculator',
            mode: 'complex',
            sections: [
                {
                    title: 'Input',
                    fields: [
                        { type: 'number', id: 'score', label: 'Score', required: true, min: 0, max: 100 }
                    ]
                }
            ],
            complexCalculate: options?.complexCalculate ?? ((getValue) => {
                const s = getValue('score');
                if (s === null)
                    return null;
                return { score: s, interpretation: s > 50 ? 'High' : 'Low', severity: 'info' };
            })
        });
        container.innerHTML = calc.generateHTML();
        calc.initialize({}, {}, container);
        return calc;
    }
    function setInputValue(id, value) {
        const input = container.querySelector(`[id="${id}"]`);
        if (input) {
            input.value = value;
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }
    // ======================================================================
    // Test 1: Successful calculation triggers logCalculation (debounced)
    // ======================================================================
    it('should call logCalculation after debounce for a successful simple calculation', () => {
        setupSimpleCalculator();
        setInputValue('val', '42');
        // Before debounce expires — should NOT have been called
        expect(mockLogCalculation).not.toHaveBeenCalled();
        // Advance timers past the 2-second debounce
        jest.advanceTimersByTime(2100);
        expect(mockLogCalculation).toHaveBeenCalledTimes(1);
        expect(mockLogCalculation).toHaveBeenCalledWith('test-calc', 'Test Calculator', expect.objectContaining({ val: 42 }), expect.objectContaining({ Result: '84' }), true);
    });
    // ======================================================================
    // Test 2: Debounce merges multiple rapid calculations into one audit event
    // ======================================================================
    it('should debounce multiple rapid calculations into a single audit event', () => {
        setupSimpleCalculator();
        // Simulate typing: 1, 12, 123
        setInputValue('val', '1');
        jest.advanceTimersByTime(500);
        setInputValue('val', '12');
        jest.advanceTimersByTime(500);
        setInputValue('val', '123');
        // Only 1 second has passed since last input — should not fire yet
        jest.advanceTimersByTime(1500);
        expect(mockLogCalculation).not.toHaveBeenCalled();
        // Now past 2 seconds since last input
        jest.advanceTimersByTime(600);
        expect(mockLogCalculation).toHaveBeenCalledTimes(1);
        // Should log the LAST calculation's values
        expect(mockLogCalculation).toHaveBeenCalledWith('test-calc', 'Test Calculator', expect.objectContaining({ val: 123 }), expect.objectContaining({ Result: '246' }), true);
    });
    // ======================================================================
    // Test 3: Failed calculation triggers immediate logCalculation(success=false)
    // ======================================================================
    it('should call logCalculation immediately (no debounce) on calculation failure', () => {
        setupSimpleCalculator({
            calculate: () => { throw new Error('Calculation failed'); }
        });
        setInputValue('val', '42');
        // Should be called immediately without waiting for debounce
        expect(mockLogCalculation).toHaveBeenCalledTimes(1);
        expect(mockLogCalculation).toHaveBeenCalledWith('test-calc', 'Test Calculator', expect.objectContaining({ val: 42 }), expect.objectContaining({ error: 'Error: Calculation failed' }), false);
    });
    // ======================================================================
    // Test 4: Audit failure does not break calculator functionality
    // ======================================================================
    it('should not break calculation when audit logging fails', () => {
        mockLogCalculation.mockRejectedValue(new Error('Audit service down'));
        setupSimpleCalculator();
        setInputValue('val', '10');
        // Advance past debounce
        jest.advanceTimersByTime(2100);
        // logCalculation was called (and rejected), but calculator should still show results
        expect(mockLogCalculation).toHaveBeenCalledTimes(1);
        const resultBox = container.querySelector('.ui-result-content');
        expect(resultBox).toBeTruthy();
        // The result should still be rendered (value * 2 = 20)
        expect(resultBox.textContent).toContain('20');
    });
    // ======================================================================
    // Test 5: Complex calculator success triggers debounced audit
    // ======================================================================
    it('should call logCalculation after debounce for a successful complex calculation', () => {
        setupComplexCalculator();
        setInputValue('score', '75');
        expect(mockLogCalculation).not.toHaveBeenCalled();
        jest.advanceTimersByTime(2100);
        expect(mockLogCalculation).toHaveBeenCalledTimes(1);
        expect(mockLogCalculation).toHaveBeenCalledWith('test-complex', 'Test Complex Calculator', expect.objectContaining({ score: 75 }), expect.objectContaining({ score: 75, interpretation: 'High' }), true);
    });
    // ======================================================================
    // Test 6: Complex calculator failure triggers immediate audit
    // ======================================================================
    it('should call logCalculation immediately on complex calculation failure', () => {
        setupComplexCalculator({
            complexCalculate: () => { throw new Error('Complex calc error'); }
        });
        setInputValue('score', '50');
        expect(mockLogCalculation).toHaveBeenCalledTimes(1);
        expect(mockLogCalculation).toHaveBeenCalledWith('test-complex', 'Test Complex Calculator', {}, expect.objectContaining({ error: 'Error: Complex calc error' }), false);
    });
});
