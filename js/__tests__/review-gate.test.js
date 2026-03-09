/**
 * @jest-environment jsdom
 */
// Mock the JSON import before importing the module
const mockReviewData = {
    version: '1.0.0',
    lastUpdated: '2026-02-24',
    calculators: {
        'bmi-bsa': { status: 'approved', reviewDate: '2026-02-20', reviewer: 'Dr. Chen', reviewDocId: 'bmi-bsa', notes: '' },
        'gcs': { status: 'pending', reviewDate: null, reviewer: null, reviewDocId: null, notes: '' },
        'apache-ii': { status: 'conditional', reviewDate: '2026-02-18', reviewer: 'Dr. Lin', reviewDocId: null, notes: 'Needs validation' },
        'meld-na': { status: 'rejected', reviewDate: '2026-02-15', reviewer: 'Dr. Wang', reviewDocId: null, notes: 'Formula error' },
    },
};
jest.mock('../calculator-review-status.json', () => mockReviewData);
import { isCalculatorApproved, getReviewStatus, getReviewEntry, getApprovedCount } from '../review-gate';
describe('review-gate', () => {
    beforeEach(() => {
        // Reset enableAllCalculators before each test
        delete window.MEDCALC_CONFIG;
    });
    describe('isCalculatorApproved', () => {
        it('returns true for approved calculators', () => {
            expect(isCalculatorApproved('bmi-bsa')).toBe(true);
        });
        it('returns false for pending calculators', () => {
            expect(isCalculatorApproved('gcs')).toBe(false);
        });
        it('returns false for conditional calculators', () => {
            expect(isCalculatorApproved('apache-ii')).toBe(false);
        });
        it('returns false for rejected calculators', () => {
            expect(isCalculatorApproved('meld-na')).toBe(false);
        });
        it('returns false for unknown calculator IDs', () => {
            expect(isCalculatorApproved('nonexistent')).toBe(false);
        });
        it('returns true for all calculators when enableAllCalculators is true', () => {
            window.MEDCALC_CONFIG = { enableAllCalculators: true };
            expect(isCalculatorApproved('gcs')).toBe(true);
            expect(isCalculatorApproved('meld-na')).toBe(true);
            expect(isCalculatorApproved('nonexistent')).toBe(true);
        });
        it('does not bypass when enableAllCalculators is false', () => {
            window.MEDCALC_CONFIG = { enableAllCalculators: false };
            expect(isCalculatorApproved('gcs')).toBe(false);
        });
        it('does not bypass when MEDCALC_CONFIG exists but enableAllCalculators is undefined', () => {
            window.MEDCALC_CONFIG = {};
            expect(isCalculatorApproved('gcs')).toBe(false);
        });
    });
    describe('getReviewStatus', () => {
        it('returns correct status for each type', () => {
            expect(getReviewStatus('bmi-bsa')).toBe('approved');
            expect(getReviewStatus('gcs')).toBe('pending');
            expect(getReviewStatus('apache-ii')).toBe('conditional');
            expect(getReviewStatus('meld-na')).toBe('rejected');
        });
        it('returns "pending" for unknown calculator IDs', () => {
            expect(getReviewStatus('nonexistent')).toBe('pending');
        });
    });
    describe('getReviewEntry', () => {
        it('returns full entry for known calculator', () => {
            const entry = getReviewEntry('bmi-bsa');
            expect(entry).toEqual({
                status: 'approved',
                reviewDate: '2026-02-20',
                reviewer: 'Dr. Chen',
                reviewDocId: 'bmi-bsa',
                notes: '',
            });
        });
        it('returns null for unknown calculator', () => {
            expect(getReviewEntry('nonexistent')).toBeNull();
        });
    });
    describe('getApprovedCount', () => {
        it('returns the number of approved calculators', () => {
            expect(getApprovedCount()).toBe(1);
        });
    });
});
