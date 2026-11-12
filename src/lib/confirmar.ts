/**
 * Pergunta "tem certeza?" antes de uma acao.
 *
 * `Alert.alert` com botoes nao faz nada no react-native-web: na versao do navegador os
 * botoes de cancelar, concluir e remover ficavam mudos. Na web usamos o `confirm` do
 * proprio navegador; no celular, o alerta nativo de sempre.
 */
import { Alert, Platform } from 'react-native';

export function confirmar(
  titulo: string,
  mensagem: string,
  opcoes: { textoConfirmar?: string; destrutivo?: boolean; aoConfirmar: () => void }
): void {
  const { textoConfirmar = 'Confirmar', destrutivo = false, aoConfirmar } = opcoes;

  if (Platform.OS === 'web') {
    const ok = globalThis.confirm?.(mensagem ? `${titulo}\n\n${mensagem}` : titulo);
    if (ok) aoConfirmar();
    return;
  }

  Alert.alert(titulo, mensagem, [
    { text: 'Voltar', style: 'cancel' },
    { text: textoConfirmar, style: destrutivo ? 'destructive' : 'default', onPress: aoConfirmar },
  ]);
}
