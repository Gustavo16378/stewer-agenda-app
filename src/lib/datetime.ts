/**
 * O UNICO lugar do app que formata ou interpreta data e hora.
 *
 * A API mistura tres conceitos que parecem iguais e nao sao. Confundi-los e o bug
 * classico deste dominio, entao cada um tem seu proprio tipo e suas proprias funcoes:
 *
 * 1. INSTANTE (`Instant`) — campos `format: date-time` da spec: `inicio`, `fim`,
 *    `createdAt`, `updatedAt`, bloqueios e os slots de `horarios-livres`.
 *    E um ponto na linha do tempo, ISO 8601 COM offset ("2026-09-14T12:00:00Z" ou
 *    "...-03:00"). Exibe-se no fuso do APARELHO; envia-se com offset, via `toISOString()`.
 *    Nunca se monta string de instante na mao.
 *
 * 2. HORA DE PAREDE (`WallTime`) — `horaInicio`/`horaFim` da grade semanal
 *    (`format: time`). "09:00" e nove da manha no relogio da parede do estudio,
 *    sem data e sem fuso. NAO se converte, NAO passa por Date. So se transporta.
 *    A API devolve "09:00:00" (HH:mm:ss) e aceita "09:00" (HH:mm) — enviamos HH:mm.
 *
 * 3. DATA DE CALENDARIO (`CalendarDate`) — parametros `format: date`
 *    (`?data=` de horarios-livres e da agenda). E o DIA NO CALENDARIO LOCAL do usuario,
 *    "YYYY-MM-DD", derivado dos componentes locais da data.
 *    JAMAIS `toISOString().slice(0,10)`: em UTC-3, as 21h de 13/09 o `toISOString()`
 *    ja diz "2026-09-14" e o usuario receberia a agenda do dia errado.
 *
 * ---------------------------------------------------------------------------
 * FUSO DE EXIBICAO
 * ---------------------------------------------------------------------------
 * Instantes sao exibidos no fuso do aparelho (o comportamento padrao do `Date`).
 * Como toda formatacao passa por aqui, este modulo e o unico ponto a mudar se um dia
 * o app precisar fixar o fuso do estabelecimento.
 *
 * A API resolve a hora de parede da grade no fuso do ESTABELECIMENTO
 * (`tenant.fuso`, America/Araguaina para Palmas) antes de devolver o instante: uma
 * grade 09:00-19:00 volta como "09:00:00-03:00".."19:00:00-03:00". Num aparelho no
 * mesmo fuso do estudio — o caso normal — a tela mostra 09:00..19:00, igual ao
 * relogio de quem atende.
 *
 * Quem viaja continua vendo o instante no fuso do PROPRIO aparelho, que e o
 * comportamento correto para um instante: o atendimento acontece na hora que
 * acontece, independente de onde o cliente esteja olhando.
 */
