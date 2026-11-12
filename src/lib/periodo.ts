/**
 * Periodos de calendario para a agenda e o financeiro: dia, semana (segunda a domingo),
 * mes, semestre e ano, a partir de um dia de referencia. Tudo em dia de calendario LOCAL
 * ("YYYY-MM-DD"), sem instante no meio.
 */
import { format } from 'date-fns/format';
import { ptBR } from 'date-fns/locale/pt-BR';

import { parseCalendarDate, toCalendarDate, type CalendarDate } from './datetime';

export type TipoPeriodo = 'dia' | 'semana' | 'mes' | 'semestre' | 'ano';

export interface Periodo {
  tipo: TipoPeriodo;
  de: CalendarDate;
  ate: CalendarDate;
  rotulo: string;
}

const MESES = (d: Date) => format(d, 'MMMM', { locale: ptBR });
const capitaliza = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function periodoDe(tipo: TipoPeriodo, referencia: CalendarDate): Periodo {
  const d = parseCalendarDate(referencia) ?? new Date();
  const ano = d.getFullYear();
  const mes = d.getMonth();
  switch (tipo) {
    case 'dia':
      return {
        tipo,
        de: toCalendarDate(d),
        ate: toCalendarDate(d),
        rotulo: format(d, "d 'de' MMMM", { locale: ptBR }),
      };
    case 'semana': {
      const seg = new Date(ano, mes, d.getDate() - ((d.getDay() + 6) % 7));
      const dom = new Date(seg.getFullYear(), seg.getMonth(), seg.getDate() + 6);
      const mesmoMes = seg.getMonth() === dom.getMonth();
      const rotulo = mesmoMes
        ? `${seg.getDate()} a ${dom.getDate()} de ${MESES(dom)}`
        : `${seg.getDate()} de ${MESES(seg)} a ${dom.getDate()} de ${MESES(dom)}`;
      return { tipo, de: toCalendarDate(seg), ate: toCalendarDate(dom), rotulo };
    }
    case 'mes':
      return {
        tipo,
        de: toCalendarDate(new Date(ano, mes, 1)),
        ate: toCalendarDate(new Date(ano, mes + 1, 0)),
        rotulo: `${capitaliza(MESES(d))} de ${ano}`,
      };
    case 'semestre': {
      const primeiro = mes < 6;
      return {
        tipo,
        de: toCalendarDate(new Date(ano, primeiro ? 0 : 6, 1)),
        ate: toCalendarDate(new Date(ano, primeiro ? 6 : 12, 0)),
        rotulo: `${primeiro ? '1º' : '2º'} semestre de ${ano}`,
      };
    }
    case 'ano':
      return {
        tipo,
        de: toCalendarDate(new Date(ano, 0, 1)),
        ate: toCalendarDate(new Date(ano, 11, 31)),
        rotulo: String(ano),
      };
  }
}

/** O mesmo tipo de periodo, `passos` para frente (ou para tras, com negativo). */
export function andarPeriodo(
  tipo: TipoPeriodo,
  referencia: CalendarDate,
  passos: number
): CalendarDate {
  const d = parseCalendarDate(referencia) ?? new Date();
  const ano = d.getFullYear();
  const mes = d.getMonth();
  switch (tipo) {
    case 'dia':
      return toCalendarDate(new Date(ano, mes, d.getDate() + passos));
    case 'semana':
      return toCalendarDate(new Date(ano, mes, d.getDate() + 7 * passos));
    case 'mes':
      return toCalendarDate(new Date(ano, mes + passos, 1));
    case 'semestre':
      return toCalendarDate(new Date(ano, mes + 6 * passos, 1));
    case 'ano':
      return toCalendarDate(new Date(ano + passos, mes, 1));
  }
}

/** Todos os dias de `de` a `ate`, incluidos. */
export function diasEntre(de: CalendarDate, ate: CalendarDate): CalendarDate[] {
  const ini = parseCalendarDate(de);
  const fim = parseCalendarDate(ate);
  if (!ini || !fim) return [];
  const dias: CalendarDate[] = [];
  for (let d = ini; d <= fim; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
    dias.push(toCalendarDate(d));
  }
  return dias;
}

/** Variacao em % sobre o periodo anterior; nulo quando nao ha base para comparar. */
export function variacao(atual: number, anterior: number): number | null {
  if (!anterior) return null;
  return Math.round(((atual - anterior) / anterior) * 100);
}
