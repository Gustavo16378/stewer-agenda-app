/**
 * Tab bar do PROFISSIONAL — 3 itens, labels literais do design:
 * AGENDA · CLIENTES · DISPONIBILIDADE
 *
 * O design nao desenhou tab de perfil nem saida para este papel; o logout vive no
 * cabecalho da tela AGENDA (ver a tela). Lacuna registrada no relatorio.
 */
import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/ui/tab-bar';
import { useLayoutLargo } from '@/lib/responsivo';

export default function TabsProfissional() {
  const largo = useLayoutLargo();
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, tabBarPosition: largo ? 'left' : 'bottom' }}
    >
      <Tabs.Screen name="agenda" options={{ title: 'Agenda' }} />
      <Tabs.Screen name="clientes" options={{ title: 'Clientes' }} />
      <Tabs.Screen name="disponibilidade" options={{ title: 'Horários' }} />
    </Tabs>
  );
}
