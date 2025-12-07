module.exports = {
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
    // Coverage thresholds (gradually increased from 5%)
    coverageThreshold: {
        global: {
            lines: 20,        // Increased from 5% to 20%
            statements: 20,   // Increased from 5% to 20%
            functions: 15,    // Increased from 5% to 15%
            branches: 10      // Increased from 3% to 10%
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
