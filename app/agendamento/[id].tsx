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
 * REMARCAR abre a data e horario do fluxo de agendamento ja com servico e profissional
 * escolhidos; a confirmacao chama PATCH /agendamentos/{id}/horario, numa transacao so.
 *
 * DESVIO: a acao "NÃO COMPARECEU" nao esta no frame, mas e um status real da API e a
 * unica forma de o profissional registrar falta; entrou como acao secundaria em texto.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Linking, Text, View } from 'react-native';

import { useAgendamento, useAnotacoes, useAtualizarStatus, useCliente } from '@/api/hooks';
import { ROTULO_STATUS, isStatusFinal, type Periodo, type StatusAgendamento } from '@/api/types';
import { useAuth } from '@/auth/auth-context';
import { GuardaDePapel } from '@/auth/guarda';
import { BotaoAtelie } from '@/components/atelie/base';
import { CabecalhoVoltar } from '@/components/ui/cabecalho';
import { Carregando, EstadoErro } from '@/components/ui/estados';
import { TelaRolavel } from '@/components/ui/tela';
import { useEstudio } from '@/content/estudio';
import { cn } from '@/lib/cn';
import { confirmar } from '@/lib/confirmar';
import {
  calendarDateDoInstante,
  diaPorExtenso,
  formatDiaMesCurto,
  formatFaixaHoras,
  formatMesAnoCurto,
  hojeCalendarDate,
  parseInstant,
} from '@/lib/datetime';
import { formatCentavos } from '@/lib/money';

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
      <Text className="mt-10 font-sans text-ui text-texto-3">
        Este usuário não está mais na base de clientes.
      </Text>
    );
  }
  if (cliente.isLoading) return <Carregando className="mt-10 py-4" />;
  if (cliente.error)
    return (
      <EstadoErro
        className="mt-6"
        erro={cliente.error}
        aoTentarDeNovo={() => void cliente.refetch()}
      />
    );

  const ultimaAnotacao = anotacoes.data?.[0];

  const numeros = [
    { valor: String(metricas.visitas), legenda: 'visitas' },
    { valor: formatMesAnoCurto(metricas.desde).toLowerCase() || 'novo', legenda: 'cliente desde' },
    {
      valor: formatDiaMesCurto(metricas.ultima).toLowerCase() || 'nunca',
      legenda: 'última visita',
    },
  ];

  return (
    <>
      <Text className="mt-10 font-sans-medium text-ui-sm text-texto-3">Sobre o cliente</Text>
      <View className="mt-4 flex-row gap-8">
        {numeros.map((n) => (
          <View key={n.legenda} className="gap-1">
            <Text className="font-display text-ds-24 text-latao">{n.valor}</Text>
            <Text className="font-sans text-ui-sm text-texto-3">{n.legenda}</Text>
          </View>
        ))}
      </View>

      <View className="mt-6 rounded-[3px] bg-superficie px-5 py-5">
        <Text className="font-sans-medium text-ui-sm text-texto-3">
          Última anotação de visagismo
        </Text>
        <Text className="mt-2 font-sans text-ui text-texto-2">
          {ultimaAnotacao?.texto ?? 'Nenhuma anotação ainda.'}
        </Text>
        <BotaoAtelie
          className="mt-2 self-start"
          variante="texto"
          titulo="Ver ficha completa"
          onPress={() => router.push(`/cliente/${clienteId}` as never)}
        />
      </View>
    </>
  );
}

