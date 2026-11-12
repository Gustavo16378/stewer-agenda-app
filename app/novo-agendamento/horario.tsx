/**
 * Passo 3 de 4 do agendamento: dia e horario (redesenho, nov/2026).
 *
 * Uma faixa de dias que rola de lado (os proximos 60, o limite que a API aceita para
 * marcar) no lugar da grade do mes: no celular cabe no polegar e o dia escolhido fica
 * sempre a vista. O primeiro dia em que o profissional atende e ainda tem horario livre
 * ja vem escolhido (dia cheio, ou hoje depois do ultimo horario, e pulado), entao a
 * pessoa ve horarios assim que a tela abre. Os horarios vem agrupados por periodo
 * (manha, tarde, noite) em botoes grandes, e a faixa presa embaixo resume a escolha.
 *
 * Dados:
 *   grade    <- GET /profissionais/{id}/disponibilidade  (quais dias da semana atendem)
 *   horarios <- GET /profissionais/{id}/horarios-livres?data=&servicoId=
 *
 * DATAS -- o cuidado desta tela:
 *   - `?data=` e o DIA DE CALENDARIO LOCAL (toCalendarDate); nunca toISOString().slice.
 *   - os slots chegam como INSTANTES e sao exibidos no fuso do aparelho (formatHora);
 *   - o slot escolhido segue para a confirmacao como o ISO cru que a API devolveu.
 *   - "hoje", "passado" e "dia da semana" sao todos calculados no calendario LOCAL.
 */
import { format } from 'date-fns/format';
import { ptBR } from 'date-fns/locale/pt-BR';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDisponibilidade, useHorariosLivres } from '@/api/hooks';
import type { HorarioLivre } from '@/api/types';
import { BarraDeResumo, CabecalhoDoFluxo } from '@/components/atelie/fluxo';
import { Carregando, EstadoErro, EstadoVazio } from '@/components/ui/estados';
import { cn } from '@/lib/cn';
import {
  diaPorExtenso,
  diaSemanaDe,
  formatHora,
  hojeCalendarDate,
  parseCalendarDate,
  parseInstant,
  somaDias,
  type CalendarDate,
} from '@/lib/datetime';
import { useFluxoDeAgendamento } from '@/lib/fluxo-agendamento';
import { useLayoutLargo } from '@/lib/responsivo';

/** A API aceita marcar com ate 60 dias de antecedencia (LimitesDeReserva). */
const DIAS_A_FRENTE = 60;

const PERIODOS = [
  { nome: 'Manhã', ate: 12 },
  { nome: 'Tarde', ate: 18 },
  { nome: 'Noite', ate: 24 },
] as const;

const SEMANA_CURTA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const semanaCurta = (d: Date) => SEMANA_CURTA[d.getDay()] ?? '';

function ChipDia({
  dia,
  disponivel,
  selecionado,
  mostraMes,
  aoTocar,
}: {
  dia: CalendarDate;
  disponivel: boolean;
  selecionado: boolean;
  mostraMes: boolean;
  aoTocar: () => void;
}) {
  const d = parseCalendarDate(dia) ?? new Date();
  return (
    <View className="items-center">
      <Text className="h-5 font-sans-medium text-ui-xs text-latao">
        {mostraMes ? format(d, 'MMM', { locale: ptBR }).replace('.', '') : ''}
      </Text>
      <Pressable
        disabled={!disponivel}
        onPress={aoTocar}
        accessibilityRole="button"
        accessibilityState={{ disabled: !disponivel, selected: selecionado }}
        accessibilityLabel={diaPorExtenso(dia)}
        className={cn(
          'h-[78px] w-[58px] items-center justify-center gap-1 rounded-[3px] border',
          selecionado
            ? 'border-latao bg-latao'
            : disponivel
              ? 'border-borda bg-superficie'
              : 'border-transparent'
        )}
      >
        <Text
          className={cn(
            'font-sans-medium text-ui-xs',
            selecionado ? 'text-fundo' : disponivel ? 'text-texto-3' : 'text-texto-3/45'
          )}
        >
          {semanaCurta(d)}
        </Text>
        <Text
          className={cn(
            'font-display text-ds-24',
            selecionado ? 'text-fundo' : disponivel ? 'text-texto' : 'text-texto-3/45'
          )}
        >
          {d.getDate()}
        </Text>
      </Pressable>
    </View>
  );
}

