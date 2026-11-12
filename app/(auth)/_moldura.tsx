/**
 * A moldura das telas de acesso (redesenho, nov/2026).
 *
 * No celular: o Stewer atendendo ocupa o topo, a foto escurece ate o fundo e o titulo
 * assenta sobre ela; o formulario vem logo abaixo, com o teclado empurrando a tela.
 * Em tela larga: a metade esquerda e um painel escuro com a foto do Stewer encostada a
 * direita, na proporcao dela (nunca esticada nem cortada no meio da cabeca), e a frase
 * dele no espaco escuro; o formulario fica centralizado na direita.
 *
 * Arquivo com `_` na frente: o Expo Router ignora como rota.
 */
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LogoStewer } from '@/components/marca/Logo';
import { PORTFOLIO, SOBRE } from '@/content/atelie';
import { useLayoutLargo } from '@/lib/responsivo';
import { useTema } from '@/theme/theme-context';

// O Stewer cortando: a foto que diz o que o app agenda.
const FOTO = PORTFOLIO[1]!;
// Em tela larga, a foto em que ele aparece inteiro, com a luz quente do estudio.
const FOTO_LARGA = PORTFOLIO[0]!;
const ESCURO = '#0c0c0c';

function Marca() {
  return (
    <View className="flex-row items-center gap-3">
      <LogoStewer altura={30} cor="#F0EBE4" />
      <View>
        <Text className="font-display text-ds-20 text-marfim">Stewer Gabriel</Text>
        <Text className="font-sans text-ui-xs text-marfim/75">Visagista e consultor de imagem</Text>
      </View>
    </View>
  );
}

export function MolduraAcesso({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
}) {
  const largo = useLayoutLargo();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const { tema } = useTema();
  const fundo = tema === 'dark' ? '12,12,12' : '242,237,229';

  if (largo) {
    return (
      <View className="flex-1 flex-row bg-fundo">
        <View className="flex-1 overflow-hidden" style={{ backgroundColor: ESCURO }}>
          {/* a foto na proporcao dela, encostada a direita, da altura da tela */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              right: 0,
              width: Math.min(height * FOTO_LARGA.proporcao, (width - 520) * 0.68),
            }}
          >
            <Image
              source={FOTO_LARGA.fonte}
              accessibilityLabel={FOTO_LARGA.descricao}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              contentPosition="top"
              transition={300}
            />
            {/* a borda esquerda da foto se dissolve no escuro */}
            <LinearGradient
              colors={[ESCURO, 'rgba(12,12,12,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.45, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={['rgba(12,12,12,0)', 'rgba(12,12,12,0.75)']}
              locations={[0.55, 1]}
              style={StyleSheet.absoluteFill}
            />
          </View>
          <View className="flex-1 justify-between p-12">
            <Marca />
            <View className="max-w-[440px] gap-4">
              <View className="h-px w-8 bg-latao" />
              <Text className="font-display-italic text-ds-30 text-marfim">“{SOBRE.citacao}”</Text>
              <Text className="font-sans text-ui text-marfim/75">Stewer Gabriel</Text>
            </View>
          </View>
        </View>
        <ScrollView
          className="w-[520px] flex-none"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 56 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="w-full max-w-[400px] self-center">
            <Text className="font-display text-ds-38 text-texto">{titulo}</Text>
            {subtitulo ? (
              <Text className="mt-3 font-sans text-ui text-texto-2">{subtitulo}</Text>
            ) : null}
            {children}
          </View>
        </ScrollView>
      </View>
    );
  }

  const alturaFoto = Math.max(300, Math.min(height * 0.46, 440));
  return (
    <KeyboardAvoidingView
      className="flex-1 bg-fundo"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ height: alturaFoto }}>
          <Image
            source={FOTO.fonte}
            accessibilityLabel={FOTO.descricao}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            contentPosition={{ top: '18%' }}
            transition={300}
          />
          <LinearGradient
            colors={[
              'rgba(12,12,12,0.6)',
              'rgba(12,12,12,0)',
              `rgba(${fundo},0.55)`,
              `rgba(${fundo},1)`,
            ]}
            locations={[0, 0.3, 0.72, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View className="px-7" style={{ paddingTop: insets.top + 18 }}>
            <Marca />
          </View>
        </View>

        <View className="-mt-12 px-7">
          <Text className="font-display text-ds-38 text-texto">{titulo}</Text>
          {subtitulo ? (
            <Text className="mt-2 font-sans text-ui text-texto-2">{subtitulo}</Text>
          ) : null}
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
