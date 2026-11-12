/**
 * Estudio (so ADMIN): o que o cliente ve no app sobre o lugar e o Stewer. Retrato, fotos
 * do trabalho, endereco com mapa, horario e contatos. Campo vazio volta ao que ja vem no
 * app, entao nada fica em branco para o cliente.
 *
 * O site stewergabriel.com tem o painel dele, separado: daqui so um link para la.
 */
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { Linking, Platform, Pressable, Text, View } from 'react-native';

import { useEstudioSalvo, useFotosPublicas, useSalvarEstudio } from '@/api/hooks';
import { BotaoAtelie, TituloSecao } from '@/components/atelie/base';
import { MapaDoAtelie } from '@/components/atelie/MapaDoAtelie';
import { GradeDeFotos } from '@/components/estudio/GradeDeFotos';
import { CabecalhoVoltar } from '@/components/ui/cabecalho';
import { Campo } from '@/components/ui/campo';
import { Carregando, EstadoErro } from '@/components/ui/estados';
import { TelaRolavel } from '@/components/ui/tela';
import { FOTOS, LOCAL, SITE_DO_STEWER, SOBRE } from '@/content/atelie';
import { montarEstudio } from '@/content/estudio';
import { cn } from '@/lib/cn';
import { confirmar } from '@/lib/confirmar';
import { lerCoordenadas } from '@/lib/coordenadas';
import { escolherFoto, SemPermissao } from '@/lib/foto';
import { useLayoutLargo } from '@/lib/responsivo';
import { mascaraTelefone } from '@/lib/telefone';

const PAINEL_DO_SITE = `${SITE_DO_STEWER}/admin`;
const FOTOS_DO_TRABALHO = 24;

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
            ? 'Retrato enviado por você. Aparece no início do app e na hora de escolher o profissional.'
            : 'Hoje é o retrato que veio no app, com a leitura do rosto desenhada por cima.'}
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

function Formulario() {
  const salvo = useEstudioSalvo();
  const salvar = useSalvarEstudio();
  const [nomeLocal, setNomeLocal] = useState('');
  const [descricao, setDescricao] = useState('');
  const [endereco, setEndereco] = useState('');
  const [regiao, setRegiao] = useState('');
  const [horario, setHorario] = useState('');
  const [linkMapa, setLinkMapa] = useState('');
  const [coordenadas, setCoordenadas] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [site, setSite] = useState('');
  const [frase, setFrase] = useState('');
  const [erroCoordenadas, setErroCoordenadas] = useState<string | null>(null);
  const [salvoAgora, setSalvoAgora] = useState(false);

  // preenche uma vez, quando chega o que esta salvo
  const preenchido = useRef(false);
  useEffect(() => {
    const e = salvo.data;
    if (preenchido.current || !e) return;
    preenchido.current = true;
    setNomeLocal(e.nomeLocal ?? '');
    setDescricao(e.descricao ?? '');
    setEndereco(e.endereco ?? '');
    setRegiao(e.regiao ?? '');
    setHorario(e.horario ?? '');
    setLinkMapa(e.linkMapa ?? '');
    setCoordenadas(
      typeof e.latitude === 'number' && typeof e.longitude === 'number'
        ? `${e.latitude}, ${e.longitude}`
        : ''
    );
    setWhatsapp(e.whatsapp ? mascaraTelefone(e.whatsapp) : '');
    setInstagram(e.instagram ? `@${e.instagram}` : '');
    setSite(e.site ?? '');
    setFrase(e.frase ?? '');
  }, [salvo.data]);

  function aoSalvar() {
    setErroCoordenadas(null);
    setSalvoAgora(false);
    let coords: { latitude?: number; longitude?: number } = {};
    if (coordenadas.trim()) {
      const lidas = lerCoordenadas(coordenadas);
      if (!lidas) {
        setErroCoordenadas('Cole os dois números juntos, como -10.195029, -48.328703.');
        return;
      }
      coords = lidas;
    }
    salvar.mutate(
      {
        nomeLocal,
        descricao,
        endereco,
        regiao,
        horario,
        linkMapa,
        ...coords,
        whatsapp,
        instagram,
        site,
        frase,
      },
      {
        onSuccess: (e) => {
          setSalvoAgora(true);
          // o link do mapa pode ter trazido as coordenadas
          if (typeof e.latitude === 'number' && typeof e.longitude === 'number') {
            setCoordenadas(`${e.latitude}, ${e.longitude}`);
          }
        },
      }
    );
  }

  if (salvo.isLoading) return <Carregando className="mt-6" />;
  if (salvo.error)
    return (
      <EstadoErro className="mt-6" erro={salvo.error} aoTentarDeNovo={() => void salvo.refetch()} />
    );

  return (
    <View>
      <TituloSecao className="mt-14">Onde fica</TituloSecao>
      <Text className="mt-2 font-sans text-ui text-texto-2">
        Em branco, o app mostra o que já vem nele (o {LOCAL.nome}, na 204 Sul).
      </Text>
      <Campo
        className="mt-6"
        rotulo="Nome do lugar"
        value={nomeLocal}
        onChangeText={setNomeLocal}
        placeholder={LOCAL.nome}
        maxLength={80}
      />
      <Campo
        className="mt-5"
        rotulo="O que é o lugar"
        value={descricao}
        onChangeText={setDescricao}
        placeholder={LOCAL.descricao}
        maxLength={120}
      />
      <Campo
        className="mt-5"
        rotulo="Endereço"
        value={endereco}
        onChangeText={setEndereco}
        placeholder={LOCAL.endereco}
        maxLength={240}
      />
      <Campo
        className="mt-5"
        rotulo="Bairro ou região"
        value={regiao}
        onChangeText={setRegiao}
        placeholder={LOCAL.regiao}
        maxLength={80}
        ajuda="Aparece em cima do mapa."
      />
      <Campo
        className="mt-5"
        rotulo="Horário de atendimento"
        value={horario}
        onChangeText={setHorario}
        placeholder={LOCAL.horario}
        maxLength={120}
        ajuda="É só o texto que o cliente lê. Os horários de verdade ficam em Agenda."
      />
      <Campo
        className="mt-5"
        rotulo="Link do Google Maps"
        value={linkMapa}
        onChangeText={setLinkMapa}
        placeholder="https://www.google.com/maps/place/..."
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        maxLength={500}
        ajuda='É para onde vai o "Como chegar". Se o link tiver as coordenadas, o mapa se ajusta sozinho.'
      />
      <Campo
        className="mt-5"
        rotulo="Coordenadas do mapa"
        value={coordenadas}
        onChangeText={setCoordenadas}
        placeholder={`${LOCAL.latitude}, ${LOCAL.longitude}`}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={60}
        erro={erroCoordenadas ?? undefined}
        ajuda="No Google Maps, segure o dedo em cima do lugar: os dois números que aparecem são as coordenadas. Copie e cole aqui."
      />

      <TituloSecao className="mt-14">Contatos</TituloSecao>
      <Campo
        className="mt-6"
        rotulo="WhatsApp do estúdio"
        value={whatsapp}
        onChangeText={(t) => setWhatsapp(mascaraTelefone(t))}
        placeholder="(63) 9 8511-6783"
        keyboardType="phone-pad"
        maxLength={20}
      />
      <Campo
        className="mt-5"
        rotulo="Instagram"
        value={instagram}
        onChangeText={setInstagram}
        placeholder="@stewer.gabriel"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={60}
      />
      <Campo
        className="mt-5"
        rotulo="Site"
        value={site}
        onChangeText={setSite}
        placeholder={SITE_DO_STEWER}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        maxLength={200}
      />

      <TituloSecao className="mt-14">Tela de entrar</TituloSecao>
      <Campo
        className="mt-6"
        rotulo="Frase do Stewer"
        value={frase}
        onChangeText={setFrase}
        placeholder={SOBRE.citacao}
        multiline
        numberOfLines={2}
        textAlignVertical="top"
        maxLength={240}
        ajuda="Aparece ao lado da foto, no computador."
      />

      {salvar.error ? (
        <Text className="mt-4 font-sans text-ui-sm text-cadeira">{salvar.error.message}</Text>
      ) : null}
      {salvoAgora ? (
        <Text className="mt-4 font-sans text-ui-sm text-latao" accessibilityLiveRegion="polite">
          Salvo. O app do cliente já mostra assim.
        </Text>
      ) : null}
      <BotaoAtelie
        className="mt-8"
        titulo="Salvar estúdio"
        carregando={salvar.isPending}
        onPress={aoSalvar}
      />

      <TituloSecao className="mt-14">Como o cliente vê</TituloSecao>
      <View className="mt-6">
        <MapaDoAtelie />
      </View>
    </View>
  );
}

