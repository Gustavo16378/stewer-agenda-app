/**
 * Responsivo: o app foi desenhado para celular (390px). Em tablet deitado e desktop
 * a barra de abas vira menu lateral e o conteudo ganha largura maxima de leitura,
 * em vez de esticar de ponta a ponta.
 */
import { useWindowDimensions } from 'react-native';

/** A partir daqui ha espaco para menu lateral + conteudo confortavel. */
export const LARGURA_LAYOUT_LARGO = 820;

/** Largura maxima do conteudo das telas no layout largo. */
export const LARGURA_CONTEUDO = 760;

export function useLayoutLargo(): boolean {
  const { width } = useWindowDimensions();
  return width >= LARGURA_LAYOUT_LARGO;
}

/** Paineis de edicao (Modal): em tela larga, uma coluna de formulario no meio. */
export const PAINEL_CENTRALIZADO = {
  width: '100%',
  maxWidth: 560,
  alignSelf: 'center',
} as const;
