/**
 * Inicio do cliente (redesenho, nov/2026).
 *
 * Abre com o retrato do Stewer e a analise de visagismo se desenhando por cima (o hexagono
 * da logo, o eixo e os tercos do rosto): e o momento de marca do app. Depois disso a tela
 * fica quieta e util: o proximo horario, agendar, os servicos, quem e o Stewer, o trabalho
 * dele e onde ele atende.
 */
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, type ReactNode } from 'react';
import {
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMeusAgendamentos, useSemearAgendamento, useServicos } from '@/api/hooks';
import type { Agendamento, Servico } from '@/api/types';
import { useAuth } from '@/auth/auth-context';
import { BotaoAtelie, Paragrafo, TituloSecao } from '@/components/atelie/base';
import { MapaDoAtelie } from '@/components/atelie/MapaDoAtelie';
import { GeometriaDoRosto, MARCAS_RETRATO } from '@/components/marca/Geometria';
import { LogoStewer } from '@/components/marca/Logo';
import { FOTOS, LEMA, LOCAL, PORTFOLIO, SOBRE } from '@/content/atelie';
import {
  formatDiaSemanaDiaMes,
  formatHora,
  parseInstant,
  primeiroNome,
  saudacao,
} from '@/lib/datetime';
import { formatCentavos, formatDuracao } from '@/lib/money';
import { LARGURA_CONTEUDO, useLayoutLargo } from '@/lib/responsivo';

function proximoDaLista(lista: Agendamento[] | undefined): Agendamento | null {
  if (!lista?.length) return null;
  return (
    [...lista]
      .filter((a) => a.status === 'AGENDADO' && a.inicio)
      .sort(
        (a, b) =>
          (parseInstant(a.inicio)?.getTime() ?? 0) - (parseInstant(b.inicio)?.getTime() ?? 0)
      )[0] ?? null
  );
}

/** "Hoje", "Amanhã", "Em 3 dias": o quanto falta, que e o que a pessoa quer saber. */
function quantoFalta(iso: string | undefined): string {
  const d = parseInstant(iso);
  if (!d) return '';
  const zero = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dias = Math.round((zero(d) - zero(new Date())) / 86_400_000);
  if (dias <= 0) return 'Hoje';
  if (dias === 1) return 'Amanhã';
  return `Em ${dias} dias`;
}

