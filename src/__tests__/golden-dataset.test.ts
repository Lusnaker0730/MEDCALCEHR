/**
 * Golden Dataset Clinical Validation Tests
 *
 * Phase 1.3 — SaMD Clinical Validation / Golden Dataset Tests
 *
 * This file auto-discovers all golden dataset JSON files and runs parametric
 * validation tests for each calculator. Each calculator has 5+ clinically
 * verified reference cases with source citations.
 *
 * Calculator Patterns:
 * - "simple": Direct formula calculators (SimpleCalculateFn)
 * - "scoring": Config-based scoring calculators (createScoringCalculator)
 * - "complex": Multi-parameter calculators (ComplexCalculateFn)
 */

import {
    loadAllGoldenDatasets,
    runSimpleGoldenTests,
    runScoringGoldenTests,
    runComplexGoldenTests,
    GoldenDataset
} from './golden-dataset-runner.js';

import { calculateScoringResult } from '../test-utils/scoring-test-utils.js';

// ==========================================
// Simple Calculator Imports (Pattern A)
// ==========================================
import { bmiBsaCalculation } from '../calculators/bmi-bsa/calculation.js';
import { calculateCkdEpi } from '../calculators/ckd-epi/calculation.js';
import { crclCalculation } from '../calculators/crcl/calculation.js';
import { meldNaCalculation } from '../calculators/meld-na/calculation.js';
import { childPughCalculation } from '../calculators/child-pugh/calculation.js';
import { calculateCharlson } from '../calculators/charlson/calculation.js';
import { qsofaCalculation } from '../calculators/qsofa/calculation.js';
import { ascvdCalculationPure } from '../calculators/ascvd/calculation.js';
import { calculateCaprini } from '../calculators/caprini/calculation.js';
import { calculateGraceAcs } from '../calculators/grace-acs/calculation.js';
import { calculateGenevaScore } from '../calculators/geneva-score/calculation.js';
import { sirsCalculation } from '../calculators/sirs/calculation.js';
import { calciumCorrectionCalculation } from '../calculators/calcium-correction/calculation.js';
import { calculateSodiumCorrection } from '../calculators/sodium-correction/calculation.js';
import { phenytoinCorrectionCalculation } from '../calculators/phenytoin-correction/calculation.js';
import { calculateMAP } from '../calculators/map/calculation.js';
import { calculateIBW } from '../calculators/ibw/calculation.js';
import { qtcCalculation } from '../calculators/qtc/calculation.js';
import { calculateFENa } from '../calculators/fena/calculation.js';
import { calculateFEUrea } from '../calculators/feurea/calculation.js';
import { fib4Calculation } from '../calculators/fib-4/calculation.js';
import { serumAnionGapCalculation } from '../calculators/serum-anion-gap/calculation.js';
import { serumOsmolalityCalculation } from '../calculators/serum-osmolality/calculation.js';
import { calculateHOMAIR } from '../calculators/homa-ir/calculation.js';
import { calculateLDL } from '../calculators/ldl/calculation.js';
import { calculateFreeWaterDeficit } from '../calculators/free-water-deficit/calculation.js';
import { ttkgCalculation } from '../calculators/ttkg/calculation.js';
import { calculateMDRD } from '../calculators/mdrd-gfr/calculation.js';
import { calculateNafldFibrosisScore } from '../calculators/nafld-fibrosis-score/calculation.js';
import { calculateTpaDosing } from '../calculators/tpa-dosing/calculation.js';
import { calculateTpaDosingStroke } from '../calculators/tpa-dosing-stroke/calculation.js';
import { calculateABL } from '../calculators/abl/calculation.js';
import { calculateFourPeps } from '../calculators/4peps/calculation.js';
import { calculate6MWD } from '../calculators/6mwd/calculation.js';
import { calculateBwps } from '../calculators/bwps/calculation.js';
import { calculateEthanolConcentration } from '../calculators/ethanol-concentration/calculation.js';
import { calculateETT } from '../calculators/ett/calculation.js';
import { calculateGuptaMica } from '../calculators/gupta-mica/calculation.js';
import { calculateGwtgHf } from '../calculators/gwtg-hf/calculation.js';
import { calculateIntraopFluid } from '../calculators/intraop-fluid/calculation.js';
import { calculateIsthDic } from '../calculators/isth-dic/calculation.js';
import { calculateMaggic } from '../calculators/maggic/calculation.js';
import { calculateMaintenanceFluids } from '../calculators/maintenance-fluids/calculation.js';
import { calculateScore2Diabetes } from '../calculators/score2-diabetes/calculation.js';
import { calculateSexShock } from '../calculators/sex-shock/calculation.js';

