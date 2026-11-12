/**
 * As fotos de exemplo de um servico, em miniatura, embaixo do nome: o cliente ve o
 * resultado antes de escolher. So imagem, sem toque proprio: a linha inteira ja e o
 * botao de escolher o servico.
 */
import { Image } from 'expo-image';
import { View } from 'react-native';

import { urlDaImagem } from '@/content/estudio';

export function FotosDoServico({
  fotos,
  nome,
  tamanho = 64,
}: {
  fotos: readonly string[] | undefined;
  nome?: string;
  tamanho?: number;
}) {
  if (!fotos?.length) return null;
  return (
    <View className="mt-2 flex-row gap-2">
      {fotos.slice(0, 4).map((id, i) => (
        <Image
          key={id}
          source={{ uri: urlDaImagem(id) }}
          contentFit="cover"
          transition={200}
          accessibilityLabel={`Exemplo ${i + 1} de ${nome ?? 'serviço'}`}
          style={{ width: tamanho, height: Math.round(tamanho * 1.25), borderRadius: 3 }}
        />
      ))}
    </View>
  );
}
