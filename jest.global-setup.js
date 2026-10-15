/**
 * Roda antes dos workers do Jest nascerem, entao o TZ e herdado por eles.
 *
 * Travar o fuso e essencial: os testes do modulo de datas cobrem justamente a diferenca
 * entre instante (UTC), hora de parede e data local perto da meia-noite. Em UTC-3,
 * 2026-03-02T02:00:00Z ainda e dia 01 localmente — e esse o bug que os testes travam.
 * Sem TZ fixo o resultado mudaria de maquina para maquina (e passaria em CI rodando em UTC).
 */
module.exports = async () => {
  process.env.TZ = 'America/Sao_Paulo';

  // O src/api/config.ts recusa subir sem URL. Nos testes o fetch e sempre mockado,
  // entao o host aqui e so um valor estavel para montar as URLs esperadas.
  process.env.EXPO_PUBLIC_API_URL = 'http://api.teste:8080';
  delete process.env.EXPO_PUBLIC_TENANT_SLUG;
};
