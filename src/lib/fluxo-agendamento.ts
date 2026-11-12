/**
 * Parametros que atravessam o fluxo de agendamento sem que cada passo precise saber
 * de onde ele veio: para quem e o horario (equipe marcando pelo cliente) e se e uma
 * remarcacao. Cada passo repassa `extras` para o proximo.
 */
import { useLocalSearchParams } from 'expo-router';

export interface ExtrasDoFluxo {
  clienteId?: string;
  clienteNome?: string;
  agendamentoId?: string;
}

export function useFluxoDeAgendamento() {
  const p = useLocalSearchParams<{
    clienteId?: string;
    clienteNome?: string;
    agendamentoId?: string;
  }>();

  const extras: ExtrasDoFluxo = {
    ...(p.clienteId ? { clienteId: p.clienteId } : {}),
    ...(p.clienteNome ? { clienteNome: p.clienteNome } : {}),
    ...(p.agendamentoId ? { agendamentoId: p.agendamentoId } : {}),
  };

  return {
    ...extras,
    extras,
    remarcando: !!p.agendamentoId,
    paraCliente: !!p.clienteId,
    /** Eyebrow das telas do fluxo. */
    eyebrow: p.agendamentoId
      ? 'REMARCAR'
      : p.clienteNome
        ? `PARA ${p.clienteNome.toUpperCase()}`
        : 'NOVO AGENDAMENTO',
  };
}