// ==========================================
// Complex Calculator Imports (Pattern C)
// ==========================================
import { apacheIiCalculation } from '../calculators/apache-ii/calculation.js';
import { calculateEuroScoreII } from '../calculators/euroscore-ii/calculation.js';
import { calculateABG } from '../calculators/abg-analyzer/calculation.js';
import { calculatePediatricBP } from '../calculators/pediatric-bp/calculation.js';
import { preventCvdCalculation } from '../calculators/prevent-cvd/calculation.js';
import { preciseHbrCalculation } from '../calculators/precise-hbr/calculation.js';

// ==========================================
// Scoring Calculator Config Imports (Pattern B)
// Exported configs from calculator index files
// ==========================================
import { sofaConfig } from '../calculators/sofa/index.js';
import { curb65Config } from '../calculators/curb-65/index.js';
import { wellsPEConfig } from '../calculators/wells-pe/index.js';
import { wellsDVTConfig } from '../calculators/wells-dvt/index.js';
import { hasBledConfig } from '../calculators/has-bled/index.js';
import { timiNstemiConfig } from '../calculators/timi-nstemi/index.js';
import { heartScoreConfig } from '../calculators/heart-score/index.js';
import { mewsConfig } from '../calculators/mews/index.js';
import { apgarConfig } from '../calculators/apgar/index.js';
import { gad7Config } from '../calculators/gad-7/index.js';
import { ariscatConfig } from '../calculators/ariscat/index.js';
import { stopBangConfig } from '../calculators/stop-bang/index.js';
import { fourCMortalityCovidConfig } from '../calculators/4c-mortality-covid/index.js';
import { fourAsDeliriumConfig } from '../calculators/4as-delirium/index.js';
import { helps2bConfig } from '../calculators/2helps2b/index.js';
import { bacterialMeningitisScoreConfig } from '../calculators/bacterial-meningitis-score/index.js';
import { actionIcuConfig } from '../calculators/action-icu/index.js';
import { afRiskConfig } from '../calculators/af-risk/index.js';
import { ciwaArConfig } from '../calculators/ciwa-ar/index.js';
import { cpisConfig } from '../calculators/cpis/index.js';
import { dasiConfig } from '../calculators/dasi/index.js';
import { hscoreConfig } from '../calculators/hscore/index.js';
import { kawasakiConfig } from '../calculators/kawasaki/index.js';

// ==========================================
// Inline Scoring Configs (for calculators that don't export their config)
// These are minimal configs that replicate the scoring logic from the source.
// ==========================================

const gcsConfig: any = {
    inputType: 'radio',
    id: 'gcs',
    sections: [
        { id: 'eye', title: 'Eye Opening', options: [{ value: '4' }, { value: '3' }, { value: '2' }, { value: '1' }] },
        { id: 'verbal', title: 'Verbal', options: [{ value: '5' }, { value: '4' }, { value: '3' }, { value: '2' }, { value: '1' }] },
        { id: 'motor', title: 'Motor', options: [{ value: '6' }, { value: '5' }, { value: '4' }, { value: '3' }, { value: '2' }, { value: '1' }] }
    ],
    riskLevels: [
        { minScore: 13, maxScore: 15, label: 'Mild Brain Injury', severity: 'success' },
        { minScore: 9, maxScore: 12, label: 'Moderate Brain Injury', severity: 'warning' },
        { minScore: 3, maxScore: 8, label: 'Severe Brain Injury', severity: 'danger' }
    ]
};

