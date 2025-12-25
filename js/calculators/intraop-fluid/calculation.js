export const calculateIntraopFluid = ({ weightKg, npoHours, traumaLevel }) => {
    if (weightKg <= 10) throw new Error('Weight must be > 10 kg for this calculator.');

    // 4-2-1 Rule for Maintenance
    // First 10kg: 4ml/kg/hr -> 40ml
    // Second 10kg: 2ml/kg/hr -> 20ml (Total 60ml for 20kg)
    // Remaining: 1ml/kg/hr
    const maintenanceRate =
        weightKg > 20 ? weightKg + 40 : weightKg > 10 ? 40 + (weightKg - 10) * 2 : weightKg * 4;

    const npoDeficit = maintenanceRate * npoHours;
    const traumaLossRate = traumaLevel * weightKg;

    // Hour-by-hour
    // 1st hour: 50% deficit + maint + trauma
    // 2nd hour: 25% deficit + maint + trauma
    // 3rd hour: 25% deficit + maint + trauma
    // 4th+ hour: maint + trauma

    const firstHourFluids = npoDeficit / 2 + maintenanceRate + traumaLossRate;
    const secondHourFluids = npoDeficit / 4 + maintenanceRate + traumaLossRate;
    const thirdHourFluids = npoDeficit / 4 + maintenanceRate + traumaLossRate;
    const fourthHourFluids = maintenanceRate + traumaLossRate;

    return {
        maintenanceRate,
        npoDeficit,
        firstHourFluids,
        secondHourFluids,
        thirdHourFluids,
        fourthHourFluids
    };
};
