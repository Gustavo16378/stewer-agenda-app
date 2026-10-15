/**
 * `npm run smoke:web` — exporta o app para web, serve numa porta local, roda o smoke
 * contra a API real e encerra. Pré-requisitos: API no ar na URL do `.env` e Chrome
 * instalado (ou `CHROME_PATH` apontando para outro Chromium).
 */
import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { servir } from './server.mjs';
import { rodarSmoke } from './smoke.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, '..', '..');
const DIST = join(RAIZ, '.expo', 'dist-smoke');
const PORTA = Number(process.env.SMOKE_PORT ?? 3999);

console.log('exportando o app para web…');
const exportacao = spawnSync('npx', ['expo', 'export', '--platform', 'web', '--output-dir', DIST], {
  cwd: RAIZ,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
if (exportacao.status !== 0) {
  console.error('export falhou');
  process.exit(exportacao.status ?? 1);
}

const servidor = await servir(DIST, PORTA);
let falhas = 1;
try {
  falhas = await rodarSmoke(`http://localhost:${PORTA}`, { saida: join(AQUI, 'capturas') });
} finally {
  servidor.close();
  rmSync(DIST, { recursive: true, force: true });
}
process.exit(falhas ? 1 : 0);
