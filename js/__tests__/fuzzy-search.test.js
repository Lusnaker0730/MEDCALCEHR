import { jest } from '@jest/globals';
const mockLoggerInfo = jest.fn();
const mockLoggerWarn = jest.fn();
const mockLoggerError = jest.fn();
const mockLoggerDebug = jest.fn();
const mockInitSentry = jest.fn();
jest.mock('../logger.js', () => ({ logger: { info: mockLoggerInfo, warn: mockLoggerWarn, error: mockLoggerError, debug: mockLoggerDebug } }));
jest.mock('../sentry.js', () => ({ initSentry: mockInitSentry }));
import { FuzzySearch } from '../fuzzy-search.js';
const sampleCalculators = [
    { id: 'bmi-bsa', title: 'BMI / BSA Calculator', description: 'Calculate body mass index and body surface area', category: 'general' },
    { id: 'apache-ii', title: 'APACHE II Score', description: 'Acute physiology assessment for ICU patients', category: 'critical-care' },
    { id: 'cha2ds2-vasc', title: 'CHA2DS2-VASc Score', description: 'Stroke risk in atrial fibrillation', category: 'cardiology' },
    { id: 'gfr', title: 'eGFR Calculator', description: 'Estimated glomerular filtration rate', category: 'nephrology' },
    { id: 'meld', title: 'MELD Score', description: 'Model for end-stage liver disease severity', category: 'hepatology' },
];
describe('FuzzySearch', () => {
    let fuzzySearch;
    beforeEach(() => {
        fuzzySearch = new FuzzySearch(sampleCalculators);
    });
    it('creates an instance', () => {
        expect(fuzzySearch).toBeDefined();
    });
    it('returns empty array for empty query', () => {
        expect(fuzzySearch.search('')).toEqual([]);
    });
    it('returns empty array for null/undefined query', () => {
        expect(fuzzySearch.search(null)).toEqual([]);
        expect(fuzzySearch.search(undefined)).toEqual([]);
    });
    it('returns empty array for single character query', () => {
        expect(fuzzySearch.search('B')).toEqual([]);
    });
    it('finds exact title matches', () => {
        const results = fuzzySearch.search('BMI');
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].id).toBe('bmi-bsa');
    });
    it('finds fuzzy/typo matches', () => {
        const results = fuzzySearch.search('apche');
        expect(results.length).toBeGreaterThan(0);
        expect(results.some(r => r.id === 'apache-ii')).toBe(true);
    });
    it('finds matches by description', () => {
        const results = fuzzySearch.search('glomerular');
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].id).toBe('gfr');
    });
    it('finds matches by category', () => {
        const results = fuzzySearch.search('cardiology');
        expect(results.length).toBeGreaterThan(0);
        expect(results.some(r => r.id === 'cha2ds2-vasc')).toBe(true);
    });
    it('returns results sorted by relevance', () => {
        const results = fuzzySearch.search('MELD');
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].id).toBe('meld');
    });
    it('returns empty array for completely unrelated query', () => {
        const results = fuzzySearch.search('xyzzyplugh');
        expect(results).toEqual([]);
    });
    it('updateCollection updates the searchable collection', () => {
        const newCalcs = [
            { id: 'new-calc', title: 'Brand New Calculator', description: 'A new one', category: 'general' },
        ];
        fuzzySearch.updateCollection(newCalcs);
        const oldResults = fuzzySearch.search('APACHE');
        expect(oldResults).toEqual([]);
        const newResults = fuzzySearch.search('Brand New');
        expect(newResults.length).toBe(1);
        expect(newResults[0].id).toBe('new-calc');
    });
    it('trims whitespace from query', () => {
        const results = fuzzySearch.search('  BMI  ');
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].id).toBe('bmi-bsa');
    });
});
