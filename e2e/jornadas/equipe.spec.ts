/**
 * O lado de quem atende: o Stewer abre a agenda, encontra o cliente que marcou, conclui
 * o atendimento e escreve a anotacao de visagismo na ficha. E o admin cuida do catalogo.
 */
import { expect, test, type Page } from '@playwright/test';

import {
  agendarPelaApi,
  botao,
  entrar,
  naTela,
  novoCliente,
  registrar,
  SEED,
  semRolagemLateral,
  unico,
} from '../apoio';

/** Dias de calendario entre hoje (Sao Paulo) e `data` (YYYY-MM-DD). */
function diasAte(data: string) {
  const hoje = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
  return Math.round((Date.parse(data) - Date.parse(hoje)) / 86_400_000);
}

async function aba(page: Page, nome: string) {
  await page.getByRole('tab', { name: nome }).filter({ visible: true }).first().click();
}

test('Stewer acha o cliente na agenda, conclui e anota o visagismo', async ({
  page,
  request,
}, info) => {
  const cliente = await novoCliente(request, 'Ficha');
  const marcado = await agendarPelaApi(request, cliente);

  await test.step('entra e ve a agenda de hoje', async () => {
    await entrar(page, SEED.stewer, SEED.senha);
    await expect(naTela(page, 'Sua agenda')).toBeVisible();
    await semRolagemLateral(page);
    await registrar(page, info, '01 agenda hoje');
  });

  await test.step('anda ate o dia do horario e abre o cliente', async () => {
    for (let i = 0; i < diasAte(marcado.data); i++) {
      await botao(page, 'Próximo dia').click();
    }
    await expect(naTela(page, cliente.nome)).toBeVisible();
    await registrar(page, info, '02 agenda do dia');
    await naTela(page, cliente.nome).click();
    await expect(naTela(page, 'Sobre o cliente')).toBeVisible();
    await registrar(page, info, '03 atendimento');
  });

  await test.step('conclui o atendimento', async () => {
    page.once('dialog', (d) => void d.accept());
    await botao(page, 'Concluir atendimento').click();
    await expect(naTela(page, 'Concluído')).toBeVisible();
    await registrar(page, info, '04 concluido');
  });

  await test.step('abre a ficha e escreve a anotacao de visagismo', async () => {
    await botao(page, 'Ver ficha completa').click();
    await expect(naTela(page, /Cliente desde/)).toBeVisible();
    await botao(page, 'Editar').click();
    const texto = 'Rosto oval, testa alta. Manter volume em cima e laterais baixas.';
    await page.getByLabel('Texto').filter({ visible: true }).fill(texto);
    await botao(page, 'Salvar anotação').click();
    await expect(naTela(page, texto)).toBeVisible();
    await expect(naTela(page, /1 visita/)).toBeVisible();
    await registrar(page, info, '05 ficha com anotacao');
  });
});

test('admin cadastra, edita e remove um servico do catalogo', async ({ page }, info) => {
  const { nome } = unico('Servico');

  await entrar(page, SEED.admin, SEED.senha);
  await aba(page, 'Serviços');
  await expect(naTela(page, 'Serviços')).toBeVisible();
  await registrar(page, info, '01 catalogo');

  await test.step('cadastra', async () => {
    await botao(page, 'Novo serviço').click();
    await page.getByLabel('Nome').filter({ visible: true }).fill(nome);
    await page
      .getByLabel('Descrição')
      .filter({ visible: true })
      .fill('Criado pelo teste de ponta a ponta.');
    await page.getByLabel('Duração (min)').filter({ visible: true }).fill('45');
    await page.getByLabel('Preço (R$)').filter({ visible: true }).fill('99,00');
    await registrar(page, info, '02 novo servico');
    await botao(page, 'Cadastrar').click();
    await expect(naTela(page, nome)).toBeVisible();
  });

  await test.step('edita o preco', async () => {
    await botao(page, `Editar ${nome}`).click();
    await page.getByLabel('Preço (R$)').filter({ visible: true }).fill('120,00');
    await botao(page, 'Salvar').click();
    await expect(naTela(page, /R\$\s?120,00/)).toBeVisible();
    await registrar(page, info, '03 editado');
  });

  await test.step('remove', async () => {
    await botao(page, `Editar ${nome}`).click();
    page.once('dialog', (d) => void d.accept());
    await botao(page, 'Remover do catálogo').click();
    await expect(page.getByText(nome).filter({ visible: true })).toHaveCount(0);
  });
});

test('admin ve o painel da semana e a equipe', async ({ page }, info) => {
  await entrar(page, SEED.admin, SEED.senha);
  await aba(page, 'Painel');
  await expect(naTela(page, 'Esta semana')).toBeVisible();
  await semRolagemLateral(page);
  await registrar(page, info, '01 painel');
  await aba(page, 'Equipe');
  await expect(naTela(page, /^Stewer/)).toBeVisible();
  await registrar(page, info, '02 equipe');
});
