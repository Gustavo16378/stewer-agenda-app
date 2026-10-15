/**
 * A traducao entre o `Disponibilidade[]` da API e o modelo da tela.
 *
 * O teste de tela prova o comportamento pelo toque; aqui a mesma regra e
 * exercitada direto nas funcoes, onde cabe cobrir as bordas sem montar a
 * arvore: dia com almoco, dia unico, semana divergente, ida e volta.
 */
import type { Disponibilidade } from '@/api/types';

import { faixasDaGrade, gradeDeFaixas, horarioUniforme } from '../disponibilidade';

const faixa = (diaSemana: number, horaInicio: string, horaFim: string): Disponibilidade =>
  ({ id: `${diaSemana}-${horaInicio}`, diaSemana, horaInicio, horaFim }) as Disponibilidade;

describe('gradeDeFaixas', () => {
  it('da a cada dia o horario daquele dia, sem nivelar pela semana', () => {
    const grade = gradeDeFaixas([
      faixa(1, '09:00:00', '19:00:00'),
      faixa(6, '09:00:00', '13:00:00'),
    ]);

    expect(grade[1]).toEqual({ inicio: '09:00', fim: '19:00', intervalo: null });
    expect(grade[6]).toEqual({ inicio: '09:00', fim: '13:00', intervalo: null });
  });

  it('duas faixas no mesmo dia viram o intervalo de almoco daquele dia', () => {
    const grade = gradeDeFaixas([
      faixa(2, '09:00:00', '12:30:00'),
      faixa(2, '13:30:00', '19:00:00'),
    ]);

    expect(grade[2]).toEqual({
      inicio: '09:00',
      fim: '19:00',
      intervalo: { inicio: '12:30', fim: '13:30' },
    });
  });

  it('aceita HH:mm e HH:mm:ss, porque a API devolve um e aceita o outro', () => {
    expect(gradeDeFaixas([faixa(3, '09:00', '19:00')])[3]).toEqual({
      inicio: '09:00',
      fim: '19:00',
      intervalo: null,
    });
  });

  it('ignora faixa com hora ilegivel em vez de inventar horario', () => {
    expect(gradeDeFaixas([faixa(4, 'nao-e-hora', '19:00:00')])[4]).toBeUndefined();
  });

  it('grade vazia e uma semana sem nenhum dia ligado', () => {
    expect(gradeDeFaixas([])).toEqual({});
  });
});

describe('faixasDaGrade', () => {
  it('emite o horario proprio de cada dia', () => {
    const grade = gradeDeFaixas([
      faixa(1, '09:00:00', '19:00:00'),
      faixa(6, '09:00:00', '13:00:00'),
    ]);

    expect(faixasDaGrade(grade)).toEqual([
      { diaSemana: 1, horaInicio: '09:00', horaFim: '19:00' },
      { diaSemana: 6, horaInicio: '09:00', horaFim: '13:00' },
    ]);
  });

  it('dia com intervalo vira duas faixas, em volta da folga', () => {
    const grade = gradeDeFaixas([
      faixa(2, '09:00:00', '12:30:00'),
      faixa(2, '13:30:00', '19:00:00'),
    ]);

    expect(faixasDaGrade(grade)).toEqual([
      { diaSemana: 2, horaInicio: '09:00', horaFim: '12:30' },
      { diaSemana: 2, horaInicio: '13:30', horaFim: '19:00' },
    ]);
  });

  it('ida e volta nao perde nem inventa horario', () => {
    const original = [
      faixa(1, '09:00:00', '19:00:00'),
      faixa(3, '10:00:00', '14:00:00'),
      faixa(6, '09:00:00', '13:00:00'),
    ];

    expect(faixasDaGrade(gradeDeFaixas(original))).toEqual([
      { diaSemana: 1, horaInicio: '09:00', horaFim: '19:00' },
      { diaSemana: 3, horaInicio: '10:00', horaFim: '14:00' },
      { diaSemana: 6, horaInicio: '09:00', horaFim: '13:00' },
    ]);
  });

  it('sai ordenado por dia da semana, comecando no domingo', () => {
    const grade = gradeDeFaixas([faixa(6, '09:00', '13:00'), faixa(0, '10:00', '12:00')]);
    expect(faixasDaGrade(grade).map((f) => f.diaSemana)).toEqual([0, 6]);
  });
});

describe('horarioUniforme', () => {
  it('devolve o horario quando todos os dias batem', () => {
    const grade = gradeDeFaixas([faixa(1, '09:00', '19:00'), faixa(2, '09:00', '19:00')]);
    expect(horarioUniforme(grade)).toEqual({ inicio: '09:00', fim: '19:00', intervalo: null });
  });

  it('devolve null quando um dia diverge — e a tela passa a listar dia a dia', () => {
    const grade = gradeDeFaixas([faixa(1, '09:00', '19:00'), faixa(6, '09:00', '13:00')]);
    expect(horarioUniforme(grade)).toBeNull();
  });

  it('semana sem dia ligado nao tem horario uniforme', () => {
    expect(horarioUniforme({})).toBeNull();
  });
});
