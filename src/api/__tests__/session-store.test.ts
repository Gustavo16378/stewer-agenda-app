/**
 * A sessao guardada. Como nao ha refresh token, a conta de expiracao e o que separa
 * "usuario logado" de "usuario que vai levar 401 no meio da tela".
 */
import * as SecureStore from 'expo-secure-store';

import { MARGEM_EXPIRACAO_MS } from '../config';
import {
  apagarSessao,
  expiraEmDeSegundos,
  gravarSessao,
  lerSessao,
  sessaoValida,
} from '../session-store';

const AGORA = 1_800_000_000_000; // instante fixo, para a conta nao depender do relogio

beforeEach(async () => {
  await apagarSessao();
  jest.clearAllMocks();
});

describe('expiraEmDeSegundos', () => {
  it('converte o expiraEmSegundos do login no instante absoluto', () => {
    // 28800s = 8h, que e o que a API do seed devolve
    expect(expiraEmDeSegundos(28_800, AGORA)).toBe(AGORA + 28_800_000);
  });

  it('campo ausente vira sessao ja vencida, nao eterna', () => {
    // errar para o lado seguro: sem o campo, melhor pedir login de novo
    expect(expiraEmDeSegundos(undefined, AGORA)).toBe(AGORA);
    expect(
      sessaoValida({ token: 't', expiraEm: expiraEmDeSegundos(undefined, AGORA) }, AGORA)
    ).toBe(false);
  });

  it('valor negativo nao anda para tras', () => {
    expect(expiraEmDeSegundos(-500, AGORA)).toBe(AGORA);
  });
});

describe('sessaoValida', () => {
  it('token com folga e valido', () => {
    expect(sessaoValida({ token: 't', expiraEm: AGORA + 3_600_000 }, AGORA)).toBe(true);
  });

  it('token vencido nao e valido', () => {
    expect(sessaoValida({ token: 't', expiraEm: AGORA - 1 }, AGORA)).toBe(false);
  });

  it('token que vence DENTRO da margem ja conta como vencido', () => {
    // a margem existe para o token nao morrer no meio do voo da requisicao
    const dentroDaMargem = AGORA + MARGEM_EXPIRACAO_MS - 1;
    expect(sessaoValida({ token: 't', expiraEm: dentroDaMargem }, AGORA)).toBe(false);

    const foraDaMargem = AGORA + MARGEM_EXPIRACAO_MS + 1;
    expect(sessaoValida({ token: 't', expiraEm: foraDaMargem }, AGORA)).toBe(true);
  });

  it('null nao e sessao valida', () => {
    expect(sessaoValida(null, AGORA)).toBe(false);
  });
});

describe('persistencia no SecureStore', () => {
  it('grava e le de volta', async () => {
    await gravarSessao({ token: 'jwt-abc', expiraEm: AGORA + 3_600_000 });
    await expect(lerSessao()).resolves.toEqual({
      token: 'jwt-abc',
      expiraEm: AGORA + 3_600_000,
    });
  });

  it('apagar remove os dois campos', async () => {
    await gravarSessao({ token: 'jwt-abc', expiraEm: AGORA });
    await apagarSessao();
    await expect(lerSessao()).resolves.toBeNull();
  });

  it('sem token guardado, devolve null', async () => {
    await expect(lerSessao()).resolves.toBeNull();
  });

  it('expiracao corrompida invalida a sessao inteira', async () => {
    // um token sem expiracao legivel nao da para julgar: melhor tratar como deslogado
    await SecureStore.setItemAsync('stewer.jwt', 'jwt-abc');
    await SecureStore.setItemAsync('stewer.jwt.expiraEm', 'nao-e-numero');
    await expect(lerSessao()).resolves.toBeNull();
  });

  it('SecureStore indisponivel nao derruba o app', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(
      new Error('SecureStore is not available on this device')
    );
    await expect(lerSessao()).resolves.toBeNull();
  });

  it('o JWT nunca e gravado em texto fora do SecureStore', async () => {
    await gravarSessao({ token: 'jwt-secreto', expiraEm: AGORA });
    // a unica escrita permitida e a do SecureStore
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('stewer.jwt', 'jwt-secreto');
  });
});

describe('resiliencia do SecureStore', () => {
  it('gravar falhando nao derruba o login (a sessao em memoria ainda vale)', async () => {
    const avisar = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    (SecureStore.setItemAsync as jest.Mock).mockRejectedValueOnce(new Error('keychain travado'));

    await expect(gravarSessao({ token: 'jwt', expiraEm: AGORA })).resolves.toBe(false);
    expect(avisar).toHaveBeenCalled();
    avisar.mockRestore();
  });

  it('gravar com sucesso devolve true', async () => {
    await expect(gravarSessao({ token: 'jwt', expiraEm: AGORA })).resolves.toBe(true);
  });
});
