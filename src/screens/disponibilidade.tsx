/**
 * [12 Disponibilidade] — a tela, compartilhada por duas rotas:
 *   app/(profissional)/(tabs)/disponibilidade.tsx  (o profissional edita a propria)
 *   app/profissional/[id]/disponibilidade.tsx      (ADMIN via GERENCIAR do frame 17)
 *
 * Layout literal do frame 12: titulo Playfair 29 + "SEU HORÁRIO PADRÃO DE ATENDIMENTO";
 * DIAS DE ATENDIMENTO como 7 chips de 41px (`gap:9px`, borda dourada nos dias ligados,
 * ink@.12 + letra ink@.28 nos desligados); HORÁRIO DE TRABALHO como tres linhas
 * (Início / Término / Intervalo, com › a direita); BLOQUEIOS PONTUAIS como cards de
 * contorno ink@.14 com × ; botao fantasma ADICIONAR BLOQUEIO.
 *
 * MODELO — o cuidado desta tela:
 *   A API guarda a grade como `Disponibilidade[]`: uma FAIXA por item
 *   ({diaSemana 0..6, horaInicio, horaFim}), e o PUT substitui a SEMANA INTEIRA.
 *   Aqui a grade e um horario POR DIA: os dias presentes sao os ligados, cada um
 *   com o seu {inicio, fim, intervalo}.
 *     leitura : agrupa as faixas por dia; duas faixas no mesmo dia viram o almoco
 *               daquele dia.
 *     escrita : para cada dia ligado, uma faixa [inicio, fim] — ou duas, em volta
 *               do intervalo DELE. Sempre a semana inteira, do estado local.
 *
 *   Ligar ou desligar um dia mexe SO naquele dia. O modelo anterior guardava um
 *   horario unico para a semana (a menor abertura e o maior fechamento de todos
 *   os dias) e reescrevia esse par em cada dia ligado ao salvar: um sabado que
 *   fechava 13:00 virava 19:00 so por alguem desligar a quarta. Por isso o
 *   horario mora no dia, e nao na semana.
 *
 *   A tela mostra as tres linhas do design (Inicio / Termino / Intervalo) quando
 *   a semana e uniforme, que e o caso que o frame desenhou. Quando os dias
 *   divergem, lista uma linha por dia no mesmo vocabulario visual — melhor do
 *   que um resumo que esconde a diferenca. No modal de um dia so, um interruptor
 *   permite aplicar aquele horario a todos os dias ligados.
 *
 *   `horaInicio`/`horaFim` sao HORA DE PAREDE: passam por parseWallTime (aceita
 *   "09:00:00" e "09:00", devolve "09:00", que e o que a API aceita) e NUNCA por Date.
 *   Bloqueios sao INSTANTES: `instanteDe(dia, hora)` monta o ISO a partir do dia e da
 *   hora LOCAIS digitados.
 *
 * DESVIOS: o design nao desenhou picker de hora nem formulario de bloqueio; os dois sao
 * modais simples com Campo de texto (HH:mm, DD/MM/AAAA) no mesmo vocabulario. O botao
 * SALVAR GRADE aparece so quando ha mudanca — o frame nao mostra salvar porque nao
 * mostra edicao.
 */
import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import {
  useBloqueios,
  useCriarBloqueio,
  useDisponibilidade,
  useRemoverBloqueio,
  useSalvarDisponibilidade,
} from '@/api/hooks';
import type { Bloqueio, Disponibilidade } from '@/api/types';
import { Botao } from '@/components/ui/botao';
import { CabecalhoVoltar } from '@/components/ui/cabecalho';
import { Campo } from '@/components/ui/campo';
import { Carregando, EstadoErro } from '@/components/ui/estados';
import { Interruptor } from '@/components/ui/interruptor';
import { TelaRolavel } from '@/components/ui/tela';
import { LabelCaps, Titulo } from '@/components/ui/texto';
import { cn } from '@/lib/cn';
import {
  cobreODiaInteiro,
  comparaWallTime,
  DIAS_SEMANA,
  faixaValida,
  formatDiaMes,
  formatFaixaHoras,
  inicialDiaSemana,
  instanteDe,
  nomeDiaSemana,
  parseDataBr,
  parseWallTime,
  type DiaSemana,
  type WallTime,
} from '@/lib/datetime';

