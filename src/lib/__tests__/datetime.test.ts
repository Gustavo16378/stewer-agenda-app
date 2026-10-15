/**
 * Os testes rodam com TZ=America/Sao_Paulo (jest.global-setup.js).
 * Esse fuso e UTC-3 o ano todo desde 2019 (o Brasil acabou com o horario de verao),
 * entao "meia-noite local" e sempre 03:00Z — e e nessa borda que mora o bug classico.
 */
import {
  calendarDateDoInstante,
  cobreODiaInteiro,
  comparaWallTime,
  diaSemanaDe,
  faixasSobrepoem,
  faixaValida,
  formatDataBr,
  formatDiaCalendarioCaps,
  formatDiaCurtoCaps,
  formatDiaMesCurto,
  formatDiaMesCurtoCaps,
  formatDiaNumero,
  formatDiaSemanaDiaMes,
  formatDiaSemanaEData,
  formatDiaSemanaLongoCaps,
  formatFaixaAgendamento,
  formatFaixaDiasCaps,
  formatFaixaHoras,
  formatFaixaPorDuracao,
  formatHora,
  formatMesAno,
  formatMesAnoCurto,
  formatMesAnoLongoCaps,
  formatMesCurtoCaps,
  formatWallTime,
  gradeDoMes,
  hojeCalendarDate,
  inicialDiaSemana,
  instanteDe,
  isDiaSemana,
  isHoje,
  isPassado,
  mesAnterior,
  mesmoDiaLocal,
  minutosParaWallTime,
  nomeDiaSemana,
  nomeDiaSemanaCurtoCaps,
  nomeMesCaps,
  noMesmoMesLocal,
  parseCalendarDate,
  parseDataBr,
  parseInstant,
  parseWallTime,
  primeiroNome,
  saudacao,
  semanaDe,
  somaDias,
  toCalendarDate,
  toInstant,
  wallTimeParaMinutos,
  type DiaSemana,
} from '../datetime';

describe('sanidade do ambiente', () => {
  it('roda em America/Sao_Paulo (UTC-3), senao os testes de borda nao provam nada', () => {
    expect(new Date(2026, 8, 14).getTimezoneOffset()).toBe(180); // minutos ATRAS de UTC
  });
});

// ---------------------------------------------------------------------------

