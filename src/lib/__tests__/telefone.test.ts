import { formatTelefone, mascaraTelefone } from '../telefone';

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

describe('mascaraTelefone', () => {
  it('formata o celular enquanto digita', () => {
    expect(mascaraTelefone('6')).toBe('(6');
    expect(mascaraTelefone('63')).toBe('(63');
    expect(mascaraTelefone('639')).toBe('(63) 9');
    expect(mascaraTelefone('6398511')).toBe('(63) 9851-1');
    expect(mascaraTelefone('63985116783')).toBe('(63) 9 8511-6783');
  });
  it('fixo de 10 digitos e entrada suja', () => {
    expect(mascaraTelefone('6332150000')).toBe('(63) 3215-0000');
    expect(mascaraTelefone('(63) 9 8511-67831234')).toBe('(63) 9 8511-6783');
    expect(mascaraTelefone('abc')).toBe('');
    expect(mascaraTelefone('+5563985116783')).toBe('(63) 9 8511-6783');
  });
});
