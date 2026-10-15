/**
 * A abertura do app: restaurar a sessao guardada sem travar e sem deslogar
 * quem apenas esta sem sinal.
 *
 * Dois defeitos moravam aqui:
 *   1. o `catch` da restauracao nao olhava o TIPO do erro. Qualquer falha em
 *      `GET /auth/eu` -- inclusive "Network request failed" -- apagava o token
 *      do SecureStore. Como nao ha refresh token, abrir o app no metro
 *      obrigava a digitar a senha de novo, e a sessao de 8h ia embora.
 *   2. o estado nascia em 'carregando' e so saia depois daquela chamada. Numa
 *      rede que aceita a conexao e nao responde, a splash ficava para sempre.
 */
import { act, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { ApiError } from '@/api/errors';
import * as sessionStore from '@/api/session-store';

import { AuthProvider, useAuth } from '../auth-context';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGet = jest.fn();
const mockDesembrulha = jest.fn();

jest.mock('@/api/client', () => ({
  api: { GET: (...args: unknown[]) => mockGet(...args), POST: jest.fn() },
  definirSessaoAtiva: jest.fn(),
  definirAoDeslogar: jest.fn(),
  desembrulha: (p: unknown) => mockDesembrulha(p),
  desembrulhaCriado: (p: unknown) => mockDesembrulha(p),
}));

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ clear: jest.fn() }),
}));

const USUARIO = {
  id: 'u-1',
  tenantId: 't-1',
  nome: 'Joana Ribeiro',
  email: 'joana@exemplo.dev',
  role: 'CLIENTE' as const,
};

function Sonda() {
  const { status, role } = useAuth();
  return <Text testID="estado">{`${status}|${role ?? '-'}`}</Text>;
}

function montar() {
  return render(
    <AuthProvider>
      <Sonda />
    </AuthProvider>
  );
}

const umaHora = () => Date.now() + 60 * 60 * 1000;

beforeEach(async () => {
  jest.clearAllMocks();
  await sessionStore.apagarSessao();
});

describe('restauracao ao abrir o app', () => {
  it('sem sessao guardada, sai de carregando e vai para deslogado', async () => {
    const tela = await montar();

    await waitFor(() => expect(tela.getByTestId('estado')).toHaveTextContent('deslogado|-'));
  });

  it('falha de REDE nao apaga o token nem desloga', async () => {
    await sessionStore.gravarSessao({
      token: 'jwt-guardado',
      expiraEm: umaHora(),
      usuario: USUARIO,
    });
    mockDesembrulha.mockRejectedValue(
      new ApiError({ status: 0, mensagem: 'Network request failed', kind: 'rede' })
    );

    const tela = await montar();

    await waitFor(() => expect(tela.getByTestId('estado')).toHaveTextContent('autenticado|CLIENTE'));
    expect(await sessionStore.lerSessao()).not.toBeNull();
  });

  it('erro de SERVIDOR tambem nao apaga o token', async () => {
    await sessionStore.gravarSessao({
      token: 'jwt-guardado',
      expiraEm: umaHora(),
      usuario: USUARIO,
    });
    mockDesembrulha.mockRejectedValue(
      new ApiError({ status: 503, mensagem: 'indisponivel', kind: 'servidor' })
    );

    const tela = await montar();

    await waitFor(() => expect(tela.getByTestId('estado')).toHaveTextContent('autenticado|CLIENTE'));
    expect(await sessionStore.lerSessao()).not.toBeNull();
  });

  it('401 de verdade desloga e apaga o token', async () => {
    await sessionStore.gravarSessao({
      token: 'jwt-revogado',
      expiraEm: umaHora(),
      usuario: USUARIO,
    });
    mockDesembrulha.mockRejectedValue(
      new ApiError({ status: 401, mensagem: 'token invalido', kind: 'autenticacao' })
    );

    const tela = await montar();

    await waitFor(() => expect(tela.getByTestId('estado')).toHaveTextContent('deslogado|-'));
    expect(await sessionStore.lerSessao()).toBeNull();
  });

  it('a chamada que nunca responde nao prende a splash', async () => {
    await sessionStore.gravarSessao({
      token: 'jwt-guardado',
      expiraEm: umaHora(),
      usuario: USUARIO,
    });
    // Promise que nao resolve nem rejeita: a rede aceitou e emudeceu.
    mockDesembrulha.mockReturnValue(new Promise(() => {}));

    const tela = await montar();

    await waitFor(() =>
      expect(tela.getByTestId('estado')).toHaveTextContent('autenticado|CLIENTE')
    );
  });

  it('sessao vencida vai para o login mesmo sem rede', async () => {
    await sessionStore.gravarSessao({
      token: 'jwt-vencido',
      expiraEm: Date.now() - 1000,
      usuario: USUARIO,
    });
    mockDesembrulha.mockRejectedValue(
      new ApiError({ status: 0, mensagem: 'sem rede', kind: 'rede' })
    );

    const tela = await montar();

    await waitFor(() => expect(tela.getByTestId('estado')).toHaveTextContent('deslogado|-'));
    expect(await sessionStore.lerSessao()).toBeNull();
  });

  it('confirmacao bem-sucedida atualiza o usuario guardado', async () => {
    await sessionStore.gravarSessao({
      token: 'jwt-guardado',
      expiraEm: umaHora(),
      usuario: { ...USUARIO, role: 'CLIENTE' as const },
    });
    mockDesembrulha.mockResolvedValue({ ...USUARIO, role: 'PROFISSIONAL' as const });

    const tela = await montar();

    await waitFor(() =>
      expect(tela.getByTestId('estado')).toHaveTextContent('autenticado|PROFISSIONAL')
    );
  });
});

describe('sair', () => {
  it('limpa a sessao guardada', async () => {
    await sessionStore.gravarSessao({
      token: 'jwt-guardado',
      expiraEm: umaHora(),
      usuario: USUARIO,
    });
    mockDesembrulha.mockResolvedValue(USUARIO);

    let sairDaConta: (() => Promise<void>) | null = null;
    function SondaComSair() {
      const { status, sair } = useAuth();
      sairDaConta = sair;
      return <Text testID="estado">{status}</Text>;
    }
    const tela = await render(
      <AuthProvider>
        <SondaComSair />
      </AuthProvider>
    );

    await waitFor(() => expect(tela.getByTestId('estado')).toHaveTextContent('autenticado'));
    await act(async () => {
      await sairDaConta?.();
    });

    await waitFor(() => expect(tela.getByTestId('estado')).toHaveTextContent('deslogado'));
    expect(await sessionStore.lerSessao()).toBeNull();
  });
});