describe('instantes', () => {
  it('parseia ISO com Z e com offset explicito para o mesmo ponto no tempo', () => {
    const comZ = parseInstant('2026-09-14T12:00:00Z');
    const comOffset = parseInstant('2026-09-14T09:00:00-03:00');
    expect(comZ).not.toBeNull();
    expect(comZ!.getTime()).toBe(comOffset!.getTime());
  });

  it('devolve null para lixo, string vazia, null e undefined', () => {
    expect(parseInstant('nao e data')).toBeNull();
    expect(parseInstant('')).toBeNull();
    expect(parseInstant(null)).toBeNull();
    expect(parseInstant(undefined)).toBeNull();
  });

  it('exibe a hora no fuso do aparelho, nao em UTC', () => {
    // 12:00Z em UTC-3 sao 09:00 locais
    expect(formatHora('2026-09-14T12:00:00Z')).toBe('09:00');
  });

  it('exibe a hora igual venha em Z ou em offset -03:00', () => {
    expect(formatHora('2026-09-14T12:00:00Z')).toBe(formatHora('2026-09-14T09:00:00-03:00'));
  });

  it('slot de grade 09:00 chega resolvido no fuso do estudio e aparece 09:00', () => {
    // A API converte a hora de parede da grade pelo tenant.fuso (America/Araguaina)
    // antes de devolver o instante. Num aparelho em UTC-3 a tela bate com o relogio
    // de quem atende, que e o ponto todo da correcao.
    expect(formatHora('2026-09-14T09:00:00-03:00')).toBe('09:00');
  });

  it('formata o carimbo curto em caps igual ao design ("SEX, 11 SET")', () => {
    // 11/09/2026 e sexta; 15:30 local = 18:30Z
    expect(formatDiaCurtoCaps('2026-09-11T18:30:00Z')).toBe('SEX, 11 SET');
  });

  it('formata a faixa completa do card do design', () => {
    expect(formatFaixaAgendamento('2026-09-11T18:30:00Z', '2026-09-11T19:30:00Z')).toBe(
      'SEX, 11 SET · 15:30 — 16:30'
    );
  });

  it('formata so as horas quando o dia ja esta no cabecalho', () => {
    expect(formatFaixaHoras('2026-09-11T18:30:00Z', '2026-09-11T19:30:00Z')).toBe('15:30 — 16:30');
  });

  it('degrada para string vazia em vez de "Invalid Date" na tela', () => {
    expect(formatHora(undefined)).toBe('');
    expect(formatDiaCurtoCaps(null)).toBe('');
    expect(formatFaixaAgendamento(null, null)).toBe('');
    expect(formatFaixaHoras(undefined, undefined)).toBe('');
  });

  it('formata o cabecalho longo da home ("TERÇA-FEIRA, 1 DE SETEMBRO")', () => {
    expect(formatDiaSemanaLongoCaps(new Date(2026, 8, 1))).toBe('TERÇA-FEIRA, 1 DE SETEMBRO');
  });

  it('serializa sempre com offset, via toISOString', () => {
    // 09:00 local em UTC-3 = 12:00Z
    expect(toInstant(new Date(2026, 8, 14, 9, 0, 0))).toBe('2026-09-14T12:00:00.000Z');
  });

  it('isPassado compara instantes, nao strings', () => {
    const agora = new Date('2026-09-14T12:00:00Z');
    expect(isPassado('2026-09-14T11:59:59Z', agora)).toBe(true);
    expect(isPassado('2026-09-14T12:00:01Z', agora)).toBe(false);
    expect(isPassado(null, agora)).toBe(false);
  });
});

// ---------------------------------------------------------------------------

