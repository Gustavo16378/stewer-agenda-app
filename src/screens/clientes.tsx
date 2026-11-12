/**
 * [13 Lista de clientes] — tab CLIENTES do PROFISSIONAL.
 *
 * Layout literal do frame 13: `padding:40px 28px 0`; titulo Playfair 29 "Clientes" com
 * "48 ATIVOS" alinhado embaixo a direita (9px .2em ink@.45); caixa de busca (contorno
 * ink@.16, `padding:14px 16px`, lupa desenhada com dois tracos, placeholder "Buscar por
 * nome" 13.5 ink@.35); linhas `padding:17px 0` com avatar de iniciais 42px, nome 14.5,
 * meta em caps 8.5/.18em ink@.42 e › ink@.3.
 *
 * Dados: GET /clientes?busca=&pagina=&tamanho=20 — paginado, mas a resposta e um ARRAY
 * PURO, sem total. O scroll infinito para quando uma pagina vem com menos de 20 itens
 * (isso mora no `getNextPageParam` de useClientesInfinitos). O debounce da busca ja esta
 * no hook: aqui vai o texto cru.
 *
 *   TODO(API): "48 ATIVOS" nao tem de onde vir — nao ha total nem contagem. A tela so
 *   mostra a contagem quando a lista ja chegou ao fim (ai o numero e real).
 *   TODO(API): "ÚLTIMA VISITA · 14 AGO" exigiria a ultima visita no `ClienteResumo`
 *   (ou um `GET /clientes/{id}` por linha). O que o resumo tem e `createdAt`, entao a
 *   linha mostra "CLIENTE DESDE · <data>".
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';

import { useClientesInfinitos } from '@/api/hooks';
import type { ClienteResumo } from '@/api/types';
import { Carregando, EstadoErro, EstadoVazio } from '@/components/ui/estados';
import { AvatarIniciais } from '@/components/ui/imagem';
import { Tela } from '@/components/ui/tela';
import { LabelCaps, Titulo } from '@/components/ui/texto';
import { formatDiaMesCurtoCaps } from '@/lib/datetime';
import { useCores } from '@/theme/theme-context';

/** A lupa do design: circulo de 10px com borda 1.5 e um traco de 5x1.5 a 45 graus. */
function IconeBusca() {
  return (
    <View className="h-[14px] w-[14px]">
      <View className="h-[10px] w-[10px] rounded-full border-[1.5px] border-ink/45" />
      <View
        className="absolute bottom-px right-0 h-[1.5px] w-[5px] bg-ink/45"
        style={{ transform: [{ rotate: '45deg' }] }}
      />
    </View>
  );
}

function LinhaCliente({
  cliente,
  aoAbrir,
  ultima,
}: {
  cliente: ClienteResumo;
  aoAbrir: () => void;
  ultima: boolean;
}) {
  return (
    <Pressable
      onPress={aoAbrir}
      accessibilityRole="button"
      className={
        ultima
          ? 'flex-row items-center gap-4 py-[17px]'
          : 'flex-row items-center gap-4 border-b border-divider py-[17px]'
      }
      style={({ pressed }) => (pressed ? { opacity: 0.6 } : null)}
    >
      <AvatarIniciais nome={cliente.nome} tamanho={42} />
      <View className="flex-1 gap-[6px]">
        <Text className="font-sans text-row-lg text-ink" numberOfLines={1}>
          {cliente.nome}
        </Text>
        <LabelCaps papel="micro" numberOfLines={1}>
          CLIENTE DESDE · {formatDiaMesCurtoCaps(cliente.createdAt)}
        </LabelCaps>
      </View>
      <Text className="font-sans text-row text-ink/30">›</Text>
    </Pressable>
  );
}

export default function ListaDeClientes() {
  const router = useRouter();
  const cores = useCores();
  const [busca, setBusca] = useState('');
  const clientes = useClientesInfinitos(busca);

  const itens = clientes.data?.pages.flat() ?? [];
  const completa = clientes.data ? !clientes.hasNextPage : false;

  return (
    <Tela insetInferior={false}>
      <FlatList
        data={itens}
        keyExtractor={(c) => c.id ?? c.email ?? c.nome ?? ''}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: 40, paddingBottom: 32 }}
        ListHeaderComponent={
          <View>
            <View className="flex-row items-end justify-between">
              <Titulo className="text-d-29">Clientes</Titulo>
              {completa ? (
                <LabelCaps papel="meta" className="pb-[6px]">
                  {itens.length} {itens.length === 1 ? 'CLIENTE' : 'CLIENTES'}
                </LabelCaps>
              ) : null}
            </View>
            <View className="mt-7 flex-row items-center gap-3 rounded-token border border-field-border px-4 py-[14px]">
              <IconeBusca />
              <TextInput
                value={busca}
                onChangeText={setBusca}
                placeholder="Buscar por nome"
                placeholderTextColor={cores.placeholder}
                accessibilityLabel="Buscar por nome"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                className="flex-1 p-0 font-sans text-body-lg text-ink"
              />
            </View>
            <View className="h-[14px]" />
          </View>
        }
        renderItem={({ item, index }) => (
          <LinhaCliente
            cliente={item}
            ultima={index === itens.length - 1}
            aoAbrir={() => router.push(`/cliente/${item.id}` as never)}
          />
        )}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (clientes.hasNextPage && !clientes.isFetchingNextPage) void clientes.fetchNextPage();
        }}
        refreshing={clientes.isRefetching && !clientes.isFetchingNextPage}
        onRefresh={() => void clientes.refetch()}
        ListEmptyComponent={
          clientes.isLoading ? (
            <Carregando />
          ) : clientes.error ? (
            <EstadoErro erro={clientes.error} aoTentarDeNovo={() => void clientes.refetch()} />
          ) : busca.trim() ? (
            <EstadoVazio
              titulo="Ninguém com esse nome."
              descricao="A busca casa trecho de nome, e-mail ou telefone."
            />
          ) : (
            <EstadoVazio
              titulo="Ainda não há clientes."
              descricao="Quem se cadastrar pelo app aparece aqui."
            />
          )
        }
        ListFooterComponent={
          clientes.isFetchingNextPage ? (
            <View className="py-6">
              <ActivityIndicator color={cores.gold} />
            </View>
          ) : null
        }
      />
    </Tela>
  );
}
