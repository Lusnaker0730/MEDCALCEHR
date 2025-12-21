export const calculateEthanolConcentration = ({ volumeMl, abv, weightKg, gender }: { volumeMl: number, abv: number, weightKg: number, gender: string }) => {
    if (weightKg <= 0) throw new Error("Weight must be positive");

    // Vd (Volume of Distribution)
    // Male: 0.68 L/kg, Female: 0.55 L/kg
    const volumeDistribution = gender === 'male' ? 0.68 : 0.55;

    // Grams of Alcohol = Volume(mL) * (ABV%/100) * Density(0.789 g/mL)
    const gramsAlcohol = volumeMl * (abv / 100) * 0.789;

    // Concentration = Grams / Total Body Water(L)
    // Result in g/L. Convert to mg/dL by multiplying by 100.
    // Formula in original code: (grams * 1000) / (weight * Vd * 10) -> equivalent to (grams/L)*100
    const concentrationMgDl = (gramsAlcohol * 1000) / (weightKg * volumeDistribution * 10);

    let severityText = 'Below Legal Limit';
    let alertClass = 'ui-alert-success';

    if (concentrationMgDl >= 400) {
        severityText = 'Potentially Fatal Level';
        alertClass = 'ui-alert-danger';
    } else if (concentrationMgDl >= 300) {
        severityText = 'Severe Intoxication';
        alertClass = 'ui-alert-danger';
    } else if (concentrationMgDl >= 80) {
        severityText = 'Above Legal Limit (0.08%)';
        alertClass = 'ui-alert-warning';
    }

    return {
        concentrationMgDl,
        severityText,
        alertClass
    };
};
