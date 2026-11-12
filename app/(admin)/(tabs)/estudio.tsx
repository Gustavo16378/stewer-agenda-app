/**
 * Estudio (so ADMIN): o que o cliente ve no app sobre o lugar e o Stewer.
 *
 * Redesenho para ficar simples de usar sozinho: tres partes (Fotos, Endereco, Contatos),
 * cada uma mostrando ao lado onde aquilo aparece para o cliente. Os campos ja vem
 * preenchidos com o que o cliente ve hoje (nada de campo vazio com exemplo cinza), e o
 * botao de salvar fica preso embaixo, so quando ha alteracao.
 *
 * O site stewergabriel.com tem o painel dele, separado: daqui so um link para la.
 */
import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useEstudioSalvo, useFotosPublicas, useSalvarEstudio } from '@/api/hooks';
import type { Estudio } from '@/api/types';
import { BotaoAtelie, TituloSecao } from '@/components/atelie/base';
import { MapaDoAtelie } from '@/components/atelie/MapaDoAtelie';
import { GradeDeFotos } from '@/components/estudio/GradeDeFotos';
import { CabecalhoVoltar } from '@/components/ui/cabecalho';
import { Campo } from '@/components/ui/campo';
import { Carregando, EstadoErro } from '@/components/ui/estados';
import { TelaRolavel } from '@/components/ui/tela';
import { FOTOS, LOCAL, SITE_DO_STEWER } from '@/content/atelie';
import { montarEstudio } from '@/content/estudio';
import { cn } from '@/lib/cn';
import { confirmar } from '@/lib/confirmar';
import { lerCoordenadas, linkTemCoordenadas } from '@/lib/coordenadas';
import { escolherFoto, SemPermissao } from '@/lib/foto';
import { useLayoutLargo } from '@/lib/responsivo';
import { mascaraTelefone } from '@/lib/telefone';

const PAINEL_DO_SITE = `${SITE_DO_STEWER}/admin`;
const FOTOS_DO_TRABALHO = 24;
type Parte = 'fotos' | 'endereco' | 'contatos';
const PARTES: { chave: Parte; rotulo: string }[] = [
  { chave: 'fotos', rotulo: 'Fotos' },
  { chave: 'endereco', rotulo: 'Endereço' },
  { chave: 'contatos', rotulo: 'Contatos' },
];

/** "Aparece em": o lugar do app onde aquilo vai parar, em uma linha. */
function OndeAparece({ children }: { children: ReactNode }) {
  return (
    <View className="mt-2 flex-row items-start gap-2">
      <View className="mt-[7px] h-[6px] w-[6px] rotate-45 bg-latao" />
      <Text className="flex-1 font-sans text-ui-sm text-texto-2">{children}</Text>
    </View>
  );
}

function Retrato() {
  const salvo = useEstudioSalvo();
  const { adicionar, remover } = useFotosPublicas();
  const [erro, setErro] = useState<string | null>(null);
  const [preparando, setPreparando] = useState(false);
  const estudio = montarEstudio(salvo.data);
  const atual = estudio.retratoEnviado ?? FOTOS.retrato;

  async function trocar() {
    setErro(null);
    try {
      setPreparando(true);
      const base64 = await escolherFoto('galeria', { lado: 1400, qualidade: 0.8 });
      if (!base64) return;
      adicionar.mutate(
        { tipo: 'RETRATO', tipoConteudo: 'image/jpeg', conteudoBase64: base64 },
        { onError: (e) => setErro(e.message) }
      );
    } catch (e) {
      setErro(
        e instanceof SemPermissao ? e.message : 'Não deu para preparar essa foto. Tente outra.'
      );
    } finally {
      setPreparando(false);
    }
  }

  return (
    <View className="mt-4 flex-row items-center gap-5">
      <View className="h-[150px] w-[120px] overflow-hidden rounded-[3px] bg-superficie">
        <Image
          source={atual.fonte}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          contentPosition="top"
          transition={200}
          accessibilityLabel="Retrato atual do Stewer"
        />
      </View>
      <View className="flex-1 gap-2">
        <Text className="font-sans text-ui-sm text-texto-3">
          {estudio.retratoEnviado
            ? 'Este é o retrato que você enviou.'
            : 'Hoje é o retrato que veio no app.'}
        </Text>
        <BotaoAtelie
          variante="contorno"
          titulo="Trocar retrato"
          carregando={preparando || adicionar.isPending}
          onPress={() => void trocar()}
        />
        {estudio.retratoEnviado && salvo.data?.retrato?.id ? (
          <BotaoAtelie
            variante="texto"
            titulo="Voltar ao retrato do app"
            onPress={() =>
              confirmar('Voltar ao retrato do app?', 'O retrato que você enviou sai do app.', {
                textoConfirmar: 'Voltar',
                aoConfirmar: () => remover.mutate({ id: salvo.data!.retrato!.id! }),
              })
            }
          />
        ) : null}
        {erro ? <Text className="font-sans text-ui-sm text-cadeira">{erro}</Text> : null}
      </View>
    </View>
  );
}

