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
      // relatorio e prints do Playwright (o relatorio html traz um bundle enorme)
      'e2e/relatorio/*',
      'e2e/.resultados/*',
      'scripts/e2e/capturas/*',
      // gerado por `npm run api:types`, nao editar nem lintar
      'src/api/schema.d.ts',
      // gerado pelo Expo em `expo start`/`export`, ja esta no .gitignore
      'expo-env.d.ts',
    ],
  },
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // o Metro nao descarta o que nao e usado: importar do pacote inteiro poe o
      // date-fns todo (com todas as linguas) no app da web. Cada funcao pelo caminho dela.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'date-fns', message: "Importe a funcao pelo caminho: 'date-fns/format'." },
            { name: 'date-fns/locale', message: "Use 'date-fns/locale/pt-BR'." },
          ],
        },
      ],
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
