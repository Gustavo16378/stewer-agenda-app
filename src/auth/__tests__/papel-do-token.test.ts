import { papelDoToken } from '../papel-do-token';

function token(corpo: object) {
  const b64 = Buffer.from(JSON.stringify(corpo)).toString('base64url');
  return `cabecalho.${b64}.assinatura`;
}

describe('papelDoToken', () => {
  it('le o papel de dentro do token', () => {
    expect(papelDoToken(token({ role: 'ADMIN', sub: 'x' }))).toBe('ADMIN');
  });

  it('aceita base64url com caracteres que precisam de troca', () => {
    expect(papelDoToken(token({ role: 'CLIENTE', nome: 'João ~~~ ???' }))).toBe('CLIENTE');
  });

  it('token ilegivel ou sem papel: undefined', () => {
    expect(papelDoToken('jwt-guardado')).toBeUndefined();
    expect(papelDoToken('a.%%%.c')).toBeUndefined();
    expect(papelDoToken(token({ sub: 'x' }))).toBeUndefined();
    expect(papelDoToken(undefined)).toBeUndefined();
  });
});
