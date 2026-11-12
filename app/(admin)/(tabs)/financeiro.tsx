/**
 * Financeiro (so ADMIN): quanto entrou, quanto esta marcado e o que mais vende, por dia,
 * semana, mes, semestre ou ano, com o grafico e a comparacao com o periodo anterior.
 *
 * Tudo vem da agenda (GET /relatorios/financeiro): o que teve baixa como Atendido conta
 * como faturado, pelo preco do dia em que foi marcado; o que esta marcado e ainda nao teve
 * baixa e "a receber". Nao ha lancamento a parte para manter.
 */
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useFinanceiro } from '@/api/hooks';
import type { FatiaFinanceira, PontoFinanceiro, TotaisFinanceiros } from '@/api/types';
import { BotaoAtelie, TituloSecao } from '@/components/atelie/base';
import { GraficoDeBarras, type Barra } from '@/components/financeiro/GraficoDeBarras';
import { CabecalhoVoltar } from '@/components/ui/cabecalho';
import { Carregando, EstadoErro } from '@/components/ui/estados';
import { TelaRolavel } from '@/components/ui/tela';
import { cn } from '@/lib/cn';
import { hojeCalendarDate, parseCalendarDate, type CalendarDate } from '@/lib/datetime';
import { formatCentavos } from '@/lib/money';
import { andarPeriodo, periodoDe, variacao, type TipoPeriodo } from '@/lib/periodo';
import { useLayoutLargo } from '@/lib/responsivo';
import { useTema } from '@/theme/theme-context';