export default function DataEHorario() {
  const router = useRouter();
  const largo = useLayoutLargo();
  const insets = useSafeAreaInsets();
  const { servicoId, profissionalId } = useLocalSearchParams<{
    servicoId?: string;
    profissionalId?: string;
  }>();
  const { extras, agendamentoId, remarcando, eyebrow } = useFluxoDeAgendamento();

  const hoje = hojeCalendarDate();
  const dias = useMemo(
    () =>
      Array.from({ length: DIAS_A_FRENTE }, (_, i) => somaDias(hoje, i)).filter(
        (d): d is CalendarDate => !!d
      ),
    [hoje]
  );

  const grade = useDisponibilidade(profissionalId);
  const diasAtendidos = useMemo(() => {
    const set = new Set<number>();
    for (const faixa of grade.data ?? []) {
      if (typeof faixa.diaSemana === 'number') set.add(faixa.diaSemana);
    }
    return set;
  }, [grade.data]);

  const diaDisponivel = (dia: CalendarDate): boolean => {
    // sem grade carregada ainda, nao bloqueia: o backend e quem decide
    if (grade.data === undefined) return true;
    const ds = diaSemanaDe(dia);
    return ds !== null && diasAtendidos.has(ds);
  };

  const [escolhido, setEscolhido] = useState<CalendarDate | null>(null);
  // Dias em que ele atende mas que ja estao cheios (ou hoje, depois do ultimo horario):
  // sem escolha da pessoa, a tela pula para o proximo, ate achar um com horario.
  const [cheios, setCheios] = useState<ReadonlySet<CalendarDate>>(new Set());
  // sem escolha, o primeiro dia em que ele atende e ainda tem horario
  const primeiroLivre = grade.data
    ? (dias.find((d) => diaDisponivel(d) && !cheios.has(d)) ?? null)
    : null;
  const diaSelecionado = escolhido ?? primeiroLivre;

  const [slot, setSlot] = useState<HorarioLivre | null>(null);
  useEffect(() => setSlot(null), [diaSelecionado]);

  const horarios = useHorariosLivres(
    profissionalId,
    diaSelecionado ?? undefined,
    servicoId,
    agendamentoId
  );

  const grupos = useMemo(() => {
    const lista = horarios.data?.horarios ?? [];
    let de = 0;
    return PERIODOS.map((p) => {
      const itens = lista.filter((h) => {
        const hora = parseInstant(h.inicio)?.getHours() ?? 0;
        return hora >= de && hora < p.ate;
      });
      de = p.ate;
      return { ...p, itens };
    }).filter((g) => g.itens.length > 0);
  }, [horarios.data]);

  // mesma regra da tela: dia sem nenhum horario para mostrar e pulado (so enquanto a
  // pessoa nao escolheu um dia por conta propria)
  useEffect(() => {
    if (escolhido || !diaSelecionado || !horarios.data || horarios.isFetching) return;
    if (grupos.length > 0 || cheios.size >= 21) return;
    setCheios((antes) => new Set(antes).add(diaSelecionado));
  }, [escolhido, diaSelecionado, horarios.data, horarios.isFetching, grupos.length, cheios.size]);

  function continuar() {
    if (!slot?.inicio) return;
    router.push({
      pathname: '/novo-agendamento/confirmar',
      params: {
        servicoId: servicoId ?? '',
        profissionalId: profissionalId ?? '',
        inicio: slot.inicio,
        fim: slot.fim ?? '',
        ...extras,
      },
    } as never);
  }

  const colunas = largo ? 5 : 4;

  return (
    <View className="flex-1 bg-fundo" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={[
          { paddingBottom: 40 },
          largo && { width: '100%', maxWidth: 760, alignSelf: 'center', paddingTop: 24 },
        ]}
      >
        <View className="px-7">
          <CabecalhoDoFluxo
            passo={remarcando ? undefined : 3}
            contexto={eyebrow}
            titulo="Quando fica bom?"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-7"
          contentContainerClassName="gap-2 px-7"
          accessibilityLabel="Dias"
        >
          {dias.map((dia, i) => (
            <ChipDia
              key={dia}
              dia={dia}
              disponivel={diaDisponivel(dia)}
              selecionado={dia === diaSelecionado}
              mostraMes={i === 0 || parseCalendarDate(dia)?.getDate() === 1}
              aoTocar={() => setEscolhido(dia)}
            />
          ))}
        </ScrollView>

        <View className="px-7">
          {grade.error ? (
            <EstadoErro
              className="mt-6"
              erro={grade.error}
              aoTentarDeNovo={() => void grade.refetch()}
            />
          ) : null}

          {diaSelecionado ? (
            <>
              <Text className="mt-8 font-display text-ds-24 text-texto">
                {diaPorExtenso(diaSelecionado)}
              </Text>
              {horarios.isLoading ? (
                <Carregando className="py-10" />
              ) : horarios.error ? (
                <EstadoErro
                  className="py-4"
                  erro={horarios.error}
                  aoTentarDeNovo={() => void horarios.refetch()}
                />
              ) : grupos.length === 0 ? (
                <EstadoVazio
                  className="py-8"
                  titulo="Dia cheio."
                  descricao="Não sobrou horário neste dia. Escolha outro na faixa acima."
                />
              ) : (
                grupos.map((g) => (
                  <View key={g.nome} className="mt-6">
                    <Text className="font-sans-medium text-ui-sm text-texto-3">{g.nome}</Text>
                    <View className="mt-3 flex-row flex-wrap" style={{ marginHorizontal: -4 }}>
                      {g.itens.map((h) => {
                        const ativo = slot?.inicio === h.inicio;
                        return (
                          <View
                            key={h.inicio}
                            style={{ width: `${100 / colunas}%` }}
                            className="p-1"
                          >
                            <Pressable
                              onPress={() => setSlot(h)}
                              accessibilityRole="button"
                              accessibilityState={{ selected: ativo }}
                              className={cn(
                                'items-center rounded-[3px] border py-[14px]',
                                ativo ? 'border-latao bg-latao' : 'border-borda bg-superficie'
                              )}
                            >
                              <Text
                                className={cn(
                                  'font-sans-semibold text-ui-lg',
                                  ativo ? 'text-fundo' : 'text-texto'
                                )}
                              >
                                {formatHora(h.inicio)}
                              </Text>
                            </Pressable>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ))
              )}
            </>
          ) : grade.isLoading ? (
            <Carregando className="py-10" />
          ) : null}
        </View>
      </ScrollView>

      <BarraDeResumo
        linha1={slot ? `às ${formatHora(slot.inicio)}` : 'Escolha um horário'}
        linha2={diaSelecionado ? diaPorExtenso(diaSelecionado) : undefined}
        titulo="Continuar"
        ativo={!!slot}
        aoTocar={continuar}
      />
    </View>
  );
}
