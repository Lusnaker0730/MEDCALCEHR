// src/review-gate.ts
// Clinical review gating module for TFDA/IEC 62304 compliance.
// All calculators are blocked by default until explicitly approved.
import reviewData from './calculator-review-status.json';
const data = reviewData;
/**
 * Check if a calculator is approved for clinical use.
 * Returns true only for 'approved' status.
 * Dev bypass: window.MEDCALC_CONFIG?.enableAllCalculators === true (dev mode only)
 */
export function isCalculatorApproved(id) {
    // Dev-only bypass (disabled in production builds)
    if (__DEV__ && window.MEDCALC_CONFIG?.enableAllCalculators === true) {
        return true;
    }
    const entry = data.calculators[id];
    return entry?.status === 'approved';
}
/**
 * Get the review status string for a calculator.
 * Returns 'pending' if the calculator is not found in the registry.
 */
export function getReviewStatus(id) {
    const entry = data.calculators[id];
    return entry?.status ?? 'pending';
}
/**
 * Get the full review entry for a calculator.
 * Returns null if the calculator is not in the registry.
 */
export function getReviewEntry(id) {
    return data.calculators[id] ?? null;
}
/**
 * Get the count of approved calculators.
 */
export function getApprovedCount() {
    return Object.values(data.calculators).filter(e => e.status === 'approved').length;
}
