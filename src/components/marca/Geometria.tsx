/**
 * A analise de visagismo desenhada sobre o retrato: o hexagono da logo emoldurando o
 * rosto, o eixo de simetria e os tres tercos (testa, meio, base). E o momento de marca
 * do app, a continuacao da abertura: o mesmo traco dourado que desenha o S passa a
 * desenhar a leitura do rosto.
 *
 * As coordenadas sao fracoes da FOTO (0 a 100). O Svg usa o mesmo viewBox e o mesmo
 * "slice" que o `contentFit="cover"` da imagem, entao as linhas acompanham o rosto em
 * qualquer tamanho de tela.
 */
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Polygon } from 'react-native-svg';

export interface MarcasDoRosto {
  /** proporcao da foto (largura / altura), para o viewBox */
  proporcao: number;
  /** x do eixo do rosto e y de: linha do cabelo, sobrancelhas, base do nariz, queixo */
  eixo: number;
  cabelo: number;
  sobrancelha: number;
  nariz: number;
  queixo: number;
  /** meia largura da moldura, em fracao da largura da foto */
  meiaLargura: number;
}

const OURO = '#C9A96A';
const tracar = Easing.bezier(0.65, 0, 0.35, 1);

const PoligonoAnimado = Animated.createAnimatedComponent(Polygon);
const LinhaAnimada = Animated.createAnimatedComponent(Line);
const CirculoAnimado = Animated.createAnimatedComponent(Circle);

function useTraco(atraso: number, duracao: number, imediato: boolean) {
  const p = useSharedValue(imediato ? 1 : 0);
  useEffect(() => {
    if (imediato) return;
    p.value = withDelay(atraso, withTiming(1, { duration: duracao, easing: tracar }));
  }, [atraso, duracao, imediato, p]);
  return p;
}

function Traco({
  x1,
  y1,
  x2,
  y2,
  atraso,
  duracao = 700,
  largura = 0.18,
  opacidade = 0.7,
  tracejado,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  atraso: number;
  duracao?: number;
  largura?: number;
  opacidade?: number;
  tracejado?: boolean;
}) {
  const imediato = useReducedMotion();
  const p = useTraco(atraso, duracao, imediato);
  const comprimento = Math.hypot(x2 - x1, y2 - y1);
  const props = useAnimatedProps(() => ({
    x2: x1 + (x2 - x1) * p.value,
    y2: y1 + (y2 - y1) * p.value,
  }));
  return (
    <LinhaAnimada
      x1={x1}
      y1={y1}
      stroke={OURO}
      strokeWidth={largura}
      strokeOpacity={opacidade}
      strokeDasharray={tracejado ? [comprimento / 60, comprimento / 60] : undefined}
      animatedProps={props}
    />
  );
}

function Ponto({ cx, cy, atraso }: { cx: number; cy: number; atraso: number }) {
  const imediato = useReducedMotion();
  const p = useTraco(atraso, 300, imediato);
  const props = useAnimatedProps(() => ({ r: 0.55 * p.value }));
  return <CirculoAnimado cx={cx} cy={cy} fill={OURO} animatedProps={props} />;
}

export function GeometriaDoRosto({
  marcas,
  atraso = 0,
}: {
  marcas: MarcasDoRosto;
  atraso?: number;
}) {
  const imediato = useReducedMotion();
  const { eixo, cabelo, sobrancelha, nariz, queixo, meiaLargura, proporcao } = marcas;
  const L = 100 * proporcao; // largura do viewBox; a altura e sempre 100
  const cx = (eixo / 100) * L;
  const meia = meiaLargura * L;

  // O hexagono da logo: pontas em cima e embaixo, lados retos, emoldurando do cabelo ao queixo.
  const topo = cabelo - 8;
  const base = queixo + 9;
  const ombro = topo + (base - topo) * 0.27;
  const quadril = topo + (base - topo) * 0.73;
  const hexagono = [
    [cx, topo],
    [cx + meia, ombro],
    [cx + meia, quadril],
    [cx, base],
    [cx - meia, quadril],
    [cx - meia, ombro],
  ];
  const perimetro = hexagono.reduce((t, [x, y], i) => {
    const [nx, ny] = hexagono[(i + 1) % hexagono.length]!;
    return t + Math.hypot(nx! - x!, ny! - y!);
  }, 0);

  const moldura = useTraco(atraso + 150, 1100, imediato);
  const propsMoldura = useAnimatedProps(() => ({
    strokeDashoffset: perimetro * (1 - moldura.value),
  }));

  const esquerda = cx - meia - L * 0.06;
  const direita = cx + meia + L * 0.06;
  const tercos = [cabelo, sobrancelha, nariz, queixo];

  return (
    <Svg
      style={StyleSheet.absoluteFill}
      viewBox={`0 0 ${L} 100`}
      preserveAspectRatio="xMidYMid slice"
      pointerEvents="none"
    >
      <PoligonoAnimado
        points={hexagono.map(([x, y]) => `${x},${y}`).join(' ')}
        fill="none"
        stroke={OURO}
        strokeWidth={0.22}
        strokeOpacity={0.85}
        strokeLinejoin="miter"
        strokeDasharray={[perimetro, perimetro]}
        animatedProps={propsMoldura}
      />
      {/* eixo de simetria, tracejado, de cima para baixo */}
      <Traco
        x1={cx}
        y1={topo - 3}
        x2={cx}
        y2={base + 3}
        atraso={atraso + 700}
        duracao={900}
        tracejado
        opacidade={0.55}
      />
      {/* os tres tercos, da esquerda para a direita, um apos o outro */}
      {tercos.map((y, i) => (
        <Traco
          key={y}
          x1={esquerda}
          y1={y}
          x2={direita}
          y2={y}
          atraso={atraso + 950 + i * 140}
          duracao={650}
          opacidade={0.5}
          largura={0.14}
        />
      ))}
      {tercos.map((y, i) => (
        <Ponto key={`p${y}`} cx={cx} cy={y} atraso={atraso + 1500 + i * 90} />
      ))}
    </Svg>
  );
}

/** O retrato escuro de estudio (stewer-retrato.jpg). */
export const MARCAS_RETRATO: MarcasDoRosto = {
  proporcao: 1,
  eixo: 49.5,
  cabelo: 26.5,
  sobrancelha: 38.5,
  nariz: 53,
  queixo: 71,
  meiaLargura: 0.24,
};

/** O recorte de estudio (stewer-busto.jpg), fundo claro: medido no proprio arquivo. */
export const MARCAS_BUSTO: MarcasDoRosto = {
  proporcao: 600 / 750,
  eixo: 50.8,
  cabelo: 19.5,
  sobrancelha: 27,
  nariz: 37.5,
  queixo: 47.5,
  meiaLargura: 0.2,
};
