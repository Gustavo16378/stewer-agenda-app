/**
 * Depois do `expo export --platform web`: tira os assets de dentro de pastas chamadas
 * `node_modules`.
 *
 * O Expo exporta as fontes em dist/assets/node_modules/@expo-google-fonts/..., e o
 * Cloudflare Pages NAO publica arquivos dentro de pastas com esse nome. Resultado: as
 * fontes davam 404 e o app caia na Times New Roman. Aqui a pasta vira `vendor` e as
 * referencias no JS e no HTML sao reescritas.
 */
import { existsSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIST = process.argv[2] ?? 'dist';
const ORIGEM = join(DIST, 'assets', 'node_modules');
const DESTINO = join(DIST, 'assets', 'vendor');

if (!existsSync(ORIGEM)) {
  console.log('nada a mover: nao ha assets/node_modules');
  process.exit(0);
}
renameSync(ORIGEM, DESTINO);

let arquivos = 0;
function percorrer(pasta) {
  for (const nome of readdirSync(pasta)) {
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) {
      percorrer(caminho);
    } else if (/\.(js|html|css|json)$/.test(nome)) {
      const texto = readFileSync(caminho, 'utf8');
      if (texto.includes('/assets/node_modules/')) {
        writeFileSync(caminho, texto.replaceAll('/assets/node_modules/', '/assets/vendor/'));
        arquivos++;
      }
    }
  }
}
percorrer(DIST);
console.log(`assets movidos para assets/vendor; ${arquivos} arquivo(s) reescrito(s)`);
