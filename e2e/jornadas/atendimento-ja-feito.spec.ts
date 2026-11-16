/**
 * O Stewer atendeu alguem que nao marcou pelo app e registra depois: escolhe o cliente,
 * os servicos, o dia e a hora em que comecou, e o atendimento entra ja concluido.
 * Em iPhone, Android e desktop.
 */
import { expect, test } from '@playwright/test';

import { botao, entrar, naTela, registrar, SEED, semRolagemLateral, unico } from '../apoio';

test('Stewer registra um atendimento que ja aconteceu', async ({ page }, info) => {
  const { nome } = unico('Avulso');

  await test.step('na agenda, o atalho para registrar', async () => {
    await entrar(page, SEED.stewer, SEED.senha);
    await expect(naTela(page, 'Sua agenda')).toBeVisible();
    await botao(page, 'Registrar atendimento já feito').click();
    await expect(naTela(page, 'Quem você atendeu?')).toBeVisible();
  });

  await test.step('cadastra quem veio sem marcar', async () => {
    await botao(page, 'Cadastrar cliente novo').click();
    await page.getByLabel('Nome completo').filter({ visible: true }).fill(nome);
    await page.getByLabel('WhatsApp').filter({ visible: true }).fill('63992220000');
    await botao(page, 'Cadastrar e escolher o serviço').click();
  });

  await test.step('servico', async () => {
    await expect(naTela(page, 'O que vamos fazer?')).toBeVisible();
    await page
      .getByRole('checkbox', { name: /^Barba/ })
      .filter({ visible: true })
      .first()
      .click();
    await botao(page, 'Continuar').click();
  });

  await test.step('quando foi: ontem as 15:00; hora no futuro nao passa', async () => {
    await expect(naTela(page, 'Quando foi?')).toBeVisible();
    const hora = page.getByLabel('Que horas começou?').filter({ visible: true });

    // hoje as 23:59 ainda nao chegou (o teste nao roda nesse minuto)
    await hora.fill('2359');
    await expect(hora).toHaveValue('23:59');
    await expect(naTela(page, /ainda não chegou/)).toBeVisible();
    await expect(botao(page, 'Continuar')).toBeDisabled();

    // ontem: o segundo dia da faixa
    await page
      .getByRole('button', { name: /^(segunda|terça|quarta|quinta|sexta|sábado|domingo)/i })
      .filter({ visible: true })
      .nth(1)
      .click();
    await hora.fill('1500');
    await semRolagemLateral(page);
    await registrar(page, info, '01 quando foi');
    await botao(page, 'Continuar').click();
  });

  await test.step('confere e registra: entra concluido', async () => {
    await expect(naTela(page, 'Confere o atendimento')).toBeVisible();
    await expect(naTela(page, /15:00/)).toBeVisible();
    await registrar(page, info, '02 confere');
    await botao(page, 'Registrar atendimento').click();
    await expect(naTela(page, nome)).toBeVisible();
    await expect(naTela(page, 'Concluído')).toBeVisible();
    // a ficha do cliente ja conta essa visita
    await expect(naTela(page, /^1$/)).toBeVisible();
    await registrar(page, info, '03 registrado');
  });
});
