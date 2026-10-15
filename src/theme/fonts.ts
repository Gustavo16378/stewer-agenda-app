/**
 * As duas familias do design, carregadas pelo expo-font.
 *
 * Do painel da capa do export: Playfair Display = "DISPLAY · TÍTULOS",
 * Inter = "UI · LABELS EM CAPS". Os pesos sao os que o `<link>` do design pede:
 * Playfair 400/500/600 (+ italico 400/500) e Inter 400/500/600.
 *
 * As CHAVES deste mapa sao os nomes de familia que o React Native enxerga, e tem de
 * bater exatamente com `theme.extend.fontFamily` do tailwind.config.js — e o que faz
 * `font-display` e `font-sans-semibold` funcionarem.
 */
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_500Medium_Italic,
  PlayfairDisplay_600SemiBold,
} from '@expo-google-fonts/playfair-display';

export const FONTES = {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_500Medium_Italic,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} as const;

export type NomeFonte = keyof typeof FONTES;
