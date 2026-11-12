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