function LinkDoSite({ titulo, texto, url }: { titulo: string; texto: string; url: string }) {
  return (
    <Pressable
      onPress={() => void Linking.openURL(url)}
      accessibilityRole="link"
      accessibilityLabel={titulo}
      className="flex-1 flex-row items-center gap-3 rounded-[3px] border border-borda p-4"
      style={({ pressed }) => (pressed ? { opacity: 0.8 } : null)}
    >
      <View className="flex-1">
        <Text className="font-sans-semibold text-ui text-texto">{titulo}</Text>
        <Text className="font-sans text-ui-sm text-texto-3">{texto}</Text>
      </View>
      <Text className="font-sans text-ds-24 text-latao">›</Text>
    </Pressable>
  );
}

export default function TelaEstudio() {
  const largo = useLayoutLargo();
  const salvo = useEstudioSalvo();
  const fotos = (salvo.data?.fotos ?? []).filter((f) => f.id) as { id: string; legenda?: string }[];

  return (
    <TelaRolavel>
      {largo ? null : <CabecalhoVoltar />}
      <Text
        accessibilityRole="header"
        className={cn('font-display text-ds-38 text-texto', largo ? 'mt-10' : 'mt-8')}
      >
        Estúdio
      </Text>
      <Text className="mt-2 font-sans text-ui text-texto-2">
        O que o cliente vê no app: o retrato, as fotos, onde fica e como falar com você.
      </Text>

      <View className={cn('mt-6 gap-3', largo && 'flex-row')}>
        <LinkDoSite titulo="Abrir o site" texto="stewergabriel.com" url={SITE_DO_STEWER} />
        <LinkDoSite
          titulo="Painel do site"
          texto="Portfólio, cursos e textos do site"
          url={PAINEL_DO_SITE}
        />
      </View>

      <TituloSecao className="mt-14">Retrato</TituloSecao>
      <Retrato />

      <TituloSecao className="mt-14">Fotos do trabalho</TituloSecao>
      <Text className="mt-2 font-sans text-ui text-texto-2">
        A principal aparece na tela de entrar e no topo de Agendar. A segunda, na tela de entrar do
        celular.{Platform.OS === 'web' ? ' Use ‹ e › para mudar a ordem.' : ''}
      </Text>
      <GradeDeFotos
        fotos={fotos}
        maximo={FOTOS_DO_TRABALHO}
        ordenavel
        colunas={largo ? 4 : 3}
        vazio="Nenhuma foto enviada: o app usa as fotos que já vêm nele. Mande as suas para trocar."
      />

      <Formulario />
    </TelaRolavel>
  );
}
