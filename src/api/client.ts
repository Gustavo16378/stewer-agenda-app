/**
 * O cliente HTTP do app. Uma unica instancia, tipada pelo openapi.yaml.
 *
 * O middleware faz tres coisas:
 *  1. injeta `Authorization: Bearer <jwt>` em toda chamada autenticada;
 *  2. barra a chamada quando o token ja expirou (nao ha refresh nesta API);
 *  3. transforma qualquer resposta de erro no `ApiError` normalizado e, em 401,
 *     dispara o logout para o app voltar ao login.
 *
 * O token nao e lido do React aqui de proposito: o middleware e sincrono e precisa
 * funcionar fora da arvore de componentes. Quem manda no token e o AuthProvider,
 * que chama `definirSessaoAtiva` / `definirAoDeslogar`.
 */
import createClient, { type Middleware } from 'openapi-fetch';

import { API_URL } from './config';
import { ApiError, apiErrorDeRede, apiErrorDeResposta } from './errors';
import type { paths } from './schema';
import { sessaoValida, type SessaoGuardada } from './session-store';

// --- estado de sessao visto pelo middleware -------------------------------

let sessaoAtiva: SessaoGuardada | null = null;
let aoDeslogar: (() => void) | null = null;

/** O AuthProvider chama isto sempre que a sessao muda (login, logout, restauracao). */
export function definirSessaoAtiva(sessao: SessaoGuardada | null): void {
  sessaoAtiva = sessao;
}

/** O AuthProvider registra aqui o que fazer quando a API disser 401. */
export function definirAoDeslogar(handler: (() => void) | null): void {
  aoDeslogar = handler;
}

export function lerSessaoAtiva(): SessaoGuardada | null {
  return sessaoAtiva;
}

/** Endpoints que nao levam Bearer (e onde um 401 e resposta legitima, nao logout). */
const ROTAS_PUBLICAS = ['/auth/login', '/auth/registrar'];

function isRotaPublica(url: string): boolean {
  return ROTAS_PUBLICAS.some((rota) => url.includes(rota));
}

/** Le o corpo sem estourar quando ele vem vazio (401 e 403 vem sem corpo). */
async function corpoDeErro(response: Response): Promise<unknown> {
  try {
    const texto = await response.clone().text();
    if (!texto.trim()) return undefined;
    return JSON.parse(texto) as unknown;
  } catch {
    return undefined;
  }
}

const authMiddleware: Middleware = {
  async onRequest({ request, schemaPath }) {
    if (isRotaPublica(schemaPath)) return request;

    const sessao = sessaoAtiva;
    if (!sessao) return request;

    if (!sessaoValida(sessao)) {
      // token vencido: desloga aqui, sem gastar um round-trip para ouvir 401
      aoDeslogar?.();
      throw new ApiError({
        status: 401,
        mensagem: 'Sua sessao expirou. Entre novamente.',
        codigo: 'TOKEN_EXPIRADO',
        kind: 'autenticacao',
      });
    }

    request.headers.set('Authorization', `Bearer ${sessao.token}`);
    return request;
  },

  async onResponse({ response, schemaPath }) {
    if (response.ok) return response;

    const erro = apiErrorDeResposta(response.status, await corpoDeErro(response));

    // 401 numa rota autenticada = token invalido/expirado -> volta pro login.
    // No /auth/login um 401 e so "senha errada": nao desloga nada.
    if (erro.status === 401 && !isRotaPublica(schemaPath)) {
      aoDeslogar?.();
    }

    throw erro;
  },

  async onError({ error }) {
    // fetch rejeitou: DNS, timeout, Wi-Fi, API fora do ar, celular apontando pra localhost
    if (error instanceof ApiError) return error;
    return apiErrorDeRede(error);
  },
};

