/**
 * Onde o Stewer atende: o mapa do studio nas cores do app, com o S da marca marcando
 * o endereco e um pulso discreto em volta (uma unica animacao, que para para quem pede
 * menos movimento). Tocar no mapa abre o app de mapas do aparelho com a rota.
 *
 * O mapa e uma imagem gerada por scripts/make-map.py a partir do OpenStreetMap: funciona
 * sem internet, sem chave de API e sem SDK de mapa nativo. O endereco fica exatamente no
 * centro da imagem, e e no centro que o pino e desenhado.
 */
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { LOCAL } from '@/content/atelie';
import { cn } from '@/lib/cn';
import { useLayoutLargo } from '@/lib/responsivo';
import { useTema } from '@/theme/theme-context';

import { BotaoAtelie, Paragrafo } from './base';
import { LOGO_PATHS, LOGO_VIEWBOX } from '../marca/logo';

const MAPAS = {
  dark: require('../../../assets/images/atelie/mapa-escuro.jpg'),
  light: require('../../../assets/images/atelie/mapa-claro.jpg'),
};
/** Altura do recorte: o mapa e uma janela pequena, nao a tela inteira. */
const ALTURA = { celular: 210, largo: 300 };
const MAPA_W = 1600;
const MAPA_H = 1000;
const OURO = '#C9A96A';

function Pulso() {
  const menosMovimento = useReducedMotion();
  const p = useSharedValue(0);
  useEffect(() => {
    if (menosMovimento) return;
    p.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.out(Easing.quad) }), -1);
  }, [menosMovimento, p]);
  const estilo = useAnimatedStyle(() => ({
    opacity: 0.55 * (1 - p.value),
    transform: [{ scale: 0.6 + p.value * 1.6 }],
  }));
  if (menosMovimento) return null;
  return <Animated.View style={[estilos.pulso, estilo]} />;
}

/** O pino: o S da marca dentro de um losango de latao, com a ponta no endereco. */
function Pino() {
  return (
    <View style={estilos.pino} pointerEvents="none">
      <Pulso />
      <View style={estilos.losango}>
        <View style={estilos.desvira}>
          <Svg width={11} height={18} viewBox={LOGO_VIEWBOX}>
            {LOGO_PATHS.map((d) => (
              <Path key={d} d={d} fill="#0c0c0c" />
            ))}
          </Svg>
        </View>
      </View>
      <View style={estilos.ponto} />
    </View>
  );
}

export function MapaDoAtelie() {
  const { tema } = useTema();
  const largo = useLayoutLargo();
  const abrirRota = () => void Linking.openURL(LOCAL.mapa);

  // No celular, mapa em cima e endereco embaixo; em tela larga, lado a lado.
  return (
    <View className={largo ? 'flex-row items-center gap-8' : undefined}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`Abrir ${LOCAL.nome} no mapa`}
        onPress={abrirRota}
        className={cn('overflow-hidden rounded-[3px] border border-borda', largo && 'flex-[1.3]')}
        style={({ pressed }) => (pressed ? { opacity: 0.92 } : null)}
      >
        <View style={{ height: largo ? ALTURA.largo : ALTURA.celular }}>
          {/* Tamanho natural (1600x1000), centralizado e recortado pela janela: os nomes
              das ruas ficam no tamanho em que o mapa foi desenhado, sem esticar nem amassar.
              Medidas explicitas em vez de contentFit="none", que no navegador esticava. */}
          <View style={estilos.mapa} pointerEvents="none">
            <Image
              source={MAPAS[tema]}
              style={{ width: MAPA_W, height: MAPA_H }}
              contentFit="fill"
              transition={250}
              accessibilityLabel={`Mapa das ruas em volta do ${LOCAL.nome}, na 204 Sul`}
            />
          </View>
          {/* escurece as bordas para o mapa assentar no fundo da tela */}
          <LinearGradient
            colors={
              tema === 'dark'
                ? [
                    'rgba(12,12,12,0.55)',
                    'rgba(12,12,12,0)',
                    'rgba(12,12,12,0)',
                    'rgba(12,12,12,0.7)',
                  ]
                : [
                    'rgba(242,237,229,0.5)',
                    'rgba(242,237,229,0)',
                    'rgba(242,237,229,0)',
                    'rgba(242,237,229,0.6)',
                  ]
            }
            locations={[0, 0.25, 0.7, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <Pino />
          <View className="absolute left-3 top-3 rounded-[3px] bg-fundo/80 px-3 py-[6px]">
            <Text className="font-sans-medium text-ui-xs text-texto">{LOCAL.regiao}</Text>
          </View>
          <Text
            className="absolute bottom-2 right-3 rounded-[2px] bg-fundo/80 px-[6px] py-[2px] font-sans text-texto-2"
            style={{ fontSize: 11, lineHeight: 14 }}
          >
            © colaboradores do OpenStreetMap
          </Text>
        </View>
      </Pressable>

      <View className={largo ? 'flex-1' : undefined}>
        <View className={largo ? 'gap-1' : 'mt-6 gap-1'}>
          <Text className="font-display text-ds-24 text-texto">{LOCAL.nome}</Text>
          <Text className="font-sans-medium text-ui-sm text-latao">{LOCAL.descricao}</Text>
          <Paragrafo>{LOCAL.endereco}</Paragrafo>
          <Paragrafo className="text-texto-3">{LOCAL.horario}</Paragrafo>
        </View>
        <View className="mt-6 flex-row gap-3">
          <BotaoAtelie className="flex-1" titulo="Como chegar" onPress={abrirRota} />
          <BotaoAtelie
            className="flex-1"
            variante="contorno"
            titulo="WhatsApp"
            onPress={() => void Linking.openURL(LOCAL.whatsapp)}
          />
        </View>
      </View>
    </View>
  );
}

const TAM = 34;
const estilos = StyleSheet.create({
  mapa: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: MAPA_W,
    height: MAPA_H,
    marginLeft: -MAPA_W / 2,
    marginTop: -MAPA_H / 2,
  },
  // o centro do pino (a ponta de baixo do losango) cai no centro da imagem
  pino: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: TAM * 2,
    height: TAM * 2,
    marginLeft: -TAM,
    // o ponto (centro em y = 63) e que marca o endereco; o losango fica logo acima
    marginTop: -63,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulso: {
    position: 'absolute',
    bottom: -12,
    width: TAM,
    height: TAM,
    borderRadius: TAM,
    borderWidth: 1.5,
    borderColor: OURO,
  },
  losango: {
    width: 30,
    height: 30,
    backgroundColor: OURO,
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  desvira: { transform: [{ rotate: '-45deg' }] },
  ponto: {
    position: 'absolute',
    bottom: 2,
    width: 6,
    height: 6,
    borderRadius: 6,
    backgroundColor: OURO,
  },
});
