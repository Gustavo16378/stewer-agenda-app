/**
 * Botoes do design.
 *
 * Primario (8 ocorrencias): `background:#F1EBE0; color:#0A0A0A; border-radius:2px;
 * padding:18px; text-align:center; font-size:10.5px; font-weight:600; letter-spacing:.22em`
 * com `style-hover="opacity:.92"`. No light ele inverte: fundo #0A0A0A, texto #F1EBE0 —
 * que e exatamente `bg-ink` + `text-ink-inverse`, sem precisar de `dark:`.
 *
 * Fantasma: so contorno `1px solid ink@.22`, mesmo miolo de label.
 * Texto: so o label, usado nas acoes secundarias das linhas ("REAGENDAR", "DETALHES").
 */
import { ActivityIndicator, Pressable, View, type PressableProps } from 'react-native';

import { cn } from '@/lib/cn';

import { LabelCaps } from './texto';

/**
 * `fantasma` e o botao de contorno cheio (SAIR DA CONTA, NOVO AGENDAMENTO PARA ESTE
 * CLIENTE: padding 15-16, label 10px .22em ink@.65-.75). `fantasmaCompacto` e a versao
 * de canto de cabecalho (NOVO SERVIÇO: padding 10px 16px, label 9px .18em ink@.8).
 */
type Variante = 'primario' | 'fantasma' | 'fantasmaCompacto' | 'texto';

export interface BotaoProps extends Omit<PressableProps, 'children' | 'style'> {
  titulo: string;
  variante?: Variante;
  carregando?: boolean;
  className?: string;
  /** Alinha o label a esquerda em vez de centralizar (usado nas linhas de lista). */
  alinhamento?: 'centro' | 'esquerda';
}

const CAIXA: Record<Variante, string> = {
  primario: 'bg-ink rounded-token py-[18px] px-4',
  fantasma: 'border-ghost-border rounded-token border py-[15px] px-4',
  fantasmaCompacto: 'border-ghost-border rounded-token border py-[10px] px-4',
  texto: '',
};

const LABEL: Record<Variante, string> = {
  primario: 'text-ink-inverse',
  fantasma: 'text-caps-md text-ink/75',
  fantasmaCompacto: 'text-caps tracking-row text-ink/80',
  texto: 'text-gold',
};

export function Botao({
  titulo,
  variante = 'primario',
  carregando = false,
  disabled,
  className,
  alinhamento = 'centro',
  ...props
}: BotaoProps) {
  const inativo = disabled || carregando;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inativo, busy: carregando }}
      disabled={inativo}
      className={cn(
        CAIXA[variante],
        alinhamento === 'centro' ? 'items-center justify-center' : 'items-start',
        inativo && 'opacity-40',
        className
      )}
      // o design usa opacity:.92 no hover; no toque o equivalente e o press feedback
      style={({ pressed }) => (pressed && !inativo ? { opacity: 0.92 } : null)}
      {...props}
    >
      {carregando ? (
        <View className="flex-row items-center gap-2">
          <ActivityIndicator size="small" />
          <LabelCaps
            papel="botao"
            className={cn(LABEL[variante], variante === 'texto' && 'text-caps')}
          >
            {titulo}
          </LabelCaps>
        </View>
      ) : (
        <LabelCaps
          papel="botao"
          compensarTracking={alinhamento === 'centro'}
          className={cn(LABEL[variante], variante === 'texto' && 'text-caps tracking-row')}
        >
          {titulo}
        </LabelCaps>
      )}
    </Pressable>
  );
}

/**
 * Acao secundaria em caps que aparece no fim das linhas do design
 * ("REAGENDAR", "DETALHES", "REPETIR", "EDITAR", "GERENCIAR"):
 * `font-size:9px; font-weight:600; letter-spacing:.18em`, dourada quando e a acao
 * principal da linha e ink@.5 quando e a secundaria.
 */
export function AcaoLinha({
  titulo,
  destaque = false,
  className,
  ...props
}: Omit<PressableProps, 'children' | 'style'> & {
  titulo: string;
  destaque?: boolean;
  className?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={12}
      className={cn('py-1', className)}
      style={({ pressed }) => (pressed ? { opacity: 0.6 } : null)}
      {...props}
    >
      <LabelCaps
        papel="meta"
        className={cn('tracking-row', destaque ? 'text-gold' : 'text-ink/50')}
      >
        {titulo}
      </LabelCaps>
    </Pressable>
  );
}
