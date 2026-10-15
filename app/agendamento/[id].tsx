/**
 * [11 Detalhe do agendamento] — tela EMPILHADA, compartilhada por CLIENTE e PROFISSIONAL.
 *
 * Layout literal do frame 11 (visao do profissional): cabecalho com "AGENDA · HOJE" a
 * direita; titulo Playfair 29 (nome do cliente); "HOJE · 09:00 — 10:00" (10px .18em
 * ink@.55); card SERVIÇO / VALOR / STATUS (`padding:24px; gap:18px`); RESUMO DO CLIENTE
 * com tres numeros em Playfair 21 (`gap:44px`); card ANOTAÇÕES DE VISAGISMO (fundo
 * `surface`, `padding:20px 22px`) com VER FICHA COMPLETA; botao primario CONCLUIR
 * ATENDIMENTO; par REMARCAR / CANCELAR (`gap:12px`).
 *
 * NAO existe GET /agendamentos/{id}: `useAgendamento` le o objeto que a lista semeou no
 * cache e, com o cache frio (deep link, cold start), refaz a lista de origem informada
 * nos params (`origem=agenda&data=` ou `origem=meus&periodo=`).
 *
 * Papeis:
 *   PROFISSIONAL ve tudo. CONCLUIR / CANCELAR / NÃO COMPARECEU -> PATCH .../status.
 *   CLIENTE ve so o cabecalho e o card (a API responde 403 em /clientes), e a unica
 *   escrita que tem e CANCELAR (a API recusa os outros status para CLIENTE).
 *   Status final (CONCLUIDO/CANCELADO/NAO_COMPARECEU) nao muda mais: a API responde 409.
 *
 *   TODO(API): REMARCAR nao tem endpoint. Hoje seria cancelar + criar de novo, em dois
 *   passos e com o horario novo podendo ser tomado no meio. Faltaria
 *   `PATCH /agendamentos/{id} { inicio }` (ou `POST /agendamentos/{id}/remarcar`).
 *
 * DESVIO: a acao "NÃO COMPARECEU" nao esta no frame, mas e um status real da API e a
 * unica forma de o profissional registrar falta; entrou como acao secundaria em texto.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Text, View } from 'react-native';

import { useAgendamento, useAnotacoes, useAtualizarStatus, useCliente } from '@/api/hooks';
import {
  ROTULO_STATUS_CAPS,
  isStatusFinal,
  type Periodo,
  type StatusAgendamento,
} from '@/api/types';
import { useAuth } from '@/auth/auth-context';
import { AcaoLinha, Botao } from '@/components/ui/botao';
import { CabecalhoVoltar } from '@/components/ui/cabecalho';
import { Carregando, EstadoErro } from '@/components/ui/estados';
import { Card } from '@/components/ui/superficies';
import { TelaRolavel } from '@/components/ui/tela';
import { LabelCaps, Titulo } from '@/components/ui/texto';
import {
  calendarDateDoInstante,
  formatDiaCurtoCaps,
  formatDiaMesCurto,
  formatFaixaHoras,
  formatMesAnoCurto,
  hojeCalendarDate,
  parseInstant,
} from '@/lib/datetime';
import { formatCentavos } from '@/lib/money';

function LinhaCard({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <View className="flex-row items-center justify-between gap-4">
      <LabelCaps papel="campo">{rotulo}</LabelCaps>
      {children}
    </View>
  );
}

/** Metricas do resumo, derivadas de ClienteDetalhe.agendamentos (nao ha endpoint). */
function ResumoDoCliente({ clienteId }: { clienteId: string }) {
  const cliente = useCliente(clienteId);
  const anotacoes = useAnotacoes(clienteId);
  const router = useRouter();

  const metricas = useMemo(() => {
    const concluidos = (cliente.data?.agendamentos ?? []).filter((a) => a.status === 'CONCLUIDO');
    const ultima = concluidos
      .map((a) => a.inicio)
      .filter((x): x is string => !!x)
      .sort((a, b) => (parseInstant(b)?.getTime() ?? 0) - (parseInstant(a)?.getTime() ?? 0))[0];
    return { visitas: concluidos.length, desde: cliente.data?.createdAt, ultima };
  }, [cliente.data]);

  // cliente promovido a profissional: a ficha responde 404 mesmo com o agendamento existindo
  if (cliente.error?.status === 404) {
    return (
      <Text className="mt-[38px] font-sans text-help text-ink/42">
        Este usuário não está mais na base de clientes.
      </Text>
    );
  }
  if (cliente.isLoading) return <Carregando className="mt-[38px] py-4" />;
  if (cliente.error)
    return (
      <EstadoErro
        className="mt-6"
        erro={cliente.error}
        aoTentarDeNovo={() => void cliente.refetch()}
      />
    );

  const ultimaAnotacao = anotacoes.data?.[0];

  return (
    <>
      <LabelCaps papel="secao" className="mt-[38px]">
        RESUMO DO CLIENTE
      </LabelCaps>
      <View className="mt-[18px] flex-row gap-11">
        <View className="gap-[6px]">
          <Titulo className="text-d-21">{metricas.visitas}</Titulo>
          <LabelCaps papel="micro" className="text-text-muted">
            VISITAS
          </LabelCaps>
        </View>
        <View className="gap-[6px]">
          <Titulo className="text-d-21">{formatMesAnoCurto(metricas.desde) || '—'}</Titulo>
          <LabelCaps papel="micro" className="text-text-muted">
            CLIENTE DESDE
          </LabelCaps>
        </View>
        <View className="gap-[6px]">
          <Titulo className="text-d-21">{formatDiaMesCurto(metricas.ultima) || '—'}</Titulo>
          <LabelCaps papel="micro" className="text-text-muted">
            ÚLTIMA VISITA
          </LabelCaps>
        </View>
      </View>

      <View className="mt-[34px] rounded-token bg-surface px-[22px] py-5">
        <LabelCaps papel="campo">ANOTAÇÕES DE VISAGISMO</LabelCaps>
        <Text className="mt-3 font-sans text-body leading-[22.75px] text-ink/75">
          {ultimaAnotacao?.texto ?? 'Nenhuma anotação ainda.'}
        </Text>
        <View className="mt-[14px] self-start">
          <AcaoLinha
            titulo="VER FICHA COMPLETA"
            destaque
            onPress={() => router.push(`/cliente/${clienteId}` as never)}
          />
        </View>
      </View>
    </>
  );
}

