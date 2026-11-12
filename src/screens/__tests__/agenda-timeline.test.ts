import type { Agendamento } from '@/api/types';

import { montarTimeline } from '../agenda';

const item = (
  id: string,
  inicio: string,
  fim: string,
  status: Agendamento['status'] = 'AGENDADO'
) => ({ id, inicio, fim, status, clienteNome: id }) as Agendamento;

// TZ dos testes: America/Sao_Paulo (UTC-3)
const manha = item('a', '2026-11-12T12:00:00Z', '2026-11-12T13:00:00Z'); // 09:00 - 10:00
const tarde = item('b', '2026-11-12T17:00:00Z', '2026-11-12T18:00:00Z'); // 14:00 - 15:00
const cancelado = item('c', '2026-11-12T19:00:00Z', '2026-11-12T20:00:00Z', 'CANCELADO');

describe('montarTimeline', () => {
  it('ordena, tira os cancelados e marca o vao entre atendimentos', () => {
    const blocos = montarTimeline([tarde, cancelado, manha]);
    expect(blocos.map((b) => b.tipo)).toEqual(['atendimento', 'vago', 'atendimento']);
    expect(blocos[1]!.hora).toBe('10:00');
  });

  it('sem `agora` nao ha linha de agora (outro dia)', () => {
    expect(montarTimeline([manha, tarde]).some((b) => b.tipo === 'agora')).toBe(false);
  });

  it('poe a linha de agora antes do vao que leva ao proximo atendimento', () => {
    const blocos = montarTimeline([manha, tarde], new Date('2026-11-12T14:30:00Z')); // 11:30
    expect(blocos.map((b) => b.tipo)).toEqual(['atendimento', 'agora', 'vago', 'atendimento']);
    expect(blocos[1]!.hora).toBe('11:30');
  });

  it('antes do primeiro atendimento, a linha abre o dia; depois do ultimo, fecha', () => {
    expect(montarTimeline([manha], new Date('2026-11-12T10:00:00Z'))[0]!.tipo).toBe('agora');
    const fim = montarTimeline([manha], new Date('2026-11-12T22:00:00Z'));
    expect(fim[fim.length - 1]!.tipo).toBe('agora');
  });
});
