/** "Ao continuar, voce aceita os Termos de uso e a Politica de privacidade", com links. */
import { Text } from 'react-native';

import { abrirPaginaDoSite } from '@/lib/site';

export function AvisoLegal({ className }: { className?: string }) {
  return (
    <Text
      className={className ?? 'mt-10 text-center font-sans text-help leading-[18.7px] text-ink/38'}
    >
      Ao continuar, você aceita os{' '}
      <Text
        className="text-ink/60 underline"
        accessibilityRole="link"
        onPress={() => abrirPaginaDoSite('/termos')}
      >
        Termos de uso
      </Text>{' '}
      e a{' '}
      <Text
        className="text-ink/60 underline"
        accessibilityRole="link"
        onPress={() => abrirPaginaDoSite('/privacidade')}
      >
        Política de privacidade
      </Text>
      .
    </Text>
  );
}
