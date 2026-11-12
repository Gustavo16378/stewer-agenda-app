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
 * Anotacoes: "EDITAR" corrige a ultima anotacao quando ela e de quem esta logado (ou se
 * for o admin); quando e de outro profissional, salva uma nova, assinada por quem
 * escreveu. "APAGAR" aparece so para quem pode apagar.
 * NOVO AGENDAMENTO PARA ESTE CLIENTE abre o fluxo de agendamento com clienteId: a API
 * aceita a equipe marcando em nome do cliente.
 *
 * Profissional e admin com ficha anotam (admin sem ficha leva 422 com o motivo). Um 404 aqui e estado normal — cliente promovido a profissional some
 * da base de clientes mesmo com atendimentos antigos.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, Modal, ScrollView, Text, View } from 'react-native';

import {
  useAnotacoes,
  useApagarAnotacao,
  useCliente,
  useCriarAnotacao,
  useEditarAnotacao,
  useAuditoria,
  useMeuProfissional,
} from '@/api/hooks';
import { ROTULO_STATUS } from '@/api/types';
import { useAuth } from '@/auth/auth-context';
import { GuardaDePapel } from '@/auth/guarda';
import { BotaoAtelie, TituloSecao } from '@/components/atelie/base';
import { FotosDoCliente } from '@/components/ficha/Fotos';
import { LinhaDoTempo } from '@/components/ficha/LinhaDoTempo';
import { NumerosDoCliente } from '@/components/ficha/Numeros';
import { AcaoLinha, Botao } from '@/components/ui/botao';
import { CabecalhoVoltar } from '@/components/ui/cabecalho';
import { Campo } from '@/components/ui/campo';
import { Carregando, EstadoErro, EstadoVazio } from '@/components/ui/estados';
import { AvatarPessoa } from '@/components/ui/imagem';
import { TelaRolavel } from '@/components/ui/tela';
import { LabelCaps, Titulo } from '@/components/ui/texto';
import { aniversario, linkWhatsApp, MENSAGENS } from '@/lib/carteira';
import { cn } from '@/lib/cn';
import { confirmar } from '@/lib/confirmar';
import { formatDiaMesCurtoCaps, formatMesAnoLongoCaps, parseInstant } from '@/lib/datetime';
import { formatCentavos } from '@/lib/money';
import { PAINEL_CENTRALIZADO } from '@/lib/responsivo';
import { formatTelefone } from '@/lib/telefone';

const ANOTACAO_MAX = 8000;

