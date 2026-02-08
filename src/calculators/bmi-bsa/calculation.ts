import { AlertSeverity } from '../../types/calculator-base.js';
import { FormulaResultItem } from '../../types/calculator-formula.js';

export function bmiBsaCalculation(
    values: Record<string, number | string | boolean>
): FormulaResultItem[] {
    const weightInput = values['bmi-bsa-weight'];
    const heightInput = values['bmi-bsa-height'];

    if (
        weightInput === undefined ||
        weightInput === null ||
        weightInput === '' ||
        heightInput === undefined ||
        heightInput === null ||
        heightInput === ''
    ) {
        return [];
    }

    const weightKg = Number(weightInput);
    const heightCm = Number(heightInput);

    // SaMD Protocol TC-003: Zero Division / Invalid Input Prevention
    if (isNaN(weightKg) || isNaN(heightCm) || weightKg <= 0 || heightCm <= 0) {
        return [];
    }

    // BMI Calculation: kg / m^2
    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);

    // BSA Calculation (Du Bois): 0.007184 * W^0.425 * H^0.725
    const bsa = 0.007184 * Math.pow(weightKg, 0.425) * Math.pow(heightCm, 0.725);

    // Interpretations
    let interpretation = '';
    let alertClass: AlertSeverity = 'info';

    // Taiwan HPA BMI classification (衛生福利部國民健康署)
    if (bmi < 18.5) {
        interpretation = '過輕 (Underweight)';
        alertClass = 'warning';
    } else if (bmi < 24) {
        interpretation = '健康體重 (Normal weight)';
        alertClass = 'success';
    } else if (bmi < 27) {
        interpretation = '過重 (Overweight)';
        alertClass = 'warning';
    } else {
        interpretation = '肥胖 (Obese)';
        alertClass = 'danger';
    }

    return [
        {
            label: 'Body Mass Index (BMI)',
            value: Number(bmi.toFixed(1)),
            unit: 'kg/m²',
            interpretation: interpretation,
            alertClass: alertClass
        },
        {
            label: 'Body Surface Area (BSA)',
            value: Number(bsa.toFixed(2)),
            unit: 'm²',
            interpretation: 'Du Bois Formula'
        }
    ];
}
