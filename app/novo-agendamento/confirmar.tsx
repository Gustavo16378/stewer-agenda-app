/**
 * [07 Confirmação] — PASSO 04 DE 04.
 *
 * Layout literal do frame 07: eyebrow "NOVO AGENDAMENTO", titulo Playfair 29px
 * "Confirme os detalhes", card de contorno ink@.14 com `padding:28px 26px; gap:22px`
 * (SERVIÇO em Playfair 21, PROFISSIONAL 14.5, DATA e HORÁRIO lado a lado com `gap:56px`,
 * divisor, VALOR em Playfair 24), nota "Cancelamento sem custo...", botao primario
 * CONFIRMAR AGENDAMENTO e a acao em caps ALTERAR DATA OU HORÁRIO.
 *
 * Recebe servicoId, profissionalId e o `inicio` (INSTANTE ISO cru do slot) por params.
 * Nome do servico e do profissional vem das listas ja em cache (useServicos /
 * useProfissionais) — nao ha GET por id necessario aqui.
 *
 * Acao: POST /agendamentos { profissionalId, servicoId, inicio, observacao? }.
 * `inicio` vai exatamente como veio do slot: ja e ISO com offset.
 *
 * DESVIO consciente: o campo OBSERVAÇÃO nao esta no frame, mas `AgendamentoRequest`
 * tem `observacao` ("Recado do cliente para o profissional", ate 2000 caracteres).
 * Entrou como campo opcional, no mesmo vocabulario dos outros campos.
 *
 * LACUNA de design: nao ha tela de sucesso. Confirmado, o app volta para MEUS HORÁRIOS,
 * onde o agendamento novo aparece em PRÓXIMOS.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { ApiError } from '@/api/errors';
import { useCriarAgendamento, useProfissionais, useRemarcar, useServicos } from '@/api/hooks';
import { useAuth } from '@/auth/auth-context';
import { AcaoLinha, Botao } from '@/components/ui/botao';
import { CabecalhoVoltar } from '@/components/ui/cabecalho';
import { Campo } from '@/components/ui/campo';
import { Carregando, EstadoErro } from '@/components/ui/estados';
import { Card, DivisorCard } from '@/components/ui/superficies';
import { TelaRolavel } from '@/components/ui/tela';
import { LabelCaps, Titulo } from '@/components/ui/texto';
import {
  calendarDateDoInstante,
  formatDiaSemanaDiaMes,
  formatFaixaHoras,
  formatFaixaPorDuracao,
} from '@/lib/datetime';
import { useFluxoDeAgendamento } from '@/lib/fluxo-agendamento';
import { formatCentavos } from '@/lib/money';

const OBSERVACAO_MAX = 2000;

/** Mensagens proprias para os codigos que a API devolve neste POST. */
function mensagemDoErro(erro: ApiError): string {
  switch (erro.codigo) {
    case 'LIMITE_DE_AGENDAMENTOS':
      return 'Você já tem o máximo de horários marcados. Cancele um ou espere um deles passar para marcar outro.';
    case 'ANTECEDENCIA_MAXIMA':
      return 'Esse dia ainda está longe demais. Dá para marcar com até 60 dias de antecedência.';
    case 'HORARIO_NO_PASSADO':
      return 'Esse horário já passou. Escolha outro.';
    case 'FORA_DA_DISPONIBILIDADE':
      return 'O profissional não atende nesse horário. Escolha outro.';
    case 'STATUS_FINAL':
      return 'Esse agendamento já foi encerrado e não pode ser remarcado.';
  }
  if (erro.status === 409) return 'Esse horário acabou de ser ocupado ou bloqueado. Escolha outro.';
  if (erro.status === 422 && !erro.temViolacoes) {
    return erro.message || 'Esse horário já passou ou está fora da agenda do profissional.';
  }
  if (erro.status === 404) return 'O serviço ou o profissional não está mais disponível.';
  return erro.message;
}

