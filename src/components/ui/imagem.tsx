/**
 * Fotos e avatares.
 *
 * O design tem exatamente DOIS slots de imagem, ambos `<image-slot>` (placeholder do
 * export, nao arte final):
 *   - `pro-retrato`: `width:100%;height:330px` — "Retrato do profissional" (frame 05)
 *   - `pro-equipe`:  `width:64px;height:64px`  — "Foto" (frame 17)
 * Os dois sao alimentados por `Profissional.fotoUrl`, que a API deixa opcional e OMITE
 * do JSON quando e nulo (nenhum profissional do seed tem foto). Logo o caminho normal
 * e o placeholder aparecer — ele precisa ser bonito, nao um quadrado cinza.
 *
 * Os circulos com iniciais (42/54/58px, borda ink@.2-.25, iniciais em Playfair) NAO sao
 * slots de imagem no design: sao avatares de iniciais mesmo.
 */
import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { cn } from '@/lib/cn';

const PLACEHOLDER = require('@/assets/images/photo-placeholder.png') as number;

export function SlotImagem({
  uri,
  altura,
  className,
  acessibilidade,
}: {
  /** `Profissional.fotoUrl`. Ausente, mostra so o placeholder. */
  uri?: string | null;
  altura: number;
  className?: string;
  acessibilidade: string;
}) {
  return (
    <View className={cn('overflow-hidden bg-surface', className)} style={{ height: altura }}>
      <Image
        source={uri ? { uri } : PLACEHOLDER}
        placeholder={PLACEHOLDER}
        placeholderContentFit="contain"
        contentFit={uri ? 'cover' : 'contain'}
        transition={220}
        style={{ width: '100%', height: '100%' }}
        accessible
        accessibilityLabel={acessibilidade}
      />
    </View>
  );
}

/** Iniciais de um nome: "Stewer Gabriel" -> "SG", "Joana" -> "J". */
export function iniciaisDe(nome: string | undefined | null): string {
  if (!nome) return '';
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '';
  const primeira = partes[0]?.[0] ?? '';
  const ultima = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? '') : '';
  return (primeira + ultima).toUpperCase();
}

/**
 * Avatar circular de iniciais. Tamanhos do design: 42 (lista), 54 e 58 (ficha).
 * A borda e ink@.2 no de 42 e ink@.25 nos maiores — a proporcao do corpo das iniciais
 * segue 14/42, 17/54 e 19/58.
 */
export function AvatarIniciais({
  nome,
  tamanho = 42,
  className,
}: {
  nome: string | undefined | null;
  tamanho?: 42 | 54 | 58 | number;
  className?: string;
}) {
  const corpo = tamanho <= 42 ? 14 : tamanho <= 54 ? 17 : 19;
  const iniciais = iniciaisDe(nome);

  return (
    <View
      className={cn(
        'items-center justify-center rounded-full border',
        tamanho <= 42 ? 'border-ink/20' : 'border-ink/25',
        className
      )}
      style={{ width: tamanho, height: tamanho }}
      accessible
      accessibilityLabel={nome ? `Foto de ${nome}` : 'Sem foto'}
    >
      <Text className="font-display text-ink" style={{ fontSize: corpo }}>
        {iniciais}
      </Text>
    </View>
  );
}
