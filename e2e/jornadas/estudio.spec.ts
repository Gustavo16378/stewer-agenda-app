/**
 * O painel do estudio: o admin muda o que o cliente ve (horario, frase, fotos) sem mexer
 * em codigo, e o cliente ve na hora. No fim tudo volta ao padrao, para nao mudar o que
 * as outras jornadas, rodando em paralelo, esperam ver.
 */
import { expect, test, type APIRequestContext, type Page, type TestInfo } from '@playwright/test';

import {
  API,
  botao,
  ehCelular,
  entrar,
  login,
  naTela,
  novoCliente,
  registrar,
  SEED,
} from '../apoio';

async function abrirEstudio(page: Page, info: TestInfo) {
  if (ehCelular(info)) {
    await page.getByRole('tab', { name: 'Painel' }).filter({ visible: true }).first().click();
    await page.getByRole('link', { name: 'Abrir o estúdio' }).filter({ visible: true }).click();
  } else {
    await page.getByRole('tab', { name: 'Estúdio' }).filter({ visible: true }).first().click();
  }
  await expect(naTela(page, 'O que o cliente vê no app')).toBeVisible();
}

async function voltarAoPadrao(request: APIRequestContext) {
  const token = await login(request, SEED.admin, SEED.senha);
  const auth = { Authorization: `Bearer ${token}` };
  await request.put(`${API}/estudio`, { headers: auth, data: {} });
  const estudio = (await (await request.get(`${API}/estudio`)).json()) as {
    fotos: { id: string }[];
    retrato?: { id: string } | null;
  };
  for (const f of [...estudio.fotos, ...(estudio.retrato ? [estudio.retrato] : [])]) {
    await request.delete(`${API}/estudio/fotos/${f.id}`, { headers: auth });
  }
}

test.describe.configure({ mode: 'serial' });

// O estudio e um so: se dois aparelhos salvassem ao mesmo tempo, um apagaria o do outro.
// Quem salva e o computador; no celular so se confere a tela (o ultimo teste).
// eslint-disable-next-line no-empty-pattern -- o Playwright exige o objeto de fixtures
test.beforeEach(({}, info) => {
  test.skip(
    info.project.name !== 'desktop' && !info.title.startsWith('no celular'),
    'o estudio e compartilhado: quem salva e o computador'
  );
});

test.afterEach(async ({ request }, info) => {
  if (info.project.name === 'desktop') await voltarAoPadrao(request);
});

test('admin muda o horario e a frase, e o cliente ve no app', async ({ page, request }, info) => {
  const horario = 'Terça a sábado, das 10h às 20h';
  await entrar(page, SEED.admin, SEED.senha);
  await abrirEstudio(page, info);
  await registrar(page, info, '01 estudio');

  // os campos ja vem com o que o cliente ve hoje
  await page.getByRole('radio', { name: 'Endereço' }).filter({ visible: true }).click();
  await expect(page.getByLabel('Endereço', { exact: true }).filter({ visible: true })).toHaveValue(
    /204 Sul/
  );
  await page.getByLabel('Horário de atendimento').filter({ visible: true }).fill(horario);
  await page.getByRole('radio', { name: 'Contatos' }).filter({ visible: true }).click();
  await page
    .getByLabel('Frase do Stewer')
    .filter({ visible: true })
    .fill('Cada rosto pede um corte.');
  // o salvar so aparece quando ha alteracao, preso embaixo
  await expect(naTela(page, 'Você mudou o estúdio.')).toBeVisible();
  await registrar(page, info, '02 alteracao para salvar');
  await botao(page, 'Salvar estúdio').click();
  await expect(naTela(page, 'Salvo. O app do cliente já mostra assim.')).toBeVisible();
  // a previa do mapa ja mostra o horario novo
  await page.getByRole('radio', { name: 'Endereço' }).filter({ visible: true }).click();
  await expect(naTela(page, horario)).toBeVisible();

  const cliente = await novoCliente(request, 'Vitrine');
  const outra = await page.context().browser()!.newContext();
  const pagina = await outra.newPage();
  await entrar(pagina, cliente.email, cliente.senha);
  await pagina.getByText('Onde atende').filter({ visible: true }).first().scrollIntoViewIfNeeded();
  await expect(naTela(pagina, horario)).toBeVisible();
  await outra.close();
});