describe('datas de calendario — a borda da meia-noite', () => {
  it('usa os componentes LOCAIS, nao UTC (o bug do toISOString().slice(0,10))', () => {
    // 21:00 local de 13/09 = 00:00Z de 14/09.
    const noite = new Date(2026, 8, 13, 21, 0, 0);
    expect(toCalendarDate(noite)).toBe('2026-09-13');
    // prova que a versao ingenua erraria:
    expect(noite.toISOString().slice(0, 10)).toBe('2026-09-14');
    expect(toCalendarDate(noite)).not.toBe(noite.toISOString().slice(0, 10));
  });

  it('acerta o dia as 23:59:59 locais', () => {
    const quaseMeiaNoite = new Date(2026, 8, 13, 23, 59, 59);
    expect(toCalendarDate(quaseMeiaNoite)).toBe('2026-09-13');
    expect(quaseMeiaNoite.toISOString().slice(0, 10)).toBe('2026-09-14'); // UTC ja virou
  });

  it('acerta o dia as 00:00:00 locais', () => {
    expect(toCalendarDate(new Date(2026, 8, 14, 0, 0, 0))).toBe('2026-09-14');
  });

  it('acerta o dia as 00:00:01 locais (recem-virado)', () => {
    expect(toCalendarDate(new Date(2026, 8, 14, 0, 0, 1))).toBe('2026-09-14');
  });

  it('hojeCalendarDate a noite devolve HOJE, nao amanha', () => {
    expect(hojeCalendarDate(new Date(2026, 8, 13, 22, 30))).toBe('2026-09-13');
  });

  it('parseCalendarDate cria meia-noite LOCAL, nao meia-noite UTC', () => {
    const d = parseCalendarDate('2026-09-14')!;
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(8);
    expect(d.getDate()).toBe(14);
    expect(d.getHours()).toBe(0);
    // a versao ingenua cairia no dia anterior
    expect(new Date('2026-09-14').getDate()).toBe(13);
  });

  it('ida e volta Date -> CalendarDate -> Date preserva o dia', () => {
    for (const hora of [0, 1, 12, 21, 23]) {
      const original = new Date(2026, 8, 13, hora, 30);
      const voltou = parseCalendarDate(toCalendarDate(original))!;
      expect(voltou.getDate()).toBe(original.getDate());
      expect(voltou.getMonth()).toBe(original.getMonth());
    }
  });

  it('rejeita formato invalido e data inexistente', () => {
    expect(parseCalendarDate('14/09/2026')).toBeNull();
    expect(parseCalendarDate('2026-9-14')).toBeNull();
    expect(parseCalendarDate('2026-02-31')).toBeNull(); // rolaria para marco
    expect(parseCalendarDate('2026-13-01')).toBeNull();
    expect(parseCalendarDate('')).toBeNull();
  });

  it('aceita 29 de fevereiro em ano bissexto', () => {
    expect(parseCalendarDate('2028-02-29')).not.toBeNull();
    expect(parseCalendarDate('2026-02-29')).toBeNull();
  });

  it('calendarDateDoInstante devolve o dia LOCAL do instante', () => {
    // 02:00Z de 14/09 ainda e dia 13 as 23:00 em UTC-3
    expect(calendarDateDoInstante('2026-09-14T02:00:00Z')).toBe('2026-09-13');
    expect(calendarDateDoInstante('2026-09-14T03:00:00Z')).toBe('2026-09-14'); // exatamente 00:00 local
    expect(calendarDateDoInstante(null)).toBeNull();
  });

  it('somaDias atravessa virada de mes e de ano sem escorregar', () => {
    expect(somaDias('2026-09-30', 1)).toBe('2026-10-01');
    expect(somaDias('2026-12-31', 1)).toBe('2027-01-01');
    expect(somaDias('2026-01-01', -1)).toBe('2025-12-31');
    expect(somaDias('2028-02-28', 1)).toBe('2028-02-29');
    expect(somaDias('lixo', 1)).toBeNull();
  });

  it('formatMesAno capitaliza o mes como o design ("Setembro 2026")', () => {
    expect(formatMesAno(new Date(2026, 8, 1))).toBe('Setembro 2026');
  });

  it('formatDiaCalendarioCaps da o carimbo do frame 06 ("SEXTA, 11 SET")', () => {
    // o design escreve SEXTA, nao SEX: em pt-BR o EEEE do date-fns e "sexta-feira"
    expect(formatDiaCalendarioCaps('2026-09-11')).toBe('SEXTA, 11 SET');
    expect(formatDiaCalendarioCaps('2026-09-12')).toBe('SÁBADO, 12 SET');
    expect(formatDiaCalendarioCaps('2026-09-13')).toBe('DOMINGO, 13 SET');
    expect(formatDiaCalendarioCaps('2026-05-03')).toBe('DOMINGO, 3 MAI');
    expect(formatDiaCalendarioCaps('lixo')).toBe('');
  });
});

// ---------------------------------------------------------------------------

