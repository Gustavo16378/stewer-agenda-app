/**
 * Parametros que atravessam o fluxo de agendamento sem que cada passo precise saber
 * de onde ele veio: para quem e o horario (equipe marcando pelo cliente) e se e uma
 * remarcacao. Cada passo repassa `extras` para o proximo.
 *
 * Servicos: um agendamento pode ter varios (corte + barba). Eles viajam entre os
 * passos no param `servicoIds`, separados por virgula e na ordem escolhida. O param
 * antigo `servicoId` (um so) continua aceito, para link salvo e atalho que ja existiam.
 */
import { useLocalSearchParams } from 'expo-router';

export interface ExtrasDoFluxo {
  clienteId?: string;
  clienteNome?: string;
  agendamentoId?: string;
  /** '1': a equipe lancando um atendimento que ja aconteceu (passo 3 vira "quando foi"). */
  jaAtendido?: string;
}

/** Lista de ids -> o valor do param `servicoIds`. */
export function paramDeServicos(ids: readonly (string | undefined)[]): string {
  return ids.filter((id): id is string => !!id).join(',');
}

/** `servicoIds` ("a,b") e/ou `servicoId` ("a") -> lista sem repetidos, na ordem. */
export function servicosDosParams(servicoIds?: string, servicoId?: string): string[] {
  const ids = [servicoId, ...(servicoIds ?? '').split(',')]
    .map((id) => id?.trim())
    .filter((id): id is string => !!id);
  return [...new Set(ids)];
}

export function useFluxoDeAgendamento() {
  const p = useLocalSearchParams<{
    clienteId?: string;
    clienteNome?: string;
    agendamentoId?: string;
    servicoIds?: string;
    servicoId?: string;
    jaAtendido?: string;
  }>();
  const servicoIds = servicosDosParams(p.servicoIds, p.servicoId);

  const extras: ExtrasDoFluxo = {
    ...(p.clienteId ? { clienteId: p.clienteId } : {}),
    ...(p.clienteNome ? { clienteNome: p.clienteNome } : {}),
    ...(p.agendamentoId ? { agendamentoId: p.agendamentoId } : {}),
    ...(p.jaAtendido === '1' ? { jaAtendido: '1' } : {}),
  };

  return {
    ...extras,
    extras,
    /** Servicos escolhidos no passo 1, na ordem. */
    servicoIds,
    /** Os mesmos servicos, prontos para o param `servicoIds` do proximo passo. */
    paramServicos: paramDeServicos(servicoIds),
    remarcando: !!p.agendamentoId,
    /** Lancando um atendimento que ja aconteceu, em vez de marcar um horario. */
    jaAtendido: p.jaAtendido === '1',
    paraCliente: !!p.clienteId,
    /** Eyebrow das telas do fluxo. */
    eyebrow: p.agendamentoId
      ? 'Remarcar horário'
      : p.jaAtendido === '1'
        ? p.clienteNome
          ? `Atendimento já feito · ${p.clienteNome}`
          : 'Atendimento já feito'
        : p.clienteNome
          ? `Para ${p.clienteNome}`
          : 'Novo agendamento',
  };
}
