/**
 * As abas ENTRAR / CRIAR CONTA do frame 02.
 *
 * Design literal:
 *   contêiner: `display:flex; border-bottom:1px solid ink@.14; margin-top:40px`
 *   aba ativa: `padding:0 2px 14px; margin-right:34px; font-size:10px; font-weight:600;
 *               letter-spacing:.2em; border-bottom:1px solid #C9A96A; margin-bottom:-1px`
 *   aba inativa: mesmo miolo, `color:ink@.4`, sem borda
 *
 * O `margin-bottom:-1px` faz o sublinhado dourado cobrir a linha do contêiner —
 * em RN o equivalente e o `-mb-px` abaixo.
 *
 * Arquivo com `_` na frente: o Expo Router ignora como rota.
 */
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { cn } from '@/lib/cn';

const ABAS = [
  { chave: 'entrar', titulo: 'ENTRAR', rota: '/(auth)/entrar' },
  { chave: 'criar-conta', titulo: 'CRIAR CONTA', rota: '/(auth)/criar-conta' },
] as const;

export function AbasAcesso({ ativa }: { ativa: 'entrar' | 'criar-conta' }) {
  const router = useRouter();

  return (
    <View className="mt-10 flex-row border-b border-card-border">
      {ABAS.map((aba, i) => {
        const selecionada = aba.chave === ativa;
        return (
          <Pressable
            key={aba.chave}
            accessibilityRole="tab"
            accessibilityState={{ selected: selecionada }}
            onPress={() => router.replace(aba.rota as never)}
            hitSlop={8}
            className={cn(
              '-mb-px px-[2px] pb-[14px]',
              i === 0 && 'mr-[34px]',
              selecionada && 'border-b border-gold-border'
            )}
          >
            <Text
              className={cn(
                'font-sans-semibold text-caps-md tracking-wide',
                selecionada ? 'text-ink' : 'text-text-dim'
              )}
              style={{ includeFontPadding: false }}
              maxFontSizeMultiplier={1.15}
            >
              {aba.titulo}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