export default function Confirmacao() {
  const router = useRouter();
  const { servicoId, profissionalId, inicio, fim } = useLocalSearchParams<{
    servicoId?: string;
    profissionalId?: string;
    inicio?: string;
    fim?: string;
  }>();

  const { role } = useAuth();
  const { clienteId, clienteNome, agendamentoId, remarcando, eyebrow } = useFluxoDeAgendamento();
  const servicos = useServicos(false);
  const profissionais = useProfissionais(false);
  const criar = useCriarAgendamento();
  const remarcar = useRemarcar();
  const enviando = criar.isPending || remarcar.isPending;

  const [observacao, setObservacao] = useState('');

  const servico = useMemo(
    () => servicos.data?.find((s) => s.id === servicoId) ?? null,
    [servicos.data, servicoId]
  );
  const profissional = useMemo(
    () => profissionais.data?.find((p) => p.id === profissionalId) ?? null,
    [profissionais.data, profissionalId]
  );

  const carregando = servicos.isLoading || profissionais.isLoading;
  const erroCarga = servicos.error ?? profissionais.error;
  const erroEnvio = remarcando ? remarcar.error : criar.error;

  const faltaParametro = !servicoId || !profissionalId || !inicio;

  // o `fim` vem do slot; se faltar, deriva da duracao do servico, como o backend faz
  const horario = fim
    ? formatFaixaHoras(inicio, fim)
    : formatFaixaPorDuracao(inicio, servico?.duracaoMinutos);

  /** Para onde voltar depois: o cliente ve os horarios dele; a equipe, o detalhe criado. */
  function aoTerminar(id: string | undefined, inicioFinal?: string) {
    if (role === 'CLIENTE') {
      router.dismissAll?.();
      router.replace('/(cliente)/(tabs)/meus-horarios' as never);
      return;
    }
    router.dismissAll?.();
    const data = calendarDateDoInstante(inicioFinal);
    if (id && data) {
      router.push({
        pathname: '/agendamento/[id]',
        params: { id, origem: 'agenda', data },
      } as never);
    }
  }

  function confirmar() {
    if (faltaParametro) return;
    if (remarcando && agendamentoId) {
      remarcar.mutate(
        { id: agendamentoId, inicio, profissionalId },
        { onSuccess: (a) => aoTerminar(a.id, a.inicio) }
      );
      return;
    }
    criar.mutate(
      {
        profissionalId,
        servicoId,
        inicio,
        ...(clienteId ? { clienteId } : {}),
        ...(observacao.trim() ? { observacao: observacao.trim() } : {}),
      },
      { onSuccess: (a) => aoTerminar(a.id, a.inicio) }
    );
  }

  return (
    <TelaRolavel>
      <CabecalhoVoltar passo={remarcando ? 'REMARCAR' : 'PASSO 04 DE 04'} />

      <View className="pt-[34px]">
        <LabelCaps papel="tela">{eyebrow}</LabelCaps>
        <Titulo className="mt-3 text-d-29">Confirme os detalhes</Titulo>

        {carregando ? (
          <Carregando className="mt-8" />
        ) : erroCarga ? (
          <EstadoErro
            className="mt-8"
            erro={erroCarga}
            aoTentarDeNovo={() => {
              void servicos.refetch();
              void profissionais.refetch();
            }}
          />
        ) : faltaParametro ? (
          <EstadoErro
            className="mt-8"
            erro={
              new ApiError({
                status: 0,
                mensagem: 'Faltou escolher serviço, profissional ou horário.',
                kind: 'desconhecido',
              })
            }
            aoTentarDeNovo={() => router.replace('/novo-agendamento/servico' as never)}
          />
        ) : (
          <>
            <Card className="mt-8 gap-[22px] px-[26px] py-7">
              {clienteNome ? (
                <View className="gap-2">
                  <LabelCaps papel="campo">CLIENTE</LabelCaps>
                  <Text className="font-sans text-row-lg text-text-strong">{clienteNome}</Text>
                </View>
              ) : null}

              <View className="gap-2">
                <LabelCaps papel="campo">SERVIÇO</LabelCaps>
                <Titulo className="text-d-21">{servico?.nome ?? '—'}</Titulo>
              </View>

              <View className="gap-2">
                <LabelCaps papel="campo">PROFISSIONAL</LabelCaps>
                <Text className="font-sans text-row-lg text-text-strong">
                  {profissional?.nome ?? '—'}
                </Text>
              </View>

              <View className="flex-row gap-6">
                <View className="flex-1 gap-2">
                  <LabelCaps papel="campo">DATA</LabelCaps>
                  <Text className="font-sans text-row-lg text-text-strong">
                    {formatDiaSemanaDiaMes(inicio)}
                  </Text>
                </View>
                <View className="gap-2">
                  <LabelCaps papel="campo">HORÁRIO</LabelCaps>
                  <Text className="font-sans text-row-lg text-text-strong">{horario}</Text>
                </View>
              </View>

              <DivisorCard />

              <View className="flex-row items-end justify-between">
                <LabelCaps papel="campo">VALOR</LabelCaps>
                <Titulo className="text-d-24">{formatCentavos(servico?.precoCentavos)}</Titulo>
              </View>
            </Card>

            {remarcando ? null : (
              <Campo
                className="mt-6"
                rotulo="OBSERVAÇÃO"
                value={observacao}
                onChangeText={setObservacao}
                placeholder="Um recado para o profissional (opcional)"
                multiline
                numberOfLines={3}
                maxLength={OBSERVACAO_MAX}
                textAlignVertical="top"
                erro={erroEnvio?.violacaoDe('observacao')}
              />
            )}

            <Text className="mt-5 font-sans text-help-lg leading-[19.55px] text-ink/42">
              {remarcando
                ? 'O horário antigo fica livre para outra pessoa assim que você confirmar.'
                : 'Se não puder vir, cancele ou remarque pelo app para liberar o horário.'}
            </Text>

            {erroEnvio && !erroEnvio.temViolacoes ? (
              <Text className="mt-4 font-sans text-help text-red-500">
                {mensagemDoErro(erroEnvio)}
              </Text>
            ) : null}

            <Botao
              className="mt-[30px]"
              titulo={remarcando ? 'CONFIRMAR NOVO HORÁRIO' : 'CONFIRMAR AGENDAMENTO'}
              carregando={enviando}
              onPress={confirmar}
            />

            <View className="mt-[22px] items-center">
              <AcaoLinha
                titulo="ALTERAR DATA OU HORÁRIO"
                onPress={() => router.back()}
                className="items-center"
              />
            </View>
          </>
        )}
      </View>
    </TelaRolavel>
  );
}
