/**
 * [05 Escolha de profissional] — PASSO 02 DE 04 do wizard.
 *
 * Layout literal do frame 05: `padding:34px 28px 0`, eyebrow "NOVO AGENDAMENTO",
 * titulo Playfair 29px, e o card de contorno dourado com o retrato de 330px, o nome em
 * Playfair 23px, a especialidade em caps dourado, a linha de bio, o divisor e o par
 * "SELECIONADO" + losango de 7px.
 *
 * Dados:
 *   profissionais <- GET /profissionais  (so os ativos; `useProfissionais(false)`)
 *
 * O frame desenha UM card, ja selecionado, porque o atelie tem um profissional so — e a
 * propria tela avisa: "Em breve, novos profissionais do atelie.". Aqui ele virou lista:
 * cada profissional recebe o mesmo card e o estado desenhado (borda dourada + label +
 * losango) marca a escolha. Com um item, ele ja vem escolhido e a tela volta a ser
 * exatamente a confirmacao do design.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, Text, View } from 'react-native';

import { useProfissionais } from '@/api/hooks';
import type { Profissional } from '@/api/types';
import { Botao } from '@/components/ui/botao';
import { CabecalhoVoltar } from '@/components/ui/cabecalho';
import { Carregando, EstadoErro, EstadoVazio } from '@/components/ui/estados';
import { SlotImagem } from '@/components/ui/imagem';
import { Losango } from '@/components/ui/losango';
import { DivisorCard } from '@/components/ui/superficies';
import { TelaRolavel } from '@/components/ui/tela';
import { LabelCaps, Titulo } from '@/components/ui/texto';
import { cn } from '@/lib/cn';

export default function EscolhaDeProfissional() {
  const router = useRouter();
  const { servicoId } = useLocalSearchParams<{ servicoId?: string }>();

  // TODO(API): nao existe vinculo servico x profissional. `GET /profissionais` devolve a
  // equipe inteira e nada diz quem executa o `servicoId` escolhido no passo 01 — nem o
  // `POST /agendamentos` recusa a combinacao. Com dois profissionais de catalogos
  // diferentes, esta tela oferece quem nao faz o servico. Faltaria
  // `GET /servicos/{servicoId}/profissionais -> 200 Profissional[]` (ou
  // `GET /profissionais?servicoId=`) e 422 SERVICO_NAO_ATENDIDO no POST. Enquanto isso a
  // lista vai inteira: filtrar por conta propria seria inventar regra de negocio.
  const profissionais = useProfissionais(false);
  const lista = profissionais.data ?? [];

  const [escolhido, setEscolhido] = useState<string | null>(null);

  // Lista de um item ja vem marcada: e o estado que o frame desenha.
  const selecionadoId = escolhido ?? (lista.length === 1 ? (lista[0]?.id ?? null) : null);

  function avancar(profissionalId: string) {
    router.push({
      pathname: '/(cliente)/novo-agendamento/horario',
      params: { servicoId: servicoId ?? '', profissionalId },
    } as never);
  }

  /** Tocar no card escolhe e segue: a escolha fica de pe se o cliente voltar pelo "←". */
  function escolher(profissional: Profissional) {
    if (!profissional.id) return;
    setEscolhido(profissional.id);
    avancar(profissional.id);
  }

  // Sem servico o passo 03 nao consegue pedir os horarios livres
  // (`GET /profissionais/{id}/horarios-livres` exige `servicoId`). Isso acontece em deep
  // link ou reload no dev, nao no fluxo normal — dai voltar ao passo 01 em vez de travar.
  if (!servicoId) {
    return (
      <TelaRolavel>
        <CabecalhoVoltar passo="PASSO 02 DE 04" />
        <EstadoVazio
          eyebrow="NOVO AGENDAMENTO"
          titulo="Escolha o serviço primeiro."
          descricao="Comece pelo serviço, para o ateliê saber quanto tempo reservar."
          acao={{
            titulo: 'NOVO AGENDAMENTO',
            aoTocar: () => router.replace('/(cliente)/novo-agendamento/servico' as never),
          }}
        />
      </TelaRolavel>
    );
  }

  return (
    <TelaRolavel
      refreshControl={
        <RefreshControl
          refreshing={profissionais.isRefetching}
          onRefresh={() => void profissionais.refetch()}
        />
      }
    >
      <CabecalhoVoltar passo="PASSO 02 DE 04" />

      <View className="pt-[34px]">
        <LabelCaps papel="tela">NOVO AGENDAMENTO</LabelCaps>
        <Titulo className="mt-3 text-d-29">Escolha o profissional</Titulo>

        {profissionais.isLoading ? (
          <Carregando className="mt-[30px]" />
        ) : profissionais.error ? (
          <EstadoErro
            className="mt-[30px]"
            erro={profissionais.error}
            aoTentarDeNovo={() => void profissionais.refetch()}
          />
        ) : lista.length === 0 ? (
          <EstadoVazio
            className="mt-[30px]"
            eyebrow="EQUIPE"
            titulo="Nenhum profissional disponível."
            descricao="Em breve, novos profissionais do ateliê."
          />
        ) : (
          <>
            {lista.map((profissional) => (
              <CardProfissional
                key={profissional.id}
                profissional={profissional}
                selecionado={!!profissional.id && profissional.id === selecionadoId}
                aoTocar={() => escolher(profissional)}
              />
            ))}

            <Botao
              className="mt-7"
              titulo="CONTINUAR"
              disabled={!selecionadoId}
              onPress={() => {
                if (selecionadoId) avancar(selecionadoId);
              }}
            />

            <Text className="mt-5 text-center font-sans text-help text-ink/38">
              Em breve, novos profissionais do ateliê.
            </Text>
          </>
        )}
      </View>
    </TelaRolavel>
  );
}

