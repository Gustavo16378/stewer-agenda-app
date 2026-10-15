/**
 * [03 Home do cliente] — e [18 Home light], que e a MESMA tela no tema claro.
 *
 * Layout literal do frame 03: `padding:44px 28px 0`, eyebrow com a data por extenso,
 * saudacao em Playfair 31px, card de contorno dourado com o proximo atendimento,
 * botao primario, e o bloco "ÚLTIMA VISITA" com uma linha e divisor.
 *
 * Dados:
 *   proximo  <- GET /agendamentos/meus?periodo=futuros   (o mais proximo)
 *   ultima   <- GET /agendamentos/meus?periodo=historico (a mais recente concluida)
 *
 * REAGENDAR e REPETIR: ver os TODO abaixo — a API nao tem remarcacao.
 */
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { RefreshControl, Text, View } from 'react-native';

import { useMeusAgendamentos, useSemearAgendamento } from '@/api/hooks';
import type { Agendamento } from '@/api/types';
import { useAuth } from '@/auth/auth-context';
import { AcaoLinha, Botao } from '@/components/ui/botao';
import { Carregando, EstadoErro } from '@/components/ui/estados';
import { Card, DivisorCard, LinhaLista } from '@/components/ui/superficies';
import { TelaRolavel } from '@/components/ui/tela';
import { LabelCaps, Titulo } from '@/components/ui/texto';
import {
  formatDiaMes,
  formatDiaSemanaLongoCaps,
  formatFaixaAgendamento,
  parseInstant,
  primeiroNome,
  saudacao,
} from '@/lib/datetime';

/** O mais proximo no tempo entre os futuros. */
function proximoDaLista(lista: Agendamento[] | undefined): Agendamento | null {
  if (!lista?.length) return null;
  return (
    [...lista]
      .filter((a) => a.status === 'AGENDADO' && a.inicio)
      .sort(
        (a, b) =>
          (parseInstant(a.inicio)?.getTime() ?? 0) - (parseInstant(b.inicio)?.getTime() ?? 0)
      )[0] ?? null
  );
}

/** A visita concluida mais recente. */
function ultimaVisitaDaLista(lista: Agendamento[] | undefined): Agendamento | null {
  if (!lista?.length) return null;
  return (
    [...lista]
      .filter((a) => a.status === 'CONCLUIDO' && a.inicio)
      .sort(
        (a, b) =>
          (parseInstant(b.inicio)?.getTime() ?? 0) - (parseInstant(a.inicio)?.getTime() ?? 0)
      )[0] ?? null
  );
}

export default function InicioCliente() {
  const router = useRouter();
  const { usuario } = useAuth();
  const semear = useSemearAgendamento();

  const futuros = useMeusAgendamentos('futuros');
  const historico = useMeusAgendamentos('historico');

  const proximo = useMemo(() => proximoDaLista(futuros.data), [futuros.data]);
  const ultima = useMemo(() => ultimaVisitaDaLista(historico.data), [historico.data]);

  const carregando = futuros.isLoading || historico.isLoading;
  const erro = futuros.error ?? historico.error;

  function abrirDetalhe(item: Agendamento) {
    semear(item);
    router.push({
      pathname: '/agendamento/[id]',
      params: { id: item.id ?? '', origem: 'meus', periodo: 'todos' },
    } as never);
  }

  return (
    <TelaRolavel
      insetInferior={false}
      refreshControl={
        <RefreshControl
          refreshing={futuros.isRefetching || historico.isRefetching}
          onRefresh={() => {
            void futuros.refetch();
            void historico.refetch();
          }}
        />
      }
    >
      <View className="pt-[44px]">
        <LabelCaps papel="tela">{formatDiaSemanaLongoCaps(new Date())}</LabelCaps>
        <Titulo className="mt-3 text-d-31">
          {saudacao()}, {primeiroNome(usuario?.nome) || 'tudo bem'}.
        </Titulo>

        {carregando ? (
          <Carregando className="mt-[42px]" />
        ) : erro ? (
          <EstadoErro
            className="mt-[42px]"
            erro={erro}
            aoTentarDeNovo={() => {
              void futuros.refetch();
              void historico.refetch();
            }}
          />
        ) : (
          <>
            {proximo ? (
              <Card destaque className="mt-[42px] gap-[14px]">
                <LabelCaps papel="secao" className="text-gold">
                  PRÓXIMO AGENDAMENTO
                </LabelCaps>

                <Titulo className="text-d-23">{proximo.servicoNome}</Titulo>

                <Text className="font-sans-medium text-caps-lg tracking-chip text-accent-line">
                  {formatFaixaAgendamento(proximo.inicio, proximo.fim)}
                </Text>

                <DivisorCard className="mt-[6px]" />

                <View className="mt-[2px] flex-row items-center justify-between">
                  <Text
                    className="flex-1 pr-3 font-sans text-meta text-text-meta"
                    numberOfLines={1}
                  >
                    {proximo.profissionalNome}
                  </Text>
                  <View className="flex-row gap-5">
                    {/* TODO(API): nao existe endpoint de remarcacao. Remarcar hoje seria
                        PATCH /agendamentos/{id}/status CANCELADO + POST /agendamentos —
                        dois passos, com risco de o horario novo ser tomado no meio.
                        Falta algo como PATCH /agendamentos/{id} { inicio }. */}
                    <AcaoLinha titulo="REAGENDAR" disabled accessibilityHint="Indisponível" />
                    <AcaoLinha titulo="DETALHES" destaque onPress={() => abrirDetalhe(proximo)} />
                  </View>
                </View>
              </Card>
            ) : (
              <Card className="mt-[42px] gap-[14px]">
                <LabelCaps papel="secao">SEM AGENDAMENTOS</LabelCaps>
                <Titulo className="text-d-23">Sua agenda está livre.</Titulo>
                <Text className="font-sans text-meta text-text-meta">
                  Escolha um serviço e reserve o seu horário no ateliê.
                </Text>
              </Card>
            )}

            <Botao
              className="mt-7"
              titulo="NOVO AGENDAMENTO"
              onPress={() => router.push('/(cliente)/novo-agendamento/servico' as never)}
            />

            {ultima ? (
              <View className="mt-12">
                <LabelCaps papel="secao">ÚLTIMA VISITA</LabelCaps>
                <LinhaLista ultima className="mt-4 border-b border-divider">
                  <Text className="flex-1 pr-3 font-sans text-body-lg text-day" numberOfLines={1}>
                    {ultima.servicoNome}{' '}
                    <Text className="text-text-dim">· {formatDiaMes(ultima.inicio)}</Text>
                  </Text>
                  {/* "REPETIR" leva ao wizard ja com o servico escolhido: e o mais perto
                      de repetir que a API permite, sem inventar endpoint. */}
                  <AcaoLinha
                    titulo="REPETIR"
                    destaque
                    onPress={() =>
                      router.push({
                        pathname: '/(cliente)/novo-agendamento/profissional',
                        params: { servicoId: ultima.servicoId ?? '' },
                      } as never)
                    }
                  />
                </LinhaLista>
              </View>
            ) : null}
          </>
        )}
      </View>
    </TelaRolavel>
  );
}
