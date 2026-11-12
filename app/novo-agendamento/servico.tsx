/**
 * Passo 1 de 4 do agendamento: o servico. (Redesenho nov/2026; a historia do frame 04 segue abaixo.)
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

import { useMeuProfissional, useServicos } from '@/api/hooks';
import type { Servico } from '@/api/types';
import { useAuth } from '@/auth/auth-context';
import { CabecalhoDoFluxo } from '@/components/atelie/fluxo';
import { Carregando, EstadoErro, EstadoVazio } from '@/components/ui/estados';
import { TelaRolavel } from '@/components/ui/tela';
import { useFluxoDeAgendamento } from '@/lib/fluxo-agendamento';
import { formatCentavos, formatDuracao } from '@/lib/money';

function LinhaServico({ servico, aoEscolher }: { servico: Servico; aoEscolher: () => void }) {
  const duracao = formatDuracao(servico.duracaoMinutos);
  const preco = formatCentavos(servico.precoCentavos);

  // redesenho: nome em Playfair, descricao legivel, duracao e preco alinhados a direita;
  // o toque acende a linha em couro e a seta de latao anda um pouco
  return (
    <Pressable
      onPress={aoEscolher}
      accessibilityRole="button"
      accessibilityLabel={[servico.nome, duracao, preco].filter(Boolean).join(', ')}
      className="-mx-4 flex-row items-center gap-4 rounded-[3px] border-b border-borda/70 px-4 py-6"
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) =>
        pressed || hovered ? { backgroundColor: 'rgba(201,169,106,0.08)' } : null
      }
    >
      <View className="flex-1 gap-2">
        <Text className="font-display text-ds-24 text-texto">{servico.nome}</Text>
        {servico.descricao ? (
          <Text className="font-sans text-ui-sm text-texto-2" numberOfLines={2}>
            {servico.descricao}
          </Text>
        ) : null}
      </View>
      <View className="items-end gap-1">
        <Text className="font-display text-ds-20 text-latao">{preco}</Text>
        <Text className="font-sans text-ui-sm text-texto-3">{duracao}</Text>
      </View>
    </Pressable>
  );
}

export default function EscolhaDeServico() {
  const router = useRouter();
  const { role } = useAuth();
  const { extras, eyebrow } = useFluxoDeAgendamento();
  const servicos = useServicos(false);
  const { profissional: minhaFicha } = useMeuProfissional();

  const lista = servicos.data ?? [];

  function escolher(servico: Servico) {
    // O profissional so marca na propria agenda: o passo de escolher quem atende sobra.
    if (role === 'PROFISSIONAL' && minhaFicha?.id) {
      router.push({
        pathname: '/novo-agendamento/horario',
        params: { servicoId: servico.id ?? '', profissionalId: minhaFicha.id, ...extras },
      } as never);
      return;
    }
    router.push({
      pathname: '/novo-agendamento/profissional',
      params: { servicoId: servico.id ?? '', ...extras },
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
      <CabecalhoDoFluxo
        passo={1}
        contexto={eyebrow}
        titulo="O que vamos fazer?"
        descricao="Escolha o serviço. A duração define o tempo reservado na agenda."
      />

      <View>
        {servicos.isLoading ? (
          <Carregando className="mt-8" />
        ) : servicos.error ? (
          <EstadoErro
            className="mt-8"
            erro={servicos.error}
            aoTentarDeNovo={() => void servicos.refetch()}
          />
        ) : lista.length === 0 ? (
          <EstadoVazio
            className="mt-8"
            eyebrow="Sem serviços"
            titulo="O catálogo está vazio."
            descricao="Nenhum serviço publicado por enquanto. Tente de novo em instantes."
            acao={{ titulo: 'Tentar de novo', aoTocar: () => void servicos.refetch() }}
          />
        ) : (
          /* TODO(API): a ordem do design e curada (Análise de Visagismo, Corte Assinatura,
             Corte & Barba, Ritual de Barba, Camuflagem de Fios, Consultoria de Imagem) e
             GET /servicos devolve ordenado por nome, sem campo de ordenacao. Faltaria
             `ordem` (int32) no Servico/ServicoRequest — GET /servicos ordenando por ela e
             PUT /servicos/{id} aceitando-a. Ordenar aqui seria chumbar nome de servico na
             tela, entao a vitrine sai em ordem alfabetica. */
          <View className="mt-8">
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
