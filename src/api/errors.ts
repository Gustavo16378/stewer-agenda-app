/**
 * Normaliza tudo que pode dar errado numa chamada a API num unico tipo, `ApiError`.
 *
 * O que a stewer-agenda-api realmente devolve (confirmado por curl contra o seed):
 *
 * - Erro de validacao de body: **HTTP 400** com `codigo: "VALIDACAO"` e `violacoes`.
 *   A spec sugere 422, mas na pratica o Bean Validation do Quarkus responde 400.
 *   Cada item de `violacoes` e `{ campo, mensagem }` — nao um mapa arbitrario.
 *   => tratamos `violacoes` em 400 E 422.
 *
 * - Erro de regra de negocio: 409 / 422 com `codigo` estavel e SEM `violacoes`
 *   (ex.: PROFISSIONAL_OBRIGATORIO, horario ocupado).
 *
 * - **401 e 403 vem com CORPO VAZIO**: sao barrados pela camada de seguranca do Quarkus,
 *   antes do exception mapper. Nao adianta procurar `Erro.mensagem` — a mensagem tem de
 *   ser sintetizada aqui. (A excecao e o 401 de /auth/login, que tem corpo.)
 *
 * - Falha de rede (celular apontando para localhost, API fora do ar, Wi-Fi caiu):
 *   o fetch rejeita antes de existir resposta. Vira `status: 0`.
 */

/** Uma violacao de campo, como a API manda. */
export interface Violacao {
  campo: string;
  mensagem: string;
}

/** Corpo de erro padronizado da API (schema `Erro`). */
export interface ErroResposta {
  codigo?: string;
  mensagem?: string;
  status?: number;
  timestamp?: string;
  violacoes?: Violacao[];
}

export type ApiErrorKind =
  | 'rede' // nao chegou a haver resposta
  | 'autenticacao' // 401
  | 'permissao' // 403
  | 'validacao' // 400/422 com violacoes de campo
  | 'regra' // 409/422 de regra de negocio
  | 'nao_encontrado' // 404
  | 'servidor' // 5xx
  | 'desconhecido';

export class ApiError extends Error {
  readonly status: number;
  readonly codigo?: string;
  readonly kind: ApiErrorKind;
  /** campo -> mensagem, pronto para jogar no formulario. */
  readonly violacoes: Record<string, string>;
  readonly timestamp?: string;

  constructor(init: {
    status: number;
    mensagem: string;
    codigo?: string;
    kind: ApiErrorKind;
    violacoes?: Record<string, string>;
    timestamp?: string;
  }) {
    super(init.mensagem);
    this.name = 'ApiError';
    this.status = init.status;
    this.codigo = init.codigo;
    this.kind = init.kind;
    this.violacoes = init.violacoes ?? {};
    this.timestamp = init.timestamp;
  }

  /** Ha violacao de campo para jogar num formulario? */
  get temViolacoes(): boolean {
    return Object.keys(this.violacoes).length > 0;
  }

  /** A mensagem que a violacao daquele campo trouxe, se houver. */
  violacaoDe(campo: string): string | undefined {
    return this.violacoes[campo];
  }

  /** O token venceu ou foi rejeitado: quem chamou deve deslogar. */
  get exigeLogin(): boolean {
    return this.kind === 'autenticacao';
  }
}

const MENSAGEM_REDE =
  'Nao foi possivel falar com o servidor. Confira se a API esta no ar e se o app aponta para o ' +
  'IP da sua maquina — no celular, "localhost" e o proprio celular.';

const MENSAGENS_PADRAO: Record<number, string> = {
  400: 'Confira os dados enviados.',
  401: 'Sua sessao expirou. Entre novamente.',
  403: 'Voce nao tem permissao para isso.',
  404: 'Nao encontramos o que voce procurou.',
  409: 'Esse registro conflita com um que ja existe.',
  422: 'Nao foi possivel concluir com esses dados.',
};

