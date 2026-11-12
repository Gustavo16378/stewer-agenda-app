/**
 * Fotos publicas que o admin gerencia (fotos do trabalho, fotos de exemplo de um
 * servico): a grade com a foto, mover para o lado (quando a ordem importa), apagar, e o
 * botao de por mais uma. A foto e reduzida no aparelho antes de subir.
 */
import { Image } from 'expo-image';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { useFotosPublicas } from '@/api/hooks';
import { BotaoAtelie } from '@/components/atelie/base';
import { urlDaImagem } from '@/content/estudio';
import { confirmar } from '@/lib/confirmar';
import { escolherFoto, SemPermissao } from '@/lib/foto';

export interface FotoDaGrade {
  id: string;
  legenda?: string | null;
}

function BotaoPequeno({
  rotulo,
  simbolo,
  aoTocar,
  perigo,
}: {
  rotulo: string;
  simbolo: string;
  aoTocar: () => void;
  perigo?: boolean;
}) {
  return (
    <Pressable
      onPress={aoTocar}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      hitSlop={6}
      className="h-8 w-8 items-center justify-center rounded-full bg-fundo/90"
      style={({ pressed }) => (pressed ? { opacity: 0.6 } : null)}
    >
      <Text
        className={
          perigo
            ? 'font-sans-semibold text-ui text-cadeira'
            : 'font-sans-semibold text-ui text-texto'
        }
      >
        {simbolo}
      </Text>
    </Pressable>
  );
}

export function GradeDeFotos({
  fotos,
  servicoId,
  maximo,
  ordenavel = false,
  rotuloAdicionar = 'Adicionar foto',
  vazio,
  colunas = 3,
}: {
  fotos: FotoDaGrade[];
  /** Fotos de exemplo de um servico; sem ele, sao fotos do trabalho do estudio. */
  servicoId?: string;
  maximo: number;
  ordenavel?: boolean;
  rotuloAdicionar?: string;
  vazio?: string;
  colunas?: number;
}) {
  const { adicionar, remover, mover } = useFotosPublicas();
  const [preparando, setPreparando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const ocupado = preparando || adicionar.isPending;

  async function escolher(origem: 'galeria' | 'camera') {
    setErro(null);
    try {
      setPreparando(true);
      const base64 = await escolherFoto(origem, { lado: 1600, qualidade: 0.78 });
      if (!base64) return;
      adicionar.mutate(
        { servicoId, tipo: 'TRABALHO', tipoConteudo: 'image/jpeg', conteudoBase64: base64 },
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

  const largura = `${100 / colunas}%` as const;

  return (
    <View>
      {fotos.length === 0 && vazio ? (
        <Text className="mt-3 font-sans text-ui text-texto-3">{vazio}</Text>
      ) : (
        <View className="mt-3 flex-row flex-wrap" style={{ marginHorizontal: -4 }}>
          {fotos.map((f, i) => (
            <View key={f.id} style={{ width: largura }} className="p-1">
              <View className="aspect-[3/4] overflow-hidden rounded-[3px] bg-superficie">
                <Image
                  source={{ uri: urlDaImagem(f.id) }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  transition={200}
                  accessibilityLabel={f.legenda || `Foto ${i + 1}`}
                />
                <View className="absolute right-1 top-1 flex-row gap-1">
                  {ordenavel && i > 0 ? (
                    <BotaoPequeno
                      rotulo={`Trazer a foto ${i + 1} para antes`}
                      simbolo="‹"
                      aoTocar={() => mover.mutate({ id: f.id, posicao: i - 1 })}
                    />
                  ) : null}
                  {ordenavel && i < fotos.length - 1 ? (
                    <BotaoPequeno
                      rotulo={`Levar a foto ${i + 1} para depois`}
                      simbolo="›"
                      aoTocar={() => mover.mutate({ id: f.id, posicao: i + 1 })}
                    />
                  ) : null}
                  <BotaoPequeno
                    rotulo={`Apagar a foto ${i + 1}`}
                    simbolo="×"
                    perigo
                    aoTocar={() =>
                      confirmar('Apagar esta foto?', 'Ela some do app na hora.', {
                        textoConfirmar: 'Apagar',
                        destrutivo: true,
                        aoConfirmar: () => remover.mutate({ id: f.id, servicoId }),
                      })
                    }
                  />
                </View>
                {ordenavel && i === 0 ? (
                  <View className="absolute bottom-1 left-1 rounded-[2px] bg-fundo/85 px-2 py-[2px]">
                    <Text className="font-sans-medium text-ui-xs text-texto">Principal</Text>
                  </View>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      )}

      {fotos.length < maximo ? (
        <View className="mt-3 flex-row gap-3">
          <BotaoAtelie
            className="flex-1"
            variante="contorno"
            titulo={rotuloAdicionar}
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
      ) : (
        <Text className="mt-3 font-sans text-ui-sm text-texto-3">
          Chegou ao limite de {maximo} fotos. Apague uma para pôr outra.
        </Text>
      )}
      {erro || remover.error || mover.error ? (
        <Text className="mt-3 font-sans text-ui-sm text-cadeira">
          {erro ?? remover.error?.message ?? mover.error?.message}
        </Text>
      ) : null}
    </View>
  );
}
