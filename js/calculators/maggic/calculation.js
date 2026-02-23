// MAGGIC Score - all discrete integer point tables per reference image
function getEfPoints(ef) {
    if (ef < 20)
        return 7;
    if (ef < 25)
        return 6;
    if (ef < 30)
        return 5;
    if (ef < 35)
        return 3;
    if (ef < 40)
        return 2;
    return 0; // >= 40
}
function getBmiPoints(bmi) {
    if (bmi < 15)
        return 6;
    if (bmi < 20)
        return 5;
    if (bmi < 25)
        return 3;
    if (bmi < 30)
        return 2;
    return 0; // >= 30
}
function getCreatininePoints(creatUmol) {
    // creatinine in µmol/L
    if (creatUmol < 90)
        return 0;
    if (creatUmol < 110)
        return 1;
    if (creatUmol < 130)
        return 2;
    if (creatUmol < 150)
        return 3;
    if (creatUmol < 170)
        return 4;
    if (creatUmol < 210)
        return 5;
    if (creatUmol < 250)
        return 6;
    return 8; // >= 250
}
function getSbpExtraPoints(sbp, ef) {
    if (ef < 30) {
        if (sbp < 110)
            return 5;
        if (sbp < 120)
            return 4;
        if (sbp < 130)
            return 3;
        if (sbp < 140)
            return 2;
        if (sbp < 150)
            return 1;
        return 0; // >= 150
    }
    else if (ef < 40) {
        // EF 30-39
        if (sbp < 110)
            return 3;
        if (sbp < 120)
            return 2;
        if (sbp < 130)
            return 1;
        if (sbp < 140)
            return 1;
        return 0; // >= 140
    }
    else {
        // EF >= 40
        if (sbp < 110)
            return 2;
        if (sbp < 120)
            return 1;
        if (sbp < 130)
            return 1;
        return 0; // >= 130
    }
}
function getAgeExtraPoints(age, ef) {
    if (ef < 30) {
        if (age < 55)
            return 0;
        if (age < 60)
            return 1;
        if (age < 65)
            return 2;
        if (age < 70)
            return 4;
        if (age < 75)
            return 6;
        if (age < 80)
            return 8;
        return 10; // >= 80
    }
    else if (ef < 40) {
        // EF 30-39
        if (age < 55)
            return 0;
        if (age < 60)
            return 2;
        if (age < 65)
            return 4;
        if (age < 70)
            return 6;
        if (age < 75)
            return 8;
        if (age < 80)
            return 10;
        return 13; // >= 80
    }
    else {
        // EF >= 40
        if (age < 55)
            return 0;
        if (age < 60)
            return 3;
        if (age < 65)
            return 5;
        if (age < 70)
            return 7;
        if (age < 75)
            return 9;
        if (age < 80)
            return 12;
        return 15; // >= 80
    }
}
const getMortality = (score) => {
    const linearPredictor = 0.047 * (score - 21.6);
    const prob1yr = 1 - Math.pow(0.92, Math.exp(linearPredictor));
    const prob3yr = 1 - Math.pow(0.79, Math.exp(linearPredictor));
    return { prob1yr: (prob1yr * 100).toFixed(1), prob3yr: (prob3yr * 100).toFixed(1) };
};
export const calculateMaggic = values => {
    const getFloat = (key) => {
        const val = values[key];
        if (val === null || val === undefined || val === '')
            return null;
        return typeof val === 'string' ? parseFloat(val) : typeof val === 'number' ? val : null;
    };
    const getString = (key) => values[key] || '';
    const age = getFloat('maggic-age');
    const ef = getFloat('maggic-ef');
    const sbp = getFloat('maggic-sbp');
    const bmi = getFloat('maggic-bmi');
    const creatinineMgDl = getFloat('maggic-creatinine');
    const nyha = values['maggic-nyha'] ? getString('maggic-nyha') : null;
    if (age === null ||
        ef === null ||
        sbp === null ||
        bmi === null ||
        creatinineMgDl === null ||
        nyha === null) {
        return [];
    }
    // Convert creatinine from mg/dL to µmol/L (1 mg/dL = 88.4 µmol/L)
    const creatinineUmol = creatinineMgDl * 88.4;
    let score = 0;
    // Discrete point tables
    score += getEfPoints(ef);
    score += getBmiPoints(bmi);
    score += getCreatininePoints(creatinineUmol);
    score += getSbpExtraPoints(sbp, ef);
    score += getAgeExtraPoints(age, ef);
    // Radio values (binary risk factors + NYHA class)
    const radios = [
        'maggic-gender',
        'maggic-smoker',
        'maggic-nyha',
        'maggic-diabetes',
        'maggic-copd',
        'maggic-hfdx',
        'maggic-bb',
        'maggic-acei'
    ];
    radios.forEach(name => {
        const val = values[name];
        if (val !== null && val !== undefined && val !== '') {
            score += parseInt(val, 10);
        }
    });
    const mortality = getMortality(score);
    const results = [
        {
            label: 'Total MAGGIC Score',
            value: score.toFixed(0),
            unit: 'points'
        },
        {
            label: '1-Year Mortality Risk',
            value: mortality.prob1yr,
            unit: '%',
            alertClass: 'warning'
        },
        {
            label: '3-Year Mortality Risk',
            value: mortality.prob3yr,
            unit: '%',
            alertClass: 'danger'
        }
    ];
    return results;
};
