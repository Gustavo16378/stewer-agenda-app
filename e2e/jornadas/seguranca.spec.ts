/**
 * Seguranca no navegador, caixa preta: os cabecalhos que a producao manda (aplicados
 * pelo servidor dos testes a partir do mesmo dist/_headers), script injetado que nao
 * roda, nome com HTML que aparece como texto, e sessao que some ao sair.
 */
import { expect, test } from '@playwright/test';

import { API, entrar, naTela, SEED, unico } from '../apoio';

test('a pagina vem com CSP, nosniff e sem deixar embutir', async ({ request }) => {
  const r = await request.get('/entrar');
  const h = r.headers();
  expect(h['content-security-policy']).toContain("default-src 'self'");
  expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(h['content-security-policy']).toContain("object-src 'none'");
  expect(h['content-security-policy']).not.toContain("'unsafe-eval'");
  expect(h['content-security-policy']).not.toMatch(/script-src[^;]*'unsafe-inline'/);
  expect(h['x-content-type-options']).toBe('nosniff');
  expect(h['x-frame-options']).toBe('DENY');
  expect(h['strict-transport-security']).toContain('max-age=');
});

test('script injetado na pagina nao roda (a CSP barra)', async ({ page }) => {
  const violacoes: string[] = [];
  page.on('console', (m) => {
    if (/Content Security Policy/i.test(m.text())) violacoes.push(m.text());
  });
  await page.goto('/entrar');
  await expect(naTela(page, 'Bem-vindo de volta.')).toBeVisible();
  const rodou = await page.evaluate(async () => {
    const s = document.createElement('script');
    s.textContent = 'window.__injetado = true';
    document.body.appendChild(s);
    await new Promise((r) => setTimeout(r, 200));
    return (window as unknown as { __injetado?: boolean }).__injetado === true;
  });
  expect(rodou).toBe(false);
  expect(violacoes.length).toBeGreaterThan(0);
});

test('nome com HTML aparece como texto e nao executa nada', async ({ page, request }) => {
  const { email } = unico('Xss');
  const nome = '<img src=x onerror="window.__xss=1"> Xss';
  const r = await request.post(`${API}/auth/registrar`, {
    data: { nome, email, senha: 'senha-e2e-123' },
  });
  expect(r.status()).toBe(201);
  let dialogo = false;
  page.on('dialog', (d) => {
    dialogo = true;
    void d.dismiss();
  });
  await entrar(page, email, 'senha-e2e-123');
  await page.getByRole('tab', { name: 'Perfil' }).filter({ visible: true }).first().click();
  await expect(
    page.getByText(nome, { exact: true }).filter({ visible: true }).first()
  ).toBeVisible();
  expect(
    await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)
  ).toBeUndefined();
  expect(await page.locator('img[src="x"]').count()).toBe(0);
  expect(dialogo).toBe(false);
});

test('o token nunca vai na URL e some do aparelho ao sair', async ({ page }) => {
  const urls: string[] = [];
  page.on('request', (q) => urls.push(q.url()));
  await entrar(page, SEED.stewer, SEED.senha);
  const token = await page.evaluate(() => localStorage.getItem('stewer.jwt'));
  expect(token).toBeTruthy();
  expect(urls.some((u) => u.includes(token!))).toBe(false);

  await page.goto('/conta');
  await page.getByRole('button', { name: 'Sair da conta' }).filter({ visible: true }).click();
  await expect(page.getByLabel('Senha', { exact: true }).filter({ visible: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('stewer.jwt'))).toBeNull();

  // e a tela de equipe, aberta direto pelo endereco, manda para o login
  await page.goto('/visao-geral');
  await expect(page.getByLabel('Senha', { exact: true }).filter({ visible: true })).toBeVisible();
});
