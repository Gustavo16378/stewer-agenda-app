/**
 * [10 Agenda do dia] — tab AGENDA do PROFISSIONAL.
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
 * derivado dos proprios instantes da agenda. Nao ha dado para o bloco "INTERVALO" nem
 * para a tag "PRIMEIRA VISITA" do frame:
 *   TODO(API): "PRIMEIRA VISITA" exigiria um `GET /clientes/{id}` por atendimento ou um
 *   campo `primeiraVisita: boolean` no proprio `Agendamento`.
 *
 * DESVIO: o design nao deu ao profissional nenhuma tab de perfil nem saida. A acao SAIR
 * mora aqui, discreta, no cabecalho — senao o profissional fica preso no app.
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
import { ROTULO_STATUS_CAPS, type Agendamento } from '@/api/types';
import { useAuth } from '@/auth/auth-context';
import { AcaoLinha } from '@/components/ui/botao';
import { Carregando, EstadoErro, EstadoVazio } from '@/components/ui/estados';
import { TelaRolavel } from '@/components/ui/tela';
import { LabelCaps, Titulo } from '@/components/ui/texto';
import { cn } from '@/lib/cn';
import {
  comparaWallTime,
  diaSemanaDe,
  formatDiaSemanaEData,
  formatHora,
  formatWallTime,
  hojeCalendarDate,
  isHoje,
  parseInstant,
  somaDias,
  type CalendarDate,
} from '@/lib/datetime';
import { formatDuracaoCaps } from '@/lib/money';

type Bloco =
  | { tipo: 'atendimento'; hora: string; item: Agendamento }
  | { tipo: 'vago'; hora: string; chave: string };

/** Ordena por inicio e insere um bloco "vago" em cada intervalo entre atendimentos. */
function montarTimeline(agenda: Agendamento[]): Bloco[] {
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
  return blocos;
}

export default function AgendaDoDia() {
  const router = useRouter();
  const { sair } = useAuth();
  const semear = useSemearAgendamento();
  const [data, setData] = useState<CalendarDate>(() => hojeCalendarDate());

  const agenda = useAgendaDoDia(data);
  const { profissional } = useMeuProfissional();
  const grade = useDisponibilidade(profissional?.id);

  const blocos = useMemo(() => montarTimeline(agenda.data ?? []), [agenda.data]);
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
    return `${formatWallTime(inicios[0])} — ${formatWallTime(fins[fins.length - 1])}`;
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

  const hoje = isHoje(data);

  return (
    <TelaRolavel
      insetInferior={false}
      refreshControl={
        <RefreshControl refreshing={agenda.isRefetching} onRefresh={() => void agenda.refetch()} />
      }
    >
      <View className="pt-10">
        {/* SAIR na linha do eyebrow, para o titulo de 27px ter a largura toda (o design
            nao desenhou saida para este papel; ver cabecalho do arquivo) */}
        <View className="flex-row items-center justify-between">
          <LabelCaps papel="tela">{hoje ? 'AGENDA · HOJE' : 'AGENDA'}</LabelCaps>
          <AcaoLinha titulo="SAIR" onPress={() => void sair()} />
        </View>
        <View className="flex-row items-end justify-between">
          <View className="flex-1 pr-3">
            <Titulo className="mt-3 text-d-27">{formatDiaSemanaEData(data)}</Titulo>
          </View>
          <View className="flex-row items-center gap-4 pb-1">
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => mudarDia(-1)}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Dia anterior"
              >
                <Text className="font-sans text-icon-sm text-text-dim">‹</Text>
              </Pressable>
              <Pressable
                onPress={() => mudarDia(1)}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Próximo dia"
              >
                <Text className="font-sans text-icon-sm text-nav-arrow">›</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <LabelCaps papel="meta" className="mt-[14px]">
          {totalAtendimentos} {totalAtendimentos === 1 ? 'ATENDIMENTO' : 'ATENDIMENTOS'}
          {faixaDoDia ? ` · ${faixaDoDia}` : ''}
        </LabelCaps>

        {agenda.isLoading ? (
          <Carregando className="mt-7" />
        ) : agenda.error ? (
          <EstadoErro
            className="mt-7"
            erro={agenda.error}
            aoTentarDeNovo={() => void agenda.refetch()}
          />
        ) : blocos.length === 0 ? (
          <EstadoVazio
            className="mt-7"
            titulo={faixaDoDia ? 'Nenhum atendimento neste dia.' : 'Sem atendimento neste dia.'}
            descricao={
              faixaDoDia ? 'A agenda está livre.' : 'Este dia está fora da sua grade semanal.'
            }
          />
        ) : (
          <View className="mt-7 gap-[10px]">
            {blocos.map((bloco) =>
              bloco.tipo === 'atendimento' ? (
                <View key={bloco.item.id} className="flex-row gap-4">
                  <Text className="w-11 pt-[14px] font-sans-semibold text-caps-md tracking-tightest text-ink/50">
                    {bloco.hora}
                  </Text>
                  <Pressable
                    onPress={() => abrir(bloco.item)}
                    accessibilityRole="button"
                    className={cn(
                      'flex-1 flex-row items-center justify-between rounded-token border border-divider bg-surface px-[18px] py-[15px]',
                      bloco.item.status !== 'AGENDADO' && 'opacity-60'
                    )}
                    style={({ pressed }) => (pressed ? { opacity: 0.7 } : null)}
                  >
                    <View className="flex-1 gap-[6px] pr-3">
                      <Text className="font-sans-medium text-row text-ink" numberOfLines={1}>
                        {bloco.item.clienteNome}
                      </Text>
                      <LabelCaps papel="micro" className="text-ink/50" numberOfLines={1}>
                        {(bloco.item.servicoNome ?? '').toUpperCase()}
                      </LabelCaps>
                      {bloco.item.status && bloco.item.status !== 'AGENDADO' ? (
                        <LabelCaps papel="micro" className="mt-[6px] tracking-tab text-gold">
                          {ROTULO_STATUS_CAPS[bloco.item.status]}
                        </LabelCaps>
                      ) : null}
                    </View>
                    <LabelCaps papel="micro" className="tracking-tab text-text-dim">
                      {formatDuracaoCaps(bloco.item.duracaoMinutos)}
                    </LabelCaps>
                  </Pressable>
                </View>
              ) : (
                <View key={bloco.chave} className="flex-row gap-4">
                  <Text className="w-11 pt-[9px] font-sans-semibold text-caps-md tracking-tightest text-ink/35">
                    {bloco.hora}
                  </Text>
                  {/* tracejado sem raio: no Android, dashed + border-radius nao renderiza */}
                  <View className="flex-1 items-center border border-dashed border-field-border p-[10px]">
                    <LabelCaps papel="micro" className="tracking-button text-ink/32">
                      DISPONÍVEL
                    </LabelCaps>
                  </View>
                </View>
              )
            )}
          </View>
        )}

        {cancelados.length > 0 ? (
          <Text className="mt-6 font-sans text-help text-ink/38">
            {cancelados.length === 1
              ? '1 agendamento cancelado neste dia.'
              : `${cancelados.length} agendamentos cancelados neste dia.`}
          </Text>
        ) : null}
      </View>
    </TelaRolavel>
  );
}