/** Uma miniatura de tela do app, para mostrar onde a foto vai parar. */
function MiniTela({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <View className="items-center gap-2">
      <View className="h-[132px] w-[74px] overflow-hidden rounded-[8px] border border-borda bg-fundo">
        {children}
      </View>
      <Text className="font-sans text-ui-xs text-texto-3">{titulo}</Text>
    </View>
  );
}

function OndeAsFotosAparecem() {
  const estudio = montarEstudio(useEstudioSalvo().data);
  const [primeira] = estudio.fotos;
  return (
    <View className="mt-5 flex-row gap-4">
      <MiniTela titulo="Entrar">
        {primeira ? (
          <Image source={primeira.fonte} style={{ width: '100%', height: 70 }} contentFit="cover" />
        ) : null}
        <View className="mx-2 mt-2 h-[5px] w-8 bg-texto/60" />
        <View className="mx-2 mt-2 h-[8px] rounded-[2px] bg-superficie" />
        <View className="mx-2 mt-1 h-[8px] rounded-[2px] bg-superficie" />
        <View className="mx-2 mt-2 h-[8px] rounded-[2px] bg-latao" />
      </MiniTela>
      <MiniTela titulo="Agendar">
        {primeira ? (
          <Image source={primeira.fonte} style={{ width: '100%', height: 60 }} contentFit="cover" />
        ) : null}
        <View className="mx-2 mt-2 h-[5px] w-10 bg-texto/60" />
        <View className="mx-2 mt-2 h-[6px] w-12 bg-superficie" />
        <View className="mx-2 mt-1 h-[6px] w-10 bg-superficie" />
      </MiniTela>
      <MiniTela titulo="Início">
        <View className="mx-2 mt-3 h-[5px] w-10 bg-texto/60" />
        <View className="mx-2 mt-2 flex-row gap-1">
          {estudio.fotosEnviadas
            ? estudio.fotos
                .slice(0, 2)
                .map((f, i) => (
                  <Image
                    key={i}
                    source={f.fonte}
                    style={{ width: 26, height: 34 }}
                    contentFit="cover"
                  />
                ))
            : null}
        </View>
      </MiniTela>
    </View>
  );
}

/** O que o formulario guarda; o que vai para a API sai daqui. */
interface Dados {
  nomeLocal: string;
  descricao: string;
  endereco: string;
  regiao: string;
  horario: string;
  linkMapa: string;
  coordenadas: string;
  whatsapp: string;
  instagram: string;
  site: string;
  frase: string;
}

/** O que o cliente ve hoje, campo a campo: o salvo ou, sem nada salvo, o que vem no app. */
function dadosAtuais(salvo: Estudio | undefined): Dados {
  const e = montarEstudio(salvo);
  const numeroPadrao = /wa\.me\/55(\d+)/.exec(LOCAL.whatsapp)?.[1] ?? '';
  return {
    nomeLocal: e.nome,
    descricao: e.descricao,
    endereco: e.endereco,
    regiao: e.regiao,
    horario: e.horario,
    linkMapa: salvo?.linkMapa ?? '',
    coordenadas: `${e.latitude}, ${e.longitude}`,
    whatsapp: mascaraTelefone(salvo?.whatsapp ?? numeroPadrao),
    instagram: `@${e.instagramUrl.replace(/^.*instagram\.com\//, '')}`,
    site: e.site,
    frase: e.frase,
  };
}

