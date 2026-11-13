/**
 * [15 Dashboard] — o ADMIN precisa chegar na propria conta (e dela, sair).
 *
 * Num aparelho compartilhado do estudio, quem entrasse como administrador sem caminho
 * de saida ficava administrador ate o token vencer, oito horas depois. A acao CONTA do
 * cabecalho leva a tela de conta, que tem SAIR DA CONTA.
 */
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import VisaoGeral from '../visao-geral';

const mockSair = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
}));

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

jest.mock('@/theme/theme-context', () => ({
  useTema: () => ({ tema: 'light', preferencia: 'sistema', alternarTema: jest.fn() }),
  useCores: () => ({ gold: '#C9A96A', textMuted: '#665D52' }),
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
  useAniversariantes: () => ({ data: [], isLoading: false, error: null }),
  useSumidos: () => ({ data: [], isLoading: false, error: null }),
  useEstudioSalvo: () => ({ data: undefined }),
  useMeuProfissional: () => ({ profissional: null }),
  useFotoDeUsuario: () => ({ data: undefined }),
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

beforeEach(() => {
  mockSair.mockClear();
  mockPush.mockClear();
});

describe('VisaoGeral — caminho para o perfil do ADMIN', () => {
  it('mostra o atalho MEU PERFIL', async () => {
    const tela = await renderizarTela();
    expect(tela.getByText('Meu perfil')).toBeTruthy();
  });

  it('tocar em MEU PERFIL abre a tela de conta', async () => {
    const tela = await renderizarTela();

    fireEvent.press(tela.getByText('Meu perfil'));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/conta'));
  });
});
