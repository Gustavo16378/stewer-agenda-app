/**
 * O papel que vai dentro do token (claim `role`). A API decide o acesso por ele, entao
 * e ele que tem de bater com o papel atual da conta: se alguem ganhou ou perdeu acesso
 * depois do login, o token antigo continua com o papel velho ate a pessoa entrar de novo.
 *
 * Nao valida assinatura (quem valida e a API); so le. Token ilegivel: undefined.
 */
export function papelDoToken(token: string | null | undefined): string | undefined {
  const meio = token?.split('.')[1];
  if (!meio) return undefined;
  try {
    const base64 = meio.replace(/-/g, '+').replace(/_/g, '/');
    const completo = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const corpo = JSON.parse(globalThis.atob(completo)) as { role?: unknown };
    return typeof corpo.role === 'string' ? corpo.role : undefined;
  } catch {
    return undefined;
  }
}