import { format, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

/** ISO 8601 com offset, ex.: "2026-09-14T12:00:00Z". Ponto na linha do tempo. */
export type Instant = string;

/** "HH:mm" — hora de parede, sem data e sem fuso. */
export type WallTime = string;

/** "YYYY-MM-DD" — dia do calendario local. */
export type CalendarDate = string;

/** 0 = domingo ... 6 = sabado. Igual a `Date.prototype.getDay()`. */
export type DiaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// ---------------------------------------------------------------------------
// 1. Instantes
// ---------------------------------------------------------------------------

/** Converte o ISO da API em Date. Devolve `null` se a string nao for valida. */
export function parseInstant(iso: Instant | null | undefined): Date | null {
  if (!iso) return null;
  const d = parseISO(iso);
  return isValid(d) ? d : null;
}

/** Serializa um Date para mandar a API: sempre ISO com offset (Z). */
export function toInstant(date: Date): Instant {
  return date.toISOString();
}

function fmt(iso: Instant | null | undefined, pattern: string, fallback = ''): string {
  const d = parseInstant(iso);
  return d ? format(d, pattern, { locale: ptBR }) : fallback;
}

/** "15:30" — hora local do aparelho. */
export function formatHora(iso: Instant | null | undefined): string {
  return fmt(iso, 'HH:mm');
}

/** "11/09/2026" */
export function formatData(iso: Instant | null | undefined): string {
  return fmt(iso, 'dd/MM/yyyy');
}

/** "11 de setembro de 2026" */
export function formatDataPorExtenso(iso: Instant | null | undefined): string {
  return fmt(iso, "d 'de' MMMM 'de' yyyy");
}

/** "11 de setembro" — sem o ano, como aparece nas listas do design. */
export function formatDiaMes(iso: Instant | null | undefined): string {
  return fmt(iso, "d 'de' MMMM");
}

/**
 * "SEX, 11 SET" — o carimbo curto em caps do design.
 * `EEEEEE` (short) e o token que da "sex" em pt-BR; `EEE` daria "sexta" por extenso.
 */
export function formatDiaCurtoCaps(iso: Instant | null | undefined): string {
  const s = fmt(iso, 'EEEEEE, d MMM');
  return s.replace(/\./g, '').toUpperCase();
}

/** "SEX" — so o dia da semana curto, para colunas e chips. */
export function formatDiaSemanaCurtoCaps(iso: Instant | null | undefined): string {
  return fmt(iso, 'EEEEEE').replace(/\./g, '').toUpperCase();
}

/** "11" — so o numero do dia de um INSTANTE (`diaDoMes` e o par para CalendarDate). */
export function formatDiaNumero(iso: Instant | null | undefined): string {
  return fmt(iso, 'd');
}

/** "SET" — mes abreviado em caps, o rotulo embaixo do numero do dia (frame 08). */
export function formatMesCurtoCaps(iso: Instant | null | undefined): string {
  return fmt(iso, 'MMM').replace(/\./g, '').toUpperCase();
}

/**
 * "14 AGO" — o carimbo de data do historico (frame 08).
 *
 * O dia vem com DOIS digitos porque o design escreve "02 JUN", nao "2 JUN": a coluna tem
 * largura fixa de 56px e o zero e o que mantem os meses alinhados na vertical.
 */
export function formatDiaMesCurtoCaps(iso: Instant | null | undefined): string {
  return fmt(iso, 'dd MMM').replace(/\./g, '').toUpperCase();
}

/** "TERÇA-FEIRA, 1 DE SETEMBRO" — o cabecalho da home. */
export function formatDiaSemanaLongoCaps(date: Date): string {
  return format(date, "EEEE, d 'DE' MMMM", { locale: ptBR }).toUpperCase();
}

/**
 * "SEX, 11 SET · 15:30 — 16:30" — linha de horario do design.
 * Usa o travessao "—" (em dash) e o ponto medio "·" exatamente como no design.
 */
export function formatFaixaAgendamento(
  inicio: Instant | null | undefined,
  fim: Instant | null | undefined
): string {
  const dia = formatDiaCurtoCaps(inicio);
  const hi = formatHora(inicio);
  const hf = formatHora(fim);
  if (!dia || !hi) return '';
  return hf ? `${dia} · ${hi} — ${hf}` : `${dia} · ${hi}`;
}

/** "15:30 — 16:30" — so a faixa de horas, para quando o dia ja esta no cabecalho. */
export function formatFaixaHoras(
  inicio: Instant | null | undefined,
  fim: Instant | null | undefined
): string {
  const hi = formatHora(inicio);
  const hf = formatHora(fim);
  if (!hi) return '';
  return hf ? `${hi} — ${hf}` : hi;
}

/**
 * "Sexta, 11 de setembro" — a linha DATA do card de confirmacao (frame 07).
 *
 * Nao usa `EEEE`: em pt-BR o date-fns escreve "sexta-feira", e o design escreve "Sexta"
 * — que e exatamente o nome curto que `nomeDiaSemana` ja mantem.
 */
export function formatDiaSemanaDiaMes(iso: Instant | null | undefined): string {
  const d = parseInstant(iso);
  if (!d) return '';
  const dia = d.getDay();
  return isDiaSemana(dia) ? `${nomeDiaSemana(dia)}, ${formatDiaMes(iso)}` : formatDiaMes(iso);
}

/**
 * "15:30 — 16:30" a partir do inicio do slot e da duracao do servico (frame 07).
 *
 * Existe porque na confirmacao o app tem so o `inicio` escolhido: o `fim` e derivado da
 * duracao, do mesmo jeito que o backend faz ao gravar o agendamento. Sem duracao legivel,
 * cai para so a hora de inicio em vez de mentir um fim.
 */
export function formatFaixaPorDuracao(
  inicio: Instant | null | undefined,
  duracaoMinutos: number | null | undefined
): string {
  const d = parseInstant(inicio);
  if (!d) return '';
  if (
    duracaoMinutos === null ||
    duracaoMinutos === undefined ||
    !Number.isFinite(duracaoMinutos) ||
    duracaoMinutos <= 0
  ) {
    return formatHora(inicio);
  }
  const fim = new Date(d.getTime() + Math.trunc(duracaoMinutos) * 60_000);
  return formatFaixaHoras(inicio, toInstant(fim));
}

/** O instante ja passou? */
export function isPassado(iso: Instant | null | undefined, agora: Date = new Date()): boolean {
  const d = parseInstant(iso);
  return d ? d.getTime() < agora.getTime() : false;
}

// ---------------------------------------------------------------------------
// 2. Datas de calendario (parametro `?data=`)
// ---------------------------------------------------------------------------

/**
 * Date -> "YYYY-MM-DD" usando os componentes LOCAIS.
 * E o oposto de `toISOString().slice(0,10)`, que usa UTC e erra o dia a noite em UTC-3.
 */
export function toCalendarDate(date: Date): CalendarDate {
  return format(date, 'yyyy-MM-dd');
}

/** O dia de hoje no calendario do usuario. */
export function hojeCalendarDate(agora: Date = new Date()): CalendarDate {
  return toCalendarDate(agora);
}

/**
 * "YYYY-MM-DD" -> Date na MEIA-NOITE LOCAL desse dia.
 * Construido por componentes de proposito: `new Date("2026-09-14")` seria meia-noite UTC,
 * que em UTC-3 cai no dia 13.
 */
export function parseCalendarDate(value: CalendarDate): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const [, y, mo, d] = m;
  const ano = Number(y);
  const mes = Number(mo);
  const dia = Number(d);
  const date = new Date(ano, mes - 1, dia, 0, 0, 0, 0);
  // rejeita data inexistente (ex.: 2026-02-31 rolaria para marco)
  if (date.getFullYear() !== ano || date.getMonth() !== mes - 1 || date.getDate() !== dia) {
    return null;
  }
  return date;
}

