import { lerCoordenadas, linkTemCoordenadas } from '../coordenadas';

describe('lerCoordenadas', () => {
  it('le o par como o Google Maps copia', () => {
    expect(lerCoordenadas('-10.195029, -48.328703')).toEqual({
      latitude: -10.195029,
      longitude: -48.328703,
    });
  });

  it('aceita virgula decimal com ponto e virgula, e espacos', () => {
    expect(lerCoordenadas('  -10,19 ; -48,32 ')).toEqual({ latitude: -10.19, longitude: -48.32 });
  });

  it('recusa texto, um numero so e coordenada fora do mundo', () => {
    expect(lerCoordenadas('204 Sul')).toBeNull();
    expect(lerCoordenadas('-10.19')).toBeNull();
    expect(lerCoordenadas('95, 10')).toBeNull();
  });
});

describe('linkTemCoordenadas', () => {
  it('reconhece os formatos do Google Maps com o ponto', () => {
    expect(linkTemCoordenadas('https://www.google.com/maps/place/X/@-10.19,-48.32,17z')).toBe(true);
    expect(linkTemCoordenadas('https://maps.google.com/?q=-10.19,-48.32')).toBe(true);
    expect(
      linkTemCoordenadas('https://www.google.com/maps/search/?api=1&query=-10.19%2C-48.32')
    ).toBe(true);
    expect(
      linkTemCoordenadas('https://www.google.com/maps/place/X/data=!3d-10.195!4d-48.328')
    ).toBe(true);
  });

  it('link curto nao traz o ponto', () => {
    expect(linkTemCoordenadas('https://maps.app.goo.gl/abc123')).toBe(false);
    expect(linkTemCoordenadas('')).toBe(false);
  });
});