export default function DetalheAgendamento() {
  const router = useRouter();
  const { role } = useAuth();
  const { id, origem, data, periodo } = useLocalSearchParams<{
    id: string;
    origem?: 'agenda' | 'meus';
    data?: string;
    periodo?: Periodo;
  }>();

  const consulta = useAgendamento(
    id ?? '',
    origem === 'agenda' && data
      ? { tipo: 'agenda', data }
      : { tipo: 'meus', periodo: periodo ?? 'todos' }
  );
  const atualizar = useAtualizarStatus();
  const item = consulta.data;

  const profissional = role === 'PROFISSIONAL';
  const final = isStatusFinal(item?.status);
  const diaDoItem = calendarDateDoInstante(item?.inicio);
  const ehHoje = !!diaDoItem && diaDoItem === hojeCalendarDate();

  function mudarStatus(status: StatusAgendamento, pergunta: string) {
    if (!item?.id) return;
    Alert.alert('Confirmar', pergunta, [
      { text: 'Voltar', style: 'cancel' },
      {
        text: 'Confirmar',
        style: status === 'CANCELADO' ? 'destructive' : 'default',
        onPress: () => atualizar.mutate({ id: item.id!, status }),
      },
    ]);
  }

  const rotuloDireita =
    origem === 'agenda' ? (ehHoje ? 'AGENDA · HOJE' : 'AGENDA') : 'MEUS HORÁRIOS';

  return (
    <TelaRolavel>
      <CabecalhoVoltar passo={rotuloDireita} />

      {consulta.isLoading ? (
        <Carregando className="mt-8" />
      ) : consulta.error || !item ? (
        <EstadoErro
          className="mt-8"
          erro={consulta.error}
          aoTentarDeNovo={() => (router.canGoBack() ? router.back() : void consulta.refetch())}
        />
      ) : (
        <View className="pt-[34px]">
          <Titulo className="text-d-29">
            {profissional ? item.clienteNome : item.servicoNome}
          </Titulo>
          <LabelCaps papel="meta" className="mt-[14px] text-caps-md tracking-row text-ink/55">
            {ehHoje ? 'HOJE' : formatDiaCurtoCaps(item.inicio)} ·{' '}
            {formatFaixaHoras(item.inicio, item.fim)}
          </LabelCaps>

          <Card className="mt-[30px] gap-[18px] p-6">
            <LinhaCard rotulo="SERVIÇO">
              <Text className="flex-1 text-right font-sans text-row text-ink" numberOfLines={1}>
                {item.servicoNome}
              </Text>
            </LinhaCard>
            {!profissional ? (
              <LinhaCard rotulo="PROFISSIONAL">
                <Text className="flex-1 text-right font-sans text-row text-ink" numberOfLines={1}>
                  {item.profissionalNome}
                </Text>
              </LinhaCard>
            ) : null}
            <LinhaCard rotulo="VALOR">
              <Text className="font-sans text-row text-ink">
                {formatCentavos(item.precoCentavos)}
              </Text>
            </LinhaCard>
            <LinhaCard rotulo="STATUS">
              <LabelCaps papel="meta" className="tracking-row text-gold">
                {item.status ? ROTULO_STATUS_CAPS[item.status] : ''}
              </LabelCaps>
            </LinhaCard>
            {item.observacao ? (
              <View className="gap-2">
                <LabelCaps papel="campo">OBSERVAÇÃO</LabelCaps>
                <Text className="font-sans text-body leading-[22.75px] text-ink/75">
                  {item.observacao}
                </Text>
              </View>
            ) : null}
          </Card>

          {profissional && item.clienteId ? <ResumoDoCliente clienteId={item.clienteId} /> : null}

          {atualizar.error ? (
            <Text className="mt-6 font-sans text-help text-red-500">{atualizar.error.message}</Text>
          ) : null}

          {profissional ? (
            <Botao
              className="mt-[34px]"
              titulo="CONCLUIR ATENDIMENTO"
              disabled={final}
              carregando={atualizar.isPending && atualizar.variables?.status === 'CONCLUIDO'}
              onPress={() => mudarStatus('CONCLUIDO', 'Marcar este atendimento como concluído?')}
            />
          ) : null}

          <View className={profissional ? 'mt-3 flex-row gap-3' : 'mt-[34px] flex-row gap-3'}>
            {profissional ? (
              // TODO(API): sem endpoint de remarcacao (ver cabecalho do arquivo)
              <Botao className="flex-1" variante="fantasma" titulo="REMARCAR" disabled />
            ) : null}
            <Botao
              className="flex-1"
              variante="fantasma"
              titulo="CANCELAR"
              disabled={final}
              carregando={atualizar.isPending && atualizar.variables?.status === 'CANCELADO'}
              onPress={() =>
                mudarStatus('CANCELADO', 'Cancelar este agendamento? Não dá para desfazer.')
              }
            />
          </View>

          {profissional && !final ? (
            <View className="mt-5 items-center">
              <AcaoLinha
                titulo="REGISTRAR NÃO COMPARECIMENTO"
                onPress={() => mudarStatus('NAO_COMPARECEU', 'O cliente não compareceu?')}
              />
            </View>
          ) : null}
        </View>
      )}
    </TelaRolavel>
  );
}
