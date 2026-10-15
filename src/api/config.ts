/**
 * Configuracao de ambiente. Nenhuma URL fica hardcoded no codigo.
 *
 * `EXPO_PUBLIC_*` e substituida pelo Metro em tempo de build, entao ela precisa ser lida
 * como acesso literal a `process.env.EXPO_PUBLIC_X` — desestruturar ou indexar
 * (`process.env[nome]`) nao e substituido e chega `undefined` no bundle.
 */

const RAW_API_URL = process.env.EXPO_PUBLIC_API_URL;
const RAW_TENANT_SLUG = process.env.EXPO_PUBLIC_TENANT_SLUG;

function normalizaBaseUrl(valor: string | undefined): string {
  const url = (valor ?? '').trim().replace(/\/+$/, '');
  if (!url) {
    throw new Error(
      'EXPO_PUBLIC_API_URL nao esta definida. Copie .env.example para .env e aponte para a ' +
        'stewer-agenda-api. No celular use o IP da sua maquina (ex.: http://192.168.0.10:8080); ' +
        'localhost, no aparelho, e o proprio aparelho.'
    );
  }
  return url;
}

/** URL base da API, sem barra no fim. */
export const API_URL = normalizaBaseUrl(RAW_API_URL);

/**
 * Slug do estabelecimento. Opcional: omitido, a API usa o tenant padrao.
 * So vai no corpo de /auth/login e /auth/registrar — os demais endpoints tiram o tenant do JWT.
 */
export const TENANT_SLUG: string | undefined =
  RAW_TENANT_SLUG && RAW_TENANT_SLUG.trim() ? RAW_TENANT_SLUG.trim() : undefined;

/** Quanto antes da expiracao ja tratamos o token como vencido (evita corrida na borda). */
export const MARGEM_EXPIRACAO_MS = 30_000;