export default function TelaEstudio() {
  const largo = useLayoutLargo();
  const insets = useSafeAreaInsets();
  const salvo = useEstudioSalvo();
  const salvar = useSalvarEstudio();
  const [parte, setParte] = useState<Parte>('fotos');
  const [dados, setDados] = useState<Dados | null>(null);
  const [inicial, setInicial] = useState<Dados | null>(null);
  const [verPonto, setVerPonto] = useState(false);
  const [erroCoordenadas, setErroCoordenadas] = useState<string | null>(null);
  const [salvoAgora, setSalvoAgora] = useState(false);

  // preenche uma vez, quando chega o que esta salvo
  const preenchido = useRef(false);
  useEffect(() => {
    if (preenchido.current || salvo.isLoading) return;
    preenchido.current = true;
    const atuais = dadosAtuais(salvo.data);
    setDados(atuais);
    setInicial(atuais);
  }, [salvo.isLoading, salvo.data]);

  const mudou = useMemo(
    () => !!dados && !!inicial && JSON.stringify(dados) !== JSON.stringify(inicial),
    [dados, inicial]
  );
  const campo = (k: keyof Dados) => ({
    value: dados?.[k] ?? '',
    onChangeText: (t: string) => {
      setSalvoAgora(false);
      setDados((d) => (d ? { ...d, [k]: t } : d));
    },
  });

  function aoSalvar() {
    if (!dados) return;
    setErroCoordenadas(null);
    const coords = lerCoordenadas(dados.coordenadas);
    if (dados.coordenadas.trim() && !coords) {
      setParte('endereco');
      setVerPonto(true);
      setErroCoordenadas('Cole os dois números juntos, como -10.195029, -48.328703.');
      return;
    }
    // link novo do Google Maps com o ponto dentro (e pino sem mexer): a API tira o ponto
    // do link. Em qualquer outro caso vai o ponto do campo.
    const pontoDoLink =
      dados.linkMapa !== inicial?.linkMapa &&
      dados.coordenadas === inicial?.coordenadas &&
      linkTemCoordenadas(dados.linkMapa);
    salvar.mutate(
      {
        nomeLocal: dados.nomeLocal,
        descricao: dados.descricao,
        endereco: dados.endereco,
        regiao: dados.regiao,
        horario: dados.horario,
        linkMapa: dados.linkMapa,
        ...(coords && !pontoDoLink ? coords : {}),
        whatsapp: dados.whatsapp,
        instagram: dados.instagram,
        site: dados.site,
        frase: dados.frase,
      },
      {
        onSuccess: (e) => {
          const atuais = dadosAtuais(e);
          setDados(atuais);
          setInicial(atuais);
          setSalvoAgora(true);
        },
      }
    );
  }

  const fotos = (salvo.data?.fotos ?? []).filter((f) => f.id) as { id: string; legenda?: string }[];

  return (
    <View className="flex-1 bg-canvas">
      <TelaRolavel contentContainerStyle={{ paddingBottom: mudou ? 140 : 48 }}>
        {largo ? null : <CabecalhoVoltar />}
        <Text
          accessibilityRole="header"
          className={cn('font-display text-ds-38 text-texto', largo ? 'mt-10' : 'mt-8')}
        >
          Estúdio
        </Text>
        <Text className="mt-2 font-sans text-ui text-texto-2">
          O que o cliente vê no app. O que você mudar aqui aparece para ele na hora.
        </Text>

        <View className="mt-7 flex-row gap-2" accessibilityRole="radiogroup">
          {PARTES.map((p) => {
            const on = parte === p.chave;
            return (
              <Pressable
                key={p.chave}
                onPress={() => setParte(p.chave)}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                className={cn(
                  'flex-1 items-center rounded-full border py-3',
                  on ? 'border-latao bg-latao' : 'border-borda'
                )}
              >
                <Text
                  className={cn(
                    'font-sans-semibold text-ui-sm',
                    on ? 'text-fundo' : 'text-texto-2'
                  )}
                >
                  {p.rotulo}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {salvo.isLoading || !dados ? (
          <Carregando className="mt-10" />
        ) : salvo.error ? (
          <EstadoErro
            className="mt-10"
            erro={salvo.error}
            aoTentarDeNovo={() => void salvo.refetch()}
          />
        ) : parte === 'fotos' ? (
          <View>
            <TituloSecao className="mt-10">Seu retrato</TituloSecao>
            <OndeAparece>
              No início do app e quando o cliente escolhe com quem vai cortar.
            </OndeAparece>
            <Retrato />

            <TituloSecao className="mt-12">Fotos do trabalho</TituloSecao>
            <OndeAparece>
              A primeira aparece na tela de entrar e no topo de Agendar. Todas aparecem no início do
              app, em O trabalho do Stewer.
            </OndeAparece>
            <OndeAsFotosAparecem />
            <GradeDeFotos
              fotos={fotos}
              maximo={FOTOS_DO_TRABALHO}
              ordenavel
              colunas={largo ? 4 : 3}
              rotuloAdicionar="Adicionar foto do trabalho"
              vazio="Ainda não tem foto sua: o app mostra as que vieram com ele. Adicione as suas para trocar."
            />
          </View>
        ) : parte === 'endereco' ? (
          <View>
            <TituloSecao className="mt-10">Onde você atende</TituloSecao>
            <OndeAparece>
              No início do app, em Onde atende, e no comprovante do horário.
            </OndeAparece>
            <Campo className="mt-6" rotulo="Nome do lugar" maxLength={80} {...campo('nomeLocal')} />
            <Campo
              className="mt-5"
              rotulo="O que é o lugar"
              maxLength={120}
              {...campo('descricao')}
            />
            <Campo className="mt-5" rotulo="Endereço" maxLength={240} {...campo('endereco')} />
            <Campo
              className="mt-5"
              rotulo="Bairro ou região"
              maxLength={80}
              ajuda="Aparece em cima do mapa."
              {...campo('regiao')}
            />
            <Campo
              className="mt-5"
              rotulo="Horário de atendimento"
              maxLength={120}
              ajuda="Só o texto que o cliente lê. Os horários que dá para marcar ficam em Agenda."
              {...campo('horario')}
            />
            <Campo
              className="mt-5"
              rotulo="Link do Google Maps"
              placeholder="Cole aqui o link do lugar"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              maxLength={500}
              ajuda='No Google Maps, abra o lugar, toque em Compartilhar e copie o link. É para onde vai o botão "Como chegar".'
              {...campo('linkMapa')}
            />
            <Pressable
              onPress={() => setVerPonto((v) => !v)}
              accessibilityRole="button"
              accessibilityState={{ expanded: verPonto }}
              className="mt-5 self-start py-2"
            >
              <Text className="font-sans-medium text-ui-sm text-latao">
                {verPonto ? 'Esconder o ponto do mapa' : 'O pino do mapa está no lugar errado?'}
              </Text>
            </Pressable>
            {verPonto ? (
              <Campo
                className="mt-2"
                rotulo="Coordenadas do pino"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={60}
                erro={erroCoordenadas ?? undefined}
                ajuda="No Google Maps, segure o dedo em cima do lugar exato: aparecem dois números. Copie e cole aqui."
                {...campo('coordenadas')}
              />
            ) : null}

            <TituloSecao className="mt-12">Como o cliente vê</TituloSecao>
            <View className="mt-6">
              <MapaDoAtelie />
            </View>
            {mudou ? (
              <Text className="mt-3 font-sans text-ui-sm text-texto-3">
                O mapa acima mostra o que está salvo. Salve para ver as mudanças.
              </Text>
            ) : null}
          </View>
        ) : (
          <View>
            <TituloSecao className="mt-10">Como falar com você</TituloSecao>
            <OndeAparece>Nos botões de WhatsApp e Instagram do início do app.</OndeAparece>
            <Campo
              className="mt-6"
              rotulo="WhatsApp"
              keyboardType="phone-pad"
              maxLength={20}
              value={dados.whatsapp}
              onChangeText={(t) => campo('whatsapp').onChangeText(mascaraTelefone(t))}
            />
            <Campo
              className="mt-5"
              rotulo="Instagram"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={60}
              {...campo('instagram')}
            />
            <Campo
              className="mt-5"
              rotulo="Site"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              maxLength={200}
              {...campo('site')}
            />

            <TituloSecao className="mt-12">Frase da tela de entrar</TituloSecao>
            <OndeAparece>Ao lado da foto, na tela de entrar do computador.</OndeAparece>
            <Campo
              className="mt-6"
              rotulo="Frase do Stewer"
              multiline
              numberOfLines={2}
              textAlignVertical="top"
              maxLength={240}
              {...campo('frase')}
            />

            <TituloSecao className="mt-12">O site</TituloSecao>
            <OndeAparece>
              O site tem o painel dele, separado. Portfólio, cursos e textos do site se mudam lá.
            </OndeAparece>
            <View className={cn('mt-5 gap-3', largo && 'flex-row')}>
              <BotaoAtelie
                className={largo ? 'flex-1' : undefined}
                variante="contorno"
                titulo="Abrir o site"
                onPress={() => void Linking.openURL(SITE_DO_STEWER)}
              />
              <BotaoAtelie
                className={largo ? 'flex-1' : undefined}
                variante="contorno"
                titulo="Abrir o painel do site"
                onPress={() => void Linking.openURL(PAINEL_DO_SITE)}
              />
            </View>
          </View>
        )}

        {salvoAgora && !mudou ? (
          <Text className="mt-6 font-sans text-ui-sm text-latao" accessibilityLiveRegion="polite">
            Salvo. O app do cliente já mostra assim.
          </Text>
        ) : null}
      </TelaRolavel>

      {/* presa embaixo, so quando ha o que salvar */}
      {mudou ? (
        <View
          className="absolute bottom-0 left-0 right-0 border-t border-borda bg-fundo px-6 pt-4"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <View
            className="flex-row items-center gap-3"
            style={{ width: '100%', maxWidth: 720, alignSelf: 'center' }}
          >
            <Text className="flex-1 font-sans text-ui-sm text-texto-2">Você mudou o estúdio.</Text>
            <BotaoAtelie
              variante="texto"
              titulo="Desfazer"
              onPress={() => {
                setDados(inicial);
                setErroCoordenadas(null);
              }}
            />
            <BotaoAtelie titulo="Salvar estúdio" carregando={salvar.isPending} onPress={aoSalvar} />
          </View>
          {salvar.error ? (
            <Text className="mt-2 font-sans text-ui-sm text-cadeira">{salvar.error.message}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
