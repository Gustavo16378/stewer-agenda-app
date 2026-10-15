// Os matchers do Testing Library (toBeOnTheScreen, toHaveTextContent, ...) ja vem
// embutidos a partir da v12.4 — nao ha mais `extend-expect` para importar.

// SecureStore e nativo: no ambiente de teste vira um mapa em memoria, resetado por teste.
jest.mock('expo-secure-store', () => {
  let store: Record<string, string> = {};
  return {
    __reset: () => {
      store = {};
    },
    getItemAsync: jest.fn(async (k: string) => store[k] ?? null),
    setItemAsync: jest.fn(async (k: string, v: string) => {
      store[k] = v;
    }),
    deleteItemAsync: jest.fn(async (k: string) => {
      delete store[k];
    }),
    isAvailableAsync: jest.fn(async () => true),
  };
});

jest.mock('@react-native-async-storage/async-storage', () => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn(async (k: string) => store[k] ?? null),
    setItem: jest.fn(async (k: string, v: string) => {
      store[k] = v;
    }),
    removeItem: jest.fn(async (k: string) => {
      delete store[k];
    }),
    clear: jest.fn(async () => {
      store = {};
    }),
  };
});

// expo-font carrega arquivo real; nos testes as fontes ja "estao carregadas".
jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
  loadAsync: jest.fn(async () => undefined),
  isLoaded: () => true,
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(async () => undefined),
  hideAsync: jest.fn(async () => undefined),
  setOptions: jest.fn(),
}));

// Silencia o aviso de act() do Reanimated em teste de componente.
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => undefined;
  return Reanimated;
});
