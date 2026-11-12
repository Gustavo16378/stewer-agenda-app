/**
 * Acessibilidade medida pelo axe-core nas telas principais: contraste de texto, nome em
 * todo botao e link, imagem com descricao. Uma regra violada derruba o teste com a lista
 * do que corrigir.
 */
import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { entrar, naTela, novoCliente, SEED } from '../apoio';

const REGRAS = ['color-contrast', 'button-name', 'link-name', 'image-alt', 'label'];

async function auditar(page: Page, tela: string) {
  const r = await new AxeBuilder({ page }).withRules(REGRAS).analyze();
  const problemas = r.violations.flatMap((v) =>
    v.nodes.map(
      (n) => `${v.id}: ${n.failureSummary?.split('\n')[1]?.trim()} -> ${n.html.slice(0, 120)}`
    )
  );
  expect(problemas, `acessibilidade em ${tela}`).toEqual([]);
}

test('login e criar conta', async ({ page }) => {
  await page.goto('/');
  await expect(naTela(page, 'Bem-vindo de volta.')).toBeVisible();
  await auditar(page, 'entrar');
  await page.getByRole('tab', { name: 'Criar conta' }).click();
  await expect(naTela(page, 'Sua primeira vez.')).toBeVisible();
  await auditar(page, 'criar conta');
});

test('inicio e fluxo de agendamento', async ({ page, request }) => {
  const cliente = await novoCliente(request, 'Axe');
  await entrar(page, cliente.email, cliente.senha);
  await expect(naTela(page, 'Quem é Stewer')).toBeVisible();
  await auditar(page, 'inicio');
  await page.goto('/novo-agendamento/servico');
  await expect(naTela(page, 'O que vamos fazer?')).toBeVisible();
  await auditar(page, 'servico');
  await page
    .getByRole('button', { name: /^Corte/ })
    .filter({ visible: true })
    .first()
    .click();
  await expect(naTela(page, 'Com quem?')).toBeVisible();
  await auditar(page, 'profissional');
  await page
    .getByRole('button', { name: /^Stewer/ })
    .filter({ visible: true })
    .first()
    .click();
  await expect(
    page
      .getByRole('button', { name: /^\d\d:\d\d$/ })
      .filter({ visible: true })
      .first()
  ).toBeVisible();
  await auditar(page, 'dia e horario');
});

test('agenda do Stewer', async ({ page }) => {
  await entrar(page, SEED.stewer, SEED.senha);
  await expect(naTela(page, 'Sua agenda')).toBeVisible();
  await auditar(page, 'agenda');
});
