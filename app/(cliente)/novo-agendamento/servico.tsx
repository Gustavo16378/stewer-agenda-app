/**
 * [04 Escolha de serviço] — PASSO 01 DE 04 do wizard de agendamento do cliente.
 *
 * Layout literal do frame 04: cabecalho de passo (`padding:20px 28px 0`), corpo com
 * `padding:34px 28px 0`, eyebrow "NOVO AGENDAMENTO", titulo Playfair 29px e a
 * lista-precario: cada linha `padding:21px 0` com divisor embaixo — INCLUSIVE a ultima,
 * o design nao abre excecao de last-child — nome em Playfair 19px e duracao em caps a
 * esquerda, preco a direita.
 *
 * Dados:
 *   servicos <- GET /servicos   (useServicos(false): para o cliente a API ja filtra
 *                                ativo=true, entao nao ha nada a filtrar na tela)
 *
 * Tocar em qualquer ponto da linha escolhe o servico e avanca para o passo 02 levando
 * `servicoId` — a duracao desse servico e o que dimensiona os slots do passo 03.
 *
 * A tela vive FORA das Tabs (frames 04-07 sao full-bleed, sem tab bar), por isso
 * `TelaRolavel` com o inset de baixo ligado. 7 servicos ja estouram os 844px do frame,
 * entao a lista rola mesmo o design nao mostrando scroll.
 */
import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, Text, View } from 'react-native';

import { useServicos } from '@/api/hooks';
import type { Servico } from '@/api/types';
import { CabecalhoVoltar } from '@/components/ui/cabecalho';
import { Carregando, EstadoErro, EstadoVazio } from '@/components/ui/estados';
import { TelaRolavel } from '@/components/ui/tela';
import { LabelCaps, Titulo } from '@/components/ui/texto';
import { formatCentavos, formatDuracao } from '@/lib/money';

function LinhaServico({ servico, aoEscolher }: { servico: Servico; aoEscolher: () => void }) {
  // o design escreve a duracao em caps ("90 MIN"); o texto vem de formatDuracao para a
  // regra de horas viver num lugar so
  const duracao = formatDuracao(servico.duracaoMinutos).toUpperCase();
  const preco = formatCentavos(servico.precoCentavos);

  return (
    <Pressable
      onPress={aoEscolher}
      accessibilityRole="button"
      accessibilityLabel={[servico.nome, duracao, preco].filter(Boolean).join(', ')}
      className="flex-row items-center justify-between border-b border-divider py-[21px]"
      style={({ pressed }) => (pressed ? { opacity: 0.6 } : null)}
    >
      <View className="flex-1 gap-[7px] pr-4">
        <Titulo className="text-d-19">{servico.nome}</Titulo>
        {servico.descricao ? (
          <Text className="font-sans text-help text-text-meta" numberOfLines={2}>
            {servico.descricao}
          </Text>
        ) : null}
        <LabelCaps papel="meta">{duracao}</LabelCaps>
      </View>

      {/* .85 e o degrau exato do preco no design e nao tem token semantico proprio */}
      <Text className="font-sans-medium text-body-lg text-ink/85">{preco}</Text>
    </Pressable>
  );
}

export default function EscolhaDeServico() {
  const router = useRouter();
  const servicos = useServicos(false);

  const lista = servicos.data ?? [];

  function escolher(servico: Servico) {
    router.push({
      pathname: '/(cliente)/novo-agendamento/profissional',
      params: { servicoId: servico.id ?? '' },
    } as never);
  }

  return (
    <TelaRolavel
      refreshControl={
        <RefreshControl
          refreshing={servicos.isRefetching}
          onRefresh={() => void servicos.refetch()}
        />
      }
    >
      <CabecalhoVoltar passo="PASSO 01 DE 04" />

      <View className="pt-[34px]">
        <LabelCaps papel="tela">NOVO AGENDAMENTO</LabelCaps>
        <Titulo className="mt-3 text-d-29">Escolha o serviço</Titulo>

        {servicos.isLoading ? (
          <Carregando className="mt-[26px]" />
        ) : servicos.error ? (
          <EstadoErro
            className="mt-[26px]"
            erro={servicos.error}
            aoTentarDeNovo={() => void servicos.refetch()}
          />
        ) : lista.length === 0 ? (
          <EstadoVazio
            className="mt-[26px]"
            eyebrow="SEM SERVIÇOS"
            titulo="O catálogo está vazio."
            descricao="Nenhum serviço publicado por enquanto. Tente de novo em instantes."
            acao={{ titulo: 'TENTAR DE NOVO', aoTocar: () => void servicos.refetch() }}
          />
        ) : (
          /* TODO(API): a ordem do design e curada (Análise de Visagismo, Corte Assinatura,
             Corte & Barba, Ritual de Barba, Camuflagem de Fios, Consultoria de Imagem) e
             GET /servicos devolve ordenado por nome, sem campo de ordenacao. Faltaria
             `ordem` (int32) no Servico/ServicoRequest — GET /servicos ordenando por ela e
             PUT /servicos/{id} aceitando-a. Ordenar aqui seria chumbar nome de servico na
             tela, entao a vitrine sai em ordem alfabetica. */
          <View className="mt-[26px]">
            {lista.map((servico) => (
              <LinhaServico
                key={servico.id ?? servico.nome}
                servico={servico}
                aoEscolher={() => escolher(servico)}
              />
            ))}
          </View>
        )}
      </View>
    </TelaRolavel>
  );
}
