/**
 * [08 Meus agendamentos] — tab MEUS HORÁRIOS do cliente.
 *
 * Layout literal do frame 08: `padding:44px 28px 0`, titulo Playfair 29px, secao
 * PRÓXIMOS (`margin-top:42px`) com um card por agendamento (contorno ink@.16,
 * `padding:20px 22px`, carimbo de data empilhado "11 / SET" de 44px, divisor vertical
 * 1px, servico Playfair 18 + "15:30 · STEWER GABRIEL", tag de status dourada), e secao
 * HISTÓRICO (`margin-top:44px`) com linhas `padding:19px 0` (data 56px 9.5/.14em, servico
 * 14px ink@.85, status 8.5/.18em ink@.4; cancelado com `opacity:.45`).
 *
 * Dados:
 *   futuros   <- GET /agendamentos/meus?periodo=futuros   (ja ordenado por inicio ASC)
 *   historico <- GET /agendamentos/meus?periodo=historico (ja ordenado por inicio DESC)
 * A API ordena; a tela nao reordena.
 *
 * O design nao desenha cancelamento nesta tela; a acao vive no detalhe (frame 11), que e
 * o unico caminho. Tocar num card ou numa linha abre o detalhe — e como NAO existe
 * GET /agendamentos/{id}, o cache e semeado com o item ANTES do push.
 */
import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, Text, View } from 'react-native';

import { useMeusAgendamentos, useSemearAgendamento } from '@/api/hooks';
import { ROTULO_STATUS, type Agendamento, type Periodo } from '@/api/types';
import { Carregando, EstadoErro, EstadoVazio } from '@/components/ui/estados';
import { TelaRolavel } from '@/components/ui/tela';
import { cn } from '@/lib/cn';
import {
  formatDiaMesCurtoCaps,
  formatDiaNumero,
  formatDiaSemanaDiaMes,
  formatHora,
  formatMesCurtoCaps,
  parseInstant,
} from '@/lib/datetime';
import { emFrase } from '@/lib/frase';

const SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

/** Um horario que vem pela frente: a data grande em latao, a hora, o servico e com quem. */
function CardProximo({
  item,
  primeiro,
  aoAbrir,
}: {
  item: Agendamento;
  primeiro: boolean;
  aoAbrir: () => void;
}) {
  const data = parseInstant(item.inicio);
  return (
    <Pressable
      onPress={aoAbrir}
      accessibilityRole="button"
      accessibilityLabel={`${item.servicoNome ?? 'Horário'}, ${formatDiaSemanaDiaMes(item.inicio)} às ${formatHora(item.inicio)}`}
      className={cn(
        'mt-3 flex-row items-center gap-5 rounded-[3px] border border-borda bg-superficie px-5 py-5',
        primeiro && 'border-l-2 border-l-latao'
      )}
      style={({ pressed }) => (pressed ? { opacity: 0.8 } : null)}
    >
      <View className="w-14 items-center">
        <Text className="font-display text-ds-38 text-latao">{formatDiaNumero(item.inicio)}</Text>
        <Text className="font-sans-medium text-ui-xs text-texto-3">
          {emFrase(formatMesCurtoCaps(item.inicio)).toLowerCase()}
        </Text>
      </View>
      <View className="flex-1 gap-1">
        <Text className="font-sans-semibold text-ui-lg text-texto">
          {formatHora(item.inicio)}
          <Text className="font-sans text-ui text-texto-3">
            {data ? `, ${SEMANA[data.getDay()]}` : ''}
          </Text>
        </Text>
        <Text className="font-display text-ds-20 text-texto" numberOfLines={2}>
          {item.servicoNome}
        </Text>
        {item.profissionalNome ? (
          <Text className="font-sans text-ui-sm text-texto-2">com {item.profissionalNome}</Text>
        ) : null}
      </View>
      <Text className="font-sans text-ds-24 text-texto-3">›</Text>
    </Pressable>
  );
}

