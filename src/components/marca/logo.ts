/**
 * O "S" do Stewer em vetor: os mesmos tres poligonos do site stewergabriel.com
 * (src/lib/logo.ts de la), para a marca ser identica no site e no app.
 */
export const LOGO_VIEWBOX = '0 0 59.5 100';
export const LOGO_LARGURA = 59.5;
export const LOGO_ALTURA = 100;

export const LOGO_PATHS = [
  // o S grande (de cima)
  'M30 1 L1 19.5 L1 43 L35.5 67.5 L35.5 72.5 L30 76 L24 72 L24 66.5 L17 62 L17 74 L30 83 L42.5 74.5 L42.5 64 L9.5 39.5 L9.5 24 L30 10.5 L50 23.5 L50 37 L58.5 37 L58.5 19.5 Z',
  // a base do hexagono
  'M58.5 46.5 L41 46.5 L50 54 L50 74.5 L30 89 L9.5 74.5 L9.5 59.5 L1 59.5 L1 79 L30 99 L58.5 79 Z',
  // o S pequeno (de dentro)
  'M30 19.5 L17 28 L17 40.5 L42.5 58.5 L42.5 53 L24 39 L24 31 L30 27 L35.5 31 L35.5 35.5 L42.5 40 L42.5 28 Z',
];

/**
 * Perimetro de cada poligono, para o traco animado (stroke-dashoffset). O
 * react-native-svg nao tem `pathLength` em todas as plataformas, entao o
 * comprimento e calculado aqui, uma vez, a partir dos vertices.
 */
export const LOGO_PERIMETROS = LOGO_PATHS.map((d) => {
  const pts = [...d.matchAll(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)].map((m): [number, number] => [
    Number(m[1]),
    Number(m[2]),
  ]);
  let total = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i]!;
    const [x2, y2] = pts[(i + 1) % pts.length]!;
    total += Math.hypot(x2 - x1, y2 - y1);
  }
  return total;
});
