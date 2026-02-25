/**
 * @jest-environment jsdom
 */

import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';
import { createUnifiedFormulaCalculator } from '../../calculators/shared/unified-formula-calculator';
import { fhirDataService } from '../../fhir-data-service';

// Mock console
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('Unified Formula Calculator Factory', () => {
    let container: HTMLElement;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    describe('Simple Mode (mode: simple)', () => {
        const simpleConfig = {
            id: 'test-simple-formula',
            title: 'Test Simple Formula',
            description: 'A test simple formula calculator',
            mode: 'simple' as const,
            inputs: [
                {
                    type: 'number' as const,
                    id: 'value-a',
                    label: 'Value A',
                    standardUnit: 'units'
                },
                {
                    type: 'number' as const,
                    id: 'value-b',
                    label: 'Value B',
                    standardUnit: 'units'
                }
            ],
            formulas: [{ label: 'Result', formula: 'A + B' }],
            calculate: (values: Record<string, string | number | boolean>) => {
                const a = parseFloat(String(values['value-a'])) || 0;
                const b = parseFloat(String(values['value-b'])) || 0;
                return [{ label: 'Sum', value: String(a + b), unit: 'units' }];
            }
        };

        test('should create simple formula calculator', () => {
            const calculator = createUnifiedFormulaCalculator(simpleConfig);
            expect(calculator).toBeDefined();
            expect(calculator.id).toBe('test-simple-formula');
        });

        test('should create via unified function', () => {
            const calculator = createUnifiedFormulaCalculator({
                id: 'test-simple-2',
                title: 'Test Simple 2',
                description: 'Test description',
                mode: 'simple',
                inputs: simpleConfig.inputs,
                calculate: simpleConfig.calculate
            });
            expect(calculator).toBeDefined();
            expect(calculator.id).toBe('test-simple-2');
        });

        test('should generate HTML with number inputs', () => {
            const calculator = createUnifiedFormulaCalculator({
                id: 'test-html',
                title: 'Test',
                description: 'Test description',
                mode: 'simple',
                inputs: simpleConfig.inputs,
                calculate: simpleConfig.calculate
            });
            const html = calculator.generateHTML();
            expect(html).toContain('value-a');
            expect(html).toContain('value-b');
            expect(html).toContain('type="number"');
        });

        test('should initialize without errors', () => {
            const calculator = createUnifiedFormulaCalculator({
                id: 'test-init',
                title: 'Test',
                description: 'Test description',
                mode: 'simple',
                inputs: simpleConfig.inputs,
                calculate: simpleConfig.calculate
            });
            container.innerHTML = calculator.generateHTML();

            expect(() => {
                calculator.initialize(null, null, container);
            }).not.toThrow();
        });
    });

    describe('Complex Mode (mode: complex)', () => {
        const complexSections = [
            {
                title: 'Patient Data',
                icon: '👤',
                fields: [
                    {
                        type: 'number' as const,
                        id: 'age',
                        label: 'Age',
                        unit: 'years'
                    }
                ]
            },
            {
                title: 'Lab Values',
                icon: '🧪',
                fields: [
                    {
                        type: 'number' as const,
                        id: 'lab-value',
                        label: 'Lab Value',
                        unit: 'mg/dL'
                    }
                ]
            }
        ];

        const complexCalculate = (getValue: any, getStdValue: any, getRadioValue: any) => {
            const age = getValue('age');
            const lab = getValue('lab-value');
            if (age === null || lab === null) return null;
            return {
                results: [{ label: 'Score', value: String(age + lab), unit: 'points' }],
                interpretation: 'Test interpretation',
                severity: 'info' as const
            };
        };

        test('should create complex formula calculator', () => {
            const calculator = createUnifiedFormulaCalculator({
                id: 'test-complex-2',
                title: 'Test Complex 2',
                description: 'Test description',
                mode: 'complex',
                sections: complexSections,
                complexCalculate: complexCalculate
            });
            expect(calculator).toBeDefined();
            expect(calculator.id).toBe('test-complex-2');
        });

        test('should generate HTML with sections', () => {
            const calculator = createUnifiedFormulaCalculator({
                id: 'test-sections',
                title: 'Test',
                description: 'Test description',
                mode: 'complex',
                sections: complexSections,
                complexCalculate: complexCalculate
            });
            const html = calculator.generateHTML();
            expect(html).toContain('Patient Data');
            expect(html).toContain('Lab Values');
        });
    });

    describe('Formula Display', () => {
        test('should include formulas section when configured', () => {
            const calculator = createUnifiedFormulaCalculator({
                id: 'test-formulas',
                title: 'Test',
                description: 'Test description',
                mode: 'simple',
                inputs: [{ type: 'number' as const, id: 'x', label: 'X', standardUnit: 'units' }],
                formulas: [
                    { label: 'Square', formula: 'X²' },
                    { label: 'Cube', formula: 'X³' }
                ],
                calculate: values => {
                    const x = parseFloat(String(values['x'])) || 0;
                    return [{ label: 'Square', value: String(x * x), unit: 'units²' }];
                }
            });

            const html = calculator.generateHTML();
            expect(html).toContain('Square');
            expect(html).toContain('X²');
        });
    });

    describe('Unit Toggle Support', () => {
        test('should support unit toggle in inputs', () => {
            const calculator = createUnifiedFormulaCalculator({
                id: 'test-unit-toggle',
                title: 'Test',
                description: 'Test description',
                mode: 'simple',
                inputs: [
                    {
                        type: 'number' as const,
                        id: 'creatinine',
                        label: 'Creatinine',
                        standardUnit: 'mg/dL',
                        unitToggle: {
                            type: 'creatinine',
                            units: ['mg/dL', 'µmol/L'],
                            default: 'mg/dL'
                        }
                    }
                ],
                calculate: () => [{ label: 'Result', value: '1', unit: 'units' }]
            });

            const html = calculator.generateHTML();
            expect(html).toContain('mg/dL');
        });
    });

    // =========================================================================
    // snomedCode Auto-Populate for Radio Fields
    // =========================================================================

    describe('snomedCode auto-populate for radio fields', () => {
        const SNOMED_DIABETES_T2 = '44054006';
        const SNOMED_DIABETES_T1 = '46635009';
        const SNOMED_SMOKING = '77176002';

        /** Helper: flush pending microtasks (await autoPopulate) */
        const flushAsync = () => new Promise<void>(r => setTimeout(r, 0));

        /** Build a minimal calculator config with snomedCode radio fields */
        const buildConfig = (fields: any[]) => ({
            id: 'test-snomed',
            title: 'Test snomedCode',
            description: 'Test',
            mode: 'complex' as const,
            sections: [{ title: 'Risk Factors', fields }],
            calculate: () => [{ label: 'Result', value: '0', unit: '%' }]
        });

        /** Build a FHIR Condition resource */
        const makeCondition = (code: string) => ({
            resourceType: 'Condition',
            code: { coding: [{ system: 'http://snomed.info/sct', code }] }
        });

        let initSpy: jest.SpiedFunction<typeof fhirDataService.initialize>;
        let readySpy: jest.SpiedFunction<typeof fhirDataService.isReady>;
        let condSpy: jest.SpiedFunction<typeof fhirDataService.getConditions>;
        let autoPopSpy: jest.SpiedFunction<typeof fhirDataService.autoPopulateFields>;
        let ageSpy: jest.SpiedFunction<typeof fhirDataService.getPatientAge>;
        let genderSpy: jest.SpiedFunction<typeof fhirDataService.getPatientGender>;

        beforeEach(() => {
            initSpy = jest.spyOn(fhirDataService, 'initialize').mockImplementation(() => {});
            readySpy = jest.spyOn(fhirDataService, 'isReady').mockReturnValue(true);
            condSpy = jest.spyOn(fhirDataService, 'getConditions').mockResolvedValue([]);
            autoPopSpy = jest.spyOn(fhirDataService, 'autoPopulateFields').mockResolvedValue(undefined as any);
            ageSpy = jest.spyOn(fhirDataService, 'getPatientAge').mockReturnValue(null);
            genderSpy = jest.spyOn(fhirDataService, 'getPatientGender').mockReturnValue(null);
        });

        afterEach(() => {
            initSpy.mockRestore();
            readySpy.mockRestore();
            condSpy.mockRestore();
            autoPopSpy.mockRestore();
            ageSpy.mockRestore();
            genderSpy.mockRestore();
        });

        test('should auto-select "yes" when patient has matching condition', async () => {
            condSpy.mockResolvedValue([makeCondition(SNOMED_DIABETES_T2)]);

            const calc = createUnifiedFormulaCalculator(buildConfig([
                {
                    type: 'radio' as const,
                    name: 'dm',
                    label: 'Diabetes?',
                    snomedCode: SNOMED_DIABETES_T2,
                    options: [
                        { value: 'no', label: 'No', checked: true },
                        { value: 'yes', label: 'Yes' }
                    ]
                }
            ]));

            container.innerHTML = calc.generateHTML();
            calc.initialize(null, null, container);
            await flushAsync();

            const yesRadio = container.querySelector('input[name="dm"][value="yes"]') as HTMLInputElement;
            expect(yesRadio.checked).toBe(true);
        });

        test('should keep default when patient has no matching condition', async () => {
            condSpy.mockResolvedValue([]);

            const calc = createUnifiedFormulaCalculator(buildConfig([
                {
                    type: 'radio' as const,
                    name: 'dm',
                    label: 'Diabetes?',
                    snomedCode: SNOMED_DIABETES_T2,
                    options: [
                        { value: 'no', label: 'No', checked: true },
                        { value: 'yes', label: 'Yes' }
                    ]
                }
            ]));

            container.innerHTML = calc.generateHTML();
            calc.initialize(null, null, container);
            await flushAsync();

            const noRadio = container.querySelector('input[name="dm"][value="no"]') as HTMLInputElement;
            expect(noRadio.checked).toBe(true);
        });

        test('should support comma-separated SNOMED codes (match Type 1 OR Type 2)', async () => {
            // Patient has Type 1 DM only
            condSpy.mockResolvedValue([makeCondition(SNOMED_DIABETES_T1)]);

            const calc = createUnifiedFormulaCalculator(buildConfig([
                {
                    type: 'radio' as const,
                    name: 'dm',
                    label: 'Diabetes?',
                    snomedCode: `${SNOMED_DIABETES_T2},${SNOMED_DIABETES_T1}`,
                    options: [
                        { value: 'no', label: 'No', checked: true },
                        { value: 'yes', label: 'Yes' }
                    ]
                }
            ]));

            container.innerHTML = calc.generateHTML();
            calc.initialize(null, null, container);
            await flushAsync();

            const yesRadio = container.querySelector('input[name="dm"][value="yes"]') as HTMLInputElement;
            expect(yesRadio.checked).toBe(true);
        });

        test('should batch all SNOMED codes into a single getConditions call', async () => {
            condSpy.mockResolvedValue([
                makeCondition(SNOMED_DIABETES_T2),
                makeCondition(SNOMED_SMOKING)
            ]);

            const calc = createUnifiedFormulaCalculator(buildConfig([
                {
                    type: 'radio' as const,
                    name: 'dm',
                    label: 'Diabetes?',
                    snomedCode: SNOMED_DIABETES_T2,
                    options: [
                        { value: 'no', label: 'No', checked: true },
                        { value: 'yes', label: 'Yes' }
                    ]
                },
                {
                    type: 'radio' as const,
                    name: 'smoker',
                    label: 'Smoker?',
                    snomedCode: SNOMED_SMOKING,
                    options: [
                        { value: 'no', label: 'No', checked: true },
                        { value: 'yes', label: 'Yes' }
                    ]
                }
            ]));

            container.innerHTML = calc.generateHTML();
            calc.initialize(null, null, container);
            await flushAsync();

            // Single batched call with both codes
            expect(condSpy).toHaveBeenCalledTimes(1);
            expect(condSpy).toHaveBeenCalledWith(
                expect.arrayContaining([SNOMED_DIABETES_T2, SNOMED_SMOKING])
            );

            // Both fields auto-selected
            const dmYes = container.querySelector('input[name="dm"][value="yes"]') as HTMLInputElement;
            const smokerYes = container.querySelector('input[name="smoker"][value="yes"]') as HTMLInputElement;
            expect(dmYes.checked).toBe(true);
            expect(smokerYes.checked).toBe(true);
        });

        test('should not call getConditions when no radio fields have snomedCode', async () => {
            const calc = createUnifiedFormulaCalculator(buildConfig([
                {
                    type: 'radio' as const,
                    name: 'option',
                    label: 'Some option',
                    options: [
                        { value: 'a', label: 'A', checked: true },
                        { value: 'b', label: 'B' }
                    ]
                }
            ]));

            container.innerHTML = calc.generateHTML();
            calc.initialize(null, null, container);
            await flushAsync();

            expect(condSpy).not.toHaveBeenCalled();
        });

        test('should not call getConditions when FHIR is not ready', async () => {
            readySpy.mockReturnValue(false);

            const calc = createUnifiedFormulaCalculator(buildConfig([
                {
                    type: 'radio' as const,
                    name: 'dm',
                    label: 'Diabetes?',
                    snomedCode: SNOMED_DIABETES_T2,
                    options: [
                        { value: 'no', label: 'No', checked: true },
                        { value: 'yes', label: 'Yes' }
                    ]
                }
            ]));

            container.innerHTML = calc.generateHTML();
            calc.initialize(null, null, container);
            await flushAsync();

            expect(condSpy).not.toHaveBeenCalled();
        });

        test('should handle getConditions error gracefully', async () => {
            condSpy.mockRejectedValue(new Error('FHIR server unavailable'));

            const calc = createUnifiedFormulaCalculator(buildConfig([
                {
                    type: 'radio' as const,
                    name: 'dm',
                    label: 'Diabetes?',
                    snomedCode: SNOMED_DIABETES_T2,
                    options: [
                        { value: 'no', label: 'No', checked: true },
                        { value: 'yes', label: 'Yes' }
                    ]
                }
            ]));

            container.innerHTML = calc.generateHTML();
            calc.initialize(null, null, container);
            await flushAsync();

            // Should not throw, default remains
            const noRadio = container.querySelector('input[name="dm"][value="no"]') as HTMLInputElement;
            expect(noRadio.checked).toBe(true);
        });

        test('should only match first non-default option per field (no double-set)', async () => {
            // Patient has both Type 1 and Type 2 — field should only be set once
            condSpy.mockResolvedValue([
                makeCondition(SNOMED_DIABETES_T1),
                makeCondition(SNOMED_DIABETES_T2)
            ]);

            const calc = createUnifiedFormulaCalculator(buildConfig([
                {
                    type: 'radio' as const,
                    name: 'dm',
                    label: 'Diabetes?',
                    snomedCode: `${SNOMED_DIABETES_T2},${SNOMED_DIABETES_T1}`,
                    options: [
                        { value: 'no', label: 'No', checked: true },
                        { value: 'yes', label: 'Yes' }
                    ]
                }
            ]));

            container.innerHTML = calc.generateHTML();
            calc.initialize(null, null, container);
            await flushAsync();

            const yesRadio = container.querySelector('input[name="dm"][value="yes"]') as HTMLInputElement;
            expect(yesRadio.checked).toBe(true);
        });

        test('should handle condition with multiple codings', async () => {
            // Condition resource has both SNOMED and ICD-10 codings
            condSpy.mockResolvedValue([{
                resourceType: 'Condition',
                code: {
                    coding: [
                        { system: 'http://hl7.org/fhir/sid/icd-10-cm', code: 'E11.9' },
                        { system: 'http://snomed.info/sct', code: SNOMED_DIABETES_T2 }
                    ]
                }
            }]);

            const calc = createUnifiedFormulaCalculator(buildConfig([
                {
                    type: 'radio' as const,
                    name: 'dm',
                    label: 'Diabetes?',
                    snomedCode: SNOMED_DIABETES_T2,
                    options: [
                        { value: 'no', label: 'No', checked: true },
                        { value: 'yes', label: 'Yes' }
                    ]
                }
            ]));

            container.innerHTML = calc.generateHTML();
            calc.initialize(null, null, container);
            await flushAsync();

            const yesRadio = container.querySelector('input[name="dm"][value="yes"]') as HTMLInputElement;
            expect(yesRadio.checked).toBe(true);
        });
    });
});
