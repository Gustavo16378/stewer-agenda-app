/**
 * Barras do faturamento no periodo: latao cheio para o faturado (teve baixa), latao
 * claro em cima para o que esta marcado e ainda nao teve baixa. Desenhado com SVG, sem
 * biblioteca de grafico: sao retangulos e textos.
 *
 * Tocar numa barra mostra o valor dela embaixo. Para leitor de tela, a figura tem um
 * resumo (o total e o melhor periodo) e cada barra vira um botao com o valor.
 */
import { useState } from 'react';
import { Pressable, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';

import { formatCentavos } from '@/lib/money';
import { useCores } from '@/theme/theme-context';

export interface Barra {
  rotulo: string;
  /** texto completo para o detalhe e para o leitor de tela */
  descricao: string;
  faturado: number;
  aReceber: number;
  atendimentos: number;
}

const ALTURA = 180;

export function GraficoDeBarras({ barras }: { barras: Barra[] }) {
  const cores = useCores();
  const [largura, setLargura] = useState(0);
  const [escolhida, setEscolhida] = useState<number | null>(null);
  const maximo = Math.max(1, ...barras.map((b) => b.faturado + b.aReceber));
  const espaco = largura / Math.max(1, barras.length);
  const larguraBarra = Math.max(3, Math.min(36, espaco * 0.62));
  // poucos rotulos quando ha muitas barras (dias de um mes): um a cada N, de modo que
  // cada rotulo tenha uns 30px so dele e apareca inteiro
  const LARGURA_ROTULO = 30;
  const cabem = Math.max(1, Math.floor(largura / LARGURA_ROTULO));
  const passoRotulo = Math.max(1, Math.ceil(barras.length / cabem));
  const melhor = barras.reduce((m, b, i) => (b.faturado > (barras[m]?.faturado ?? -1) ? i : m), 0);
  const total = barras.reduce((s, b) => s + b.faturado, 0);
  const detalhe = escolhida !== null ? barras[escolhida] : null;

  return (
    <View>
      <View
        onLayout={(e: LayoutChangeEvent) => setLargura(e.nativeEvent.layout.width)}
        style={{ height: ALTURA }}
        accessible
        accessibilityRole="image"
        accessibilityLabel={`Gráfico do faturamento. Total ${formatCentavos(total)}. Maior: ${barras[melhor]?.descricao ?? ''}, ${formatCentavos(barras[melhor]?.faturado ?? 0)}.`}
      >
        {largura > 0 ? (
          <Svg width={largura} height={ALTURA}>
            <Line
              x1={0}
              x2={largura}
              y1={ALTURA - 0.5}
              y2={ALTURA - 0.5}
              stroke={cores.textMuted}
              strokeOpacity={0.4}
            />
            {barras.map((b, i) => {
              const hf = (b.faturado / maximo) * (ALTURA - 8);
              const hr = (b.aReceber / maximo) * (ALTURA - 8);
              const x = i * espaco + (espaco - larguraBarra) / 2;
              const apagada = escolhida !== null && escolhida !== i;
              return (
                <Rect
                  key={`r${i}`}
                  x={x}
                  y={ALTURA - hf - hr}
                  width={larguraBarra}
                  height={hr}
                  fill={cores.gold}
                  opacity={apagada ? 0.12 : 0.3}
                  rx={1}
                />
              );
            })}
            {barras.map((b, i) => {
              const hf = (b.faturado / maximo) * (ALTURA - 8);
              const x = i * espaco + (espaco - larguraBarra) / 2;
              const apagada = escolhida !== null && escolhida !== i;
              return (
                <Rect
                  key={`f${i}`}
                  x={x}
                  y={ALTURA - hf}
                  width={larguraBarra}
                  height={Math.max(hf, b.faturado > 0 ? 2 : 0)}
                  fill={cores.gold}
                  opacity={apagada ? 0.35 : 1}
                  rx={1}
                />
              );
            })}
          </Svg>
        ) : null}
        {/* areas de toque por cima das barras */}
        <View className="absolute inset-0 flex-row">
          {barras.map((b, i) => (
            <Pressable
              key={i}
              style={{ flex: 1 }}
              onPress={() => setEscolhida(escolhida === i ? null : i)}
              accessibilityRole="button"
              accessibilityLabel={`${b.descricao}: ${formatCentavos(b.faturado)} faturado, ${formatCentavos(b.aReceber)} a receber, ${b.atendimentos} ${b.atendimentos === 1 ? 'atendimento' : 'atendimentos'}`}
            />
          ))}
        </View>
      </View>
      <View className="mt-2" style={{ height: 18 }}>
        {barras.map((b, i) =>
          i % passoRotulo === 0 ? (
            <Text
              key={i}
              style={{
                position: 'absolute',
                width: LARGURA_ROTULO + 10,
                left: espaco * i + espaco / 2 - (LARGURA_ROTULO + 10) / 2,
              }}
              className="text-center font-sans text-ui-xs text-texto-3"
              numberOfLines={1}
            >
              {b.rotulo}
            </Text>
          ) : null
        )}
      </View>
      <View className="mt-3 min-h-[44px] flex-row items-center gap-4">
        {detalhe ? (
          <Text className="font-sans text-ui text-texto" accessibilityLiveRegion="polite">
            <Text className="font-sans-semibold">{detalhe.descricao}: </Text>
            {formatCentavos(detalhe.faturado)} faturado
            {detalhe.aReceber ? `, ${formatCentavos(detalhe.aReceber)} a receber` : ''},{' '}
            {detalhe.atendimentos} {detalhe.atendimentos === 1 ? 'atendimento' : 'atendimentos'}
          </Text>
        ) : (
          <>
            <Legenda cor={cores.gold} texto="Faturado (com baixa)" />
            <Legenda cor={cores.gold} opacidade={0.3} texto="A receber (marcado)" />
          </>
        )}
      </View>
    </View>
  );
}

function Legenda({
  cor,
  opacidade = 1,
  texto,
}: {
  cor: string;
  opacidade?: number;
  texto: string;
}) {
  return (
    <View className="flex-row items-center gap-2">
      <View
        style={{ width: 12, height: 12, backgroundColor: cor, opacity: opacidade, borderRadius: 2 }}
      />
      <Text className="font-sans text-ui-sm text-texto-2">{texto}</Text>
    </View>
  );
}