/** O horario de UM dia. Cada dia ligado tem o seu. */
export interface HorarioDoDia {
  inicio: WallTime;
  fim: WallTime;
  intervalo: { inicio: WallTime; fim: WallTime } | null;
}

/**
 * A grade: os dias presentes sao os dias ligados, cada um com horario proprio.
 *
 * Antes isto era `{dias: Set, inicio, fim, intervalo}` — um horario so para a
 * semana inteira. Como a leitura pegava a MENOR abertura e o MAIOR fechamento
 * de todos os dias, e a escrita reenviava esse par para todo dia ligado, um
 * sabado que fechava 13:00 virava 19:00 assim que qualquer outro dia fosse
 * ligado ou desligado. O horario precisa morar no dia.
 */
export type Grade = Partial<Record<DiaSemana, HorarioDoDia>>;

const HORARIO_PADRAO: HorarioDoDia = { inicio: '09:00', fim: '18:00', intervalo: null };

const GRADE_VAZIA: Grade = {};

function diasLigados(g: Grade): DiaSemana[] {
  return DIAS_SEMANA.filter((d) => g[d] !== undefined);
}

/** Disponibilidade[] da API -> uma entrada por dia, com o horario daquele dia. */
export function gradeDeFaixas(faixas: Disponibilidade[]): Grade {
  const porDia = new Map<DiaSemana, Disponibilidade[]>();
  for (const f of faixas) {
    if (typeof f.diaSemana !== 'number') continue;
    const dia = f.diaSemana as DiaSemana;
    porDia.set(dia, [...(porDia.get(dia) ?? []), f]);
  }

  const grade: Grade = {};
  for (const [dia, lista] of porDia) {
    const ordenada = [...lista].sort((a, b) =>
      comparaWallTime(a.horaInicio ?? '', b.horaInicio ?? '')
    );
    const primeira = ordenada[0];
    const ultima = ordenada[ordenada.length - 1];
    const inicio = parseWallTime(primeira?.horaInicio);
    const fim = parseWallTime(ultima?.horaFim);
    if (!inicio || !fim) continue;

    // Duas faixas no mesmo dia = almoco no meio. Tres ou mais o design nao
    // representa; guardamos a primeira folga e o resto vira horario corrido.
    const segunda = ordenada[1];
    const folgaInicio = parseWallTime(primeira?.horaFim);
    const folgaFim = parseWallTime(segunda?.horaInicio);
    const intervalo =
      segunda && folgaInicio && folgaFim ? { inicio: folgaInicio, fim: folgaFim } : null;

    grade[dia] = { inicio, fim, intervalo };
  }
  return grade;
}

/** A grade -> o body do PUT (a semana inteira, cada dia com o horario dele). */
export function faixasDaGrade(
  g: Grade
): { diaSemana: number; horaInicio: string; horaFim: string }[] {
  const out: { diaSemana: number; horaInicio: string; horaFim: string }[] = [];
  for (const dia of diasLigados(g)) {
    const h = g[dia];
    if (!h) continue;
    if (h.intervalo) {
      out.push({ diaSemana: dia, horaInicio: h.inicio, horaFim: h.intervalo.inicio });
      out.push({ diaSemana: dia, horaInicio: h.intervalo.fim, horaFim: h.fim });
    } else {
      out.push({ diaSemana: dia, horaInicio: h.inicio, horaFim: h.fim });
    }
  }
  return out;
}

function gradesIguais(a: Grade, b: Grade): boolean {
  return JSON.stringify(faixasDaGrade(a)) === JSON.stringify(faixasDaGrade(b));
}

function horariosIguais(a: HorarioDoDia, b: HorarioDoDia): boolean {
  return (
    a.inicio === b.inicio &&
    a.fim === b.fim &&
    a.intervalo?.inicio === b.intervalo?.inicio &&
    a.intervalo?.fim === b.intervalo?.fim
  );
}

/**
 * O horario que vale para a semana toda, ou `null` quando os dias divergem.
 *
 * E o que decide a tela: com semana uniforme ela mostra as tres linhas do
 * design (Inicio / Termino / Intervalo); com horario diferente por dia, uma
 * linha por dia, para que nenhum deles fique escondido atras de um resumo.
 */
