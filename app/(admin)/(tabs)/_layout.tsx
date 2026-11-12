/**
 * Tab bar do ADMIN. O dono do estudio tambem atende, entao alem das tres abas de
 * gestao do design (painel, servicos, equipe) ele tem AGENDA e CLIENTES, as mesmas
 * telas do profissional. AGENDA vem primeiro porque e o que ele abre todo dia.
 */
import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/ui/tab-bar';
import { useLayoutLargo } from '@/lib/responsivo';

export default function TabsAdmin() {
  const largo = useLayoutLargo();
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, tabBarPosition: largo ? 'left' : 'bottom' }}
    >
      <Tabs.Screen name="agenda" options={{ title: 'AGENDA' }} />
      <Tabs.Screen name="clientes" options={{ title: 'CLIENTES' }} />
      <Tabs.Screen name="visao-geral" options={{ title: 'PAINEL' }} />
      <Tabs.Screen name="servicos" options={{ title: 'SERVIÇOS' }} />
      <Tabs.Screen name="equipe" options={{ title: 'EQUIPE' }} />
    </Tabs>
  );
}
