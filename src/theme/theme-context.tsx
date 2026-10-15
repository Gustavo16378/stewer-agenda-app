/**
 * Tema dark/light: segue o sistema por padrao, com toggle manual que persiste.
 *
 * Quem realmente aplica o tema e o NativeWind — ele acrescenta/remove a classe `.dark`,
 * e o `.dark:root` do global.css troca todas as variaveis de cor de uma vez. Aqui so
 * decidimos QUAL modo vale e guardamos a escolha do usuario.
 *
 * Tres estados de preferencia:
 *   'sistema' -> acompanha o aparelho (padrao)
 *   'dark' / 'light' -> escolha manual, vence o sistema
 *
 * O produto e dark-first (17 dos 19 frames do design sao escuros), mas "seguir o sistema"
 * e o comportamento pedido: um aparelho em modo claro abre o app claro.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useNativewindColorScheme } from 'nativewind';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const CHAVE_PREFERENCIA = 'stewer.tema';

export type PreferenciaTema = 'sistema' | 'dark' | 'light';
export type TemaEfetivo = 'dark' | 'light';

interface TemaContextValue {
  /** O que o usuario escolheu. */
  preferencia: PreferenciaTema;
  /** O tema que esta valendo agora, ja resolvido. */
  tema: TemaEfetivo;
  definirPreferencia: (p: PreferenciaTema) => void;
  /** Alterna entre claro e escuro, saindo de 'sistema' se for o caso. */
  alternarTema: () => void;
}

const TemaContext = createContext<TemaContextValue | null>(null);

function ehPreferencia(v: unknown): v is PreferenciaTema {
  return v === 'sistema' || v === 'dark' || v === 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { colorScheme, setColorScheme } = useNativewindColorScheme();
  const [preferencia, setPreferencia] = useState<PreferenciaTema>('sistema');

  // Restaura a escolha salva. Ate carregar, vale 'sistema' — que e o padrao mesmo.
  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const salvo = await AsyncStorage.getItem(CHAVE_PREFERENCIA);
        if (!cancelado && ehPreferencia(salvo)) {
          setPreferencia(salvo);
        }
      } catch {
        // sem storage, segue no padrao
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  // Repassa a preferencia para o NativeWind, que e quem liga a classe `.dark`.
  useEffect(() => {
    setColorScheme(preferencia === 'sistema' ? 'system' : preferencia);
  }, [preferencia, setColorScheme]);

  const definirPreferencia = useCallback((p: PreferenciaTema) => {
    setPreferencia(p);
    void AsyncStorage.setItem(CHAVE_PREFERENCIA, p).catch(() => undefined);
  }, []);

  // `colorScheme` do NativeWind ja e o valor resolvido (inclusive quando e 'system').
  const tema: TemaEfetivo = colorScheme === 'light' ? 'light' : 'dark';

  const alternarTema = useCallback(() => {
    definirPreferencia(tema === 'dark' ? 'light' : 'dark');
  }, [definirPreferencia, tema]);

  const value = useMemo<TemaContextValue>(
    () => ({ preferencia, tema, definirPreferencia, alternarTema }),
    [preferencia, tema, definirPreferencia, alternarTema]
  );

  return <TemaContext.Provider value={value}>{children}</TemaContext.Provider>;
}

export function useTema(): TemaContextValue {
  const ctx = useContext(TemaContext);
  if (!ctx) throw new Error('useTema precisa estar dentro de <ThemeProvider>.');
  return ctx;
}

/**
 * Cores literais para o que NAO passa por className: StatusBar, cor de fundo do
 * navegador, `placeholderTextColor` do TextInput, etc. Sao os mesmos valores do
 * global.css — a unica duplicacao aceitavel, porque essas APIs so aceitam string.
 */
export const CORES = {
  dark: {
    canvas: '#0A0A0A',
    surface: '#121110',
    ink: '#F1EBE0',
    gold: '#C9A96A',
    goldBorder: '#C9A96A',
    divider: 'rgba(241,235,224,0.1)',
    fieldBorder: 'rgba(241,235,224,0.16)',
    placeholder: 'rgba(241,235,224,0.35)',
    textMuted: 'rgba(241,235,224,0.45)',
  },
  light: {
    canvas: '#F1EBE0',
    surface: 'rgba(255,255,255,0.35)',
    ink: '#0A0A0A',
    gold: '#A8894F',
    goldBorder: '#C9A96A',
    divider: 'rgba(10,10,10,0.12)',
    fieldBorder: 'rgba(10,10,10,0.18)',
    placeholder: 'rgba(10,10,10,0.38)',
    textMuted: 'rgba(10,10,10,0.45)',
  },
} as const satisfies Record<TemaEfetivo, Record<string, string>>;

/** Atalho para pegar a paleta literal do tema que esta valendo. */
export function useCores() {
  const { tema } = useTema();
  return CORES[tema];
}
