/**
 * [10 Agenda do dia] — tab AGENDA do PROFISSIONAL e do ADMIN que tambem atende.
 *
 * O ADMIN ve a agenda da propria ficha de profissional. Sem ficha, a tela explica onde
 * criar em vez de mostrar uma agenda vazia que parece "sem clientes".
 *
 * Layout literal do frame 10: `padding:40px 28px 0`; eyebrow "AGENDA · HOJE" + titulo
 * Playfair 27 ("Terça, 1 de setembro") a esquerda, setas ‹ › (15px) a direita; linha
 * "4 ATENDIMENTOS · 09:00 — 19:00" (9px .2em ink@.45, `margin-top:14px`); timeline com
 * `gap:10px` a partir de `margin-top:28px`: calha de 44px com a hora (10px 600 .1em) e o
 * bloco — atendimento (fundo `surface`, borda `divider`, `padding:15px 18px`: nome 14px,
 * servico em caps 8.5/.18em, duracao "60 MIN" a direita) ou vaga tracejada "DISPONÍVEL".
 *
 * Dados:
 *   agenda <- GET /agendamentos/agenda?data=   (PROFISSIONAL nao manda profissionalId:
 *             a API usa a ficha do token)
 *   grade  <- GET /profissionais/{id}/disponibilidade (so para a faixa "09:00 — 19:00"
 *             da linha de resumo; e hora de parede, exibida como esta)
 *
 * `data` e o dia de calendario LOCAL: comeca em hoje e anda com somaDias.
 *
 * Redesenho (nov/2026): alem do dia, a semana (lista por dia) e o mes (calendario com
 * quantos atendimentos tem em cada dia), num pedido so (GET /agendamentos/agenda/periodo).
 * "Escolher data" abre o calendario para pular direto para qualquer dia, e o horario que
 * ja comecou ganha os botoes Atendido e Faltou para dar baixa ali mesmo.
 *
 * O que a tela mostra de "DISPONÍVEL" e o vao entre dois atendimentos consecutivos —
 * derivado dos proprios instantes da agenda. A tag "PRIMEIRA VISITA" vem da API
 * (`primeiraVisita` no agendamento da agenda do dia).
 *
 * DESVIO: o design nao deu a equipe nenhuma tab de perfil. A acao CONTA (dados, senha,
 * tema, sair) mora aqui, discreta, no cabecalho.
 */
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import {
  useAgendaDoDia,
  useAgendaDoPeriodo,
  useDisponibilidade,
  useMeuProfissional,
  useSemearAgendamento,
} from '@/api/hooks';
import { ROTULO_STATUS, type Agendamento } from '@/api/types';
import { useAuth } from '@/auth/auth-context';
import { Baixa } from '@/components/agenda/Baixa';
import { CalendarioMes } from '@/components/agenda/CalendarioMes';
import { BotaoAtelie } from '@/components/atelie/base';
import { AtalhoDoPerfil } from '@/components/ui/atalho-perfil';
import { Carregando, EstadoErro, EstadoVazio } from '@/components/ui/estados';
import { IconeDaAba } from '@/components/ui/icones-abas';
import { TelaRolavel } from '@/components/ui/tela';
import { cn } from '@/lib/cn';
import {
  calendarDateDoInstante,
  comparaWallTime,
  diaPorExtenso,
  diaSemanaDe,
  formatHora,
  formatWallTime,
  hojeCalendarDate,
  isHoje,
  nomeDiaSemana,
  parseCalendarDate,
  parseInstant,
  somaDias,
  type CalendarDate,
  type DiaSemana,
} from '@/lib/datetime';
import { formatDuracao } from '@/lib/money';
import { andarPeriodo, diasEntre, periodoDe } from '@/lib/periodo';
import { useLayoutLargo } from '@/lib/responsivo';
import { useCores } from '@/theme/theme-context';

type Modo = 'dia' | 'semana' | 'mes';
const MODOS: { chave: Modo; rotulo: string }[] = [
  { chave: 'dia', rotulo: 'Dia' },
  { chave: 'semana', rotulo: 'Semana' },
  { chave: 'mes', rotulo: 'Mês' },
];
const conta = (a: Agendamento) => a.status === 'AGENDADO' || a.status === 'CONCLUIDO';

