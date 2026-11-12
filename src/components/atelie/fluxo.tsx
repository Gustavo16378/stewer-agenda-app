/**
 * Pecas do fluxo de agendamento (redesenho, nov/2026).
 *
 * - CabecalhoDoFluxo: voltar, a barra de progresso em quatro segmentos de latao (cresce
 *   com mola quando o passo muda), o contexto ("Novo agendamento", "Para Joana") e o
 *   titulo do passo em Playfair.
 * - BarraDeResumo: a faixa presa embaixo da tela com o que ja foi escolhido e o botao de
 *   seguir. Assim o "Continuar" nunca fica escondido no fim de uma lista comprida.
 */
import { useEffect, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CabecalhoVoltar } from '@/components/ui/cabecalho';
import { useLayoutLargo } from '@/lib/responsivo';

import { BotaoAtelie } from './base';

function Segmento({ cheio }: { cheio: boolean }) {
  const p = useSharedValue(cheio ? 1 : 0);
  useEffect(() => {
    p.value = withSpring(cheio ? 1 : 0, { damping: 20, stiffness: 140 });
  }, [cheio, p]);
  const estilo = useAnimatedStyle(() => ({ width: `${p.value * 100}%` }));
  return (
    <View className="h-[3px] flex-1 overflow-hidden rounded-full bg-borda">
      <Animated.View style={[{ height: '100%', backgroundColor: '#C9A96A' }, estilo]} />
    </View>
  );
}

export function CabecalhoDoFluxo({
  passo,
  total = 4,
  contexto,
  titulo,
  descricao,
}: {
  /** 1 a `total`; sem passo (remarcacao) a barra some */
  passo?: number;
  total?: number;
  contexto: string;
  titulo: string;
  descricao?: string;
}) {
  return (
    <View>
      <CabecalhoVoltar
        acaoDireita={
          passo ? (
            <Text className="font-sans text-ui-sm text-texto-3">
              Passo {passo} de {total}
            </Text>
          ) : undefined
        }
      />
      {passo ? (
        <View
          className="mt-5 flex-row gap-[6px]"
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: total, now: passo }}
        >
          {Array.from({ length: total }, (_, i) => (
            <Segmento key={i} cheio={i < passo} />
          ))}
        </View>
      ) : null}
      <Text className="mt-8 font-sans-medium text-ui-sm text-latao">{contexto}</Text>
      <Text accessibilityRole="header" className="mt-2 font-display text-ds-38 text-texto">
        {titulo}
      </Text>
      {descricao ? <Text className="mt-3 font-sans text-ui text-texto-2">{descricao}</Text> : null}
    </View>
  );
}

export function BarraDeResumo({
  linha1,
  linha2,
  titulo,
  ativo,
  carregando,
  aoTocar,
}: {
  linha1?: ReactNode;
  linha2?: ReactNode;
  titulo: string;
  ativo: boolean;
  carregando?: boolean;
  aoTocar: () => void;
}) {
  const insets = useSafeAreaInsets();
  const largo = useLayoutLargo();
  return (
    <View
      className="border-t border-borda bg-fundo/95 px-7 pt-4"
      style={{ paddingBottom: Math.max(insets.bottom, 16) }}
    >
      <View
        className="flex-row items-center gap-4"
        style={largo ? { width: '100%', maxWidth: 760, alignSelf: 'center' } : undefined}
      >
        <View className="flex-1">
          {linha1 ? (
            <Text className="font-sans-semibold text-ui-lg text-texto" numberOfLines={1}>
              {linha1}
            </Text>
          ) : null}
          {linha2 ? (
            <Text className="font-sans text-ui-sm text-texto-3" numberOfLines={1}>
              {linha2}
            </Text>
          ) : null}
        </View>
        <BotaoAtelie titulo={titulo} disabled={!ativo} carregando={carregando} onPress={aoTocar} />
      </View>
    </View>
  );
}
