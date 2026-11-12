/**
 * No computador, em volta da coluna de conteudo, o fundo segue o tema: escuro no escuro,
 * papel no claro. Antes a navegacao pintava o cinza padrao dela nos lados.
 */
import { expect, test, type Page } from '@playwright/test';

import { entrar, novoCliente, SEED } from '../apoio';

/** A cor de fundo que aparece num ponto da tela (sobe ate achar um fundo pintado). */
async function fundoEm(page: Page, x: number, y: number) {
  return page.evaluate(
    ([px, py]) => {
      let el = document.elementFromPoint(px!, py!) as HTMLElement | null;
      while (el) {
        const cor = getComputedStyle(el).backgroundColor;
        if (cor && cor !== 'transparent' && !/rgba\(.*, 0\)$/.test(cor)) return cor;
        el = el.parentElement;
      }
      return getComputedStyle(document.body).backgroundColor;
    },
    [x, y]
  );
}

function luminancia(cor: string) {
  const [r = 0, g = 0, b = 0] = (cor.match(/\d+(\.\d+)?/g) ?? []).map(Number);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const PAPEIS = [
  {
    papel: 'admin',
    email: () => SEED.admin,
    abas: ['Agenda', 'Clientes', 'Painel', 'Serviços', 'Equipe', 'Estúdio', 'Auditoria'],
  },
  { papel: 'cliente', email: () => '', abas: ['Início', 'Meus horários', 'Perfil'] },
];

for (const esquema of ['dark', 'light'] as const) {
  for (const { papel, email, abas } of PAPEIS) {
    test(`tema ${esquema === 'dark' ? 'escuro' : 'claro'} no computador, ${papel}: o fundo em volta segue o tema`, async ({
      page,
      request,
    }, info) => {
      test.skip(info.project.name !== 'desktop', 'so o computador tem espaco dos lados');
      await page.emulateMedia({ colorScheme: esquema });
      if (papel === 'cliente') {
        const c = await novoCliente(request, 'Tema');
        await entrar(page, c.email, c.senha);
      } else {
        await entrar(page, email(), SEED.senha);
      }
      for (const aba of abas) {
        await page.getByRole('tab', { name: aba }).filter({ visible: true }).first().click();
        await page.waitForTimeout(400);
        const largura = page.viewportSize()!.width;
        for (const x of [260, largura - 20]) {
          const cor = await fundoEm(page, x, 500);
          const l = luminancia(cor);
          if (esquema === 'dark') expect(l, `${aba} em x=${x}: ${cor}`).toBeLessThan(60);
          else expect(l, `${aba} em x=${x}: ${cor}`).toBeGreaterThan(180);
        }
      }
    });
  }
}
