// Growth Chart Calculation Functions
import type { TaiwanPercentileDataPoint } from './taiwan-data.js';

/**
 * Growth data point interface
 */
export interface GrowthDataPoint {
    ageMonths: number;
    value: number;
    unit?: string;
}

/**
 * Growth data collection
 */
export interface GrowthData {
    height: GrowthDataPoint[];
    weight: GrowthDataPoint[];
}

/**
 * Interpolate between two reference data points at a given age.
 * Returns an interpolated data point with all percentile values.
 */
function interpolateReference(
    ageMonths: number,
    data: TaiwanPercentileDataPoint[]
): TaiwanPercentileDataPoint | null {
    if (!data || data.length === 0) return null;

    // Exact match
    const exact = data.find(d => d.Agemos === ageMonths);
    if (exact) return exact;

    // Before first data point or after last
    if (ageMonths < data[0].Agemos - 3 || ageMonths > data[data.length - 1].Agemos + 6) {
        return null;
    }

    // Clamp to range
    if (ageMonths <= data[0].Agemos) return data[0];
    if (ageMonths >= data[data.length - 1].Agemos) return data[data.length - 1];

    // Find surrounding points
    let lower = data[0];
    let upper = data[data.length - 1];
    for (let i = 0; i < data.length - 1; i++) {
        if (data[i].Agemos <= ageMonths && data[i + 1].Agemos >= ageMonths) {
            lower = data[i];
            upper = data[i + 1];
            break;
        }
    }

    // Linear interpolation factor
    const t = (ageMonths - lower.Agemos) / (upper.Agemos - lower.Agemos);

    return {
        Agemos: ageMonths,
        P3: lower.P3 + t * (upper.P3 - lower.P3),
        P15: lower.P15 + t * (upper.P15 - lower.P15),
        P25: lower.P25 + t * (upper.P25 - lower.P25),
        P50: lower.P50 + t * (upper.P50 - lower.P50),
        P75: lower.P75 + t * (upper.P75 - lower.P75),
        P85: lower.P85 + t * (upper.P85 - lower.P85),
        P97: lower.P97 + t * (upper.P97 - lower.P97)
    };
}

/**
 * Calculate Z-score using reference data with interpolation.
 * Supports LMS method (if L/M/S available) or percentile-based estimation.
 * @param ageMonths - Age in months
 * @param value - Measurement value
 * @param referenceData - Growth reference data array
 * @returns Z-score or null if calculation not possible
 */
export function calculateZScore(
    ageMonths: number,
    value: number,
    referenceData: TaiwanPercentileDataPoint[]
): number | null {
    if (!referenceData || referenceData.length === 0) {
        return null;
    }

    if (value <= 0) {
        return null;
    }

    // Interpolate to get reference values at exact age
    const refPoint = interpolateReference(ageMonths, referenceData);
    if (!refPoint) {
        return null;
    }

    // Method 1: LMS if available (for future compatibility)
    if (
        refPoint.L !== undefined &&
        refPoint.M !== undefined &&
        refPoint.S !== undefined
    ) {
        const L = refPoint.L;
        const M = refPoint.M;
        const S = refPoint.S;

        if (Math.abs(L) < 0.01) {
            return Math.log(value / M) / S;
        } else {
            return (Math.pow(value / M, L) - 1) / (L * S);
        }
    }

    // Method 2: Percentile-based SD estimation
    const p50 = refPoint.P50;
    if (p50 === undefined) {
        return null;
    }

    // Use P3/P97 for SD estimation: Z(P3)=-1.881, Z(P97)=+1.881
    const p3 = refPoint.P3;
    const p97 = refPoint.P97;
    if (p3 === undefined || p97 === undefined) {
        return null;
    }

    const sdEstimate = (p97 - p3) / (2 * 1.881);
    if (sdEstimate <= 0) {
        return null;
    }

    return (value - p50) / sdEstimate;
}

/**
 * Estimate percentile from Z-score (Taiwan percentile set)
 * @param zscore - Z-score value
 * @returns Percentile string or empty string
 */
export function estimatePercentile(zscore: number | null): string {
    if (zscore === null) {
        return '';
    }

    // Taiwan percentiles: 3, 15, 25, 50, 75, 85, 97
    if (zscore <= -1.881) return '<3';
    if (zscore <= -1.036) return '3';
    if (zscore <= -0.674) return '15';
    if (zscore <= 0) return '25';
    if (zscore <= 0.674) return '50';
    if (zscore <= 1.036) return '75';
    if (zscore <= 1.881) return '85';
    return '>97';
}

/**
 * Calculate BMI data from height and weight measurements
 * @param heightData - Array of height measurements
 * @param weightData - Array of weight measurements
 * @returns Array of BMI data points
 */
export function calculateBmiData(
    heightData: GrowthDataPoint[],
    weightData: GrowthDataPoint[]
): GrowthDataPoint[] {
    if (heightData.length === 0 || weightData.length === 0) {
        return [];
    }

    const bmiData: GrowthDataPoint[] = [];

    weightData.forEach(w => {
        const closestHeight = heightData.reduce((prev, curr) =>
            Math.abs(curr.ageMonths - w.ageMonths) < Math.abs(prev.ageMonths - w.ageMonths)
                ? curr
                : prev
        );

        if (Math.abs(closestHeight.ageMonths - w.ageMonths) < 0.5) {
            const heightInMeters = closestHeight.value / 100;
            if (heightInMeters > 0) {
                const bmi = w.value / (heightInMeters * heightInMeters);
                bmiData.push({ ageMonths: w.ageMonths, value: bmi });
            }
        }
    });

    return bmiData;
}

/**
 * Calculate growth velocity between last two measurements
 * @param type - Measurement type label
 * @param measurements - Array of measurements
 * @param unit - Unit string for display
 * @param multiplier - Value multiplier (e.g., 1000 for kg to g)
 * @returns HTML string for velocity display
 */
export function calculateVelocity(
    type: string,
    measurements: GrowthDataPoint[],
    unit: string,
    multiplier = 1
): string {
    if (measurements.length < 2) {
        return '';
    }

    const recent = measurements.slice(-2);
    const timeDiff = recent[1].ageMonths - recent[0].ageMonths;
    const valueDiff = (recent[1].value - recent[0].value) * multiplier;

    if (timeDiff <= 0) {
        return '';
    }

    const velocity = valueDiff / timeDiff;
    const timeStr = timeDiff < 2 ? `${timeDiff.toFixed(1)} month` : `${timeDiff.toFixed(1)} months`;

    return `
        <div class="velocity-item">
            <strong>${type} Velocity:</strong>
            <div class="velocity-value ${velocity > 0 ? 'text-success' : 'text-danger'}">
                ${velocity > 0 ? '+' : ''}${velocity.toFixed(1)} ${unit}
            </div>
            <small class="text-muted">over last ${timeStr}</small>
        </div>
    `;
}

/**
 * Format age in months to human-readable string
 * @param ageMonths - Age in months
 * @returns Formatted age string (e.g., "2y 3m" or "5m")
 */
export function formatAge(ageMonths: number): string {
    const years = Math.floor(ageMonths / 12);
    const months = Math.round(ageMonths % 12);
    return years > 0 ? `${years}y ${months}m` : `${months}m`;
}