export function horarioUniforme(g: Grade): HorarioDoDia | null {
  const dias = diasLigados(g);
  const primeiro = dias[0] !== undefined ? g[dias[0]] : undefined;
  if (!primeiro) return null;
  return dias.every((d) => {
    const h = g[d];
    return h !== undefined && horariosIguais(h, primeiro);
  })
    ? primeiro
    : null;
}

/** Horario sugerido ao LIGAR um dia novo: o da semana, ou o padrao do design. */
function horarioSugerido(g: Grade): HorarioDoDia {
  return horarioUniforme(g) ?? g[diasLigados(g)[0] as DiaSemana] ?? HORARIO_PADRAO;
}

function problemaDoHorario(h: HorarioDoDia): string | null {
  if (!faixaValida(h.inicio, h.fim)) return 'O início precisa vir antes do término.';
  if (h.intervalo) {
    if (!faixaValida(h.intervalo.inicio, h.intervalo.fim))
      return 'O intervalo precisa ter início antes do fim.';
    if (!faixaValida(h.inicio, h.intervalo.inicio) || !faixaValida(h.intervalo.fim, h.fim)) {
      return 'O intervalo precisa caber dentro do horário de trabalho.';
    }
  }
  return null;
}

/** Valida a grade antes do PUT (a API responderia 422 nos mesmos casos). */
function problemaDaGrade(g: Grade): string | null {
  const dias = diasLigados(g);
  if (dias.length === 0) return null; // lista vazia zera a agenda: permitido
  for (const dia of dias) {
    const h = g[dia];
    if (!h) continue;
    const problema = problemaDoHorario(h);
    if (problema) return `${nomeDiaSemana(dia)}: ${problema}`;
  }
  return null;
}

/** "09:00 — 19:00" ou, com almoco, "09:00 — 12:30 · 13:30 — 19:00". */
function resumoDoHorario(h: HorarioDoDia): string {
  if (!h.intervalo) return `${h.inicio} — ${h.fim}`;
  return `${h.inicio} — ${h.intervalo.inicio} · ${h.intervalo.fim} — ${h.fim}`;
}

function LinhaHorario({
  rotulo,
  valor,
  aoTocar,
}: {
  rotulo: string;
  valor: string;
  aoTocar: () => void;
}) {
  return (
    <Pressable
      onPress={aoTocar}
      accessibilityRole="button"
      accessibilityLabel={`${rotulo}: ${valor}`}
      className="flex-row items-center justify-between border-b border-divider py-[19px]"
      style={({ pressed }) => (pressed ? { opacity: 0.6 } : null)}
    >
      <Text className="font-sans text-body text-ink/60">{rotulo}</Text>
      <View className="flex-row items-center gap-3">
        <Text className="font-sans text-row-lg text-ink">{valor}</Text>
        <Text className="font-sans text-row text-ink/35">›</Text>
      </View>
    </Pressable>
  );
}

function descricaoDoBloqueio(b: Bloqueio): string {
  const motivo = b.motivo ? ` · ${b.motivo.toUpperCase()}` : '';
  if (b.inicio && b.fim && cobreODiaInteiro(b.inicio, b.fim)) return `DIA INTEIRO${motivo}`;
  return `${formatFaixaHoras(b.inicio, b.fim)}${motivo}`;
}

