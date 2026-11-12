/**
 * O dono da acesso de admin a outra pessoa pelo app, sem mexer no banco, e tira depois.
 * Quem ganhou o acesso entra de novo e cai no painel.
 */
import { expect, test } from '@playwright/test';

import { entrar, naTela, novoCliente, registrar, SEED } from '../apoio';

test('admin da acesso de admin, a pessoa entra no painel, e o acesso e tirado', async ({
  browser,
  page,
  request,
}, info) => {
  const pessoa = await novoCliente(request, 'Socio');

  await entrar(page, SEED.admin, SEED.senha);
  await page.getByRole('tab', { name: 'Equipe' }).filter({ visible: true }).first().click();
  await expect(naTela(page, 'Quem administra')).toBeVisible();

  await test.step('da o acesso', async () => {
    await page
      .getByRole('button', { name: 'Dar acesso de admin' })
      .filter({ visible: true })
      .click();
    await page.getByLabel('Quem vai administrar').filter({ visible: true }).fill(pessoa.nome);
    page.once('dialog', (d) => void d.accept());
    await page
      .getByRole('button', { name: `Dar acesso de admin para ${pessoa.nome}` })
      .filter({ visible: true })
      .click();
    await expect(naTela(page, `${pessoa.nome} agora é admin.`)).toBeVisible();
    await registrar(page, info, '01 acesso dado');
  });

  await test.step('a pessoa entra e cai no painel', async () => {
    const contexto = await browser.newContext();
    const outra = await contexto.newPage();
    await entrar(outra, pessoa.email, pessoa.senha);
    await expect(
      outra.getByRole('tab', { name: 'Equipe' }).filter({ visible: true }).first()
    ).toBeVisible();
    await contexto.close();
  });

  await test.step('tira o acesso', async () => {
    page.once('dialog', (d) => void d.accept());
    await page
      .getByRole('button', { name: `Tirar o acesso de admin de ${pessoa.nome}` })
      .filter({ visible: true })
      .click();
    await expect(naTela(page, `${pessoa.nome} não é mais admin.`)).toBeVisible();
  });
});
