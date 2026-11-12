/**
 * A aba Agendar (redesenho, nov/2026): o Stewer trabalhando no alto e o caminho do
 * agendamento explicado em quatro passos antes de comecar. A numeracao aqui e uma
 * sequencia de verdade, a mesma da barra de progresso do fluxo.
 */
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BotaoAtelie } from '@/components/atelie/base';
import { useEstudio } from '@/content/estudio';
import { LARGURA_CONTEUDO, useLayoutLargo } from '@/lib/responsivo';
import { useTema } from '@/theme/theme-context';

const PASSOS = [
  { titulo: 'O serviço', texto: 'Corte, barba, visagismo ou consultoria.' },
  { titulo: 'Com quem', texto: 'O Stewer ou alguém da equipe.' },
  { titulo: 'O dia e a hora', texto: 'Só aparecem os horários livres de verdade.' },
  { titulo: 'Confirmar', texto: 'Você revisa tudo antes. Dá para remarcar depois.' },
];

export default function AgendarCliente() {
  const router = useRouter();
  const largo = useLayoutLargo();
  const { tema } = useTema();
  const FOTO = useEstudio().fotos[0]!;
  const fundo = tema === 'dark' ? '12,12,12' : '242,237,229';

  return (
    <ScrollView className="flex-1 bg-fundo" contentContainerStyle={{ paddingBottom: 48 }}>
      <View style={{ height: largo ? 360 : 300 }}>
        <Image
          source={FOTO.fonte}
          accessibilityLabel={FOTO.descricao}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          contentPosition={{ top: '30%' }}
          transition={250}
        />
        <LinearGradient
          colors={[`rgba(${fundo},0)`, `rgba(${fundo},1)`]}
          locations={[0.35, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <View
        className="-mt-16 px-7"
        style={largo ? { maxWidth: LARGURA_CONTEUDO, width: '100%', alignSelf: 'center' } : null}
      >
        <Text accessibilityRole="header" className="font-display text-ds-38 text-texto">
          Marcar um horário
        </Text>
        <Text className="mt-2 font-sans text-ui text-texto-2">
          Quatro passos, menos de um minuto.
        </Text>

        <View className="mt-8 gap-5">
          {PASSOS.map((p, i) => (
            <View key={p.titulo} className="flex-row gap-4">
              <View className="h-9 w-9 items-center justify-center rounded-full border border-latao/60">
                <Text className="font-display text-ds-20 text-latao">{i + 1}</Text>
              </View>
              <View className="flex-1 pt-[2px]">
                <Text className="font-sans-semibold text-ui-lg text-texto">{p.titulo}</Text>
                <Text className="font-sans text-ui text-texto-2">{p.texto}</Text>
              </View>
            </View>
          ))}
        </View>

        <BotaoAtelie
          className="mt-10"
          titulo="Começar"
          onPress={() => router.push('/novo-agendamento/servico' as never)}
        />
      </View>
    </ScrollView>
  );
}
