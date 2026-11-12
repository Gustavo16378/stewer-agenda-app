/**
 * Regras pequenas da carteira de clientes, sem React, para testar sem tela: o link do
 * WhatsApp com a mensagem pronta, o texto do aniversario, os numeros escritos como gente
 * fala e o nome de cada evento da auditoria.
 */
import type { EventoAuditoria } from '@/api/types';

import { parseCalendarDate } from './datetime';

const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

/**
 * wa.me com a mensagem pronta. Aceita o telefone como a pessoa digitou; sem DDI, assume
 * Brasil. Devolve null quando nao da para montar um numero (sem telefone, curto demais).
 */
export function linkWhatsApp(
  telefone: string | null | undefined,
  mensagem?: string
): string | null {
  if (!telefone) return null;
  let digitos = telefone.replace(/\D/g, '');
  if (digitos.length === 10 || digitos.length === 11) digitos = `55${digitos}`;
  if (digitos.length < 12 || digitos.length > 15) return null;
  return `https://wa.me/${digitos}${mensagem ? `?text=${encodeURIComponent(mensagem)}` : ''}`;
}

export interface Aniversario {
  /** "20 de novembro" */
  dia: string;
  /** idade que faz (ou fez) este ano */
  idade: number;
  ehHoje: boolean;
  ehEsteMes: boolean;
}

/** O aniversario visto de hoje. Nulo sem data valida. */
export function aniversario(
  dataNascimento: string | null | undefined,
  hoje = new Date()
): Aniversario | null {
  if (!dataNascimento) return null;
  const d = parseCalendarDate(dataNascimento);
  if (!d) return null;
  return {
    dia: `${d.getDate()} de ${MESES[d.getMonth()]}`,
    idade: hoje.getFullYear() - d.getFullYear(),
    ehHoje: d.getDate() === hoje.getDate() && d.getMonth() === hoje.getMonth(),
    ehEsteMes: d.getMonth() === hoje.getMonth(),
  };
}

/** "volta a cada 3 semanas", "a cada 12 dias", "a cada 2 meses" */
export function ritmo(dias: number | null | undefined): string | null {
  if (dias === null || dias === undefined || dias <= 0) return null;
  if (dias % 7 === 0 && dias <= 42) {
    const s = dias / 7;
    return s === 1 ? 'toda semana' : `a cada ${s} semanas`;
  }
  if (dias >= 55) {
    const m = Math.round(dias / 30);
    return m === 1 ? 'todo mês' : `a cada ${m} meses`;
  }
  return `a cada ${dias} dias`;
}

/** "hoje", "ontem", "há 12 dias", "há 3 meses" */
export function haQuantoTempo(dias: number | null | undefined): string | null {
  if (dias === null || dias === undefined) return null;
  if (dias <= 0) return 'hoje';
  if (dias === 1) return 'ontem';
  if (dias < 60) return `há ${dias} dias`;
  const m = Math.round(dias / 30);
  return m >= 12
    ? `há ${Math.floor(dias / 365)} ${Math.floor(dias / 365) === 1 ? 'ano' : 'anos'}`
    : `há ${m} meses`;
}

/** Filtros da tela de auditoria: cada um junta os tipos de registro de um assunto. */
export const FILTROS_AUDITORIA = [
  { chave: 'tudo', rotulo: 'Tudo', entidades: [] as string[] },
  { chave: 'agenda', rotulo: 'Agendamentos', entidades: ['AGENDAMENTO'] },
  { chave: 'clientes', rotulo: 'Clientes', entidades: ['CLIENTE', 'FICHA', 'ANOTACAO', 'FOTO'] },
  { chave: 'catalogo', rotulo: 'Serviços', entidades: ['SERVICO'] },
  {
    chave: 'equipe',
    rotulo: 'Equipe e horários',
    entidades: ['PROFISSIONAL', 'HORARIOS', 'BLOQUEIO'],
  },
] as const;

/** O tom do evento na linha do tempo: o que tira horario da agenda chama atencao. */
export function tomDoEvento(e: Pick<EventoAuditoria, 'acao'>): 'alerta' | 'positivo' | 'neutro' {
  if (
    e.acao === 'CANCELOU' ||
    e.acao === 'NAO_COMPARECEU' ||
    e.acao === 'REMOVEU' ||
    e.acao === 'EXCLUIU_CONTA'
  ) {
    return 'alerta';
  }
  if (e.acao === 'CONCLUIU' || e.acao === 'CADASTROU') return 'positivo';
  return 'neutro';
}

/** Quem fez, como a tela mostra: o sistema quando nao ha autor. */
export function autorDoEvento(e: Pick<EventoAuditoria, 'autorNome' | 'autorRole'>): string {
  if (!e.autorNome) return e.autorRole === 'CLIENTE' ? 'Cliente' : 'Sistema';
  return e.autorNome;
}

/** Mensagens prontas do WhatsApp para o Stewer nao ter de pensar no texto. */
export const MENSAGENS = {
  parabens: (nome: string) =>
    `Oi ${nome}, aqui é o Stewer. Feliz aniversário! Que tal passar no studio esse mês? Tenho um horário guardado pra você.`,
  saudade: (nome: string) =>
    `Oi ${nome}, aqui é o Stewer. Faz um tempo que você não aparece por aqui. Bora marcar o próximo? É só escolher o horário pelo app.`,
  contato: (nome: string) => `Oi ${nome}, aqui é o Stewer.`,
};
