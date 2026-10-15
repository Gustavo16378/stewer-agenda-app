import {
  formatCentavos,
  formatCentavosCurto,
  formatDuracao,
  parseCentavos,
  somaCentavos,
} from '../money';

describe('formatCentavos', () => {
  it('formata os precos do seed exatamente', () => {
    expect(formatCentavos(18000)).toBe('R$ 180,00'); // Corte + Visagismo
    expect(formatCentavos(32000)).toBe('R$ 320,00'); // Consultoria de Imagem
    expect(formatCentavos(7000)).toBe('R$ 70,00'); // Barba
  });

  it('nunca perde centavo (o motivo de nao usar float)', () => {
    expect(formatCentavos(1)).toBe('R$ 0,01');
    expect(formatCentavos(9)).toBe('R$ 0,09');
    expect(formatCentavos(10)).toBe('R$ 0,10');
    expect(formatCentavos(99)).toBe('R$ 0,99');
    expect(formatCentavos(101)).toBe('R$ 1,01');
    expect(formatCentavos(1005)).toBe('R$ 10,05');
  });

  it('separa milhar com ponto, como o pt-BR', () => {
    expect(formatCentavos(100000)).toBe('R$ 1.000,00');
    expect(formatCentavos(123456789)).toBe('R$ 1.234.567,89');
    expect(formatCentavos(999999)).toBe('R$ 9.999,99');
  });

  it('trata zero e negativo', () => {
    expect(formatCentavos(0)).toBe('R$ 0,00');
    expect(formatCentavos(-18000)).toBe('-R$ 180,00');
  });

  it('devolve vazio para ausente ou nao numerico, em vez de "R$ NaN"', () => {
    expect(formatCentavos(null)).toBe('');
    expect(formatCentavos(undefined)).toBe('');
    expect(formatCentavos(Number.NaN)).toBe('');
    expect(formatCentavos(Number.POSITIVE_INFINITY)).toBe('');
  });

  it('o valor formatado bate com a aritmetica inteira, nao com a de float', () => {
    // 0.1 + 0.2 !== 0.3 em float; em centavos, 10 + 20 === 30, sempre
    const total = somaCentavos([10, 20]);
    expect(total).toBe(30);
    expect(formatCentavos(total)).toBe('R$ 0,30');
  });
});

describe('formatCentavosCurto', () => {
  it('omite os centavos quando sao zero', () => {
    expect(formatCentavosCurto(18000)).toBe('180');
    expect(formatCentavosCurto(100000)).toBe('1.000');
  });

  it('mantem os centavos quando existem', () => {
    expect(formatCentavosCurto(18050)).toBe('180,50');
    expect(formatCentavosCurto(1)).toBe('0,01');
  });

  it('degrada para vazio', () => {
    expect(formatCentavosCurto(null)).toBe('');
  });
});

describe('parseCentavos', () => {
  it('le o que o usuario digita', () => {
    expect(parseCentavos('180')).toBe(18000);
    expect(parseCentavos('180,50')).toBe(18050);
    expect(parseCentavos('180.50')).toBe(18050);
    expect(parseCentavos('R$ 180,00')).toBe(18000);
    expect(parseCentavos('  320  ')).toBe(32000);
  });

  it('entende ponto de milhar', () => {
    expect(parseCentavos('1.800')).toBe(180000);
    expect(parseCentavos('R$ 1.234,56')).toBe(123456);
    expect(parseCentavos('1.234.567,89')).toBe(123456789);
  });

  it('completa ou corta a casa decimal', () => {
    expect(parseCentavos('180,5')).toBe(18050);
    expect(parseCentavos('180,')).toBe(18000);
    expect(parseCentavos('180,555')).toBe(18055); // corta, nao arredonda por float
  });

  it('trata zero e negativo', () => {
    expect(parseCentavos('0')).toBe(0);
    expect(parseCentavos('0,00')).toBe(0);
    expect(parseCentavos('-180,00')).toBe(-18000);
  });

  it('devolve null para entrada que nao e preco', () => {
    expect(parseCentavos('')).toBeNull();
    expect(parseCentavos('   ')).toBeNull();
    expect(parseCentavos('R$')).toBeNull();
    expect(parseCentavos('abc')).toBeNull();
    expect(parseCentavos(null)).toBeNull();
    expect(parseCentavos(undefined)).toBeNull();
  });

  it('ida e volta preserva o valor', () => {
    for (const centavos of [0, 1, 99, 7000, 18000, 32000, 123456789]) {
      expect(parseCentavos(formatCentavos(centavos))).toBe(centavos);
    }
  });
});

describe('somaCentavos', () => {
  it('soma inteiros e ignora buracos', () => {
    expect(somaCentavos([18000, 7000, 32000])).toBe(57000);
    expect(somaCentavos([18000, null, undefined, 7000])).toBe(25000);
    expect(somaCentavos([])).toBe(0);
  });
});

describe('formatDuracao', () => {
  it('formata as duracoes do seed', () => {
    expect(formatDuracao(30)).toBe('30 min'); // Barba
    expect(formatDuracao(60)).toBe('1h'); // Corte + Visagismo
    expect(formatDuracao(90)).toBe('1h30'); // Consultoria de Imagem
  });

  it('cobre os extremos que a API aceita (5 a 600 minutos)', () => {
    expect(formatDuracao(5)).toBe('5 min');
    expect(formatDuracao(59)).toBe('59 min');
    expect(formatDuracao(120)).toBe('2h');
    expect(formatDuracao(125)).toBe('2h05');
    expect(formatDuracao(600)).toBe('10h');
  });

  it('degrada para vazio', () => {
    expect(formatDuracao(null)).toBe('');
    expect(formatDuracao(undefined)).toBe('');
    expect(formatDuracao(Number.NaN)).toBe('');
  });
});
