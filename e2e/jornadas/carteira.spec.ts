/**
 * O motivo do app existir: guardar a clientela. O Stewer completa a ficha, guarda o
 * antes e depois e ve tudo na linha do tempo; o admin ve o aniversariante no painel e
 * cada mudanca na auditoria.
 */
import { expect, test, type APIRequestContext } from '@playwright/test';

import {
  agendarPelaApi,
  API,
  botao,
  entrar,
  login,
  naTela,
  novoCliente,
  registrar,
  SEED,
} from '../apoio';

async function idDe(request: APIRequestContext, token: string) {
  const r = await request.get(`${API}/auth/eu`, { headers: { Authorization: `Bearer ${token}` } });
  return ((await r.json()) as { id: string }).id;
}

/** "12/11/1990": aniversario hoje, para cair nos aniversariantes do mes. */
function aniversarioHoje() {
  const hoje = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  return `${hoje.slice(0, 6)}1990`;
}

test('Stewer completa a ficha, guarda o antes e depois e ve a linha do tempo', async ({
  page,
  request,
}, info) => {
  const cliente = await novoCliente(request, 'Carteira');
  await agendarPelaApi(request, cliente);
  const id = await idDe(request, cliente.token);

  await entrar(page, SEED.stewer, SEED.senha);
  await page.goto(`/cliente/${id}`);
  await expect(naTela(page, cliente.nome)).toBeVisible();
  await expect(naTela(page, 'Próximo horário')).toBeVisible();
  await registrar(page, info, '01 ficha vazia');

  await test.step('preenche a ficha', async () => {
    await botao(page, 'Preencher ficha').click();
    await expect(naTela(page, 'Ficha do cliente')).toBeVisible();
    await page.getByLabel('Aniversário').filter({ visible: true }).fill(aniversarioHoje());
    await page.getByRole('checkbox', { name: 'Instagram' }).filter({ visible: true }).click();
    await page.getByRole('checkbox', { name: 'VIP' }).filter({ visible: true }).click();
    await page.getByRole('checkbox', { name: 'Oval' }).filter({ visible: true }).click();
    await page
      .getByLabel('O que manter')
      .filter({ visible: true })
      .fill('Volume em cima, nuca baixa');
    await registrar(page, info, '02 editar ficha');
    await botao(page, 'Salvar ficha').click();
  });

  await test.step('a ficha mostra o que foi salvo', async () => {
    await expect(naTela(page, 'Veio por Instagram')).toBeVisible();
    await expect(naTela(page, 'VIP')).toBeVisible();
    await expect(naTela(page, 'Faz aniversário hoje')).toBeVisible();
    await expect(naTela(page, 'Volume em cima, nuca baixa')).toBeVisible();
    await registrar(page, info, '03 ficha preenchida');
  });

  await test.step('guarda a foto de depois', async () => {
    await page.getByRole('radio', { name: 'Depois' }).filter({ visible: true }).click();
    const escolha = page.waitForEvent('filechooser');
    await botao(page, 'Escolher foto').click();
    await (await escolha).setFiles('e2e/arquivos/corte.jpg');
    await expect(
      page.getByRole('button', { name: /^Foto depois/ }).filter({ visible: true })
    ).toBeVisible();
    await registrar(page, info, '04 foto guardada');
  });

  await test.step('tudo aparece na linha do tempo', async () => {
    await expect(naTela(page, `Atualizou a ficha de ${cliente.nome}`)).toBeVisible();
    await expect(naTela(page, `Adicionou foto (depois) de ${cliente.nome}`)).toBeVisible();
    await expect(naTela(page, new RegExp(`Marcou .* de ${cliente.nome}`))).toBeVisible();
  });
});

test('admin ve o aniversariante no painel e a mudanca na auditoria', async ({
  page,
  request,
}, info) => {
  const cliente = await novoCliente(request, 'Niver');
  const id = await idDe(request, cliente.token);
  const tokenStewer = await login(request, SEED.stewer, SEED.senha);
  const [d, m] = aniversarioHoje().split('/');
  const r = await request.put(`${API}/clientes/${id}/ficha`, {
    headers: { Authorization: `Bearer ${tokenStewer}` },
    data: { dataNascimento: `1990-${m}-${d}`, etiquetas: ['VIP'] },
  });
  expect(r.ok()).toBeTruthy();

  await entrar(page, SEED.admin, SEED.senha);
  await page.getByRole('tab', { name: 'Painel' }).filter({ visible: true }).first().click();
  await expect(naTela(page, 'Aniversariantes do mês')).toBeVisible();
  await expect(naTela(page, cliente.nome)).toBeVisible();
  await registrar(page, info, '01 painel com aniversariante');

  await page.getByRole('link', { name: 'Abrir a auditoria' }).filter({ visible: true }).click();
  await expect(naTela(page, 'Auditoria')).toBeVisible();
  await page.getByRole('radio', { name: 'Clientes' }).filter({ visible: true }).click();
  await expect(naTela(page, `Atualizou a ficha de ${cliente.nome}`)).toBeVisible();
  await expect(naTela(page, `${cliente.nome} criou a conta pelo app`)).toBeVisible();
  await registrar(page, info, '02 auditoria');
});
