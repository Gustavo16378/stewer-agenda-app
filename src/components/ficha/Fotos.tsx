/**
 * Fotos do cliente: a grade de miniaturas, o botao de adicionar (escolhe antes ou
 * depois, pega da galeria ou da camera) e a foto aberta em tela cheia, com a opcao de
 * apagar.
 *
 * A foto e reduzida no aparelho antes de subir (lado maior com 1280 px, JPEG a 72%),
 * entao cada uma fica perto de 150 KB no banco. A imagem nao vem na lista: cada
 * miniatura busca a sua (GET /fotos/{id}) e fica no cache a sessao inteira.
 */
import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, Text, View } from 'react-native';

import { useAdicionarFoto, useConteudoDaFoto, useFotos, useRemoverFoto } from '@/api/hooks';
import type { Foto } from '@/api/types';
import { BotaoAtelie } from '@/components/atelie/base';
import { cn } from '@/lib/cn';
import { confirmar } from '@/lib/confirmar';
import { formatDiaMes } from '@/lib/datetime';
import { escolherFoto, SemPermissao } from '@/lib/foto';

type Momento = 'ANTES' | 'DEPOIS' | 'OUTRA';
const ROTULO: Record<Momento, string> = { ANTES: 'Antes', DEPOIS: 'Depois', OUTRA: 'Outra' };
const LADO_MAXIMO = 1280;

function Miniatura({
  clienteId,
  foto,
  aoAbrir,
}: {
  clienteId: string;
  foto: Foto;
  aoAbrir: () => void;
}) {
  const conteudo = useConteudoDaFoto(clienteId, foto.id);
  const momento = (foto.momento ?? 'OUTRA') as Momento;
  return (
    <View className="w-1/3 p-1">
      <Pressable
        onPress={aoAbrir}
        accessibilityRole="button"
        accessibilityLabel={`Foto ${ROTULO[momento].toLowerCase()}, ${formatDiaMes(foto.createdAt)}`}
        className="aspect-[3/4] overflow-hidden rounded-[3px] bg-superficie"
      >
        {conteudo.data?.dataUrl ? (
          <Image
            source={{ uri: conteudo.data.dataUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#C9A96A" />
          </View>
        )}
        <View className="absolute bottom-1 left-1 rounded-[2px] bg-fundo/85 px-2 py-[2px]">
          <Text className="font-sans-medium text-ui-xs text-texto">{ROTULO[momento]}</Text>
        </View>
      </Pressable>
    </View>
  );
}

function FotoAberta({
  clienteId,
  foto,
  aoFechar,
}: {
  clienteId: string;
  foto: Foto;
  aoFechar: () => void;
}) {
  const conteudo = useConteudoDaFoto(clienteId, foto.id);
  const remover = useRemoverFoto(clienteId);
  const momento = (foto.momento ?? 'OUTRA') as Momento;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={aoFechar}>
      <View className="flex-1 bg-[#0c0c0c] px-5 pb-8 pt-14">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="font-display text-ds-24 text-marfim">{ROTULO[momento]}</Text>
            <Text className="font-sans text-ui-sm text-marfim/75">
              {formatDiaMes(foto.createdAt)}
              {foto.autorNome ? `, por ${foto.autorNome}` : ''}
            </Text>
          </View>
          <BotaoAtelie variante="texto" titulo="Fechar" onPress={aoFechar} />
        </View>
        <View className="my-5 flex-1">
          {conteudo.data?.dataUrl ? (
            <Image
              source={{ uri: conteudo.data.dataUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="contain"
              accessibilityLabel={`Foto ${ROTULO[momento].toLowerCase()} do cliente`}
            />
          ) : (
            <ActivityIndicator color="#C9A96A" />
          )}
        </View>
        {foto.legenda ? (
          <Text className="mb-4 font-sans text-ui text-marfim/80">{foto.legenda}</Text>
        ) : null}
        <BotaoAtelie
          variante="perigo"
          titulo="Apagar foto"
          carregando={remover.isPending}
          onPress={() =>
            confirmar('Apagar esta foto?', 'Ela sai da ficha do cliente.', {
              textoConfirmar: 'Apagar',
              destrutivo: true,
              aoConfirmar: () => remover.mutate(foto.id ?? '', { onSuccess: aoFechar }),
            })
          }
        />
      </View>
    </Modal>
  );
}

export function FotosDoCliente({ clienteId }: { clienteId: string }) {
  const fotos = useFotos(clienteId);
  const adicionar = useAdicionarFoto(clienteId);
  const [momento, setMomento] = useState<Momento>('ANTES');
  const [aberta, setAberta] = useState<Foto | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [preparando, setPreparando] = useState(false);

  async function escolher(origem: 'galeria' | 'camera') {
    setErro(null);
    try {
      setPreparando(true);
      const base64 = await escolherFoto(origem, { lado: LADO_MAXIMO, qualidade: 0.72 });
      if (!base64) return;
      adicionar.mutate(
        { momento, tipoConteudo: 'image/jpeg', conteudoBase64: base64 },
        { onError: (e) => setErro(e.message) }
      );
    } catch (e) {
      setErro(
        e instanceof SemPermissao ? e.message : 'Não deu para preparar essa foto. Tente outra.'
      );
    } finally {
      setPreparando(false);
    }
  }

  const lista = fotos.data ?? [];
  const ocupado = preparando || adicionar.isPending;

  return (
    <View>
      <View className="mt-3 flex-row gap-2" accessibilityRole="radiogroup">
        {(['ANTES', 'DEPOIS', 'OUTRA'] as Momento[]).map((m) => (
          <Pressable
            key={m}
            accessibilityRole="radio"
            accessibilityState={{ checked: momento === m }}
            onPress={() => setMomento(m)}
            className={cn(
              'rounded-full border px-4 py-2',
              momento === m ? 'border-latao bg-latao' : 'border-borda'
            )}
          >
            <Text
              className={cn(
                'font-sans-medium text-ui-sm',
                momento === m ? 'text-fundo' : 'text-texto-2'
              )}
            >
              {ROTULO[m]}
            </Text>
          </Pressable>
        ))}
      </View>
      <View className="mt-3 flex-row gap-3">
        <BotaoAtelie
          className="flex-1"
          variante="contorno"
          titulo="Escolher foto"
          carregando={ocupado}
          onPress={() => void escolher('galeria')}
        />
        {Platform.OS === 'web' ? null : (
          <BotaoAtelie
            className="flex-1"
            variante="contorno"
            titulo="Tirar foto"
            disabled={ocupado}
            onPress={() => void escolher('camera')}
          />
        )}
      </View>
      {erro ? <Text className="mt-3 font-sans text-ui-sm text-cadeira">{erro}</Text> : null}

      {lista.length === 0 ? (
        <Text className="mt-4 font-sans text-ui text-texto-3">
          Nenhuma foto ainda. O antes e o depois ajudam a repetir o que deu certo.
        </Text>
      ) : (
        <View className="mt-3 flex-row flex-wrap" style={{ marginHorizontal: -4 }}>
          {lista.map((f) => (
            <Miniatura key={f.id} clienteId={clienteId} foto={f} aoAbrir={() => setAberta(f)} />
          ))}
        </View>
      )}

      {aberta ? (
        <FotoAberta clienteId={clienteId} foto={aberta} aoFechar={() => setAberta(null)} />
      ) : null}
    </View>
  );
}
