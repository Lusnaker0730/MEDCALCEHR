# shared/ — Calculator Factory Functions

## Factories

### createScoringCalculator (scoring-calculator.ts)
For questionnaire-style calculators with discrete options.

```typescript
const config: ScoringCalculatorConfig = {
    id: 'phq-9',
    title: 'PHQ-9',
    sections: [{
        title: 'Depression Screening',
        questions: [{
            id: 'interest',
            text: 'Little interest or pleasure?',
            options: [
                { label: 'Not at all', value: 0 },
                { label: 'Several days', value: 1 },
                // ...
            ]
        }]
    }],
    inputType: 'radio',  // or 'checkbox', 'yesno'
    calculateScore: (values) => ({ score, interpretation }),
    riskLevels: [{ range: [0, 4], label: 'Minimal', severity: 'success' }]
};
export default createScoringCalculator(config);
```

### createUnifiedFormulaCalculator (unified-formula-calculator.ts)
For numeric-input calculators with mathematical formulas.

```typescript
const config: FormulaCalculatorConfig = {
    id: 'bmi-bsa',
    title: 'BMI & BSA',
    sections: [{
        title: 'Measurements',
        fields: [{
            id: 'weight', label: 'Weight', unit: 'kg',
            min: 0.5, max: 500,
            loincCode: '29463-7'  // FHIR auto-populate
        }]
    }],
    calculate: (values) => [{ label: 'BMI', value: w / (h * h), unit: 'kg/m²' }],
    // OR for complex multi-result calculators:
    complexCalculate: (getValue, getRadioValue, ...) => ({ results, alerts, breakdown })
};
export default createUnifiedFormulaCalculator(config);
```

### createConversionCalculator (conversion-calculator.ts)
For drug/unit conversion tables (e.g., opioid MME, benzo, steroid equivalents).

### createDynamicListCalculator (dynamic-list-calculator.ts)
For calculators with variable-length item lists (e.g., medication lists).

## Common Patterns

- Factories return `CalculatorModule` objects with `generateHTML()` and `initialize()`
- `initialize(client, patient, container)` binds events and triggers FHIR auto-population
- `uiBuilder` is used for all HTML generation (auto-escapes by default)
- `fhir-integration.ts` provides shared FHIR data fetching helpers
- Result display uses `uiBuilder.createResultItem()` which escapes values
