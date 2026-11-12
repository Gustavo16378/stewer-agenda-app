/** Detalhes de conta que fazem diferenca no dia a dia: foto, senha visivel, telefone. */
import { expect, test } from '@playwright/test';

import { entrar, naTela, novoCliente, registrar } from '../apoio';

test('cliente poe foto de perfil na conta', async ({ page, request }, info) => {
  const cliente = await novoCliente(request, 'Foto');
  await entrar(page, cliente.email, cliente.senha);
  await page.getByRole('tab', { name: 'Perfil' }).filter({ visible: true }).first().click();
  const escolha = page.waitForEvent('filechooser');
  await page
    .getByRole('button', { name: 'Adicionar foto de perfil' })
    .filter({ visible: true })
    .click();
  await (await escolha).setFiles('e2e/arquivos/perfil.jpg');
  await expect(
    page.getByRole('button', { name: 'Trocar foto de perfil' }).filter({ visible: true })
  ).toBeVisible();
  await expect(
    page.getByRole('img', { name: `Foto de ${cliente.nome}` }).filter({ visible: true })
  ).toBeVisible();
  await registrar(page, info, '01 foto de perfil');
});

test('o olho mostra e esconde a senha', async ({ page }) => {
  await page.goto('/');
  const senha = page.getByLabel('Senha', { exact: true });
  await senha.fill('segredo-123');
  await expect(senha).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Mostrar senha' }).click();
  await expect(senha).not.toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Esconder senha' }).click();
  await expect(senha).toHaveAttribute('type', 'password');
});

test('telefone ganha a mascara enquanto digita', async ({ page }) => {
  await page.goto('/criar-conta');
  await expect(naTela(page, 'Sua primeira vez.')).toBeVisible();
  const tel = page.getByLabel('WhatsApp');
  await tel.pressSequentially('63985116783');
  await expect(tel).toHaveValue('(63) 9 8511-6783');
});

test('cliente informa o aniversario ao criar a conta e ve em Editar dados', async ({ page }) => {
  const email = `niver-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@exemplo.dev`;
  await page.goto('/criar-conta');
  await expect(naTela(page, 'Sua primeira vez.')).toBeVisible();
  await page.getByLabel('Nome').fill('Aniversariante Teste');
  await page.getByLabel('E-mail').fill(email);
  const nascimento = page.getByLabel('Data de nascimento');
  await nascimento.pressSequentially('20111994');
  await expect(nascimento).toHaveValue('20/11/1994');
  await page.getByLabel('Senha', { exact: true }).fill('segredo-123');
  await page.getByRole('button', { name: 'Criar conta' }).filter({ visible: true }).last().click();
  await expect(
    page.getByRole('tab', { name: 'Perfil' }).filter({ visible: true }).first()
  ).toBeVisible();

  await page.goto('/conta/dados');
  await expect(page.getByLabel('Data de nascimento').filter({ visible: true })).toHaveValue(
    '20/11/1994'
  );
});
