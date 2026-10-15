/**
 * Cabecalho de tela empilhada (frames 04, 05, 06, 07, 11, 14, 19):
 *   `display:flex; justify-content:space-between; align-items:center; padding:20px 28px 0`
 *   seta: `font-size:19px; color:ink@.75`   (no light, ink@.7)
 *   indicador de passo: `font-size:9px; font-weight:600; letter-spacing:.24em; color:ink@.45`
 *
 * A seta e o caractere "←" do proprio design, nao um icone importado — o design nao usa
 * biblioteca de icones em lugar nenhum (a tab bar tambem e so tracinho + texto).
 */
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { cn } from '@/lib/cn';

import { LabelCaps } from './texto';

export function CabecalhoVoltar({
  passo,
  aoVoltar,
  acaoDireita,
  className,
}: {
  /** Ex.: "PASSO 03 DE 04". Some quando nao informado. */
  passo?: string;
  aoVoltar?: () => void;
  /** Substitui o indicador de passo por outra coisa (ex.: um botao). */
  acaoDireita?: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();

  const voltar = () => {
    if (aoVoltar) return aoVoltar();
    if (router.canGoBack()) return router.back();
  };

  return (
    <View className={cn('flex-row items-center justify-between pt-5', className)}>
      <Pressable
        onPress={voltar}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        hitSlop={16}
        style={({ pressed }) => (pressed ? { opacity: 0.6 } : null)}
      >
        <Text className="font-sans text-icon-lg text-nav-arrow">←</Text>
      </Pressable>

      {acaoDireita ?? (passo ? <LabelCaps papel="meta">{passo}</LabelCaps> : <View />)}
    </View>
  );
}
