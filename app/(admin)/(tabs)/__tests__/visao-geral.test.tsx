/**
 * [15 Dashboard] — o ADMIN precisa conseguir sair da conta.
 *
 * O CLIENTE sai pelo perfil e o PROFISSIONAL pelo cabecalho da agenda. O ADMIN
 * nao tinha caminho nenhum: `grep -rn "sair()" app src` so achava aqueles dois.
 * Num aparelho compartilhado do estudio, quem entrasse como administrador ficava
 * administrador ate o token vencer, oito horas depois.
 */
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import VisaoGeral from '../visao-geral';

const mockSair = jest.fn();

jest.mock('@/auth/auth-context', () => ({
  useAuth: () => ({
    status: 'autenticado',
    usuario: { id: 'u1', nome: 'Gabriel Admin', email: 'admin@stewer.dev', role: 'ADMIN' },
    role: 'ADMIN',
    entrar: jest.fn(),
    registrar: jest.fn(),
    sair: mockSair,
  }),
  rotaInicialDoPapel: () => '/(admin)/(tabs)/visao-geral',
}));

jest.mock('@/api/hooks', () => ({
  useProfissionais: () => ({
    data: [],
    isLoading: false,
    isRefetching: false,
    error: null,
    refetch: jest.fn(),
  }),
  useAgendaDeVariosDias: () => ({
    porDia: new Map(),
    carregando: false,
    erro: null,
    refetch: jest.fn(),
  }),
  useDisponibilidadesDe: () => ({ grades: [], carregando: false, erro: null }),
  useTodosClientes: () => ({
    data: [],
    isLoading: false,
    isRefetching: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

const METRICAS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function renderizarTela() {
  return render(
    <SafeAreaProvider initialMetrics={METRICAS}>
      <VisaoGeral />
    </SafeAreaProvider>
  );
}

beforeEach(() => mockSair.mockClear());

describe('VisaoGeral — saida de conta do ADMIN', () => {
  it('mostra a acao SAIR', async () => {
    const tela = await renderizarTela();
    expect(tela.getByText('SAIR')).toBeTruthy();
  });

  it('tocar em SAIR encerra a sessao', async () => {
    const tela = await renderizarTela();

    fireEvent.press(tela.getByText('SAIR'));

    await waitFor(() => expect(mockSair).toHaveBeenCalledTimes(1));
  });
});
