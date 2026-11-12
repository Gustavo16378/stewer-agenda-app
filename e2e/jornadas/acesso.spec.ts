/** Entrar, errar a senha, pedir codigo de senha nova e sair. */
import { expect, test } from '@playwright/test';

import { botao, entrar, naTela, novoCliente, registrar } from '../apoio';

test('senha errada avisa sem sair da tela; a certa entra; sair volta para o login', async ({
  page,
  request,
}, info) => {
  const cliente = await novoCliente(request, 'Acesso');

  await page.goto('/');
  await expect(botao(page, 'Entrar')).toBeDisabled();
  await page.getByLabel('E-mail').fill(cliente.email);
  await page.getByLabel('Senha', { exact: true }).fill('senha-errada-123');
  await botao(page, 'Entrar').click();
  await expect(naTela(page, /senha/i).and(page.locator('[dir=auto]'))).toBeVisible();
  await registrar(page, info, '01 senha errada');

  await entrar(page, cliente.email, cliente.senha);
  await page.getByRole('tab', { name: 'Perfil' }).filter({ visible: true }).first().click();
  page.once('dialog', (d) => void d.accept());
  await botao(page, 'Sair da conta').click();
  await expect(naTela(page, 'Bem-vindo de volta.')).toBeVisible();
});

test('esqueci a senha pede o codigo por e-mail', async ({ page, request }, info) => {
  const cliente = await novoCliente(request, 'Esqueci');
  await page.goto('/');
  await page.getByLabel('E-mail').fill(cliente.email);
  await botao(page, 'Esqueci minha senha').click();
  await expect(page.getByLabel('E-mail').filter({ visible: true })).toHaveValue(cliente.email);
  await botao(page, 'Mandar código').click();
  await expect(page.getByLabel('Código').filter({ visible: true })).toBeVisible();
  await registrar(page, info, '01 codigo enviado');
});
