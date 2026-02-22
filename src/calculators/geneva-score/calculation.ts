import type { SimpleCalculateFn, FormulaResultItem } from '../../types/calculator-formula.js';

export const calculateGenevaScore: SimpleCalculateFn = values => {
    let score = 0;

    // Radios (value '1' adds 1 point)
    const radioKeys = [
        'geneva-age',
        'geneva-prev-dvt',
        'geneva-surgery',
        'geneva-malignancy',
        'geneva-limb-pain',
        'geneva-hemoptysis',
        'geneva-palpation'
    ];

    radioKeys.forEach(key => {
        // Since we updated index.ts options, standard weights (1, 2, 3, 4) are now in `value`
        if (values[key] !== '' && values[key] !== undefined && values[key] !== null) {
            score += Number(values[key] || 0);
        }
    });

    // Heart Rate
    const hr =
        values['geneva-hr'] !== '' &&
            values['geneva-hr'] !== undefined &&
            values['geneva-hr'] !== null
            ? Number(values['geneva-hr'])
            : null;

    if (hr !== null) {
        if (hr >= 75 && hr <= 94) {
            score += 3;
        } else if (hr >= 95) {
            score += 5;
        }
    }

    let riskLevel = 'Low Risk';
    let alertClass: 'success' | 'warning' | 'danger' = 'success';
    let prevalence = '7-9%';
    let recommendation =
        'PE unlikely. Consider D-dimer testing.';

    if (score <= 3) {
        riskLevel = 'Low Risk';
        alertClass = 'success';
        prevalence = '7-9%';
        recommendation =
            'PE unlikely. Consider D-dimer testing. If negative, PE can be excluded.';
    } else if (score <= 10) {
        riskLevel = 'Intermediate Risk';
        alertClass = 'warning';
        prevalence = '28%';
        recommendation = 'Consider imaging (CT pulmonary angiography) or age-adjusted D-dimer.';
    } else {
        riskLevel = 'High Risk';
        alertClass = 'danger';
        prevalence = '74%';
        recommendation = 'PE likely. Proceed directly to CT pulmonary angiography.';
    }

    return [
        {
            label: 'Total Score',
            value: score.toString(),
            unit: 'points',
            interpretation: riskLevel,
            alertClass: alertClass
        },
        {
            label: 'PE Prevalence',
            value: prevalence,
            alertClass: alertClass
        },
        {
            label: 'Recommendation',
            value: recommendation, // Not used in display but keeps data
            alertPayload: {
                type: alertClass,
                message: `<strong>Recommendation:</strong> ${recommendation}`
            }
        }
    ];
};
