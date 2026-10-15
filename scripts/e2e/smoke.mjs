/**
 * Fumaça de ponta a ponta: abre o export web do app no Chrome do sistema, loga com cada
 * papel do seed e confere que a tela inicial de cada um renderiza, batendo na API real.
 *
 * Não é teste do app (o alvo é mobile) — é verificação de que a pilha inteira liga:
 * fontes, tokens do NativeWind, roteamento, guardas de papel, TanStack Query e o client
 * HTTP contra a stewer-agenda-api.
 *
 * A API local não manda CORS (irrelevante para o app nativo); aqui o Chrome sobe com
 * `--disable-web-security` num perfil descartável para a chamada passar.
 */
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { launch } from 'puppeteer-core';

const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';

/** As três contas do seed de dev da API (senha dev12345). */
const CONTAS = [
  { papel: 'CLIENTE', email: 'joana@exemplo.dev', esperado: /Boa (tarde|noite|dia)|agenda est/i },
  { papel: 'PROFISSIONAL', email: 'stewer@stewer.dev', esperado: /AGENDA/ },
  { papel: 'ADMIN', email: 'admin@stewer.dev', esperado: /VISÃO GERAL/ },
];

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * @param {string} base URL onde o export web está servido
 * @param {{ saida: string }} opcoes pasta das capturas
 * @returns {Promise<number>} quantidade de papéis que falharam
 */
export async function rodarSmoke(base, { saida }) {
  mkdirSync(saida, { recursive: true });

  const navegador = await launch({
    executablePath: CHROME,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      `--user-data-dir=${join(tmpdir(), 'stewer-smoke-profile')}`,
    ],
  });

  let falhas = 0;

  for (const conta of CONTAS) {
    const pagina = await navegador.newPage();
    await pagina.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

    const erros = [];
    pagina.on('console', (m) => {
      if (m.type() === 'error') erros.push(m.text().slice(0, 300));
    });
    pagina.on('pageerror', (e) => erros.push('PAGEERROR: ' + String(e).slice(0, 300)));

    try {
      await pagina.goto(base, { waitUntil: 'networkidle2', timeout: 60_000 });
      await espera(2500);

      const inputs = await pagina.$$('input');
      if (inputs.length < 2) throw new Error(`esperava 2 inputs no login, achei ${inputs.length}`);
      await inputs[0].click();
      await inputs[0].type(conta.email);
      await inputs[1].click();
      await inputs[1].type('dev12345');

      const clicou = await pagina.evaluate(() => {
        const alvos = [...document.querySelectorAll('div,span')].filter(
          (e) => e.textContent?.trim() === 'ENTRAR' && e.children.length === 0
        );
        const botao = alvos[alvos.length - 1];
        if (!botao) return false;
        (botao.closest('[tabindex],div[role="button"]') ?? botao).click();
        return true;
      });
      if (!clicou) throw new Error('nao achei o botao ENTRAR');

      await espera(4000);

      const texto = await pagina.evaluate(() => document.body.innerText);
      await pagina.screenshot({ path: join(saida, `${conta.papel.toLowerCase()}.png`) });

      const ok = conta.esperado.test(texto) && texto.length > 40;
      console.log(`\n===== ${conta.papel} (${conta.email}) =====`);
      console.log(ok ? 'RENDERIZOU' : 'SUSPEITO');
      console.log(texto.slice(0, 700));
      if (erros.length) {
        console.log('--- erros de console ---');
        erros.slice(0, 8).forEach((e) => console.log('  ' + e));
      }
      if (!ok) falhas++;
    } catch (e) {
      falhas++;
      console.log(`\n===== ${conta.papel} — FALHOU =====`);
      console.log(String(e).slice(0, 500));
      erros.slice(0, 8).forEach((x) => console.log('  ' + x));
      try {
        await pagina.screenshot({ path: join(saida, `${conta.papel.toLowerCase()}-falha.png`) });
      } catch {
        // sem captura
      }
    } finally {
      await pagina.close();
    }
  }

  await navegador.close();
  console.log(`\n=== ${CONTAS.length - falhas}/${CONTAS.length} papéis renderizaram ===`);
  console.log('capturas em', saida);
  return falhas;
}
