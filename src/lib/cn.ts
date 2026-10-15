/**
 * Junta classes condicionais. Versao minima do `clsx` — nao vale uma dependencia.
 *
 * Nao faz merge de conflito (tipo `twMerge`): quando duas classes brigam, a ULTIMA
 * declarada no CSS gerado vence, nao a ultima na string. Entao prefira escolher a
 * classe certa com um ternario a empilhar duas e torcer.
 */
export type ClassValue = string | false | null | undefined;

export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ');
}
