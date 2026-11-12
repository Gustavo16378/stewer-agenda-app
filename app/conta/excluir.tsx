/**
 * Excluir a propria conta (cliente). Exigencia da Apple e do Google para app com
 * cadastro, e direito garantido pela LGPD.
 *
 * Diz antes, sem letra miuda, o que acontece: horarios futuros cancelados, anotacoes
 * apagadas, dados pessoais removidos. Pede a senha para confirmar.
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { api, desembrulha } from '@/api/client';
import { ApiError } from '@/api/errors';
import { useAuth } from '@/auth/auth-context';
import { Botao } from '@/components/ui/botao';
import { CabecalhoVoltar } from '@/components/ui/cabecalho';
import { Campo } from '@/components/ui/campo';
import { TelaRolavel } from '@/components/ui/tela';
import { LabelCaps, Titulo } from '@/components/ui/texto';
import { confirmar } from '@/lib/confirmar';

const CONSEQUENCIAS = [
  'Seus horários marcados são cancelados e ficam livres para outras pessoas.',
  'As anotações de visagismo sobre você são apagadas.',
  'Seu nome, e-mail e telefone saem do sistema. Não dá para desfazer.',
];

export default function ExcluirConta() {
  const router = useRouter();
  const { sair } = useAuth();
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<ApiError | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function excluir() {
    setErro(null);
    setEnviando(true);
    try {
      await desembrulha(api.POST('/auth/eu/excluir', { body: { senha } }));
      await sair();
      router.replace('/(auth)/entrar' as never);
    } catch (e) {
      setErro(e instanceof ApiError ? e : null);
      setEnviando(false);
    }
  }

  return (
    <TelaRolavel>
      <CabecalhoVoltar />
      <LabelCaps papel="tela" className="mt-8">
        CONTA
      </LabelCaps>
      <Titulo className="mt-3 text-d-27">Excluir conta</Titulo>

      <View className="mt-8 gap-4">
        {CONSEQUENCIAS.map((texto) => (
          <View key={texto} className="flex-row gap-3">
            <Text className="font-sans text-body-lg text-gold">·</Text>
            <Text className="flex-1 font-sans text-body-lg text-text-body">{texto}</Text>
          </View>
        ))}
      </View>

      <Campo
        className="mt-10"
        rotulo="SUA SENHA, PARA CONFIRMAR"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        maxLength={72}
        erro={erro?.codigo === 'SENHA_ATUAL_INCORRETA' ? 'A senha não confere.' : undefined}
      />
      {erro && erro.codigo !== 'SENHA_ATUAL_INCORRETA' ? (
        <Text className="mt-4 font-sans text-help text-red-500">{erro.message}</Text>
      ) : null}

      <Botao
        className="mt-[34px]"
        variante="fantasma"
        titulo="EXCLUIR MINHA CONTA"
        carregando={enviando}
        disabled={!senha || enviando}
        onPress={() =>
          confirmar('Excluir a conta de vez?', 'Não dá para desfazer.', {
            textoConfirmar: 'Excluir',
            destrutivo: true,
            aoConfirmar: () => void excluir(),
          })
        }
      />
    </TelaRolavel>
  );
}
