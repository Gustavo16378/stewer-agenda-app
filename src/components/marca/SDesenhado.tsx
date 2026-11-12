/**
 * O S do Stewer se desenhando em latao e depois se preenchendo: o mesmo gesto da
 * abertura, em tamanho de selo. Usado para fechar um momento (horario marcado).
 * Quem pede menos movimento ve o S ja pronto.
 */
import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { LOGO_ALTURA, LOGO_LARGURA, LOGO_PATHS, LOGO_PERIMETROS, LOGO_VIEWBOX } from './logo';

const OURO = '#C9A96A';
const PathAnimado = Animated.createAnimatedComponent(Path);
const tracar = Easing.bezier(0.65, 0, 0.35, 1);

function Traco({
  d,
  perimetro,
  indice,
  preenchido,
  imediato,
}: {
  d: string;
  perimetro: number;
  indice: number;
  preenchido: SharedValue<number>;
  imediato: boolean;
}) {
  const p = useSharedValue(imediato ? 1 : 0);
  useEffect(() => {
    if (imediato) return;
    p.value = withDelay(120 + indice * 110, withTiming(1, { duration: 700, easing: tracar }));
  }, [indice, p, imediato]);
  const props = useAnimatedProps(() => ({
    strokeDashoffset: perimetro * (1 - p.value),
    fillOpacity: preenchido.value,
  }));
  return (
    <PathAnimado
      d={d}
      fill={OURO}
      stroke={OURO}
      strokeWidth={1.1}
      strokeDasharray={[perimetro, perimetro]}
      animatedProps={props}
    />
  );
}

export function SDesenhado({ altura = 72 }: { altura?: number }) {
  const imediato = useReducedMotion();
  const preenchido = useSharedValue(imediato ? 1 : 0);
  useEffect(() => {
    if (imediato) return;
    preenchido.value = withDelay(850, withTiming(1, { duration: 450 }));
  }, [preenchido, imediato]);

  return (
    <Svg
      width={(altura * LOGO_LARGURA) / LOGO_ALTURA}
      height={altura}
      viewBox={LOGO_VIEWBOX}
      style={{ overflow: 'visible' }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {LOGO_PATHS.map((d, i) => (
        <Traco
          key={d}
          d={d}
          perimetro={LOGO_PERIMETROS[i]!}
          indice={i}
          preenchido={preenchido}
          imediato={imediato}
        />
      ))}
    </Svg>
  );
}
