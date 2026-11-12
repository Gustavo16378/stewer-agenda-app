import { emFrase } from '../frase';

describe('emFrase', () => {
  it('converte rotulo em caixa alta', () => {
    expect(emFrase('PRÓXIMO AGENDAMENTO')).toBe('Próximo agendamento');
    expect(emFrase('SEG, 16 NOV · 10:00')).toBe('Seg, 16 nov · 10:00');
    expect(emFrase('QUINTA-FEIRA, 12 DE NOVEMBRO')).toBe('Quinta-feira, 12 de novembro');
  });
  it('deixa texto com minusculas como esta', () => {
    expect(emFrase('Corte + Visagismo')).toBe('Corte + Visagismo');
  });
  it('mantem siglas', () => {
    expect(emFrase('URL DA FOTO')).toBe('URL da foto');
  });
});