export type Bloco =
  | { tipo: 'atendimento'; hora: string; item: Agendamento }
  | { tipo: 'vago'; hora: string; chave: string }
  | { tipo: 'agora'; hora: string };

/**
 * Ordena por inicio e insere um bloco "vago" em cada intervalo entre atendimentos. Com
 * `agora` (so na agenda de hoje), poe a linha de agora antes do primeiro atendimento
 * que ainda nao comecou: o Stewer bate o olho e sabe quem e o proximo.
 */
export function montarTimeline(agenda: Agendamento[], agora?: Date): Bloco[] {
  const ativos = agenda
    .filter((a) => a.status !== 'CANCELADO' && a.inicio)
    .sort(
      (a, b) => (parseInstant(a.inicio)?.getTime() ?? 0) - (parseInstant(b.inicio)?.getTime() ?? 0)
    );

  const blocos: Bloco[] = [];
  ativos.forEach((item, i) => {
    blocos.push({ tipo: 'atendimento', hora: formatHora(item.inicio), item });
    const proximo = ativos[i + 1];
    const fim = parseInstant(item.fim);
    const inicioProximo = proximo ? parseInstant(proximo.inicio) : null;
    if (fim && inicioProximo && inicioProximo.getTime() > fim.getTime()) {
      blocos.push({ tipo: 'vago', hora: formatHora(item.fim), chave: `vago-${item.id}` });
    }
  });
  if (agora) {
    const i = blocos.findIndex(
      (b) =>
        b.tipo === 'atendimento' && (parseInstant(b.item.inicio)?.getTime() ?? 0) > agora.getTime()
    );
    const marca: Bloco = { tipo: 'agora', hora: formatHora(agora.toISOString()) };
    if (i === -1) blocos.push(marca);
    else blocos.splice(i > 0 && blocos[i - 1]?.tipo === 'vago' ? i - 1 : i, 0, marca);
  }
  return blocos;
}