const nihssConfig: any = {
    inputType: 'radio',
    id: 'nihss',
    sections: [
        { id: 'nihss-1a', title: '1a', options: [{ value: '0' }, { value: '1' }, { value: '2' }, { value: '3' }] },
        { id: 'nihss-1b', title: '1b', options: [{ value: '0' }, { value: '1' }, { value: '2' }] },
        { id: 'nihss-1c', title: '1c', options: [{ value: '0' }, { value: '1' }, { value: '2' }] },
        { id: 'nihss-2', title: '2', options: [{ value: '0' }, { value: '1' }, { value: '2' }] },
        { id: 'nihss-3', title: '3', options: [{ value: '0' }, { value: '1' }, { value: '2' }, { value: '3' }] },
        { id: 'nihss-4', title: '4', options: [{ value: '0' }, { value: '1' }, { value: '2' }] },
        { id: 'nihss-5a', title: '5a', options: [{ value: '0' }, { value: '1' }, { value: '2' }, { value: '3' }, { value: '4' }] },
        { id: 'nihss-5b', title: '5b', options: [{ value: '0' }, { value: '1' }, { value: '2' }, { value: '3' }, { value: '4' }] },
        { id: 'nihss-6a', title: '6a', options: [{ value: '0' }, { value: '1' }, { value: '2' }, { value: '3' }, { value: '4' }] },
        { id: 'nihss-6b', title: '6b', options: [{ value: '0' }, { value: '1' }, { value: '2' }, { value: '3' }, { value: '4' }] },
        { id: 'nihss-7', title: '7', options: [{ value: '0' }, { value: '1' }, { value: '2' }] },
        { id: 'nihss-8', title: '8', options: [{ value: '0' }, { value: '1' }, { value: '2' }] },
        { id: 'nihss-9', title: '9', options: [{ value: '0' }, { value: '1' }, { value: '2' }, { value: '3' }] },
        { id: 'nihss-10', title: '10', options: [{ value: '0' }, { value: '1' }, { value: '2' }] },
        { id: 'nihss-11', title: '11', options: [{ value: '0' }, { value: '1' }, { value: '2' }] }
    ],
    riskLevels: [
        { minScore: 0, maxScore: 0, label: 'No Stroke Symptoms', severity: 'success' },
        { minScore: 1, maxScore: 4, label: 'Minor Stroke', severity: 'success' },
        { minScore: 5, maxScore: 15, label: 'Moderate Stroke', severity: 'warning' },
        { minScore: 16, maxScore: 20, label: 'Moderate to Severe Stroke', severity: 'danger' },
        { minScore: 21, maxScore: 42, label: 'Severe Stroke', severity: 'danger' }
    ]
};

const percConfig: any = {
    inputType: 'checkbox',
    id: 'perc',
    sections: [{
        title: 'PERC Criteria',
        options: [
            { id: 'age50', value: 1 }, { id: 'hr100', value: 1 }, { id: 'o2sat', value: 1 },
            { id: 'hemoptysis', value: 1 }, { id: 'exogenous-estrogen', value: 1 },
            { id: 'prior-dvt-pe', value: 1 }, { id: 'unilateral-swelling', value: 1 },
            { id: 'trauma-surgery', value: 1 }
        ]
    }],
    riskLevels: [
        { minScore: 0, maxScore: 0, label: 'PERC Negative', severity: 'success' },
        { minScore: 1, maxScore: 8, label: 'PERC Positive', severity: 'danger' }
    ]
};

const paduaVteConfig: any = {
    inputType: 'yesno',
    id: 'padua-vte',
    sectionTitle: 'Risk Factors',
    questions: [
        { id: 'padua-cancer', label: 'Active cancer', points: 3 },
        { id: 'padua-prev-vte', label: 'Previous VTE', points: 3 },
        { id: 'padua-mobility', label: 'Reduced mobility', points: 3 },
        { id: 'padua-thromb', label: 'Known thrombophilic condition', points: 3 },
        { id: 'padua-trauma', label: 'Recent trauma/surgery', points: 2 },
        { id: 'padua-age', label: 'Age ≥70', points: 1 },
        { id: 'padua-heart-resp', label: 'Heart/respiratory failure', points: 1 },
        { id: 'padua-mi-stroke', label: 'Acute MI/ischemic stroke', points: 1 },
        { id: 'padua-infection', label: 'Acute infection', points: 1 },
        { id: 'padua-obesity', label: 'Obesity', points: 1 },
        { id: 'padua-hormonal', label: 'Hormonal treatment', points: 1 }
    ],
    riskLevels: [
        { minScore: 0, maxScore: 3, label: 'Low Risk for VTE', severity: 'success' },
        { minScore: 4, maxScore: 999, label: 'High Risk for VTE', severity: 'danger' }
    ]
};