describe('hora de parede — nunca vira instante', () => {
  it('aceita HH:mm:ss (o que a API devolve) e normaliza para HH:mm (o que ela aceita)', () => {
    expect(parseWallTime('09:00:00')).toBe('09:00');
    expect(parseWallTime('19:00:00')).toBe('19:00');
    expect(parseWallTime('09:00')).toBe('09:00');
  });

  it('nao desloca por fuso: 09:00 continua 09:00 em UTC-3', () => {
    // se alguem "convertesse", isto viraria 06:00 ou 12:00
    expect(parseWallTime('09:00:00')).toBe('09:00');
    expect(formatWallTime('09:00:00')).toBe('09:00');
  });

  it('preserva meia-noite e o ultimo minuto do dia', () => {
    expect(parseWallTime('00:00:00')).toBe('00:00');
    expect(parseWallTime('23:59')).toBe('23:59');
  });

  it('rejeita hora invalida', () => {
    expect(parseWallTime('24:00')).toBeNull();
    expect(parseWallTime('09:60')).toBeNull();
    expect(parseWallTime('9:00')).toBeNull();
    expect(parseWallTime('agora')).toBeNull();
    expect(parseWallTime(null)).toBeNull();
    expect(formatWallTime(undefined)).toBe('');
  });

  it('converte para minutos e volta sem perder nada', () => {
    expect(wallTimeParaMinutos('09:00')).toBe(540);
    expect(wallTimeParaMinutos('19:30:00')).toBe(1170);
    expect(wallTimeParaMinutos('00:00')).toBe(0);
    expect(minutosParaWallTime(540)).toBe('09:00');
    expect(minutosParaWallTime(0)).toBe('00:00');
    expect(minutosParaWallTime(1439)).toBe('23:59');
    expect(minutosParaWallTime(-1)).toBeNull();
    expect(minutosParaWallTime(1.5)).toBeNull();
  });

  it('ordena faixas do mesmo dia', () => {
    const faixas = ['19:00:00', '09:00:00', '13:30'];
    expect([...faixas].sort(comparaWallTime)).toEqual(['09:00:00', '13:30', '19:00:00']);
  });

  it('faixaValida exige inicio estritamente antes do fim (a API rejeita fim <= inicio)', () => {
    expect(faixaValida('09:00', '19:00')).toBe(true);
    expect(faixaValida('09:00', '09:00')).toBe(false);
    expect(faixaValida('19:00', '09:00')).toBe(false);
    expect(faixaValida('lixo', '19:00')).toBe(false);
  });

  it('detecta sobreposicao no mesmo dia (a API tambem rejeita)', () => {
    const manha = { horaInicio: '09:00', horaFim: '12:00' };
    const tarde = { horaInicio: '13:00', horaFim: '18:00' };
    const emcima = { horaInicio: '11:00', horaFim: '14:00' };
    expect(faixasSobrepoem(manha, tarde)).toBe(false);
    expect(faixasSobrepoem(manha, emcima)).toBe(true);
    expect(faixasSobrepoem(tarde, emcima)).toBe(true);
    // encostar nao e sobrepor
    expect(faixasSobrepoem(manha, { horaInicio: '12:00', horaFim: '13:00' })).toBe(false);
  });
});

// ---------------------------------------------------------------------------

describe('dia da semana', () => {
  it('usa a mesma convencao de Date.getDay(): 0 = domingo ... 6 = sabado', () => {
    // 13/09/2026 e domingo, 14 e segunda, 19 e sabado
    expect(diaSemanaDe('2026-09-13')).toBe(0);
    expect(diaSemanaDe('2026-09-14')).toBe(1);
    expect(diaSemanaDe('2026-09-19')).toBe(6);
    expect(parseCalendarDate('2026-09-13')!.getDay()).toBe(diaSemanaDe('2026-09-13'));
  });

  it('nao escorrega de dia por fuso (o dia da semana e do calendario local)', () => {
    // se parseCalendarDate usasse UTC, 2026-09-13 viraria sabado (6) aqui
    expect(diaSemanaDe('2026-09-13')).not.toBe(6);
  });

  it('nomeia e abrevia os dias como o design', () => {
    const esperado: Record<DiaSemana, [string, string]> = {
      0: ['Domingo', 'D'],
      1: ['Segunda', 'S'],
      2: ['Terça', 'T'],
      3: ['Quarta', 'Q'],
      4: ['Quinta', 'Q'],
      5: ['Sexta', 'S'],
      6: ['Sábado', 'S'],
    };
    for (const [dia, [nome, inicial]] of Object.entries(esperado)) {
      const d = Number(dia) as DiaSemana;
      expect(nomeDiaSemana(d)).toBe(nome);
      expect(inicialDiaSemana(d)).toBe(inicial);
    }
  });

  it('isDiaSemana valida o intervalo da API', () => {
    expect(isDiaSemana(0)).toBe(true);
    expect(isDiaSemana(6)).toBe(true);
    expect(isDiaSemana(7)).toBe(false);
    expect(isDiaSemana(-1)).toBe(false);
    expect(isDiaSemana(1.5)).toBe(false);
  });
});

