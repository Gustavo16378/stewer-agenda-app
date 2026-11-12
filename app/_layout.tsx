import '@/styles/global.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { criarQueryClient } from '@/api/query-client';
import { AuthProvider, useAuth } from '@/auth/auth-context';
import { Abertura } from '@/components/marca/Abertura';
import { FONTES } from '@/theme/fonts';
import { ThemeProvider, useTema } from '@/theme/theme-context';

// A splash nativa so sai depois que as fontes carregam — sem isso a primeira
// renderizacao pisca com a fonte de sistema antes de trocar para a Playfair.
void SplashScreen.preventAutoHideAsync();

function Navegacao() {
  const { tema } = useTema();
  const { status } = useAuth();

  // No navegador do computador o app esticava na largura toda e o layout, desenhado
  // para 390px, ficava espalhado. Na web ele vive numa coluna de celular centralizada,
  // com uma borda discreta separando do fundo.
  const naWeb = Platform.OS === 'web';

  return (
    <View className={naWeb ? 'flex-1 items-center bg-sunken' : 'flex-1 bg-canvas'}>
      {/* no dark o conteudo da barra do sistema e claro, e vice-versa */}
      <StatusBar style={tema === 'dark' ? 'light' : 'dark'} />
      <View
        className={naWeb ? 'w-full flex-1 bg-canvas web:border-x web:border-divider' : 'flex-1'}
        style={naWeb ? { maxWidth: 480 } : undefined}
      >
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
      </View>
      {/* a abertura de marca cobre tudo ate a sessao resolver (e no minimo 1,5 s) */}
      <Abertura pronto={status !== 'carregando'} />
    </View>
  );
}

export default function RootLayout() {
  const [fontesCarregadas, erroDeFonte] = useFonts(FONTES);
  const queryClient = useMemo(() => criarQueryClient(), []);

  useEffect(() => {
    if (fontesCarregadas || erroDeFonte) {
      void SplashScreen.hideAsync();
    }
  }, [fontesCarregadas, erroDeFonte]);

  // Sem as fontes o layout mede errado (Playfair e Inter tem metricas bem diferentes
  // da fonte de sistema), entao segura a arvore inteira ate carregar.
  if (!fontesCarregadas && !erroDeFonte) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <Navegacao />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
