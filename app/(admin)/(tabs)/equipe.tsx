/**
 * [17 Gestão de equipe] — tab EQUIPE do ADMIN.
 *
 * Layout literal do frame 17: titulo Playfair 29 "Equipe" + "1 PROFISSIONAL ATIVO";
 * card de contorno ink@.14 (`padding:22px`) com foto 64x64 (image-slot), nome Playfair
 * 20, especialidade em caps 8.5/.2em ink@.5, tag ATIVO dourada; divisor; linha
 * "AGENDA · TER — SÁB, 09:00 — 19:00" com a acao GERENCIAR; card tracejado "+ ADICIONAR
 * PROFISSIONAL"; nota "O convite dá acesso ao painel do profissional, com agenda e
 * clientes próprios." (11px lh 1.7 ink@.38).
 *
 * Dados:
 *   equipe <- GET /profissionais?incluirInativos=true
 *   agenda de cada card <- GET /profissionais/{id}/disponibilidade (hora de parede,
 *                          resumida em "dias, inicio — fim")
 * Escrita: PUT /profissionais/{id} (ficha), DELETE /profissionais/{id} (soft delete,
 * IRREVERSIVEL pela API), POST /profissionais (promove um usuario que JA EXISTE).
 *
 * ADICIONAR PROFISSIONAL: a API so promove por `usuarioId`. Nao ha endpoint para listar
 * usuarios nem para convidar por e-mail, entao o formulario pede o id do usuario — e
 * honesto e funciona, mas nao e o "convite" que o design promete.
 *   TODO(API): `GET /usuarios?semFichaDeProfissional=true` (para escolher por nome) ou
 *   `POST /profissionais/convites { email }`.
 *   TODO(API): nao ha upload de foto; `fotoUrl` e so uma URL digitada.
 * GERENCIAR navega para app/profissional/[id]/disponibilidade — a API aceita ADMIN la.
 */
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import {
  useDisponibilidade,
  useProfissionais,
  useRemoverProfissional,
  useSalvarProfissional,
} from '@/api/hooks';
import type { Profissional } from '@/api/types';
import { AcaoLinha, Botao } from '@/components/ui/botao';
import { Campo } from '@/components/ui/campo';
import { Carregando, EstadoErro } from '@/components/ui/estados';
import { SlotImagem } from '@/components/ui/imagem';
import { Interruptor } from '@/components/ui/interruptor';
import { Divisor } from '@/components/ui/superficies';
import { TelaRolavel } from '@/components/ui/tela';
import { LabelCaps, Titulo } from '@/components/ui/texto';
import { cn } from '@/lib/cn';
import {
  comparaWallTime,
  formatWallTime,
  isDiaSemana,
  nomeDiaSemanaCurtoCaps,
} from '@/lib/datetime';

interface Formulario {
  id?: string;
  usuarioId: string;
  especialidade: string;
  bio: string;
  fotoUrl: string;
  ativo: boolean;
}

/** "TER — SÁB, 09:00 — 19:00" a partir da grade (hora de parede, sem conversao). */
function ResumoDaAgenda({ profissionalId }: { profissionalId: string }) {
  const grade = useDisponibilidade(profissionalId);
  const texto = useMemo(() => {
    const faixas = grade.data ?? [];
    if (faixas.length === 0) return null;
    const dias = [
      ...new Set(faixas.map((f) => f.diaSemana).filter((d): d is number => typeof d === 'number')),
    ].sort();
    const primeiro = dias[0];
    const ultimo = dias[dias.length - 1];
    const inicios = faixas.map((f) => f.horaInicio ?? '').sort(comparaWallTime);
    const fins = faixas.map((f) => f.horaFim ?? '').sort(comparaWallTime);
    const diasTxt =
      primeiro !== undefined && ultimo !== undefined && isDiaSemana(primeiro) && isDiaSemana(ultimo)
        ? primeiro === ultimo
          ? nomeDiaSemanaCurtoCaps(primeiro)
          : `${nomeDiaSemanaCurtoCaps(primeiro)} — ${nomeDiaSemanaCurtoCaps(ultimo)}`
        : '';
    return `${diasTxt}, ${formatWallTime(inicios[0])} — ${formatWallTime(fins[fins.length - 1])}`;
  }, [grade.data]);

  if (grade.isLoading)
    return (
      <LabelCaps papel="micro" className="text-text-muted">
        AGENDA · …
      </LabelCaps>
    );
  return (
    <LabelCaps papel="micro" className="flex-1 pr-3 text-text-muted" numberOfLines={1}>
      {texto ? `AGENDA · ${texto}` : 'AGENDA · SEM GRADE CADASTRADA'}
    </LabelCaps>
  );
}