// ---------------------------------------------------------------------------

describe('grade do mes (calendario da tela 06)', () => {
  it('alinha o dia 1 na coluna certa e fecha em semanas completas', () => {
    // setembro/2026 comeca numa terca (getDay()===2)
    const celulas = gradeDoMes(2026, 8);
    expect(celulas.length % 7).toBe(0);
    expect(celulas[0]).toBeNull();
    expect(celulas[1]).toBeNull();
    expect(celulas[2]).toBe('2026-09-01');
    expect(celulas.filter(Boolean)).toHaveLength(30);
    expect(celulas.filter(Boolean).at(-1)).toBe('2026-09-30');
  });

  it('nao deixa nenhum dia fora e todos sao do mes pedido', () => {
    for (const mes of [0, 1, 5, 11]) {
      const celulas = gradeDoMes(2026, mes).filter(Boolean) as string[];
      const esperados = new Date(2026, mes + 1, 0).getDate();
      expect(celulas).toHaveLength(esperados);
      expect(new Set(celulas).size).toBe(esperados);
      for (const c of celulas) expect(parseCalendarDate(c)!.getMonth()).toBe(mes);
    }
  });

  it('fevereiro bissexto tem 29 dias', () => {
    expect(gradeDoMes(2028, 1).filter(Boolean)).toHaveLength(29);
    expect(gradeDoMes(2026, 1).filter(Boolean)).toHaveLength(28);
  });

  it('a primeira celula preenchida cai na coluna do getDay() do dia 1', () => {
    for (const mes of [0, 3, 8, 11]) {
      const celulas = gradeDoMes(2026, mes);
      const idx = celulas.findIndex(Boolean);
      expect(idx).toBe(new Date(2026, mes, 1).getDay());
    }
  });
});

describe('saudacao e primeiro nome', () => {
  it('muda com a hora LOCAL do aparelho', () => {
    expect(saudacao(new Date(2026, 8, 14, 0, 0))).toBe('Bom dia');
    expect(saudacao(new Date(2026, 8, 14, 11, 59))).toBe('Bom dia');
    expect(saudacao(new Date(2026, 8, 14, 12, 0))).toBe('Boa tarde');
    expect(saudacao(new Date(2026, 8, 14, 17, 59))).toBe('Boa tarde');
    expect(saudacao(new Date(2026, 8, 14, 18, 0))).toBe('Boa noite');
    expect(saudacao(new Date(2026, 8, 14, 23, 59))).toBe('Boa noite');
  });

  it('extrai o primeiro nome', () => {
    expect(primeiroNome('Rafael Moreira Lima')).toBe('Rafael');
    expect(primeiroNome('Joana')).toBe('Joana');
    expect(primeiroNome('  Stewer  Gabriel ')).toBe('Stewer');
    expect(primeiroNome(null)).toBe('');
    expect(primeiroNome('')).toBe('');
  });
});

