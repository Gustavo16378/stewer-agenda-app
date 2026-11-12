/**
 * Fluxo de agendamento, usado por todos os papeis:
 *   - CLIENTE marcando para si (o caso do design);
 *   - PROFISSIONAL ou ADMIN marcando para um cliente (params clienteId + clienteNome);
 *   - qualquer um remarcando (param agendamentoId: comeca direto na data e horario).
 */
import { Stack } from 'expo-router';

import { GuardaDePapel } from '@/auth/guarda';

export default function FluxoDeAgendamentoLayout() {
  return (
    <GuardaDePapel permitidos={['CLIENTE', 'PROFISSIONAL', 'ADMIN']}>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
    </GuardaDePapel>
  );
}