function FichaDoCliente() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { role } = useAuth();
  const cliente = useCliente(id ?? '');
  const anotacoes = useAnotacoes(id ?? '');
  const criarNova = useCriarAnotacao(id ?? '');
  const editar = useEditarAnotacao(id ?? '');
  const apagar = useApagarAnotacao(id ?? '');
  const { profissional: minhaFicha } = useMeuProfissional();

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
  const historico = useMemo(
    () =>
      (cliente.data?.agendamentos ?? [])
        .filter((a) => a.status !== 'AGENDADO')
        .sort(
          (a, b) =>
            (parseInstant(b.inicio)?.getTime() ?? 0) - (parseInstant(a.inicio)?.getTime() ?? 0)
        ),
    [cliente.data]
  );
  const linhaDoTempo = useAuditoria({ clienteId: id ?? '' });
  const eventos = linhaDoTempo.data?.pages.flat() ?? [];
  const ficha = cliente.data?.ficha;
  const temPerfil = !!(
    ficha?.formatoRosto ||
    ficha?.cabelo ||
    ficha?.barba ||
    ficha?.estilo ||
    ficha?.manter ||
    ficha?.evitar
  );
  const niver = aniversario(ficha?.dataNascimento);
  const primeiro = (cliente.data?.nome ?? '').split(' ')[0] ?? '';
  const whatsapp = linkWhatsApp(cliente.data?.telefone, MENSAGENS.contato(primeiro));
  const ultimaAnotacao = anotacoes.data?.[0];
  // Admin com ficha tambem anota; sem ficha a API recusa e a tela mostra o motivo.
  const podeAnotar = role === 'PROFISSIONAL' || role === 'ADMIN';

  // Quem escreveu a ultima anotacao (ou o admin) corrige ela mesma; os outros
  // acrescentam a deles por cima, assinada.
  const ehMinha =
    !!ultimaAnotacao && (role === 'ADMIN' || ultimaAnotacao.profissionalId === minhaFicha?.id);
  const criar = ehMinha ? editar : criarNova;

  function abrirEditor() {
    setTexto(ultimaAnotacao?.texto ?? '');
    criarNova.reset();
    editar.reset();
    setEditor(true);
  }

  function salvarAnotacao() {
    const t = texto.trim().slice(0, ANOTACAO_MAX);
    if (!t) return;
    if (ehMinha && ultimaAnotacao?.id) {
      editar.mutate(
        { anotacaoId: ultimaAnotacao.id, texto: t },
        { onSuccess: () => setEditor(false) }
      );
    } else {
      criarNova.mutate({ texto: t }, { onSuccess: () => setEditor(false) });
    }
  }

  function apagarAnotacao() {
    const alvo = ultimaAnotacao?.id;
    if (!alvo) return;
    confirmar('Apagar esta anotação?', 'Não dá para desfazer.', {
      textoConfirmar: 'Apagar',
      destrutivo: true,
      aoConfirmar: () => apagar.mutate(alvo),
    });
  }

  return (
    <TelaRolavel>
      <CabecalhoVoltar passo="Clientes" />

      {cliente.isLoading ? (
        <Carregando className="mt-8" />
      ) : cliente.error?.status === 404 ? (
        <EstadoVazio
          className="mt-8"
          eyebrow="Ficha indisponível"
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
            <AvatarPessoa
              usuarioId={cliente.data.id}
              fotoVersao={cliente.data.fotoVersao}
              nome={cliente.data.nome}
              tamanho={64}
            />
            <View className="flex-1 gap-2">
              <Titulo className="text-ds-30" numberOfLines={2}>
                {cliente.data.nome}
              </Titulo>
              <Text className="font-sans text-ui-sm text-texto-3" numberOfLines={1}>
                Cliente desde {formatMesAnoLongoCaps(cliente.data.createdAt).toLowerCase()},{' '}
                {visitas.length} {visitas.length === 1 ? 'visita' : 'visitas'}
              </Text>
            </View>
          </View>

          {/* contato: um toque e abre a conversa */}
          <View className="mt-6 flex-row flex-wrap gap-2">
            {whatsapp ? (
              <BotaoAtelie
                variante="contorno"
                titulo={`WhatsApp ${formatTelefone(cliente.data.telefone)}`}
                onPress={() => void Linking.openURL(whatsapp)}
              />
            ) : (
              <Text className="font-sans text-ui-sm text-texto-3">Sem telefone cadastrado</Text>
            )}
          </View>
          <Text className="mt-2 font-sans text-ui-sm text-texto-3">{cliente.data.email}</Text>

          {/* etiquetas, origem e aniversario */}
          <View className="mt-5 flex-row flex-wrap gap-2">
            {niver ? (
              <Selo destaque={niver.ehEsteMes}>
                {niver.ehHoje ? 'Faz aniversário hoje' : `Aniversário ${niver.dia}`}
              </Selo>
            ) : null}
            {ficha?.origem ? <Selo>{`Veio por ${ficha.origem}`}</Selo> : null}
            {(ficha?.etiquetas ?? []).map((e) => (
              <Selo key={e}>{e}</Selo>
            ))}
          </View>

          <TituloSecao className="mt-10">Números</TituloSecao>
          <NumerosDoCliente m={cliente.data.metricas} />

          <TituloSecao
            className="mt-12"
            acao={
              <BotaoAtelie
                variante="texto"
                titulo={temPerfil ? 'Editar ficha' : 'Preencher ficha'}
                onPress={() => router.push({ pathname: '/cliente/ficha', params: { id } } as never)}
              />
            }
          >
            Visagismo
          </TituloSecao>
          {temPerfil ? (
            <View className="mt-4 gap-3">
              <LinhaPerfil rotulo="Rosto" valor={ficha?.formatoRosto} />
              <LinhaPerfil rotulo="Cabelo" valor={ficha?.cabelo} />
              <LinhaPerfil rotulo="Barba" valor={ficha?.barba} />
              <LinhaPerfil rotulo="Estilo" valor={ficha?.estilo} />
              <LinhaPerfil rotulo="Manter" valor={ficha?.manter} />
              <LinhaPerfil rotulo="Evitar" valor={ficha?.evitar} alerta />
            </View>
          ) : (
            <Text className="mt-4 font-sans text-ui text-texto-3">
              Formato do rosto, cabelo, barba e o que manter ou evitar. Preencha na primeira
              consultoria e todo atendimento começa daqui.
            </Text>
          )}

          <View className="mt-6 rounded-[3px] border-l-2 border-latao bg-superficie p-6">
            <View className="flex-row items-center justify-between">
              <LabelCaps papel="campo">Anotações de visagismo</LabelCaps>
              {podeAnotar ? <AcaoLinha titulo="Editar" destaque onPress={abrirEditor} /> : null}
            </View>
            {anotacoes.isLoading ? (
              <Carregando className="py-4" />
            ) : anotacoes.error ? (
              <Text className="mt-3 font-sans text-help text-red-500">
                {anotacoes.error.message}
              </Text>
            ) : (
              <>
                <Text className="mt-3 font-sans text-ui-lg text-texto">
                  {ultimaAnotacao?.texto ?? 'Nenhuma anotação ainda.'}
                </Text>
                {ultimaAnotacao ? (
                  <Text className="mt-4 font-sans text-ui-sm text-texto-3">
                    Atualizada em {formatDiaMesCurtoCaps(ultimaAnotacao.createdAt).toLowerCase()}
                    {ultimaAnotacao.profissionalNome
                      ? ` por ${ultimaAnotacao.profissionalNome}`
                      : ''}
                  </Text>
                ) : null}
                {(anotacoes.data?.length ?? 0) > 1 ? (
                  <Text className="mt-2 font-sans text-help text-ink/38">
                    {anotacoes.data!.length - 1}{' '}
                    {anotacoes.data!.length - 1 === 1
                      ? 'anotação anterior guardada.'
                      : 'anotações anteriores guardadas.'}
                  </Text>
                ) : null}
                {ehMinha ? (
                  <AcaoLinha className="mt-3 self-start" titulo="Apagar" onPress={apagarAnotacao} />
                ) : null}
              </>
            )}
          </View>

          <TituloSecao className="mt-12">Antes e depois</TituloSecao>
          <FotosDoCliente clienteId={id ?? ''} />

          <TituloSecao className="mt-12">Histórico</TituloSecao>
          {historico.length === 0 ? (
            <Text className="mt-4 font-sans text-ui text-texto-3">Nenhum atendimento ainda.</Text>
          ) : (
            <View className="mt-2">
              {historico.map((a) => (
                <View
                  key={a.id}
                  className="flex-row items-center gap-4 border-b border-borda/70 py-4"
                >
                  <Text className="w-16 font-sans-medium text-ui-sm text-texto-3">
                    {formatDiaMesCurtoCaps(a.inicio).toLowerCase()}
                  </Text>
                  <Text
                    className={cn(
                      'flex-1 font-sans text-ui',
                      a.status === 'CONCLUIDO' ? 'text-texto' : 'text-texto-3 line-through'
                    )}
                    numberOfLines={1}
                  >
                    {a.servicoNome}
                  </Text>
                  <Text className="font-sans text-ui-sm text-texto-2">
                    {a.status === 'CONCLUIDO'
                      ? formatCentavos(a.precoCentavos)
                      : a.status
                        ? ROTULO_STATUS[a.status]
                        : ''}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <TituloSecao className="mt-12">Linha do tempo</TituloSecao>
          {linhaDoTempo.isLoading ? (
            <Carregando className="py-6" />
          ) : eventos.length === 0 ? (
            <Text className="mt-4 font-sans text-ui text-texto-3">Nada registrado ainda.</Text>
          ) : (
            <View className="mt-5">
              <LinhaDoTempo eventos={eventos} />
              {linhaDoTempo.hasNextPage ? (
                <BotaoAtelie
                  variante="texto"
                  titulo="Ver mais"
                  carregando={linhaDoTempo.isFetchingNextPage}
                  onPress={() => void linhaDoTempo.fetchNextPage()}
                />
              ) : null}
            </View>
          )}

          <BotaoAtelie
            className="mt-10"
            titulo="Marcar horário para este cliente"
            onPress={() =>
              router.push({
                pathname: '/novo-agendamento/servico',
                params: { clienteId: id, clienteNome: cliente.data?.nome ?? '' },
              } as never)
            }
          />
        </View>
      )}

      <Modal
        visible={editor}
        transparent
        animationType="fade"
        onRequestClose={() => setEditor(false)}
      >
        <View className="flex-1 justify-end bg-fundo">
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="px-screen-x pb-10 pt-8"
            contentContainerStyle={PAINEL_CENTRALIZADO}
          >
            <LabelCaps papel="secao">Anotações de visagismo</LabelCaps>
            <Titulo className="mt-3 text-d-23">{cliente.data?.nome ?? ''}</Titulo>
            <Campo
              className="mt-6"
              rotulo="Texto"
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
              titulo="Salvar anotação"
              disabled={!texto.trim()}
              carregando={criar.isPending}
              onPress={salvarAnotacao}
            />
            <Botao
              className="mt-3"
              variante="fantasma"
              titulo="Voltar"
              onPress={() => setEditor(false)}
            />
          </ScrollView>
        </View>
      </Modal>
    </TelaRolavel>
  );
}

function Selo({ children, destaque }: { children: string; destaque?: boolean }) {
  return (
    <View className={cn('rounded-full px-3 py-[6px]', destaque ? 'bg-latao' : 'bg-superficie')}>
      <Text className={cn('font-sans-medium text-ui-sm', destaque ? 'text-fundo' : 'text-texto-2')}>
        {children}
      </Text>
    </View>
  );
}

function LinhaPerfil({
  rotulo,
  valor,
  alerta,
}: {
  rotulo: string;
  valor?: string | null;
  alerta?: boolean;
}) {
  if (!valor) return null;
  return (
    <View className="flex-row gap-4">
      <Text
        className={cn('w-16 font-sans-medium text-ui-sm', alerta ? 'text-cadeira' : 'text-latao')}
      >
        {rotulo}
      </Text>
      <Text className="flex-1 font-sans text-ui text-texto">{valor}</Text>
    </View>
  );
}

/** Direto pelo link ou depois de recarregar: so mostra a tela com a sessao ja restaurada. */
export default function RotaFichaDoCliente() {
  return (
    <GuardaDePapel permitidos={['PROFISSIONAL', 'ADMIN']}>
      <FichaDoCliente />
    </GuardaDePapel>
  );
}
