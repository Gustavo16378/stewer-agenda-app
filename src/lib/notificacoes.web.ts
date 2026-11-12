/**
 * Na web nao ha aviso de celular: as duas funcoes nao fazem nada. Arquivo separado (o
 * Metro escolhe o .web.ts no navegador) para o expo-notifications e o que ele puxa nao
 * entrarem no pacote da web, que fica mais leve.
 */
export async function registrarNotificacoes(): Promise<void> {}

export async function esquecerEsteAparelho(): Promise<void> {}
