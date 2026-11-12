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
import { createHash } from 'node:crypto';
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

// 1b. Fontes: o Expo publica as .ttf inteiras (as da Inter tem 340 KB cada, oito fontes
// passam de 1,8 MB). Aqui cada uma vira .woff2 so com os caracteres do portugues (latim
// basico, Latin-1 e Latin Extended-A, mais aspas, travessao, reticencias e setas): cerca
// de 25 KB cada. As referencias no HTML e no JS passam a apontar para a .woff2. Um
// caractere fora do recorte (emoji, outro alfabeto num nome) cai na fonte do sistema.
const FONTES = join(DIST, 'assets', 'vendor', '@expo-google-fonts');
if (existsSync(FONTES)) {
  const { default: recortar } = await import('subset-font');
  let caracteres = '';
  for (let c = 32; c < 127; c++) caracteres += String.fromCharCode(c);
  for (let c = 160; c < 384; c++) caracteres += String.fromCharCode(c);
  caracteres +=
    '\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026\u2039\u203A\u2190\u2192\u20AC\u2713';
  const trocas = [];
  const fontes = [];
  (function achar(pasta) {
    for (const nome of readdirSync(pasta)) {
      const caminho = join(pasta, nome);
      if (statSync(caminho).isDirectory()) achar(caminho);
      else if (nome.endsWith('.ttf')) fontes.push(caminho);
    }
  })(FONTES);
  let antes = 0;
  let depois = 0;
  for (const caminho of fontes) {
    const original = readFileSync(caminho);
    const woff2 = await recortar(original, caracteres, { targetFormat: 'woff2' });
    const novo = caminho.replace(/\.ttf$/, '.woff2');
    writeFileSync(novo, woff2);
    antes += original.length;
    depois += woff2.length;
    const nome = caminho.split(/[\\/]/).pop();
    trocas.push([nome, nome.replace(/\.ttf$/, '.woff2')]);
  }
  (function reescrever(pasta) {
    for (const nome of readdirSync(pasta)) {
      const caminho = join(pasta, nome);
      if (statSync(caminho).isDirectory()) {
        if (nome !== 'assets') reescrever(caminho);
        continue;
      }
      if (!/\.(js|html)$/.test(nome)) continue;
      let texto = readFileSync(caminho, 'utf8');
      let mudou = false;
      for (const [de, para] of trocas) {
        if (texto.includes(de)) {
          texto = texto.replaceAll(de, para);
          mudou = true;
        }
      }
      if (mudou) writeFileSync(caminho, texto);
    }
  })(DIST);
  console.log(
    `fontes: ${fontes.length} .ttf viraram .woff2, de ${Math.round(antes / 1024)} KB para ${Math.round(depois / 1024)} KB`
  );
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
        // codificacao declarada logo no comeco (o export nao poe)
        .replace(/<head>(?!<meta charset)/, '<head><meta charset="utf-8"/>')
        // texto aparece na hora com a fonte do sistema e troca quando a Playfair chega
        .replaceAll('font-display:auto', 'font-display:swap')
    );
    paginas++;
  }
}
marcar(DIST);
console.log(`previa de link (Open Graph) em ${paginas} pagina(s)`);

// 3. Cabecalhos de seguranca (dist/_headers, que o Cloudflare Pages aplica). A CSP so
// deixa rodar o script do proprio app: o unico script inline do export (o que liga a
// hidratacao do Expo Router) entra pelo hash, calculado aqui a cada build. Imagens e
// chamadas so para o proprio app, a API e os blocos do mapa do OpenStreetMap.
// no Cloudflare a URL vem do ambiente; local, do .env que o Expo tambem le
function urlDaApi() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  for (const arquivo of ['.env.production.local', '.env.local', '.env.production', '.env']) {
    if (!existsSync(arquivo)) continue;
    const m = /^EXPO_PUBLIC_API_URL=(.*)$/m.exec(readFileSync(arquivo, 'utf8'));
    if (m) return m[1].trim();
  }
  return '';
}
const API = urlDaApi().replace(/\/$/, '');
const scriptsInline = new Set();
function coletarScripts(pasta) {
  for (const nome of readdirSync(pasta)) {
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) {
      if (nome !== 'assets' && nome !== '_expo') coletarScripts(caminho);
      continue;
    }
    if (!nome.endsWith('.html')) continue;
    for (const m of readFileSync(caminho, 'utf8').matchAll(
      /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g
    )) {
      if (m[1].trim()) scriptsInline.add(m[1]);
    }
  }
}
coletarScripts(DIST);
const hashes = [...scriptsInline].map(
  (s) => `'sha256-${createHash('sha256').update(s, 'utf8').digest('base64')}'`
);
const CSP = [
  "default-src 'self'",
  // o Cloudflare Web Analytics injeta o beacon dele na pagina publicada
  `script-src 'self' ${hashes.join(' ')} https://static.cloudflareinsights.com`,
  // o react-native-web escreve estilo em <style> e no atributo style
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${API} https://tile.openstreetmap.org`.replace(/\s+/g, ' '),
  `connect-src 'self' ${API} https://cloudflareinsights.com`.replace(/\s+/g, ' '),
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');
export const CABECALHOS = {
  'Content-Security-Policy': CSP,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};
writeFileSync(
  join(DIST, '_headers'),
  [
    '/*',
    ...Object.entries(CABECALHOS).map(([k, v]) => `  ${k}: ${v}`),
    // arquivos com hash no nome nunca mudam: cache de um ano
    '/_expo/static/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '/assets/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '',
  ].join('\n')
);
console.log(`cabecalhos de seguranca em _headers (${hashes.length} script(s) inline pelo hash)`);
