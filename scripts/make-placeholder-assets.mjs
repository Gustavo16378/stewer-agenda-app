/**
 * Gera os assets PLACEHOLDER de icone e splash (icon, adaptive icon, splash, favicon).
 *
 * Sao placeholders de proposito: o losango dourado da marca sobre o preto do design,
 * sem tipografia (nao ha renderizador de fonte aqui). Troque por arte final antes de
 * publicar. Rode com:  node scripts/make-placeholder-assets.mjs
 *
 * Escreve PNG na mao (zlib do proprio node) para nao adicionar dependencia de imagem.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Tokens do design (design/Stewer Gabriel App.dc.html)
const INK_BG = [0x0a, 0x0a, 0x0a, 0xff]; // #0A0A0A fundo de tela dark
const GOLD = [0xc9, 0xa9, 0x6a, 0xff]; // #C9A96A acento
const CREAM = [0xf1, 0xeb, 0xe0, 0xff]; // #F1EBE0 tinta clara
const CLEAR = [0, 0, 0, 0];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** @param {number} size @param {(x:number,y:number)=>number[]} shade */
function png(size, shade) {
  // scanlines RGBA com o byte de filtro 0 na frente
  const raw = Buffer.alloc(size * (size * 4 + 1));
  let o = 0;
  for (let y = 0; y < size; y++) {
    raw[o++] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = shade(x, y);
      raw[o++] = r;
      raw[o++] = g;
      raw[o++] = b;
      raw[o++] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * Contorno de losango (quadrado a 45 graus) centrado, igual ao losango do logo do design.
 * @param size lado da imagem
 * @param half meia-diagonal do losango, em px
 * @param stroke espessura do contorno, em px
 */
function diamondOutline(size, half, stroke) {
  const c = (size - 1) / 2;
  return (x, y) => {
    // |dx| + |dy| == half descreve a borda do losango
    const d = Math.abs(x - c) + Math.abs(y - c);
    return Math.abs(d - half) <= stroke / 2;
  };
}

function write(relPath, buf) {
  const full = resolve(ROOT, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, buf);
  console.log(`${relPath}  ${(buf.length / 1024).toFixed(1)} kB`);
}

// icone do app: losango dourado + miolo creme sobre preto
{
  const S = 1024;
  const edge = diamondOutline(S, 300, 10);
  const inner = diamondOutline(S, 150, 6);
  write(
    'assets/images/icon.png',
    png(S, (x, y) => (edge(x, y) ? GOLD : inner(x, y) ? CREAM : INK_BG))
  );
}

// adaptive icon do android: foreground transparente (o fundo vem do app.config)
{
  const S = 1024;
  // o android recorta ~33%, entao o losango fica menor para caber na zona segura
  const edge = diamondOutline(S, 210, 9);
  const inner = diamondOutline(S, 105, 5);
  write(
    'assets/images/android-icon-foreground.png',
    png(S, (x, y) => (edge(x, y) ? GOLD : inner(x, y) ? CREAM : CLEAR))
  );
}

// monochrome (themed icons do android 13+): mesma forma, branca
{
  const S = 1024;
  const edge = diamondOutline(S, 210, 9);
  const inner = diamondOutline(S, 105, 5);
  const WHITE = [0xff, 0xff, 0xff, 0xff];
  write(
    'assets/images/android-icon-monochrome.png',
    png(S, (x, y) => (edge(x, y) || inner(x, y) ? WHITE : CLEAR))
  );
}

// splash: losango dourado transparente, o fundo preto vem do plugin expo-splash-screen
{
  const S = 512;
  const edge = diamondOutline(S, 170, 6);
  const inner = diamondOutline(S, 85, 4);
  write(
    'assets/images/splash-icon.png',
    png(S, (x, y) => (edge(x, y) ? GOLD : inner(x, y) ? CREAM : CLEAR))
  );
}

// favicon do web
{
  const S = 48;
  const edge = diamondOutline(S, 16, 2);
  write(
    'assets/images/favicon.png',
    png(S, (x, y) => (edge(x, y) ? GOLD : INK_BG))
  );
}

// placeholder generico de avatar/foto, usado como fallback do expo-image
{
  const S = 256;
  const edge = diamondOutline(S, 54, 3);
  const FRAME = [0x24, 0x24, 0x24, 0xff]; // #242424
  write(
    'assets/images/photo-placeholder.png',
    png(S, (x, y) => (edge(x, y) ? GOLD : FRAME))
  );
}
