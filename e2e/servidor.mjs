/**
 * Servidor estático mínimo para o export web do Expo, com fallback SPA para index.html.
 * Só para os testes E2E (o Playwright sobe este arquivo); não é infra de produção.
 *
 * Aplica o dist/_headers como o Cloudflare Pages faz (a CSP inclusive): assim os E2E
 * rodam com os mesmos cabeçalhos de segurança da produção, e uma CSP que quebre algo
 * quebra o teste antes de quebrar o app.
 *
 *   node e2e/servidor.mjs [pasta=dist] [porta=4173]
 */
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join } from 'node:path';
import { gzipSync } from 'node:zlib';

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

/** Le o _headers no formato do Cloudflare Pages: um padrao por linha, cabecalhos indentados. */
async function lerCabecalhos(raiz) {
  const regras = [];
  try {
    let atual = null;
    for (const linha of (await readFile(join(raiz, '_headers'), 'utf8')).split('\n')) {
      if (!linha.trim()) continue;
      if (!/^\s/.test(linha)) {
        atual = { padrao: linha.trim(), cabecalhos: {} };
        regras.push(atual);
      } else if (atual) {
        const i = linha.indexOf(':');
        atual.cabecalhos[linha.slice(0, i).trim()] = linha.slice(i + 1).trim();
      }
    }
  } catch {
    // sem _headers: serve sem cabecalhos extras
  }
  return (url) =>
    Object.assign(
      {},
      ...regras
        .filter((r) =>
          new RegExp('^' + r.padrao.replace(/[.]/g, '\\.').replace(/\*/g, '.*') + '$').test(url)
        )
        .map((r) => r.cabecalhos)
    );
}

/** Sobe o servidor e resolve quando ele estiver ouvindo. */
export async function servir(raiz, porta) {
  const cabecalhosDe = await lerCabecalhos(raiz);
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
        const tipo = TIPOS[extname(c)] ?? 'application/octet-stream';
        let corpo = await readFile(c);
        // compacta texto como a Cloudflare faz: o Lighthouse mede o peso que chega de verdade
        const compacta =
          /^(text|application\/json)/.test(tipo) &&
          /gzip/.test(req.headers['accept-encoding'] ?? '');
        if (compacta) corpo = gzipSync(corpo);
        res.writeHead(200, {
          ...cabecalhosDe(url),
          'Content-Type': tipo,
          ...(compacta ? { 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' } : {}),
        });
        res.end(corpo);
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
