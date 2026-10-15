/**
 * O toggle do design (frame 09): retangular, NAO pilula.
 *   caixa: `width:34px; height:18px; border:1px solid; border-radius:2px`
 *   knob:  `width:12px; top/bottom:2px` — a direita quando ligado, a esquerda quando desligado
 *   ligado:    borda e knob dourados
 *   desligado: borda ink@.25, knob ink@.3
 *
 * 34x18 e menor que o alvo minimo de toque; o hitSlop compensa.
 */
import { Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';

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
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={rotulo}
      accessibilityState={{ checked: ligado, disabled }}
      disabled={disabled}
      hitSlop={14}
      onPress={() => aoMudar?.(!ligado)}
      className={cn(
        'h-[18px] w-[34px] rounded-token border',
        ligado ? 'border-gold-border' : 'border-ink/25',
        disabled && 'opacity-40'
      )}
    >
      <View
        className={cn(
          'absolute bottom-[2px] top-[2px] w-3',
          ligado ? 'right-[2px] bg-gold' : 'left-[2px] bg-ink/30'
        )}
      />
    </Pressable>
  );
}
