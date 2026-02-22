import { AlertSeverity } from '../../types/calculator-base.js';
import { FormulaResultItem } from '../../types/calculator-formula.js';

const NORMAL_AG = 12; // mEq/L
const NORMAL_BICARB = 24; // mEq/L
const NORMAL_ALBUMIN = 4; // g/dL
const ALBUMIN_CORRECTION_FACTOR = 2.5;

function getDeltaRatioInterpretation(deltaRatio: number): {
    interpretation: string;
    alertClass: AlertSeverity;
} {
    if (deltaRatio < 0.4) {
        return { interpretation: 'Pure normal anion gap acidosis', alertClass: 'info' };
    } else if (deltaRatio < 0.8) {
        return {
            interpretation: 'Mixed high and normal anion gap acidosis',
            alertClass: 'warning'
        };
    } else if (deltaRatio <= 2.0) {
        return { interpretation: 'Pure anion gap acidosis', alertClass: 'warning' };
    } else {
        return {
            interpretation: 'High anion gap acidosis with pre-existing metabolic alkalosis',
            alertClass: 'danger'
        };
    }
}

export function serumAnionGapCalculation(
    values: Record<string, number | string | boolean>
): FormulaResultItem[] {
    const naInput = values['sag-na'];
    const clInput = values['sag-cl'];
    const hco3Input = values['sag-hco3'];
    const albuminInput = values['sag-albumin'];

    if (
        naInput === undefined || naInput === null || naInput === '' ||
        clInput === undefined || clInput === null || clInput === '' ||
        hco3Input === undefined || hco3Input === null || hco3Input === ''
    ) {
        return [];
    }

    const na = Number(naInput);
    const cl = Number(clInput);
    const hco3 = Number(hco3Input);

    if (isNaN(na) || isNaN(cl) || isNaN(hco3)) {
        return [];
    }

    // 1. Anion Gap = Na - (Cl + HCO3)
    const anionGap = na - (cl + hco3);

    // 2. Delta Gap = Anion Gap - Normal Anion Gap (12)
    const deltaGap = anionGap - NORMAL_AG;

    // 3. Delta Ratio = Delta Gap / (24 - HCO3)
    const hco3Diff = NORMAL_BICARB - hco3;
    const deltaRatio = hco3Diff !== 0 ? deltaGap / hco3Diff : null;

    const results: FormulaResultItem[] = [];

    // Anion Gap interpretation
    let agInterpretation = '';
    let agAlertClass: AlertSeverity = 'success';
    if (anionGap > NORMAL_AG) {
        agInterpretation = 'High Anion Gap';
        agAlertClass = 'danger';
    } else if (anionGap < 6) {
        agInterpretation = 'Low Anion Gap';
        agAlertClass = 'warning';
    } else {
        agInterpretation = 'Normal';
        agAlertClass = 'success';
    }

    results.push({
        label: 'Anion Gap',
        value: Number(anionGap.toFixed(1)),
        unit: 'mEq/L',
        interpretation: agInterpretation,
        alertClass: agAlertClass,
        alertPayload: {
            alertMsg:
                anionGap > NORMAL_AG
                    ? 'High anion gap suggests metabolic acidosis (MUDPILES: Methanol, Uremia, DKA, Propylene glycol, Isoniazid, Lactic acidosis, Ethylene glycol, Salicylates).'
                    : anionGap < 6
                        ? 'Low anion gap is uncommon. Consider lab error, hypoalbuminemia, or paraproteinemia.'
                        : 'Anion gap is within normal range (6–12 mEq/L).'
        }
    });

    results.push({
        label: 'Delta Gap',
        value: Number(deltaGap.toFixed(1)),
        unit: 'mEq/L',
        interpretation: `Anion Gap – Normal AG (${NORMAL_AG})`,
        alertClass: 'info'
    });

    if (deltaRatio !== null) {
        const { interpretation: drInterp, alertClass: drAlertClass } =
            getDeltaRatioInterpretation(deltaRatio);
        results.push({
            label: 'Delta Ratio',
            value: Number(deltaRatio.toFixed(2)),
            unit: '',
            interpretation: drInterp,
            alertClass: drAlertClass
        });
    }

    // Albumin-corrected results (only if albumin is provided)
    if (albuminInput !== undefined && albuminInput !== null && albuminInput !== '') {
        const albumin = Number(albuminInput);
        if (!isNaN(albumin)) {
            // Albumin-corrected AG = AG + [2.5 × (4 - albumin)]
            const correctedAG = anionGap + ALBUMIN_CORRECTION_FACTOR * (NORMAL_ALBUMIN - albumin);
            const correctedDeltaGap = correctedAG - NORMAL_AG;
            const correctedDeltaRatio = hco3Diff !== 0 ? correctedDeltaGap / hco3Diff : null;

            let correctedAgInterp = 'Normal';
            let correctedAgAlertClass: AlertSeverity = 'success';
            if (correctedAG > NORMAL_AG) {
                correctedAgInterp = 'High (Albumin-corrected)';
                correctedAgAlertClass = 'danger';
            } else if (correctedAG < 6) {
                correctedAgInterp = 'Low (Albumin-corrected)';
                correctedAgAlertClass = 'warning';
            }

            results.push({
                label: 'Albumin-corrected Anion Gap',
                value: Number(correctedAG.toFixed(1)),
                unit: 'mEq/L',
                interpretation: correctedAgInterp,
                alertClass: correctedAgAlertClass
            });

            results.push({
                label: 'Albumin-corrected Delta Gap',
                value: Number(correctedDeltaGap.toFixed(1)),
                unit: 'mEq/L',
                interpretation: `Corrected AG – Normal AG (${NORMAL_AG})`,
                alertClass: 'info'
            });

            if (correctedDeltaRatio !== null) {
                const { interpretation: cdrInterp, alertClass: cdrAlertClass } =
                    getDeltaRatioInterpretation(correctedDeltaRatio);
                results.push({
                    label: 'Albumin-corrected Delta Ratio',
                    value: Number(correctedDeltaRatio.toFixed(2)),
                    unit: '',
                    interpretation: cdrInterp,
                    alertClass: cdrAlertClass
                });
            }
        }
    }

    return results;
}
