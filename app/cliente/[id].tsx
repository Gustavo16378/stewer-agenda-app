/**
 * [14 Ficha do cliente] — tela EMPILHADA do PROFISSIONAL (e alcancavel pelo ADMIN).
 *
 * Layout literal do frame 14: cabecalho com "CLIENTES" a direita; avatar 54 + nome
 * Playfair 25 + "DESDE MARÇO DE 2024 · 12 VISITAS"; card ANOTAÇÕES DE VISAGISMO (fundo
 * `surface`, `padding:22px`, texto 13px lh 1.8 ink@.78, rodape "ATUALIZADO EM 14 AGO ·
 * STEWER GABRIEL" 8px .2em ink@.35, acao EDITAR dourada); HISTÓRICO DE VISITAS em
 * linhas `padding:18px 0` (data 56px, servico 14px ink@.88, valor 12px ink@.45); botao
 * fantasma NOVO AGENDAMENTO PARA ESTE CLIENTE.
 *
 * Dados:
 *   cliente   <- GET /clientes/{id}            (ClienteDetalhe, com agendamentos[])
 *   anotacoes <- GET /clientes/{id}/anotacoes  (mais nova primeiro)
 *
 * `agendamentos[]` vem SEM filtro (todos os status, inclusive futuros): o historico e o
 * "N VISITAS" usam so `status === 'CONCLUIDO'`, senao um cancelado entra como visita paga.
 *
 * Anotacoes sao append-only na API (so POST). "EDITAR" abre o editor com o texto atual e
 * salva como uma anotacao NOVA — para quem le, e editar; para o historico, e versionar.
 *   TODO(API): editar/apagar de verdade exigiria PUT/DELETE /clientes/{id}/anotacoes/{anotacaoId}.
 *   TODO(API): NOVO AGENDAMENTO PARA ESTE CLIENTE — POST /agendamentos e "cliente reserva
 *   para si"; nao aceita `clienteId`. Desabilitado.
 *
 * So PROFISSIONAL anota (ADMIN leva 422 "sem ficha de profissional"): o editor so aparece
 * para esse papel. Um 404 aqui e estado normal — cliente promovido a profissional some
 * da base de clientes mesmo com atendimentos antigos.
 */
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';

import { useAnotacoes, useCliente, useCriarAnotacao } from '@/api/hooks';
import { useAuth } from '@/auth/auth-context';
import { AcaoLinha, Botao } from '@/components/ui/botao';
import { CabecalhoVoltar } from '@/components/ui/cabecalho';
import { Campo } from '@/components/ui/campo';
import { Carregando, EstadoErro, EstadoVazio } from '@/components/ui/estados';
import { AvatarIniciais } from '@/components/ui/imagem';
import { TelaRolavel } from '@/components/ui/tela';
import { LabelCaps, Titulo } from '@/components/ui/texto';
import { formatDiaMesCurtoCaps, formatMesAnoLongoCaps, parseInstant } from '@/lib/datetime';
import { formatCentavos } from '@/lib/money';

const ANOTACAO_MAX = 8000;

