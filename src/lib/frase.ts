/**
 * Redesenho (nov/2026): os rotulos deixaram de ser caixa alta espacada. Muitos textos ainda
 * chegam escritos em caixa alta ("PRÓXIMO AGENDAMENTO", "SEG, 16 NOV"); este helper os
 * converte para frase ("Próximo agendamento", "Seg, 16 nov").
 *
 * So mexe em texto TODO em caixa alta: o que ja vem com minusculas (nomes de pessoa e de
 * servico, por exemplo) fica como esta. Siglas conhecidas continuam em maiusculas.
 */
const SIGLAS = new Set(['URL', 'ID', 'PIX', 'CPF', 'API', 'TO', 'R']);

export function emFrase(texto: string): string {
  if (!/[A-ZÀ-Ý]/.test(texto) || /[a-zà-ÿ]/.test(texto)) return texto;
  // so a palavra que ABRE o texto ganha maiuscula: "09 NOV" vira "09 nov", nao "09 Nov"
  const inicio = texto.search(/\S/);
  return texto.replace(/[A-Za-zÀ-ÿ]+/g, (palavra, pos: number) => {
    if (SIGLAS.has(palavra)) return palavra;
    const minuscula = palavra.toLocaleLowerCase('pt-BR');
    if (pos === inicio) return minuscula.charAt(0).toLocaleUpperCase('pt-BR') + minuscula.slice(1);
    return minuscula;
  });
}
