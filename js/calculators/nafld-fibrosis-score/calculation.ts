export interface NAFLDScoreInput {
    age: number;
    bmi: number;
    diabetes: number; // 0 or 1
    ast: number;
    alt: number;
    platelet: number;
    albumin: number;
}

export interface NAFLDScoreResult {
    score: number;
    stage: string;
    interpretation: string;
    alertType: 'success' | 'warning' | 'danger' | 'info';
}

export const calculateNAFLDScore = ({ age, bmi, diabetes, ast, alt, platelet, albumin }: NAFLDScoreInput): NAFLDScoreResult => {
    const astAltRatio = ast / alt;
    const score = -1.675 +
        (0.037 * age) +
        (0.094 * bmi) +
        (1.13 * diabetes) +
        (0.99 * astAltRatio) -
        (0.013 * platelet) -
        (0.66 * albumin);

    if (!isFinite(score) || isNaN(score)) {
        throw new Error("Calculation Error: Result is not a finite number");
    }

    let stage = '';
    let interpretation = '';
    let alertType: 'success' | 'warning' | 'danger' | 'info' = 'info';

    if (score < -1.455) {
        stage = 'F0-F2';
        interpretation = 'Low probability of advanced fibrosis';
        alertType = 'success';
    } else if (score <= 0.675) {
        stage = 'Indeterminate';
        interpretation = 'Further testing needed (e.g., elastography)';
        alertType = 'warning';
    } else {
        stage = 'F3-F4';
        interpretation = 'High probability of advanced fibrosis';
        alertType = 'danger';
    }

    return {
        score,
        stage,
        interpretation,
        alertType
    };
};
