/**
 * Servidor estático mínimo para o export web do Expo, com fallback SPA para index.html.
 * Só para o smoke local — não é infra de produção.
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
