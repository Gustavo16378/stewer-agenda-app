/**
 * Os numeros do cliente em blocos: quanto ja gastou, de quanto em quanto tempo volta,
 * se falta ou cancela em cima da hora e o que mais faz. O que chama atencao (faltas,
 * cancelamento em cima da hora) aparece em vermelho; o resto em latao.
 */
import { Text, View } from 'react-native';

import type { MetricasCliente } from '@/api/types';
import { haQuantoTempo, ritmo } from '@/lib/carteira';
import { cn } from '@/lib/cn';
import { formatHora, formatDiaSemanaDiaMes } from '@/lib/datetime';
import { formatCentavos } from '@/lib/money';

function Bloco({ valor, legenda, alerta }: { valor: string; legenda: string; alerta?: boolean }) {
  return (
    <View className="w-1/2 p-1">
      <View className="h-full gap-1 rounded-[3px] bg-superficie px-4 py-4">
        <Text
          className={cn('font-display text-ds-24', alerta ? 'text-cadeira' : 'text-texto')}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {valor}
        </Text>
        <Text className="font-sans text-ui-sm text-texto-3">{legenda}</Text>
      </View>
    </View>
  );
}

export function NumerosDoCliente({ m }: { m: MetricasCliente | undefined }) {
  if (!m) return null;
  const visitas = m.visitas ?? 0;
  if (visitas === 0 && !m.faltas && !m.cancelamentos && !m.proximoHorario) {
    return (
      <Text className="mt-3 font-sans text-ui text-texto-3">
        Ainda não veio nenhuma vez. Os números aparecem depois do primeiro atendimento.
      </Text>
    );
  }
  const faltasOuCancelou = (m.faltas ?? 0) + (m.cancelamentosEmCimaDaHora ?? 0);
  return (
    <View>
      {m.proximoHorario ? (
        <View className="mt-3 rounded-[3px] border-l-2 border-latao bg-superficie px-4 py-3">
          <Text className="font-sans text-ui-sm text-texto-3">Próximo horário</Text>
          <Text className="font-sans-semibold text-ui-lg text-texto">
            {formatDiaSemanaDiaMes(m.proximoHorario)}, {formatHora(m.proximoHorario)}
          </Text>
        </View>
      ) : null}
      <View className="mt-2 flex-row flex-wrap" style={{ marginHorizontal: -4 }}>
        <Bloco
          valor={formatCentavos(m.totalGastoCentavos)}
          legenda={`em ${visitas} ${visitas === 1 ? 'visita' : 'visitas'}`}
        />
        <Bloco valor={formatCentavos(m.ticketMedioCentavos)} legenda="por visita, em média" />
        <Bloco
          valor={ritmo(m.intervaloMedioDias) ?? 'novo'}
          legenda={m.intervaloMedioDias ? 'é o ritmo dele' : 'ritmo aparece na 2ª visita'}
        />
        <Bloco valor={haQuantoTempo(m.diasDesdeUltimaVisita) ?? 'nunca'} legenda="última visita" />
        <Bloco
          valor={String(m.faltas ?? 0)}
          legenda={m.faltas === 1 ? 'falta' : 'faltas'}
          alerta={(m.faltas ?? 0) > 0}
        />
        <Bloco
          valor={String(m.cancelamentosEmCimaDaHora ?? 0)}
          legenda={
            m.cancelamentos
              ? `cancelou em cima da hora, de ${m.cancelamentos} ${m.cancelamentos === 1 ? 'cancelamento' : 'cancelamentos'}`
              : 'cancelou em cima da hora'
          }
          alerta={(m.cancelamentosEmCimaDaHora ?? 0) > 0}
        />
      </View>
      {m.servicoPreferido ? (
        <Text className="mt-3 font-sans text-ui text-texto-2">
          Costuma fazer <Text className="font-sans-semibold text-texto">{m.servicoPreferido}</Text>
          {m.profissionalPreferido ? (
            <>
              {' '}
              com <Text className="font-sans-semibold text-texto">{m.profissionalPreferido}</Text>
            </>
          ) : null}
          .{faltasOuCancelou > 1 ? ' Vale confirmar o horário antes.' : ''}
        </Text>
      ) : null}
    </View>
  );
}
