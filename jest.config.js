/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  // trava o fuso dos workers em UTC-3 (ver jest.global-setup.js)
  globalSetup: '<rootDir>/jest.global-setup.js',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transformIgnorePatterns: [
    // `standard-navigation` entra na lista porque o expo-router o importa como ESM
    // puro: sem transformar, qualquer teste de tela que toque em navegacao morre em
    // "Must use import to load ES Module".
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|standard-navigation|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|nativewind|react-native-css-interop))',
  ],
  moduleNameMapper: {
    // o global.css e compilado pelo nativewind/metro, que nao roda no Jest
    '\\.css$': '<rootDir>/src/test/style-mock.js',
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/api/schema.d.ts', '!src/**/*.d.ts'],
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}', '**/*.test.{ts,tsx}'],
};
