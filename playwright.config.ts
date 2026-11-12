/**
 * Jornadas de ponta a ponta: o app web de verdade (o mesmo export que vai para o
 * Cloudflare), num navegador de verdade, contra a API de verdade.
 *
 * Cada jornada roda em tres aparelhos: iPhone, Android e desktop. No CI entra tambem o
 * Safari (WebKit), o motor do iPhone. Cada passo importante vira um print no relatorio
 * (npx playwright show-report e2e/relatorio).
 *
 * Pre-requisitos: `npm run build` com EXPO_PUBLIC_API_URL apontando para a API, e a API
 * no ar com o seed de dev e CORS liberado para http://localhost:4173.
 */
import { defineConfig, devices } from '@playwright/test';

const PORTA = 4173;
const CI = !!process.env.CI;

const aparelhos = [
  { name: 'iphone', use: { ...devices['iPhone 14'], browserName: 'chromium' as const } },
  { name: 'android', use: { ...devices['Pixel 7'] } },
  {
    name: 'desktop',
    use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 820 } },
  },
];
if (process.env.E2E_WEBKIT) {
  aparelhos.push({
    name: 'safari',
    use: { ...devices['iPhone 14'] },
  } as (typeof aparelhos)[number]);
}

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/.resultados',
  globalSetup: './e2e/preparar.ts',
  timeout: 90_000,
  expect: {
    timeout: 20_000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.03, animations: 'disabled', caret: 'hide' },
  },
  // cada jornada cria o proprio cliente; da para rodar em paralelo sem um pisar no outro
  fullyParallel: true,
  workers: CI ? 2 : 3,
  retries: CI ? 1 : 0,
  forbidOnly: CI,
  reporter: CI
    ? [['github'], ['list'], ['html', { open: 'never', outputFolder: 'e2e/relatorio' }]]
    : [['list'], ['html', { open: 'never', outputFolder: 'e2e/relatorio' }]],
  use: {
    baseURL: `http://localhost:${PORTA}`,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    // sem a abertura animada e sem transicoes: os passos ficam deterministicos. A
    // abertura tem a propria jornada, com movimento ligado.
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: aparelhos,
  webServer: {
    command: `node e2e/servidor.mjs dist ${PORTA}`,
    url: `http://localhost:${PORTA}`,
    reuseExistingServer: !CI,
    timeout: 30_000,
  },
});
