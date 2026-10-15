/**
 * Sessao do usuario: quem esta logado, com que papel, e como entrar e sair.
 *
 * Nao ha refresh token nesta API. O fluxo e:
 *  - login/registro devolvem `TokenResponse` (token + `expiraEmSegundos` + `usuario`);
 *    guardamos o token e o INSTANTE de expiracao no expo-secure-store;
 *  - ao abrir o app, se ha token guardado e ele ainda vale, confirmamos com `GET /auth/eu`
 *    (o token pode ter sido revogado, ou o usuario mudado de papel);
 *  - passada a expiracao, o app trata como deslogado sem nem tentar a chamada;
 *  - um 401 vindo de qualquer chamada tambem desloga (o client avisa por `definirAoDeslogar`).
 */
import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  api,
  definirAoDeslogar,
  definirSessaoAtiva,
  desembrulha,
  desembrulhaCriado,
} from '@/api/client';
import { TENANT_SLUG } from '@/api/config';
import { comoApiError } from '@/api/errors';
import {
  apagarSessao,
  expiraEmDeSegundos,
  gravarSessao,
  lerSessao,
  sessaoValida,
  type SessaoGuardada,
} from '@/api/session-store';
import type { Role, TokenResponse, Usuario } from '@/api/types';

export type StatusAuth = 'carregando' | 'autenticado' | 'deslogado';

interface AuthContextValue {
  status: StatusAuth;
  usuario: Usuario | null;
  role: Role | null;
  entrar: (email: string, senha: string) => Promise<Usuario>;
  registrar: (dados: {
    nome: string;
    email: string;
    senha: string;
    telefone?: string;
  }) => Promise<Usuario>;
  sair: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<StatusAuth>('carregando');
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  // evita que dois 401 simultaneos disparem dois logouts (e dois redirects)
  const deslogando = useRef(false);

  const aplicarSessao = useCallback((sessao: SessaoGuardada | null) => {
    definirSessaoAtiva(sessao);
  }, []);

  const sair = useCallback(async () => {
    if (deslogando.current) return;
    deslogando.current = true;
    try {
      aplicarSessao(null);
      setUsuario(null);
      setStatus('deslogado');
      await apagarSessao();
      // dados de um usuario nunca podem vazar para o proximo que logar neste aparelho
      queryClient.clear();
    } finally {
      deslogando.current = false;
    }
  }, [aplicarSessao, queryClient]);

  // O middleware do client chama isto quando a API responde 401.
  useEffect(() => {
    definirAoDeslogar(() => {
      void sair();
    });
    return () => definirAoDeslogar(null);
  }, [sair]);

  // Restauracao ao abrir o app.
  useEffect(() => {
    let cancelado = false;

    (async () => {
      const guardada = await lerSessao();

      if (!sessaoValida(guardada)) {
        // sem token, ou ja vencido: limpa o resto e vai para o login
        if (guardada) await apagarSessao();
        if (!cancelado) {
          aplicarSessao(null);
          setStatus('deslogado');
        }
        return;
      }

      aplicarSessao(guardada);
      try {
        const eu = await desembrulha(api.GET('/auth/eu'));
        if (cancelado) return;
        setUsuario(eu);
        setStatus('autenticado');
      } catch {
        // token revogado, API fora do ar ou rede caida: nao da para confirmar quem e o usuario
        if (cancelado) return;
        await apagarSessao();
        aplicarSessao(null);
        setStatus('deslogado');
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [aplicarSessao]);

  const guardarToken = useCallback(
    async (resposta: TokenResponse): Promise<Usuario> => {
      const token = resposta.token;
      const dono = resposta.usuario;
      if (!token || !dono) {
        throw comoApiError(new Error('O servidor nao devolveu token ou usuario.'));
      }

      const sessao: SessaoGuardada = {
        token,
        expiraEm: expiraEmDeSegundos(resposta.expiraEmSegundos),
      };
      await gravarSessao(sessao);
      aplicarSessao(sessao);
      // o cache do usuario anterior nao vale para o novo
      queryClient.clear();
      setUsuario(dono);
      setStatus('autenticado');
      return dono;
    },
    [aplicarSessao, queryClient]
  );

  const entrar = useCallback(
    async (email: string, senha: string) => {
      const resposta = await desembrulha(
        api.POST('/auth/login', {
          body: { email, senha, ...(TENANT_SLUG ? { tenantSlug: TENANT_SLUG } : {}) },
        })
      );
      return guardarToken(resposta);
    },
    [guardarToken]
  );

  const registrar = useCallback(
    async (dados: { nome: string; email: string; senha: string; telefone?: string }) => {
      // 201 sem schema na spec; a API devolve TokenResponse (confirmado por curl)
      const resposta = await desembrulhaCriado<TokenResponse>(
        api.POST('/auth/registrar', {
          body: {
            nome: dados.nome,
            email: dados.email,
            senha: dados.senha,
            ...(dados.telefone ? { telefone: dados.telefone } : {}),
            ...(TENANT_SLUG ? { tenantSlug: TENANT_SLUG } : {}),
          },
        })
      );
      return guardarToken(resposta);
    },
    [guardarToken]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      usuario,
      role: usuario?.role ?? null,
      entrar,
      registrar,
      sair,
    }),
    [status, usuario, entrar, registrar, sair]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>.');
  return ctx;
}

/** A rota inicial de cada papel — usada pelo gate e depois do login. */
export function rotaInicialDoPapel(role: Role | null | undefined): string {
  switch (role) {
    case 'CLIENTE':
      return '/(cliente)/(tabs)/inicio';
    case 'PROFISSIONAL':
      return '/(profissional)/(tabs)/agenda';
    case 'ADMIN':
      return '/(admin)/(tabs)/visao-geral';
    default:
      return '/(auth)/entrar';
  }
}
