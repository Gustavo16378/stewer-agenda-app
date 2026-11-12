/**
 * [06 Data e horário] — PASSO 03 DE 04. O frame 19 e esta MESMA tela no tema claro:
 * os tokens trocam sozinhos, nao ha codigo separado.
 *
 * Layout literal do frame 06: `padding:30px 28px 0`, titulo Playfair 29px, navegacao de
 * mes (‹ Setembro 2026 ›) em `margin-top:26px`, cabecalho D S T Q Q S S (8.5px .14em
 * ink@.38), grade de celulas de 40px com `gap:2px`, eyebrow "HORÁRIOS · SEXTA, 11 SET"
 * em `margin-top:26px`, chips de horario em 3 colunas com `gap:10px`, botao CONTINUAR.
 *
 * Dados:
 *   grade    <- GET /profissionais/{id}/disponibilidade  (quais dias da semana atendem;
 *               e o que pinta domingo e segunda em ink@.25 no frame)
 *   horarios <- GET /profissionais/{id}/horarios-livres?data=&servicoId=
 *
 * DATAS — o cuidado desta tela:
 *   - `?data=` e o DIA DE CALENDARIO LOCAL (toCalendarDate); nunca toISOString().slice.
 *   - os slots chegam como INSTANTES e sao exibidos no fuso do aparelho (formatHora);
 *   - o slot escolhido segue para a confirmacao como o ISO cru que a API devolveu.
 *   - "hoje", "passado" e "dia da semana" sao todos calculados no calendario LOCAL.
 *
 * O design mostra dois chips apagados (11:00, 18:30) sem borda: horarios que nao estao
 * livres. `horarios-livres` so devolve os livres e descarta silenciosamente os que ja
 * passaram no dia de hoje — nao ha como saber o MOTIVO de um horario faltar, entao a
 * tela mostra so os livres em vez de pintar chips apagados com uma explicacao inventada.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useDisponibilidade, useHorariosLivres } from '@/api/hooks';
import type { HorarioLivre } from '@/api/types';
import { Botao } from '@/components/ui/botao';
import { CabecalhoVoltar } from '@/components/ui/cabecalho';
import { Carregando, EstadoErro, EstadoVazio } from '@/components/ui/estados';
import { TelaRolavel } from '@/components/ui/tela';
import { LabelCaps, Titulo } from '@/components/ui/texto';
import { cn } from '@/lib/cn';
import {
  DIAS_SEMANA,
  diaSemanaDe,
  formatDiaCalendarioCaps,
  formatHora,
  formatMesAno,
  gradeDoMes,
  hojeCalendarDate,
  inicialDiaSemana,
  parseCalendarDate,
  type CalendarDate,
} from '@/lib/datetime';

/** Largura de 1/7 para a grade: RN nao tem `display:grid`. */
const COLUNA = { flexBasis: '14.2857%' as const, maxWidth: '14.2857%' as const };

