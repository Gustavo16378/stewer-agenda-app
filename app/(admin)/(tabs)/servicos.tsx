/**
 * [16 Gestão de serviços] — tab SERVIÇOS do ADMIN. CRUD completo: a API sustenta tudo.
 *
 * Layout literal do frame 16: titulo Playfair 29 "Serviços" com o botao compacto NOVO
 * SERVIÇO a direita; linhas `padding:22px 0` com nome Playfair 19, "90 MIN · R$ 320"
 * (9px .2em ink@.45) e a acao EDITAR (9px .18em ink@.55); nota "Serviços inativos não
 * aparecem para os clientes." (11px ink@.38).
 *
 * Dados: GET /servicos?incluirInativos=true (so ADMIN ve os inativos).
 * Escrita: POST /servicos, PUT /servicos/{id}, DELETE /servicos/{id}.
 *
 * "Desativar" e `ativo:false` no PUT: reversivel, e some so para o cliente (e o que a
 * nota do frame descreve). DELETE e soft delete IRREVERSIVEL pela API — o servico some
 * ate de `incluirInativos=true` e nao volta por PUT. Por isso o formulario separa os
 * dois: o toggle "Visível para clientes" e o botao REMOVER DO CATÁLOGO, com confirmacao
 * dizendo que nao ha volta.
 *
 * Preco: digitado em reais, guardado em CENTAVOS (parseCentavos, por string — sem float).
 * Erros: 400 com violacoes vai para o campo; 409 e nome repetido; 403 e papel errado.
 *
 * DESVIO: o design nao desenhou o formulario; ele e um modal no mesmo vocabulario.
 */
import { useMemo, useState } from 'react';
import { Alert, Modal, RefreshControl, ScrollView, Text, View } from 'react-native';

import { useRemoverServico, useSalvarServico, useServicos } from '@/api/hooks';
import type { Servico } from '@/api/types';
import { AcaoLinha, Botao } from '@/components/ui/botao';
import { Campo } from '@/components/ui/campo';
import { Carregando, EstadoErro, EstadoVazio } from '@/components/ui/estados';
import { Interruptor } from '@/components/ui/interruptor';
import { TelaRolavel } from '@/components/ui/tela';
import { LabelCaps, Titulo } from '@/components/ui/texto';
import { cn } from '@/lib/cn';
import { formatCentavos, formatCentavosCurto, formatDuracaoCaps, parseCentavos } from '@/lib/money';

interface Formulario {
  id?: string;
  nome: string;
  descricao: string;
  duracao: string;
  preco: string;
  ativo: boolean;
}

const VAZIO: Formulario = { nome: '', descricao: '', duracao: '', preco: '', ativo: true };

