/**
 * Toda chamada a API do app, num lugar so, com as chaves de cache do TanStack Query.
 *
 * Padrao: `chaves.*` monta a queryKey, `buscar*` faz a chamada. Os hooks ficam em
 * `src/api/hooks.ts` — aqui e so a camada de transporte, sem React, para ser testavel.
 */
import type { CalendarDate } from '@/lib/datetime';

import { api, desembrulha, desembrulhaCriado } from './client';
import type {
  Agendamento,
  AgendamentoRequest,
  Anotacao,
  AnotacaoRequest,
  Bloqueio,
  BloqueioRequest,
  ClienteDetalhe,
  ClienteResumo,
  Disponibilidade,
  HorariosLivres,
  Periodo,
  Profissional,
  ProfissionalRequest,
  Servico,
  ServicoRequest,
  StatusAgendamento,
  Usuario,
} from './types';

// ---------------------------------------------------------------------------
// Chaves de cache
// ---------------------------------------------------------------------------

export const chaves = {
  eu: () => ['auth', 'eu'] as const,

  servicos: (incluirInativos: boolean) => ['servicos', { incluirInativos }] as const,
  servico: (id: string) => ['servico', id] as const,

  profissionais: (incluirInativos: boolean) => ['profissionais', { incluirInativos }] as const,
  profissional: (id: string) => ['profissional', id] as const,

  agenda: (data: CalendarDate, profissionalId?: string) =>
    ['agendamentos', 'agenda', data, profissionalId ?? 'eu'] as const,
  meusAgendamentos: (periodo: Periodo) => ['agendamentos', 'meus', periodo] as const,
  agendamento: (id: string) => ['agendamento', id] as const,

  horariosLivres: (profissionalId: string, data: CalendarDate, servicoId: string) =>
    ['horarios-livres', profissionalId, data, servicoId] as const,

  clientes: (busca: string) => ['clientes', { busca }] as const,
  cliente: (id: string) => ['cliente', id] as const,
  anotacoes: (clienteId: string) => ['cliente', clienteId, 'anotacoes'] as const,

  disponibilidade: (profissionalId: string) =>
    ['profissional', profissionalId, 'disponibilidade'] as const,
  bloqueios: (profissionalId: string) => ['profissional', profissionalId, 'bloqueios'] as const,
};

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export function buscarEu(): Promise<Usuario> {
  return desembrulha(api.GET('/auth/eu'));
}

// ---------------------------------------------------------------------------
// Servicos
// ---------------------------------------------------------------------------

/** `incluirInativos` so vale para ADMIN; para os demais a API ignora o parametro. */
export function buscarServicos(incluirInativos = false): Promise<Servico[]> {
  return desembrulha(api.GET('/servicos', { params: { query: { incluirInativos } } }));
}

export function buscarServico(id: string): Promise<Servico> {
  return desembrulha(api.GET('/servicos/{id}', { params: { path: { id } } }));
}

export function criarServico(body: ServicoRequest): Promise<Servico> {
  return desembrulhaCriado<Servico>(api.POST('/servicos', { body }));
}

export function atualizarServico(id: string, body: ServicoRequest): Promise<Servico> {
  return desembrulha(api.PUT('/servicos/{id}', { params: { path: { id } }, body }));
}

export function removerServico(id: string): Promise<void> {
  return desembrulha(api.DELETE('/servicos/{id}', { params: { path: { id } } }));
}

// ---------------------------------------------------------------------------
// Profissionais
// ---------------------------------------------------------------------------

export function buscarProfissionais(incluirInativos = false): Promise<Profissional[]> {
  return desembrulha(api.GET('/profissionais', { params: { query: { incluirInativos } } }));
}

export function buscarProfissional(id: string): Promise<Profissional> {
  return desembrulha(api.GET('/profissionais/{id}', { params: { path: { id } } }));
}

export function criarProfissional(body: ProfissionalRequest): Promise<Profissional> {
  return desembrulhaCriado<Profissional>(api.POST('/profissionais', { body }));
}

export function atualizarProfissional(
  id: string,
  body: ProfissionalRequest
): Promise<Profissional> {
  return desembrulha(api.PUT('/profissionais/{id}', { params: { path: { id } }, body }));
}

export function removerProfissional(id: string): Promise<void> {
  return desembrulha(api.DELETE('/profissionais/{id}', { params: { path: { id } } }));
}

// ---------------------------------------------------------------------------
// Agendamentos
// ---------------------------------------------------------------------------