export default function DataEHorario() {
  const router = useRouter();
  const { servicoId, profissionalId } = useLocalSearchParams<{
    servicoId?: string;
    profissionalId?: string;
  }>();

  const hoje = hojeCalendarDate();
  const hojeDate = parseCalendarDate(hoje) ?? new Date();

  // o mes visivel e um par (ano, mes0); comeca no mes de hoje
  const [mes, setMes] = useState({ ano: hojeDate.getFullYear(), mes0: hojeDate.getMonth() });
  const [diaSelecionado, setDiaSelecionado] = useState<CalendarDate | null>(null);
  const [slot, setSlot] = useState<HorarioLivre | null>(null);

  const grade = useDisponibilidade(profissionalId);
  const horarios = useHorariosLivres(profissionalId, diaSelecionado ?? undefined, servicoId);

  // dias da semana em que o profissional atende, segundo a grade
  const diasAtendidos = useMemo(() => {
    const set = new Set<number>();
    for (const faixa of grade.data ?? []) {
      if (typeof faixa.diaSemana === 'number') set.add(faixa.diaSemana);
    }
    return set;
  }, [grade.data]);

  const celulas = useMemo(() => gradeDoMes(mes.ano, mes.mes0), [mes]);
  const mesVisivel = new Date(mes.ano, mes.mes0, 1);
  const mesAtualOuFuturo =
    mes.ano > hojeDate.getFullYear() ||
    (mes.ano === hojeDate.getFullYear() && mes.mes0 > hojeDate.getMonth());

  function mudarMes(delta: number) {
    const d = new Date(mes.ano, mes.mes0 + delta, 1);
    setMes({ ano: d.getFullYear(), mes0: d.getMonth() });
  }

  function diaDisponivel(dia: CalendarDate): boolean {
    // passado (comparacao de dias de calendario, string YYYY-MM-DD ordena certo)
    if (dia < hoje) return false;
    const ds = diaSemanaDe(dia);
    // sem grade carregada ainda, nao bloqueia: o backend e quem decide
    if (grade.data === undefined) return true;
    return ds !== null && diasAtendidos.has(ds);
  }

  function escolherDia(dia: CalendarDate) {
    setDiaSelecionado(dia);
    setSlot(null);
  }

  function continuar() {
    if (!slot?.inicio) return;
    router.push({
      pathname: '/(cliente)/novo-agendamento/confirmar',
      params: {
        servicoId: servicoId ?? '',
        profissionalId: profissionalId ?? '',
        inicio: slot.inicio,
        fim: slot.fim ?? '',
      },
    } as never);
  }

  const listaHorarios = horarios.data?.horarios ?? [];

  return (
    <TelaRolavel>
      <CabecalhoVoltar passo="PASSO 03 DE 04" />

      <View className="pt-[30px]">
        <Titulo className="text-d-29">Data e horário</Titulo>

        {/* navegacao de mes: ‹ e › sao texto no design, nao icone */}
        <View className="mt-[26px] flex-row items-center justify-between">
          <Pressable
            onPress={() => mudarMes(-1)}
            disabled={!mesAtualOuFuturo}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Mês anterior"
            className="px-[6px]"
          >
            <Text
              className={cn(
                'font-sans text-icon',
                mesAtualOuFuturo ? 'text-nav-arrow' : 'text-text-dim'
              )}
            >
              ‹
            </Text>
          </Pressable>
          <Titulo className="text-d-18">{formatMesAno(mesVisivel)}</Titulo>
          <Pressable
            onPress={() => mudarMes(1)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Próximo mês"
            className="px-[6px]"
          >
            <Text className="font-sans text-icon text-nav-arrow">›</Text>
          </Pressable>
        </View>

        {/* cabecalho D S T Q Q S S */}
        <View className="mt-[18px] flex-row">
          {DIAS_SEMANA.map((d) => (
            <View key={d} style={COLUNA} className="items-center py-[6px]">
              <Text className="font-sans-semibold text-caps-xs tracking-tab text-ink/38">
                {inicialDiaSemana(d)}
              </Text>
            </View>
          ))}
        </View>

        {/* celulas do mes */}
        <View className="mt-1 flex-row flex-wrap">
          {celulas.map((dia, i) => {
            if (!dia) return <View key={`vazio-${i}`} style={COLUNA} className="h-10" />;
            const numero = String(parseCalendarDate(dia)?.getDate() ?? '');
            const disponivel = diaDisponivel(dia);
            const selecionado = dia === diaSelecionado;
            const ehHoje = dia === hoje;
            return (
              <View key={dia} style={COLUNA} className="p-px">
                <Pressable
                  disabled={!disponivel}
                  onPress={() => escolherDia(dia)}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !disponivel, selected: selecionado }}
                  accessibilityLabel={`Dia ${numero}`}
                  className={cn(
                    'h-10 items-center justify-center gap-[3px] rounded-token',
                    selecionado && 'border border-gold-border'
                  )}
                >
                  <Text
                    className={cn(
                      'text-body',
                      selecionado
                        ? 'font-sans-semibold text-gold'
                        : disponivel
                          ? 'font-sans text-day'
                          : 'font-sans text-text-disabled'
                    )}
                  >
                    {numero}
                  </Text>
                  {/* o pontinho dourado de 3px marca o dia de hoje */}
                  {ehHoje && !selecionado ? (
                    <View className="h-[3px] w-[3px] rounded-full bg-gold" />
                  ) : null}
                </Pressable>
              </View>
            );
          })}
        </View>

        {grade.error ? (
          <EstadoErro
            className="mt-6"
            erro={grade.error}
            aoTentarDeNovo={() => void grade.refetch()}
          />
        ) : null}

        {diaSelecionado ? (
          <>
            <LabelCaps papel="secao" className="mt-[26px]">
              HORÁRIOS · {formatDiaCalendarioCaps(diaSelecionado)}
            </LabelCaps>

            {horarios.isLoading ? (
              <Carregando className="py-8" />
            ) : horarios.error ? (
              <EstadoErro
                className="py-4"
                erro={horarios.error}
                aoTentarDeNovo={() => void horarios.refetch()}
              />
            ) : listaHorarios.length === 0 ? (
              <EstadoVazio
                className="py-8"
                titulo="Sem horários neste dia."
                descricao="O profissional não atende ou a agenda já está cheia. Escolha outra data."
              />
            ) : (
              <View className="mt-4 flex-row flex-wrap" style={{ marginHorizontal: -5 }}>
                {listaHorarios.map((h) => {
                  const ativo = slot?.inicio === h.inicio;
                  return (
                    <View
                      key={h.inicio}
                      style={{ flexBasis: '33.3333%', maxWidth: '33.3333%' }}
                      className="px-[5px] pb-[10px]"
                    >
                      <Pressable
                        onPress={() => setSlot(h)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: ativo }}
                        className={cn(
                          'items-center rounded-token border py-[13px]',
                          ativo ? 'border-gold-border' : 'border-field-border'
                        )}
                      >
                        <Text
                          className={cn(
                            'text-chip tracking-brand',
                            ativo ? 'font-sans-semibold text-gold' : 'font-sans-medium text-ink'
                          )}
                        >
                          {formatHora(h.inicio)}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        ) : (
          <Text className="mt-[26px] font-sans text-help text-ink/42">
            Escolha um dia para ver os horários livres.
          </Text>
        )}

        <Botao className="mt-[26px]" titulo="CONTINUAR" disabled={!slot} onPress={continuar} />
      </View>
    </TelaRolavel>
  );
}
