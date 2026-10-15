/**
 * Onde o JWT vive: expo-secure-store (Keychain no iOS, EncryptedSharedPreferences no Android).
 *
 * Nao ha refresh token nesta API. O `TokenResponse` traz `expiraEmSegundos`, entao guardamos
 * o INSTANTE de expiracao calculado no momento do login e, passado esse instante, tratamos
 * como deslogado sem nem tentar a chamada — melhor que descobrir por um 401 no meio da tela.
 */
import * as SecureStore from 'expo-secure-store';

import { MARGEM_EXPIRACAO_MS } from './config';
import type { Usuario } from './types';

const CHAVE_TOKEN = 'stewer.jwt';
const CHAVE_EXPIRA_EM = 'stewer.jwt.expiraEm';
const CHAVE_USUARIO = 'stewer.usuario';

export interface SessaoGuardada {
  token: string;
  /** epoch ms em que o token deixa de valer. */
  expiraEm: number;
  /**
   * Quem e o dono do token, como veio do login.
   *
   * Guardado para que abrir o app SEM REDE ainda saiba qual papel mostrar. Sem
   * isso a unica fonte do usuario era `GET /auth/eu`, e uma abertura offline
   * so tinha dois destinos ruins: travar na splash ou deslogar quem continuava
   * com sessao valida. E uma copia, nao a verdade: a primeira resposta da API
   * que chegar substitui.
   */
  usuario?: Usuario;
}

/** O token ainda vale? Considera uma margem para nao usar um token que vence no caminho. */
export function sessaoValida(
  sessao: SessaoGuardada | null,
  agora: number = Date.now()
): sessao is SessaoGuardada {
  return !!sessao && sessao.expiraEm - MARGEM_EXPIRACAO_MS > agora;
}

/** Converte `expiraEmSegundos` do login no instante absoluto de expiracao. */
export function expiraEmDeSegundos(
  expiraEmSegundos: number | undefined,
  agora: number = Date.now()
): number {
  // sem o campo, assume uma sessao curta em vez de eterna
  const segundos = Number.isFinite(expiraEmSegundos) ? Number(expiraEmSegundos) : 0;
  return agora + Math.max(0, segundos) * 1000;
}

export async function lerSessao(): Promise<SessaoGuardada | null> {
  try {
    const [token, expiraEmRaw, usuarioRaw] = await Promise.all([
      SecureStore.getItemAsync(CHAVE_TOKEN),
      SecureStore.getItemAsync(CHAVE_EXPIRA_EM),
      SecureStore.getItemAsync(CHAVE_USUARIO),
    ]);
    if (!token) return null;
    const expiraEm = Number(expiraEmRaw);
    if (!Number.isFinite(expiraEm)) return null;
    return { token, expiraEm, usuario: lerUsuario(usuarioRaw) };
  } catch {
    // SecureStore indisponivel (ex.: web sem https) — trata como deslogado
    return null;
  }
}

/** JSON corrompido nao pode derrubar a abertura do app: vira "sem usuario". */
function lerUsuario(bruto: string | null): Usuario | undefined {
  if (!bruto) return undefined;
  try {
    const lido = JSON.parse(bruto) as Usuario;
    return lido && typeof lido === 'object' && lido.id ? lido : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Grava a sessao. NAO estoura se o SecureStore estiver indisponivel (keychain travado,
 * app rodando no web): quem manda nas requisicoes e a sessao em memoria, entao o login
 * continua valendo — so nao sobrevive a fechar o app. Falhar aqui derrubaria um login
 * que, de resto, deu certo.
 */
export async function gravarSessao(sessao: SessaoGuardada): Promise<boolean> {
  try {
    await Promise.all([
      SecureStore.setItemAsync(CHAVE_TOKEN, sessao.token),
      SecureStore.setItemAsync(CHAVE_EXPIRA_EM, String(sessao.expiraEm)),
      sessao.usuario
        ? SecureStore.setItemAsync(CHAVE_USUARIO, JSON.stringify(sessao.usuario))
        : SecureStore.deleteItemAsync(CHAVE_USUARIO),
    ]);
    return true;
  } catch (e) {
    console.warn(
      'Nao foi possivel guardar a sessao no SecureStore; ela vale so ate fechar o app.',
      e
    );
    return false;
  }
}

export async function apagarSessao(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(CHAVE_TOKEN).catch(() => undefined),
    SecureStore.deleteItemAsync(CHAVE_EXPIRA_EM).catch(() => undefined),
    SecureStore.deleteItemAsync(CHAVE_USUARIO).catch(() => undefined),
  ]);
}
