import type { SimpleCalculateFn, FormulaResultItem } from '../../types/calculator-formula.js';

// Point scoring logic - corrected to match reference image
const getPoints = {
    sbp: (v: number): number => {
        if (v < 60) return 28;
        if (v < 70) return 26;
        if (v < 80) return 24;
        if (v < 90) return 23;
        if (v < 100) return 21;
        if (v < 110) return 19;
        if (v < 120) return 17;
        if (v < 130) return 15;
        if (v < 140) return 13;
        if (v < 150) return 11;
        if (v < 160) return 9;
        if (v < 170) return 8;
        if (v < 180) return 6;
        if (v < 190) return 4;
        if (v < 200) return 2;
        return 0; // >= 200
    },
    bun: (v: number): number => {
        if (v <= 9) return 0;
        if (v < 20) return 2;
        if (v < 30) return 4;
        if (v < 40) return 6;
        if (v < 50) return 8;
        if (v < 60) return 9;
        if (v < 70) return 11;
        if (v < 80) return 13;
        if (v < 90) return 15;
        if (v < 100) return 17;
        if (v < 110) return 19;
        if (v < 120) return 21;
        if (v < 130) return 23;
        if (v < 140) return 25;
        if (v < 150) return 27;
        return 28; // >= 150
    },
    sodium: (v: number): number => {
        if (v <= 130) return 4;
        if (v <= 133) return 3;
        if (v <= 136) return 2;
        if (v <= 138) return 1;
        return 0; // >= 139
    },
    age: (v: number): number => {
        if (v < 20) return 0;
        if (v < 30) return 3;
        if (v < 40) return 6;
        if (v < 50) return 8;
        if (v < 60) return 11;
        if (v < 70) return 14;
        if (v < 80) return 17;
        if (v < 90) return 19;
        if (v < 100) return 22;
        if (v < 110) return 25;
        return 28; // >= 110
    },
    hr: (v: number): number => {
        if (v <= 79) return 0;
        if (v <= 84) return 1;
        if (v <= 89) return 3;
        if (v <= 94) return 4;
        if (v <= 99) return 5;
        if (v <= 104) return 6;
        return 8; // >= 105
    }
};

const getMortality = (score: number): string => {
    if (score <= 33) return '<1%';
    if (score <= 50) return '1-5%';
    if (score <= 57) return '5-10%';
    if (score <= 61) return '10-15%';
    if (score <= 65) return '15-20%';
    if (score <= 70) return '20-30%';
    if (score <= 74) return '30-40%';
    if (score <= 78) return '40-50%';
    return '>50%';
};

export const calculateGwtgHf: SimpleCalculateFn = values => {
    const parseInput = (val: string | number | boolean | undefined | null): number | null => {
        if (val === undefined || val === null || val === '' || typeof val === 'boolean')
            return null;
        const num = Number(val);
        return isNaN(num) ? null : num;
    };

    const sbp = parseInput(values['gwtg-sbp']);
    const bun = parseInput(values['gwtg-bun']);
    const sodium = parseInput(values['gwtg-sodium']);
    const age = parseInput(values['gwtg-age']);
    const hr = parseInput(values['gwtg-hr']);

    if (sbp === null || bun === null || sodium === null || age === null || hr === null) {
        return [];
    }

    let score = 0;
    score += getPoints.sbp(sbp);
    score += getPoints.bun(bun);
    score += getPoints.sodium(sodium);
    score += getPoints.age(age);
    score += getPoints.hr(hr);

    // COPD: Yes = +2, No = 0
    const copd = values['copd'] as string | null;
    // Race: Black = 0, Not Black = +3
    const race = values['race'] as string | null;

    if (copd) score += parseInt(copd, 10);
    if (race) score += parseInt(race, 10);

    const mortality = getMortality(score);

    let riskLevel = 'Low Risk';
    let alertType: 'success' | 'warning' | 'danger' = 'success';

    if (score >= 75) {
        riskLevel = 'High Risk';
        alertType = 'danger';
    } else if (score >= 62) {
        riskLevel = 'Moderate Risk';
        alertType = 'warning';
    } else if (score >= 34) {
        riskLevel = 'Low-Moderate Risk';
        alertType = 'warning';
    }

    return [
        {
            label: 'GWTG-HF Score',
            value: score.toString(),
            unit: 'points',
            interpretation: riskLevel,
            alertClass: alertType
        },
        {
            label: 'In-hospital Mortality',
            value: mortality,
            alertClass: alertType
        }
    ];
};