function DetalheAgendamento() {
  const router = useRouter();
  const LOCAL = useEstudio();
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

  // Admin que atende tem as mesmas acoes do profissional sobre o atendimento.
  const profissional = role === 'PROFISSIONAL' || role === 'ADMIN';

  function remarcar(a: NonNullable<typeof item>) {
    if (!a.id || !a.servicoId || !a.profissionalId) return;
    router.push({
      pathname: '/novo-agendamento/horario',
      params: { servicoId: a.servicoId, profissionalId: a.profissionalId, agendamentoId: a.id },
    } as never);
  }
  const final = isStatusFinal(item?.status);
  const diaDoItem = calendarDateDoInstante(item?.inicio);
  const ehHoje = !!diaDoItem && diaDoItem === hojeCalendarDate();

  function mudarStatus(status: StatusAgendamento, pergunta: string) {
    if (!item?.id) return;
    const id = item.id;
    confirmar(pergunta, '', {
      destrutivo: status === 'CANCELADO',
      aoConfirmar: () => atualizar.mutate({ id, status }),
    });
  }

  return (
    <TelaRolavel>
      <CabecalhoVoltar />

      {consulta.isLoading ? (
        <Carregando className="mt-8" />
      ) : consulta.error || !item ? (
        <EstadoErro
          className="mt-8"
          erro={consulta.error}
          aoTentarDeNovo={() => (router.canGoBack() ? router.back() : void consulta.refetch())}
        />
      ) : (
        <View className="pt-8">
          <View
            className={cn(
              'self-start rounded-full px-3 py-1',
              item.status === 'AGENDADO' ? 'bg-latao/14' : 'bg-borda/60'
            )}
          >
            <Text
              className={cn(
                'font-sans-medium text-ui-xs',
                item.status === 'AGENDADO' ? 'text-latao' : 'text-texto-3'
              )}
            >
              {item.status ? ROTULO_STATUS[item.status] : ''}
            </Text>
          </View>
          <Text accessibilityRole="header" className="mt-4 font-display text-ds-38 text-texto">
            {profissional ? item.clienteNome : item.servicoNome}
          </Text>

          <View className="mt-6 rounded-[3px] border border-l-2 border-borda border-l-latao bg-superficie p-6">
            <Text className="font-display text-ds-24 text-texto">
              {ehHoje ? 'Hoje' : diaDoItem ? diaPorExtenso(diaDoItem) : ''}
            </Text>
            <Text className="mt-1 font-sans-semibold text-ui-lg text-latao">
              {formatFaixaHoras(item.inicio, item.fim)}
            </Text>
            <View className="my-5 h-px bg-borda" />
            <View className="gap-4">
              {profissional ? <Linha rotulo="Serviço" valor={item.servicoNome} /> : null}
              {!profissional ? <Linha rotulo="Com" valor={item.profissionalNome} /> : null}
              <Linha rotulo="Valor" valor={formatCentavos(item.precoCentavos)} />
              {!profissional ? <Linha rotulo="Onde" valor={LOCAL.nome} /> : null}
              {item.observacao ? <Linha rotulo="Recado" valor={item.observacao} /> : null}
            </View>
          </View>

          {profissional && item.clienteId ? <ResumoDoCliente clienteId={item.clienteId} /> : null}

          {atualizar.error ? (
            <Text className="mt-6 font-sans text-ui-sm text-cadeira">
              {atualizar.error.message}
            </Text>
          ) : null}

          {final ? null : (
            <View className="mt-8 gap-3">
              {profissional ? (
                <BotaoAtelie
                  titulo="Concluir atendimento"
                  carregando={atualizar.isPending && atualizar.variables?.status === 'CONCLUIDO'}
                  onPress={() =>
                    mudarStatus('CONCLUIDO', 'Marcar este atendimento como concluído?')
                  }
                />
              ) : null}
              <View className="flex-row gap-3">
                <BotaoAtelie
                  className="flex-1"
                  variante="contorno"
                  titulo="Remarcar"
                  onPress={() => remarcar(item)}
                />
                <BotaoAtelie
                  className="flex-1"
                  variante="perigo"
                  titulo="Cancelar"
                  carregando={atualizar.isPending && atualizar.variables?.status === 'CANCELADO'}
                  onPress={() =>
                    mudarStatus('CANCELADO', 'Cancelar este horário? Não dá para desfazer.')
                  }
                />
              </View>
              {profissional ? (
                <BotaoAtelie
                  className="self-center"
                  variante="texto"
                  titulo="Registrar que não veio"
                  onPress={() => mudarStatus('NAO_COMPARECEU', 'O cliente não compareceu?')}
                />
              ) : (
                <BotaoAtelie
                  className="self-center"
                  variante="texto"
                  titulo="Como chegar"
                  onPress={() => void Linking.openURL(LOCAL.mapaUrl)}
                />
              )}
            </View>
          )}
        </View>
      )}
    </TelaRolavel>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor?: string | null }) {
  return (
    <View className="flex-row justify-between gap-6">
      <Text className="font-sans text-ui text-texto-3">{rotulo}</Text>
      <Text className="flex-1 text-right font-sans-medium text-ui text-texto">{valor ?? ''}</Text>
    </View>
  );
}

/** Direto pelo link ou depois de recarregar: so mostra a tela com a sessao ja restaurada. */
export default function RotaDetalheAgendamento() {
  return (
    <GuardaDePapel permitidos={['CLIENTE', 'PROFISSIONAL', 'ADMIN']}>
      <DetalheAgendamento />
    </GuardaDePapel>
  );
}