export default function FichaDoCliente() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { role } = useAuth();
  const cliente = useCliente(id ?? '');
  const anotacoes = useAnotacoes(id ?? '');
  const criar = useCriarAnotacao(id ?? '');

  const [editor, setEditor] = useState(false);
  const [texto, setTexto] = useState('');

  const visitas = useMemo(
    () =>
      (cliente.data?.agendamentos ?? [])
        .filter((a) => a.status === 'CONCLUIDO')
        .sort(
          (a, b) =>
            (parseInstant(b.inicio)?.getTime() ?? 0) - (parseInstant(a.inicio)?.getTime() ?? 0)
        ),
    [cliente.data]
  );
  const ultimaAnotacao = anotacoes.data?.[0];
  const podeAnotar = role === 'PROFISSIONAL';

  function abrirEditor() {
    setTexto(ultimaAnotacao?.texto ?? '');
    criar.reset();
    setEditor(true);
  }

  function salvarAnotacao() {
    const t = texto.trim();
    if (!t) return;
    criar.mutate({ texto: t.slice(0, ANOTACAO_MAX) }, { onSuccess: () => setEditor(false) });
  }

  return (
    <TelaRolavel>
      <CabecalhoVoltar passo="CLIENTES" />

      {cliente.isLoading ? (
        <Carregando className="mt-8" />
      ) : cliente.error?.status === 404 ? (
        <EstadoVazio
          className="mt-8"
          eyebrow="FICHA INDISPONÍVEL"
          titulo="Este usuário não está mais na base de clientes."
          descricao="Isso acontece quando um cliente passa a fazer parte da equipe."
        />
      ) : cliente.error || !cliente.data ? (
        <EstadoErro
          className="mt-8"
          erro={cliente.error}
          aoTentarDeNovo={() => void cliente.refetch()}
        />
      ) : (
        <View className="pt-[30px]">
          <View className="flex-row items-center gap-5">
            <AvatarIniciais nome={cliente.data.nome} tamanho={54} />
            <View className="flex-1 gap-2">
              <Titulo className="text-d-25" numberOfLines={1}>
                {cliente.data.nome}
              </Titulo>
              <LabelCaps papel="micro" className="tracking-wide text-text-muted" numberOfLines={1}>
                DESDE {formatMesAnoLongoCaps(cliente.data.createdAt)} · {visitas.length}{' '}
                {visitas.length === 1 ? 'VISITA' : 'VISITAS'}
              </LabelCaps>
            </View>
          </View>

          <View className="mt-[34px] rounded-token bg-surface p-[22px]">
            <View className="flex-row items-center justify-between">
              <LabelCaps papel="campo">ANOTAÇÕES DE VISAGISMO</LabelCaps>
              {podeAnotar ? <AcaoLinha titulo="EDITAR" destaque onPress={abrirEditor} /> : null}
            </View>
            {anotacoes.isLoading ? (
              <Carregando className="py-4" />
            ) : anotacoes.error ? (
              <Text className="mt-3 font-sans text-help text-red-500">
                {anotacoes.error.message}
              </Text>
            ) : (
              <>
                <Text className="mt-[14px] font-sans text-body leading-[23.4px] text-ink/78">
                  {ultimaAnotacao?.texto ?? 'Nenhuma anotação ainda.'}
                </Text>
                {ultimaAnotacao ? (
                  <LabelCaps papel="micro" className="mt-4 text-2xs tracking-wide text-ink/35">
                    ATUALIZADO EM {formatDiaMesCurtoCaps(ultimaAnotacao.createdAt)}
                    {ultimaAnotacao.profissionalNome
                      ? ` · ${ultimaAnotacao.profissionalNome.toUpperCase()}`
                      : ''}
                  </LabelCaps>
                ) : null}
                {(anotacoes.data?.length ?? 0) > 1 ? (
                  <Text className="mt-2 font-sans text-help text-ink/38">
                    {anotacoes.data!.length - 1}{' '}
                    {anotacoes.data!.length - 1 === 1
                      ? 'versão anterior guardada.'
                      : 'versões anteriores guardadas.'}
                  </Text>
                ) : null}
              </>
            )}
          </View>

          <LabelCaps papel="secao" className="mt-10">
            HISTÓRICO DE VISITAS
          </LabelCaps>
          {visitas.length === 0 ? (
            <Text className="mt-4 font-sans text-help text-ink/42">
              Nenhuma visita concluída ainda.
            </Text>
          ) : (
            <View className="mt-2">
              {visitas.map((a) => (
                <View
                  key={a.id}
                  className="flex-row items-center gap-[18px] border-b border-divider py-[18px]"
                >
                  <LabelCaps papel="meta" className="w-14 text-caps-sm tracking-tab">
                    {formatDiaMesCurtoCaps(a.inicio)}
                  </LabelCaps>
                  <Text className="flex-1 font-sans text-row text-text-strong" numberOfLines={1}>
                    {a.servicoNome}
                  </Text>
                  <Text className="font-sans text-chip text-text-muted">
                    {formatCentavos(a.precoCentavos)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* TODO(API): agendar em nome de terceiro — POST /agendamentos nao recebe clienteId */}
          <Botao
            className="mt-[26px]"
            variante="fantasma"
            titulo="NOVO AGENDAMENTO PARA ESTE CLIENTE"
            disabled
          />
        </View>
      )}

      <Modal
        visible={editor}
        transparent
        animationType="fade"
        onRequestClose={() => setEditor(false)}
      >
        <View className="bg-canvas/95 flex-1 justify-end">
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="px-screen-x pb-10 pt-8"
          >
            <LabelCaps papel="secao">ANOTAÇÕES DE VISAGISMO</LabelCaps>
            <Titulo className="mt-3 text-d-23">{cliente.data?.nome ?? ''}</Titulo>
            <Campo
              className="mt-6"
              rotulo="TEXTO"
              value={texto}
              onChangeText={setTexto}
              placeholder="Formato de rosto, proporções, o que manter e o que evitar…"
              multiline
              numberOfLines={8}
              maxLength={ANOTACAO_MAX}
              textAlignVertical="top"
              erro={criar.error?.violacaoDe('texto')}
              ajuda="Cada salvamento guarda uma nova versão; as anteriores ficam no histórico."
            />
            {criar.error && !criar.error.temViolacoes ? (
              <Text className="mt-4 font-sans text-help text-red-500">{criar.error.message}</Text>
            ) : null}
            <Botao
              className="mt-8"
              titulo="SALVAR ANOTAÇÃO"
              disabled={!texto.trim()}
              carregando={criar.isPending}
              onPress={salvarAnotacao}
            />
            <Botao
              className="mt-3"
              variante="fantasma"
              titulo="VOLTAR"
              onPress={() => setEditor(false)}
            />
          </ScrollView>
        </View>
      </Modal>
    </TelaRolavel>
  );
}
