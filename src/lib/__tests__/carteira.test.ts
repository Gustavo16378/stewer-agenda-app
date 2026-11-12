import {
  aniversario,
  autorDoEvento,
  haQuantoTempo,
  linkWhatsApp,
  MENSAGENS,
  ritmo,
  tomDoEvento,
} from '../carteira';

describe('linkWhatsApp', () => {
  it('assume Brasil sem DDI e leva a mensagem codificada', () => {
    expect(linkWhatsApp('(63) 98511-6783', 'Oi Joana')).toBe(
      'https://wa.me/5563985116783?text=Oi%20Joana'
    );
    expect(linkWhatsApp('+55 63 98511-6783')).toBe('https://wa.me/5563985116783');
  });
  it('sem telefone ou com numero curto nao monta link', () => {
    expect(linkWhatsApp(null)).toBeNull();
    expect(linkWhatsApp('1234')).toBeNull();
  });
});

describe('aniversario', () => {
  const hoje = new Date(2026, 10, 12); // 12 nov 2026
  it('escreve o dia e a idade do ano', () => {
    expect(aniversario('1994-11-20', hoje)).toEqual({
      dia: '20 de novembro',
      idade: 32,
      ehHoje: false,
      ehEsteMes: true,
    });
  });
  it('sabe quando e hoje', () => {
    expect(aniversario('2000-11-12', hoje)?.ehHoje).toBe(true);
    expect(aniversario('2000-03-12', hoje)?.ehEsteMes).toBe(false);
  });
  it('sem data valida devolve nulo', () => {
    expect(aniversario(undefined, hoje)).toBeNull();
    expect(aniversario('abc', hoje)).toBeNull();
  });
});

describe('ritmo e tempo', () => {
  it('ritmo em semanas, dias ou meses', () => {
    expect(ritmo(7)).toBe('toda semana');
    expect(ritmo(21)).toBe('a cada 3 semanas');
    expect(ritmo(17)).toBe('a cada 17 dias');
    expect(ritmo(30)).toBe('a cada 30 dias');
    expect(ritmo(62)).toBe('a cada 2 meses');
    expect(ritmo(null)).toBeNull();
  });
  it('ha quanto tempo', () => {
    expect(haQuantoTempo(0)).toBe('hoje');
    expect(haQuantoTempo(1)).toBe('ontem');
    expect(haQuantoTempo(40)).toBe('há 40 dias');
    expect(haQuantoTempo(95)).toBe('há 3 meses');
    expect(haQuantoTempo(400)).toBe('há 1 ano');
  });
});

describe('auditoria', () => {
  it('cancelar e faltar chamam atencao; concluir e positivo', () => {
    expect(tomDoEvento({ acao: 'CANCELOU' })).toBe('alerta');
    expect(tomDoEvento({ acao: 'NAO_COMPARECEU' })).toBe('alerta');
    expect(tomDoEvento({ acao: 'CONCLUIU' })).toBe('positivo');
    expect(tomDoEvento({ acao: 'ALTEROU' })).toBe('neutro');
  });
  it('sem autor, cliente anonimo ou sistema', () => {
    expect(autorDoEvento({ autorNome: 'Stewer Gabriel', autorRole: 'ADMIN' })).toBe(
      'Stewer Gabriel'
    );
    expect(autorDoEvento({ autorNome: undefined, autorRole: 'CLIENTE' })).toBe('Cliente');
    expect(autorDoEvento({ autorNome: undefined, autorRole: undefined })).toBe('Sistema');
  });
  it('mensagens prontas levam o primeiro nome', () => {
    expect(MENSAGENS.parabens('Joana')).toMatch(/^Oi Joana, aqui é o Stewer\. Feliz aniversário!/);
  });
});
