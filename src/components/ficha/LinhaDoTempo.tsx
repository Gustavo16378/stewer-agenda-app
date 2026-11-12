/**
 * A auditoria como linha do tempo: um ponto por evento, cor pelo tom (vermelho para o
 * que tirou horario da agenda, latao para o que concluiu), quem fez e quando.
 */
import { Text, View } from 'react-native';

import type { EventoAuditoria } from '@/api/types';
import { autorDoEvento, tomDoEvento } from '@/lib/carteira';
import { cn } from '@/lib/cn';
import { formatHora, formatDiaMes } from '@/lib/datetime';

export function ItemDaLinhaDoTempo({ e, ultimo }: { e: EventoAuditoria; ultimo?: boolean }) {
  const tom = tomDoEvento(e);
  return (
    <View className="flex-row gap-4" accessibilityLabel={`${e.resumo}, por ${autorDoEvento(e)}`}>
      <View className="items-center" style={{ width: 12 }}>
        <View
          className={cn(
            'mt-[7px] h-[9px] w-[9px] rounded-full',
            tom === 'alerta' ? 'bg-cadeira' : tom === 'positivo' ? 'bg-latao' : 'bg-texto-3/60'
          )}
        />
        {ultimo ? null : <View className="mt-1 w-px flex-1 bg-borda" />}
      </View>
      <View className="flex-1 pb-5">
        <Text className="font-sans text-ui text-texto">{e.resumo}</Text>
        <Text className="mt-1 font-sans text-ui-sm text-texto-3">
          {autorDoEvento(e)}, {formatDiaMes(e.criadoEm)} às {formatHora(e.criadoEm)}
        </Text>
      </View>
    </View>
  );
}

export function LinhaDoTempo({ eventos }: { eventos: EventoAuditoria[] }) {
  return (
    <View>
      {eventos.map((e, i) => (
        <ItemDaLinhaDoTempo key={e.id} e={e} ultimo={i === eventos.length - 1} />
      ))}
    </View>
  );
}
