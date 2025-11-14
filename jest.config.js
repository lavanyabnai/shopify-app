/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'ESNext',
          moduleResolution: 'node',
          esModuleInterop: true,
        },
      },
    ],
  },
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/?(*.)+(spec|test).ts',
  ],
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    '!app/**/*.d.ts',
    '!app/entry.client.tsx',
    '!app/entry.server.tsx',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 30000, // 30 seconds for database operations
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  modulePathIgnorePatterns: [
    '<rootDir>/analytics_service/',
    '<rootDir>/node_modules/',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/analytics_service/',
    '<rootDir>/node_modules/',
  ],
};
