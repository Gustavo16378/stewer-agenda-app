/**
 * O Stewer recebe o pedido pelo WhatsApp e marca pelo painel: cadastra o cliente na hora
 * (nome + WhatsApp), escolhe os servicos, ve os horarios livres da agenda dele e confirma.
 * Em iPhone, Android e desktop.
 */
import { expect, test } from '@playwright/test';

import { botao, entrar, naTela, registrar, SEED, semRolagemLateral, unico } from '../apoio';

const HORA = /^\d\d:\d\d$/;

test('Stewer cadastra um cliente novo e marca o horario dele', async ({ page }, info) => {
  const { nome } = unico('WhatsApp');

  await test.step('na agenda, o atalho para marcar', async () => {
    await entrar(page, SEED.stewer, SEED.senha);
    await expect(naTela(page, 'Sua agenda')).toBeVisible();
    await botao(page, 'Marcar horário para um cliente').click();
    await expect(naTela(page, 'Para quem?')).toBeVisible();
    await semRolagemLateral(page);
    await registrar(page, info, '01 para quem');
  });

  await test.step('cadastra o cliente com nome e WhatsApp', async () => {
    await botao(page, 'Cadastrar cliente novo').click();
    const cadastrar = botao(page, 'Cadastrar e escolher o serviço');
    await expect(cadastrar).toBeDisabled();
    await page.getByLabel('Nome completo').filter({ visible: true }).fill(nome);
    await page.getByLabel('WhatsApp').filter({ visible: true }).fill('63991110000');
    await expect(page.getByLabel('WhatsApp').filter({ visible: true })).toHaveValue(
      '(63) 9 9111-0000'
    );
    await registrar(page, info, '02 cliente novo');
    await cadastrar.click();
  });

  await test.step('servicos e horario na agenda dele', async () => {
    await expect(naTela(page, 'O que vamos fazer?')).toBeVisible();
    await expect(naTela(page, `Para ${nome}`)).toBeVisible();
    await page
      .getByRole('checkbox', { name: /^Barba/ })
      .filter({ visible: true })
      .first()
      .click();
    await botao(page, 'Continuar').click();

    // o profissional marca na propria agenda: o passo "Com quem?" e pulado
    await expect(naTela(page, 'Quando fica bom?')).toBeVisible();
    const horarios = page.getByRole('button', { name: HORA }).filter({ visible: true });
    await expect(horarios.first()).toBeVisible();
    await horarios.nth(Math.floor(Math.random() * (await horarios.count()))).click();
    await botao(page, 'Continuar').click();
  });

  await test.step('confirma e cai no atendimento marcado', async () => {
    await expect(naTela(page, 'Tudo certo?')).toBeVisible();
    await expect(naTela(page, nome)).toBeVisible();
    await registrar(page, info, '03 confirmacao');
    await botao(page, 'Confirmar horário').click();
    await expect(naTela(page, nome)).toBeVisible();
    await expect(naTela(page, 'Tudo certo?')).toHaveCount(0);
    await registrar(page, info, '04 atendimento marcado');
  });

  await test.step('o cliente aparece na busca de quem ja e cliente', async () => {
    await page.goto('/novo-agendamento/cliente');
    await page.getByLabel('Buscar cliente').filter({ visible: true }).fill('99111-0000');
    await expect(botao(page, new RegExp(`^${nome}`))).toBeVisible();
  });
});
