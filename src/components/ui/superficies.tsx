/**
 * Superficies e separadores.
 *
 * Card em destaque (frame 03): `border:1px solid #C9A96A; border-radius:2px;
 * padding:26px 24px; gap:14px`. No DARK ele nao tem preenchimento nenhum — so o
 * contorno dourado; no LIGHT ganha o wash `rgba(255,255,255,.35)`. E por isso que o
 * preenchimento tem token proprio (`wash`) e nao reusa `surface`: `surface` e a
 * superficie ELEVADA (#121110 no dark, dos cards da agenda e das anotacoes), que e
 * outro papel e no dark seria visivel onde o design nao pinta nada.
 *
 * Card neutro: `border:1px solid ink@.14` (token `card-border`).
 *
 * Divisor de card: `height:1px; background:ink@.12` (token `divider-card`).
 * Divisor de lista: `border-bottom:1px solid ink@.1` (token `divider`).
 * A diferenca entre os dois e real e esta no design — nao unifique.
 */
import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

import { cn } from '@/lib/cn';

export function Card({
  children,
  destaque = false,
  className,
  ...props
}: ViewProps & { children: ReactNode; destaque?: boolean; className?: string }) {
  return (
    <View
      className={cn(
        // redesenho: couro com borda fina; o destaque ganha a faixa de latao a esquerda
        'rounded-[3px] border border-borda bg-superficie px-6 py-6',
        destaque && 'border-l-2 border-l-latao',
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}

/** Linha de 1px dentro de um card. */
export function DivisorCard({ className }: { className?: string }) {
  return <View className={cn('h-px bg-borda', className)} />;
}

/** Linha de 1px entre itens de lista. */
export function Divisor({ className }: { className?: string }) {
  return <View className={cn('h-px bg-borda/70', className)} />;
}

/**
 * Linha de lista com divisor embaixo, como no bloco "ÚLTIMA VISITA" do frame 03:
 * `padding-bottom:18px; border-bottom:1px solid ink@.1`.
 */
export function LinhaLista({
  children,
  ultima = false,
  className,
}: {
  children: ReactNode;
  /** A ultima linha nao leva divisor. */
  ultima?: boolean;
  className?: string;
}) {
  return (
    <View
      className={cn(
        'flex-row items-center justify-between pb-[18px]',
        !ultima && 'border-b border-borda/70',
        className
      )}
    >
      {children}
    </View>
  );
}
