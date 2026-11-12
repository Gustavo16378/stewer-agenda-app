/**
 * O que faz o app ser do Stewer: o retrato com a leitura do rosto, quem ele e, o
 * trabalho, onde ele atende (mapa e WhatsApp) e a abertura com o S. E o layout certo
 * para cada aparelho.
 */
import { expect, test } from '@playwright/test';

import { ehCelular, entrar, naTela, novoCliente, registrar, semRolagemLateral } from '../apoio';

test('inicio conta quem e o Stewer e leva ate a Boss House', async ({ page, request }, info) => {
  const cliente = await novoCliente(request, 'Vitrine');
  await entrar(page, cliente.email, cliente.senha);

  await expect(page.getByRole('img', { name: 'Retrato de Stewer Gabriel' }).first()).toBeVisible();
  await expect(naTela(page, 'Quem é Stewer')).toBeVisible();
  await expect(naTela(page, 'O trabalho')).toBeVisible();

  const mapa = page.getByRole('link', { name: /Abrir Boss House Barbearia no mapa/ });
  await mapa.scrollIntoViewIfNeeded();
  await expect(mapa).toBeVisible();
  await expect(naTela(page, /Q\. ACNE 1/)).toBeVisible();
  await semRolagemLateral(page);
  await registrar(page, info, '01 onde atende');
});

test('celular tem a barra de abas embaixo; desktop, o menu lateral', async ({
  page,
  request,
}, info) => {
  const cliente = await novoCliente(request, 'Layout');
  await entrar(page, cliente.email, cliente.senha);
  const abas = page.getByRole('tablist').filter({ visible: true }).first();
  await expect(abas).toBeVisible();
  const caixa = (await abas.boundingBox())!;
  const tela = page.viewportSize()!;
  if (ehCelular(info)) {
    expect(caixa.y + caixa.height, 'abas no rodape').toBeGreaterThan(tela.height - 120);
  } else {
    expect(caixa.x, 'menu na lateral esquerda').toBeLessThan(80);
    expect(caixa.width).toBeLessThan(300);
  }
});

test.describe('abertura', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('o S se desenha e a cortina sobe sozinha', async ({ page }, info) => {
    await page.goto('/');
    await expect(page.getByText('Stewer Gabriel').first()).toBeVisible();
    await page.waitForTimeout(700);
    await registrar(page, info, '01 abertura');
    // sai em ate ~2,5 s quando o app esta pronto; o login aparece por baixo
    await expect(naTela(page, 'Bem-vindo de volta.')).toBeVisible({ timeout: 8000 });
  });
});

test('o tema acompanha o aparelho (claro ou escuro)', async ({ page }, info) => {
  await page.goto('/');
  await expect(naTela(page, 'Bem-vindo de volta.')).toBeVisible();
  const escuro = info.project.use.colorScheme === 'dark';
  await expect(page.locator('html')).toHaveClass(escuro ? /\bdark\b/ : /^(?!.*\bdark\b)/);
  // o fundo da tela tem de ser o carvao no escuro e o papel no claro
  const fundo = await naTela(page, 'Bem-vindo de volta.').evaluate((el) => {
    let n: Element | null = el;
    while (n) {
      const cor = getComputedStyle(n).backgroundColor;
      if (cor && cor !== 'rgba(0, 0, 0, 0)' && cor !== 'transparent') return cor;
      n = n.parentElement;
    }
    return '';
  });
  const [r] = (fundo.match(/\d+/g) ?? ['0']).map(Number);
  expect(escuro ? r! < 60 : r! > 200, `fundo ${fundo}`).toBe(true);
});
