import type { Agendamento } from '@/api/types';

import { podeDarBaixa } from '../Baixa';

jest.mock('@/api/hooks', () => ({ useAtualizarStatus: jest.fn() }));

const base = { id: 'a', inicio: '2026-11-12T13:00:00Z', status: 'AGENDADO' } as Agendamento;
const as = (iso: string) => Date.parse(iso);

describe('podeDarBaixa', () => {
  it('so depois que o horario comecou', () => {
    expect(podeDarBaixa(base, as('2026-11-12T12:59:00Z'))).toBe(false);
    expect(podeDarBaixa(base, as('2026-11-12T13:00:00Z'))).toBe(true);
    expect(podeDarBaixa(base, as('2026-11-20T10:00:00Z'))).toBe(true);
  });

  it('quem ja teve baixa ou foi cancelado nao volta', () => {
    const tarde = as('2026-11-13T10:00:00Z');
    expect(podeDarBaixa({ ...base, status: 'CONCLUIDO' }, tarde)).toBe(false);
    expect(podeDarBaixa({ ...base, status: 'NAO_COMPARECEU' }, tarde)).toBe(false);
    expect(podeDarBaixa({ ...base, status: 'CANCELADO' }, tarde)).toBe(false);
  });
});
