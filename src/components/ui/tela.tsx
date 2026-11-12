/**
 * Casca de tela.
 *
 * DECISAO: a "status bar" desenhada nos 19 frames (9:41 + antena + bateria) e artefato
 * de MOCKUP, nao interface. Num app de verdade quem desenha isso e o sistema. Aqui o
 * `height:50px` do design vira o safe-area inset real do aparelho — e o mesmo espaco
 * otico, mas honesto. Idem para o "home indicator" de 118x4px do rodape.
 *
 * O padding lateral padrao e 28px, medido no design (`padding:44px 28px 0` na home,
 * `padding:52px 28px 0` no acesso, `padding:30px 28px 0` no wizard).
 */
import type { ReactNode } from 'react';
import { ScrollView, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '@/lib/cn';
import { LARGURA_CONTEUDO, useLayoutLargo } from '@/lib/responsivo';

export interface TelaProps {
  children: ReactNode;
  /** Sem padding lateral, para listas que sangram ate a borda. */
  semPaddingLateral?: boolean;
  className?: string;
  /** Respeita o inset de baixo. Desligue quando a tela vive dentro das Tabs. */
  insetInferior?: boolean;
  /** Em tela larga, o conteudo nao passa disto (padrao 760; formularios de acesso, 440). */
  larguraMaxima?: number;
}

export function Tela({
  children,
  semPaddingLateral = false,
  className,
  insetInferior = true,
  larguraMaxima = LARGURA_CONTEUDO,
}: TelaProps) {
  const insets = useSafeAreaInsets();
  const largo = useLayoutLargo();

  return (
    <View
      className={cn('flex-1 bg-canvas', !semPaddingLateral && 'px-screen-x', className)}
      style={[
        { paddingTop: insets.top, paddingBottom: insetInferior ? insets.bottom : 0 },
        largo && { width: '100%', maxWidth: larguraMaxima, alignSelf: 'center' },
      ]}
    >
      {children}
    </View>
  );
}

export interface TelaRolavelProps extends ScrollViewProps {
  children: ReactNode;
  semPaddingLateral?: boolean;
  className?: string;
  insetInferior?: boolean;
  larguraMaxima?: number;
}

/** Igual a `Tela`, mas o conteudo rola. O padding lateral vai no conteudo, nao na casca,
 *  para a barra de rolagem encostar na borda da tela. */
export function TelaRolavel({
  children,
  semPaddingLateral = false,
  className,
  insetInferior = true,
  larguraMaxima = LARGURA_CONTEUDO,
  contentContainerStyle,
  ...props
}: TelaRolavelProps) {
  const insets = useSafeAreaInsets();
  const largo = useLayoutLargo();

  return (
    <View className={cn('flex-1 bg-canvas', className)} style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1"
        contentContainerClassName={cn(!semPaddingLateral && 'px-screen-x')}
        contentContainerStyle={[
          { paddingBottom: (insetInferior ? insets.bottom : 0) + 32 },
          // em tela larga o conteudo fica numa coluna de leitura centralizada, com folga em cima
          largo && { width: '100%', maxWidth: larguraMaxima, alignSelf: 'center', paddingTop: 24 },
          contentContainerStyle,
        ]}
        keyboardShouldPersistTaps="handled"
        {...props}
      >
        {children}
      </ScrollView>
    </View>
  );
}
