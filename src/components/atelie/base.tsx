/**
 * Pecas do redesenho (nov/2026). Linguagem: rotulos em letra normal (sem caixa alta em
 * tudo), Inter legivel a partir de 13,5px, Playfair com presenca nos titulos, precos e
 * horarios, latao como a unica cor de destaque e o vermelho das cadeiras so no que e
 * destrutivo.
 */
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { cn } from '@/lib/cn';

type VarianteBotao = 'latao' | 'contorno' | 'texto' | 'perigo';

const CAIXA: Record<VarianteBotao, string> = {
  latao: 'bg-latao rounded-[3px] px-6 py-[17px]',
  contorno: 'border border-latao/60 rounded-[3px] px-6 py-[15px]',
  texto: 'py-2',
  perigo: 'border border-cadeira/60 rounded-[3px] px-6 py-[15px]',
};
const ROTULO: Record<VarianteBotao, string> = {
  latao: 'text-fundo font-sans-semibold text-ui',
  contorno: 'text-latao font-sans-medium text-ui',
  texto: 'text-latao font-sans-medium text-ui',
  perigo: 'text-cadeira font-sans-medium text-ui',
};

/** Botao com resposta ao toque (afunda de leve) e rotulo em letra normal. */
export function BotaoAtelie({
  titulo,
  variante = 'latao',
  carregando,
  disabled,
  className,
  icone,
  ...props
}: Omit<PressableProps, 'children' | 'style'> & {
  titulo: string;
  variante?: VarianteBotao;
  carregando?: boolean;
  className?: string;
  icone?: ReactNode;
}) {
  const escala = useSharedValue(1);
  const estilo = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }));
  const inativo = disabled || carregando;

  // className fica num View comum: o Animated.View do Reanimated nao recebe as classes
  // do NativeWind (flex-1, margens), e o botao perdia largura e espacamento.
  return (
    <View className={className}>
      <Animated.View style={estilo}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !!inativo, busy: !!carregando }}
          disabled={inativo}
          onPressIn={() => (escala.value = withSpring(0.97, { damping: 20, stiffness: 400 }))}
          onPressOut={() => (escala.value = withSpring(1, { damping: 15, stiffness: 300 }))}
          className={cn(
            'flex-row items-center justify-center gap-3',
            CAIXA[variante],
            inativo && 'opacity-45'
          )}
          {...props}
        >
          {carregando ? (
            <ActivityIndicator size="small" color={variante === 'latao' ? '#0c0c0c' : '#C9A96A'} />
          ) : (
            icone
          )}
          <Text className={ROTULO[variante]}>{titulo}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

/** Titulo de secao: Playfair, com um traco de latao curto antes. Sem rotulo em cima. */
export function TituloSecao({
  children,
  acao,
  className,
}: {
  children: ReactNode;
  acao?: ReactNode;
  className?: string;
}) {
  return (
    <View className={cn('flex-row items-end justify-between gap-4', className)}>
      <View className="flex-1 gap-3">
        <View className="h-px w-8 bg-latao" />
        <Text className="font-display text-ds-30 text-texto">{children}</Text>
      </View>
      {acao}
    </View>
  );
}

export function Paragrafo({ children, className }: { children: ReactNode; className?: string }) {
  return <Text className={cn('font-sans text-ui text-texto-2', className)}>{children}</Text>;
}
