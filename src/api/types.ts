/**
 * Apelidos semanticos para os schemas gerados do openapi.yaml.
 *
 * Nada aqui e escrito a mao: tudo sai de `components['schemas'][...]` do arquivo gerado.
 * Se a spec mudar e um campo sumir, o erro aparece no `tsc`, nao na tela do usuario.
 * Regerar com `npm run api:types`.
 */
import type { components } from './schema';

type Schemas = components['schemas'];

export type Agendamento = Schemas['Agendamento'];
export type AgendamentoRequest = Schemas['AgendamentoRequest'];
export type Anotacao = Schemas['Anotacao'];
export type AnotacaoRequest = Schemas['AnotacaoRequest'];
export type AtualizarStatusRequest = Schemas['AtualizarStatusRequest'];
export type Bloqueio = Schemas['Bloqueio'];
export type BloqueioRequest = Schemas['BloqueioRequest'];
export type ClienteDetalhe = Schemas['ClienteDetalhe'];
export type ClienteResumo = Schemas['ClienteResumo'];
export type Disponibilidade = Schemas['Disponibilidade'];
export type Erro = Schemas['Erro'];
export type FaixaHoraria = Schemas['FaixaHoraria'];
export type GradeSemanal = Schemas['GradeSemanal'];
export type HorarioLivre = Schemas['HorarioLivre'];
export type HorariosLivres = Schemas['HorariosLivres'];
export type LoginRequest = Schemas['LoginRequest'];
export type Profissional = Schemas['Profissional'];
export type ProfissionalRequest = Schemas['ProfissionalRequest'];
export type RegistrarRequest = Schemas['RegistrarRequest'];
export type Role = Schemas['Role'];
export type Servico = Schemas['Servico'];
export type ServicoRequest = Schemas['ServicoRequest'];
export type StatusAgendamento = Schemas['StatusAgendamento'];
export type TokenResponse = Schemas['TokenResponse'];
export type Usuario = Schemas['Usuario'];

/** Os papeis, como valores, para montar guardas e menus. */
export const ROLES = ['CLIENTE', 'PROFISSIONAL', 'ADMIN'] as const satisfies readonly Role[];

/** Os status, como valores, na ordem em que o dominio os usa. */
export const STATUS_AGENDAMENTO = [
  'AGENDADO',
  'CONCLUIDO',
  'CANCELADO',
  'NAO_COMPARECEU',
] as const satisfies readonly StatusAgendamento[];

/** Status a partir do qual o agendamento nao muda mais (a API responde 409). */
export const STATUS_FINAIS: readonly StatusAgendamento[] = [
  'CONCLUIDO',
  'CANCELADO',
  'NAO_COMPARECEU',
];

export function isStatusFinal(status: StatusAgendamento | undefined): boolean {
  return !!status && STATUS_FINAIS.includes(status);
}

/** Rotulo em pt-BR de cada status, para a tela. */
export const ROTULO_STATUS: Record<StatusAgendamento, string> = {
  AGENDADO: 'Agendado',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
  NAO_COMPARECEU: 'Não compareceu',
};

/** `periodo` aceito por GET /agendamentos/meus. */
export const PERIODOS = ['todos', 'futuros', 'historico'] as const;
export type Periodo = (typeof PERIODOS)[number];

/**
 * Rotulo em CAPS de cada status, com as palavras que o DESIGN usa
 * (o frame 08 chama AGENDADO de "CONFIRMADO").
 */
export const ROTULO_STATUS_CAPS: Record<StatusAgendamento, string> = {
  AGENDADO: 'CONFIRMADO',
  CONCLUIDO: 'CONCLUÍDO',
  CANCELADO: 'CANCELADO',
  NAO_COMPARECEU: 'NÃO COMPARECEU',
};
