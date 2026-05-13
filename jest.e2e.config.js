export default {
  clearMocks: true,
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['ts', 'js'],
  preset: 'ts-jest',
  reporters: ['default'],
  resolver: 'ts-jest-resolver',
  testEnvironment: 'node',
  testMatch: ['**/__e2e__/*.test.ts'],
  testPathIgnorePatterns: ['/dist/', '/node_modules/'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
        useESM: true
      }
    ]
  },
  verbose: true
}
