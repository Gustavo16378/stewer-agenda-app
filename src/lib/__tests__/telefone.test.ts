import { formatTelefone } from '../telefone';

describe('formatTelefone', () => {
  it('formata celular com DDI', () => {
    expect(formatTelefone('+5511999990003')).toBe('(11) 99999-0003');
  });
  it('formata celular sem DDI e com mascara', () => {
    expect(formatTelefone('63 99111-4551')).toBe('(63) 99111-4551');
  });
  it('formata fixo de 10 digitos', () => {
    expect(formatTelefone('6332150000')).toBe('(63) 3215-0000');
  });
  it('deixa numero estrangeiro como veio', () => {
    expect(formatTelefone('+1 415 555 0100')).toBe('+1 415 555 0100');
  });
  it('vazio vira string vazia', () => {
    expect(formatTelefone(undefined)).toBe('');
  });
});
