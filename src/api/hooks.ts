/**
 * Hooks do TanStack Query. Toda tela consome a API por aqui — nunca chamando
 * `api.GET` direto — para cache, loading e invalidacao ficarem consistentes.
 */
import {
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/auth/auth-context';
import type { CalendarDate } from '@/lib/datetime';

import { ApiError } from './errors';
import * as q from './queries';
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
} from './types';

const { chaves } = q;
export { chaves };

/** Tamanho de pagina de /clientes. A API limita a 100. */
export const TAMANHO_PAGINA_CLIENTES = 20;

// ---------------------------------------------------------------------------
// Servicos
// ---------------------------------------------------------------------------

export function useServicos(incluirInativos = false) {
  return useQuery<Servico[], ApiError>({
    queryKey: chaves.servicos(incluirInativos),
    queryFn: () => q.buscarServicos(incluirInativos),
  });
}

export function useSalvarServico() {
  const qc = useQueryClient();
  return useMutation<Servico, ApiError, { id?: string; dados: ServicoRequest }>({
    mutationFn: ({ id, dados }) => (id ? q.atualizarServico(id, dados) : q.criarServico(dados)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['servicos'] });
    },
  });
}

export function useRemoverServico() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (id) => q.removerServico(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['servicos'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Profissionais
// ---------------------------------------------------------------------------

export function useProfissionais(incluirInativos = false) {
  return useQuery<Profissional[], ApiError>({
    queryKey: chaves.profissionais(incluirInativos),
    queryFn: () => q.buscarProfissionais(incluirInativos),
  });
}

/**
 * A ficha de profissional do usuario logado.
 *
 * Nao existe endpoint "meu profissional": o jeito e cruzar `usuarioId` da lista com o
 * `id` do token. Necessario porque quase toda acao de agenda pede `profissionalId`,
 * e o que o token carrega e o `usuarioId`.
 */
export function useMeuProfissional() {
  const { usuario } = useAuth();
  const lista = useProfissionais(false);

  const meu = useMemo(
    () => lista.data?.find((p) => p.usuarioId === usuario?.id) ?? null,
    [lista.data, usuario?.id]
  );

  return { ...lista, profissional: meu };
}

export function useSalvarProfissional() {
  const qc = useQueryClient();
  return useMutation<Profissional, ApiError, { id?: string; dados: ProfissionalRequest }>({
    mutationFn: ({ id, dados }) =>
      id ? q.atualizarProfissional(id, dados) : q.criarProfissional(dados),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['profissionais'] });
    },
  });
}