function LinhaHistorico({ item, aoAbrir }: { item: Agendamento; aoAbrir: () => void }) {
  const encerradoSemVisita = item.status === 'CANCELADO' || item.status === 'NAO_COMPARECEU';
  return (
    <Pressable
      onPress={aoAbrir}
      accessibilityRole="button"
      className="flex-row items-center gap-4 border-b border-borda/70 py-4"
      style={({ pressed }) => (pressed ? { opacity: 0.6 } : null)}
    >
      <Text className="w-16 font-sans-medium text-ui-sm text-texto-3">
        {emFrase(formatDiaMesCurtoCaps(item.inicio)).toLowerCase()}
      </Text>
      <Text
        className={cn(
          'flex-1 font-sans text-ui',
          encerradoSemVisita ? 'text-texto-3 line-through' : 'text-texto'
        )}
        numberOfLines={1}
      >
        {item.servicoNome}
      </Text>
      <View
        className={cn(
          'rounded-full px-3 py-1',
          item.status === 'CONCLUIDO' ? 'bg-latao/14' : 'bg-borda/60'
        )}
      >
        <Text
          className={cn(
            'font-sans-medium text-ui-xs',
            item.status === 'CONCLUIDO' ? 'text-latao' : 'text-texto-3'
          )}
        >
          {item.status ? ROTULO_STATUS[item.status] : ''}
        </Text>
      </View>
    </Pressable>
  );
}

export default function MeusHorarios() {
  const router = useRouter();
  const semear = useSemearAgendamento();
  const futuros = useMeusAgendamentos('futuros');
  const historico = useMeusAgendamentos('historico');

  const carregando = futuros.isLoading || historico.isLoading;
  const erro = futuros.error ?? historico.error;

  function abrir(item: Agendamento, periodo: Periodo) {
    semear(item);
    router.push({
      pathname: '/agendamento/[id]',
      params: { id: item.id ?? '', origem: 'meus', periodo },
    } as never);
  }

  const refetch = () => {
    void futuros.refetch();
    void historico.refetch();
  };

  // futuros cancelados nao sao "proximos": o design so lista os confirmados
  const proximos = (futuros.data ?? []).filter((a) => a.status === 'AGENDADO');

  return (
    <TelaRolavel
      insetInferior={false}
      refreshControl={
        <RefreshControl
          refreshing={futuros.isRefetching || historico.isRefetching}
          onRefresh={refetch}
        />
      }
    >
      <View className="pt-10">
        <Text accessibilityRole="header" className="font-display text-ds-38 text-texto">
          Meus horários
        </Text>

        {carregando ? (
          <Carregando className="mt-10" />
        ) : erro ? (
          <EstadoErro className="mt-10" erro={erro} aoTentarDeNovo={refetch} />
        ) : (
          <>
            <Text className="mt-10 font-sans-medium text-ui-sm text-texto-3">Próximos</Text>
            {proximos.length === 0 ? (
              <EstadoVazio
                className="py-8"
                titulo="Nada marcado por enquanto."
                descricao="Escolha o serviço e o melhor dia. Leva menos de um minuto."
                acao={{
                  titulo: 'Agendar horário',
                  aoTocar: () => router.push('/novo-agendamento/servico' as never),
                }}
              />
            ) : (
              proximos.map((item, i) => (
                <CardProximo
                  key={item.id}
                  item={item}
                  primeiro={i === 0}
                  aoAbrir={() => abrir(item, 'futuros')}
                />
              ))
            )}

            <Text className="mt-12 font-sans-medium text-ui-sm text-texto-3">Histórico</Text>
            {(historico.data ?? []).length === 0 ? (
              <Text className="mt-4 font-sans text-ui text-texto-3">
                Nenhuma visita registrada ainda.
              </Text>
            ) : (
              <View className="mt-2">
                {(historico.data ?? []).map((item) => (
                  <LinhaHistorico
                    key={item.id}
                    item={item}
                    aoAbrir={() => abrir(item, 'historico')}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </View>
    </TelaRolavel>
  );
}
