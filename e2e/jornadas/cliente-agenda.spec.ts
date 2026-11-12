/**
 * A jornada que importa: uma pessoa cria a conta, marca um horario com o Stewer, ve o
 * horario marcado, remarca e cancela. Em iPhone, Android e desktop.
 */
import { expect, test } from '@playwright/test';

import { botao, naTela, registrar, semRolagemLateral, unico } from '../apoio';

const HORA = /^\d\d:\d\d$/;

test('cliente cria a conta, marca, remarca e cancela um horario', async ({ page }, info) => {
  const { nome, email } = unico('Cliente');
  const primeiroNome = nome.split(' ')[0]!;

  await test.step('cria a conta pela tela', async () => {
    await page.goto('/');
    await expect(naTela(page, 'Bem-vindo de volta.')).toBeVisible();
    await registrar(page, info, '01 entrar');
    await page.getByRole('tab', { name: 'Criar conta' }).click();
    await page.getByLabel('Nome').fill(nome);
    await page.getByLabel('E-mail').fill(email);
    await page.getByLabel('Senha', { exact: true }).fill('senha-e2e-123');
    await registrar(page, info, '02 criar conta preenchido');
    await botao(page, 'Criar conta').click();
  });

  await test.step('cai no inicio com o retrato e o caminho para agendar', async () => {
    await expect(naTela(page, `${primeiroNome}.`)).toBeVisible();
    await expect(botao(page, 'Agendar horário')).toBeVisible();
    await semRolagemLateral(page);
    await registrar(page, info, '03 inicio');
  });

  await test.step('passo 1: escolhe o servico', async () => {
    await botao(page, 'Agendar horário').click();
    await expect(naTela(page, 'O que vamos fazer?')).toBeVisible();
    await semRolagemLateral(page);
    await registrar(page, info, '04 servico');
    await botao(page, /^Corte/).click();
  });

  await test.step('passo 2: escolhe o Stewer', async () => {
    await expect(naTela(page, 'Com quem?')).toBeVisible();
    await registrar(page, info, '05 profissional');
    await botao(page, /^Stewer/).click();
  });

  let hora = '';
  await test.step('passo 3: o primeiro dia livre ja vem escolhido; escolhe um horario', async () => {
    await expect(naTela(page, 'Quando fica bom?')).toBeVisible();
    const continuar = botao(page, 'Continuar');
    await expect(continuar).toBeDisabled();
    const horarios = page.getByRole('button', { name: HORA }).filter({ visible: true });
    await expect(horarios.first()).toBeVisible();
    const escolhido = horarios.nth(Math.floor(Math.random() * (await horarios.count())));
    hora = (await escolhido.innerText()).trim();
    await escolhido.click();
    await expect(continuar).toBeEnabled();
    await expect(naTela(page, `às ${hora}`)).toBeVisible();
    await semRolagemLateral(page);
    await registrar(page, info, '06 dia e horario');
    await continuar.click();
  });

  await test.step('passo 4: revisa o ticket e confirma', async () => {
    await expect(naTela(page, 'Tudo certo?')).toBeVisible();
    await expect(naTela(page, new RegExp(`^${hora} às`))).toBeVisible();
    await expect(naTela(page, 'Boss House Barbearia')).toBeVisible();
    await registrar(page, info, '07 confirmar');
    await botao(page, 'Confirmar horário').click();
  });

  await test.step('ve a confirmacao e o horario na lista', async () => {
    await expect(naTela(page, 'Horário marcado.')).toBeVisible();
    await expect(naTela(page, `às ${hora}`)).toBeVisible();
    await registrar(page, info, '08 horario marcado');
    await botao(page, 'Ver meus horários').click();
    await expect(naTela(page, new RegExp(hora))).toBeVisible();
    await registrar(page, info, '09 meus horarios');
  });

  await test.step('remarca para outro horario', async () => {
    await naTela(page, new RegExp(hora)).click();
    await registrar(page, info, '10 detalhe');
    await botao(page, 'Remarcar').click();
    await expect(naTela(page, 'Quando fica bom?')).toBeVisible();
    const outros = page
      .getByRole('button', { name: HORA })
      .filter({ visible: true })
      .filter({ hasNotText: hora });
    await expect(outros.first()).toBeVisible();
    hora = (await outros.first().innerText()).trim();
    await outros.first().click();
    await botao(page, 'Continuar').click();
    await botao(page, 'Confirmar novo horário').click();
    await expect(naTela(page, 'Horário remarcado.')).toBeVisible();
    await expect(naTela(page, `às ${hora}`)).toBeVisible();
    await registrar(page, info, '11 remarcado');
  });

  await test.step('cancela e o horario sai dos proximos', async () => {
    await botao(page, 'Ver meus horários').click();
    await naTela(page, new RegExp(hora)).click();
    page.once('dialog', (d) => void d.accept());
    await botao(page, /^Cancelar/).click();
    await expect(naTela(page, /cancelado/i)).toBeVisible();
    await registrar(page, info, '12 cancelado');
  });
});
