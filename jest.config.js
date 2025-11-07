export default {
    testEnvironment: 'jsdom',
    roots: ['<rootDir>/tests'],
    testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
    collectCoverageFrom: [
        'js/**/*.js',
        '!js/calculators/index.js',
        '!js/main.js',
        '!js/calculator-page.js',
        '!**/node_modules/**',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/js/$1',
    },
    transform: {},
    globals: {
        FHIR: {},
    },
    // Coverage thresholds (start low, gradually increase)
    coverageThreshold: {
        global: {
            lines: 5,
            statements: 5,
            functions: 5,
            branches: 3
        }
    },
    // Test timeout
    testTimeout: 10000,
    // Verbose output
    verbose: true,
    // Collect coverage from all files
    collectCoverage: false, // Enable with --coverage flag
    // Max workers for parallel execution
    maxWorkers: '50%',
};