const phq9Config: any = {
    inputType: 'radio',
    id: 'phq-9',
    sections: Array.from({ length: 9 }, (_, i) => ({
        id: `phq9-q${i}`,
        title: `Q${i + 1}`,
        options: [{ value: '0' }, { value: '1' }, { value: '2' }, { value: '3' }]
    })),
    riskLevels: [
        { minScore: 0, maxScore: 4, label: 'Minimal Depression', severity: 'success' },
        { minScore: 5, maxScore: 9, label: 'Mild Depression', severity: 'success' },
        { minScore: 10, maxScore: 14, label: 'Moderate Depression', severity: 'warning' },
        { minScore: 15, maxScore: 19, label: 'Moderately Severe Depression', severity: 'danger' },
        { minScore: 20, maxScore: 27, label: 'Severe Depression', severity: 'danger' }
    ]
};

const centorConfig: any = {
    inputType: 'yesno',
    id: 'centor',
    sectionTitle: 'Criteria',
    questions: [
        { id: 'centor-exudates', label: 'Tonsillar exudates', points: 1 },
        { id: 'centor-nodes', label: 'Tender anterior cervical lymphadenopathy', points: 1 },
        { id: 'centor-fever', label: 'Fever', points: 1 },
        { id: 'centor-cough', label: 'Absence of cough', points: 1 },
        { id: 'centor-age', label: 'Age 3-14', points: 1 }
    ],
    riskLevels: [
        { minScore: 0, maxScore: 0, label: 'Very Low Risk', severity: 'success' },
        { minScore: 1, maxScore: 1, label: 'Low Risk', severity: 'success' },
        { minScore: 2, maxScore: 2, label: 'Moderate Risk', severity: 'warning' },
        { minScore: 3, maxScore: 3, label: 'Moderate-High Risk', severity: 'warning' },
        { minScore: 4, maxScore: 5, label: 'High Risk', severity: 'danger' }
    ]
};

const rcriConfig: any = {
    inputType: 'yesno',
    id: 'rcri',
    sectionTitle: 'Risk Factors',
    questions: [
        { id: 'rcri-surgery', label: 'High-risk surgery', points: 1 },
        { id: 'rcri-ihd', label: 'Ischemic heart disease', points: 1 },
        { id: 'rcri-hf', label: 'Congestive heart failure', points: 1 },
        { id: 'rcri-cvd', label: 'Cerebrovascular disease', points: 1 },
        { id: 'rcri-insulin', label: 'Diabetes on insulin', points: 1 },
        { id: 'rcri-creatinine', label: 'Creatinine >2 mg/dL', points: 1 }
    ],
    riskLevels: [
        { minScore: 0, maxScore: 0, label: 'Class I (0.4%)', severity: 'success' },
        { minScore: 1, maxScore: 1, label: 'Class II (0.9%)', severity: 'success' },
        { minScore: 2, maxScore: 2, label: 'Class III (6.6%)', severity: 'warning' },
        { minScore: 3, maxScore: 6, label: 'Class IV (≥11%)', severity: 'danger' }
    ]
};

const ransonConfig: any = {
    inputType: 'checkbox',
    id: 'ranson',
    sections: [
        {
            id: 'admission',
            title: 'Admission Criteria',
            options: [
                { id: 'ranson-age', value: 1 }, { id: 'ranson-wbc', value: 1 },
                { id: 'ranson-glucose', value: 1 }, { id: 'ranson-ast', value: 1 },
                { id: 'ranson-ldh', value: 1 }
            ]
        },
        {
            id: '48hr',
            title: '48-hour Criteria',
            options: [
                { id: 'ranson-calcium', value: 1 }, { id: 'ranson-hct', value: 1 },
                { id: 'ranson-paO2', value: 1 }, { id: 'ranson-bun', value: 1 },
                { id: 'ranson-base', value: 1 }, { id: 'ranson-fluid', value: 1 }
            ]
        }
    ],
    riskLevels: [
        { minScore: 0, maxScore: 2, label: 'Low Mortality (0-3%)', severity: 'success' },
        { minScore: 3, maxScore: 4, label: 'Moderate Mortality (15-20%)', severity: 'warning' },
        { minScore: 5, maxScore: 6, label: 'High Mortality (40%)', severity: 'danger' },
        { minScore: 7, maxScore: 11, label: 'Very High Mortality (>50%)', severity: 'danger' }
    ]
};

