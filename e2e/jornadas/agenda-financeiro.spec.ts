/**
 * O dia a dia do Stewer e o fechamento do admin: ver a semana e o mes, pular para uma
 * data, dar baixa (Atendido) direto na agenda e ver o valor entrar no Financeiro.
 *
 * O relogio do navegador e adiantado para meia hora depois do horario marcado: assim o
 * horario "ja aconteceu" para o app e a baixa aparece, sem precisar criar nada no passado.
 */
import { expect, test } from '@playwright/test';

import {
  agendarPelaApi,
  botao,
  ehCelular,
  entrar,
  naTela,
  novoCliente,
  registrar,
  SEED,
} from '../apoio';

test('Stewer da baixa na agenda e o admin ve o valor no Financeiro', async ({
  page,
  browser,
  request,
}, info) => {
  const cliente = await novoCliente(request, 'Baixa');
  const marcado = await agendarPelaApi(request, cliente);
  const depois = new Date(Date.parse(marcado.inicio) + 30 * 60_000);
  await page.clock.setFixedTime(depois);

  await entrar(page, SEED.stewer, SEED.senha);
  await expect(naTela(page, 'Sua agenda')).toBeVisible();

  await test.step('o horario que ja comecou tem Atendido e Faltou', async () => {
    const atendido = page
      .getByRole('button', { name: new RegExp(`^Dar baixa: ${cliente.nome}, .* atendido$`) })
      .filter({ visible: true });
    await expect(atendido).toBeVisible();
    await expect(
      page
        .getByRole('button', { name: new RegExp(`^Dar baixa: ${cliente.nome}, .* faltou$`) })
        .filter({ visible: true })
    ).toBeVisible();
    await registrar(page, info, '01 agenda com baixa');
    page.once('dialog', (d) => void d.accept());
    await atendido.click();
    await expect(atendido).toHaveCount(0);
    await expect(naTela(page, 'Concluído')).toBeVisible();
  });

  await test.step('semana, mes e escolher data', async () => {
    await page.getByRole('radio', { name: 'Semana' }).filter({ visible: true }).click();
    await expect(naTela(page, '(hoje)')).toBeVisible();
    await registrar(page, info, '02 semana');
    await page.getByRole('radio', { name: 'Mês' }).filter({ visible: true }).click();
    await expect(
      page
        .getByRole('button', { name: /, \d+ atendimentos?$/ })
        .filter({ visible: true })
        .first()
    ).toBeVisible();
    await registrar(page, info, '03 mes');

    await botao(page, 'Escolher data').click();
    await expect(naTela(page, 'Escolher data')).toBeVisible();
    await page
      .getByRole('button', { name: 'Próximo mês no calendário' })
      .filter({ visible: true })
      .click();
    // o dia 15 do mes seguinte, direto, sem passar dia por dia (o calendario do seletor
    // vem depois da grade do mes na pagina, por isso o ultimo)
    await page
      .getByRole('button', { name: /, 15 de \p{L}+, \d+ atendimentos?$/u })
      .filter({ visible: true })
      .last()
      .click();
    await expect(naTela(page, /^15 de /)).toBeVisible();
  });

  await test.step('o admin ve o faturado no Financeiro', async () => {
    const contexto = await browser.newContext({ ...info.project.use });
    const admin = await contexto.newPage();
    await admin.clock.setFixedTime(depois);
    await entrar(admin, SEED.admin, SEED.senha);
    if (ehCelular(info)) {
      await admin.getByRole('tab', { name: 'Painel' }).filter({ visible: true }).first().click();
      await admin
        .getByRole('link', { name: 'Abrir o financeiro' })
        .filter({ visible: true })
        .click();
    } else {
      await admin
        .getByRole('tab', { name: 'Financeiro' })
        .filter({ visible: true })
        .first()
        .click();
    }
    await expect(naTela(admin, 'Tudo sai da agenda')).toBeVisible();
    await expect(naTela(admin, 'faturado')).toBeVisible();
    await expect(
      admin.getByRole('img', { name: /^Gráfico do faturamento/ }).filter({ visible: true })
    ).toBeVisible();
    await expect(naTela(admin, 'O que mais vende')).toBeVisible();
    await expect(naTela(admin, marcado.servico.nome)).toBeVisible();
    // o periodo anda para tras e volta
    await admin.getByRole('radio', { name: 'Ano' }).filter({ visible: true }).click();
    await expect(naTela(admin, 'Mês a mês')).toBeVisible();
    await registrar(admin, info, '04 financeiro');
    await contexto.close();
  });
});
