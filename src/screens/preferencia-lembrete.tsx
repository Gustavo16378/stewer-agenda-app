/**
 * Lembrete de horario por e-mail: liga e desliga. So aparece para o cliente, que e
 * quem recebe. A API manda o lembrete entre 23 e 24 horas antes do horario.
 */
import { useState } from 'react';
import { Text, View } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { Interruptor } from '@/components/ui/interruptor';

export function PreferenciaLembrete() {
  const { usuario, salvarPreferencias } = useAuth();
  const [salvando, setSalvando] = useState(false);
  const [falhou, setFalhou] = useState(false);

  if (usuario?.role !== 'CLIENTE') return null;

  async function mudar(ligado: boolean) {
    setSalvando(true);
    setFalhou(false);
    try {
      await salvarPreferencias({ lembreteEmail: ligado });
    } catch {
      setFalhou(true);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <View className="border-b border-divider py-[19px]">
      <View className="flex-row items-center justify-between">
        <Text className="font-sans text-body-lg text-text-body">Lembrete por e-mail</Text>
        <Interruptor
          rotulo="Lembrete por e-mail"
          ligado={usuario.lembreteEmail !== false}
          aoMudar={(v) => void mudar(v)}
          disabled={salvando}
        />
      </View>
      <Text className="mt-2 font-sans text-help text-ink/42">
        {falhou
          ? 'Não deu para salvar agora. Tente de novo.'
          : 'Um dia antes do horário, no seu e-mail.'}
      </Text>
    </View>
  );
}
