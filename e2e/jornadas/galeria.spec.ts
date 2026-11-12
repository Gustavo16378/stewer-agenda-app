/**
 * Passa por todas as telas de cada papel, confere que nada vaza para o lado e guarda um
 * print de cada uma no relatorio: e a galeria para revisar o visual a cada mudanca.
 */
import { expect, test } from '@playwright/test';

import { entrar, novoCliente, registrar, SEED, semRolagemLateral } from '../apoio';

const TELAS = {
  acesso: ['/entrar', '/criar-conta', '/esqueci-senha'],
  cliente: ['/inicio', '/agendar', '/meus-horarios', '/perfil', '/conta/dados', '/conta/senha'],
  profissional: ['/agenda', '/clientes', '/disponibilidade'],
  admin: [
    '/visao-geral',
    '/servicos',
    '/equipe',
    '/clientes',
    '/conta',
    '/auditoria',
    '/estudio',
    '/financeiro',
  ],
};

async function visitar(
  page: import('@playwright/test').Page,
  info: import('@playwright/test').TestInfo,
  rotas: string[],
  prefixo: string
) {
  for (const rota of rotas) {
    await page.goto(rota);
    await expect(page.locator('#root')).not.toBeEmpty();
    await page.waitForLoadState('networkidle');
    await semRolagemLateral(page);
    await registrar(page, info, `${prefixo} ${rota.replace(/\//g, ' ').trim()}`);
  }
}

test('telas de acesso', async ({ page }, info) => {
  await visitar(page, info, TELAS.acesso, 'acesso');
});

test('telas do cliente', async ({ page, request }, info) => {
  const c = await novoCliente(request, 'Galeria');
  await entrar(page, c.email, c.senha);
  await visitar(page, info, TELAS.cliente, 'cliente');
});

test('seus dados abre preenchido mesmo recarregando a pagina', async ({ page, request }) => {
  const c = await novoCliente(request, 'Recarga');
  await entrar(page, c.email, c.senha);
  await page.goto('/conta/dados');
  await expect(page.getByLabel('Nome').filter({ visible: true })).toHaveValue(c.nome);
  await expect(page.getByLabel('E-mail').filter({ visible: true })).toHaveValue(c.email);
});

test('telas do Stewer', async ({ page }, info) => {
  await entrar(page, SEED.stewer, SEED.senha);
  await visitar(page, info, TELAS.profissional, 'stewer');
});

test('telas do admin', async ({ page }, info) => {
  await entrar(page, SEED.admin, SEED.senha);
  await visitar(page, info, TELAS.admin, 'admin');
});
