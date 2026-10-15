import { QueryClient } from '@tanstack/react-query';

import { ApiError } from './errors';

/**
 * Politica de cache e de retry do app.
 *
 * Retry so faz sentido para falha de rede e erro de servidor. Repetir um 401, 403, 404,
 * 409 ou uma validacao e desperdicio: a resposta vai ser a mesma, e no caso do 401 ainda
 * atrasa o logout.
 */
function deveTentarDeNovo(tentativa: number, erro: unknown): boolean {
  if (tentativa >= 2) return false;
  if (erro instanceof ApiError) {
    return erro.kind === 'rede' || erro.kind === 'servidor';
  }
  return false;
}

export function criarQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: deveTentarDeNovo,
        // a agenda muda o tempo todo; 30s evita rebuscar a cada foco de tela
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        // mutacao nao se repete sozinha: criar dois agendamentos e pior que falhar um
        retry: false,
      },
    },
  });
}