export function useRemoverProfissional() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (id) => q.removerProfissional(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['profissionais'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Agendamentos
// ---------------------------------------------------------------------------

/**
 * Agenda de um dia. `profissionalId` e OBRIGATORIO para ADMIN (senao a API responde
 * 422 PROFISSIONAL_OBRIGATORIO) e IGNORADO para PROFISSIONAL, que sempre ve a propria.
 */
export function useAgendaDoDia(data: CalendarDate, profissionalId?: string) {
  const { role } = useAuth();
  const faltaProfissional = role === 'ADMIN' && !profissionalId;

  return useQuery<Agendamento[], ApiError>({
    queryKey: chaves.agenda(data, profissionalId),
    queryFn: () => q.buscarAgendaDoDia(data, profissionalId),
    // nem tenta: o ADMIN sem profissionalId leva 422 garantido
    enabled: !!data && !faltaProfissional,
  });
}

export function useMeusAgendamentos(periodo: Periodo = 'todos') {
  return useQuery<Agendamento[], ApiError>({
    queryKey: chaves.meusAgendamentos(periodo),
    queryFn: () => q.buscarMeusAgendamentos(periodo),
  });
}

/**
 * Um agendamento por id.
 *
 * NAO existe `GET /agendamentos/{id}` na API. A tela de detalhe vive do objeto que a
 * lista ja trouxe: quem navega semeia o cache com `semearAgendamento` antes do push, e
 * este hook cai de volta na lista de origem quando o cache esta frio (cold start por
 * deep link, reload no dev, app morto pelo SO).
 */
export function useAgendamento(
  id: string,
  origem?:
    | { tipo: 'agenda'; data: CalendarDate; profissionalId?: string }
    | { tipo: 'meus'; periodo: Periodo }
) {
  const qc = useQueryClient();

  return useQuery<Agendamento, ApiError>({
    queryKey: chaves.agendamento(id),
    queryFn: async () => {
      const lista = origem
        ? origem.tipo === 'agenda'
          ? await qc.ensureQueryData({
              queryKey: chaves.agenda(origem.data, origem.profissionalId),
              queryFn: () => q.buscarAgendaDoDia(origem.data, origem.profissionalId),
            })
          : await qc.ensureQueryData({
              queryKey: chaves.meusAgendamentos(origem.periodo),
              queryFn: () => q.buscarMeusAgendamentos(origem.periodo),
            })
        : await q.buscarMeusAgendamentos('todos');

      const achado = lista.find((a) => a.id === id);
      if (!achado) {
        // ApiError de verdade (nao um Error remendado), senao o EstadoErro nao
        // reconhece o tipo e a tela cai no texto generico.
        throw new ApiError({
          status: 404,
          mensagem: 'Nao encontramos este agendamento. Volte e abra pela lista.',
          codigo: 'AGENDAMENTO_FORA_DO_CACHE',
          kind: 'nao_encontrado',
        });
      }
      return achado;
    },
    enabled: !!id,
  });
}

/** Semeia o cache do detalhe com o item que a lista ja tem. Chame ANTES do push. */
export function useSemearAgendamento() {
  const qc = useQueryClient();
  return (item: Agendamento) => {
    if (item.id) qc.setQueryData(chaves.agendamento(item.id), item);
  };
}

export function useCriarAgendamento() {
  const qc = useQueryClient();
  return useMutation<Agendamento, ApiError, AgendamentoRequest>({
    mutationFn: (body) => q.criarAgendamento(body),
    onSuccess: (criado) => {
      if (criado.id) qc.setQueryData(chaves.agendamento(criado.id), criado);
      void qc.invalidateQueries({ queryKey: ['agendamentos'] });
      void qc.invalidateQueries({ queryKey: ['horarios-livres'] });
    },
  });
}

/**
 * Muda o status. A resposta e o `Agendamento` atualizado, entao escrevemos direto no
 * cache do detalhe e invalidamos as listas — sem isso o card de status fica velho ao
 * voltar para a agenda.
 */
export function useAtualizarStatus() {
  const qc = useQueryClient();
  return useMutation<Agendamento, ApiError, { id: string; status: StatusAgendamento }>({
    mutationFn: ({ id, status }) => q.atualizarStatus(id, status),
    onSuccess: (atualizado) => {
      if (atualizado.id) qc.setQueryData(chaves.agendamento(atualizado.id), atualizado);
      void qc.invalidateQueries({ queryKey: ['agendamentos'] });
      void qc.invalidateQueries({ queryKey: ['horarios-livres'] });
      void qc.invalidateQueries({ queryKey: ['cliente'] });
    },
  });
}

export function useHorariosLivres(
  profissionalId: string | undefined,
  data: CalendarDate | undefined,
  servicoId: string | undefined
) {
  return useQuery<HorariosLivres, ApiError>({
    queryKey: chaves.horariosLivres(profissionalId ?? '', data ?? '', servicoId ?? ''),
    queryFn: () => q.buscarHorariosLivres(profissionalId!, data!, servicoId!),
    enabled: !!profissionalId && !!data && !!servicoId,
  });
}

// ---------------------------------------------------------------------------
// Clientes
// ---------------------------------------------------------------------------

/** Atrasa o valor: evita disparar uma busca por tecla digitada. */
export function useDebounce<T>(valor: T, ms = 350): T {
  const [atrasado, setAtrasado] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setAtrasado(valor), ms);
    return () => clearTimeout(t);
  }, [valor, ms]);
  return atrasado;
}

/**
 * Lista de clientes com scroll infinito.
 *
 * `GET /clientes` e paginado por `pagina`/`tamanho` mas devolve ARRAY PURO: sem total,
 * sem envelope, sem header de paginacao. Entao a unica forma de saber que acabou e a
 * pagina vir com MENOS itens que `tamanho` — que e exatamente o `getNextPageParam`.
 */
export function useClientesInfinitos(busca: string) {
  const buscaAtrasada = useDebounce(busca);

  return useInfiniteQuery<ClienteResumo[], ApiError>({
    queryKey: chaves.clientes(buscaAtrasada),
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      q.buscarClientes({
        busca: buscaAtrasada || undefined,
        pagina: pageParam as number,
        tamanho: TAMANHO_PAGINA_CLIENTES,
      }),
    getNextPageParam: (ultimaPagina, todasAsPaginas) =>
      ultimaPagina.length < TAMANHO_PAGINA_CLIENTES ? undefined : todasAsPaginas.length,
  });
}

export function useCliente(id: string) {
  return useQuery<ClienteDetalhe, ApiError>({
    queryKey: chaves.cliente(id),
    queryFn: () => q.buscarCliente(id),
    enabled: !!id,
  });
}

export function useAnotacoes(clienteId: string) {
  return useQuery<Anotacao[], ApiError>({
    queryKey: chaves.anotacoes(clienteId),
    queryFn: () => q.buscarAnotacoes(clienteId),
    enabled: !!clienteId,
  });
}

/** So PROFISSIONAL anota: a API responde 422 para admin sem ficha de profissional. */
export function useCriarAnotacao(clienteId: string) {
  const qc = useQueryClient();
  return useMutation<Anotacao, ApiError, AnotacaoRequest>({
    mutationFn: (body) => q.criarAnotacao(clienteId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: chaves.anotacoes(clienteId) });
    },
  });
}

// ---------------------------------------------------------------------------
// Agenda do profissional
// ---------------------------------------------------------------------------

