/**
 * Antes de qualquer jornada: o export web existe e a API responde. Falha cedo, com a
 * instrucao do que fazer, em vez de 40 testes vermelhos por timeout.
 */
import { existsSync } from 'node:fs';

import { API } from './apoio';

export default async function preparar() {
  if (!existsSync('dist/index.html')) {
    throw new Error('Falta o export web. Rode `npm run build` antes dos testes E2E.');
  }
  const limite = Date.now() + 120_000;
  while (Date.now() < limite) {
    try {
      const r = await fetch(`${API}/ping`);
      if (r.ok) return;
    } catch {
      // ainda subindo
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`A API nao respondeu em ${API}/ping. Suba a stewer-agenda-api (perfil dev).`);
}