/**
 * O card do frame: `border:1px solid gold; border-radius:2px; overflow:hidden`, com o
 * retrato sangrando ate a borda e o bloco de texto em `padding:24px; gap:10px`.
 *
 * O contorno dourado E o estado selecionado. O nao selecionado o design nao desenha:
 * derivei trocando o contorno pelo de card neutro e escondendo o par
 * "SELECIONADO" + losango — junto com o divisor, que sem o par ficaria solto.
 */
function CardProfissional({
  profissional,
  selecionado,
  aoTocar,
}: {
  profissional: Profissional;
  selecionado: boolean;
  aoTocar: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: selecionado }}
      accessibilityLabel={profissional.nome}
      accessibilityHint="Escolher este profissional e seguir para data e horário"
      onPress={aoTocar}
      className={cn(
        'mt-[30px] overflow-hidden rounded-token border',
        selecionado ? 'border-gold-border' : 'border-card-border'
      )}
      style={({ pressed }) => (pressed ? { opacity: 0.92 } : null)}
    >
      {/* `fotoUrl` vem OMITIDO do JSON quando e nulo (nenhum profissional do seed tem
          foto), entao o placeholder e o caminho normal desta tela, nao a excecao. */}
      <SlotImagem
        uri={profissional.fotoUrl}
        altura={330}
        acessibilidade={
          profissional.nome ? `Retrato de ${profissional.nome}` : 'Retrato do profissional'
        }
      />

      <View className="gap-[10px] p-6">
        <Titulo className="text-d-23">{profissional.nome}</Titulo>

        {profissional.especialidade ? (
          // 9px/600/.22em dourado. Tamanho e tracking no MESMO <Text>, senao o `em` do
          // NativeWind cai no rem. As caps do design sao texto em maiuscula mesmo, nao
          // text-transform (que nem existe em RN) — dai o toUpperCase aqui.
          <Text
            className="font-sans-semibold text-caps tracking-button text-gold"
            style={{ includeFontPadding: false }}
            maxFontSizeMultiplier={1.15}
          >
            {profissional.especialidade.toUpperCase()}
          </Text>
        ) : null}

        {/* Nesta linha o frame traz "Fundador do ateliê", que e um cargo curto.
            TODO(API): `Profissional` nao tem campo de cargo/titulo — faltaria `titulo`
            (string curta) em `Profissional` e em `ProfissionalRequest`, gravado por
            `PUT /profissionais/{id}`. Ate existir, a linha e a `bio`, o unico texto livre
            que a API da — e ela e opcional, omitida quando nula. */}
        {profissional.bio ? (
          <Text className="font-sans text-meta text-ink/55">{profissional.bio}</Text>
        ) : null}

        {selecionado ? (
          <>
            <DivisorCard className="mt-2" />
            <View className="mt-1 flex-row items-center justify-between">
              <LabelCaps papel="meta" className="text-gold">
                SELECIONADO
              </LabelCaps>
              {/* o "checkbox" da marca: losango vazio de 7px, contorno dourado */}
              <Losango tamanho={7} />
            </View>
          </>
        ) : null}
      </View>
    </Pressable>
  );
}