export function useDisponibilidade(profissionalId: string | undefined) {
  return useQuery<Disponibilidade[], ApiError>({
    queryKey: chaves.disponibilidade(profissionalId ?? ''),
    queryFn: () => q.buscarDisponibilidade(profissionalId!),
    enabled: !!profissionalId,
  });
}

/** Substitui a grade INTEIRA. Lista vazia zera a agenda. */
export function useSalvarDisponibilidade(profissionalId: string | undefined) {
  const qc = useQueryClient();
  return useMutation<
    Disponibilidade[],
    ApiError,
    { diaSemana: number; horaInicio: string; horaFim: string }[]
  >({
    mutationFn: (faixas) => q.salvarDisponibilidade(profissionalId!, faixas),
    onSuccess: (novas) => {
      qc.setQueryData(chaves.disponibilidade(profissionalId ?? ''), novas);
      void qc.invalidateQueries({ queryKey: ['horarios-livres'] });
    },
  });
}

export function useBloqueios(profissionalId: string | undefined) {
  return useQuery<Bloqueio[], ApiError>({
    queryKey: chaves.bloqueios(profissionalId ?? ''),
    queryFn: () => q.buscarBloqueios(profissionalId!),
    enabled: !!profissionalId,
  });
}

export function useCriarBloqueio(profissionalId: string | undefined) {
  const qc = useQueryClient();
  return useMutation<Bloqueio, ApiError, BloqueioRequest>({
    mutationFn: (body) => q.criarBloqueio(profissionalId!, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: chaves.bloqueios(profissionalId ?? '') });
      void qc.invalidateQueries({ queryKey: ['horarios-livres'] });
    },
  });
}

export function useRemoverBloqueio(profissionalId: string | undefined) {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (bloqueioId) => q.removerBloqueio(profissionalId!, bloqueioId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: chaves.bloqueios(profissionalId ?? '') });
      void qc.invalidateQueries({ queryKey: ['horarios-livres'] });
    },
  });
}

export type { UseQueryOptions };

// ---------------------------------------------------------------------------
// Dashboard (ADMIN) — agregacoes feitas no app porque a API nao tem relatorio
// ---------------------------------------------------------------------------

/**
 * A agenda de varios dias para varios profissionais, de uma vez.
 *
 * Nao existe endpoint de relatorio: o dashboard soma o que `GET /agendamentos/agenda`
 * devolve dia a dia. Para ADMIN o `profissionalId` e obrigatorio em cada chamada, dai o
 * produto cartesiano dias x profissionais. Num estudio com um profissional sao 7 chamadas.
 */
export function useAgendaDeVariosDias(dias: CalendarDate[], profissionalIds: string[]) {
  const pares = profissionalIds.flatMap((profissionalId) =>
    dias.map((data) => ({ profissionalId, data }))
  );

  const consultas = useQueries({
    queries: pares.map(({ profissionalId, data }) => ({
      queryKey: chaves.agenda(data, profissionalId),
      queryFn: () => q.buscarAgendaDoDia(data, profissionalId),
      staleTime: 60_000,
    })),
  });

  const carregando = consultas.some((c) => c.isLoading);
  const erro = consultas.find((c) => c.error)?.error ?? null;
  const porDia = new Map<CalendarDate, Agendamento[]>();
  consultas.forEach((c, i) => {
    const par = pares[i];
    if (!par || !c.data) return;
    porDia.set(par.data, [...(porDia.get(par.data) ?? []), ...c.data]);
  });

  return {
    porDia,
    carregando,
    erro: erro as ApiError | null,
    refetch: () => consultas.forEach((c) => void c.refetch()),
  };
}

/**
 * Todos os clientes do estabelecimento, varrendo as paginas ate a ultima.
 *
 * So para agregacao (clientes novos no mes): a lista principal usa scroll infinito.
 * `GET /clientes` limita a pagina a 100; para ate ~1000 clientes sao 10 chamadas.
 */
export function useTodosClientes(habilitado = true) {
  return useQuery<ClienteResumo[], ApiError>({
    queryKey: ['clientes', 'todos'],
    queryFn: async () => {
      const tamanho = 100;
      const todos: ClienteResumo[] = [];
      for (let pagina = 0; pagina < 50; pagina++) {
        const lote = await q.buscarClientes({ pagina, tamanho });
        todos.push(...lote);
        if (lote.length < tamanho) break;
      }
      return todos;
    },
    staleTime: 5 * 60_000,
    enabled: habilitado,
  });
}

/** A grade semanal de varios profissionais (para a taxa de ocupacao do dashboard). */
export function useDisponibilidadesDe(profissionalIds: string[]) {
  const consultas = useQueries({
    queries: profissionalIds.map((id) => ({
      queryKey: chaves.disponibilidade(id),
      queryFn: () => q.buscarDisponibilidade(id),
      staleTime: 5 * 60_000,
    })),
  });
  return {
    grades: consultas.map((c) => c.data ?? []),
    carregando: consultas.some((c) => c.isLoading),
    erro: (consultas.find((c) => c.error)?.error ?? null) as ApiError | null,
  };
}