/**
 * O dia de calendario LOCAL em que um instante cai.
 * Ex.: em UTC-3, "2026-09-14T02:00:00Z" e ainda dia 13 para o usuario.
 */
export function calendarDateDoInstante(iso: Instant | null | undefined): CalendarDate | null {
  const d = parseInstant(iso);
  return d ? toCalendarDate(d) : null;
}

/** Soma dias a um dia de calendario, sem sair do calendario local. */
export function somaDias(value: CalendarDate, dias: number): CalendarDate | null {
  const d = parseCalendarDate(value);
  if (!d) return null;
  d.setDate(d.getDate() + dias);
  return toCalendarDate(d);
}

/** "11" — so o numero do dia, para as celulas do calendario. */
export function diaDoMes(value: CalendarDate): string {
  const d = parseCalendarDate(value);
  return d ? String(d.getDate()) : '';
}

/** "Setembro 2026" — cabecalho do calendario do design (mes capitalizado). */
export function formatMesAno(date: Date): string {
  const s = format(date, 'MMMM yyyy', { locale: ptBR });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * "SEXTA, 11 SET" — o carimbo do dia escolhido no cabecalho de HORARIOS (frames 06/19).
 *
 * Nao da para reusar `formatDiaCurtoCaps`: ele abrevia o dia da semana ("SEX") e recebe
 * um INSTANTE, e aqui a origem e o dia de calendario escolhido no grid. Em pt-BR o `EEEE`
 * do date-fns devolve "sexta-feira"; o design usa so a primeira palavra.
 */
export function formatDiaCalendarioCaps(value: CalendarDate): string {
  const d = parseCalendarDate(value);
  if (!d) return '';
  const semana = format(d, 'EEEE', { locale: ptBR }).split('-')[0] ?? '';
  const diaMes = format(d, 'd MMM', { locale: ptBR }).replace(/\./g, '');
  return `${semana}, ${diaMes}`.toUpperCase();
}

// ---------------------------------------------------------------------------
// 3. Hora de parede (grade semanal)
// ---------------------------------------------------------------------------

const WALL_TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;

/**
 * Normaliza a hora de parede da API para "HH:mm".
 * Aceita "09:00" e "09:00:00" (a API devolve com segundos e aceita sem).
 * Devolve `null` se nao for hora valida. NUNCA passa por Date — nao ha fuso aqui.
 */
export function parseWallTime(value: string | null | undefined): WallTime | null {
  if (!value) return null;
  const m = WALL_TIME_RE.exec(value.trim());
  if (!m) return null;
  return `${m[1]}:${m[2]}`;
}

/** Igual a `parseWallTime`, mas devolve "" no lugar de null, para uso direto na tela. */
export function formatWallTime(value: string | null | undefined): string {
  return parseWallTime(value) ?? '';
}

/** "09:00" -> 540. Util para ordenar e comparar faixas sem tocar em Date. */
export function wallTimeParaMinutos(value: string | null | undefined): number | null {
  const wt = parseWallTime(value);
  if (!wt) return null;
  const [h, m] = wt.split(':');
  return Number(h) * 60 + Number(m);
}

/** 540 -> "09:00". Aceita 0..1440. */
export function minutosParaWallTime(minutos: number): WallTime | null {
  if (!Number.isInteger(minutos) || minutos < 0 || minutos > 24 * 60) return null;
  const h = Math.floor(minutos / 60) % 24;
  const m = minutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** <0, 0 ou >0. Ordena faixas do mesmo dia. */
export function comparaWallTime(a: string, b: string): number {
  return (wallTimeParaMinutos(a) ?? -1) - (wallTimeParaMinutos(b) ?? -1);
}

/** A faixa e valida (inicio estritamente antes do fim)? A API rejeita fim <= inicio. */
export function faixaValida(inicio: string, fim: string): boolean {
  const i = wallTimeParaMinutos(inicio);
  const f = wallTimeParaMinutos(fim);
  return i !== null && f !== null && i < f;
}

/** Duas faixas do mesmo dia se sobrepoem? A API rejeita sobreposicao. */
export function faixasSobrepoem(
  a: { horaInicio: string; horaFim: string },
  b: { horaInicio: string; horaFim: string }
): boolean {
  const ai = wallTimeParaMinutos(a.horaInicio);
  const af = wallTimeParaMinutos(a.horaFim);
  const bi = wallTimeParaMinutos(b.horaInicio);
  const bf = wallTimeParaMinutos(b.horaFim);
  if (ai === null || af === null || bi === null || bf === null) return false;
  return ai < bf && bi < af;
}

// ---------------------------------------------------------------------------
// 4. Dia da semana
// ---------------------------------------------------------------------------

/** 0 = domingo ... 6 = sabado — a mesma convencao de `Date.getDay()` e da API. */
export const DIAS_SEMANA: readonly DiaSemana[] = [0, 1, 2, 3, 4, 5, 6];

const NOMES_DIA: Record<DiaSemana, string> = {
  0: 'Domingo',
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado',
};

const INICIAIS_DIA: Record<DiaSemana, string> = {
  0: 'D',
  1: 'S',
  2: 'T',
  3: 'Q',
  4: 'Q',
  5: 'S',
  6: 'S',
};

export function nomeDiaSemana(dia: DiaSemana): string {
  return NOMES_DIA[dia];
}

/** "D S T Q Q S S" — o cabecalho do calendario do design. */
export function inicialDiaSemana(dia: DiaSemana): string {
  return INICIAIS_DIA[dia];
}

export function isDiaSemana(v: number): v is DiaSemana {
  return Number.isInteger(v) && v >= 0 && v <= 6;
}

/** O dia da semana LOCAL de um dia de calendario. Casa com o `diaSemana` da API. */
export function diaSemanaDe(value: CalendarDate): DiaSemana | null {
  const d = parseCalendarDate(value);
  if (!d) return null;
  const dia = d.getDay();
  return isDiaSemana(dia) ? dia : null;
}

// ---------------------------------------------------------------------------
// 5. Grade do calendario (tela 06 / 19)
// ---------------------------------------------------------------------------

/**
 * As celulas de um mes, alinhadas em semanas de domingo a sabado.
 * `null` = celula vazia antes do dia 1 ou depois do ultimo dia.
 * Tudo em calendario local; nenhum instante envolvido.
 */
export function gradeDoMes(ano: number, mes0: number): (CalendarDate | null)[] {
  const primeiro = new Date(ano, mes0, 1);
  const offset = primeiro.getDay(); // 0=domingo, ja e a convencao da grade
  const diasNoMes = new Date(ano, mes0 + 1, 0).getDate();
  const celulas: (CalendarDate | null)[] = [];
  for (let i = 0; i < offset; i++) celulas.push(null);
  for (let d = 1; d <= diasNoMes; d++) celulas.push(toCalendarDate(new Date(ano, mes0, d)));
  while (celulas.length % 7 !== 0) celulas.push(null);
  return celulas;
}

// ---------------------------------------------------------------------------
// 6. Saudacao
// ---------------------------------------------------------------------------

/**
 * "Bom dia" / "Boa tarde" / "Boa noite" pela hora LOCAL do aparelho.
 * Mora aqui porque depende da hora local — a mesma regra que rege o resto do modulo.
 * O design mostra "Boa tarde, Rafael." na home (frames 03 e 18).
 */
export function saudacao(agora: Date = new Date()): string {
  const h = agora.getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

/** "Rafael" a partir de "Rafael Moreira Lima" — o design chama pelo primeiro nome. */
export function primeiroNome(nome: string | null | undefined): string {
  if (!nome) return '';
  return nome.trim().split(/\s+/)[0] ?? '';
}

// ---------------------------------------------------------------------------
// 7. Formatos pontuais que o design usa (todos derivados dos mesmos tres conceitos)
// ---------------------------------------------------------------------------

function capitaliza(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** "14 Ago" — "ÚLTIMA VISITA" do resumo do cliente. */
export function formatDiaMesCurto(iso: Instant | null | undefined): string {
  const s = fmt(iso, 'd MMM').replace(/\./g, '');
  const [dia, mes] = s.split(' ');
  return dia && mes ? `${dia} ${capitaliza(mes)}` : '';
}

/** "Mar 2024" — "CLIENTE DESDE" do resumo do cliente. */
export function formatMesAnoCurto(iso: Instant | null | undefined): string {
  const s = fmt(iso, 'MMM yyyy').replace(/\./g, '');
  return capitaliza(s);
}

/** "MARÇO DE 2024" — "CLIENTE DESDE MARÇO DE 2024" do perfil e da ficha. */
export function formatMesAnoLongoCaps(iso: Instant | null | undefined): string {
  return fmt(iso, "MMMM 'de' yyyy").toUpperCase();
}

/** "Terça, 1 de setembro" — titulo da agenda do dia (a partir do dia de calendario). */
export function formatDiaSemanaEData(value: CalendarDate): string {
  const d = parseCalendarDate(value);
  if (!d) return '';
  return capitaliza(format(d, "EEE, d 'de' MMMM", { locale: ptBR }));
}

const CURTOS_DIA: Record<DiaSemana, string> = {
  0: 'DOM',
  1: 'SEG',
  2: 'TER',
  3: 'QUA',
  4: 'QUI',
  5: 'SEX',
  6: 'SÁB',
};

/**
 * "TER" — nome curto do dia da semana em caps, para "TER — SÁB".
 * Tabela propria: o date-fns escreve "sab" sem acento, e o design escreve "SÁB".
 */
export function nomeDiaSemanaCurtoCaps(dia: DiaSemana): string {
  return CURTOS_DIA[dia];
}

/** O dia de calendario e hoje (no calendario local)? */
export function isHoje(value: CalendarDate, agora: Date = new Date()): boolean {
  return value === toCalendarDate(agora);
}

/** Os dois instantes caem no mesmo dia de calendario LOCAL? */
export function mesmoDiaLocal(
  a: Instant | null | undefined,
  b: Instant | null | undefined
): boolean {
  const da = calendarDateDoInstante(a);
  const db = calendarDateDoInstante(b);
  return !!da && da === db;
}

/**
 * A semana (segunda a domingo) que contem o dia. O design mostra a semana assim
 * ("31 AGO — 06 SET" e segunda a domingo).
 */
export function semanaDe(value: CalendarDate): CalendarDate[] {
  const d = parseCalendarDate(value);
  if (!d) return [];
  // getDay: 0=dom..6=sab; distancia ate a segunda-feira anterior (ou o proprio dia)
  const recuo = (d.getDay() + 6) % 7;
  const segunda = new Date(d.getFullYear(), d.getMonth(), d.getDate() - recuo);
  return Array.from({ length: 7 }, (_, i) =>
    toCalendarDate(new Date(segunda.getFullYear(), segunda.getMonth(), segunda.getDate() + i))
  );
}

/** "31 AGO — 06 SET" — a faixa de dias do dashboard. */
export function formatFaixaDiasCaps(inicio: CalendarDate, fim: CalendarDate): string {
  const a = parseCalendarDate(inicio);
  const b = parseCalendarDate(fim);
  if (!a || !b) return '';
  const f = (d: Date) => format(d, 'dd MMM', { locale: ptBR }).replace(/\./g, '').toUpperCase();
  return `${f(a)} — ${f(b)}`;
}

/** "DD/MM/AAAA" digitado -> dia de calendario. `null` se nao for data valida. */
export function parseDataBr(texto: string | null | undefined): CalendarDate | null {
  if (!texto) return null;
  const m = /^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/.exec(texto);
  if (!m) return null;
  const [, d, mo, y] = m;
  const candidato = `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return parseCalendarDate(candidato) ? candidato : null;
}

/** "12/09/2026" — a partir de um dia de calendario, para preencher formulario. */
export function formatDataBr(value: CalendarDate): string {
  const d = parseCalendarDate(value);
  return d ? format(d, 'dd/MM/yyyy') : '';
}

/**
 * Dia de calendario LOCAL + hora de parede LOCAL -> instante ISO com offset.
 * E como um bloqueio digitado pelo profissional ("12/09 das 16:00 as 18:00") vira o
 * `inicio`/`fim` que a API espera. Passa pelo Date DE PROPOSITO: aqui a hora e local
 * do aparelho e o resultado tem de ser um instante.
 */
export function instanteDe(dia: CalendarDate, hora: WallTime): Instant | null {
  const d = parseCalendarDate(dia);
  const minutos = wallTimeParaMinutos(hora);
  if (!d || minutos === null) return null;
  d.setHours(Math.floor(minutos / 60), minutos % 60, 0, 0);
  return toInstant(d);
}

/** Um bloqueio cobre o dia inteiro (00:00 a 23:59 locais do mesmo dia)? */
export function cobreODiaInteiro(inicio: Instant, fim: Instant): boolean {
  const a = parseInstant(inicio);
  const b = parseInstant(fim);
  if (!a || !b || !mesmoDiaLocal(inicio, fim)) return false;
  const inicioZero = a.getHours() === 0 && a.getMinutes() === 0;
  const fimTarde = b.getHours() === 23 && b.getMinutes() >= 59;
  return inicioZero && fimTarde;
}

/** "JULHO" — nome do mes em caps, para "+3 VS. JULHO" do dashboard. */
export function nomeMesCaps(date: Date): string {
  return format(date, 'MMMM', { locale: ptBR }).toUpperCase();
}

/** O primeiro dia do mes anterior ao de `date`, em calendario local. */
export function mesAnterior(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

/** O instante cai no mesmo mes LOCAL de `ref`? */
export function noMesmoMesLocal(iso: Instant | null | undefined, ref: Date): boolean {
  const d = parseInstant(iso);
  return !!d && d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}
