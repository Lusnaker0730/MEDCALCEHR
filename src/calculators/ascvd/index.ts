/**
 * ASCVD Risk Calculator with Therapy Impact
 *
 * Implements 2013 ACC/AHA Pooled Cohort Equations
 * Valid for ages 40-79 years
 *
 * Improvements based on DEVELOPER_GUIDE.md:
 * - Added snomedCode for condition auto-detection
 * - Added autoPopulateGender
 * - Restructured to use sections
 * - Added formulaSection and reference
 * - Uses uiBuilder for all UI elements
 */

import { createUnifiedFormulaCalculator } from '../shared/unified-formula-calculator.js';
import { LOINC_CODES, SNOMED_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import {
    ascvdCalculationPure,
    calculateTherapyImpact,
    getLifetimeRisk,
    getAspirinRecommendation,
    getCACGuidance,
    type AscvdPatient,
    type TherapyOptions
} from './calculation.js';

// Module-level state for therapy impact calculation
let currentBaselineRisk = 0;
let currentPatientData: AscvdPatient | null = null;

// ==========================================
// Exported Calculation Wrapper
// ==========================================

export const ascvdCalculation = (values: Record<string, any>) => {
    // Reset state
    currentBaselineRisk = 0;
    currentPatientData = null;

    const { results, risk, patient } = ascvdCalculationPure(values);

    // Update module state for all secondary functions
    currentBaselineRisk = risk;
    currentPatientData = patient;

    return results;
};

// ==========================================
// Calculator Configuration
// ==========================================

export const ascvd = createUnifiedFormulaCalculator({
    id: 'ascvd',
    title: 'ASCVD Risk Calculator with Therapy Impact',
    description:
        'Determines 10-year risk of hard ASCVD and calculates the impact of various therapies on risk reduction.',
    infoAlert: `
        <strong>2013 ACC/AHA Pooled Cohort Equations</strong>
        ${uiBuilder.createList({
        items: [
            'Valid for ages 20-79 years',
            'Estimates 10-year risk of first hard ASCVD event',
            'Hard ASCVD = nonfatal MI, CHD death, or fatal/nonfatal stroke'
        ],
        type: 'ul'
    })}
    `,

    // Auto-populate from FHIR
    autoPopulateAge: 'ascvd-age',
    autoPopulateGender: 'ascvd-gender',

    // ==========================================
    // Sections (Improved Structure)
    // ==========================================
    sections: [
        {
            title: 'Known ASCVD',
            icon: '❤️',
            fields: [
                {
                    id: 'known-ascvd',
                    label: 'Known Clinical ASCVD?',
                    type: 'checkbox',
                    helpText: 'History of MI, stroke, or PAD'
                }
            ]
        },
        {
            title: 'Patient Demographics',
            icon: '👤',
            fields: [
                {
                    id: 'ascvd-age',
                    label: 'Age',
                    type: 'number',
                    unit: 'years',
                    min: 20,
                    max: 79,
                    validationType: 'age',
                    required: false
                },
                {
                    type: 'radio',
                    name: 'ascvd-gender',
                    label: 'Sex',
                    options: [
                        { value: 'male', label: 'Male', checked: true },
                        { value: 'female', label: 'Female' }
                    ]
                },
                {
                    type: 'radio',
                    name: 'ascvd-race',
                    label: 'Race',
                    options: [
                        { value: 'white', label: 'White', checked: true },
                        { value: 'aa', label: 'African American' },
                        { value: 'other', label: 'Other' }
                    ]
                }
            ]
        },
        {
            title: 'Lipid Panel',
            icon: '🧪',
            fields: [
                {
                    id: 'ascvd-tc',
                    label: 'Total Cholesterol',
                    type: 'number',
                    loincCode: LOINC_CODES.CHOLESTEROL_TOTAL,
                    unitConfig: {
                        type: 'totalCholesterol',
                        units: ['mg/dL', 'mmol/L'],
                        default: 'mg/dL'
                    },
                    validationType: 'totalCholesterol',
                    required: false
                },
                {
                    id: 'ascvd-hdl',
                    label: 'HDL Cholesterol',
                    type: 'number',
                    loincCode: LOINC_CODES.HDL,
                    unitConfig: { type: 'hdl', units: ['mg/dL', 'mmol/L'], default: 'mg/dL' },
                    validationType: 'hdl',
                    required: false
                }
            ]
        },
        {
            title: 'Blood Pressure',
            icon: '💓',
            fields: [
                {
                    id: 'ascvd-sbp',
                    label: 'Systolic Blood Pressure',
                    type: 'number',
                    unit: 'mmHg',
                    loincCode: LOINC_CODES.SYSTOLIC_BP,
                    validationType: 'systolicBP',
                    min: 50,
                    max: 300,
                    required: false
                },
                {
                    type: 'radio',
                    name: 'ascvd-htn',
                    label: 'On Hypertension Treatment?',
                    snomedCode: SNOMED_CODES.HYPERTENSION,
                    options: [
                        { value: 'no', label: 'No', checked: true },
                        { value: 'yes', label: 'Yes' }
                    ]
                }
            ]
        },
        {
            title: 'Risk Factors',
            icon: '⚠️',
            fields: [
                {
                    type: 'radio',
                    name: 'ascvd-dm',
                    label: 'Diabetes?',
                    snomedCode: SNOMED_CODES.DIABETES_TYPE_2,
                    options: [
                        { value: 'no', label: 'No', checked: true },
                        { value: 'yes', label: 'Yes' }
                    ]
                },
                {
                    type: 'radio',
                    name: 'ascvd-smoker',
                    label: 'Smoking Status',
                    snomedCode: SNOMED_CODES.SMOKING,
                    options: [
                        { value: 'never', label: 'Never', checked: true },
                        { value: 'former', label: 'Former (quit ≥2 years)' },
                        { value: 'current', label: 'Current Smoker' }
                    ],
                    helpText: 'Former smokers (quit ≥2 years) are treated as non-smokers in PCE'
                }
            ]
        }
    ],

    calculate: ascvdCalculation,

    // ==========================================
    // Formula Documentation
    // ==========================================
    formulaSection: {
        show: true,
        title: 'Pooled Cohort Equations',
        calculationNote:
            'Risk = 1 - S₀^exp(IndividualSum - MeanCoefficient), where S₀ is baseline survival',
        scoringCriteria: [
            { criteria: 'Variable', points: 'Weight', isHeader: true },
            { criteria: 'Age (ln)', points: 'Race/Sex-specific' },
            { criteria: 'Total Cholesterol (ln)', points: 'Race/Sex-specific' },
            { criteria: 'HDL Cholesterol (ln)', points: 'Race/Sex-specific' },
            { criteria: 'Systolic BP (ln)', points: 'Treated vs Untreated' },
            { criteria: 'Current Smoker (never/former ≥2y = 0)', points: '+' },
            { criteria: 'Diabetes', points: '+' }
        ]
    },

    // ==========================================
    // Reference Section
    // ==========================================
    reference: `
        ${uiBuilder.createSection({
        title: 'Risk Stratification',
        icon: '📊',
        content: uiBuilder.createTable({
            headers: ['10-Year Risk', 'Category', 'Recommendation'],
            rows: [
                ['<5%', 'Low', 'Lifestyle modifications'],
                ['5-7.4%', 'Borderline', 'Consider moderate-intensity statin'],
                ['7.5-19.9%', 'Intermediate', 'Moderate-intensity statin'],
                ['≥20%', 'High', 'High-intensity statin']
            ]
        })
    })}
        
        ${uiBuilder.createSection({
        title: 'Reference',
        icon: '📚',
        content: `
                <p>Goff DC Jr, Lloyd-Jones DM, Bennett G, et al. 
                2013 ACC/AHA Guideline on the Assessment of Cardiovascular Risk. 
                <em>Circulation</em>. 2014;129:S49-S73.</p>
            `
    })}
    `,

    // ==========================================
    // Footer: Secondary Panels (shown after calculation)
    // ==========================================
    footerHTML: `
        <div id="ascvd-secondary-panels" class="ui-hidden">

            <!-- Lifetime Risk (ages 40-59 only) -->
            <div id="lifetime-risk-panel"></div>

            <!-- Aspirin Recommendation -->
            <div id="aspirin-panel"></div>

            <!-- CAC Guidance -->
            <div id="cac-panel"></div>

            <!-- Therapy Impact -->
            ${uiBuilder.createSection({
        title: '🎯 Therapy Impact Analysis',
        content: `
                    ${uiBuilder.createAlert({
            type: 'info',
            message: `Baseline Risk: <strong><span id="therapy-baseline-risk">--</span>%</strong>
                          &nbsp;&nbsp;→&nbsp;&nbsp;
                          Treated Risk: <strong><span id="therapy-treated-risk">--</span>%</strong>`
        })}

                    ${uiBuilder.createCheckboxGroup({
            name: 'cholesterol',
            label: 'Cholesterol Management',
            options: [
                { id: 'statin-high', value: 'statin-high', label: 'High-Intensity Statin (atorvastatin 40-80mg, rosuvastatin 20-40mg) — RR 0.75' },
                { id: 'statin-moderate', value: 'statin-moderate', label: 'Moderate-Intensity Statin (atorvastatin 10-20mg, rosuvastatin 5-10mg) — RR 0.82' }
            ]
        })}

                    ${uiBuilder.createCheckboxGroup({
            name: 'bp-control',
            label: 'Blood Pressure Control',
            options: [
                { id: 'therapy-bp', value: 'therapy-bp', label: 'Target SBP <130 mmHg (antihypertensive therapy) — RR 0.73' }
            ]
        })}

                    <div id="smoking-cessation-wrap">
                        ${uiBuilder.createCheckboxGroup({
            name: 'smoking',
            label: 'Smoking Cessation',
            options: [
                { id: 'therapy-smoking', value: 'therapy-smoking', label: 'Smoking cessation — RR 0.85' }
            ]
        })}
                    </div>
                    <div id="smoking-cessation-na" class="text-muted small ui-hidden">Not applicable (patient is not a current smoker)</div>

                    <div id="aspirin-therapy-wrap">
                        ${uiBuilder.createCheckboxGroup({
            name: 'aspirin-therapy',
            label: 'Aspirin',
            options: [
                { id: 'therapy-aspirin', value: 'therapy-aspirin', label: 'Low-dose aspirin (81 mg/day) — RR 0.90' }
            ]
        })}
                    </div>
                    <div id="aspirin-therapy-na" class="text-muted small ui-hidden">Not applicable (see Aspirin Recommendation above)</div>

                    <button id="calculate-therapy-impact" class="ui-btn ui-btn-primary ui-btn-block mt-15">
                        📊 Calculate Therapy Impact
                    </button>

                    <div id="therapy-results" class="therapy-results ui-hidden"></div>

                    ${uiBuilder.createReference({
            title: 'Method',
            icon: '📖',
            citations: ['Million Hearts Longitudinal ASCVD Risk Assessment (Karmali et al. <em>Circulation</em>. 2015). RR multipliers applied to baseline PCE risk.']
        })}
                `
    })}
        </div>
    `,

    // ==========================================
    // Custom Initialization
    // ==========================================
    customInitialize: (client, patient, container, calculateFn) => {
        // ── Helper: show secondary panels after risk is calculated ──────────
        const showSecondaryPanels = () => {
            if (!currentPatientData || currentBaselineRisk <= 0) return;
            const panels = container.querySelector('#ascvd-secondary-panels') as HTMLElement;
            if (panels) panels.classList.remove('ui-hidden');

            const p = currentPatientData;
            const risk = currentBaselineRisk;

            // 1. Lifetime Risk (ages 40-59 only)
            const lifetimeEl = container.querySelector('#lifetime-risk-panel') as HTMLElement;
            if (lifetimeEl) {
                const lr = getLifetimeRisk(p);
                if (lr) {
                    lifetimeEl.innerHTML = uiBuilder.createSection({
                        title: '📈 Lifetime ASCVD Risk (Ages 40-59)',
                        content:
                            uiBuilder.createResultItem({
                                label: 'Estimated Lifetime Risk',
                                value: lr.lifetimeRisk,
                                interpretation: `Risk Factor Category: ${lr.category} — ${lr.description}`,
                                alertClass: 'info'
                            }) +
                            uiBuilder.createReference({
                                title: 'Source',
                                icon: '📖',
                                citations: ['Lloyd-Jones DM et al. <em>Circulation</em>. 2006;113(6):791-798. Even with low 10-year risk, lifetime risk may be substantial.']
                            })
                    });
                } else {
                    lifetimeEl.innerHTML = '';
                }
            }

            // 2. Aspirin Recommendation
            const aspirinEl = container.querySelector('#aspirin-panel') as HTMLElement;
            if (aspirinEl) {
                const asp = getAspirinRecommendation(p, risk);
                aspirinEl.innerHTML = uiBuilder.createSection({
                    title: '💊 Aspirin Recommendation (2022 USPSTF)',
                    content: uiBuilder.createAlert({
                        type: asp.alertClass,
                        message: `<strong>${asp.title}</strong><br>${asp.rationale}`
                    })
                });

                // Update therapy aspirin checkbox availability
                const aspirinWrap = container.querySelector('#aspirin-therapy-wrap') as HTMLElement;
                const aspirinNa = container.querySelector('#aspirin-therapy-na') as HTMLElement;
                if (asp.recommendation !== 'consider') {
                    if (aspirinWrap) aspirinWrap.classList.add('ui-hidden');
                    if (aspirinNa) aspirinNa.classList.remove('ui-hidden');
                } else {
                    if (aspirinWrap) aspirinWrap.classList.remove('ui-hidden');
                    if (aspirinNa) aspirinNa.classList.add('ui-hidden');
                }
            }

            // 3. CAC Guidance
            const cacEl = container.querySelector('#cac-panel') as HTMLElement;
            if (cacEl) {
                const cac = getCACGuidance(risk);
                if (cac.show) {
                    const interpretationItems = cac.interpretation
                        .split('\n')
                        .map(s => s.replace(/^•\s*/, '').trim())
                        .filter(Boolean);
                    cacEl.innerHTML = uiBuilder.createSection({
                        title: cac.title,
                        content:
                            uiBuilder.createAlert({ type: cac.alertClass, message: cac.guidance }) +
                            uiBuilder.createList({ items: interpretationItems, className: 'cac-interpretation' }) +
                            uiBuilder.createReference({
                                title: 'Reference',
                                icon: '📖',
                                citations: ['2018 AHA/ACC Cholesterol Guidelines (Grundy SM et al.)']
                            })
                    });
                } else {
                    cacEl.innerHTML = '';
                }
            }

            // 4. Therapy baseline display
            const baselineDisplay = container.querySelector('#therapy-baseline-risk') as HTMLElement;
            if (baselineDisplay) baselineDisplay.textContent = risk.toFixed(1);

            // Update smoking cessation availability based on smoker status
            const smokingWrap = container.querySelector('#smoking-cessation-wrap') as HTMLElement;
            const smokingNa = container.querySelector('#smoking-cessation-na') as HTMLElement;
            if (p.smokerStatus !== 'current') {
                if (smokingWrap) smokingWrap.classList.add('ui-hidden');
                if (smokingNa) smokingNa.classList.remove('ui-hidden');
            } else {
                if (smokingWrap) smokingWrap.classList.remove('ui-hidden');
                if (smokingNa) smokingNa.classList.add('ui-hidden');
            }
        };

        // Observe result box for changes
        const resultBox = container.querySelector('#ascvd-result');
        if (resultBox) {
            const observer = new MutationObserver(() => {
                if (resultBox.classList.contains('show') && currentBaselineRisk > 0) {
                    showSecondaryPanels();
                } else {
                    const panels = container.querySelector('#ascvd-secondary-panels') as HTMLElement;
                    if (panels) panels.classList.add('ui-hidden');
                }
            });
            observer.observe(resultBox, { attributes: true, attributeFilter: ['class'] });
        }

        // ── Calculate Therapy Impact Button ─────────────────────────────────
        const calcBtn = container.querySelector('#calculate-therapy-impact');
        if (calcBtn) {
            calcBtn.addEventListener('click', () => {
                const resultsEl = container.querySelector('#therapy-results') as HTMLElement;
                const treatedDisplay = container.querySelector('#therapy-treated-risk') as HTMLElement;
                if (!resultsEl || !currentPatientData) return;

                if (currentBaselineRisk <= 0) {
                    resultsEl.innerHTML = uiBuilder.createAlert({
                        type: 'danger',
                        message: 'Calculate baseline risk first.'
                    });
                    resultsEl.classList.remove('ui-hidden');
                    return;
                }

                // Build therapy options from checkboxes
                const getChecked = (id: string) =>
                    (container.querySelector(`#${id}`) as HTMLInputElement)?.checked ?? false;

                const options: TherapyOptions = {
                    highIntensityStatin: getChecked('statin-high'),
                    moderateIntensityStatin: getChecked('statin-moderate') && !getChecked('statin-high'),
                    smokingCessation: getChecked('therapy-smoking') && currentPatientData.smokerStatus === 'current',
                    bpControl: getChecked('therapy-bp'),
                    aspirin: getChecked('therapy-aspirin') &&
                        getAspirinRecommendation(currentPatientData, currentBaselineRisk).recommendation === 'consider'
                };

                if (!options.highIntensityStatin && !options.moderateIntensityStatin &&
                    !options.smokingCessation && !options.bpControl && !options.aspirin) {
                    resultsEl.innerHTML = uiBuilder.createAlert({
                        type: 'warning',
                        message: 'Please select at least one therapy option.'
                    });
                    resultsEl.classList.remove('ui-hidden');
                    return;
                }

                const impact = calculateTherapyImpact(currentBaselineRisk, options);

                if (treatedDisplay) treatedDisplay.textContent = impact.treatedRisk.toFixed(1);

                resultsEl.innerHTML = `
                    ${uiBuilder.createResultItem({
                    label: 'Treated 10-Year Risk',
                    value: impact.treatedRisk.toFixed(1),
                    unit: '%',
                    interpretation: `Absolute Risk Reduction: ${impact.arr.toFixed(1)}% | Relative Risk Reduction: ${impact.rrr.toFixed(0)}%`,
                    alertClass: 'success'
                })}
                    ${uiBuilder.createResultItem({
                    label: 'Number Needed to Treat (10 yr)',
                    value: impact.nnt !== null ? String(impact.nnt) : 'N/A',
                    interpretation: impact.nnt !== null
                        ? `Treat ${impact.nnt} patients for 10 years to prevent 1 ASCVD event`
                        : 'No risk reduction with selected interventions',
                    alertClass: 'info'
                })}
                    ${uiBuilder.createTable({
                    headers: ['Intervention', 'RR Applied'],
                    rows: impact.interventions.map(i => {
                        const match = i.match(/RR (\d\.\d+)/);
                        const rr = match ? match[1] : '—';
                        const name = i.replace(/ — RR \d\.\d+|\(.*?\)/g, '').trim();
                        return [name, rr];
                    })
                })}
                    ${uiBuilder.createReference({
                    title: 'Method',
                    icon: '📖',
                    citations: ['Million Hearts Longitudinal ASCVD Risk Assessment (Karmali et al. <em>Circulation</em>. 2015). RR multipliers applied to baseline PCE risk.']
                })}
                `;

                resultsEl.classList.remove('ui-hidden');
            });
        }
    }
});
