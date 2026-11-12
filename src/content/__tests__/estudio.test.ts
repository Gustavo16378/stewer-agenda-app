import { LOCAL, PORTFOLIO, SOBRE } from '../atelie';
import { linkWhatsapp, montarEstudio, urlDaImagem } from '../estudio';

jest.mock('@/api/config', () => ({ API_URL: 'https://api.teste', TENANT_SLUG: undefined }));
jest.mock('@/api/hooks', () => ({ useEstudioSalvo: () => ({ data: undefined }) }));

describe('montarEstudio', () => {
  it('sem nada salvo, e o conteudo que vem no app, no mapa desenhado', () => {
    const e = montarEstudio(undefined);
    expect(e.nome).toBe(LOCAL.nome);
    expect(e.endereco).toBe(LOCAL.endereco);
    expect(e.noMapaPadrao).toBe(true);
    expect(e.mapaUrl).toBe(LOCAL.mapa);
    expect(e.frase).toBe(SOBRE.citacao);
    expect(e.fotos).toBe(PORTFOLIO);
    expect(e.retratoEnviado).toBeNull();
  });

  it('o que o admin salvou passa por cima, campo a campo', () => {
    const e = montarEstudio({
      nomeLocal: 'Studio Novo',
      endereco: '',
      latitude: -10.2,
      longitude: -48.3,
      whatsapp: '63985116783',
      instagram: 'stewer.gabriel',
      retrato: { id: 'r1', ordem: 0 },
      fotos: [{ id: 'f1', ordem: 0, legenda: 'Degradê' }],
    });
    expect(e.nome).toBe('Studio Novo');
    expect(e.endereco).toBe(LOCAL.endereco);
    expect(e.noMapaPadrao).toBe(false);
    expect(e.mapaUrl).toBe('https://www.google.com/maps/search/?api=1&query=-10.2,-48.3');
    expect(e.whatsappUrl).toMatch(/^https:\/\/wa\.me\/5563985116783\?text=/);
    expect(e.instagramUrl).toBe('https://instagram.com/stewer.gabriel');
    expect(e.retratoEnviado?.fonte).toEqual({ uri: 'https://api.teste/imagens/r1' });
    expect(e.fotos).toHaveLength(1);
    expect(e.fotos[0]!.descricao).toBe('Degradê');
  });

  it('o link do mapa salvo vale mais que as coordenadas', () => {
    const e = montarEstudio({ linkMapa: 'https://maps.app.goo.gl/x', latitude: 1, longitude: 2 });
    expect(e.mapaUrl).toBe('https://maps.app.goo.gl/x');
  });
});

describe('linkWhatsapp e urlDaImagem', () => {
  it('poe o 55 so quando falta', () => {
    expect(linkWhatsapp('(63) 9 8511-6783')).toContain('wa.me/5563985116783');
    expect(linkWhatsapp('5563985116783')).toContain('wa.me/5563985116783');
  });

  it('monta a URL publica da foto', () => {
    expect(urlDaImagem('abc')).toBe('https://api.teste/imagens/abc');
  });
});
