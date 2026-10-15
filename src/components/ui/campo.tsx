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
import { forwardRef } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

import { cn } from '@/lib/cn';
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

  return (
    <View className={cn('gap-2', className)}>
      <LabelCaps papel="secao" className="tracking-button">
        {rotulo}
      </LabelCaps>

      <TextInput
        ref={ref}
        accessibilityLabel={rotulo}
        placeholderTextColor={cores.placeholder}
        className={cn(
          'rounded-token border p-4 font-sans text-row text-ink',
          erro ? 'border-red-500/60' : 'border-field-border'
        )}
        {...props}
      />

      {erro ? (
        <Text className="font-sans text-help text-red-500">{erro}</Text>
      ) : ajuda ? (
        <Text className="font-sans text-help text-ink/42">{ajuda}</Text>
      ) : null}
    </View>
  );
});
