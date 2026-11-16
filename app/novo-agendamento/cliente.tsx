/**
 * Passo 0 do agendamento feito pela equipe: para quem e o horario.
 *
 * O Stewer recebe o pedido pelo WhatsApp: tem o nome, o numero, o dia e a hora que a
 * pessoa quer. Aqui ele busca quem ja e cliente (por nome, e-mail ou telefone) ou
 * cadastra na hora quem ainda nao tem conta (nome + WhatsApp, e-mail se tiver). Escolhido
 * o cliente, o fluxo normal segue com `clienteId` e `clienteNome`: servicos, dia e
 * horario livres da agenda dele e a confirmacao.
 *
 * Quem e cadastrado aqui com e-mail pode criar a conta pelo app depois, com o mesmo
 * e-mail, e assume este cadastro (com os horarios ja marcados) em vez de duplicar.
 *
 *   busca    <- GET /clientes?busca=
 *   cadastro -> POST /clientes { nome, telefone, email? }
 *
 * `?novo=1` abre ja no formulario de cliente novo (atalho da lista de clientes).
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useCadastrarCliente, useClientesInfinitos } from '@/api/hooks';
import type { ClienteResumo } from '@/api/types';
import { useAuth } from '@/auth/auth-context';
import { BotaoAtelie } from '@/components/atelie/base';
import { CabecalhoDoFluxo } from '@/components/atelie/fluxo';
import { Campo } from '@/components/ui/campo';
import { Carregando, EstadoErro } from '@/components/ui/estados';
import { AvatarIniciais } from '@/components/ui/imagem';
import { TelaRolavel } from '@/components/ui/tela';
import { formatTelefone, mascaraTelefone } from '@/lib/telefone';

/** Quantos resultados da busca mostrar: o resto se acha refinando a busca. */
const RESULTADOS = 6;

function LinhaCliente({ cliente, aoTocar }: { cliente: ClienteResumo; aoTocar: () => void }) {
  const contato = cliente.telefone ? formatTelefone(cliente.telefone) : cliente.email;
  return (
    <Pressable
      onPress={aoTocar}
      accessibilityRole="button"
      accessibilityLabel={[cliente.nome, contato].filter(Boolean).join(', ')}
      accessibilityHint="Marcar horário para este cliente"
      className="-mx-4 flex-row items-center gap-4 rounded-[3px] border-b border-borda/70 px-4 py-4"
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) =>
        pressed || hovered ? { backgroundColor: 'rgba(201,169,106,0.08)' } : null
      }
    >
      <AvatarIniciais nome={cliente.nome} tamanho={40} />
      <View className="flex-1 gap-[2px]">
        <Text className="font-sans-medium text-ui-lg text-texto" numberOfLines={1}>
          {cliente.nome}
        </Text>
        {contato ? (
          <Text className="font-sans text-ui-sm text-texto-3" numberOfLines={1}>
            {contato}
          </Text>
        ) : null}
      </View>
      <Text className="font-sans text-ui-lg text-latao">›</Text>
    </Pressable>
  );
}

export default function ParaQuem() {
  const router = useRouter();
  const { role } = useAuth();
  const { novo } = useLocalSearchParams<{ novo?: string }>();

  const [busca, setBusca] = useState('');
  const clientes = useClientesInfinitos(busca);
  const encontrados = (clientes.data?.pages.flat() ?? []).slice(0, RESULTADOS);

  const [cadastrando, setCadastrando] = useState(novo === '1');
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const cadastrar = useCadastrarCliente();

  // cliente nao marca para outra pessoa: vai direto para o passo 1
  useEffect(() => {
    if (role === 'CLIENTE') router.replace('/novo-agendamento/servico' as never);
  }, [role, router]);

  function seguir(id: string | undefined, nomeDoCliente: string | undefined) {
    if (!id) return;
    router.push({
      pathname: '/novo-agendamento/servico',
      params: { clienteId: id, clienteNome: nomeDoCliente ?? '' },
    } as never);
  }

  /** Abre o cadastro ja com o que foi digitado na busca: numero vira WhatsApp, o resto nome. */
  function abrirCadastro() {
    const texto = busca.trim();
    if (texto && !nome && !telefone) {
      if (/^[\d\s()+-]+$/.test(texto)) setTelefone(mascaraTelefone(texto));
      else if (!texto.includes('@')) setNome(texto);
    }
    setCadastrando(true);
  }

  function salvar() {
    cadastrar.mutate(
      {
        nome: nome.trim(),
        telefone: telefone.trim(),
        ...(email.trim() ? { email: email.trim() } : {}),
      },
      { onSuccess: (criado) => seguir(criado.id, criado.nome) }
    );
  }

  const erro = cadastrar.error;
  const mensagemDoErro =
    erro && !erro.temViolacoes
      ? erro.codigo === 'EMAIL_EM_USO'
        ? 'Já existe um cliente com esse e-mail. Busque pelo nome ali em cima.'
        : erro.message
      : null;

  return (
    <TelaRolavel>
      <CabecalhoDoFluxo
        contexto="Novo agendamento"
        titulo="Para quem?"
        descricao="Busque quem já é cliente ou cadastre quem pediu pelo WhatsApp."
      />

      <Campo
        className="mt-8"
        rotulo="Buscar cliente"
        value={busca}
        onChangeText={setBusca}
        placeholder="Nome, telefone ou e-mail"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />

      {busca.trim() ? (
        <View className="mt-4">
          {clientes.isLoading ? (
            <Carregando className="py-6" />
          ) : clientes.error ? (
            <EstadoErro erro={clientes.error} aoTentarDeNovo={() => void clientes.refetch()} />
          ) : encontrados.length === 0 ? (
            <Text className="py-4 font-sans text-ui text-texto-2">
              Ninguém com esse nome ainda. Cadastre abaixo.
            </Text>
          ) : (
            encontrados.map((c) => (
              <LinhaCliente key={c.id} cliente={c} aoTocar={() => seguir(c.id, c.nome)} />
            ))
          )}
        </View>
      ) : null}

      <View className="mt-8 h-px bg-borda" />

      {cadastrando ? (
        <View className="mt-8 gap-5">
          <Text className="font-display text-ds-24 text-texto">Cliente novo</Text>
          <Campo
            rotulo="Nome completo"
            value={nome}
            onChangeText={setNome}
            autoCapitalize="words"
            textContentType="name"
            erro={erro?.violacaoDe('nome')}
          />
          <Campo
            rotulo="WhatsApp"
            value={telefone}
            onChangeText={(t) => setTelefone(mascaraTelefone(t))}
            placeholder="(63) 9 9999-9999"
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            erro={erro?.violacaoDe('telefone')}
          />
          <Campo
            rotulo="E-mail (opcional)"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            ajuda="Com o e-mail, ele pode criar a conta no app depois e já encontra os horários marcados."
            erro={erro?.violacaoDe('email')}
          />
          {mensagemDoErro ? (
            <Text className="font-sans text-ui-sm text-cadeira">{mensagemDoErro}</Text>
          ) : null}
          <BotaoAtelie
            titulo="Cadastrar e escolher o serviço"
            carregando={cadastrar.isPending}
            disabled={!nome.trim() || telefone.replace(/\D/g, '').length < 10}
            onPress={salvar}
          />
        </View>
      ) : (
        <BotaoAtelie
          className="mt-8"
          variante="contorno"
          titulo="Cadastrar cliente novo"
          onPress={abrirCadastro}
        />
      )}
    </TelaRolavel>
  );
}
