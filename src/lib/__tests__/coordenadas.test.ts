import { lerCoordenadas } from '../coordenadas';

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
