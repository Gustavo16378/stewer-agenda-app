/**
 * Servidor estático mínimo para o export web do Expo, com fallback SPA para index.html.
 * Só para os testes E2E (o Playwright sobe este arquivo); não é infra de produção.
 *
 *   node e2e/servidor.mjs [pasta=dist] [porta=4173]
 */
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join } from 'node:path';

const TIPOS = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
  '.map': 'application/json',
};

/** Sobe o servidor e resolve quando ele estiver ouvindo. */
export function servir(raiz, porta) {
  const servidor = createServer(async (req, res) => {
    const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
    const candidatos = [
      join(raiz, url),
      join(raiz, url + '.html'),
      join(raiz, url, 'index.html'),
      join(raiz, 'index.html'),
    ];
    for (const c of candidatos) {
      try {
        if (!(await stat(c)).isFile()) continue;
        res.writeHead(200, { 'Content-Type': TIPOS[extname(c)] ?? 'application/octet-stream' });
        res.end(await readFile(c));
        return;
      } catch {
        // tenta o próximo candidato
      }
    }
    res.writeHead(404);
    res.end('nao encontrado');
  });

  return new Promise((resolve) => servidor.listen(porta, () => resolve(servidor)));
}

// rodado direto pela linha de comando (webServer do Playwright)
if (
  process.argv[1] &&
  import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())
) {
  const raiz = process.argv[2] ?? 'dist';
  const porta = Number(process.argv[3] ?? 4173);
  await servir(raiz, porta);
  console.warn(`servindo ${raiz} em http://localhost:${porta}`);
}
