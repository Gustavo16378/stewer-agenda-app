/**
 * Quem administra o estudio. O admin da acesso de admin a outra pessoa (que ja criou
 * conta no app) e tira, sem ninguem precisar mexer no banco.
 *
 * As travas ficam na API: ninguem tira o proprio acesso e o ultimo admin fica. Aqui o
 * botao de tirar nem aparece na propria linha. O papel vai no token, entao a mudanca
 * vale quando a pessoa entrar de novo no app; o texto de confirmacao avisa isso.
 */
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useAcessoDeAdmin, useAdministradores, useDebounce, usePessoas } from '@/api/hooks';
import type { Usuario } from '@/api/types';
import { useAuth } from '@/auth/auth-context';
import { BotaoAtelie } from '@/components/atelie/base';
import { Campo } from '@/components/ui/campo';
import { Carregando, EstadoErro } from '@/components/ui/estados';
import { AvatarPessoa } from '@/components/ui/imagem';
import { confirmar } from '@/lib/confirmar';

const PAPEL: Record<string, string> = {
  CLIENTE: 'Cliente',
  PROFISSIONAL: 'Profissional',
  ADMIN: 'Admin',
};

function Pessoa({ pessoa, acao }: { pessoa: Usuario; acao?: React.ReactNode }) {
  return (
    <View className="flex-row items-center gap-4 border-b border-borda py-4">
      <AvatarPessoa
        usuarioId={pessoa.id}
        fotoVersao={pessoa.fotoVersao}
        nome={pessoa.nome}
        tamanho={44}
      />
      <View className="flex-1">
        <Text className="font-sans-medium text-ui text-texto" numberOfLines={1}>
          {pessoa.nome}
        </Text>
        <Text className="font-sans text-ui-sm text-texto-3" numberOfLines={1}>
          {pessoa.email}
        </Text>
      </View>
      {acao}
    </View>
  );
}

function BuscarPessoa({ aoEscolher }: { aoEscolher: (p: Usuario) => void }) {
  const [busca, setBusca] = useState('');
  const termo = useDebounce(busca.trim());
  const pessoas = usePessoas(termo, termo.length >= 2);
  const opcoes = (pessoas.data ?? []).filter((p) => p.id && p.role !== 'ADMIN');

  return (
    <View className="mt-4">
      <Campo
        rotulo="Quem vai administrar"
        value={busca}
        onChangeText={setBusca}
        placeholder="Nome ou e-mail"
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus
        ajuda="A pessoa precisa já ter criado uma conta no app."
      />
      {termo.length < 2 ? null : pessoas.isLoading ? (
        <Text className="py-3 font-sans text-ui-sm text-texto-3">Buscando…</Text>
      ) : opcoes.length === 0 ? (
        <Text className="py-3 font-sans text-ui-sm text-texto-3">
          Ninguém com esse nome ou e-mail. Peça para a pessoa criar a conta no app primeiro.
        </Text>
      ) : (
        opcoes.slice(0, 6).map((p) => (
          <Pressable
            key={p.id}
            onPress={() => aoEscolher(p)}
            accessibilityRole="button"
            accessibilityLabel={`Dar acesso de admin para ${p.nome}`}
            style={({ pressed }) => (pressed ? { opacity: 0.6 } : null)}
          >
            <Pessoa
              pessoa={p}
              acao={
                <Text className="font-sans text-ui-sm text-texto-3">
                  {PAPEL[p.role ?? ''] ?? ''}
                </Text>
              }
            />
          </Pressable>
        ))
      )}
    </View>
  );
}

export function Administradores() {
  const { usuario } = useAuth();
  const admins = useAdministradores();
  const acesso = useAcessoDeAdmin();
  const [buscando, setBuscando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  function dar(p: Usuario) {
    confirmar(
      `Dar acesso de admin para ${p.nome}?`,
      'Vai poder mexer em tudo: equipe, serviços, clientes e auditoria. Vale quando a pessoa entrar de novo no app.',
      {
        textoConfirmar: 'Dar acesso',
        aoConfirmar: () =>
          acesso.mutate(
            { usuarioId: p.id ?? '', admin: true },
            {
              onSuccess: () => {
                setBuscando(false);
                setAviso(`${p.nome} agora é admin. Peça para sair e entrar de novo no app.`);
              },
            }
          ),
      }
    );
  }

  function tirar(p: Usuario) {
    confirmar(
      `Tirar o acesso de admin de ${p.nome}?`,
      'A pessoa continua com a conta. Se atende, segue com a agenda dela.',
      {
        textoConfirmar: 'Tirar acesso',
        destrutivo: true,
        aoConfirmar: () =>
          acesso.mutate(
            { usuarioId: p.id ?? '', admin: false },
            { onSuccess: () => setAviso(`${p.nome} não é mais admin.`) }
          ),
      }
    );
  }

  return (
    <View className="mt-14">
      <Text accessibilityRole="header" className="font-display text-ds-30 text-texto">
        Quem administra
      </Text>
      <Text className="mt-2 font-sans text-ui text-texto-2">
        Admin vê o painel, mexe na equipe, nos serviços e vê a auditoria.
      </Text>

      {admins.isLoading ? (
        <Carregando className="mt-6" />
      ) : admins.error ? (
        <EstadoErro
          className="mt-6"
          erro={admins.error}
          aoTentarDeNovo={() => void admins.refetch()}
        />
      ) : (
        <View className="mt-3">
          {(admins.data ?? []).map((p) => (
            <Pessoa
              key={p.id}
              pessoa={p}
              acao={
                p.id === usuario?.id ? (
                  <Text className="font-sans text-ui-sm text-texto-3">Você</Text>
                ) : (
                  <Pressable
                    onPress={() => tirar(p)}
                    accessibilityRole="button"
                    accessibilityLabel={`Tirar o acesso de admin de ${p.nome}`}
                    hitSlop={8}
                  >
                    <Text className="font-sans-medium text-ui-sm text-cadeira">Tirar acesso</Text>
                  </Pressable>
                )
              }
            />
          ))}
        </View>
      )}

      {aviso ? (
        <Text className="mt-4 font-sans text-ui-sm text-latao" accessibilityLiveRegion="polite">
          {aviso}
        </Text>
      ) : null}
      {acesso.error ? (
        <Text className="mt-4 font-sans text-ui-sm text-cadeira">{acesso.error.message}</Text>
      ) : null}

      {buscando ? (
        <>
          <BuscarPessoa aoEscolher={dar} />
          <BotaoAtelie
            className="mt-4"
            variante="texto"
            titulo="Cancelar"
            onPress={() => setBuscando(false)}
          />
        </>
      ) : (
        <BotaoAtelie
          className="mt-6"
          variante="contorno"
          titulo="Dar acesso de admin"
          carregando={acesso.isPending}
          onPress={() => {
            setAviso(null);
            acesso.reset();
            setBuscando(true);
          }}
        />
      )}
    </View>
  );
}
