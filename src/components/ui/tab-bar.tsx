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
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LabelCaps } from './texto';

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="border-t border-divider bg-canvas"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
    >
      <View className="flex-row px-2 pb-1 pt-4">
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
              className="flex-1 items-center gap-[7px]"
              style={({ pressed }) => (pressed ? { opacity: 0.7 } : null)}
            >
              {/* o tracinho ocupa espaco mesmo inativo, para o label nao pular */}
              <View className={ativa ? 'h-px w-[14px] bg-gold' : 'h-px w-[14px]'} />
              <LabelCaps papel={ativa ? 'tabAtiva' : 'tab'} numberOfLines={1}>
                {titulo}
              </LabelCaps>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