export default function AgendaDoDia() {
  const router = useRouter();
  const { role } = useAuth();
  const semear = useSemearAgendamento();
  const [data, setData] = useState<CalendarDate>(() => hojeCalendarDate());
  const [modo, setModo] = useState<Modo>('dia');
  const [escolhendo, setEscolhendo] = useState(false);
  const [mesDoSeletor, setMesDoSeletor] = useState<CalendarDate>(data);

  const { profissional, isLoading: carregandoFicha } = useMeuProfissional();
  // PROFISSIONAL: a API usa a ficha do token. ADMIN: manda a propria ficha.
  const profId = role === 'ADMIN' ? profissional?.id : undefined;
  const agenda = useAgendaDoDia(data, profId);
  const semFicha = role === 'ADMIN' && !carregandoFicha && !profissional;
  const grade = useDisponibilidade(profissional?.id);

  const periodo = useMemo(() => periodoDe(modo === 'dia' ? 'dia' : modo, data), [modo, data]);
  const doPeriodo = useAgendaDoPeriodo(periodo.de, periodo.ate, profId, modo !== 'dia');
  // contagem por dia para o calendario do seletor de data (mes que esta aberto nele)
  const mesSeletor = useMemo(() => periodoDe('mes', mesDoSeletor), [mesDoSeletor]);
  const doMesSeletor = useAgendaDoPeriodo(mesSeletor.de, mesSeletor.ate, profId, escolhendo);

  const hoje = isHoje(data);
  const blocos = useMemo(
    () => montarTimeline(agenda.data ?? [], hoje ? new Date() : undefined),
    [agenda.data, hoje]
  );
  const cancelados = useMemo(
    () => (agenda.data ?? []).filter((a) => a.status === 'CANCELADO'),
    [agenda.data]
  );
  const totalAtendimentos = blocos.filter((b) => b.tipo === 'atendimento').length;

  // faixa do dia da semana na grade (hora de parede, exibida como esta)
  const faixaDoDia = useMemo(() => {
    const ds = diaSemanaDe(data);
    const faixas = (grade.data ?? []).filter((f) => f.diaSemana === ds);
    if (faixas.length === 0) return null;
    const inicios = faixas.map((f) => f.horaInicio ?? '').sort(comparaWallTime);
    const fins = faixas.map((f) => f.horaFim ?? '').sort(comparaWallTime);
    return `${formatWallTime(inicios[0])} às ${formatWallTime(fins[fins.length - 1])}`;
  }, [grade.data, data]);

  function abrir(item: Agendamento) {
    semear(item);
    router.push({
      pathname: '/agendamento/[id]',
      params: { id: item.id ?? '', origem: 'agenda', data },
    } as never);
  }

  function andar(delta: number) {
    if (modo === 'dia') {
      const novo = somaDias(data, delta);
      if (novo) setData(novo);
    } else {
      setData(andarPeriodo(modo, data, delta));
    }
  }

  const cores = useCores();
  const largo = useLayoutLargo();

  function abrirDia(dia: CalendarDate) {
    setData(dia);
    setModo('dia');
    setEscolhendo(false);
  }

  const dataDate = parseCalendarDate(data);
  const semana = dataDate ? nomeDiaSemana(dataDate.getDay() as DiaSemana) : '';
  const titulo =
    modo === 'dia'
      ? hoje
        ? 'Hoje'
        : semana
      : modo === 'semana'
        ? 'Semana'
        : periodo.rotulo.split(' de ')[0];
  const subtitulo =
    modo === 'dia'
      ? dataDate
        ? diaPorExtenso(data).split(', ')[1]
        : ''
      : modo === 'semana'
        ? periodo.rotulo
        : periodo.rotulo.split(' de ')[1];
  const noPeriodoAtual =
    modo === 'dia' ? hoje : periodo.de <= hojeCalendarDate() && hojeCalendarDate() <= periodo.ate;

  // semana e mes: os horarios agrupados por dia
  const porDia = useMemo(() => {
    const mapa = new Map<CalendarDate, Agendamento[]>();
    for (const a of doPeriodo.data ?? []) {
      const dia = calendarDateDoInstante(a.inicio);
      if (!dia) continue;
      mapa.set(dia, [...(mapa.get(dia) ?? []), a]);
    }
    return mapa;
  }, [doPeriodo.data]);
  const contagemDe = (mapa: Map<CalendarDate, Agendamento[]>) =>
    new Map([...mapa].map(([d, l]) => [d, l.filter(conta).length] as const));
  const contagemSeletor = useMemo(() => {
    const mapa = new Map<CalendarDate, Agendamento[]>();
    for (const a of doMesSeletor.data ?? []) {
      const dia = calendarDateDoInstante(a.inicio);
      if (dia) mapa.set(dia, [...(mapa.get(dia) ?? []), a]);
    }
    return contagemDe(mapa);
  }, [doMesSeletor.data]);
  const totalPeriodo = (doPeriodo.data ?? []).filter(conta).length;

  const carregando = modo === 'dia' ? agenda.isLoading : doPeriodo.isLoading;
  const erro = modo === 'dia' ? agenda.error : doPeriodo.error;
  const recarregar = () => void (modo === 'dia' ? agenda.refetch() : doPeriodo.refetch());

  return (
    <TelaRolavel
      insetInferior={false}
      refreshControl={
        <RefreshControl
          refreshing={modo === 'dia' ? agenda.isRefetching : doPeriodo.isRefetching}
          onRefresh={recarregar}
        />
      }
    >
      <View className="pt-10">
        <View className="flex-row items-center justify-between">
          <Text className="font-sans-medium text-ui-sm text-texto-3">Sua agenda</Text>
          <AtalhoDoPerfil aoTocar={() => router.push('/conta' as never)} />
        </View>

        <View className="mt-1 flex-row items-end justify-between gap-3">
          <View className="flex-1">
            <Text accessibilityRole="header" className="font-display text-ds-48 text-texto">
              {titulo}
            </Text>
            <Text className="mt-1 font-sans text-ui-lg text-texto-2">{subtitulo}</Text>
          </View>
          <View className="flex-row items-center gap-2 pb-1">
            {noPeriodoAtual ? null : (
              <BotaoAtelie
                variante="texto"
                titulo="Hoje"
                onPress={() => setData(hojeCalendarDate())}
              />
            )}
            <Seta
              direcao={-1}
              aoTocar={() => andar(-1)}
              rotulo={
                modo === 'dia'
                  ? 'Dia anterior'
                  : modo === 'semana'
                    ? 'Semana anterior'
                    : 'Mês anterior'
              }
            />
            <Seta
              direcao={1}
              aoTocar={() => andar(1)}
              rotulo={
                modo === 'dia'
                  ? 'Próximo dia'
                  : modo === 'semana'
                    ? 'Próxima semana'
                    : 'Próximo mês'
              }
            />
          </View>
        </View>

        <View className="mt-5 flex-row items-center gap-2">
          <View className="flex-1 flex-row gap-2" accessibilityRole="radiogroup">
            {MODOS.map((m) => {
              const on = modo === m.chave;
              return (
                <Pressable
                  key={m.chave}
                  onPress={() => setModo(m.chave)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  className={cn(
                    'flex-1 items-center rounded-full border py-[10px]',
                    on ? 'border-latao bg-latao' : 'border-borda'
                  )}
                >
                  <Text
                    className={cn(
                      'font-sans-semibold text-ui-sm',
                      on ? 'text-fundo' : 'text-texto-2'
                    )}
                  >
                    {m.rotulo}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            onPress={() => {
              setMesDoSeletor(data);
              setEscolhendo(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Escolher data"
            className="h-11 flex-row items-center justify-center gap-2 rounded-full border border-latao px-3"
            style={({ pressed }) => (pressed ? { opacity: 0.6 } : null)}
          >
            <IconeDaAba rota="agenda" cor={cores.gold} tamanho={20} />
            {/* no celular so o calendario: o texto apertava os tres botoes do lado */}
            {largo ? (
              <Text className="font-sans-semibold text-ui-sm text-latao">Escolher data</Text>
            ) : null}
          </Pressable>
        </View>

        <Text className="mt-4 font-sans text-ui text-texto-2">
          {modo === 'dia'
            ? `${totalAtendimentos === 0 ? 'Nenhum atendimento' : `${totalAtendimentos} ${totalAtendimentos === 1 ? 'atendimento' : 'atendimentos'}`}${faixaDoDia ? `, das ${faixaDoDia}` : ''}`
            : `${totalPeriodo === 0 ? 'Nenhum atendimento' : `${totalPeriodo} ${totalPeriodo === 1 ? 'atendimento' : 'atendimentos'}`} ${modo === 'semana' ? 'na semana' : 'no mês'}`}
        </Text>

        {semFicha ? (
          <EstadoVazio
            className="mt-7"
            titulo="Você ainda não atende."
            descricao="Para ter agenda, crie a sua ficha na aba Equipe, em Adicionar profissional."
          />
        ) : carregando || carregandoFicha ? (
          <Carregando className="mt-7" />
        ) : erro ? (
          <EstadoErro className="mt-7" erro={erro} aoTentarDeNovo={recarregar} />
        ) : modo === 'mes' ? (
          <View className="mt-6">
            <CalendarioMes referencia={data} contagem={contagemDe(porDia)} aoEscolher={abrirDia} />
            <Text className="mt-4 font-sans text-ui-sm text-texto-3">
              Toque num dia para ver os horários dele.
            </Text>
          </View>
        ) : modo === 'semana' ? (
          <VistaDaSemana
            dias={diasEntre(periodo.de, periodo.ate)}
            porDia={porDia}
            aoAbrirDia={abrirDia}
            aoAbrir={abrir}
          />
        ) : totalAtendimentos === 0 ? (
          <EstadoVazio
            className="mt-7"
            titulo={faixaDoDia ? 'Agenda livre.' : 'Dia de folga.'}
            descricao={
              faixaDoDia
                ? 'Ninguém marcou neste dia ainda.'
                : 'Este dia está fora da sua grade semanal.'
            }
          />
        ) : (
          <View className="mt-8 gap-3">
            {blocos.map((bloco) =>
              bloco.tipo === 'agora' ? (
                <View
                  key="agora"
                  className="flex-row items-center gap-3"
                  accessibilityLabel={`Agora, ${bloco.hora}`}
                >
                  <Text className="w-14 font-sans-semibold text-ui-sm text-cadeira">
                    {bloco.hora}
                  </Text>
                  <View className="h-2 w-2 rounded-full bg-cadeira" />
                  <View className="h-px flex-1 bg-cadeira/60" />
                </View>
              ) : bloco.tipo === 'atendimento' ? (
                <View key={bloco.item.id} className="flex-row gap-3">
                  <Text className="w-14 pt-4 font-sans-semibold text-ui text-texto">
                    {bloco.hora}
                  </Text>
                  <View className="flex-1">
                    <Pressable
                      onPress={() => abrir(bloco.item)}
                      accessibilityRole="button"
                      accessibilityLabel={`${bloco.hora}, ${bloco.item.clienteNome ?? ''}, ${bloco.item.servicoNome ?? ''}`}
                      className={cn(
                        'flex-row items-center gap-3 rounded-[3px] border border-borda bg-superficie px-5 py-4',
                        // so o que ainda vai acontecer leva o filete dourado; o resto fica sem
                        // ele e com o selo do status. Sem esmaecer: opacidade derrubava o
                        // contraste do texto abaixo do minimo de leitura (WCAG AA).
                        bloco.item.status === 'AGENDADO' && 'border-l-2 border-l-latao'
                      )}
                      style={({ pressed }) => (pressed ? { opacity: 0.75 } : null)}
                    >
                      <View className="flex-1 gap-1">
                        <Text className="font-display text-ds-20 text-texto" numberOfLines={1}>
                          {bloco.item.clienteNome}
                        </Text>
                        <Text className="font-sans text-ui-sm text-texto-2" numberOfLines={1}>
                          {bloco.item.servicoNome ?? ''}, {formatDuracao(bloco.item.duracaoMinutos)}
                        </Text>
                        {bloco.item.primeiraVisita && bloco.item.status === 'AGENDADO' ? (
                          <Selo>Primeira visita</Selo>
                        ) : null}
                        {bloco.item.status && bloco.item.status !== 'AGENDADO' ? (
                          <Selo apagado>{ROTULO_STATUS[bloco.item.status]}</Selo>
                        ) : null}
                      </View>
                      <Text className="font-sans text-ds-24 text-texto-3">›</Text>
                    </Pressable>
                    <Baixa item={bloco.item} />
                  </View>
                </View>
              ) : (
                <View key={bloco.chave} className="flex-row gap-3">
                  <Text className="w-14 pt-[10px] font-sans text-ui-sm text-texto-3">
                    {bloco.hora}
                  </Text>
                  {/* tracejado sem raio: no Android, dashed + border-radius nao renderiza */}
                  <View className="flex-1 items-center border border-dashed border-borda p-[10px]">
                    <Text className="font-sans text-ui-sm text-texto-3">Livre</Text>
                  </View>
                </View>
              )
            )}
          </View>
        )}

        {modo === 'dia' && cancelados.length > 0 ? (
          <Text className="mt-6 font-sans text-ui-sm text-texto-3">
            {cancelados.length === 1
              ? '1 horário cancelado neste dia.'
              : `${cancelados.length} horários cancelados neste dia.`}
          </Text>
        ) : null}
      </View>

      <Modal
        visible={escolhendo}
        transparent
        animationType="fade"
        onRequestClose={() => setEscolhendo(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/70 px-4">
          {/* tocar fora fecha, como em qualquer seletor de data */}
          <Pressable
            accessibilityLabel="Fechar o calendário"
            onPress={() => setEscolhendo(false)}
            className="absolute inset-0"
          />
          <View
            accessibilityViewIsModal
            className="w-full max-w-[420px] rounded-[6px] border border-borda bg-superficie px-5 pb-4 pt-5"
          >
            <ScrollView>
              <Text accessibilityRole="header" className="font-display text-d-23 text-texto">
                Escolher data
              </Text>
              <View className="mt-4 flex-row items-center justify-between">
                <Seta
                  direcao={-1}
                  aoTocar={() => setMesDoSeletor(andarPeriodo('mes', mesDoSeletor, -1))}
                  rotulo="Mês anterior no calendário"
                />
                <Text className="font-sans-semibold text-ui-lg text-texto">
                  {mesSeletor.rotulo}
                </Text>
                <Seta
                  direcao={1}
                  aoTocar={() => setMesDoSeletor(andarPeriodo('mes', mesDoSeletor, 1))}
                  rotulo="Próximo mês no calendário"
                />
              </View>
              <View className="mt-3">
                <CalendarioMes
                  referencia={mesDoSeletor}
                  contagem={contagemSeletor}
                  selecionado={data}
                  aoEscolher={abrirDia}
                  compacto
                />
              </View>
              <View className="mt-3 flex-row justify-between">
                <BotaoAtelie
                  variante="texto"
                  titulo="Hoje"
                  onPress={() => abrirDia(hojeCalendarDate())}
                />
                <BotaoAtelie
                  variante="texto"
                  titulo="Fechar"
                  onPress={() => setEscolhendo(false)}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </TelaRolavel>
  );
}

/** A semana em lista: cada dia com os horarios dele, compactos, e a baixa ali mesmo. */
function VistaDaSemana({
  dias,
  porDia,
  aoAbrirDia,
  aoAbrir,
}: {
  dias: CalendarDate[];
  porDia: Map<CalendarDate, Agendamento[]>;
  aoAbrirDia: (dia: CalendarDate) => void;
  aoAbrir: (item: Agendamento) => void;
}) {
  return (
    <View className="mt-6">
      {dias.map((dia) => {
        const lista = (porDia.get(dia) ?? [])
          .filter((a) => a.status !== 'CANCELADO')
          .sort((a, b) => Date.parse(a.inicio ?? '') - Date.parse(b.inicio ?? ''));
        const d = parseCalendarDate(dia);
        const ehHoje = isHoje(dia);
        return (
          <View key={dia} className="border-b border-borda py-4">
            <Pressable
              onPress={() => aoAbrirDia(dia)}
              accessibilityRole="button"
              accessibilityLabel={`Abrir ${diaPorExtenso(dia)}`}
              className="flex-row items-baseline justify-between"
            >
              <Text className={cn('font-display text-ds-20', ehHoje ? 'text-latao' : 'text-texto')}>
                {d ? `${nomeDiaSemana(d.getDay() as DiaSemana)}, ${d.getDate()}` : dia}
                {ehHoje ? ' (hoje)' : ''}
              </Text>
              <Text className="font-sans text-ui-sm text-texto-3">
                {lista.length === 0
                  ? 'livre'
                  : `${lista.length} ${lista.length === 1 ? 'horário' : 'horários'}`}
              </Text>
            </Pressable>
            {lista.map((a) => (
              <View key={a.id} className="mt-2 flex-row items-center gap-3">
                <Pressable
                  onPress={() => aoAbrir(a)}
                  accessibilityRole="button"
                  accessibilityLabel={`${formatHora(a.inicio)}, ${a.clienteNome ?? ''}, ${a.servicoNome ?? ''}`}
                  className="flex-1 flex-row items-center gap-3 py-1"
                >
                  <Text className="w-12 font-sans-semibold text-ui text-texto">
                    {formatHora(a.inicio)}
                  </Text>
                  <View className="flex-1">
                    <Text className="font-sans-medium text-ui text-texto" numberOfLines={1}>
                      {a.clienteNome}
                    </Text>
                    <Text className="font-sans text-ui-sm text-texto-3" numberOfLines={1}>
                      {a.servicoNome}
                      {a.status !== 'AGENDADO' && a.status
                        ? `, ${ROTULO_STATUS[a.status].toLowerCase()}`
                        : ''}
                    </Text>
                  </View>
                </Pressable>
                <Baixa item={a} compacto />
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}

function Seta({
  direcao,
  aoTocar,
  rotulo,
}: {
  direcao: 1 | -1;
  aoTocar: () => void;
  rotulo: string;
}) {
  return (
    <Pressable
      onPress={aoTocar}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      className="h-11 w-11 items-center justify-center rounded-full border border-borda"
      style={({ pressed }) => (pressed ? { opacity: 0.6 } : null)}
    >
      <Text className="font-sans text-ds-24 text-texto-2">{direcao === 1 ? '›' : '‹'}</Text>
    </Pressable>
  );
}

function Selo({ children, apagado }: { children: string; apagado?: boolean }) {
  return (
    <View
      className={cn(
        'mt-1 self-start rounded-full px-3 py-[3px]',
        // "Primeira visita" so com contorno: o fundo dourado deixava o texto dourado
        // abaixo do contraste minimo no tema claro
        apagado ? 'bg-borda/60' : 'border border-latao/50'
      )}
    >
      <Text className={cn('font-sans-medium text-ui-xs', apagado ? 'text-texto-2' : 'text-latao')}>
        {children}
      </Text>
    </View>
  );
}