function Heroi({ nome }: { nome: string }) {
  const { width } = useWindowDimensions();
  const largo = useLayoutLargo();
  const insets = useSafeAreaInsets();

  const marca = (
    <View
      className="absolute left-6 right-6 flex-row items-center gap-3"
      style={{ top: insets.top + 18 }}
    >
      <LogoStewer altura={26} />
      <Text className="font-sans-medium text-ui-sm text-marfim/80">Stewer Gabriel</Text>
    </View>
  );
  const saudacaoENome = (
    <>
      <Text className="font-sans text-ui-lg text-marfim/75">{saudacao()},</Text>
      <Text className="font-display text-ds-48 text-marfim" numberOfLines={1}>
        {nome}.
      </Text>
    </>
  );

  // Em tela larga o heroi vira uma faixa de carvao: o retrato com a geometria a direita,
  // o nome a esquerda, com espaco para respirar. No celular, o retrato e a tela inteira.
  if (largo) {
    const areaUtil = width - 232;
    const lado = Math.min(560, Math.round(areaUtil * 0.52));
    return (
      <View style={{ height: lado }} className="flex-row overflow-hidden bg-[#0c0c0c]">
        <View className="flex-1 justify-end px-12 pb-12">
          {marca}
          <View className="mb-6 h-px w-8 bg-latao" />
          {saudacaoENome}
          <Text className="mt-4 font-display-italic text-ds-20 text-latao">{LEMA}</Text>
        </View>
        <View style={{ width: lado, height: lado }}>
          <Image
            source={FOTOS.retrato.fonte}
            accessibilityLabel={FOTOS.retrato.descricao}
            contentFit="cover"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            transition={300}
          />
          <GeometriaDoRosto marcas={MARCAS_RETRATO} atraso={300} />
          <LinearGradient
            colors={['rgba(12,12,12,1)', 'rgba(12,12,12,0)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 0.3, y: 0.5 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            pointerEvents="none"
          />
        </View>
      </View>
    );
  }

  const altura = Math.min(width * 1.12, 560);
  return (
    <View style={{ height: altura }} className="overflow-hidden bg-[#0c0c0c]">
      <Image
        source={FOTOS.retrato.fonte}
        accessibilityLabel={FOTOS.retrato.descricao}
        contentFit="cover"
        contentPosition="center"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        transition={300}
      />
      <GeometriaDoRosto marcas={MARCAS_RETRATO} atraso={300} />
      <LinearGradient
        colors={['rgba(12,12,12,0.55)', 'rgba(12,12,12,0)', 'rgba(12,12,12,0)', 'rgba(12,12,12,1)']}
        locations={[0, 0.22, 0.55, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        pointerEvents="none"
      />
      {marca}
      <View className="absolute bottom-7 left-6 right-6">{saudacaoENome}</View>
    </View>
  );
}

function ProximoHorario({
  item,
  aoAbrir,
  aoRemarcar,
}: {
  item: Agendamento;
  aoAbrir: () => void;
  aoRemarcar: () => void;
}) {
  return (
    <View className="rounded-[3px] border-l-2 border-latao bg-superficie px-6 py-6">
      <View className="flex-row items-center justify-between">
        <Text className="font-sans-medium text-ui-sm text-texto-3">Seu próximo horário</Text>
        <View className="rounded-full bg-latao/14 px-3 py-1">
          <Text className="font-sans-semibold text-ui-xs text-latao">
            {quantoFalta(item.inicio)}
          </Text>
        </View>
      </View>
      <Text className="mt-4 font-display text-ds-38 text-texto">{formatHora(item.inicio)}</Text>
      <Text className="mt-1 font-sans text-ui-lg text-texto-2">
        {formatDiaSemanaDiaMes(item.inicio)}
      </Text>
      <Text className="mt-4 font-sans text-ui text-texto-2">
        {item.servicoNome} com {item.profissionalNome}
      </Text>
      <View className="mt-6 flex-row gap-3">
        <BotaoAtelie
          className="flex-1"
          variante="contorno"
          titulo="Remarcar"
          onPress={aoRemarcar}
        />
        <BotaoAtelie
          className="flex-1"
          variante="contorno"
          titulo="Ver detalhes"
          onPress={aoAbrir}
        />
      </View>
    </View>
  );
}

function Linha({
  children,
  onPress,
  rotulo,
}: {
  children: ReactNode;
  onPress: () => void;
  rotulo: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      className="flex-row items-center border-b border-borda py-6"
      style={({ pressed }) => (pressed ? { opacity: 0.6 } : null)}
    >
      {children}
    </Pressable>
  );
}

function LinhaServico({ servico, aoEscolher }: { servico: Servico; aoEscolher: () => void }) {
  return (
    <Linha onPress={aoEscolher} rotulo={`Agendar ${servico.nome}`}>
      <View className="flex-1 gap-2 pr-4">
        <Text className="font-display text-ds-24 text-texto">{servico.nome}</Text>
        {servico.descricao ? (
          <Text className="font-sans text-ui-sm text-texto-3" numberOfLines={2}>
            {servico.descricao}
          </Text>
        ) : null}
      </View>
      <View className="items-end gap-1">
        <Text className="font-display text-ds-20 text-latao">
          {formatCentavos(servico.precoCentavos)}
        </Text>
        <Text className="font-sans text-ui-xs text-texto-3">
          {formatDuracao(servico.duracaoMinutos)}
        </Text>
      </View>
    </Linha>
  );
}

export default function InicioCliente() {
  const router = useRouter();
  const { usuario } = useAuth();
  const { width } = useWindowDimensions();
  const largo = useLayoutLargo();
  const semear = useSemearAgendamento();

  const futuros = useMeusAgendamentos('futuros');
  const servicos = useServicos(false);
  const proximo = useMemo(() => proximoDaLista(futuros.data), [futuros.data]);

  const larguraFoto = largo ? 260 : Math.round(width * 0.64);

  function abrirDetalhe(item: Agendamento) {
    semear(item);
    router.push({
      pathname: '/agendamento/[id]',
      params: { id: item.id ?? '', origem: 'meus', periodo: 'todos' },
    } as never);
  }

  function remarcar(item: Agendamento) {
    router.push({
      pathname: '/novo-agendamento/horario',
      params: {
        servicoId: item.servicoId ?? '',
        profissionalId: item.profissionalId ?? '',
        agendamentoId: item.id ?? '',
      },
    } as never);
  }

  function agendar(servico?: Servico) {
    if (servico?.id) {
      router.push({
        pathname: '/novo-agendamento/profissional',
        params: { servicoId: servico.id },
      } as never);
    } else {
      router.push('/novo-agendamento/servico' as never);
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-fundo"
      contentContainerStyle={{ paddingBottom: 56 }}
      refreshControl={
        <RefreshControl
          refreshing={futuros.isRefetching}
          onRefresh={() => {
            void futuros.refetch();
            void servicos.refetch();
          }}
          tintColor="#C9A96A"
        />
      }
    >
      <Heroi nome={primeiroNome(usuario?.nome) || 'bem-vindo'} />

      <View
        className={largo ? 'px-6 pt-10' : 'px-6'}
        style={largo ? { maxWidth: LARGURA_CONTEUDO, width: '100%', alignSelf: 'center' } : null}
      >
        {largo ? null : (
          <Text className="-mt-1 font-display-italic text-ui-lg text-latao">{LEMA}</Text>
        )}

        <View className="mt-8">
          {proximo ? (
            <ProximoHorario
              item={proximo}
              aoAbrir={() => abrirDetalhe(proximo)}
              aoRemarcar={() => remarcar(proximo)}
            />
          ) : (
            <View className="rounded-[3px] bg-superficie px-6 py-6">
              <Text className="font-display text-ds-24 text-texto">Nenhum horário marcado.</Text>
              <Paragrafo className="mt-2">
                Escolha o serviço e o melhor dia. Leva menos de um minuto.
              </Paragrafo>
            </View>
          )}
          <BotaoAtelie
            className="mt-4"
            titulo={proximo ? 'Agendar outro horário' : 'Agendar horário'}
            onPress={() => agendar()}
          />
        </View>

        <TituloSecao className="mt-16">Serviços</TituloSecao>
        <View className="mt-4">
          {(servicos.data ?? []).map((s) => (
            <LinhaServico key={s.id ?? s.nome} servico={s} aoEscolher={() => agendar(s)} />
          ))}
        </View>

        <TituloSecao className="mt-16">Quem é Stewer</TituloSecao>
        <View className={largo ? 'mt-8 flex-row gap-10' : 'mt-8'}>
          <View style={largo ? { width: 280 } : undefined} className="self-start">
            {/* moldura deslocada em latao, a mesma do site */}
            <View
              className="absolute border border-latao/40"
              style={{ top: 14, left: 14, right: -14, bottom: -14 }}
            />
            <Image
              source={FOTOS.perfil.fonte}
              accessibilityLabel={FOTOS.perfil.descricao}
              contentFit="cover"
              contentPosition="top"
              style={{ width: largo ? 280 : width * 0.68, aspectRatio: 3 / 4 }}
              transition={300}
            />
          </View>
          <View className={largo ? 'flex-1' : 'mt-12'}>
            <Text className="font-display text-ds-24 text-texto">{SOBRE.titulo}</Text>
            {SOBRE.paragrafos.map((p) => (
              <Paragrafo key={p} className="mt-4">
                {p}
              </Paragrafo>
            ))}
            <View className="mt-7 border-l-2 border-latao pl-5">
              <Text className="font-display-italic text-ds-20 text-texto">{SOBRE.citacao}</Text>
            </View>
            <View className="mt-8 flex-row gap-10">
              {SOBRE.numeros.map((n) => (
                <View key={n.legenda}>
                  <Text className="font-display text-ds-38 text-latao">{n.valor}</Text>
                  <Text className="font-sans text-ui-sm text-texto-3">{n.legenda}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <TituloSecao className="mt-16">O trabalho</TituloSecao>
      </View>

      <FlatList
        className="mt-6"
        data={PORTFOLIO}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={larguraFoto + 12}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
        keyExtractor={(f) => f.descricao}
        renderItem={({ item }) => (
          <Image
            source={item.fonte}
            accessibilityLabel={item.descricao}
            contentFit="cover"
            style={{ width: larguraFoto, aspectRatio: 3 / 4, borderRadius: 3 }}
            transition={300}
          />
        )}
      />

      <View className="px-6">
        <TituloSecao className="mt-16">Onde atende</TituloSecao>
        <View className="mt-6">
          <MapaDoAtelie />
        </View>
        <BotaoAtelie
          className="mt-2 self-start"
          variante="texto"
          titulo="@stewer.gabriel no Instagram"
          onPress={() => void Linking.openURL(LOCAL.instagram)}
        />

        <View className="mt-16 items-center">
          <LogoStewer altura={30} cor="#8a8178" />
        </View>
      </View>
    </ScrollView>
  );
}
