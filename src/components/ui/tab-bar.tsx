/**
 * A tab bar do design. NAO HA ICONE em nenhuma das tres barras — so um tracinho de
 * 14x1px acima de um label em caps.
 *
 * Estrutura literal (frame 03):
 *   contêiner: `background:#0A0A0A; border-top:1px solid ink@.1`
 *   linha:     `display:flex; padding:16px 8px 4px`
 *   item:      `flex:1; align-items:center; gap:7px`
 *   tracinho:  `width:14px; height:1px` — ativo: dourado; inativo: sem fundo
 *   label:     `font-size:9px; font-weight:600; letter-spacing:.14em`
 *              ativo: dourado | inativo: ink@.4
 *   home indicator: `width:118px; height:4px; border-radius:99px; background:ink@.2;
 *                    margin:10px auto 8px`
 *
 * O "home indicator" desenhado e o gesto do proprio sistema: aqui ele vira o safe-area
 * inset de baixo, nao um retangulo pintado por nos.
 */
// O Expo Router 57 nao usa mais o @react-navigation: ele traz o navegador vendorizado,
// e o `Tabs` com tabBar customizavel vive em 'expo-router/js-tabs'.
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LogoStewer } from '@/components/marca/Logo';
import { useLayoutLargo } from '@/lib/responsivo';
import { useTema } from '@/theme/theme-context';

/**
 * Tela larga (tablet deitado, desktop): as mesmas abas, num menu lateral com a logo.
 * Mesma linguagem da barra de baixo: sem icone, tracinho dourado na ativa, caps.
 */
function MenuLateral({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { tema } = useTema();

  return (
    <View
      className="w-[232px] border-r border-borda bg-fundo px-8"
      style={{ paddingTop: insets.top + 44, paddingBottom: insets.bottom + 24 }}
    >
      <View className="mb-14 flex-row items-center gap-4">
        <LogoStewer altura={34} cor={tema === 'dark' ? '#f3f3f3' : '#0A0A0A'} />
        <View className="gap-1">
          <Text className="font-display text-d-18 text-ink">Stewer Gabriel</Text>
          <Text className="font-sans text-ui-sm text-texto-3">Agenda</Text>
        </View>
      </View>

      <View className="gap-1">
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key]!;
          const ativa = state.index === index;
          const titulo =
            typeof options.title === 'string' ? options.title : route.name.toUpperCase();
          const aoTocar = () => {
            const evento = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!ativa && !evento.defaultPrevented) navigation.navigate(route.name, route.params);
          };
          return (
            <Pressable
              key={route.key}
              onPress={aoTocar}
              accessibilityRole="button"
              accessibilityState={ativa ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? titulo}
              className="flex-row items-center gap-4 py-[13px]"
              style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) =>
                pressed || hovered ? { opacity: 0.7 } : null
              }
            >
              <View className={ativa ? 'h-[18px] w-[2px] bg-latao' : 'h-[18px] w-[2px]'} />
              <Text
                className={
                  ativa
                    ? 'font-sans-semibold text-ui-lg text-latao'
                    : 'font-sans-medium text-ui-lg text-texto-3'
                }
                numberOfLines={1}
              >
                {titulo}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function TabBar(props: BottomTabBarProps) {
  const largo = useLayoutLargo();
  if (largo) return <MenuLateral {...props} />;
  return <BarraDeBaixo {...props} />;
}

function BarraDeBaixo({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="border-t border-borda bg-fundo"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
    >
      <View className="flex-row px-1 pb-1 pt-[10px]">
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key]!;
          const ativa = state.index === index;
          const titulo =
            typeof options.title === 'string' ? options.title : route.name.toUpperCase();

          const aoTocar = () => {
            const evento = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!ativa && !evento.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={aoTocar}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              accessibilityRole="button"
              accessibilityState={ativa ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? titulo}
              className="flex-1 items-center gap-[6px] py-1"
              style={({ pressed }) => (pressed ? { opacity: 0.7 } : null)}
            >
              {/* o ponto ocupa espaco mesmo inativo, para o rotulo nao pular */}
              <View
                className={ativa ? 'h-[5px] w-[5px] rounded-full bg-latao' : 'h-[5px] w-[5px]'}
              />
              <Text
                className={
                  ativa
                    ? 'font-sans-semibold text-ui-xs text-latao'
                    : 'font-sans-medium text-ui-xs text-texto-3'
                }
                numberOfLines={1}
              >
                {titulo}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