describe('linha DATA e HORÁRIO da confirmacao (tela 07)', () => {
  it('escreve "Sexta, 11 de setembro" — dia curto, como o design, nao "sexta-feira"', () => {
    // 11/09/2026 as 15:30 em UTC-3, o slot que o frame 07 mostra
    expect(formatDiaSemanaDiaMes('2026-09-11T18:30:00Z')).toBe('Sexta, 11 de setembro');
  });

  it('usa o dia LOCAL: 02:00Z de 12/09 ainda e 11/09 no aparelho em UTC-3', () => {
    expect(formatDiaSemanaDiaMes('2026-09-12T02:00:00Z')).toBe('Sexta, 11 de setembro');
  });

  it('devolve string vazia para instante invalido', () => {
    expect(formatDiaSemanaDiaMes(null)).toBe('');
    expect(formatDiaSemanaDiaMes('nao e data')).toBe('');
  });

  it('deriva o fim da faixa pela duracao do servico', () => {
    expect(formatFaixaPorDuracao('2026-09-11T18:30:00Z', 60)).toBe('15:30 — 16:30');
    expect(formatFaixaPorDuracao('2026-09-11T18:30:00Z', 90)).toBe('15:30 — 17:00');
  });

  it('atravessa a meia-noite sem inventar hora', () => {
    expect(formatFaixaPorDuracao('2026-09-12T02:30:00Z', 60)).toBe('23:30 — 00:30');
  });

  it('sem duracao legivel mostra so a hora de inicio, em vez de mentir um fim', () => {
    expect(formatFaixaPorDuracao('2026-09-11T18:30:00Z', undefined)).toBe('15:30');
    expect(formatFaixaPorDuracao('2026-09-11T18:30:00Z', 0)).toBe('15:30');
    expect(formatFaixaPorDuracao('2026-09-11T18:30:00Z', Number.NaN)).toBe('15:30');
  });

  it('devolve string vazia quando o inicio nao presta', () => {
    expect(formatFaixaPorDuracao(undefined, 60)).toBe('');
  });
});

