import { jest } from '@jest/globals';

const mockLoggerInfo = jest.fn<any>();
const mockLoggerWarn = jest.fn<any>();
const mockLoggerError = jest.fn<any>();
const mockLoggerDebug = jest.fn<any>();
const mockInitSentry = jest.fn<any>();

jest.mock('../logger.js', () => ({ logger: { info: mockLoggerInfo, warn: mockLoggerWarn, error: mockLoggerError, debug: mockLoggerDebug } }));
jest.mock('../sentry.js', () => ({ initSentry: mockInitSentry }));

import { CalculationHistory } from '../calculation-history.js';

describe('CalculationHistory', () => {
    let history: CalculationHistory;

    beforeEach(() => {
        localStorage.clear();
        history = new CalculationHistory();
    });

    it('returns empty array initially', () => {
        expect(history.getEntries()).toEqual([]);
    });

    it('returns 0 count initially', () => {
        expect(history.getEntryCount()).toBe(0);
    });

    it('adds entry with auto-generated timestamp', () => {
        history.addEntry({
            calculatorId: 'bmi-bsa',
            calculatorTitle: 'BMI / BSA Calculator',
            resultSummary: 'BMI: 22.5 kg/m²'
        });

        const entries = history.getEntries();
        expect(entries).toHaveLength(1);
        expect(entries[0].calculatorId).toBe('bmi-bsa');
        expect(entries[0].calculatorTitle).toBe('BMI / BSA Calculator');
        expect(entries[0].resultSummary).toBe('BMI: 22.5 kg/m²');
        expect(entries[0].timestamp).toBeDefined();
        expect(new Date(entries[0].timestamp).getTime()).not.toBeNaN();
    });

    it('prepends new entries (newest first)', () => {
        history.addEntry({ calculatorId: 'first', calculatorTitle: 'First', resultSummary: 'R1' });
        history.addEntry({ calculatorId: 'second', calculatorTitle: 'Second', resultSummary: 'R2' });

        const entries = history.getEntries();
        expect(entries).toHaveLength(2);
        expect(entries[0].calculatorId).toBe('second');
        expect(entries[1].calculatorId).toBe('first');
    });

    it('getEntries respects limit', () => {
        for (let i = 0; i < 10; i++) {
            history.addEntry({ calculatorId: `calc-${i}`, calculatorTitle: `Calc ${i}`, resultSummary: `R${i}` });
        }

        const limited = history.getEntries(3);
        expect(limited).toHaveLength(3);
        expect(limited[0].calculatorId).toBe('calc-9');
    });

    it('clearHistory removes all entries', () => {
        history.addEntry({ calculatorId: 'test', calculatorTitle: 'Test', resultSummary: 'R' });
        expect(history.getEntryCount()).toBe(1);

        history.clearHistory();
        expect(history.getEntryCount()).toBe(0);
        expect(history.getEntries()).toEqual([]);
    });

    it('getEntryCount returns correct count', () => {
        history.addEntry({ calculatorId: 'a', calculatorTitle: 'A', resultSummary: 'R' });
        history.addEntry({ calculatorId: 'b', calculatorTitle: 'B', resultSummary: 'R' });
        history.addEntry({ calculatorId: 'c', calculatorTitle: 'C', resultSummary: 'R' });
        expect(history.getEntryCount()).toBe(3);
    });

    it('setPractitionerId migrates unscoped entries to scoped key', () => {
        history.addEntry({ calculatorId: 'global', calculatorTitle: 'Global', resultSummary: 'R' });
        expect(history.getEntryCount()).toBe(1);

        // Setting practitioner ID migrates unscoped entries into scoped key
        history.setPractitionerId('practitioner-123');
        expect(history.getEntryCount()).toBe(1); // Migrated from unscoped key
        expect(history.getEntries()[0].calculatorId).toBe('global');

        // Unscoped key should be removed after migration
        expect(localStorage.getItem('calculation-history')).toBeNull();

        history.addEntry({ calculatorId: 'scoped', calculatorTitle: 'Scoped', resultSummary: 'R' });
        expect(history.getEntryCount()).toBe(2);
    });

    it('setPractitionerId scopes storage by practitioner', () => {
        history.setPractitionerId('practitioner-456');
        history.addEntry({ calculatorId: 'scoped', calculatorTitle: 'Scoped', resultSummary: 'R' });
        expect(history.getEntryCount()).toBe(1);

        // Switch to different practitioner — should see empty
        history.setPractitionerId('practitioner-789');
        expect(history.getEntryCount()).toBe(0);

        // Switch back — should see original entry
        history.setPractitionerId('practitioner-456');
        expect(history.getEntryCount()).toBe(1);
        expect(history.getEntries()[0].calculatorId).toBe('scoped');
    });

    it('enforces maximum 100 entries', () => {
        for (let i = 0; i < 105; i++) {
            history.addEntry({ calculatorId: `calc-${i}`, calculatorTitle: `Calc ${i}`, resultSummary: `R${i}` });
        }

        const entries = history.getEntries();
        expect(entries).toHaveLength(100);
        // Most recent should be calc-104
        expect(entries[0].calculatorId).toBe('calc-104');
    });

    it('handles corrupted localStorage gracefully', () => {
        localStorage.setItem('calculation-history', 'not-valid-json');
        const entries = history.getEntries();
        expect(entries).toEqual([]);
    });
});
