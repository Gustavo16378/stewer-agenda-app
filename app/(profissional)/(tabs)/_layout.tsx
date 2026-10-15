/**
 * Tab bar do PROFISSIONAL — 3 itens, labels literais do design:
 * AGENDA · CLIENTES · DISPONIBILIDADE
 *
 * O design nao desenhou tab de perfil nem saida para este papel; o logout vive no
 * cabecalho da tela AGENDA (ver a tela). Lacuna registrada no relatorio.
 */
import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/ui/tab-bar';

export default function TabsProfissional() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="agenda" options={{ title: 'AGENDA' }} />
      <Tabs.Screen name="clientes" options={{ title: 'CLIENTES' }} />
      <Tabs.Screen name="disponibilidade" options={{ title: 'DISPONIBILIDADE' }} />
    </Tabs>
  );
}
