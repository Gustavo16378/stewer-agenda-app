/**
 * A abertura de marca, a mesma do site stewergabriel.com: o S do Stewer tracado em
 * dourado, preenchido, o nome subindo letra por letra embaixo, e a cortina que sobe
 * revelando o app.
 *
 * Linha do tempo (igual a do site):
 *   0,05 s  os tres tracos do S comecam a ser desenhados em dourado
 *   0,65 s  o nome sobe letra por letra
 *   0,75 s  o S se preenche e o dourado some
 *   0,95 s  a frase aparece
 *   1,50 s  pronto: a cortina sobe quando o app tambem estiver pronto
 *
 * Nunca segura o app: sai quando a animacao minima terminou E o app esta pronto
 * (fontes e sessao), e em 6 s sai de qualquer jeito. Quem pede menos movimento no
 * aparelho nao ve a animacao.
 */
import { useEffect, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { LOGO_ALTURA, LOGO_LARGURA, LOGO_PATHS, LOGO_PERIMETROS, LOGO_VIEWBOX } from './logo';

const NOME = 'Stewer Gabriel';
const FRASE = 'VISAGISTA · CONSULTOR DE IMAGEM';

const TEMPO_MINIMO = 1500;
const TEMPO_MAXIMO = 6000;
const CORTINA = 750;

const FUNDO = '#0A0A0A';
const OURO = '#C9A96A';
const BRANCO = '#f3f3f3';

const tracar = Easing.bezier(0.65, 0, 0.35, 1);
const subir = Easing.bezier(0.22, 1, 0.36, 1);
const cortina = Easing.bezier(0.76, 0, 0.24, 1);

const PathAnimado = Animated.createAnimatedComponent(Path);

function Traco({
  d,
  perimetro,
  indice,
  preenchido,
}: {
  d: string;
  perimetro: number;
  indice: number;
  preenchido: SharedValue<number>;
}) {
  const progresso = useSharedValue(0);
  useEffect(() => {
    progresso.value = withDelay(
      50 + indice * 100,
      withTiming(1, { duration: 750, easing: tracar })
    );
  }, [indice, progresso]);

  const props = useAnimatedProps(() => ({
    strokeDashoffset: perimetro * (1 - progresso.value),
    fillOpacity: preenchido.value,
    strokeOpacity: 1 - preenchido.value,
  }));

  return (
    <PathAnimado
      d={d}
      fill={BRANCO}
      stroke={OURO}
      strokeWidth={1.1}
      strokeLinejoin="miter"
      strokeDasharray={[perimetro, perimetro]}
      animatedProps={props}
    />
  );
}

function Letra({ c, indice, inicio }: { c: string; indice: number; inicio: number }) {
  const y = useSharedValue(1);
  useEffect(() => {
    y.value = withDelay(inicio + indice * 22, withTiming(0, { duration: 500, easing: subir }));
  }, [indice, inicio, y]);
  const estilo = useAnimatedStyle(() => ({ transform: [{ translateY: `${y.value * 110}%` }] }));

  if (c === ' ') return <Text style={estilos.nome}> </Text>;
  return (
    <View style={estilos.caixaLetra}>
      <Animated.Text style={[estilos.nome, estilo]}>{c}</Animated.Text>
    </View>
  );
}

export function Abertura({ pronto }: { pronto: boolean }) {
  const menosMovimento = useReducedMotion();
  const { height } = useWindowDimensions();
  const [inicio] = useState(() => Date.now());
  const [visivel, setVisivel] = useState(!menosMovimento);
  const [saindo, setSaindo] = useState(false);

  const preenchido = useSharedValue(0);
  const frase = useSharedValue(0);
  const subida = useSharedValue(0);

  useEffect(() => {
    preenchido.value = withDelay(
      750,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) })
    );
    frase.value = withDelay(950, withTiming(1, { duration: 500 }));
  }, [preenchido, frase]);

  // sai quando o desenho minimo terminou E o app esta pronto; ou em 6 s, de qualquer jeito
  useEffect(() => {
    if (!visivel || saindo) return;
    const decorrido = Date.now() - inicio;
    const ate = pronto
      ? Math.max(0, TEMPO_MINIMO - decorrido)
      : Math.max(0, TEMPO_MAXIMO - decorrido);
    const t = setTimeout(() => setSaindo(true), ate);
    return () => clearTimeout(t);
  }, [pronto, visivel, saindo, inicio]);

  useEffect(() => {
    if (!saindo) return;
    subida.value = withTiming(1, { duration: CORTINA, easing: cortina }, (ok) => {
      if (ok) runOnJS(setVisivel)(false);
    });
  }, [saindo, subida]);

  const estiloCortina = useAnimatedStyle(() => ({
    transform: [{ translateY: -subida.value * height }],
  }));
  const estiloFrase = useAnimatedStyle(() => ({ opacity: frase.value }));

  if (!visivel) return null;

  const alturaLogo = 84;
  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, estilos.fundo, estiloCortina]}
      pointerEvents="none"
    >
      <Svg
        width={(alturaLogo * LOGO_LARGURA) / LOGO_ALTURA}
        height={alturaLogo}
        viewBox={LOGO_VIEWBOX}
        style={{ overflow: 'visible' }}
      >
        {LOGO_PATHS.map((d, i) => (
          <Traco key={d} d={d} perimetro={LOGO_PERIMETROS[i]!} indice={i} preenchido={preenchido} />
        ))}
      </Svg>
      <View style={estilos.linhaNome}>
        {[...NOME].map((c, i) => (
          <Letra key={`${c}-${i}`} c={c} indice={i} inicio={650} />
        ))}
      </View>
      <Animated.Text style={[estilos.frase, estiloFrase]}>{FRASE}</Animated.Text>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  fundo: {
    backgroundColor: FUNDO,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  linhaNome: { flexDirection: 'row', marginTop: 30 },
  caixaLetra: { overflow: 'hidden', paddingBottom: 3 },
  nome: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 30,
    letterSpacing: 0.6,
    color: '#f0ebe4',
    lineHeight: 36,
  },
  frase: {
    marginTop: 14,
    paddingLeft: 3,
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    letterSpacing: 3,
    color: '#8a8178',
  },
});
