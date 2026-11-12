/**
 * Paginas publicas (termos, privacidade, excluir conta). Elas sao arquivos de
 * `public/` e saem junto com a versao web do app, entao vivem no mesmo endereco.
 *
 * No celular nao ha "mesmo endereco": EXPO_PUBLIC_SITE_URL diz onde a versao web
 * esta publicada. Sem ela, no navegador usa a propria origem.
 */
import { Linking, Platform } from 'react-native';

const RAW_SITE_URL = process.env.EXPO_PUBLIC_SITE_URL;

export function urlDoSite(caminho: string): string | null {
  const base =
    (RAW_SITE_URL && RAW_SITE_URL.trim().replace(/\/+$/, '')) ||
    (Platform.OS === 'web' ? (globalThis.location?.origin ?? '') : '');
  return base ? `${base}${caminho}` : null;
}

export function abrirPaginaDoSite(caminho: string): void {
  const url = urlDoSite(caminho);
  if (url) void Linking.openURL(url);
}
