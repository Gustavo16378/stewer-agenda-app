/**
 * [12 Disponibilidade] — a tela nao pode reescrever o horario de um dia que o
 * profissional nem tocou.
 *
 * O modelo antigo colapsava a semana inteira em UM par {inicio, fim}: lia a
 * MENOR horaInicio e a MAIOR horaFim de todos os dias e, ao salvar, mandava
 * esse mesmo par para TODOS os dias ligados. Uma grade seg-sex 09:00-19:00 com
 * sabado 09:00-13:00 virava sabado 09:00-19:00 assim que o profissional
 * desligasse um dia qualquer — seis horas de sabado criadas sem ninguem pedir,
 * e clientes podendo reservar as 18:00 de um dia em que o estudio fecha as 13h.
 */
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TelaDisponibilidade } from '../disponibilidade';

// ---------------------------------------------------------------------------
// Mocks da camada de dados: a tela so fala com a API por estes hooks.
// ---------------------------------------------------------------------------

const mockSalvarMutate = jest.fn();
let mockFaixasDoServidor: {
  id: string;
  diaSemana: number;
  horaInicio: string;
  horaFim: string;
}[] = [];

jest.mock('@/api/hooks', () => ({
  useDisponibilidade: () => ({
    data: mockFaixasDoServidor,
    isLoading: false,
    isRefetching: false,
    error: null,
    refetch: jest.fn(),
  }),
  useBloqueios: () => ({
    data: [],
    isLoading: false,
    isRefetching: false,
    error: null,
    refetch: jest.fn(),
  }),
  useSalvarDisponibilidade: () => ({
    mutate: mockSalvarMutate,
    isPending: false,
    error: null,
    reset: jest.fn(),
  }),
  useCriarBloqueio: () => ({
    mutate: jest.fn(),
    isPending: false,
    error: null,
    reset: jest.fn(),
  }),
  useRemoverBloqueio: () => ({ mutate: jest.fn(), isPending: false, error: null }),
}));

/**
 * A tela usa useSafeAreaInsets; fora do app nao ha provedor nem medicao real.
 * `render` desta versao do Testing Library devolve uma Promise (React 19 com act
 * assincrono), entao toda renderizacao aqui e aguardada.
 */
const METRICAS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function renderizarTela() {
  return render(
    <SafeAreaProvider initialMetrics={METRICAS}>
      <TelaDisponibilidade profissionalId="prof-1" />
    </SafeAreaProvider>
  );
}

/** A grade real do estudio: seg-sex ate as 19h, sabado so ate as 13h. */
function gradeDaSemanaComSabadoCurto() {
  return [
    { id: 'a', diaSemana: 1, horaInicio: '09:00:00', horaFim: '19:00:00' },
    { id: 'b', diaSemana: 2, horaInicio: '09:00:00', horaFim: '19:00:00' },
    { id: 'c', diaSemana: 3, horaInicio: '09:00:00', horaFim: '19:00:00' },
    { id: 'd', diaSemana: 4, horaInicio: '09:00:00', horaFim: '19:00:00' },
    { id: 'e', diaSemana: 5, horaInicio: '09:00:00', horaFim: '19:00:00' },
    { id: 'f', diaSemana: 6, horaInicio: '09:00:00', horaFim: '13:00:00' },
  ];
}

/** O que foi enviado no PUT, ordenado para comparar sem ruido. */
function faixasEnviadas() {
  expect(mockSalvarMutate).toHaveBeenCalledTimes(1);
  const corpo = mockSalvarMutate.mock.calls[0][0] as {
    diaSemana: number;
    horaInicio: string;
    horaFim: string;
  }[];
  return [...corpo].sort(
    (x, y) => x.diaSemana - y.diaSemana || x.horaInicio.localeCompare(y.horaInicio)
  );
}

beforeEach(() => {
  mockSalvarMutate.mockClear();
  mockFaixasDoServidor = gradeDaSemanaComSabadoCurto();
});

describe('TelaDisponibilidade — horario por dia', () => {
  it('desligar a quarta nao altera o horario do sabado', async () => {
    const tela = await renderizarTela();

    fireEvent.press(tela.getByLabelText('Quarta'));
    fireEvent.press(await tela.findByText('SALVAR GRADE'));
    await waitFor(() => expect(mockSalvarMutate).toHaveBeenCalled());

    const enviadas = faixasEnviadas();
    expect(enviadas.map((f) => f.diaSemana)).toEqual([1, 2, 4, 5, 6]);

    const sabado = enviadas.filter((f) => f.diaSemana === 6);
    expect(sabado).toHaveLength(1);
    expect(sabado[0]).toMatchObject({ horaInicio: '09:00', horaFim: '13:00' });
  });

  it('os dias nao tocados mantem cada um o seu horario', async () => {
    const tela = await renderizarTela();

    fireEvent.press(tela.getByLabelText('Quarta'));
    fireEvent.press(await tela.findByText('SALVAR GRADE'));
    await waitFor(() => expect(mockSalvarMutate).toHaveBeenCalled());

    for (const f of faixasEnviadas()) {
      expect(f.horaFim).toBe(f.diaSemana === 6 ? '13:00' : '19:00');
    }
  });

  it('ligar um dia novo nao mexe no horario dos outros', async () => {
    const tela = await renderizarTela();

    fireEvent.press(tela.getByLabelText('Domingo'));
    fireEvent.press(await tela.findByText('SALVAR GRADE'));
    await waitFor(() => expect(mockSalvarMutate).toHaveBeenCalled());

    const enviadas = faixasEnviadas();
    expect(enviadas.map((f) => f.diaSemana)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(enviadas.find((f) => f.diaSemana === 6)).toMatchObject({
      horaInicio: '09:00',
      horaFim: '13:00',
    });
  });

  it('semana uniforme continua mostrando o horario unico do design', async () => {
    mockFaixasDoServidor = [
      { id: 'a', diaSemana: 1, horaInicio: '09:00:00', horaFim: '19:00:00' },
      { id: 'b', diaSemana: 2, horaInicio: '09:00:00', horaFim: '19:00:00' },
    ];
    const tela = await renderizarTela();

    expect(tela.getByLabelText('Início: 09:00')).toBeTruthy();
    expect(tela.getByLabelText('Término: 19:00')).toBeTruthy();
  });
});
