/**
 * [15 Dashboard] — tab VISÃO GERAL do ADMIN.
 *
 * Layout literal do frame 15: eyebrow "VISÃO GERAL", titulo Playfair 29 "Esta semana",
 * faixa "31 AGO — 06 SET"; tres blocos separados por divisor (`padding-bottom:30px`):
 *   1. "32" (Playfair 42, lh 1) + AGENDAMENTOS NA SEMANA, com mini grafico de 7 barras de
 *      18px (`gap:9px`, a de hoje dourada, as outras ink@.16) e letras S T Q Q S S D;
 *   2. "78%" + TAXA DE OCUPAÇÃO, barra de 2px (trilha ink@.12, preenchimento dourado);
 *   3. "9" + CLIENTES NOVOS NO MÊS, com "+3 VS. JULHO" dourado;
 * e a linha "Receita estimada da semana" (12.5 ink@.55) com o valor em Playfair 19.
 *
 * NAO EXISTE ENDPOINT DE RELATORIO. Tudo aqui e derivado de endpoints reais, no app:
 *   agenda   <- GET /agendamentos/agenda?data=&profissionalId=  x 7 dias x N profissionais
 *               (para ADMIN o profissionalId e obrigatorio em cada chamada)
 *   grades   <- GET /profissionais/{id}/disponibilidade         (minutos ofertados na semana)
 *   clientes <- GET /clientes (todas as paginas)                (novos no mes, por createdAt)
 * Semana = segunda a domingo, como no design. Contam AGENDADO e CONCLUIDO; cancelado e
 * nao-comparecido ficam fora de tudo (agenda, ocupacao e receita).
 *
 *   TODO(API): um `GET /relatorios/semana?de=&ate=` devolveria isto em uma chamada em
 *   vez de 7xN + paginas de clientes. Num estudio com um profissional sao ~8 chamadas,
 *   cacheadas por 1 minuto; com muitos profissionais o custo cresce linearmente.
 *
 * Nenhum numero aqui e inventado: se a fonte falha, o bloco mostra "—" e o erro.
 */
import { useMemo } from 'react';
import { RefreshControl, Text, View } from 'react-native';

import {
  useAgendaDeVariosDias,
  useDisponibilidadesDe,
  useProfissionais,
  useTodosClientes,
} from '@/api/hooks';
import type { Agendamento } from '@/api/types';
import { Carregando, EstadoErro } from '@/components/ui/estados';
import { TelaRolavel } from '@/components/ui/tela';
import { LabelCaps, Titulo } from '@/components/ui/texto';
import { cn } from '@/lib/cn';
import {
  diaSemanaDe,
  formatFaixaDiasCaps,
  hojeCalendarDate,
  mesAnterior,
  noMesmoMesLocal,
  nomeMesCaps,
  semanaDe,
  wallTimeParaMinutos,
  type CalendarDate,
} from '@/lib/datetime';
import { formatCentavos, somaCentavos } from '@/lib/money';

const ALTURA_MAX_BARRA = 47; // px, a barra mais alta do frame
const LETRAS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']; // segunda..domingo, como o design

const conta = (a: Agendamento) => a.status === 'AGENDADO' || a.status === 'CONCLUIDO';

