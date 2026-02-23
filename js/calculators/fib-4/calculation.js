export function fib4Calculation(values) {
    const age = Number(values['fib4-age']);
    const ast = Number(values['fib4-ast']);
    const alt = Number(values['fib4-alt']);
    const plt = Number(values['fib4-plt']);
    // Check for valid inputs
    if (isNaN(age) ||
        isNaN(ast) ||
        isNaN(alt) ||
        isNaN(plt) ||
        plt === 0 ||
        alt < 0 ||
        age <= 0 ||
        ast <= 0) {
        return [];
    }
    // Formula: (Age * AST) / (Platelets * sqrt(ALT))
    // Note: User input checks should handle PLT units but here we assume standardized input if configured correctly.
    // Standard units: Age (years), AST (U/L), ALT (U/L), Platelets (10^9/L or K/uL - same value)
    const score = (age * ast) / (plt * Math.sqrt(alt));
    const roundedScore = Number(score.toFixed(2));
    let ageInterpretation = '';
    let ageAlertClass = 'info';
    // Age specific use of FIB-4 Score (Suspected NAFLD)
    // METAVIR stage F3-F4 threshold
    if (age <= 35) {
        ageInterpretation = 'Alternative fibrosis assessment';
        ageAlertClass = 'info';
    }
    else if (age >= 36 && age <= 64) {
        if (score < 1.3) {
            ageInterpretation = 'Advanced fibrosis excluded';
            ageAlertClass = 'success';
        }
        else if (score >= 1.3 && score <= 2.67) {
            ageInterpretation = 'Further investigation';
            ageAlertClass = 'warning';
        }
        else {
            ageInterpretation = 'Advanced fibrosis likely';
            ageAlertClass = 'danger';
        }
    }
    else { // age >= 65
        if (score < 2.0) {
            ageInterpretation = 'Advanced fibrosis excluded';
            ageAlertClass = 'success';
        }
        else if (score >= 2.0 && score <= 2.67) {
            ageInterpretation = 'Further investigation';
            ageAlertClass = 'warning';
        }
        else {
            ageInterpretation = 'Advanced fibrosis likely';
            ageAlertClass = 'danger';
        }
    }
    // Approximate fibrosis stage (Ishak staging)
    let ishakStage = '';
    if (score < 1.45) {
        ishakStage = '0-1';
    }
    else if (score >= 1.45 && score <= 3.25) {
        ishakStage = '2-3';
    }
    else {
        ishakStage = '4-6';
    }
    const result = {
        label: 'FIB-4 Score',
        value: roundedScore,
        unit: 'points',
        ageInterpretation: ageInterpretation,
        ageAlertClass: ageAlertClass,
        ishakStage: ishakStage
    };
    return [result];
}
