/**
 * Corte e barba no mesmo horario: a pessoa marca dois servicos, ve a soma de tempo e
 * valor em cada passo e o agendamento sai com os dois. Em iPhone, Android e desktop.
 */
import { expect, test } from '@playwright/test';

import { API, botao, entrar, naTela, novoCliente, registrar, semRolagemLateral } from '../apoio';

const HORA = /^\d\d:\d\d$/;

test('cliente marca dois servicos no mesmo agendamento', async ({ page, request }, info) => {
  const cliente = await novoCliente(request, 'Dupla');
  await entrar(page, cliente.email, cliente.senha);

  await test.step('passo 1: marca corte e barba e ve a soma', async () => {
    await page.goto('/novo-agendamento/servico');
    await expect(naTela(page, 'O que vamos fazer?')).toBeVisible();
    await expect(botao(page, 'Continuar')).toBeDisabled();

    const corte = page.getByRole('checkbox', { name: /^Corte/ }).filter({ visible: true }).first();
    const barba = page.getByRole('checkbox', { name: /^Barba/ }).filter({ visible: true }).first();
    await corte.click();
    await barba.click();
    await expect(corte).toBeChecked();
    await expect(barba).toBeChecked();
    // a faixa de baixo junta os nomes na ordem tocada
    await expect(naTela(page, /^Corte.* \+ Barba$/)).toBeVisible();
    await semRolagemLateral(page);
    await registrar(page, info, '01 dois servicos marcados');

    // desmarcar e marcar de novo nao duplica
    await barba.click();
    await expect(barba).not.toBeChecked();
    await barba.click();
    await botao(page, 'Continuar').click();
  });

  await test.step('passo 2: o Stewer, com a foto inteira', async () => {
    await expect(naTela(page, 'Com quem?')).toBeVisible();
    await semRolagemLateral(page);
    await registrar(page, info, '02 profissional');
    await botao(page, /^Stewer/).click();
  });

  await test.step('passo 3: escolhe um horario', async () => {
    await expect(naTela(page, 'Quando fica bom?')).toBeVisible();
    const horarios = page.getByRole('button', { name: HORA }).filter({ visible: true });
    await expect(horarios.first()).toBeVisible();
    await registrar(page, info, '03 horarios da soma');
    await horarios.nth(Math.floor(Math.random() * (await horarios.count()))).click();
    await botao(page, 'Continuar').click();
  });

  await test.step('passo 4: o ticket lista os dois e soma o valor', async () => {
    await expect(naTela(page, 'Tudo certo?')).toBeVisible();
    await expect(naTela(page, 'Serviços')).toBeVisible();
    await expect(naTela(page, /no total$/)).toBeVisible();
    await registrar(page, info, '04 confirmacao');
    await botao(page, 'Confirmar horário').click();
  });

  await test.step('o agendamento sai com os dois servicos', async () => {
    await expect(naTela(page, /Corte.* \+ Barba/)).toBeVisible();
    await registrar(page, info, '05 pronto');
    const r = await request.get(`${API}/agendamentos/meus`, {
      headers: { Authorization: `Bearer ${cliente.token}` },
    });
    const meus = (await r.json()) as { servicos: { nome: string }[]; duracaoMinutos: number }[];
    expect(meus).toHaveLength(1);
    expect(meus[0]!.servicos.map((s) => s.nome)).toEqual([
      expect.stringMatching(/^Corte/),
      'Barba',
    ]);
  });
});
