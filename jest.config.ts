import type { Config } from 'jest';

const config: Config = {
    clearMocks: true,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageProvider: 'v8',
    testEnvironment: 'node',

    // Test file patterns
    testMatch: [
        '**/tests/**/*.(test|spec).[jt]s?(x)',
        '**/__tests__/**/*.(test|spec).[jt]s?(x)',
    ],

    // Coverage settings
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/dashboard/**/*', // Exclude dashboard from coverage for now
        '!src/index.ts', // Exclude example file
    ],

    // Coverage thresholds
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
        },
    },

    // TypeScript transformation
    transform: {
        '^.+\\.[tj]s?$': [
            'ts-jest',
            {
                tsconfig: 'tsconfig.json',
            },
        ],
    },

    // Module resolution
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

    // Setup files
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

    // Timeouts
    testTimeout: 10000,

    // Verbose output
    verbose: true,
};

export default config;
