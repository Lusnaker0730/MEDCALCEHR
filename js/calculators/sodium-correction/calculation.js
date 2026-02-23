// Sodium correction factors
const KATZ_FACTOR = 1.6; // Katz (1973): 0.016 per mg/dL = 1.6 per 100 mg/dL
const HILLIER_FACTOR = 2.4; // Hillier (1999): 0.024 per mg/dL = 2.4 per 100 mg/dL
export const calculateSodiumCorrection = (values) => {
    const measuredSodium = values['measured-sodium'];
    const glucose = values['glucose'];
    if (measuredSodium === undefined ||
        measuredSodium === null ||
        measuredSodium === '' ||
        glucose === undefined ||
        glucose === null ||
        glucose === '') {
        return null;
    }
    const na = Number(measuredSodium);
    const glc = Number(glucose);
    if (isNaN(na) || isNaN(glc))
        return null;
    // Formula: Corrected Na = Measured Na + factor * (Glucose - 100) / 100
    const katzCorrected = na + KATZ_FACTOR * ((glc - 100) / 100);
    const hillierCorrected = na + HILLIER_FACTOR * ((glc - 100) / 100);
    const getInterpretation = (val) => {
        if (val < 136)
            return { interpretation: 'Hyponatremia', alertClass: 'warning' };
        if (val > 145)
            return { interpretation: 'Hypernatremia', alertClass: 'danger' };
        return { interpretation: 'Normal', alertClass: 'success' };
    };
    const katzInterp = getInterpretation(katzCorrected);
    const hillierInterp = getInterpretation(hillierCorrected);
    return [
        {
            label: 'Corrected Sodium (Katz, 1973)',
            value: Number(katzCorrected.toFixed(1)),
            unit: 'mEq/L',
            interpretation: katzInterp.interpretation,
            alertClass: katzInterp.alertClass
        },
        {
            label: 'Corrected Sodium (Hillier, 1999)',
            value: Number(hillierCorrected.toFixed(1)),
            unit: 'mEq/L',
            interpretation: hillierInterp.interpretation,
            alertClass: hillierInterp.alertClass
        }
    ];
};
