/**
 * Telefone para leitura: "+5511999990003" vira "(11) 99999-0003".
 *
 * So formata o que reconhece como numero brasileiro (10 ou 11 digitos, com ou sem o
 * 55 na frente). Qualquer outra coisa volta como foi digitada: melhor mostrar cru do
 * que formatar errado um numero estrangeiro.
 */
export function formatTelefone(bruto: string | null | undefined): string {
  if (!bruto) return '';
  // DDI de outro pais: nao tem como saber o formato, entao fica como veio.
  if (bruto.trim().startsWith('+') && !bruto.trim().startsWith('+55')) return bruto.trim();
  let digitos = bruto.replace(/\D/g, '');
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith('55')) {
    digitos = digitos.slice(2);
  }
  if (digitos.length === 11) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
  }
  if (digitos.length === 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }
  return bruto.trim();
}

/**
 * Mascara enquanto a pessoa digita: "63985116783" vira "(63) 9 8511-6783". So digitos
 * contam (no maximo 11, DDD + celular); o resto e ignorado. Fixo de 10 digitos sai como
 * "(63) 3215-0000".
 */
export function mascaraTelefone(digitado: string): string {
  let d = digitado.replace(/\D/g, '');
  // numero salvo com o 55 do Brasil na frente (+5563...): tira o DDI
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) d = d.slice(2);
  d = d.slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  const ddd = `(${d.slice(0, 2)}) `;
  const resto = d.slice(2);
  if (d.length <= 10) {
    // ainda digitando, ou fixo: 4 + 4
    return resto.length <= 4 ? ddd + resto : `${ddd}${resto.slice(0, 4)}-${resto.slice(4)}`;
  }
  return `${ddd}${resto[0]} ${resto.slice(1, 5)}-${resto.slice(5)}`;
}