/**
 * `data` e o DIA DE CALENDARIO LOCAL do usuario (ver src/lib/datetime.ts).
 * `profissionalId` e obrigatorio para ADMIN e ignorado para PROFISSIONAL — mandar
 * para PROFISSIONAL nao quebra, mas o backend usa o profissional do token.
 */
export function buscarAgendaDoDia(
  data: CalendarDate,
  profissionalId?: string
): Promise<Agendamento[]> {
  return desembrulha(
    api.GET('/agendamentos/agenda', {
      params: { query: { data, ...(profissionalId ? { profissionalId } : {}) } },
    })
  );
}

export function buscarMeusAgendamentos(periodo: Periodo = 'todos'): Promise<Agendamento[]> {
  return desembrulha(api.GET('/agendamentos/meus', { params: { query: { periodo } } }));
}

export function criarAgendamento(body: AgendamentoRequest): Promise<Agendamento> {
  return desembrulhaCriado<Agendamento>(api.POST('/agendamentos', { body }));
}

export function atualizarStatus(id: string, status: StatusAgendamento): Promise<Agendamento> {
  return desembrulha(
    api.PATCH('/agendamentos/{id}/status', { params: { path: { id } }, body: { status } })
  );
}

export function buscarHorariosLivres(
  profissionalId: string,
  data: CalendarDate,
  servicoId: string
): Promise<HorariosLivres> {
  return desembrulha(
    api.GET('/profissionais/{profissionalId}/horarios-livres', {
      params: { path: { profissionalId }, query: { data, servicoId } },
    })
  );
}

// ---------------------------------------------------------------------------
// Clientes
// ---------------------------------------------------------------------------

/**
 * Paginado por `pagina`/`tamanho`, mas a API devolve ARRAY PURO, sem total e sem envelope.
 * Quem consome sabe que acabou quando vier menos que `tamanho` (ver useClientesInfinitos).
 * `tamanho` e limitado a 100 pela API.
 */
export function buscarClientes(params: {
  busca?: string;
  pagina?: number;
  tamanho?: number;
}): Promise<ClienteResumo[]> {
  const { busca, pagina = 0, tamanho = 20 } = params;
  return desembrulha(
    api.GET('/clientes', {
      params: { query: { ...(busca ? { busca } : {}), pagina, tamanho } },
    })
  );
}

export function buscarCliente(id: string): Promise<ClienteDetalhe> {
  return desembrulha(api.GET('/clientes/{id}', { params: { path: { id } } }));
}

export function buscarAnotacoes(clienteId: string): Promise<Anotacao[]> {
  return desembrulha(api.GET('/clientes/{id}/anotacoes', { params: { path: { id: clienteId } } }));
}

export function criarAnotacao(clienteId: string, body: AnotacaoRequest): Promise<Anotacao> {
  return desembrulhaCriado<Anotacao>(
    api.POST('/clientes/{id}/anotacoes', { params: { path: { id: clienteId } }, body })
  );
}

// ---------------------------------------------------------------------------
// Agenda do profissional (grade + bloqueios)
// ---------------------------------------------------------------------------

export function buscarDisponibilidade(profissionalId: string): Promise<Disponibilidade[]> {
  return desembrulha(
    api.GET('/profissionais/{profissionalId}/disponibilidade', {
      params: { path: { profissionalId } },
    })
  );
}

/** Substitui a grade INTEIRA. Lista vazia zera a agenda do profissional. */
export function salvarDisponibilidade(
  profissionalId: string,
  faixas: { diaSemana: number; horaInicio: string; horaFim: string }[]
): Promise<Disponibilidade[]> {
  return desembrulha(
    api.PUT('/profissionais/{profissionalId}/disponibilidade', {
      params: { path: { profissionalId } },
      body: { faixas },
    })
  );
}

export function buscarBloqueios(profissionalId: string): Promise<Bloqueio[]> {
  return desembrulha(
    api.GET('/profissionais/{profissionalId}/bloqueios', { params: { path: { profissionalId } } })
  );
}

export function criarBloqueio(profissionalId: string, body: BloqueioRequest): Promise<Bloqueio> {
  return desembrulhaCriado<Bloqueio>(
    api.POST('/profissionais/{profissionalId}/bloqueios', {
      params: { path: { profissionalId } },
      body,
    })
  );
}

export function removerBloqueio(profissionalId: string, bloqueioId: string): Promise<void> {
  return desembrulha(
    api.DELETE('/profissionais/{profissionalId}/bloqueios/{bloqueioId}', {
      params: { path: { profissionalId, bloqueioId } },
    })
  );
}
