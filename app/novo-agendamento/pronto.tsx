/**
 * Horario marcado (redesenho, nov/2026): o fim do fluxo do cliente. O S se desenha em
 * latao, o texto sobe logo depois, e a tela diz exatamente o que ficou marcado e o que
 * fazer agora. Substitui o pulo direto para "Meus horarios", que deixava a pessoa sem
 * saber se tinha dado certo.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Linking, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { BotaoAtelie } from '@/components/atelie/base';
import { SDesenhado } from '@/components/marca/SDesenhado';
import { Tela } from '@/components/ui/tela';
import { LOCAL } from '@/content/atelie';
import { calendarDateDoInstante, diaPorExtenso, formatHora } from '@/lib/datetime';

export default function HorarioMarcado() {
  const router = useRouter();
  const { inicio, servico, profissional, remarcado } = useLocalSearchParams<{
    inicio?: string;
    servico?: string;
    profissional?: string;
    remarcado?: string;
  }>();
  const dia = calendarDateDoInstante(inicio);

  const entrar = (atraso: number) => FadeInDown.delay(atraso).duration(500);

  return (
    <Tela larguraMaxima={520}>
      <View className="flex-1 justify-center">
        <SDesenhado altura={84} />

        <Animated.View entering={entrar(900)}>
          <Text accessibilityRole="header" className="mt-10 font-display text-ds-38 text-texto">
            {remarcado ? 'Horário remarcado.' : 'Horário marcado.'}
          </Text>
        </Animated.View>

        {/* o className vai num View comum: o Animated.View nao recebe as classes do NativeWind */}
        <Animated.View entering={entrar(1050)}>
          <View className="mt-6 gap-1">
            <Text className="font-display text-ds-24 text-texto">
              {dia ? diaPorExtenso(dia) : ''}
            </Text>
            <Text className="font-sans-semibold text-ui-lg text-latao">
              às {formatHora(inicio)}
            </Text>
            <Text className="mt-3 font-sans text-ui text-texto-2">
              {[servico, profissional ? `com ${profissional}` : null].filter(Boolean).join(' ')}
            </Text>
            <Text className="font-sans text-ui text-texto-3">
              {LOCAL.nome}, {LOCAL.endereco}
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={entrar(1200)}>
          <View className="mt-10 gap-3">
            <BotaoAtelie
              titulo="Ver meus horários"
              onPress={() => router.replace('/(cliente)/(tabs)/meus-horarios' as never)}
            />
            <BotaoAtelie
              variante="contorno"
              titulo="Como chegar"
              onPress={() => void Linking.openURL(LOCAL.mapa)}
            />
            <BotaoAtelie
              variante="texto"
              titulo="Voltar ao início"
              onPress={() => router.replace('/(cliente)/(tabs)/inicio' as never)}
            />
          </View>
        </Animated.View>
      </View>
    </Tela>
  );
}
