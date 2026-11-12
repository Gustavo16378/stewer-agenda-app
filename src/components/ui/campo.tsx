/**
 * Campo de formulario do design (frame 02):
 *   rotulo: `font-size:9px; font-weight:600; letter-spacing:.22em; color:ink@.48`
 *   caixa:  `border:1px solid ink@.18; border-radius:2px; padding:16px; font-size:14px`
 *   placeholder: `color:ink@.35`
 *   gap rotulo/caixa: 8px
 *
 * A mensagem de erro abaixo do campo e o destino das `violacoes` que a API manda
 * em 400/422 (`{campo, mensagem}`) — ver src/api/errors.ts.
 */
import { forwardRef, useState } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { cn } from '@/lib/cn';
import { emFrase } from '@/lib/frase';
import { useCores } from '@/theme/theme-context';

import { LabelCaps } from './texto';

export interface CampoProps extends TextInputProps {
  rotulo: string;
  /** Mensagem de erro — tipicamente `erro.violacaoDe('email')`. */
  erro?: string;
  /** Texto de apoio abaixo do campo, quando nao ha erro. */
  ajuda?: string;
  className?: string;
}

export const Campo = forwardRef<TextInput, CampoProps>(function Campo(
  { rotulo, erro, ajuda, className, ...props },
  ref
) {
  const cores = useCores();
  const [focado, setFocado] = useState(false);
  // Campo de senha ganha o olho para conferir o que foi digitado.
  const ehSenha = !!props.secureTextEntry;
  const [mostrar, setMostrar] = useState(false);

  // Redesenho: campo sobre a superficie de couro, texto de 17px, borda em latao no foco.
  return (
    <View className={cn('gap-2', className)}>
      <LabelCaps papel="secao" className="text-texto-2">
        {rotulo}
      </LabelCaps>

      <View>
        <TextInput
          ref={ref}
          accessibilityLabel={emFrase(rotulo)}
          placeholderTextColor={cores.placeholder}
          className={cn(
            'rounded-[3px] border bg-superficie px-4 py-[15px] font-sans text-ui-lg text-texto',
            ehSenha && 'pr-14',
            erro ? 'border-cadeira/70' : focado ? 'border-latao' : 'border-borda'
          )}
          {...props}
          secureTextEntry={ehSenha && !mostrar}
          onFocus={(e) => {
            setFocado(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocado(false);
            props.onBlur?.(e);
          }}
        />
        {ehSenha ? (
          <Pressable
            onPress={() => setMostrar((m) => !m)}
            accessibilityRole="button"
            accessibilityLabel={mostrar ? 'Esconder senha' : 'Mostrar senha'}
            hitSlop={8}
            className="absolute bottom-0 right-0 top-0 w-12 items-center justify-center"
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path
                d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"
                stroke={cores.gold}
                strokeWidth={1.6}
                strokeLinejoin="round"
              />
              <Circle cx={12} cy={12} r={3} stroke={cores.gold} strokeWidth={1.6} />
              {mostrar ? null : (
                <Line x1={4} y1={20} x2={20} y2={4} stroke={cores.gold} strokeWidth={1.6} />
              )}
            </Svg>
          </Pressable>
        ) : null}
      </View>

      {erro ? (
        <Text className="font-sans text-ui-sm text-cadeira">{erro}</Text>
      ) : ajuda ? (
        <Text className="font-sans text-ui-sm text-texto-3">{ajuda}</Text>
      ) : null}
    </View>
  );
});