export default function GestaoDeEquipe() {
  const router = useRouter();
  const equipe = useProfissionais(true);
  const salvar = useSalvarProfissional();
  const remover = useRemoverProfissional();

  const [form, setForm] = useState<Formulario | null>(null);
  const ativos = (equipe.data ?? []).filter((p) => p.ativo !== false).length;

  function abrirNovo() {
    salvar.reset();
    setForm({ usuarioId: '', especialidade: '', bio: '', fotoUrl: '', ativo: true });
  }
  function abrirEdicao(p: Profissional) {
    salvar.reset();
    setForm({
      id: p.id,
      usuarioId: p.usuarioId ?? '',
      especialidade: p.especialidade ?? '',
      bio: p.bio ?? '',
      fotoUrl: p.fotoUrl ?? '',
      ativo: p.ativo ?? true,
    });
  }

  function enviar() {
    if (!form) return;
    salvar.mutate(
      {
        id: form.id,
        dados: {
          // no PUT o usuarioId tem de ser o MESMO da ficha: trocar responde 422
          usuarioId: form.usuarioId.trim(),
          ...(form.especialidade.trim() ? { especialidade: form.especialidade.trim() } : {}),
          ...(form.bio.trim() ? { bio: form.bio.trim() } : {}),
          ...(form.fotoUrl.trim() ? { fotoUrl: form.fotoUrl.trim() } : {}),
          ativo: form.ativo,
        },
      },
      { onSuccess: () => setForm(null) }
    );
  }

  function confirmarRemocao() {
    if (!form?.id) return;
    Alert.alert(
      'Remover da equipe?',
      'A ficha some para sempre — a API não permite trazer de volta. Para afastar temporariamente, desligue "Aparece na agenda".',
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
      ? erroApi.status === 404
        ? 'Não existe usuário com esse id neste estabelecimento.'
        : erroApi.status === 409
          ? 'Esse usuário já faz parte da equipe.'
          : erroApi.message
      : null;

  return (
    <TelaRolavel
      insetInferior={false}
      refreshControl={
        <RefreshControl refreshing={equipe.isRefetching} onRefresh={() => void equipe.refetch()} />
      }
    >
      <View className="pt-10">
        <Titulo className="text-d-29">Equipe</Titulo>
        <LabelCaps papel="meta" className="mt-[14px]">
          {ativos} {ativos === 1 ? 'PROFISSIONAL ATIVO' : 'PROFISSIONAIS ATIVOS'}
        </LabelCaps>

        {equipe.isLoading ? (
          <Carregando className="mt-[30px]" />
        ) : equipe.error ? (
          <EstadoErro
            className="mt-[30px]"
            erro={equipe.error}
            aoTentarDeNovo={() => void equipe.refetch()}
          />
        ) : (
          (equipe.data ?? []).map((p, i) => (
            <View
              key={p.id}
              className={cn(
                'rounded-token border border-card-border p-[22px]',
                i === 0 ? 'mt-[30px]' : 'mt-4',
                p.ativo === false && 'opacity-60'
              )}
            >
              <View className="flex-row items-center gap-[18px]">
                <SlotImagem
                  uri={p.fotoUrl}
                  altura={64}
                  className="w-16 rounded-token"
                  acessibilidade={`Foto de ${p.nome ?? 'profissional'}`}
                />
                <View className="flex-1 gap-2">
                  <Titulo className="text-d-20" numberOfLines={1}>
                    {p.nome}
                  </Titulo>
                  <LabelCaps papel="micro" className="tracking-wide text-ink/50" numberOfLines={2}>
                    {(p.especialidade ?? '').toUpperCase() || 'SEM ESPECIALIDADE'}
                  </LabelCaps>
                </View>
                <LabelCaps
                  papel="micro"
                  className={cn('self-start', p.ativo === false ? 'text-text-dim' : 'text-gold')}
                >
                  {p.ativo === false ? 'INATIVO' : 'ATIVO'}
                </LabelCaps>
              </View>

              <Divisor className="mb-4 mt-5" />

              <View className="flex-row items-center justify-between">
                {p.id ? <ResumoDaAgenda profissionalId={p.id} /> : <View className="flex-1" />}
                <View className="flex-row gap-4">
                  <AcaoLinha titulo="EDITAR" onPress={() => abrirEdicao(p)} />
                  <AcaoLinha
                    titulo="GERENCIAR"
                    onPress={() => router.push(`/profissional/${p.id}/disponibilidade` as never)}
                  />
                </View>
              </View>
            </View>
          ))
        )}

        <Pressable
          onPress={abrirNovo}
          accessibilityRole="button"
          className="mt-4 items-center gap-[10px] border border-dashed border-ink/20 p-[26px]"
          style={({ pressed }) => (pressed ? { opacity: 0.7 } : null)}
        >
          <Text className="font-sans text-icon leading-4 text-ink/55">+</Text>
          <LabelCaps papel="meta" className="text-caps-sm tracking-button text-ink/60">
            ADICIONAR PROFISSIONAL
          </LabelCaps>
        </Pressable>

        <Text className="mt-5 text-center font-sans text-help leading-[18.7px] text-ink/38">
          O convite dá acesso ao painel do profissional,{'\n'}com agenda e clientes próprios.
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
                <LabelCaps papel="secao">
                  {form.id ? 'FICHA DO PROFISSIONAL' : 'ADICIONAR PROFISSIONAL'}
                </LabelCaps>
                <Titulo className="mt-3 text-d-23">
                  {form.id ? 'Editar ficha' : 'Promover um usuário'}
                </Titulo>

                {!form.id ? (
                  <Campo
                    className="mt-6"
                    rotulo="ID DO USUÁRIO"
                    value={form.usuarioId}
                    onChangeText={(v) => setForm({ ...form, usuarioId: v })}
                    placeholder="3f4a1c8e-6b2d-4f11-9c7a-0d5e8b2a1f34"
                    autoCapitalize="none"
                    autoCorrect={false}
                    ajuda="A pessoa precisa já ter conta neste estabelecimento. A API só promove por id; não há convite por e-mail."
                    erro={salvar.error?.violacaoDe('usuarioId')}
                  />
                ) : null}
                <Campo
                  className="mt-[22px]"
                  rotulo="ESPECIALIDADE"
                  value={form.especialidade}
                  onChangeText={(v) => setForm({ ...form, especialidade: v })}
                  placeholder="Visagismo e consultoria de imagem"
                  maxLength={120}
                  erro={salvar.error?.violacaoDe('especialidade')}
                />
                <Campo
                  className="mt-[22px]"
                  rotulo="BIO"
                  value={form.bio}
                  onChangeText={(v) => setForm({ ...form, bio: v })}
                  placeholder="Dez anos de estúdio, especialista em colorimetria."
                  maxLength={4000}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  erro={salvar.error?.violacaoDe('bio')}
                />
                <Campo
                  className="mt-[22px]"
                  rotulo="URL DA FOTO"
                  value={form.fotoUrl}
                  onChangeText={(v) => setForm({ ...form, fotoUrl: v })}
                  placeholder="https://cdn.stewer.dev/fotos/gabriel.webp"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  maxLength={500}
                  ajuda="Sem upload na API: cole o endereço de uma imagem já hospedada."
                  erro={salvar.error?.violacaoDe('fotoUrl')}
                />
                <View className="mt-[22px] flex-row items-center justify-between border-b border-divider py-[19px]">
                  <Text className="font-sans text-body-lg text-text-body">Aparece na agenda</Text>
                  <Interruptor
                    rotulo="Aparece na agenda"
                    ligado={form.ativo}
                    aoMudar={(v) => setForm({ ...form, ativo: v })}
                  />
                </View>

                {mensagemErro ? (
                  <Text className="mt-4 font-sans text-help text-red-500">{mensagemErro}</Text>
                ) : null}

                <Botao
                  className="mt-8"
                  titulo={form.id ? 'SALVAR' : 'ADICIONAR À EQUIPE'}
                  disabled={!form.id && !form.usuarioId.trim()}
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
                      titulo="REMOVER DA EQUIPE"
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