const regiscarConfig: any = {
    inputType: 'radio',
    id: 'regiscar',
    sections: [
        { id: 'regiscar-fever', title: 'Fever ≥38.5°C', options: [{ value: '-1' }, { value: '0' }] },
        { id: 'regiscar-lymph-nodes', title: 'Enlarged lymph nodes', options: [{ value: '-1' }, { value: '0' }, { value: '1' }] },
        { id: 'regiscar-lymphocytes', title: 'Atypical lymphocytes', options: [{ value: '-1' }, { value: '0' }, { value: '1' }] },
        { id: 'regiscar-eosinophilia', title: 'Eosinophilia', options: [{ value: '-1' }, { value: '0' }, { value: '1' }, { value: '2' }] },
        { id: 'regiscar-rash', title: 'Skin rash >50%', options: [{ value: '-1' }, { value: '0' }, { value: '1' }] },
        { id: 'regiscar-skin-features', title: '≥2 skin features', options: [{ value: '-1' }, { value: '0' }, { value: '1' }] },
        { id: 'regiscar-biopsy', title: 'Skin biopsy suggesting DRESS', options: [{ value: '-1' }, { value: '0' }, { value: '1' }] },
        { id: 'regiscar-organ', title: 'Organ involvement', options: [{ value: '0' }, { value: '1' }, { value: '2' }] },
        { id: 'regiscar-resolution', title: 'Resolution ≥15 days', options: [{ value: '-1' }, { value: '0' }] },
        { id: 'regiscar-alternative', title: 'Alternative diagnoses excluded', options: [{ value: '0' }, { value: '1' }] }
    ],
    riskLevels: [
        { minScore: -10, maxScore: 1, label: 'No Case', severity: 'success' },
        { minScore: 2, maxScore: 3, label: 'Possible DRESS', severity: 'warning' },
        { minScore: 4, maxScore: 5, label: 'Probable DRESS', severity: 'danger' },
        { minScore: 6, maxScore: 20, label: 'Definite DRESS', severity: 'danger' }
    ]
};

// ==========================================
// Import Maps
// ==========================================

const simpleCalculatorMap: Record<string, (values: Record<string, any>) => any> = {
    'bmi-bsa': bmiBsaCalculation,
    'ckd-epi': calculateCkdEpi,
    'crcl': crclCalculation,
    'meld-na': meldNaCalculation,
    'child-pugh': childPughCalculation,
    'charlson': calculateCharlson,
    'qsofa': qsofaCalculation,
    'ascvd': (values: Record<string, any>) => {
        const result = ascvdCalculationPure(values);
        return result?.results ?? null;
    },
    'caprini': calculateCaprini,
    'grace-acs': calculateGraceAcs,
    'geneva-score': calculateGenevaScore,
    'sirs': sirsCalculation,
    'calcium-correction': calciumCorrectionCalculation,
    'sodium-correction': calculateSodiumCorrection,
    'phenytoin-correction': phenytoinCorrectionCalculation,
    'map': calculateMAP,
    'ibw': calculateIBW,
    'qtc': qtcCalculation,
    'fena': calculateFENa,
    'feurea': calculateFEUrea,
    'fib-4': fib4Calculation,
    'serum-anion-gap': serumAnionGapCalculation,
    'serum-osmolality': serumOsmolalityCalculation,
    'homa-ir': calculateHOMAIR,
    'ldl': calculateLDL,
    'free-water-deficit': calculateFreeWaterDeficit,
    'ttkg': ttkgCalculation,
    'mdrd-gfr': calculateMDRD,
    'nafld-fibrosis-score': calculateNafldFibrosisScore,
    'tpa-dosing': calculateTpaDosing,
    'tpa-dosing-stroke': calculateTpaDosingStroke,
    'abl': calculateABL,
    '4peps': calculateFourPeps,
    '6mwd': calculate6MWD,
    'bwps': calculateBwps,
    'ethanol-concentration': calculateEthanolConcentration,
    'ett': calculateETT,
    'gupta-mica': calculateGuptaMica,
    'gwtg-hf': calculateGwtgHf,
    'intraop-fluid': calculateIntraopFluid,
    'isth-dic': calculateIsthDic,
    'maggic': calculateMaggic,
    'maintenance-fluids': calculateMaintenanceFluids,
    'score2-diabetes': calculateScore2Diabetes,
    'sex-shock': calculateSexShock,
};

