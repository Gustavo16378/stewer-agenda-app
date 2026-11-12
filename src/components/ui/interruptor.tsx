/**
 * Interruptor (redesenho, nov/2026): trilho em pilula, bolinha que desliza com mola.
 * Ligado = latao; desligado = borda neutra. O alvo de toque e maior que o desenho
 * (hitSlop), para bater os 44px recomendados.
 */
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { cn } from '@/lib/cn';

const LARGURA = 44;
const ALTURA = 26;
const BOLA = 20;

export function Interruptor({
  ligado,
  aoMudar,
  disabled = false,
  rotulo,
}: {
  ligado: boolean;
  aoMudar?: (valor: boolean) => void;
  disabled?: boolean;
  rotulo: string;
}) {
  const x = useSharedValue(ligado ? 1 : 0);
  useEffect(() => {
    x.value = withSpring(ligado ? 1 : 0, { damping: 18, stiffness: 260 });
  }, [ligado, x]);
  const estilo = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value * (LARGURA - BOLA - 6) }],
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={rotulo}
      accessibilityState={{ checked: ligado, disabled }}
      disabled={disabled}
      hitSlop={10}
      onPress={() => aoMudar?.(!ligado)}
      className={cn(disabled && 'opacity-40')}
    >
      <View
        className={cn(
          'justify-center rounded-full border px-[2px]',
          ligado ? 'border-latao bg-latao' : 'border-borda bg-superficie'
        )}
        style={{ width: LARGURA, height: ALTURA }}
      >
        <Animated.View
          style={[
            { width: BOLA, height: BOLA, borderRadius: BOLA },
            { backgroundColor: ligado ? '#F0EBE4' : '#8A8178' },
            estilo,
          ]}
        />
      </View>
    </Pressable>
  );
}
