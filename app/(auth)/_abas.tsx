/**
 * Entrar / Criar conta (redesenho, nov/2026): duas abas em letra normal, com a linha de
 * latao embaixo da ativa. Trocar de aba troca de rota (replace), para o voltar do
 * navegador nao alternar entre as duas.
 *
 * Arquivo com `_` na frente: o Expo Router ignora como rota.
 */
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { cn } from '@/lib/cn';

const ABAS = [
  { chave: 'entrar', titulo: 'Entrar', rota: '/(auth)/entrar' },
  { chave: 'criar-conta', titulo: 'Criar conta', rota: '/(auth)/criar-conta' },
] as const;

export function AbasAcesso({ ativa }: { ativa: 'entrar' | 'criar-conta' }) {
  const router = useRouter();

  return (
    <View accessibilityRole="tablist" className="mt-8 flex-row gap-8 border-b border-borda">
      {ABAS.map((aba) => {
        const selecionada = aba.chave === ativa;
        return (
          <Pressable
            key={aba.chave}
            accessibilityRole="tab"
            accessibilityState={{ selected: selecionada }}
            onPress={() => (selecionada ? undefined : router.replace(aba.rota as never))}
            hitSlop={8}
            className={cn('-mb-px pb-3', selecionada && 'border-b-2 border-latao')}
          >
            <Text
              className={cn(
                'font-sans-medium text-ui-lg',
                selecionada ? 'text-texto' : 'text-texto-3'
              )}
              maxFontSizeMultiplier={1.3}
            >
              {aba.titulo}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
