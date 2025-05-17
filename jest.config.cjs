// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/configuration

/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: false
    }]
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^src/(.*)$': '<rootDir>/src/$1'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleDirectories: ['node_modules', 'src'],
  collectCoverage: false,
  coverageThreshold: null,
  globals: {
    crypto: {
      randomUUID: () => 'test-uuid'
    },
    'process.env': {
      NODE_ENV: 'test',
      API_URL: 'ws://localhost:3000/collaboration'
    }
  },
  transformIgnorePatterns: [
    'node_modules/(?!(node-fetch|fetch-blob|formdata-polyfill|data-uri-to-buffer|web-streams-polyfill)/)'
  ]
};

module.exports = config; 