export default function VisaoGeral() {
  const hoje = hojeCalendarDate();
  const semana = useMemo(() => semanaDe(hoje), [hoje]);
  const agora = new Date();

  const profissionais = useProfissionais(false);
  const ids = useMemo(
    () => (profissionais.data ?? []).map((p) => p.id).filter((x): x is string => !!x),
    [profissionais.data]
  );

  const agenda = useAgendaDeVariosDias(semana, ids);
  const grades = useDisponibilidadesDe(ids);
  const clientes = useTodosClientes();

  // --- 1. agendamentos na semana + barras por dia ---
  const porDia = useMemo(
    () => semana.map((d) => (agenda.porDia.get(d) ?? []).filter(conta)),
    [semana, agenda.porDia]
  );
  const totalSemana = porDia.reduce((n, l) => n + l.length, 0);
  const maxDia = Math.max(1, ...porDia.map((l) => l.length));

  // --- 2. ocupacao: minutos agendados / minutos ofertados pela grade ---
  const ocupacao = useMemo(() => {
    let ofertados = 0;
    for (const dia of semana) {
      const ds = diaSemanaDe(dia);
      for (const grade of grades.grades) {
        for (const f of grade) {
          if (f.diaSemana !== ds) continue;
          const i = wallTimeParaMinutos(f.horaInicio);
          const fim = wallTimeParaMinutos(f.horaFim);
          if (i !== null && fim !== null && fim > i) ofertados += fim - i;
        }
      }
    }
    const usados = porDia.flat().reduce((n, a) => n + (a.duracaoMinutos ?? 0), 0);
    if (ofertados === 0) return null;
    return Math.min(100, Math.round((usados / ofertados) * 100));
  }, [semana, grades.grades, porDia]);

  // --- 3. clientes novos no mes vs. mes anterior ---
  const novos = useMemo(() => {
    const lista = clientes.data ?? [];
    const esteMes = lista.filter((c) => noMesmoMesLocal(c.createdAt, agora)).length;
    const anterior = lista.filter((c) => noMesmoMesLocal(c.createdAt, mesAnterior(agora))).length;
    return { esteMes, anterior, delta: esteMes - anterior };
    // `agora` e recriado a cada render de proposito: o mes muda com o relogio
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientes.data]);

  // --- 4. receita estimada da semana (centavos inteiros) ---
  const receita = somaCentavos(porDia.flat().map((a) => a.precoCentavos));

  const carregando = profissionais.isLoading || agenda.carregando;
  const erro = profissionais.error ?? agenda.erro;
  const refetch = () => {
    void profissionais.refetch();
    agenda.refetch();
    void clientes.refetch();
  };

  return (
    <TelaRolavel
      insetInferior={false}
      refreshControl={
        <RefreshControl
          refreshing={agenda.carregando && !!agenda.porDia.size}
          onRefresh={refetch}
        />
      }
    >
      <View className="pt-10">
        <LabelCaps papel="tela">VISÃO GERAL</LabelCaps>
        <Titulo className="mt-3 text-d-29">Esta semana</Titulo>
        <LabelCaps papel="meta" className="mt-[14px]">
          {formatFaixaDiasCaps(semana[0] ?? hoje, semana[6] ?? hoje)}
        </LabelCaps>

        {carregando ? (
          <Carregando className="mt-[38px]" />
        ) : erro ? (
          <EstadoErro className="mt-[38px]" erro={erro} aoTentarDeNovo={refetch} />
        ) : ids.length === 0 ? (
          <Text className="mt-[38px] font-sans text-help text-ink/42">
            Sem profissionais ativos: não há agenda para somar. Cadastre a equipe na aba EQUIPE.
          </Text>
        ) : (
          <>
            {/* 1. agendamentos na semana */}
            <View className="mt-[38px] border-b border-divider pb-[30px]">
              <View className="flex-row items-end justify-between">
                <View>
                  <Titulo className="text-d-42 leading-[42px]">{totalSemana}</Titulo>
                  <LabelCaps papel="micro" className="mt-3 tracking-button text-text-muted">
                    AGENDAMENTOS NA SEMANA
                  </LabelCaps>
                </View>
                <View className="flex-row items-end gap-[9px]">
                  {porDia.map((lista, i) => {
                    const dia = semana[i] as CalendarDate;
                    const altura = Math.max(
                      2,
                      Math.round((lista.length / maxDia) * ALTURA_MAX_BARRA)
                    );
                    return (
                      <View key={dia} className="items-center gap-2">
                        <View
                          className={cn('w-[18px]', dia === hoje ? 'bg-gold' : 'bg-ink/16')}
                          style={{ height: altura }}
                          accessibilityLabel={`${lista.length} em ${dia}`}
                        />
                        <Text className="font-sans-semibold text-micro text-ink/35">
                          {LETRAS[i]}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* 2. taxa de ocupacao */}
            <View className="mt-[30px] border-b border-divider pb-[30px]">
              <Titulo className="text-d-42 leading-[42px]">
                {ocupacao === null ? '—' : `${ocupacao}%`}
              </Titulo>
              <LabelCaps papel="micro" className="mt-3 tracking-button text-text-muted">
                TAXA DE OCUPAÇÃO
              </LabelCaps>
              <View className="mt-5 h-[2px] bg-ink/12">
                <View className="h-full bg-gold" style={{ width: `${ocupacao ?? 0}%` }} />
              </View>
              {grades.erro ? (
                <Text className="mt-3 font-sans text-help text-red-500">{grades.erro.message}</Text>
              ) : ocupacao === null && !grades.carregando ? (
                <Text className="mt-3 font-sans text-help text-ink/38">
                  Sem grade semanal cadastrada, não há horas ofertadas para comparar.
                </Text>
              ) : null}
            </View>

            {/* 3. clientes novos no mes */}
            <View className="mt-[30px] border-b border-divider pb-[30px]">
              <View className="flex-row items-end justify-between">
                <View>
                  <Titulo className="text-d-42 leading-[42px]">
                    {clientes.data ? novos.esteMes : clientes.error ? '—' : '…'}
                  </Titulo>
                  <LabelCaps papel="micro" className="mt-3 tracking-button text-text-muted">
                    CLIENTES NOVOS NO MÊS
                  </LabelCaps>
                </View>
                {clientes.data ? (
                  <LabelCaps papel="meta" className="pb-1 tracking-chip text-gold">
                    {novos.delta >= 0 ? `+${novos.delta}` : `${novos.delta}`} VS.{' '}
                    {nomeMesCaps(mesAnterior(agora))}
                  </LabelCaps>
                ) : null}
              </View>
              {clientes.error ? (
                <Text className="mt-3 font-sans text-help text-red-500">
                  {clientes.error.message}
                </Text>
              ) : null}
            </View>

            {/* 4. receita estimada */}
            <View className="mt-7 flex-row items-center justify-between">
              <Text className="font-sans text-meta text-ink/55">Receita estimada da semana</Text>
              <Titulo className="text-d-19">{formatCentavos(receita)}</Titulo>
            </View>
          </>
        )}
      </View>
    </TelaRolavel>
  );
}
