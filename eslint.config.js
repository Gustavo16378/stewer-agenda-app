// Flat config (ESLint 9). `npm run lint`
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  expoConfig,
  prettierRecommended,
  {
    ignores: [
      'dist/*',
      'coverage/*',
      '.expo/*',
      'node_modules/*',
      // gerado por `npm run api:types`, nao editar nem lintar
      'src/api/schema.d.ts',
      // gerado pelo Expo em `expo start`/`export`, ja esta no .gitignore
      'expo-env.d.ts',
      // export do Claude Design: support.js e image-slot.js sao runtime do export, nao codigo do app
      'design/*',
    ],
  },
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'import/order': [
        'warn',
        {
          groups: [['builtin', 'external'], 'internal', ['parent', 'sibling', 'index']],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },
  {
    // scripts de build rodam no Node puro: globais do Node e console liberados
    files: ['scripts/**/*.{js,mjs,cjs}', 'jest.global-setup.js'],
    languageOptions: {
      globals: { Buffer: 'readonly', process: 'readonly', console: 'readonly' },
    },
    rules: { 'no-console': 'off' },
  },
  {
    // testes e setup do Jest podem usar console e `require` dentro de mocks
    files: ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**', 'jest.setup.ts'],
    rules: { 'no-console': 'off', '@typescript-eslint/no-require-imports': 'off' },
  },
]);