export default function GestaoDeServicos() {
  const servicos = useServicos(true);
  const salvar = useSalvarServico();
  const remover = useRemoverServico();

  const [form, setForm] = useState<Formulario | null>(null);
  const [erroLocal, setErroLocal] = useState<string | null>(null);

  const lista = useMemo(() => servicos.data ?? [], [servicos.data]);

  function abrirNovo() {
    salvar.reset();
    setErroLocal(null);
    setForm(VAZIO);
  }

  function abrirEdicao(s: Servico) {
    salvar.reset();
    setErroLocal(null);
    setForm({
      id: s.id,
      nome: s.nome ?? '',
      descricao: s.descricao ?? '',
      duracao: s.duracaoMinutos ? String(s.duracaoMinutos) : '',
      preco: formatCentavosCurto(s.precoCentavos),
      ativo: s.ativo ?? true,
    });
  }

  function enviar() {
    if (!form) return;
    const duracaoMinutos = Number(form.duracao);
    const precoCentavos = parseCentavos(form.preco);
    if (!form.nome.trim()) return setErroLocal('Dê um nome ao serviço.');
    if (!Number.isInteger(duracaoMinutos) || duracaoMinutos < 5 || duracaoMinutos > 600) {
      return setErroLocal('Duração em minutos, entre 5 e 600.');
    }
    if (precoCentavos === null || precoCentavos < 0) return setErroLocal('Preço inválido.');
    setErroLocal(null);
    salvar.mutate(
      {
        id: form.id,
        dados: {
          nome: form.nome.trim(),
          ...(form.descricao.trim() ? { descricao: form.descricao.trim() } : {}),
          duracaoMinutos,
          precoCentavos,
          ativo: form.ativo,
        },
      },
      { onSuccess: () => setForm(null) }
    );
  }

  function confirmarRemocao() {
    if (!form?.id) return;
    Alert.alert(
      'Remover do catálogo?',
      `"${form.nome}" some do catálogo para sempre — a API não permite trazer de volta. Para só esconder dos clientes, desligue "Visível para clientes".`,
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => remover.mutate(form.id!, { onSuccess: () => setForm(null) }),
        },
      ]
    );
  }

  const erroApi = salvar.error ?? remover.error;
  const mensagemErro =
    erroApi && !erroApi.temViolacoes
      ? erroApi.status === 409
        ? 'Já existe um serviço com esse nome.'
        : erroApi.message
      : null;

  return (
    <TelaRolavel
      insetInferior={false}
      refreshControl={
        <RefreshControl
          refreshing={servicos.isRefetching}
          onRefresh={() => void servicos.refetch()}
        />
      }
    >
      <View className="pt-10">
        <View className="flex-row items-end justify-between">
          <Titulo className="text-d-29">Serviços</Titulo>
          <Botao
            variante="fantasmaCompacto"
            titulo="NOVO SERVIÇO"
            onPress={abrirNovo}
            className="mb-[2px]"
          />
        </View>

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
            titulo="O catálogo está vazio."
            descricao="Cadastre o primeiro serviço para os clientes poderem agendar."
            acao={{ titulo: 'NOVO SERVIÇO', aoTocar: abrirNovo }}
          />
        ) : (
          <View className="mt-[26px]">
            {lista.map((s) => (
              <View
                key={s.id}
                className={cn(
                  'flex-row items-center justify-between border-b border-divider py-[22px]',
                  s.ativo === false && 'opacity-45'
                )}
              >
                <View className="flex-1 gap-2 pr-4">
                  <Titulo className="text-d-19" numberOfLines={1}>
                    {s.nome}
                  </Titulo>
                  <LabelCaps papel="meta" numberOfLines={1}>
                    {formatDuracaoCaps(s.duracaoMinutos)} · {formatCentavos(s.precoCentavos)}
                    {s.ativo === false ? ' · INATIVO' : ''}
                  </LabelCaps>
                </View>
                <AcaoLinha titulo="EDITAR" onPress={() => abrirEdicao(s)} className="opacity-100" />
              </View>
            ))}
          </View>
        )}

        <Text className="mt-[22px] font-sans text-help text-ink/38">
          Serviços inativos não aparecem para os clientes.
        </Text>
      </View>

      <Modal visible={!!form} transparent animationType="fade" onRequestClose={() => setForm(null)}>
        <View className="bg-canvas/95 flex-1 justify-end">
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="px-screen-x pb-10 pt-8"
          >
            {form ? (
              <>
                <LabelCaps papel="secao">{form.id ? 'EDITAR SERVIÇO' : 'NOVO SERVIÇO'}</LabelCaps>
                <Titulo className="mt-3 text-d-23">
                  {form.id ? form.nome || 'Serviço' : 'Serviço do catálogo'}
                </Titulo>

                <Campo
                  className="mt-6"
                  rotulo="NOME"
                  value={form.nome}
                  onChangeText={(v) => setForm({ ...form, nome: v })}
                  placeholder="Corte Assinatura"
                  maxLength={140}
                  erro={salvar.error?.violacaoDe('nome')}
                />
                <Campo
                  className="mt-[22px]"
                  rotulo="DESCRIÇÃO"
                  value={form.descricao}
                  onChangeText={(v) => setForm({ ...form, descricao: v })}
                  placeholder="O que está incluído (opcional)"
                  maxLength={2000}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  erro={salvar.error?.violacaoDe('descricao')}
                />
                <View className="mt-[22px] flex-row gap-4">
                  <Campo
                    className="flex-1"
                    rotulo="DURAÇÃO (MIN)"
                    value={form.duracao}
                    onChangeText={(v) => setForm({ ...form, duracao: v.replace(/\D/g, '') })}
                    placeholder="60"
                    keyboardType="number-pad"
                    erro={salvar.error?.violacaoDe('duracaoMinutos')}
                  />
                  <Campo
                    className="flex-1"
                    rotulo="PREÇO (R$)"
                    value={form.preco}
                    onChangeText={(v) => setForm({ ...form, preco: v })}
                    placeholder="190,00"
                    keyboardType="decimal-pad"
                    erro={salvar.error?.violacaoDe('precoCentavos')}
                  />
                </View>

                <View className="mt-[22px] flex-row items-center justify-between border-b border-divider py-[19px]">
                  <Text className="font-sans text-body-lg text-text-body">
                    Visível para clientes
                  </Text>
                  <Interruptor
                    rotulo="Visível para clientes"
                    ligado={form.ativo}
                    aoMudar={(v) => setForm({ ...form, ativo: v })}
                  />
                </View>

                {erroLocal ? (
                  <Text className="mt-4 font-sans text-help text-red-500">{erroLocal}</Text>
                ) : null}
                {mensagemErro ? (
                  <Text className="mt-4 font-sans text-help text-red-500">{mensagemErro}</Text>
                ) : null}

                <Botao
                  className="mt-8"
                  titulo={form.id ? 'SALVAR' : 'CADASTRAR'}
                  carregando={salvar.isPending}
                  onPress={enviar}
                />
                <Botao
                  className="mt-3"
                  variante="fantasma"
                  titulo="VOLTAR"
                  onPress={() => setForm(null)}
                />
                {form.id ? (
                  <View className="mt-6 items-center">
                    <AcaoLinha
                      titulo="REMOVER DO CATÁLOGO"
                      onPress={confirmarRemocao}
                      disabled={remover.isPending}
                    />
                  </View>
                ) : null}
              </>
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </TelaRolavel>
  );
}
