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
 *   O design simplifica em "dias + inicio + termino + intervalo". A tela traduz:
 *     leitura : dias = os diaSemana presentes; inicio = a menor horaInicio; termino = a
 *               maior horaFim; intervalo = o vao entre a 1a e a 2a faixa de um dia que
 *               tenha duas.
 *     escrita : para cada dia ligado, uma faixa [inicio, termino] — ou duas, em volta do
 *               intervalo. Sempre a grade INTEIRA, a partir do estado local.
 *   Grades com horario diferente por dia nao cabem nesse modelo: o design nao as
 *   representa. Registrado no relatorio.
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

interface Grade {
  dias: Set<DiaSemana>;
  inicio: WallTime;
  fim: WallTime;
  intervalo: { inicio: WallTime; fim: WallTime } | null;
}

const GRADE_VAZIA: Grade = { dias: new Set(), inicio: '09:00', fim: '18:00', intervalo: null };

/** Disponibilidade[] da API -> o modelo simplificado do design. */
function gradeDeFaixas(faixas: Disponibilidade[]): Grade {
  if (faixas.length === 0) return GRADE_VAZIA;
  const dias = new Set<DiaSemana>();
  const inicios: string[] = [];
  const fins: string[] = [];
  let intervalo: Grade['intervalo'] = null;

  const porDia = new Map<number, Disponibilidade[]>();
  for (const f of faixas) {
    if (typeof f.diaSemana !== 'number') continue;
    porDia.set(f.diaSemana, [...(porDia.get(f.diaSemana) ?? []), f]);
  }
  for (const [dia, lista] of porDia) {
    dias.add(dia as DiaSemana);
    const ordenada = [...lista].sort((a, b) =>
      comparaWallTime(a.horaInicio ?? '', b.horaInicio ?? '')
    );
    const primeira = ordenada[0];
    const ultima = ordenada[ordenada.length - 1];
    if (primeira?.horaInicio) inicios.push(parseWallTime(primeira.horaInicio) ?? '');
    if (ultima?.horaFim) fins.push(parseWallTime(ultima.horaFim) ?? '');
    const segunda = ordenada[1];
    if (!intervalo && primeira?.horaFim && segunda?.horaInicio) {
      intervalo = {
        inicio: parseWallTime(primeira.horaFim) ?? '',
        fim: parseWallTime(segunda.horaInicio) ?? '',
      };
    }
  }
  inicios.sort(comparaWallTime);
  fins.sort(comparaWallTime);
  return {
    dias,
    inicio: inicios[0] || GRADE_VAZIA.inicio,
    fim: fins[fins.length - 1] || GRADE_VAZIA.fim,
    intervalo,
  };
}

/** O modelo do design -> o body do PUT (a semana inteira). */
function faixasDaGrade(g: Grade): { diaSemana: number; horaInicio: string; horaFim: string }[] {
  const out: { diaSemana: number; horaInicio: string; horaFim: string }[] = [];
  for (const dia of [...g.dias].sort()) {
    if (g.intervalo) {
      out.push({ diaSemana: dia, horaInicio: g.inicio, horaFim: g.intervalo.inicio });
      out.push({ diaSemana: dia, horaInicio: g.intervalo.fim, horaFim: g.fim });
    } else {
      out.push({ diaSemana: dia, horaInicio: g.inicio, horaFim: g.fim });
    }
  }
  return out;
}

function gradesIguais(a: Grade, b: Grade): boolean {
  return JSON.stringify(faixasDaGrade(a)) === JSON.stringify(faixasDaGrade(b));
}

/** Valida a grade antes do PUT (a API responderia 422 nos mesmos casos). */
function problemaDaGrade(g: Grade): string | null {
  if (g.dias.size === 0) return null; // lista vazia zera a agenda: permitido
  if (!faixaValida(g.inicio, g.fim)) return 'O início precisa vir antes do término.';
  if (g.intervalo) {
    if (!faixaValida(g.intervalo.inicio, g.intervalo.fim))
      return 'O intervalo precisa ter início antes do fim.';
    if (!faixaValida(g.inicio, g.intervalo.inicio) || !faixaValida(g.intervalo.fim, g.fim)) {
      return 'O intervalo precisa caber dentro do horário de trabalho.';
    }
  }
  return null;
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

  // --- modal de horarios ---
  const [modalHorario, setModalHorario] = useState(false);
  const [fInicio, setFInicio] = useState('');
  const [fFim, setFFim] = useState('');
  const [fIntInicio, setFIntInicio] = useState('');
  const [fIntFim, setFIntFim] = useState('');
  const [erroHorario, setErroHorario] = useState<string | null>(null);

  function abrirHorario() {
    setFInicio(grade.inicio);
    setFFim(grade.fim);
    setFIntInicio(grade.intervalo?.inicio ?? '');
    setFIntFim(grade.intervalo?.fim ?? '');
    setErroHorario(null);
    setModalHorario(true);
  }

  function aplicarHorario() {
    const inicio = parseWallTime(fInicio);
    const fim = parseWallTime(fFim);
    if (!inicio || !fim) return setErroHorario('Use o formato HH:mm, por exemplo 09:00.');
    const temIntervalo = fIntInicio.trim() || fIntFim.trim();
    let intervalo: Grade['intervalo'] = null;
    if (temIntervalo) {
      const ii = parseWallTime(fIntInicio);
      const ifim = parseWallTime(fIntFim);
      if (!ii || !ifim)
        return setErroHorario('Intervalo: use HH:mm nos dois campos, ou deixe os dois vazios.');
      intervalo = { inicio: ii, fim: ifim };
    }
    const nova: Grade = { ...grade, inicio, fim, intervalo };
    const p = problemaDaGrade(nova);
    if (p) return setErroHorario(p);
    setEditando(true);
    setGrade(nova);
    setModalHorario(false);
  }

  function alternarDia(dia: DiaSemana) {
    setEditando(true);
    setGrade((g) => {
      const dias = new Set(g.dias);
      if (dias.has(dia)) dias.delete(dia);
      else dias.add(dia);
      return { ...g, dias };
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
                const ligado = grade.dias.has(dia);
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
            <View className="mt-[6px]">
              <LinhaHorario rotulo="Início" valor={grade.inicio} aoTocar={abrirHorario} />
              <LinhaHorario rotulo="Término" valor={grade.fim} aoTocar={abrirHorario} />
              <LinhaHorario
                rotulo="Intervalo"
                valor={
                  grade.intervalo
                    ? `${grade.intervalo.inicio} — ${grade.intervalo.fim}`
                    : 'Sem intervalo'
                }
                aoTocar={abrirHorario}
              />
            </View>

            {problema ? (
              <Text className="mt-3 font-sans text-help text-red-500">{problema}</Text>
            ) : null}
            {salvar.error ? (
              <Text className="mt-3 font-sans text-help text-red-500">{salvar.error.message}</Text>
            ) : null}
            {mudou ? (
              <Botao
                className="mt-5"
                titulo={grade.dias.size === 0 ? 'ZERAR A AGENDA' : 'SALVAR GRADE'}
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
            <LabelCaps papel="secao">HORÁRIO DE TRABALHO</LabelCaps>
            <Titulo className="mt-3 text-d-23">Hora de parede do ateliê</Titulo>
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
