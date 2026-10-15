/**
 * `precoCentavos` da API e SEMPRE um inteiro em centavos (int64).
 *
 * Regra da casa: nunca dividir por 100 para "trabalhar em reais". Float perde centavo
 * (0.1 + 0.2 !== 0.3) e um catalogo de precos que erra 1 centavo e um catalogo quebrado.
 * Toda conta e feita em centavos, inteiro; a divisao por 100 so acontece na ULTIMA etapa,
 * na hora de escrever o texto — e mesmo ai por string, nao por aritmetica de ponto flutuante.
 */

/** Formata centavos como moeda brasileira: 18000 -> "R$ 180,00". */
export function formatCentavos(centavos: number | null | undefined): string {
  if (centavos === null || centavos === undefined || !Number.isFinite(centavos)) return '';
  const negativo = centavos < 0;
  const abs = Math.abs(Math.trunc(centavos));

  // divisao INTEIRA: reais e centavos saem como inteiros, sem ponto flutuante no meio
  const reais = Math.floor(abs / 100);
  const resto = abs % 100;

  const reaisComPontos = String(reais).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const centavosPad = String(resto).padStart(2, '0');

  return `${negativo ? '-' : ''}R$ ${reaisComPontos},${centavosPad}`;
}

/** "180" ou "180,50" — versao curta, sem o "R$", para chips e listas apertadas. */
export function formatCentavosCurto(centavos: number | null | undefined): string {
  if (centavos === null || centavos === undefined || !Number.isFinite(centavos)) return '';
  const abs = Math.abs(Math.trunc(centavos));
  const reais = Math.floor(abs / 100);
  const resto = abs % 100;
  const reaisComPontos = String(reais).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return resto === 0 ? reaisComPontos : `${reaisComPontos},${String(resto).padStart(2, '0')}`;
}

/**
 * Texto digitado pelo usuario -> centavos inteiros.
 * Aceita "180", "180,50", "R$ 1.800,00", "180.50". Devolve `null` se nao der para ler.
 * Faz o parse por STRING (separa a parte inteira da decimal) justamente para nao passar
 * por `parseFloat`, que reintroduziria o erro de ponto flutuante.
 */
export function parseCentavos(texto: string | null | undefined): number | null {
  if (!texto) return null;
  const limpo = texto.replace(/[^\d,.-]/g, '').trim();
  if (!limpo) return null;

  const negativo = limpo.startsWith('-');
  const semSinal = limpo.replace(/-/g, '');
  if (!semSinal) return null;

  // Em pt-BR a VIRGULA e sempre o decimal e o ponto e sempre milhar.
  // Se houver virgula, ela manda — "180,555" e 180 reais e 55 centavos (o 3o digito e
  // digitacao a mais e e cortado), nunca 180.555 reais.
  // So quando nao ha virgula e preciso adivinhar o ponto: "1.800" e milhar (3 digitos
  // depois), "180.50" e decimal (1 ou 2 digitos depois) — que e como se digita em teclado.
  const ultimaVirgula = semSinal.lastIndexOf(',');
  const ultimoPonto = semSinal.lastIndexOf('.');

  let posDecimal: number;
  if (ultimaVirgula !== -1) {
    posDecimal = ultimaVirgula;
  } else if (ultimoPonto !== -1 && semSinal.length - ultimoPonto - 1 !== 3) {
    posDecimal = ultimoPonto;
  } else {
    posDecimal = -1; // so pontos de milhar, ou nenhum separador
  }

  let inteiro: string;
  let decimal: string;
  if (posDecimal === -1) {
    inteiro = semSinal;
    decimal = '';
  } else {
    inteiro = semSinal.slice(0, posDecimal);
    decimal = semSinal.slice(posDecimal + 1);
  }

  inteiro = inteiro.replace(/[.,]/g, '');
  if (!/^\d*$/.test(inteiro) || !/^\d*$/.test(decimal)) return null;
  if (inteiro === '' && decimal === '') return null;

  const centavosDecimal = Number((decimal + '00').slice(0, 2));
  const total = Number(inteiro || '0') * 100 + centavosDecimal;
  if (!Number.isSafeInteger(total)) return null;
  return negativo ? -total : total;
}

/** Soma segura de centavos (inteiros). Existe para deixar explicito que nao ha float. */
export function somaCentavos(valores: readonly (number | null | undefined)[]): number {
  return valores.reduce<number>(
    (acc, v) => acc + (typeof v === 'number' && Number.isFinite(v) ? Math.trunc(v) : 0),
    0
  );
}

/** "60 min" / "1h" / "1h30" — duracao do servico, que a API da em minutos inteiros. */
export function formatDuracao(minutos: number | null | undefined): string {
  if (minutos === null || minutos === undefined || !Number.isFinite(minutos)) return '';
  const m = Math.trunc(minutos);
  if (m < 60) return `${m} min`;
  const horas = Math.floor(m / 60);
  const resto = m % 60;
  return resto === 0 ? `${horas}h` : `${horas}h${String(resto).padStart(2, '0')}`;
}

/** "90 MIN" — a duracao em caps como o design escreve nas listas. */
export function formatDuracaoCaps(minutos: number | null | undefined): string {
  if (minutos === null || minutos === undefined || !Number.isFinite(minutos)) return '';
  return `${Math.trunc(minutos)} MIN`;
}
