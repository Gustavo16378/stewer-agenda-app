/**
 * Dar baixa no atendimento direto da agenda: Atendido ou Faltou. So aparece no horario
 * que ainda esta marcado e que ja comecou (nao da para atender o que nao aconteceu). A
 * baixa e definitiva e entra no financeiro, por isso confirma antes.
 */
import { Text, View } from 'react-native';

import { useAtualizarStatus } from '@/api/hooks';
import type { Agendamento } from '@/api/types';
import { BotaoAtelie } from '@/components/atelie/base';
import { confirmar } from '@/lib/confirmar';
import { formatHora, parseInstant, primeiroNome } from '@/lib/datetime';

export function podeDarBaixa(a: Agendamento, agora = Date.now()): boolean {
  const inicio = parseInstant(a.inicio)?.getTime();
  return a.status === 'AGENDADO' && inicio !== undefined && inicio <= agora;
}

export function Baixa({ item, compacto = false }: { item: Agendamento; compacto?: boolean }) {
  const status = useAtualizarStatus();
  if (!podeDarBaixa(item)) return null;
  const quem = `${primeiroNome(item.clienteNome)}, ${formatHora(item.inicio)}`;
  // para o leitor de tela, o nome inteiro: dois clientes podem ter o mesmo primeiro nome
  const quemCompleto = `${item.clienteNome ?? ''}, ${formatHora(item.inicio)}`;

  return (
    <View className={compacto ? 'flex-row items-center gap-1' : 'mt-2 flex-row items-center gap-2'}>
      <BotaoAtelie
        variante={compacto ? 'texto' : 'latao'}
        className={compacto ? undefined : 'flex-1'}
        titulo="Atendido"
        accessibilityLabel={`Dar baixa: ${quemCompleto} atendido`}
        carregando={status.isPending && status.variables?.status === 'CONCLUIDO'}
        onPress={() =>
          confirmar(
            `${quem}: atendido?`,
            'Entra no financeiro como faturado. Não dá para desfazer.',
            {
              textoConfirmar: 'Atendido',
              aoConfirmar: () => status.mutate({ id: item.id ?? '', status: 'CONCLUIDO' }),
            }
          )
        }
      />
      <BotaoAtelie
        variante="texto"
        titulo="Faltou"
        accessibilityLabel={`Dar baixa: ${quemCompleto} faltou`}
        carregando={status.isPending && status.variables?.status === 'NAO_COMPARECEU'}
        onPress={() =>
          confirmar(
            `${quem}: faltou?`,
            'Fica na ficha do cliente como falta. Não dá para desfazer.',
            {
              textoConfirmar: 'Faltou',
              destrutivo: true,
              aoConfirmar: () => status.mutate({ id: item.id ?? '', status: 'NAO_COMPARECEU' }),
            }
          )
        }
      />
      {status.error ? (
        <Text className="font-sans text-ui-sm text-cadeira">{status.error.message}</Text>
      ) : null}
    </View>
  );
}
