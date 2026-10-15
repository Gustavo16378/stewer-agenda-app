/**
 * [01 Splash] — porta de entrada.
 *
 * Enquanto o AuthProvider resolve a sessao (le o SecureStore e confirma com GET /auth/eu),
 * mostra a splash desenhada. Resolvida, redireciona para a area do papel.
 */
import { Redirect } from 'expo-router';
import { Text, View } from 'react-native';

import { rotaInicialDoPapel, useAuth } from '@/auth/auth-context';
import { Losango } from '@/components/ui/losango';

export default function Splash() {
  const { status, role } = useAuth();

  if (status !== 'carregando') {
    return <Redirect href={rotaInicialDoPapel(role) as never} />;
  }

  return (
    <View className="flex-1 bg-canvas">
      <View className="absolute inset-0 items-center justify-center gap-[26px]">
        <Losango tamanho={58} sigla="SG" tamanhoSigla={19} />
        <Text className="pl-[6.4px] font-display text-d-20 tracking-logo text-ink">
          STEWER GABRIEL
        </Text>
        <View className="h-px w-[34px] bg-ink/25" />
        <Text className="pl-[2.7px] font-sans-semibold text-caps tracking-widest text-ink/50">
          VISAGISMO &amp; CONSULTORIA DE IMAGEM
        </Text>
      </View>
      <Text className="absolute bottom-[44px] left-0 right-0 text-center font-sans-semibold text-[8.5px] tracking-widest text-ink/30">
        STEWERGABRIEL.COM
      </Text>
    </View>
  );
}
