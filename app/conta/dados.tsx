/** Editar nome, e-mail e telefone da propria conta. */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { ApiError } from '@/api/errors';
import { useAuth } from '@/auth/auth-context';
import { Botao } from '@/components/ui/botao';
import { CabecalhoVoltar } from '@/components/ui/cabecalho';
import { Campo } from '@/components/ui/campo';
import { TelaRolavel } from '@/components/ui/tela';
import { LabelCaps, Titulo } from '@/components/ui/texto';

export default function EditarDados() {
  const router = useRouter();
  const { usuario, atualizarPerfil } = useAuth();
  const [nome, setNome] = useState(usuario?.nome ?? '');
  const [email, setEmail] = useState(usuario?.email ?? '');
  const [telefone, setTelefone] = useState(usuario?.telefone ?? '');
  const [erro, setErro] = useState<ApiError | null>(null);
  const [enviando, setEnviando] = useState(false);

  const podeSalvar = nome.trim().length > 0 && email.trim().length > 0 && !enviando;

  async function aoSalvar() {
    setErro(null);
    setEnviando(true);
    try {
      await atualizarPerfil({
        nome: nome.trim(),
        email: email.trim(),
        telefone: telefone.trim() || undefined,
      });
      router.back();
    } catch (e) {
      setErro(e instanceof ApiError ? e : null);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <TelaRolavel>
      <CabecalhoVoltar />
      <LabelCaps papel="tela" className="mt-8">
        CONTA
      </LabelCaps>
      <Titulo className="mt-3 text-d-27">Seus dados</Titulo>

      <Campo
        className="mt-9"
        rotulo="NOME"
        value={nome}
        onChangeText={setNome}
        autoCapitalize="words"
        autoComplete="name"
        maxLength={120}
        erro={erro?.violacaoDe('nome')}
      />
      <Campo
        className="mt-[22px]"
        rotulo="E-MAIL"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        maxLength={180}
        ajuda="É com ele que você entra no app."
        erro={erro?.violacaoDe('email')}
      />
      <Campo
        className="mt-[22px]"
        rotulo="TELEFONE"
        value={telefone}
        onChangeText={setTelefone}
        placeholder="(63) 90000-0000"
        keyboardType="phone-pad"
        autoComplete="tel"
        maxLength={30}
        ajuda="Opcional."
        erro={erro?.violacaoDe('telefone')}
      />

      {erro && !erro.temViolacoes ? (
        <Text className="mt-4 font-sans text-help text-red-500">
          {erro.codigo === 'EMAIL_EM_USO' ? 'Já existe uma conta com este e-mail.' : erro.message}
        </Text>
      ) : null}

      <Botao
        className="mt-[34px]"
        titulo="SALVAR"
        carregando={enviando}
        disabled={!podeSalvar}
        onPress={() => void aoSalvar()}
      />
    </TelaRolavel>
  );
}
