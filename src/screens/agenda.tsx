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
 * O que a tela mostra de "DISPONÍVEL" e o vao entre dois atendimentos consecutivos —
 * derivado dos proprios instantes da agenda. A tag "PRIMEIRA VISITA" vem da API
 * (`primeiraVisita` no agendamento da agenda do dia).
 *
 * DESVIO: o design nao deu a equipe nenhuma tab de perfil. A acao CONTA (dados, senha,
 * tema, sair) mora aqui, discreta, no cabecalho.
 */
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, Text, View } from 'react-native';

import {
  useAgendaDoDia,
  useDisponibilidade,
  useMeuProfissional,
  useSemearAgendamento,
} from '@/api/hooks';
import { ROTULO_STATUS, type Agendamento } from '@/api/types';
import { useAuth } from '@/auth/auth-context';
import { BotaoAtelie } from '@/components/atelie/base';
import { Carregando, EstadoErro, EstadoVazio } from '@/components/ui/estados';
import { TelaRolavel } from '@/components/ui/tela';
import { cn } from '@/lib/cn';
import {
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

  const { profissional, isLoading: carregandoFicha } = useMeuProfissional();
  // PROFISSIONAL: a API usa a ficha do token. ADMIN: manda a propria ficha.
  const agenda = useAgendaDoDia(data, role === 'ADMIN' ? profissional?.id : undefined);
  const semFicha = role === 'ADMIN' && !carregandoFicha && !profissional;
  const grade = useDisponibilidade(profissional?.id);

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

  function mudarDia(delta: number) {
    const novo = somaDias(data, delta);
    if (novo) setData(novo);
  }

  const dataDate = parseCalendarDate(data);
  const semana = dataDate ? nomeDiaSemana(dataDate.getDay() as DiaSemana) : '';

  return (
    <TelaRolavel
      insetInferior={false}
      refreshControl={
        <RefreshControl refreshing={agenda.isRefetching} onRefresh={() => void agenda.refetch()} />
      }
    >
      <View className="pt-10">
        <View className="flex-row items-center justify-between">
          <Text className="font-sans-medium text-ui-sm text-texto-3">Sua agenda</Text>
          <BotaoAtelie
            variante="texto"
            titulo="Conta"
            onPress={() => router.push('/conta' as never)}
          />
        </View>

        <View className="mt-1 flex-row items-end justify-between gap-3">
          <View className="flex-1">
            <Text accessibilityRole="header" className="font-display text-ds-48 text-texto">
              {hoje ? 'Hoje' : semana}
            </Text>
            <Text className="mt-1 font-sans text-ui-lg text-texto-2">
              {dataDate ? diaPorExtenso(data).split(', ')[1] : ''}
            </Text>
          </View>
          <View className="flex-row items-center gap-2 pb-1">
            {hoje ? null : (
              <BotaoAtelie
                variante="texto"
                titulo="Hoje"
                onPress={() => setData(hojeCalendarDate())}
              />
            )}
            <Seta direcao={-1} aoTocar={() => mudarDia(-1)} rotulo="Dia anterior" />
            <Seta direcao={1} aoTocar={() => mudarDia(1)} rotulo="Próximo dia" />
          </View>
        </View>

        <Text className="mt-4 font-sans text-ui text-texto-2">
          {totalAtendimentos === 0
            ? 'Nenhum atendimento'
            : `${totalAtendimentos} ${totalAtendimentos === 1 ? 'atendimento' : 'atendimentos'}`}
          {faixaDoDia ? `, das ${faixaDoDia}` : ''}
        </Text>

        {semFicha ? (
          <EstadoVazio
            className="mt-7"
            titulo="Você ainda não atende."
            descricao="Para ter agenda, crie a sua ficha na aba Equipe, em Adicionar profissional."
          />
        ) : agenda.isLoading || carregandoFicha ? (
          <Carregando className="mt-7" />
        ) : agenda.error ? (
          <EstadoErro
            className="mt-7"
            erro={agenda.error}
            aoTentarDeNovo={() => void agenda.refetch()}
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
                  <Pressable
                    onPress={() => abrir(bloco.item)}
                    accessibilityRole="button"
                    accessibilityLabel={`${bloco.hora}, ${bloco.item.clienteNome ?? ''}, ${bloco.item.servicoNome ?? ''}`}
                    className={cn(
                      'flex-1 flex-row items-center gap-3 rounded-[3px] border border-borda bg-superficie px-5 py-4',
                      bloco.item.status === 'AGENDADO' && 'border-l-2 border-l-latao',
                      bloco.item.status !== 'AGENDADO' && 'opacity-60'
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

        {cancelados.length > 0 ? (
          <Text className="mt-6 font-sans text-ui-sm text-texto-3">
            {cancelados.length === 1
              ? '1 horário cancelado neste dia.'
              : `${cancelados.length} horários cancelados neste dia.`}
          </Text>
        ) : null}
      </View>
    </TelaRolavel>
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
        apagado ? 'bg-borda/60' : 'bg-latao/14'
      )}
    >
      <Text className={cn('font-sans-medium text-ui-xs', apagado ? 'text-texto-3' : 'text-latao')}>
        {children}
      </Text>
    </View>
  );
}
