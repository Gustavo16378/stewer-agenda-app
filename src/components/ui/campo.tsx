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
import { Text, TextInput, View, type TextInputProps } from 'react-native';

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

  // Redesenho: campo sobre a superficie de couro, texto de 17px, borda em latao no foco.
  return (
    <View className={cn('gap-2', className)}>
      <LabelCaps papel="secao" className="text-texto-2">
        {rotulo}
      </LabelCaps>

      <TextInput
        ref={ref}
        accessibilityLabel={emFrase(rotulo)}
        placeholderTextColor={cores.placeholder}
        className={cn(
          'rounded-[3px] border bg-superficie px-4 py-[15px] font-sans text-ui-lg text-texto',
          erro ? 'border-cadeira/70' : focado ? 'border-latao' : 'border-borda'
        )}
        {...props}
        onFocus={(e) => {
          setFocado(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocado(false);
          props.onBlur?.(e);
        }}
      />

      {erro ? (
        <Text className="font-sans text-ui-sm text-cadeira">{erro}</Text>
      ) : ajuda ? (
        <Text className="font-sans text-ui-sm text-texto-3">{ajuda}</Text>
      ) : null}
    </View>
  );
});
