/**
 * Depois do `expo export --platform web`:
 *
 * 1. tira os assets de dentro de pastas chamadas `node_modules`;
 * 2. poe titulo, idioma e as tags de previa de link (Open Graph) em todas as paginas.
 *
 * O Expo exporta as fontes em dist/assets/node_modules/@expo-google-fonts/..., e o
 * Cloudflare Pages NAO publica arquivos dentro de pastas com esse nome. Resultado: as
 * fontes davam 404 e o app caia na Times New Roman. Aqui a pasta vira `vendor` e as
 * referencias no JS e no HTML sao reescritas.
 */
import {
  existsSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';

const DIST = process.argv[2] ?? 'dist';
const ORIGEM = join(DIST, 'assets', 'node_modules');
const DESTINO = join(DIST, 'assets', 'vendor');

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
if (existsSync(ORIGEM)) {
  renameSync(ORIGEM, DESTINO);
  percorrer(DIST);
  console.log(`assets movidos para assets/vendor; ${arquivos} arquivo(s) reescrito(s)`);
} else {
  console.log('nada a mover: nao ha assets/node_modules');
}

// 2. Previa do link. Sem isto o WhatsApp mostrava so o endereco, sem imagem nem texto:
// o export do Expo sai com <title> vazio e lang="en". A imagem e gerada por
// scripts/make-og-image.py e vai junto em public/og.jpg.
const SITE = (process.env.SITE_URL ?? 'https://agenda.stewergabriel.com').replace(/\/$/, '');
const TITULO = 'Stewer Gabriel | Agende seu horário';
const DESCRICAO =
  'Visagismo, corte e consultoria de imagem masculina com Stewer Gabriel, em Palmas. Escolha o serviço, o dia e o horário em menos de um minuto.';
const META = [
  `<meta name="description" content="${DESCRICAO}"/>`,
  `<meta name="theme-color" content="#0C0C0C"/>`,
  `<meta property="og:type" content="website"/>`,
  `<meta property="og:site_name" content="Stewer Gabriel"/>`,
  `<meta property="og:locale" content="pt_BR"/>`,
  `<meta property="og:title" content="${TITULO}"/>`,
  `<meta property="og:description" content="${DESCRICAO}"/>`,
  `<meta property="og:url" content="${SITE}/"/>`,
  `<meta property="og:image" content="${SITE}/og.jpg"/>`,
  `<meta property="og:image:width" content="1200"/>`,
  `<meta property="og:image:height" content="630"/>`,
  `<meta property="og:image:alt" content="Retrato de Stewer Gabriel com o convite para agendar"/>`,
  `<meta name="twitter:card" content="summary_large_image"/>`,
  `<meta name="twitter:image" content="${SITE}/og.jpg"/>`,
].join('');

let paginas = 0;
function marcar(pasta) {
  for (const nome of readdirSync(pasta)) {
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) {
      if (nome !== 'assets' && nome !== '_expo') marcar(caminho);
      continue;
    }
    if (!nome.endsWith('.html')) continue;
    const html = readFileSync(caminho, 'utf8');
    // so as paginas do app (as estaticas de public/ ja tem cabecalho proprio)
    if (!html.includes('<title data-rh="true"></title>')) continue;
    writeFileSync(
      caminho,
      html
        .replace('<html  lang="en">', '<html lang="pt-BR">')
        .replace('<html lang="en">', '<html lang="pt-BR">')
        .replace('<title data-rh="true"></title>', `<title data-rh="true">${TITULO}</title>${META}`)
    );
    paginas++;
  }
}
marcar(DIST);
console.log(`previa de link (Open Graph) em ${paginas} pagina(s)`);
