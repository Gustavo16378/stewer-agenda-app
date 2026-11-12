import { andarPeriodo, diasEntre, periodoDe, variacao } from '../periodo';

describe('periodoDe', () => {
  it('semana vai de segunda a domingo, mesmo partindo do domingo', () => {
    expect(periodoDe('semana', '2026-11-12')).toMatchObject({
      de: '2026-11-09',
      ate: '2026-11-15',
      rotulo: '9 a 15 de novembro',
    });
    expect(periodoDe('semana', '2026-11-15').de).toBe('2026-11-09');
    expect(periodoDe('semana', '2026-12-30')).toMatchObject({
      de: '2026-12-28',
      ate: '2027-01-03',
      rotulo: '28 de dezembro a 3 de janeiro',
    });
  });

  it('mes, semestre e ano', () => {
    expect(periodoDe('mes', '2026-02-10')).toMatchObject({
      de: '2026-02-01',
      ate: '2026-02-28',
      rotulo: 'Fevereiro de 2026',
    });
    expect(periodoDe('semestre', '2026-11-12')).toMatchObject({
      de: '2026-07-01',
      ate: '2026-12-31',
      rotulo: '2º semestre de 2026',
    });
    expect(periodoDe('semestre', '2026-03-01').ate).toBe('2026-06-30');
    expect(periodoDe('ano', '2026-11-12')).toMatchObject({ de: '2026-01-01', ate: '2026-12-31' });
  });
});

describe('andarPeriodo', () => {
  it('anda no tipo certo, inclusive virando o ano', () => {
    expect(andarPeriodo('dia', '2026-12-31', 1)).toBe('2027-01-01');
    expect(andarPeriodo('semana', '2026-11-12', 2)).toBe('2026-11-26');
    expect(andarPeriodo('mes', '2026-01-31', 1)).toBe('2026-02-01');
    expect(andarPeriodo('semestre', '2026-11-12', -1)).toBe('2026-05-01');
    expect(andarPeriodo('ano', '2026-11-12', -1)).toBe('2025-11-01');
  });
});

describe('diasEntre e variacao', () => {
  it('lista os dias incluindo as pontas', () => {
    expect(diasEntre('2026-02-27', '2026-03-02')).toEqual([
      '2026-02-27',
      '2026-02-28',
      '2026-03-01',
      '2026-03-02',
    ]);
  });

  it('variacao em % ou nulo sem base', () => {
    expect(variacao(150, 100)).toBe(50);
    expect(variacao(50, 100)).toBe(-50);
    expect(variacao(10, 0)).toBeNull();
  });
});