describe('formatos pontuais do design', () => {
  // 14/08/2026 15:30 local = 18:30Z; 14/08/2026 e sexta
  const ISO = '2026-08-14T18:30:00Z';

  it('coluna de historico "14 AGO" (dia com dois digitos)', () => {
    expect(formatDiaMesCurtoCaps(ISO)).toBe('14 AGO');
    expect(formatDiaMesCurtoCaps('2026-06-02T12:00:00Z')).toBe('02 JUN');
  });

  it('"14 Ago", "Mar 2024" e "MARÇO DE 2024"', () => {
    expect(formatDiaMesCurto(ISO)).toBe('14 Ago');
    expect(formatMesAnoCurto('2024-03-10T12:00:00Z')).toBe('Mar 2024');
    expect(formatMesAnoLongoCaps('2024-03-10T12:00:00Z')).toBe('MARÇO DE 2024');
  });

  it('carimbo empilhado "11" / "SET"', () => {
    expect(formatDiaNumero('2026-09-11T18:30:00Z')).toBe('11');
    expect(formatMesCurtoCaps('2026-09-11T18:30:00Z')).toBe('SET');
  });

  it('"Terça, 1 de setembro" a partir do dia de calendario', () => {
    expect(formatDiaSemanaEData('2026-09-01')).toBe('Terça, 1 de setembro');
  });

  it('"Sexta, 11 de setembro" a partir de um instante, no fuso local', () => {
    expect(formatDiaSemanaDiaMes('2026-09-11T18:30:00Z')).toBe('Sexta, 11 de setembro');
    // 02:00Z de 12/09 ainda e 11/09 as 23:00 locais
    expect(formatDiaSemanaDiaMes('2026-09-12T02:00:00Z')).toBe('Sexta, 11 de setembro');
  });

  it('"SEXTA, 11 SET" e "TER"', () => {
    expect(formatDiaCalendarioCaps('2026-09-11')).toBe('SEXTA, 11 SET');
    expect(nomeDiaSemanaCurtoCaps(2)).toBe('TER');
    expect(nomeDiaSemanaCurtoCaps(6)).toBe('SÁB');
    expect(nomeDiaSemanaCurtoCaps(0)).toBe('DOM');
  });

  it('isHoje compara dias de calendario locais', () => {
    const agora = new Date(2026, 8, 13, 23, 30);
    expect(isHoje('2026-09-13', agora)).toBe(true);
    expect(isHoje('2026-09-14', agora)).toBe(false);
  });

  it('mesmoDiaLocal usa o dia LOCAL, nao o UTC', () => {
    // 23:00 local de 13/09 (02:00Z de 14/09) e 01:00 local de 14/09 (04:00Z)
    expect(mesmoDiaLocal('2026-09-14T02:00:00Z', '2026-09-14T04:00:00Z')).toBe(false);
    expect(mesmoDiaLocal('2026-09-14T02:00:00Z', '2026-09-13T12:00:00Z')).toBe(true);
  });

  it('semanaDe vai de segunda a domingo, como o dashboard', () => {
    // 03/09/2026 e quinta; a semana e 31/08 (seg) a 06/09 (dom)
    expect(semanaDe('2026-09-03')).toEqual([
      '2026-08-31',
      '2026-09-01',
      '2026-09-02',
      '2026-09-03',
      '2026-09-04',
      '2026-09-05',
      '2026-09-06',
    ]);
    // domingo pertence a semana que TERMINA nele
    expect(semanaDe('2026-09-06')[0]).toBe('2026-08-31');
    // segunda comeca a propria semana
    expect(semanaDe('2026-08-31')[0]).toBe('2026-08-31');
  });

  it('"31 AGO — 06 SET"', () => {
    expect(formatFaixaDiasCaps('2026-08-31', '2026-09-06')).toBe('31 AGO — 06 SET');
  });

  it('parseDataBr le o que o profissional digita e rejeita lixo', () => {
    expect(parseDataBr('12/09/2026')).toBe('2026-09-12');
    expect(parseDataBr('1/9/2026')).toBe('2026-09-01');
    expect(parseDataBr('31/02/2026')).toBeNull();
    expect(parseDataBr('2026-09-12')).toBeNull();
    expect(parseDataBr('')).toBeNull();
    expect(formatDataBr('2026-09-12')).toBe('12/09/2026');
  });

  it('instanteDe monta o instante a partir de dia + hora LOCAIS', () => {
    // 12/09/2026 16:00 em UTC-3 = 19:00Z
    expect(instanteDe('2026-09-12', '16:00')).toBe('2026-09-12T19:00:00.000Z');
    // meia-noite local vira 03:00Z — e o dia continua sendo 12
    expect(instanteDe('2026-09-12', '00:00')).toBe('2026-09-12T03:00:00.000Z');
    expect(instanteDe('2026-09-12', '25:00')).toBeNull();
    expect(instanteDe('lixo', '10:00')).toBeNull();
  });

  it('cobreODiaInteiro reconhece 00:00-23:59 locais', () => {
    const inicio = instanteDe('2026-09-12', '00:00')!;
    const fim = instanteDe('2026-09-12', '23:59')!;
    expect(cobreODiaInteiro(inicio, fim)).toBe(true);
    expect(cobreODiaInteiro(instanteDe('2026-09-12', '16:00')!, fim)).toBe(false);
  });
});

describe('mes (dashboard)', () => {
  it('nomeMesCaps, mesAnterior e noMesmoMesLocal', () => {
    expect(nomeMesCaps(new Date(2026, 6, 15))).toBe('JULHO');
    const ant = mesAnterior(new Date(2026, 0, 20));
    expect([ant.getFullYear(), ant.getMonth(), ant.getDate()]).toEqual([2025, 11, 1]);
    // 01/09 02:00Z e 31/08 23:00 local: pertence a AGOSTO no calendario local
    expect(noMesmoMesLocal('2026-09-01T02:00:00Z', new Date(2026, 7, 10))).toBe(true);
    expect(noMesmoMesLocal('2026-09-01T02:00:00Z', new Date(2026, 8, 10))).toBe(false);
    expect(noMesmoMesLocal(null, new Date())).toBe(false);
  });
});