/**
 * Quanto tempo uma chamada pode ficar pendurada antes de virar erro de rede.
 *
 * Sem isto, uma rede que aceita a conexao e nunca responde — portal cativo de
 * hotel, proxy engasgado, container da API subindo — deixa a promise pendente
 * para sempre. Era assim que a splash travava: o app esperava `GET /auth/eu`
 * que nunca chegava, sem nada para interromper.
 *
 * 15s e folgado para a chamada mais lenta da API (a agenda da semana do ADMIN)
 * e ainda curto o bastante para o usuario nao achar que o app morreu.
 */
export const TIMEOUT_MS = 15_000;

export const api = createClient<paths>({
  baseUrl: API_URL,
  // Content-Type nao entra aqui: o openapi-fetch so o adiciona quando ha corpo,
  // e forca-lo num GET faz alguns servidores reclamarem.
  headers: { Accept: 'application/json' },
  // Resolve o `fetch` a CADA chamada, em vez de capturar `globalThis.fetch` na criacao
  // do client. Isso importa quando o fetch e trocado depois que este modulo carrega —
  // um polyfill do RN, ou o mock dos testes.
  fetch: (input: Request, init?: RequestInit) => comTimeout(input, init),
});

/** Dispara o `fetch` com um relogio por cima, respeitando quem ja cancelou. */
function comTimeout(input: Request, init?: RequestInit): Promise<Response> {
  const controle = new AbortController();
  const relogio = setTimeout(() => controle.abort(), TIMEOUT_MS);

  // Se quem chamou trouxe o proprio sinal, um cancelamento dele tambem vale.
  const externo = init?.signal ?? input?.signal;
  if (externo) {
    if (externo.aborted) controle.abort();
    else externo.addEventListener('abort', () => controle.abort(), { once: true });
  }

  return globalThis
    .fetch(input, { ...(init ?? {}), signal: controle.signal })
    .finally(() => clearTimeout(relogio));
}

api.use(authMiddleware);

/**
 * Executa uma chamada do openapi-fetch e devolve o `data`, jogando `ApiError` no erro.
 *
 * O middleware ja lanca em resposta de erro, mas o openapi-fetch ainda entrega
 * `{ data, error }` — este helper colapsa isso para o formato que o TanStack Query espera
 * (resolve com o dado, rejeita com o erro).
 */
export async function desembrulha<T>(
  chamada: Promise<{ data?: T; error?: unknown; response: Response }>
): Promise<T> {
  const { data, error, response } = await chamada;
  if (error !== undefined) {
    throw error instanceof ApiError ? error : apiErrorDeResposta(response.status, error);
  }
  return data as T;
}

/**
 * Igual a `desembrulha`, mas para os 201 que a spec declara SEM schema de resposta.
 *
 * A API devolve o recurso criado em todos eles (confirmado por curl contra o seed:
 * POST /auth/registrar -> TokenResponse, /agendamentos -> Agendamento,
 * /clientes/{id}/anotacoes -> Anotacao, /profissionais -> Profissional,
 * /servicos -> Servico, /bloqueios -> Bloqueio). O openapi-fetch ja parseia o JSON;
 * so o TIPO vem como `never`, entao a afirmacao de tipo acontece aqui, num lugar so,
 * em vez de espalhada por cada tela.
 *
 * Se um dia a spec ganhar esses schemas, este helper vira `desembrulha` e some.
 */
export async function desembrulhaCriado<T>(
  chamada: Promise<{ data?: unknown; error?: unknown; response: Response }>
): Promise<T> {
  const { data, error, response } = await chamada;
  if (error !== undefined) {
    throw error instanceof ApiError ? error : apiErrorDeResposta(response.status, error);
  }
  if (data !== undefined && data !== null) return data as T;

  // 201 sem corpo parseado (content-length 0 ou content-type inesperado): tenta o Location
  throw new ApiError({
    status: response.status,
    mensagem: 'O servidor criou o registro mas nao devolveu o conteudo.',
    codigo: 'RESPOSTA_VAZIA',
    kind: 'desconhecido',
  });
}
