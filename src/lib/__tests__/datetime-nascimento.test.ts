import { mascaraData, nascimentoValido } from '../datetime';

describe('mascaraData', () => {
  it('poe as barras enquanto digita', () => {
    expect(mascaraData('2')).toBe('2');
    expect(mascaraData('2011')).toBe('20/11');
    expect(mascaraData('20111994')).toBe('20/11/1994');
    expect(mascaraData('20/11/1994 extra 99')).toBe('20/11/1994');
  });
});

describe('nascimentoValido', () => {
  it('aceita data real no passado', () => {
    expect(nascimentoValido('20/11/1994')).toBe('1994-11-20');
  });

  it('recusa data impossivel, futura ou antes de 1900', () => {
    expect(nascimentoValido('31/02/1994')).toBeNull();
    expect(nascimentoValido('01/01/2999')).toBeNull();
    expect(nascimentoValido('01/01/1850')).toBeNull();
    expect(nascimentoValido('20/11')).toBeNull();
  });
});