export function TelaDisponibilidade({
  profissionalId,
  comCabecalhoVoltar = false,
  insetInferior = false,
}: {
  profissionalId: string | undefined;
  /** Na rota empilhada do ADMIN o cabecalho tem seta de voltar. */
  comCabecalhoVoltar?: boolean;
  insetInferior?: boolean;
}) {
  const disponibilidade = useDisponibilidade(profissionalId);
  const bloqueios = useBloqueios(profissionalId);
  const salvar = useSalvarDisponibilidade(profissionalId);
  const criarBloqueio = useCriarBloqueio(profissionalId);
  const removerBloqueio = useRemoverBloqueio(profissionalId);

  const gradeSalva = useMemo(
    () => gradeDeFaixas(disponibilidade.data ?? []),
    [disponibilidade.data]
  );
  const [grade, setGrade] = useState<Grade>(GRADE_VAZIA);
  const [editando, setEditando] = useState(false);

  // sincroniza o estado local com o servidor enquanto o usuario nao mexeu
  useEffect(() => {
    if (!editando) setGrade(gradeSalva);
  }, [gradeSalva, editando]);

  const mudou = !gradesIguais(grade, gradeSalva);
  const problema = problemaDaGrade(grade);

  const ligados = diasLigados(grade);
  const uniforme = horarioUniforme(grade);

  // --- modal de horarios ---
  const [modalHorario, setModalHorario] = useState(false);
  /** `null` = editando a semana inteira; um dia = editando so aquele dia. */
  const [diaEmEdicao, setDiaEmEdicao] = useState<DiaSemana | null>(null);
  const [aplicarATodos, setAplicarATodos] = useState(false);
  const [fInicio, setFInicio] = useState('');
  const [fFim, setFFim] = useState('');
  const [fIntInicio, setFIntInicio] = useState('');
  const [fIntFim, setFIntFim] = useState('');
  const [erroHorario, setErroHorario] = useState<string | null>(null);

  function abrirHorario(dia: DiaSemana | null) {
    const base = (dia !== null ? grade[dia] : uniforme) ?? horarioSugerido(grade);
    setDiaEmEdicao(dia);
    // Editando a semana inteira, o alcance ja e todo mundo. Editando um dia so,
    // comeca restrito a ele -- aplicar aos outros tem de ser escolha explicita.
    setAplicarATodos(dia === null);
    setFInicio(base.inicio);
    setFFim(base.fim);
    setFIntInicio(base.intervalo?.inicio ?? '');
    setFIntFim(base.intervalo?.fim ?? '');
    setErroHorario(null);
    setModalHorario(true);
  }

  function aplicarHorario() {
    const inicio = parseWallTime(fInicio);
    const fim = parseWallTime(fFim);
    if (!inicio || !fim) return setErroHorario('Use o formato HH:mm, por exemplo 09:00.');

    const temIntervalo = fIntInicio.trim() || fIntFim.trim();
    let intervalo: HorarioDoDia['intervalo'] = null;
    if (temIntervalo) {
      const ii = parseWallTime(fIntInicio);
      const ifim = parseWallTime(fIntFim);
      if (!ii || !ifim)
        return setErroHorario('Intervalo: use HH:mm nos dois campos, ou deixe os dois vazios.');
      intervalo = { inicio: ii, fim: ifim };
    }

    const novo: HorarioDoDia = { inicio, fim, intervalo };
    const p = problemaDoHorario(novo);
    if (p) return setErroHorario(p);

    const alvos = aplicarATodos || diaEmEdicao === null ? ligados : [diaEmEdicao];
    setEditando(true);
    setGrade((g) => {
      const nova: Grade = { ...g };
      for (const dia of alvos) nova[dia] = novo;
      return nova;
    });
    setModalHorario(false);
  }

  function alternarDia(dia: DiaSemana) {
    setEditando(true);
    setGrade((g) => {
      const nova: Grade = { ...g };
      // Desligar apaga so o dia tocado; ligar da a ele um horario proprio.
      // Nenhum outro dia e reescrito: era exatamente isso que apagava o sabado.
      if (nova[dia]) delete nova[dia];
      else nova[dia] = horarioSugerido(g);
      return nova;
    });
  }

  function salvarGrade() {
    if (problema) return;
    salvar.mutate(faixasDaGrade(grade), { onSuccess: () => setEditando(false) });
  }

  // --- modal de bloqueio ---
  const [modalBloqueio, setModalBloqueio] = useState(false);
  const [bData, setBData] = useState('');
  const [bDiaInteiro, setBDiaInteiro] = useState(true);
  const [bInicio, setBInicio] = useState('');
  const [bFim, setBFim] = useState('');
  const [bMotivo, setBMotivo] = useState('');
  const [erroBloqueio, setErroBloqueio] = useState<string | null>(null);

  function abrirBloqueio() {
    setBData('');
    setBDiaInteiro(true);
    setBInicio('');
    setBFim('');
    setBMotivo('');
    setErroBloqueio(null);
    criarBloqueio.reset();
    setModalBloqueio(true);
  }

  function enviarBloqueio() {
    const dia = parseDataBr(bData);
    if (!dia) return setErroBloqueio('Data inválida. Use DD/MM/AAAA.');
    const hi = bDiaInteiro ? '00:00' : parseWallTime(bInicio);
    const hf = bDiaInteiro ? '23:59' : parseWallTime(bFim);
    if (!hi || !hf) return setErroBloqueio('Horários no formato HH:mm.');
    if (!faixaValida(hi, hf)) return setErroBloqueio('O fim precisa vir depois do início.');
    const inicio = instanteDe(dia, hi);
    const fim = instanteDe(dia, hf);
    if (!inicio || !fim) return setErroBloqueio('Não foi possível montar o bloqueio.');
    setErroBloqueio(null);
    criarBloqueio.mutate(
      { inicio, fim, ...(bMotivo.trim() ? { motivo: bMotivo.trim().slice(0, 240) } : {}) },
      { onSuccess: () => setModalBloqueio(false) }
    );
  }

  function confirmarRemocao(b: Bloqueio) {
    if (!b.id) return;
    Alert.alert('Liberar este dia?', `${formatDiaMes(b.inicio)} · ${descricaoDoBloqueio(b)}`, [
      { text: 'Voltar', style: 'cancel' },
      { text: 'Liberar', style: 'destructive', onPress: () => removerBloqueio.mutate(b.id!) },
    ]);
  }

  const carregando = disponibilidade.isLoading || bloqueios.isLoading;
  const erro = disponibilidade.error ?? bloqueios.error;
  const refetch = () => {
    void disponibilidade.refetch();
    void bloqueios.refetch();
  };

  return (
    <TelaRolavel
      insetInferior={insetInferior}
      refreshControl={
        <RefreshControl refreshing={disponibilidade.isRefetching} onRefresh={refetch} />
      }
    >
      {comCabecalhoVoltar ? <CabecalhoVoltar passo="EQUIPE" /> : null}
      <View className={comCabecalhoVoltar ? 'pt-[30px]' : 'pt-10'}>
        <Titulo className="text-d-29">Disponibilidade</Titulo>
        <LabelCaps papel="meta" className="mt-[14px]">
          {comCabecalhoVoltar
            ? 'HORÁRIO PADRÃO DE ATENDIMENTO'
            : 'SEU HORÁRIO PADRÃO DE ATENDIMENTO'}
        </LabelCaps>

        {!profissionalId ? (
          <Text className="mt-10 font-sans text-help text-ink/42">
            Sua conta ainda não tem ficha de profissional. Peça ao administrador para incluir você
            na equipe.
          </Text>
        ) : carregando ? (
          <Carregando className="mt-10" />
        ) : erro ? (
          <EstadoErro className="mt-10" erro={erro} aoTentarDeNovo={refetch} />
        ) : (
          <>
            <LabelCaps papel="secao" className="mt-10">
              DIAS DE ATENDIMENTO
            </LabelCaps>
            <View className="mt-4 flex-row gap-[9px]">
              {DIAS_SEMANA.map((dia) => {
                const ligado = grade[dia] !== undefined;
                return (
                  <Pressable
                    key={dia}
                    onPress={() => alternarDia(dia)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: ligado }}
                    accessibilityLabel={nomeDiaSemana(dia)}
                    className={cn(
                      'aspect-square flex-1 items-center justify-center rounded-token border',
                      ligado ? 'border-gold-border' : 'border-divider-card'
                    )}
                  >
                    <Text
                      className={cn(
                        'font-sans-semibold text-caps-md',
                        ligado ? 'text-ink' : 'text-ink/28'
                      )}
                    >
                      {inicialDiaSemana(dia)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <LabelCaps papel="secao" className="mt-[42px]">
              HORÁRIO DE TRABALHO
            </LabelCaps>
            {ligados.length === 0 ? (
              <Text className="mt-4 font-sans text-help text-ink/42">
                Ligue ao menos um dia para definir o horário.
              </Text>
            ) : uniforme ? (
              // O caso do design: a semana inteira no mesmo horario, tres linhas.
              <View className="mt-[6px]">
                <LinhaHorario
                  rotulo="Início"
                  valor={uniforme.inicio}
                  aoTocar={() => abrirHorario(null)}
                />
                <LinhaHorario
                  rotulo="Término"
                  valor={uniforme.fim}
                  aoTocar={() => abrirHorario(null)}
                />
                <LinhaHorario
                  rotulo="Intervalo"
                  valor={
                    uniforme.intervalo
                      ? `${uniforme.intervalo.inicio} — ${uniforme.intervalo.fim}`
                      : 'Sem intervalo'
                  }
                  aoTocar={() => abrirHorario(null)}
                />
              </View>
            ) : (
              // Horario diferente por dia: uma linha por dia, no mesmo vocabulario
              // visual. Nenhum dia fica escondido atras de um resumo que mente.
              <View className="mt-[6px]">
                {ligados.map((dia) => {
                  const h = grade[dia];
                  return h ? (
                    <LinhaHorario
                      key={dia}
                      rotulo={nomeDiaSemana(dia)}
                      valor={resumoDoHorario(h)}
                      aoTocar={() => abrirHorario(dia)}
                    />
                  ) : null;
                })}
              </View>
            )}

            {problema ? (
              <Text className="mt-3 font-sans text-help text-red-500">{problema}</Text>
            ) : null}
            {salvar.error ? (
              <Text className="mt-3 font-sans text-help text-red-500">{salvar.error.message}</Text>
            ) : null}
            {mudou ? (
              <Botao
                className="mt-5"
                titulo={ligados.length === 0 ? 'ZERAR A AGENDA' : 'SALVAR GRADE'}
                carregando={salvar.isPending}
                disabled={!!problema}
                onPress={salvarGrade}
              />
            ) : null}

            <LabelCaps papel="secao" className="mt-[42px]">
              BLOQUEIOS PONTUAIS
            </LabelCaps>
            {(bloqueios.data ?? []).length === 0 ? (
              <Text className="mt-4 font-sans text-help text-ink/42">Nenhum bloqueio marcado.</Text>
            ) : (
              (bloqueios.data ?? []).map((b, i) => (
                <View
                  key={b.id}
                  className={cn(
                    'flex-row items-center justify-between rounded-token border border-card-border px-5 py-[18px]',
                    i === 0 ? 'mt-4' : 'mt-[10px]'
                  )}
                >
                  <View className="flex-1 gap-[7px] pr-3">
                    <Text className="font-sans text-row text-ink">{formatDiaMes(b.inicio)}</Text>
                    <LabelCaps papel="micro" className="text-text-muted" numberOfLines={2}>
                      {descricaoDoBloqueio(b)}
                    </LabelCaps>
                  </View>
                  <Pressable
                    onPress={() => confirmarRemocao(b)}
                    hitSlop={14}
                    accessibilityRole="button"
                    accessibilityLabel="Liberar bloqueio"
                    disabled={removerBloqueio.isPending}
                  >
                    <Text className="font-sans text-icon-sm text-text-dim">×</Text>
                  </Pressable>
                </View>
              ))
            )}
            {removerBloqueio.error ? (
              <Text className="mt-3 font-sans text-help text-red-500">
                {removerBloqueio.error.message}
              </Text>
            ) : null}

            <Botao
              className="mt-[18px]"
              variante="fantasma"
              titulo="ADICIONAR BLOQUEIO"
              onPress={abrirBloqueio}
            />
          </>
        )}
      </View>

      {/* ---- modal: horario de trabalho ---- */}
      <Modal
        visible={modalHorario}
        transparent
        animationType="fade"
        onRequestClose={() => setModalHorario(false)}
      >
        <View className="bg-canvas/95 flex-1 justify-end">
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="px-screen-x pb-10 pt-8"
          >
            <LabelCaps papel="secao">
              {diaEmEdicao === null
                ? 'HORÁRIO DE TRABALHO'
                : `HORÁRIO DE ${nomeDiaSemana(diaEmEdicao).toUpperCase()}`}
            </LabelCaps>
            <Titulo className="mt-3 text-d-23">
              {diaEmEdicao === null
                ? 'Hora de parede do ateliê'
                : `${nomeDiaSemana(diaEmEdicao)} no ateliê`}
            </Titulo>
            {diaEmEdicao !== null && ligados.length > 1 ? (
              <View className="mt-5 flex-row items-center justify-between border-b border-divider py-[19px]">
                <Text className="font-sans text-body-lg text-text-body">
                  Aplicar a todos os dias
                </Text>
                <Interruptor
                  rotulo="Aplicar a todos os dias"
                  ligado={aplicarATodos}
                  aoMudar={setAplicarATodos}
                />
              </View>
            ) : null}
            <Campo
              className="mt-6"
              rotulo="INÍCIO"
              value={fInicio}
              onChangeText={setFInicio}
              placeholder="09:00"
              keyboardType="numbers-and-punctuation"
            />
            <Campo
              className="mt-[22px]"
              rotulo="TÉRMINO"
              value={fFim}
              onChangeText={setFFim}
              placeholder="19:00"
              keyboardType="numbers-and-punctuation"
            />
            <Campo
              className="mt-[22px]"
              rotulo="INTERVALO · INÍCIO"
              value={fIntInicio}
              onChangeText={setFIntInicio}
              placeholder="12:30 (opcional)"
              keyboardType="numbers-and-punctuation"
            />
            <Campo
              className="mt-[22px]"
              rotulo="INTERVALO · FIM"
              value={fIntFim}
              onChangeText={setFIntFim}
              placeholder="13:30 (opcional)"
              keyboardType="numbers-and-punctuation"
            />
            {erroHorario ? (
              <Text className="mt-4 font-sans text-help text-red-500">{erroHorario}</Text>
            ) : null}
            <Botao className="mt-8" titulo="APLICAR" onPress={aplicarHorario} />
            <Botao
              className="mt-3"
              variante="fantasma"
              titulo="VOLTAR"
              onPress={() => setModalHorario(false)}
            />
          </ScrollView>
        </View>
      </Modal>

      {/* ---- modal: novo bloqueio ---- */}
      <Modal
        visible={modalBloqueio}
        transparent
        animationType="fade"
        onRequestClose={() => setModalBloqueio(false)}
      >
        <View className="bg-canvas/95 flex-1 justify-end">
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="px-screen-x pb-10 pt-8"
          >
            <LabelCaps papel="secao">BLOQUEIO PONTUAL</LabelCaps>
            <Titulo className="mt-3 text-d-23">Uma janela em que você não atende</Titulo>
            <Campo
              className="mt-6"
              rotulo="DATA"
              value={bData}
              onChangeText={setBData}
              placeholder="DD/MM/AAAA"
              keyboardType="numbers-and-punctuation"
            />
            <View className="mt-[22px] flex-row items-center justify-between border-b border-divider py-[19px]">
              <Text className="font-sans text-body-lg text-text-body">Dia inteiro</Text>
              <Interruptor rotulo="Dia inteiro" ligado={bDiaInteiro} aoMudar={setBDiaInteiro} />
            </View>
            {!bDiaInteiro ? (
              <>
                <Campo
                  className="mt-[22px]"
                  rotulo="DAS"
                  value={bInicio}
                  onChangeText={setBInicio}
                  placeholder="16:00"
                  keyboardType="numbers-and-punctuation"
                />
                <Campo
                  className="mt-[22px]"
                  rotulo="ATÉ"
                  value={bFim}
                  onChangeText={setBFim}
                  placeholder="19:00"
                  keyboardType="numbers-and-punctuation"
                />
              </>
            ) : null}
            <Campo
              className="mt-[22px]"
              rotulo="MOTIVO"
              value={bMotivo}
              onChangeText={setBMotivo}
              placeholder="Congresso de visagismo (opcional)"
              maxLength={240}
              erro={criarBloqueio.error?.violacaoDe('motivo')}
            />
            {erroBloqueio ? (
              <Text className="mt-4 font-sans text-help text-red-500">{erroBloqueio}</Text>
            ) : null}
            {criarBloqueio.error && !criarBloqueio.error.temViolacoes ? (
              <Text className="mt-4 font-sans text-help text-red-500">
                {criarBloqueio.error.message}
              </Text>
            ) : null}
            <Botao
              className="mt-8"
              titulo="BLOQUEAR"
              carregando={criarBloqueio.isPending}
              onPress={enviarBloqueio}
            />
            <Botao
              className="mt-3"
              variante="fantasma"
              titulo="VOLTAR"
              onPress={() => setModalBloqueio(false)}
            />
          </ScrollView>
        </View>
      </Modal>
    </TelaRolavel>
  );
}