const TIPOS: { chave: TipoPeriodo; rotulo: string }[] = [
  { chave: 'dia', rotulo: 'Dia' },
  { chave: 'semana', rotulo: 'Semana' },
  { chave: 'mes', rotulo: 'Mês' },
  { chave: 'semestre', rotulo: 'Semestre' },
  { chave: 'ano', rotulo: 'Ano' },
];
const DIAS_DA_SEMANA = ['', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** O rotulo de cada barra: dia do mes, semana ("9/11") ou mes ("nov"). */
function barras(serie: PontoFinanceiro[] | undefined, agrupamento: string | undefined): Barra[] {
  return (serie ?? []).map((p) => {
    const d = parseCalendarDate(p.inicio ?? '');
    const dia = d?.getDate() ?? 0;
    const mes = d?.getMonth() ?? 0;
    const rotulo =
      agrupamento === 'MES'
        ? MESES[mes]!
        : agrupamento === 'SEMANA'
          ? `${dia}/${mes + 1}`
          : String(dia);
    const descricao =
      agrupamento === 'MES'
        ? `${MESES[mes]} de ${d?.getFullYear()}`
        : agrupamento === 'SEMANA'
          ? `semana de ${dia}/${mes + 1}`
          : `dia ${dia}/${mes + 1}`;
    return {
      rotulo,
      descricao,
      faturado: p.faturadoCentavos ?? 0,
      aReceber: p.aReceberCentavos ?? 0,
      atendimentos: p.atendimentos ?? 0,
    };
  });
}

function Comparacao({ atual, anterior }: { atual: number; anterior: number }) {
  const v = variacao(atual, anterior);
  if (v === null)
    return <Text className="font-sans text-ui-sm text-texto-3">sem período anterior</Text>;
  const sobe = v >= 0;
  return (
    <Text className={cn('font-sans-medium text-ui-sm', sobe ? 'text-latao' : 'text-cadeira')}>
      {sobe ? '▲' : '▼'} {Math.abs(v)}% vs. o anterior
    </Text>
  );
}

function Numero({
  valor,
  legenda,
  detalhe,
  destaque,
  largura,
  miudo,
}: {
  valor: string;
  legenda: string;
  detalhe?: React.ReactNode;
  destaque?: boolean;
  largura: string;
  /** meio cartao no celular: numero menor para "R$ 12.345,00" caber inteiro */
  miudo?: boolean;
}) {
  const { tema } = useTema();
  return (
    <View className="p-1" style={{ width: largura as `${number}%` }}>
      <View
        className={cn(
          'h-full rounded-[3px]',
          miudo ? 'p-4' : 'p-5',
          // no escuro o preto some no fundo: vira couro com fio de latao
          destaque
            ? tema === 'dark'
              ? 'border border-latao bg-superficie'
              : 'bg-[#0c0c0c]'
            : 'bg-superficie'
        )}
      >
        <Text
          className={cn(
            'font-display',
            miudo ? 'text-[22px] leading-[28px]' : 'text-[30px] leading-[36px]',
            destaque ? 'text-marfim' : 'text-texto'
          )}
        >
          {valor}
        </Text>
        <Text
          className={cn('mt-1 font-sans text-ui-sm', destaque ? 'text-marfim/75' : 'text-texto-3')}
        >
          {legenda}
        </Text>
        {detalhe ? <View className="mt-2">{detalhe}</View> : null}
      </View>
    </View>
  );
}

function Fatias({
  titulo,
  fatias,
  rotulo,
}: {
  titulo: string;
  fatias: FatiaFinanceira[];
  rotulo?: (n: string) => string;
}) {
  const maximo = Math.max(1, ...fatias.map((f) => f.faturadoCentavos ?? 0));
  const comAlgo = fatias.filter((f) => (f.atendimentos ?? 0) > 0);
  return (
    <View>
      <TituloSecao className="mt-12">{titulo}</TituloSecao>
      {comAlgo.length === 0 ? (
        <Text className="mt-4 font-sans text-ui text-texto-3">
          Nenhum atendimento com baixa no período.
        </Text>
      ) : (
        <View className="mt-4 gap-4">
          {[...comAlgo]
            .sort((x, y) => (y.faturadoCentavos ?? 0) - (x.faturadoCentavos ?? 0))
            .map((f) => (
              <View key={f.nome}>
                <View className="flex-row items-baseline justify-between gap-3">
                  <Text className="flex-1 font-sans-medium text-ui text-texto" numberOfLines={1}>
                    {rotulo ? rotulo(f.nome ?? '') : f.nome}
                  </Text>
                  <Text className="font-sans text-ui-sm text-texto-3">
                    {f.atendimentos} {f.atendimentos === 1 ? 'atendimento' : 'atendimentos'}
                  </Text>
                  <Text className="w-24 text-right font-sans-semibold text-ui text-texto">
                    {formatCentavos(f.faturadoCentavos)}
                  </Text>
                </View>
                <View className="mt-2 h-[6px] rounded-full bg-borda">
                  <View
                    className="h-full rounded-full bg-latao"
                    style={{ width: `${((f.faturadoCentavos ?? 0) / maximo) * 100}%` }}
                  />
                </View>
              </View>
            ))}
        </View>
      )}
    </View>
  );
}

export default function Financeiro() {
  const largo = useLayoutLargo();
  const [tipo, setTipo] = useState<TipoPeriodo>('mes');
  const [referencia, setReferencia] = useState<CalendarDate>(() => hojeCalendarDate());
  const periodo = useMemo(() => periodoDe(tipo, referencia), [tipo, referencia]);
  // semestre e ano: por mes; mes: por dia; semana e dia: por dia
  const agrupar = tipo === 'semestre' || tipo === 'ano' ? 'MES' : 'DIA';
  const relatorio = useFinanceiro(periodo.de, periodo.ate, agrupar);
  const r = relatorio.data;
  const t: TotaisFinanceiros = r?.totais ?? {};
  const a: TotaisFinanceiros = r?.anterior ?? {};
  const hoje = hojeCalendarDate();
  const atual = periodo.de <= hoje && hoje <= periodo.ate;
  // no celular o faturado ocupa a linha toda (e o numero que importa); o resto vai em pares
  const largura = largo ? '33.333%' : '50%';
  const miudo = !largo;

  return (
    <TelaRolavel>
      {largo ? null : <CabecalhoVoltar />}
      <Text
        accessibilityRole="header"
        className={cn('font-display text-ds-38 text-texto', largo ? 'mt-10' : 'mt-8')}
      >
        Financeiro
      </Text>
      <Text className="mt-2 font-sans text-ui text-texto-2">
        Tudo sai da agenda: o que teve baixa como Atendido conta como faturado.
      </Text>

      <View className="mt-7 flex-row gap-[6px]" accessibilityRole="radiogroup">
        {TIPOS.map((p) => {
          const on = tipo === p.chave;
          return (
            <Pressable
              key={p.chave}
              onPress={() => setTipo(p.chave)}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              className={cn(
                'flex-1 items-center rounded-full border py-[10px]',
                on ? 'border-latao bg-latao' : 'border-borda'
              )}
            >
              <Text
                className={cn(
                  'font-sans-semibold',
                  // cinco botoes numa linha so: no celular a letra desce um ponto para "Semestre" caber
                  largo ? 'text-ui-sm' : 'text-[12px]',
                  on ? 'text-fundo' : 'text-texto-2'
                )}
              >
                {p.rotulo}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="mt-5 flex-row items-center justify-between gap-3">
        <Pressable
          onPress={() => setReferencia(andarPeriodo(tipo, referencia, -1))}
          accessibilityRole="button"
          accessibilityLabel="Período anterior"
          className="h-11 w-11 items-center justify-center rounded-full border border-borda"
        >
          <Text className="font-sans text-ds-24 text-texto-2">‹</Text>
        </Pressable>
        <View className="flex-1 items-center">
          <Text className="font-display text-ds-24 text-texto" accessibilityLiveRegion="polite">
            {tipo === 'dia' && periodo.de === hoje ? 'Hoje' : periodo.rotulo}
          </Text>
          {atual ? null : (
            <BotaoAtelie
              variante="texto"
              titulo="Voltar para o atual"
              onPress={() => setReferencia(hoje)}
            />
          )}
        </View>
        <Pressable
          onPress={() => setReferencia(andarPeriodo(tipo, referencia, 1))}
          accessibilityRole="button"
          accessibilityLabel="Próximo período"
          className="h-11 w-11 items-center justify-center rounded-full border border-borda"
        >
          <Text className="font-sans text-ds-24 text-texto-2">›</Text>
        </Pressable>
      </View>

      {relatorio.isLoading ? (
        <Carregando className="mt-10" />
      ) : relatorio.error ? (
        <EstadoErro
          className="mt-10"
          erro={relatorio.error}
          aoTentarDeNovo={() => void relatorio.refetch()}
        />
      ) : (
        <View style={relatorio.isFetching ? { opacity: 0.6 } : null}>
          <View className="mt-6 flex-row flex-wrap" style={{ marginHorizontal: -4 }}>
            <Numero
              largura={largo ? largura : '100%'}
              destaque
              valor={formatCentavos(t.faturadoCentavos ?? 0)}
              legenda="faturado"
              detalhe={
                <Comparacao atual={t.faturadoCentavos ?? 0} anterior={a.faturadoCentavos ?? 0} />
              }
            />
            <Numero
              largura={largura}
              miudo={miudo}
              valor={formatCentavos(t.aReceberCentavos ?? 0)}
              legenda={`a receber, ${t.agendados ?? 0} ${t.agendados === 1 ? 'horário marcado' : 'horários marcados'}`}
            />
            <Numero
              largura={largura}
              miudo={miudo}
              valor={String(t.atendimentos ?? 0)}
              legenda="atendimentos com baixa"
              detalhe={<Comparacao atual={t.atendimentos ?? 0} anterior={a.atendimentos ?? 0} />}
            />
            <Numero
              largura={largura}
              miudo={miudo}
              valor={formatCentavos(t.ticketMedioCentavos ?? 0)}
              legenda="por atendimento, em média"
            />
            <Numero
              largura={largura}
              miudo={miudo}
              valor={String(t.clientesNovos ?? 0)}
              legenda={`clientes novos, de ${t.clientesAtendidos ?? 0} atendidos`}
            />
            <Numero
              largura={largura}
              miudo={miudo}
              valor={`${t.faltas ?? 0}`}
              legenda={`faltas (${t.taxaDeFaltas ?? 0}%), ${t.cancelados ?? 0} ${t.cancelados === 1 ? 'cancelado' : 'cancelados'}`}
            />
          </View>

          {tipo === 'dia' ? null : (
            <>
              <TituloSecao className="mt-12">
                {agrupar === 'MES' ? 'Mês a mês' : 'Dia a dia'}
              </TituloSecao>
              <View className="mt-6">
                <GraficoDeBarras barras={barras(r?.serie, r?.agrupamento)} />
              </View>
            </>
          )}

          <Fatias titulo="O que mais vende" fatias={r?.porServico ?? []} />
          {tipo === 'dia' ? null : (
            <Fatias
              titulo="Melhores dias da semana"
              fatias={r?.porDiaDaSemana ?? []}
              rotulo={(n) => DIAS_DA_SEMANA[Number(n)] ?? n}
            />
          )}
          {(r?.porProfissional ?? []).length > 1 ? (
            <Fatias titulo="Por profissional" fatias={r?.porProfissional ?? []} />
          ) : null}

          {(t.agendados ?? 0) > 0 && periodo.de <= hoje ? (
            <Text className="mt-10 font-sans text-ui-sm text-texto-3">
              Horário que já passou e ainda está marcado conta como a receber. Dê baixa na Agenda,
              em Atendido ou Faltou, para o número fechar.
            </Text>
          ) : null}
        </View>
      )}
    </TelaRolavel>
  );
}