test('admin poe e apaga uma foto do trabalho', async ({ page }, info) => {
  await entrar(page, SEED.admin, SEED.senha);
  await abrirEstudio(page, info);

  const escolha = page.waitForEvent('filechooser');
  await botao(page, 'Adicionar foto do trabalho').click();
  await (await escolha).setFiles('e2e/arquivos/corte.jpg');
  await expect(naTela(page, 'Principal')).toBeVisible();
  await registrar(page, info, '03 foto do trabalho');

  page.once('dialog', (d) => void d.accept());
  await page.getByRole('button', { name: 'Apagar a foto 1' }).filter({ visible: true }).click();
  await expect(naTela(page, 'Ainda não tem foto sua')).toBeVisible();
});

test('servico ganha foto de exemplo e o cliente ve ao escolher', async ({ page, request }) => {
  await entrar(page, SEED.admin, SEED.senha);
  await page.getByRole('tab', { name: 'Serviços' }).filter({ visible: true }).first().click();
  const editar = page
    .getByRole('button', { name: /^Editar / })
    .filter({ visible: true })
    .first();
  const nome = ((await editar.getAttribute('aria-label')) ?? '').replace(/^Editar /, '');
  await editar.click();

  const escolha = page.waitForEvent('filechooser');
  await botao(page, 'Adicionar foto').click();
  await (await escolha).setFiles('e2e/arquivos/corte.jpg');
  await expect(
    page.getByRole('button', { name: 'Apagar a foto 1' }).filter({ visible: true })
  ).toBeVisible();

  const token = await login(request, SEED.admin, SEED.senha);
  const servicos = (await (
    await request.get(`${API}/servicos`, { headers: { Authorization: `Bearer ${token}` } })
  ).json()) as { id: string; nome: string; fotos: string[] }[];
  const servico = servicos.find((s) => s.nome === nome)!;
  expect(servico.fotos.length).toBeGreaterThan(0);

  const cliente = await novoCliente(request, 'Escolhe');
  const outra = await page.context().browser()!.newContext();
  const pagina = await outra.newPage();
  await entrar(pagina, cliente.email, cliente.senha);
  await expect(
    pagina
      .getByRole('img', { name: `Exemplo 1 de ${nome}` })
      .filter({ visible: true })
      .first()
  ).toBeVisible();
  await outra.close();

  for (const id of servico.fotos) {
    await request.delete(`${API}/servicos/${servico.id}/fotos/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
});

test('no celular, o estudio abre pelo Painel e cada parte mostra onde aparece', async ({
  page,
}, info) => {
  test.skip(info.project.name === 'desktop', 'no computador a aba fica no menu');
  await entrar(page, SEED.admin, SEED.senha);
  await abrirEstudio(page, info);
  await expect(naTela(page, 'Seu retrato')).toBeVisible();
  await expect(naTela(page, 'No início do app e quando o cliente escolhe')).toBeVisible();
  await page.getByRole('radio', { name: 'Endereço' }).filter({ visible: true }).click();
  await expect(page.getByLabel('Endereço', { exact: true }).filter({ visible: true })).toHaveValue(
    /204 Sul/
  );
  await page.getByRole('radio', { name: 'Contatos' }).filter({ visible: true }).click();
  await expect(page.getByLabel('WhatsApp').filter({ visible: true })).toHaveValue(/\(63\)/);
  // mexer num campo faz aparecer o salvar; desfazer tira
  await page.getByLabel('Instagram').filter({ visible: true }).fill('@teste');
  await expect(naTela(page, 'Você mudou o estúdio.')).toBeVisible();
  await registrar(page, info, '01 estudio no celular');
  await botao(page, 'Desfazer').click();
  await expect(naTela(page, 'Você mudou o estúdio.')).toHaveCount(0);
});
