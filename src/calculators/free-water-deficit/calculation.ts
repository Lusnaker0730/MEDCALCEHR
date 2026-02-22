import { SimpleCalculateFn } from '../../types/calculator-formula.js';

export const calculateFreeWaterDeficit: SimpleCalculateFn = values => {
    const weight = Number(values['fwd-weight']);
    const sodium = Number(values['fwd-sodium']);
    const desiredSodium = Number(values['fwd-desired-sodium']) || 140;
    const sex = values['fwd-sex'] as string;
    const ageRange = values['fwd-age-range'] as string;

    if (!weight || !sodium || !sex || !ageRange || !desiredSodium) return null;

    // TBW Factor based on gender/age range
    let tbwFactor = 0.6;
    if (ageRange === 'child') {
        tbwFactor = 0.6; // Both male and female children are 0.6
    } else if (ageRange === 'elderly') {
        tbwFactor = sex === 'female' ? 0.45 : 0.5;
    } else { // adult
        tbwFactor = sex === 'female' ? 0.5 : 0.6;
    }

    const tbw = weight * tbwFactor;
    const deficit = tbw * (sodium / desiredSodium - 1);

    // Determine status
    let status = '';
    let alertClass: 'success' | 'warning' | 'danger' | 'info' = 'info';
    let alertMsg = '';

    if (sodium <= desiredSodium) {
        status = 'Not Indicated';
        alertClass = 'warning';
        alertMsg = `Calculation intended for hypernatremia (Na > ${desiredSodium}).`;
    } else {
        status = 'Hypernatremia';
        alertClass = 'danger';
        alertMsg =
            'Sufficient free water should be provided either orally or intravenously (e.g., 5% dextrose) to correct the serum sodium by up to 10 mEq/L in the first 24 hours.';
    }

    return [
        {
            label: 'Free Water Deficit',
            value: deficit > 0 ? deficit.toFixed(1) : '0.0',
            unit: 'Liters',
            interpretation: status,
            alertClass: alertClass
        },
        {
            label: 'Estimated TBW',
            value: tbw.toFixed(1),
            unit: 'Liters'
        },
        {
            label: '__NOTE__',
            value: alertMsg,
            alertClass: alertClass
        }
    ];
};
