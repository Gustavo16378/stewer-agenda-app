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
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { useProfissionais } from '@/api/hooks';
import type { Profissional } from '@/api/types';
import { BotaoAtelie } from '@/components/atelie/base';
import { CabecalhoDoFluxo } from '@/components/atelie/fluxo';
import { useRetratoDoProfissional } from '@/components/atelie/retrato';
import { CabecalhoVoltar } from '@/components/ui/cabecalho';
import { Carregando, EstadoErro, EstadoVazio } from '@/components/ui/estados';
import { iniciaisDe } from '@/components/ui/imagem';
import { TelaRolavel } from '@/components/ui/tela';
import { cn } from '@/lib/cn';
import { useFluxoDeAgendamento } from '@/lib/fluxo-agendamento';
import { useLayoutLargo } from '@/lib/responsivo';

export default function EscolhaDeProfissional() {
  const router = useRouter();
  const { extras, eyebrow, servicoIds, paramServicos } = useFluxoDeAgendamento();

  // TODO(API): nao existe vinculo servico x profissional. `GET /profissionais` devolve a
  // equipe inteira e nada diz quem executa os servicos escolhidos no passo 01 — nem o
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
      pathname: '/novo-agendamento/horario',
      params: { servicoIds: paramServicos, profissionalId, ...extras },
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
  if (servicoIds.length === 0) {
    return (
      <TelaRolavel>
        <CabecalhoVoltar />
        <EstadoVazio
          eyebrow="Novo agendamento"
          titulo="Escolha o serviço primeiro."
          descricao="Comece pelo serviço, para o estúdio saber quanto tempo reservar."
          acao={{
            titulo: 'Novo agendamento',
            aoTocar: () => router.replace('/novo-agendamento/servico' as never),
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
      <CabecalhoDoFluxo passo={2} contexto={eyebrow} titulo="Com quem?" />

      <View>
        {profissionais.isLoading ? (
          <Carregando className="mt-8" />
        ) : profissionais.error ? (
          <EstadoErro
            className="mt-8"
            erro={profissionais.error}
            aoTentarDeNovo={() => void profissionais.refetch()}
          />
        ) : lista.length === 0 ? (
          <EstadoVazio
            className="mt-8"
            eyebrow="Equipe"
            titulo="Nenhum profissional disponível."
            descricao="Em breve, novos profissionais no estúdio."
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

            <BotaoAtelie
              className="mt-7"
              titulo="Continuar"
              disabled={!selecionadoId}
              onPress={() => {
                if (selecionadoId) avancar(selecionadoId);
              }}
            />
          </>
        )}
      </View>
    </TelaRolavel>
  );
}

/**
 * O profissional como uma ficha com retrato (redesenho, nov/2026): a foto ocupa o card,
 * o nome assenta sobre ela em Playfair, a especialidade em latao. Sem foto, as iniciais
 * em Playfair grande sobre o couro.
 *
 * Em tela larga (notebook) o card tem ~700px de largura: com a foto de ponta a ponta e
 * 340px de altura, o retrato (que e vertical) virava uma faixa com so o cabelo e os
 * olhos. Ali o retrato vai para uma coluna propria em 4:5, do lado do nome e da bio.
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
  const foto = useRetratoDoProfissional(profissional);
  const largo = useLayoutLargo();

  const retrato = foto ? (
    <Image
      source={foto}
      accessibilityLabel={`Retrato de ${profissional.nome ?? 'profissional'}`}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      contentPosition="top"
      transition={250}
    />
  ) : (
    <View className="flex-1 items-center justify-center">
      <Text className="font-display text-[96px] text-latao/40">
        {iniciaisDe(profissional.nome)}
      </Text>
    </View>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: selecionado }}
      accessibilityLabel={profissional.nome}
      accessibilityHint="Escolher este profissional e seguir para data e horário"
      onPress={aoTocar}
      className={cn(
        'mt-6 overflow-hidden rounded-[3px] border bg-superficie',
        selecionado ? 'border-latao' : 'border-borda',
        largo && 'flex-row'
      )}
      style={({ pressed }) => (pressed ? { transform: [{ scale: 0.99 }] } : null)}
    >
      {largo ? (
        <>
          <View style={{ width: 300, aspectRatio: 4 / 5 }}>{retrato}</View>
          <View className="flex-1 justify-end gap-1 p-8">
            {profissional.especialidade ? (
              <Text className="font-sans-medium text-ui-sm text-latao">
                {profissional.especialidade}
              </Text>
            ) : null}
            <Text className="font-display text-ds-38 text-texto">{profissional.nome}</Text>
            {profissional.bio ? (
              <Text className="mt-3 font-sans text-ui text-texto-2">{profissional.bio}</Text>
            ) : null}
          </View>
        </>
      ) : (
        <>
          <View style={{ height: 340 }}>
            {retrato}
            <LinearGradient
              colors={['rgba(12,12,12,0)', 'rgba(12,12,12,0.85)']}
              locations={[0.45, 1]}
              style={StyleSheet.absoluteFill}
            />
            <View className="absolute bottom-0 left-0 right-0 gap-1 p-6">
              {profissional.especialidade ? (
                <Text className="font-sans-medium text-ui-sm text-[#C9A96A]">
                  {profissional.especialidade}
                </Text>
              ) : null}
              <Text className="font-display text-ds-30 text-marfim">{profissional.nome}</Text>
            </View>
          </View>
          {profissional.bio ? (
            <Text className="px-6 py-5 font-sans text-ui text-texto-2">{profissional.bio}</Text>
          ) : null}
        </>
      )}
    </Pressable>
  );
}
