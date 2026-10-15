/**
 * Tab bar do ADMIN — 3 itens, labels literais do design:
 * VISÃO GERAL · SERVIÇOS · EQUIPE
 *
 * O design nao da ao ADMIN acesso a agenda nem a clientes pela barra, embora a API
 * permita. Lacuna registrada no relatorio; nao inventei tab que o design nao tem.
 */
import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/ui/tab-bar';

export default function TabsAdmin() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="visao-geral" options={{ title: 'VISÃO GERAL' }} />
      <Tabs.Screen name="servicos" options={{ title: 'SERVIÇOS' }} />
      <Tabs.Screen name="equipe" options={{ title: 'EQUIPE' }} />
    </Tabs>
  );
}
