# calculators/ — Calculator Implementations

## Structure

Each calculator is a directory named with its kebab-case ID:

```
calculators/
├── index.ts              # Registry: calculatorModules[], loadCalculator()
├── shared/               # Factory functions (see shared/CLAUDE.md)
├── ascvd/                # Example: complex calculator
│   ├── index.ts          # Exports CalculatorModule (uses factory + custom logic)
│   └── calculation.ts    # Pure calculation functions
├── phq-9/                # Example: simple scoring calculator
│   └── index.ts          # Config object + createScoringCalculator() call
└── ... (87 total)
```

## Adding a New Calculator

1. Create `src/calculators/{id}/index.ts` where `id` matches `/^[a-z0-9-]+$/`
2. Pick the right factory from `shared/`:
   - **Scoring** (radio/checkbox/yesno questions) → `createScoringCalculator(config)`
   - **Formula** (numeric inputs + math) → `createUnifiedFormulaCalculator(config)`
   - **Conversion** (unit conversion) → `createConversionCalculator(config)`
   - **Dynamic list** (variable-length item list) → `createDynamicListCalculator(config)`
3. Register in `index.ts` → add entry to `calculatorModules` array with `{ id, title, category }`
4. Add translations in `src/i18n/locales/en.json` and `zh-TW.json`
5. Add test in `src/__tests__/calculators/{id}.test.ts`

## Calculator Module Interface

Every calculator must return a `CalculatorModule`:

```typescript
interface CalculatorModule {
    id: string;
    title: string;
    description: string;
    generateHTML(): string;
    initialize?(client: any, patient: any, container: HTMLElement): void;
}
```

## Registry (index.ts)

- `calculatorModules`: static metadata array (id, title, category, description)
- `loadCalculator(id)`: validates ID format + allowlist, then `import(./${id}/index.js)`
- `calculatorExists(id)`: check if ID is registered
- `getCalculatorMetadata(id)`: lookup metadata without loading

## Categories (14)

cardiovascular, renal, critical-care, pediatric, drug-conversion, infection, neurology, respiratory, metabolic, hematology, gastroenterology, obstetrics, psychiatry, general

## FHIR Auto-Population

Calculators declare `dataRequirements` in their config to auto-populate fields from FHIR:
- `loincCode` on number inputs → fetches latest Observation value
- `snomedCode` on radio inputs → detects active Conditions
- `observationCriteria` → yes/no fields based on presence of specific observations

The shared `fhir-integration.ts` handles all FHIR data fetching and field population.
