export default {
  displayName: 'Music Arrangement BC',
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'node',
  rootDir: '../../../',
  testMatch: [
    '<rootDir>/src/modules/music-arrangement/**/__tests__/**/*.test.ts',
    '<rootDir>/src/modules/music-arrangement/**/*.test.ts'
  ],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/modules/music-arrangement/**/*.ts',
    '!src/modules/music-arrangement/**/*.d.ts',
    '!src/modules/music-arrangement/**/__tests__/**',
    '!src/modules/music-arrangement/**/index.ts'
  ],
  coverageDirectory: 'coverage/music-arrangement',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/modules/music-arrangement/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testTimeout: 10000,
  verbose: true,
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: '<rootDir>/tsconfig.json'
    }]
  },
  globals: {
    'ts-jest': {
      useESM: true
    }
  }
}; 