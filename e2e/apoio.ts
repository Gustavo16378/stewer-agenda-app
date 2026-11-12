/**
 * O que as jornadas compartilham: contas, atalhos pela API para montar o cenario, o
 * login pela tela e o registro de cada passo como print no relatorio.
 */
import { expect, type APIRequestContext, type Page, type TestInfo } from '@playwright/test';

export const API = process.env.E2E_API_URL ?? 'http://localhost:8080';

/** Contas do seed de dev da API (db/seed/V2__seed_dev.sql). */
export const SEED = {
  senha: 'dev12345',
  stewer: 'stewer@stewer.dev',
  admin: 'admin@stewer.dev',
};

export interface Conta {
  nome: string;
  email: string;
  senha: string;
  token: string;
}

let contador = 0;
/** Um nome e e-mail que nenhuma outra execucao usou. */
export function unico(prefixo: string) {
  contador += 1;
  const sufixo = `${Date.now().toString(36)}${contador}${Math.random().toString(36).slice(2, 6)}`;
  return { nome: `${prefixo} ${sufixo.slice(-5)}`, email: `e2e-${sufixo}@exemplo.dev` };
}

export async function login(request: APIRequestContext, email: string, senha: string) {
  const r = await request.post(`${API}/auth/login`, { data: { email, senha } });
  expect(r.ok(), `login de ${email}`).toBeTruthy();
  return ((await r.json()) as { token: string }).token;
}

/** Cliente novo, so desta jornada: nenhum teste depende do que outro deixou. */
export async function novoCliente(request: APIRequestContext, prefixo = 'Cliente'): Promise<Conta> {
  const { nome, email } = unico(prefixo);
  const senha = 'senha-e2e-123';
  const r = await request.post(`${API}/auth/registrar`, { data: { nome, email, senha } });
  expect(r.status(), await r.text()).toBe(201);
  return { nome, email, senha, token: ((await r.json()) as { token: string }).token };
}

function cabecalho(token: string) {
  return { Authorization: `Bearer ${token}` };
}

interface Slot {
  inicio: string;
  fim: string;
}

/** O primeiro servico, o Stewer e um horario livre sorteado nos proximos dias. */
export async function horarioLivre(request: APIRequestContext, token: string) {
  const servicos = (await (
    await request.get(`${API}/servicos`, { headers: cabecalho(token) })
  ).json()) as { id: string; nome: string }[];
  const profissionais = (await (
    await request.get(`${API}/profissionais`, { headers: cabecalho(token) })
  ).json()) as { id: string; nome: string }[];
  const servico = servicos[0]!;
  const stewer = profissionais.find((p) => p.nome.startsWith('Stewer')) ?? profissionais[0]!;

  for (let d = 1; d < 30; d++) {
    const dia = new Date(Date.now() + d * 86_400_000);
    const data = dia.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
    const r = await request.get(`${API}/profissionais/${stewer.id}/horarios-livres`, {
      headers: cabecalho(token),
      params: { data, servicoId: servico.id },
    });
    const { horarios } = (await r.json()) as { horarios: Slot[] };
    if (horarios.length) {
      const slot = horarios[Math.floor(Math.random() * horarios.length)]!;
      return { servico, profissional: stewer, slot, data };
    }
  }
  throw new Error('nenhum horario livre nos proximos 30 dias');
}

/** Marca um horario para o cliente direto pela API (cenario das jornadas da equipe). */
export async function agendarPelaApi(request: APIRequestContext, cliente: Conta) {
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const { servico, profissional, slot, data } = await horarioLivre(request, cliente.token);
    const r = await request.post(`${API}/agendamentos`, {
      headers: cabecalho(cliente.token),
      data: { servicoId: servico.id, profissionalId: profissional.id, inicio: slot.inicio },
    });
    if (r.status() === 201) {
      return { ...((await r.json()) as { id: string; inicio: string }), servico, data };
    }
    // 409: outro worker pegou o mesmo horario no meio do caminho; sorteia outro
  }
  throw new Error('nao consegui marcar um horario pela API');
}

/** Abre o app ja na tela de entrar e faz login pela interface. */
export async function entrar(page: Page, email: string, senha: string) {
  await page.goto('/');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(senha);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByLabel('E-mail')).toHaveCount(0);
}

/** Print do passo, anexado ao relatorio com o nome do passo e do aparelho. */
export async function registrar(page: Page, info: TestInfo, passo: string) {
  await page.waitForLoadState('networkidle').catch(() => undefined);
  // fotos decodificadas e o fade do expo-image terminado, senao o print sai escuro
  await page
    .waitForFunction(() => [...document.images].every((i) => i.complete), null, { timeout: 5000 })
    .catch(() => undefined);
  await page.waitForTimeout(600);
  const caminho = info.outputPath(`${passo}.png`);
  await page.screenshot({ path: caminho });
  await info.attach(`${info.project.name} - ${passo}`, { path: caminho, contentType: 'image/png' });
}

/** Nada pode vazar para o lado: a pagina tem de caber na largura do aparelho. */
export async function semRolagemLateral(page: Page) {
  const { larguraConteudo, larguraTela } = await page.evaluate(() => ({
    larguraConteudo: document.documentElement.scrollWidth,
    larguraTela: window.innerWidth,
  }));
  expect(larguraConteudo, 'conteudo mais largo que a tela').toBeLessThanOrEqual(larguraTela + 1);
}

/** Texto que esta NA TELA: o web do Expo Router deixa as telas anteriores da pilha no DOM. */
export function naTela(page: Page, texto: string | RegExp) {
  return page.getByText(texto).filter({ visible: true }).first();
}

/** Botao visivel com esse nome (mesmo motivo do `naTela`). */
export function botao(page: Page, nome: string | RegExp) {
  return page
    .getByRole('button', { name: nome, exact: typeof nome === 'string' })
    .filter({ visible: true })
    .first();
}

export const ehCelular = (info: TestInfo) => info.project.name !== 'desktop';
