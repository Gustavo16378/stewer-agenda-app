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
import { ROTULO_STATUS_CAPS, type Agendamento, type Periodo } from '@/api/types';
import { Carregando, EstadoErro, EstadoVazio } from '@/components/ui/estados';
import { TelaRolavel } from '@/components/ui/tela';
import { LabelCaps, Titulo } from '@/components/ui/texto';
import { cn } from '@/lib/cn';
import {
  formatDiaMesCurtoCaps,
  formatDiaNumero,
  formatHora,
  formatMesCurtoCaps,
} from '@/lib/datetime';

function CardProximo({ item, aoAbrir }: { item: Agendamento; aoAbrir: () => void }) {
  return (
    <Pressable
      onPress={aoAbrir}
      accessibilityRole="button"
      className="mt-4 flex-row items-center gap-5 rounded-token border border-field-border px-[22px] py-5"
      style={({ pressed }) => (pressed ? { opacity: 0.7 } : null)}
    >
      <View className="w-11 items-center gap-1">
        <Titulo className="text-d-26">{formatDiaNumero(item.inicio)}</Titulo>
        <LabelCaps papel="micro" className="tracking-wide text-text-muted">
          {formatMesCurtoCaps(item.inicio)}
        </LabelCaps>
      </View>
      <View className="w-px self-stretch bg-divider-card" />
      <View className="flex-1 gap-[7px]">
        <Titulo className="text-d-18" numberOfLines={1}>
          {item.servicoNome}
        </Titulo>
        <LabelCaps papel="meta" className="tracking-chip text-ink/50" numberOfLines={1}>
          {formatHora(item.inicio)} · {(item.profissionalNome ?? '').toUpperCase()}
        </LabelCaps>
      </View>
      <LabelCaps papel="micro" className="self-start text-gold">
        {item.status ? ROTULO_STATUS_CAPS[item.status] : ''}
      </LabelCaps>
    </Pressable>
  );
}

function LinhaHistorico({ item, aoAbrir }: { item: Agendamento; aoAbrir: () => void }) {
  const cancelado = item.status === 'CANCELADO' || item.status === 'NAO_COMPARECEU';
  return (
    <Pressable
      onPress={aoAbrir}
      accessibilityRole="button"
      className={cn(
        'flex-row items-center gap-[18px] border-b border-divider py-[19px]',
        cancelado && 'opacity-45'
      )}
      style={({ pressed }) => (pressed ? { opacity: 0.6 } : null)}
    >
      <LabelCaps papel="meta" className="w-14 text-caps-sm tracking-tab">
        {formatDiaMesCurtoCaps(item.inicio)}
      </LabelCaps>
      <Text className="flex-1 font-sans text-row text-text-body" numberOfLines={1}>
        {item.servicoNome}
      </Text>
      <LabelCaps papel="micro" className="text-text-dim">
        {item.status ? ROTULO_STATUS_CAPS[item.status] : ''}
      </LabelCaps>
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
      <View className="pt-[44px]">
        <Titulo className="text-d-29">Meus agendamentos</Titulo>

        {carregando ? (
          <Carregando className="mt-[42px]" />
        ) : erro ? (
          <EstadoErro className="mt-[42px]" erro={erro} aoTentarDeNovo={refetch} />
        ) : (
          <>
            <LabelCaps papel="secao" className="mt-[42px]">
              PRÓXIMOS
            </LabelCaps>
            {proximos.length === 0 ? (
              <EstadoVazio
                className="py-8"
                titulo="Nada marcado por enquanto."
                descricao="Reserve um horário pela aba AGENDAR."
                acao={{
                  titulo: 'NOVO AGENDAMENTO',
                  aoTocar: () => router.push('/(cliente)/novo-agendamento/servico' as never),
                }}
              />
            ) : (
              proximos.map((item) => (
                <CardProximo key={item.id} item={item} aoAbrir={() => abrir(item, 'futuros')} />
              ))
            )}

            <LabelCaps papel="secao" className="mt-11">
              HISTÓRICO
            </LabelCaps>
            {(historico.data ?? []).length === 0 ? (
              <Text className="mt-4 font-sans text-help text-ink/42">
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
