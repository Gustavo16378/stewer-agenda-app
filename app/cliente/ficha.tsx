/**
 * Editar a ficha do cliente: aniversario, como conheceu, etiquetas e o perfil de
 * visagismo. Escolhas comuns viram botoes (um toque), o resto e texto livre.
 *
 * Rota: /cliente/ficha?id=<clienteId>. O PUT substitui a ficha inteira, entao a tela
 * sempre manda todos os campos, inclusive os vazios.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useCliente, useSalvarFicha } from '@/api/hooks';
import { GuardaDePapel } from '@/auth/guarda';
import { BotaoAtelie } from '@/components/atelie/base';
import { CabecalhoVoltar } from '@/components/ui/cabecalho';
import { Campo } from '@/components/ui/campo';
import { Carregando, EstadoErro } from '@/components/ui/estados';
import { TelaRolavel } from '@/components/ui/tela';
import { cn } from '@/lib/cn';
import { formatDataBr, parseDataBr } from '@/lib/datetime';

const ORIGENS = ['Instagram', 'Indicação', 'Google', 'Passou na frente', 'Site', 'Outro'];
const ETIQUETAS = [
  'VIP',
  'Indica amigos',
  'Pontual',
  'Prefere silêncio',
  'Gosta de conversar',
  'Costuma atrasar',
];
const ROSTOS = ['Oval', 'Redondo', 'Quadrado', 'Retangular', 'Triangular', 'Coração', 'Diamante'];

function Opcoes({
  rotulo,
  opcoes,
  marcadas,
  aoTocar,
}: {
  rotulo: string;
  opcoes: readonly string[];
  marcadas: readonly string[];
  aoTocar: (o: string) => void;
}) {
  return (
    <View className="mt-6">
      <Text className="font-sans-medium text-ui-sm text-texto-2">{rotulo}</Text>
      <View className="mt-3 flex-row flex-wrap gap-2">
        {opcoes.map((o) => {
          const on = marcadas.includes(o);
          return (
            <Pressable
              key={o}
              onPress={() => aoTocar(o)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={o}
              className={cn(
                'rounded-full border px-4 py-2',
                on ? 'border-latao bg-latao' : 'border-borda'
              )}
            >
              <Text
                className={cn('font-sans-medium text-ui-sm', on ? 'text-fundo' : 'text-texto-2')}
              >
                {o}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function EditarFicha() {
  const router = useRouter();
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const cliente = useCliente(id);
  const salvar = useSalvarFicha(id);

  const [nascimento, setNascimento] = useState('');
  const [origem, setOrigem] = useState<string | null>(null);
  const [etiquetas, setEtiquetas] = useState<string[]>([]);
  const [nova, setNova] = useState('');
  const [rosto, setRosto] = useState<string | null>(null);
  const [cabelo, setCabelo] = useState('');
  const [barba, setBarba] = useState('');
  const [estilo, setEstilo] = useState('');
  const [manter, setManter] = useState('');
  const [evitar, setEvitar] = useState('');
  const [erroData, setErroData] = useState<string | null>(null);

  // preenche uma vez, quando a ficha chega
  const preenchido = useRef(false);
  useEffect(() => {
    const f = cliente.data?.ficha;
    if (preenchido.current || !cliente.data) return;
    preenchido.current = true;
    setNascimento(f?.dataNascimento ? formatDataBr(f.dataNascimento) : '');
    setOrigem(f?.origem ?? null);
    setEtiquetas(f?.etiquetas ?? []);
    setRosto(f?.formatoRosto ?? null);
    setCabelo(f?.cabelo ?? '');
    setBarba(f?.barba ?? '');
    setEstilo(f?.estilo ?? '');
    setManter(f?.manter ?? '');
    setEvitar(f?.evitar ?? '');
  }, [cliente.data]);

  function alternar(lista: string[], o: string) {
    return lista.includes(o) ? lista.filter((x) => x !== o) : [...lista, o];
  }

  function aoSalvar() {
    setErroData(null);
    let dataNascimento: string | undefined;
    if (nascimento.trim()) {
      const d = parseDataBr(nascimento);
      if (!d) return setErroData('Use o formato DD/MM/AAAA, por exemplo 20/11/1994.');
      dataNascimento = d;
    }
    const extras = nova.trim() ? [nova.trim()] : [];
    salvar.mutate(
      {
        ...(dataNascimento ? { dataNascimento } : {}),
        origem: origem ?? undefined,
        etiquetas: [...etiquetas, ...extras],
        formatoRosto: rosto ?? undefined,
        cabelo,
        barba,
        estilo,
        manter,
        evitar,
      },
      { onSuccess: () => router.back() }
    );
  }

  if (cliente.isLoading)
    return (
      <TelaRolavel>
        <Carregando className="mt-10" />
      </TelaRolavel>
    );
  if (cliente.error || !cliente.data) {
    return (
      <TelaRolavel>
        <CabecalhoVoltar />
        <EstadoErro
          className="mt-8"
          erro={cliente.error}
          aoTentarDeNovo={() => void cliente.refetch()}
        />
      </TelaRolavel>
    );
  }

  const personalizadas = etiquetas.filter((e) => !ETIQUETAS.includes(e));

  return (
    <TelaRolavel>
      <CabecalhoVoltar />
      <Text className="mt-8 font-sans-medium text-ui-sm text-latao">{cliente.data.nome}</Text>
      <Text accessibilityRole="header" className="mt-2 font-display text-ds-38 text-texto">
        Ficha do cliente
      </Text>

      <Campo
        className="mt-8"
        rotulo="Aniversário"
        value={nascimento}
        onChangeText={setNascimento}
        placeholder="DD/MM/AAAA"
        keyboardType="numbers-and-punctuation"
        maxLength={10}
        erro={erroData ?? salvar.error?.violacaoDe('dataNascimento')}
        ajuda="Aparece no painel no mês do aniversário, com a mensagem de parabéns pronta."
      />

      <Opcoes
        rotulo="Como conheceu o Stewer"
        opcoes={ORIGENS}
        marcadas={origem ? [origem] : []}
        aoTocar={(o) => setOrigem(origem === o ? null : o)}
      />

      <Opcoes
        rotulo="Etiquetas"
        opcoes={[...ETIQUETAS, ...personalizadas]}
        marcadas={etiquetas}
        aoTocar={(o) => setEtiquetas(alternar(etiquetas, o))}
      />
      <Campo
        className="mt-3"
        rotulo="Outra etiqueta"
        value={nova}
        onChangeText={setNova}
        placeholder="Ex.: Noivo em dezembro"
        maxLength={40}
        returnKeyType="done"
        onSubmitEditing={() => {
          if (nova.trim()) {
            setEtiquetas(alternar(etiquetas, nova.trim()));
            setNova('');
          }
        }}
      />

      <Text className="mt-12 font-display text-ds-30 text-texto">Perfil de visagismo</Text>
      <Opcoes
        rotulo="Formato do rosto"
        opcoes={ROSTOS}
        marcadas={rosto ? [rosto] : []}
        aoTocar={(o) => setRosto(rosto === o ? null : o)}
      />
      <Campo
        className="mt-6"
        rotulo="Cabelo"
        value={cabelo}
        onChangeText={setCabelo}
        placeholder="Tipo, textura, entradas, redemoinho"
        maxLength={80}
      />
      <Campo
        className="mt-5"
        rotulo="Barba"
        value={barba}
        onChangeText={setBarba}
        placeholder="Densidade, falhas, desenho"
        maxLength={80}
      />
      <Campo
        className="mt-5"
        rotulo="Estilo"
        value={estilo}
        onChangeText={setEstilo}
        placeholder="Clássico, executivo, despojado"
        maxLength={120}
      />
      <Campo
        className="mt-5"
        rotulo="O que manter"
        value={manter}
        onChangeText={setManter}
        placeholder="O que valoriza o rosto dele"
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        maxLength={1000}
      />
      <Campo
        className="mt-5"
        rotulo="O que evitar"
        value={evitar}
        onChangeText={setEvitar}
        placeholder="O que não combina ou ele não gosta"
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        maxLength={1000}
      />

      {salvar.error && !salvar.error.temViolacoes ? (
        <Text className="mt-4 font-sans text-ui-sm text-cadeira">{salvar.error.message}</Text>
      ) : null}

      <BotaoAtelie
        className="mt-10"
        titulo="Salvar ficha"
        carregando={salvar.isPending}
        onPress={aoSalvar}
      />
    </TelaRolavel>
  );
}

export default function TelaEditarFicha() {
  return (
    <GuardaDePapel permitidos={['PROFISSIONAL', 'ADMIN']}>
      <EditarFicha />
    </GuardaDePapel>
  );
}
