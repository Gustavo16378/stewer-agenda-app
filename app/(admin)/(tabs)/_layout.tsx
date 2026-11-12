/**
 * Tab bar do ADMIN. O dono do estudio tambem atende, entao alem das tres abas de
 * gestao do design (painel, servicos, equipe) ele tem AGENDA e CLIENTES, as mesmas
 * telas do profissional. AGENDA vem primeiro porque e o que ele abre todo dia. ESTUDIO e
 * AUDITORIA ficam no menu lateral; no celular, nos atalhos do Painel.
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
      <Tabs.Screen name="agenda" options={{ title: 'Agenda' }} />
      <Tabs.Screen name="clientes" options={{ title: 'Clientes' }} />
      <Tabs.Screen name="visao-geral" options={{ title: 'Painel' }} />
      <Tabs.Screen name="servicos" options={{ title: 'Serviços' }} />
      <Tabs.Screen name="equipe" options={{ title: 'Equipe' }} />
      {/* no celular estas duas abrem pelos atalhos do Painel (ver SO_NO_MENU_LATERAL) */}
      <Tabs.Screen name="financeiro" options={{ title: 'Financeiro' }} />
      <Tabs.Screen name="estudio" options={{ title: 'Estúdio' }} />
      <Tabs.Screen name="auditoria" options={{ title: 'Auditoria' }} />
    </Tabs>
  );
}
