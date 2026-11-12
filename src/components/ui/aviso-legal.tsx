/** "Ao continuar, voce aceita os Termos de uso e a Politica de privacidade", com links. */
import { Text } from 'react-native';

import { abrirPaginaDoSite } from '@/lib/site';

export function AvisoLegal({ className }: { className?: string }) {
  return (
    <Text
      className={className ?? 'mt-10 text-center font-sans text-ui-sm text-texto-3'}
    >
      Ao continuar, você aceita os{' '}
      <Text
        className="text-texto-2 underline"
        accessibilityRole="link"
        onPress={() => abrirPaginaDoSite('/termos')}
      >
        Termos de uso
      </Text>{' '}
      e a{' '}
      <Text
        className="text-texto-2 underline"
        accessibilityRole="link"
        onPress={() => abrirPaginaDoSite('/privacidade')}
      >
        Política de privacidade
      </Text>
      .
    </Text>
  );
}