const complexCalculatorMap: Record<string, (...args: any[]) => any> = {
    'apache-ii': apacheIiCalculation,
    'euroscore-ii': calculateEuroScoreII,
    'abg-analyzer': calculateABG,
    'pediatric-bp': calculatePediatricBP,
    'prevent-cvd': preventCvdCalculation,
    'precise-hbr': preciseHbrCalculation,
};

const scoringConfigMap: Record<string, any> = {
    // Exported configs
    'sofa': sofaConfig,
    'curb-65': curb65Config,
    'wells-pe': wellsPEConfig,
    'wells-dvt': wellsDVTConfig,
    'has-bled': hasBledConfig,
    'timi-nstemi': timiNstemiConfig,
    'heart-score': heartScoreConfig,
    'mews': mewsConfig,
    'apgar': apgarConfig,
    'gad-7': gad7Config,
    'ariscat': ariscatConfig,
    'stop-bang': stopBangConfig,
    '4c-mortality-covid': fourCMortalityCovidConfig,
    '4as-delirium': fourAsDeliriumConfig,
    '2helps2b': helps2bConfig,
    'bacterial-meningitis-score': bacterialMeningitisScoreConfig,
    'action-icu': actionIcuConfig,
    'af-risk': afRiskConfig,
    'ciwa-ar': ciwaArConfig,
    'cpis': cpisConfig,
    'dasi': dasiConfig,
    'hscore': hscoreConfig,
    'kawasaki': kawasakiConfig,
    // Inline configs (not exported from calculator modules)
    'gcs': gcsConfig,
    'nihss': nihssConfig,
    'perc': percConfig,
    'padua-vte': paduaVteConfig,
    'phq-9': phq9Config,
    'centor': centorConfig,
    'rcri': rcriConfig,
    'ranson': ransonConfig,
    'regiscar': regiscarConfig,
};

// ==========================================
// Auto-discover and run golden dataset tests
// ==========================================

const datasets = loadAllGoldenDatasets();

describe('Golden Dataset Clinical Validation', () => {
    if (datasets.length === 0) {
        test('No golden datasets found', () => {
            // eslint-disable-next-line no-console
            console.warn('No golden dataset JSON files found in golden-datasets/');
        });
        return;
    }

    datasets.forEach((dataset: GoldenDataset) => {
        const { calculatorId, calculatorType } = dataset;

        if (calculatorType === 'simple') {
            const fn = simpleCalculatorMap[calculatorId];
            if (fn) {
                runSimpleGoldenTests(dataset, fn);
            } else {
                describe(`[Golden Dataset] ${dataset.calculatorName}`, () => {
                    test.skip(`Calculator "${calculatorId}" not mapped in simpleCalculatorMap`, () => {});
                });
            }
        } else if (calculatorType === 'scoring') {
            const config = scoringConfigMap[calculatorId];
            if (config) {
                runScoringGoldenTests(dataset, config, calculateScoringResult);
            } else {
                describe(`[Golden Dataset] ${dataset.calculatorName}`, () => {
                    test.skip(`Calculator "${calculatorId}" not mapped in scoringConfigMap`, () => {});
                });
            }
        } else if (calculatorType === 'complex') {
            const fn = complexCalculatorMap[calculatorId];
            if (fn) {
                runComplexGoldenTests(dataset, fn);
            } else {
                describe(`[Golden Dataset] ${dataset.calculatorName}`, () => {
                    test.skip(`Calculator "${calculatorId}" not mapped in complexCalculatorMap`, () => {});
                });
            }
        }
    });
});