function kindDe(status: number, temViolacoes: boolean): ApiErrorKind {
  if (status === 0) return 'rede';
  if (status === 401) return 'autenticacao';
  if (status === 403) return 'permissao';
  if (status === 404) return 'nao_encontrado';
  if ((status === 400 || status === 422) && temViolacoes) return 'validacao';
  if (status === 400 || status === 409 || status === 422) return 'regra';
  if (status >= 500) return 'servidor';
  return 'desconhecido';
}

function isErroResposta(v: unknown): v is ErroResposta {
  return typeof v === 'object' && v !== null;
}

/**
 * Converte `violacoes` no formato campo -> mensagem.
 * Aceita as duas formas possiveis pelo schema (`{campo, mensagem}`, que e a real, e
 * um mapa `{nome: "msg"}`, que e o que `additionalProperties: string` permitiria).
 */
export function normalizaViolacoes(violacoes: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!Array.isArray(violacoes)) return out;

  for (const item of violacoes) {
    if (typeof item !== 'object' || item === null) continue;
    const registro = item as Record<string, unknown>;

    // Forma real da API: { campo, mensagem }.
    if ('campo' in registro) {
      const campo = registro.campo;
      const mensagem = registro.mensagem;
      if (typeof campo === 'string' && typeof mensagem === 'string') {
        // primeira violacao de um campo vence; a API pode mandar mais de uma
        if (!(campo in out)) out[campo] = mensagem;
      }
      // Item com `campo` mas sem `mensagem` valida e malformado: descarta.
      // Cair no mapa generico aqui criaria um erro num campo chamado "campo",
      // que nao existe em formulario nenhum.
      continue;
    }

    // Fallback: mapa generico { nomeDoCampo: "mensagem" }, que e o que o
    // `additionalProperties: string` do openapi.yaml permitiria.
    for (const [k, v] of Object.entries(registro)) {
      if (typeof v === 'string' && !(k in out)) out[k] = v;
    }
  }
  return out;
}

/** Monta o ApiError a partir da resposta HTTP e do corpo ja parseado (pode ser vazio). */
export function apiErrorDeResposta(status: number, corpo: unknown): ApiError {
  const erro: ErroResposta = isErroResposta(corpo) ? (corpo as ErroResposta) : {};
  const violacoes = normalizaViolacoes(erro.violacoes);
  const kind = kindDe(status, Object.keys(violacoes).length > 0);

  // 401/403 chegam sem corpo: a mensagem tem de vir daqui.
  const mensagem =
    (typeof erro.mensagem === 'string' && erro.mensagem.trim()) ||
    MENSAGENS_PADRAO[status] ||
    (status >= 500 ? 'O servidor falhou. Tente de novo em instantes.' : 'Algo deu errado.');

  return new ApiError({
    status,
    mensagem,
    codigo: typeof erro.codigo === 'string' ? erro.codigo : undefined,
    kind,
    violacoes,
    timestamp: typeof erro.timestamp === 'string' ? erro.timestamp : undefined,
  });
}

/** O fetch nem chegou a receber resposta. */
export function apiErrorDeRede(causa?: unknown): ApiError {
  const erro = new ApiError({
    status: 0,
    mensagem: MENSAGEM_REDE,
    kind: 'rede',
    codigo: 'FALHA_DE_REDE',
  });
  if (causa instanceof Error) erro.stack = causa.stack;
  return erro;
}

/** Qualquer coisa jogada por um `catch` vira ApiError, para a UI ter sempre um so tipo. */
export function comoApiError(e: unknown): ApiError {
  if (e instanceof ApiError) return e;
  if (e instanceof Error) {
    // TypeError: Network request failed / Failed to fetch
    if (e.name === 'TypeError' || /network|fetch/i.test(e.message)) return apiErrorDeRede(e);
    return new ApiError({ status: 0, mensagem: e.message, kind: 'desconhecido' });
  }
  return new ApiError({ status: 0, mensagem: 'Algo deu errado.', kind: 'desconhecido' });
}
