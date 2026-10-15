/**
 * Tab bar do CLIENTE — 4 itens, labels literais do frame 03:
 * INÍCIO · AGENDAR · MEUS HORÁRIOS · PERFIL
 *
 * A tab AGENDAR nao tem tela propria: ela abre o wizard de novo agendamento, que no
 * design aparece SEM tab bar (frames 04-07 sao full-bleed). Por isso o `tabPress` e
 * interceptado e empurra a stack `novo-agendamento` por cima das Tabs.
 */
import { router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/ui/tab-bar';

export default function TabsCliente() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="inicio" options={{ title: 'INÍCIO' }} />
      <Tabs.Screen
        name="agendar"
        options={{ title: 'AGENDAR' }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/(cliente)/novo-agendamento/servico');
          },
        }}
      />
      <Tabs.Screen name="meus-horarios" options={{ title: 'MEUS HORÁRIOS' }} />
      <Tabs.Screen name="perfil" options={{ title: 'PERFIL' }} />
    </Tabs>
  );
}
