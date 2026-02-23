export function phenytoinCorrectionCalculation(values) {
    const totalInput = values['pheny-total'];
    const albuminInput = values['pheny-albumin'];
    const renalStatus = values['pheny-renal'];
    if (totalInput === undefined ||
        totalInput === null ||
        totalInput === '' ||
        albuminInput === undefined ||
        albuminInput === null ||
        albuminInput === '' ||
        !renalStatus) {
        return [];
    }
    const total = Number(totalInput);
    const albumin = Number(albuminInput); // always in g/dL after unit conversion
    if (isNaN(total) || isNaN(albumin)) {
        return [];
    }
    // If albumin > 3.2 g/dL, correction is not needed
    if (albumin > 3.2) {
        return [
            {
                label: 'Corrected Phenytoin',
                value: Number(total.toFixed(1)),
                unit: 'mcg/mL',
                interpretation: 'No correction needed',
                alertClass: 'info',
                alertPayload: {
                    alertMsg: 'Albumin >3.2 g/dL (32 g/L): correction is not needed. Use the measured phenytoin level directly.',
                    measuredTotal: Number(total.toFixed(1))
                }
            }
        ];
    }
    // Winter-Tozer formula:
    // Corrected = measured level / (adjustment × albumin_g/dL + 0.1)
    // adjustment = 0.275 (normal); 0.2 if CrCl <20 mL/min
    const adjustment = renalStatus === 'yes' ? 0.2 : 0.275;
    const denominator = adjustment * albumin + 0.1;
    if (denominator === 0)
        return [];
    const corrected = total / denominator;
    let interpretation = '';
    let alertClass = 'success';
    let alertMsg = 'Corrected level is within therapeutic range (10–20 mcg/mL).';
    if (corrected < 10) {
        interpretation = 'Subtherapeutic';
        alertClass = 'info';
        alertMsg = 'Corrected level is below therapeutic range (10–20 mcg/mL). Consider dose adjustment.';
    }
    else if (corrected > 20) {
        interpretation = 'Potentially Toxic';
        alertClass = 'danger';
        alertMsg = 'Corrected level is above therapeutic range (>20 mcg/mL). Monitor for toxicity.';
    }
    else {
        interpretation = 'Therapeutic';
    }
    return [
        {
            label: 'Corrected Phenytoin',
            value: Number(corrected.toFixed(1)),
            unit: 'mcg/mL',
            interpretation: interpretation,
            alertClass: alertClass,
            alertPayload: {
                alertMsg,
                measuredTotal: Number(total.toFixed(1))
            }
        }
    ];
}
