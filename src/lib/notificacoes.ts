/**
 * Notificacao no celular (Expo Push).
 *
 * Ao entrar, o app pede permissao e manda o token deste aparelho para a API, que
 * avisa quando a agenda muda (cliente marcou, equipe remarcou...). Ao sair, o token e
 * removido para o proximo usuario do aparelho nao receber avisos do anterior.
 *
 * Nao faz nada no navegador nem no simulador, e nada antes do `eas init` (sem
 * projectId o Expo nao emite token). Falha aqui nunca atrapalha o login.
 */
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { api, desembrulha } from '@/api/client';

let tokenDesteAparelho: string | null = null;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registrarNotificacoes(): Promise<void> {
  try {
    if (Platform.OS === 'web' || !Device.isDevice) return;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    if (!projectId) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('agenda', {
        name: 'Agenda',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    const atual = await Notifications.getPermissionsAsync();
    const permissao = atual.granted ? atual : await Notifications.requestPermissionsAsync();
    if (!permissao.granted) return;

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await desembrulha(api.POST('/auth/eu/dispositivos', { body: { token } }));
    tokenDesteAparelho = token;
  } catch (e) {
    console.warn('Notificacoes indisponiveis neste aparelho', e);
  }
}

/** Chamar ANTES de apagar a sessao: a remocao precisa do token de acesso. */
export async function esquecerEsteAparelho(): Promise<void> {
  const token = tokenDesteAparelho;
  tokenDesteAparelho = null;
  if (!token) return;
  try {
    await desembrulha(api.POST('/auth/eu/dispositivos/remover', { body: { token } }));
  } catch {
    // sem rede ao sair: o aviso seguinte para este token falha e a sessao segue encerrada
  }
}
