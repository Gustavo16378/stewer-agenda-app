/**
 * Os tres papeis de texto do design, como componentes.
 *
 * O design tem uma assinatura tipografica bem estreita:
 *  - titulos em Playfair Display (`font-display`), sempre sem tracking;
 *  - corpo em Inter regular;
 *  - e o "label em caps": Inter 600, 8-10.5px, tracking .12-.3em, TEXTO JA EM MAIUSCULAS.
 *    `font-weight:600` aparece 270 vezes no arquivo do design — e a assinatura do sistema.
 *
 * Pegadinha de RN que este arquivo resolve num lugar so: `letter-spacing` em caps
 * acrescenta espaco DEPOIS da ultima letra, o que descentraliza texto centralizado e
 * desalinha texto a esquerda. O proprio design compensa com `padding-left:.32em` nos
 * titulos travados. `LabelCaps` faz o mesmo automaticamente quando pedido.
 *
 * IMPORTANTE — `letterSpacing` em React Native e px ABSOLUTO, nao `em`. O que salva
 * aqui e o NativeWind: ele emite `em` como funcao de runtime e resolve por
 * `fontSize * valor` lendo o fontSize DO PROPRIO elemento. Ou seja, `text-caps` e
 * `tracking-section` PRECISAM estar no MESMO <Text> (9px x .24 = 2.16px). Separar o
 * tamanho num componente e o tracking noutro faz o `em` cair no rem e o tracking sair
 * errado em todo o app — por isso os dois andam juntos nas constantes CAPS abaixo.
 *
 * Tambem por isso o peso vem sempre por `fontFamily` (Inter_600SemiBold) e nunca por
 * `fontWeight`: fonte customizada + fontWeight nao casa no Android.
 */
import { Text, type TextProps } from 'react-native';

import { cn } from '@/lib/cn';

// ---------------------------------------------------------------------------

type PapelCaps =
  /** Label de secao / eyebrow: 9px .24em ink@.48 — o combo mais frequente (11x). */
  | 'secao'
  /** Eyebrow de topo de tela, tracking mais aberto: 9px .26em ink@.48 (7x). */
  | 'tela'
  /** Metadado em caps: 9px .2em ink@.45 (18x). */
  | 'meta'
  /** Micro-caps de status / rotulo de campo: 8.5px .18em ink@.42 (23x). */
  | 'micro'
  /** Rotulo de campo dentro de card: 8.5px .24em ink@.45 (10x). */
  | 'campo'
  /** Label de tab bar inativa: 9px .14em ink@.4 (21x). */
  | 'tab'
  /** Label de tab bar ativa: 9px .14em gold (9x). */
  | 'tabAtiva'
  /** Label de botao primario: 10.5px .22em sobre o fundo invertido (8x). */
  | 'botao';

const CAPS: Record<PapelCaps, string> = {
  secao: 'font-sans-semibold text-caps tracking-section text-text-label',
  tela: 'font-sans-semibold text-caps tracking-screen text-text-label',
  meta: 'font-sans-semibold text-caps tracking-wide text-text-muted',
  micro: 'font-sans-semibold text-caps-xs tracking-row text-ink/42',
  campo: 'font-sans-semibold text-caps-xs tracking-section text-text-muted',
  tab: 'font-sans-semibold text-caps tracking-tab text-text-dim',
  tabAtiva: 'font-sans-semibold text-caps tracking-tab text-gold',
  botao: 'font-sans-semibold text-caps-lg tracking-button',
};

/** Quanto de tracking cada papel usa, em `em` — para compensar o espaco final. */
const TRACKING_EM: Record<PapelCaps, number> = {
  secao: 0.24,
  tela: 0.26,
  meta: 0.2,
  micro: 0.18,
  campo: 0.24,
  tab: 0.14,
  tabAtiva: 0.14,
  botao: 0.22,
};

const CORPO_PX: Record<PapelCaps, number> = {
  secao: 9,
  tela: 9,
  meta: 9,
  micro: 8.5,
  campo: 8.5,
  tab: 9,
  tabAtiva: 9,
  botao: 10.5,
};

export interface LabelCapsProps extends TextProps {
  papel?: PapelCaps;
  className?: string;
  /**
   * Compensa o espaco que o tracking acrescenta depois da ultima letra.
   * Ligue em texto CENTRALIZADO (senao ele fica deslocado para a direita).
   * O design faz isso na mao com `padding-left:.32em` nos titulos travados.
   */
  compensarTracking?: boolean;
}

export function LabelCaps({
  papel = 'secao',
  className,
  compensarTracking = false,
  style,
  ...props
}: LabelCapsProps) {
  return (
    <Text
      className={cn(CAPS[papel], className)}
      style={[
        // O Android acrescenta padding de fonte e desalinha os pares label/valor
        // em corpos pequenos. Todos os caps daqui tem <= 10.5px.
        { includeFontPadding: false },
        compensarTracking ? { paddingLeft: CORPO_PX[papel] * TRACKING_EM[papel] } : null,
        style,
      ]}
      // Com a fonte do sistema em "grande", labels como DISPONIBILIDADE (tab bar)
      // estouram a largura. Limita o crescimento sem travar a acessibilidade em 1x.
      maxFontSizeMultiplier={1.15}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------

export interface TituloProps extends TextProps {
  className?: string;
}

/** Titulo em Playfair Display. O tamanho vem por className (`text-d-31`, `text-d-23`...). */
export function Titulo({ className, ...props }: TituloProps) {
  return <Text className={cn('font-display text-ink', className)} {...props} />;
}

/** Corpo de texto em Inter. */
export function Corpo({ className, ...props }: TituloProps) {
  return <Text className={cn('font-sans text-text-body', className)} {...props} />;
}
