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
 * Da para escolher MAIS DE UM servico (corte + barba): tocar na linha marca ou desmarca,
 * e a faixa presa embaixo soma tempo e valor do que esta marcado. "Continuar" leva os
 * servicos ao passo 02 em `servicoIds`, na ordem em que foram tocados; a soma das
 * duracoes e o que dimensiona os slots do passo 03.
 *
 * A tela vive FORA das Tabs (frames 04-07 sao full-bleed, sem tab bar), por isso
 * `TelaRolavel` com o inset de baixo ligado. 7 servicos ja estouram os 844px do frame,
 * entao a lista rola mesmo o design nao mostrando scroll.
 */
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, Text, View } from 'react-native';

import { useMeuProfissional, useServicos } from '@/api/hooks';
import type { Servico } from '@/api/types';
import { useAuth } from '@/auth/auth-context';
import { BarraDeResumo, CabecalhoDoFluxo } from '@/components/atelie/fluxo';
import { FotosDoServico } from '@/components/estudio/FotosDoServico';
import { Carregando, EstadoErro, EstadoVazio } from '@/components/ui/estados';
import { TelaRolavel } from '@/components/ui/tela';
import { cn } from '@/lib/cn';
import { paramDeServicos, useFluxoDeAgendamento } from '@/lib/fluxo-agendamento';
import { formatCentavos, formatDuracao } from '@/lib/money';

/** A API aceita ate 6 servicos num agendamento (AgendamentoRequest.MAXIMO_DE_SERVICOS). */
const MAXIMO_DE_SERVICOS = 6;

/** Quadradinho de marcar, no latao do estudio. */
function Marca({ marcado }: { marcado: boolean }) {
  return (
    <View
      className={cn(
        'h-[22px] w-[22px] items-center justify-center rounded-[3px] border',
        marcado ? 'border-latao bg-latao' : 'border-borda bg-superficie'
      )}
    >
      {marcado ? (
        <Text className="font-sans-semibold text-[13px] leading-[15px] text-fundo">✓</Text>
      ) : null}
    </View>
  );
}

function LinhaServico({
  servico,
  marcado,
  aoTocar,
}: {
  servico: Servico;
  marcado: boolean;
  aoTocar: () => void;
}) {
  const duracao = formatDuracao(servico.duracaoMinutos);
  const preco = formatCentavos(servico.precoCentavos);

  // redesenho: nome em Playfair, descricao legivel, duracao e preco alinhados a direita;
  // marcada, a linha fica acesa em latao e o quadradinho preenchido
  return (
    <Pressable
      onPress={aoTocar}
      role="checkbox"
      aria-checked={marcado}
      accessibilityState={{ checked: marcado }}
      accessibilityLabel={[servico.nome, duracao, preco].filter(Boolean).join(', ')}
      className="-mx-4 flex-row items-center gap-4 rounded-[3px] border-b border-borda/70 px-4 py-6"
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) =>
        marcado
          ? { backgroundColor: 'rgba(201,169,106,0.14)' }
          : pressed || hovered
            ? { backgroundColor: 'rgba(201,169,106,0.08)' }
            : null
      }
    >
      <Marca marcado={marcado} />
      <View className="flex-1 gap-2">
        <Text className="font-display text-ds-24 text-texto">{servico.nome}</Text>
        {servico.descricao ? (
          <Text className="font-sans text-ui-sm text-texto-2" numberOfLines={2}>
            {servico.descricao}
          </Text>
        ) : null}
        <FotosDoServico fotos={servico.fotos} nome={servico.nome} />
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
  const { extras, eyebrow, servicoIds: jaEscolhidos } = useFluxoDeAgendamento();
  const servicos = useServicos(false);
  const { profissional: minhaFicha } = useMeuProfissional();

  const lista = useMemo(() => servicos.data ?? [], [servicos.data]);

  // na ordem em que a pessoa tocou: e a ordem em que os servicos serao feitos
  const [marcados, setMarcados] = useState<string[]>(jaEscolhidos);

  const escolhidos = useMemo(
    () => marcados.map((id) => lista.find((s) => s.id === id)).filter((s): s is Servico => !!s),
    [marcados, lista]
  );
  const minutos = escolhidos.reduce((t, s) => t + (s.duracaoMinutos ?? 0), 0);
  const centavos = escolhidos.reduce((t, s) => t + (s.precoCentavos ?? 0), 0);

  function alternar(servico: Servico) {
    const id = servico.id;
    if (!id) return;
    setMarcados((antes) =>
      antes.includes(id)
        ? antes.filter((x) => x !== id)
        : antes.length >= MAXIMO_DE_SERVICOS
          ? antes
          : [...antes, id]
    );
  }

  function continuar() {
    if (escolhidos.length === 0) return;
    const servicoIds = paramDeServicos(escolhidos.map((s) => s.id));
    // O profissional so marca na propria agenda: o passo de escolher quem atende sobra.
    if (role === 'PROFISSIONAL' && minhaFicha?.id) {
      router.push({
        pathname: '/novo-agendamento/horario',
        params: { servicoIds, profissionalId: minhaFicha.id, ...extras },
      } as never);
      return;
    }
    router.push({
      pathname: '/novo-agendamento/profissional',
      params: { servicoIds, ...extras },
    } as never);
  }

  return (
    <View className="flex-1 bg-canvas">
      <TelaRolavel
        insetInferior={false}
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
          descricao="Escolha um ou mais serviços. O tempo somado é o que fica reservado na agenda."
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
                  marcado={!!servico.id && marcados.includes(servico.id)}
                  aoTocar={() => alternar(servico)}
                />
              ))}
            </View>
          )}
        </View>
      </TelaRolavel>

      <BarraDeResumo
        linha1={
          escolhidos.length === 0 ? 'Escolha um serviço' : escolhidos.map((s) => s.nome).join(' + ')
        }
        linha2={
          escolhidos.length === 0
            ? 'Dá para marcar mais de um'
            : `${formatDuracao(minutos)} · ${formatCentavos(centavos)}`
        }
        titulo="Continuar"
        ativo={escolhidos.length > 0}
        aoTocar={continuar}
      />
    </View>
  );
}
