/**
 * [02 Acesso · aba CRIAR CONTA]
 *
 * `POST /auth/registrar` cria SEMPRE um CLIENTE e ja devolve o token — nao ha etapa de
 * confirmacao. Profissional e admin sao promovidos por um ADMIN depois
 * (`POST /profissionais`), nunca no cadastro.
 *
 * Limites vindos direto do schema `RegistrarRequest`: nome <=120, email <=180,
 * telefone <=30, senha entre 8 e 72 caracteres.
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { ApiError } from '@/api/errors';
import { rotaInicialDoPapel, useAuth } from '@/auth/auth-context';
import { Botao } from '@/components/ui/botao';
import { Campo } from '@/components/ui/campo';
import { TelaRolavel } from '@/components/ui/tela';
import { LabelCaps, Titulo } from '@/components/ui/texto';

import { AbasAcesso } from './_abas';

const SENHA_MIN = 8;

export default function CriarConta() {
  const router = useRouter();
  const { registrar } = useAuth();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<ApiError | null>(null);
  const [enviando, setEnviando] = useState(false);

  const senhaCurta = senha.length > 0 && senha.length < SENHA_MIN;
  const podeEnviar =
    nome.trim().length > 0 && email.trim().length > 0 && senha.length >= SENHA_MIN && !enviando;

  async function aoCriar() {
    setErro(null);
    setEnviando(true);
    try {
      const usuario = await registrar({
        nome: nome.trim(),
        email: email.trim(),
        senha,
        telefone: telefone.trim() || undefined,
      });
      router.replace(rotaInicialDoPapel(usuario.role) as never);
    } catch (e) {
      setErro(e instanceof ApiError ? e : null);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <TelaRolavel>
      <LabelCaps papel="tela" className="mt-12">
        O ATELIÊ, NO SEU TEMPO
      </LabelCaps>
      <Titulo className="mt-[14px] text-d-31">Criar conta.</Titulo>

      <AbasAcesso ativa="criar-conta" />

      <Campo
        className="mt-9"
        rotulo="NOME"
        value={nome}
        onChangeText={setNome}
        placeholder="Seu nome completo"
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
        placeholder="seunome@email.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        maxLength={180}
        erro={erro?.violacaoDe('email')}
      />

      <Campo
        className="mt-[22px]"
        rotulo="TELEFONE"
        value={telefone}
        onChangeText={setTelefone}
        placeholder="+55 (11) 90000-0000"
        keyboardType="phone-pad"
        autoComplete="tel"
        maxLength={30}
        ajuda="Opcional."
        erro={erro?.violacaoDe('telefone')}
      />

      <Campo
        className="mt-[22px]"
        rotulo="SENHA"
        value={senha}
        onChangeText={setSenha}
        placeholder="Mínimo de 8 caracteres"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        maxLength={72}
        erro={
          erro?.violacaoDe('senha') ?? (senhaCurta ? 'Use pelo menos 8 caracteres.' : undefined)
        }
      />

      {erro && !erro.temViolacoes ? (
        <Text className="mt-4 font-sans text-help text-red-500">{erro.message}</Text>
      ) : null}

      <Botao
        className="mt-[34px]"
        titulo="CRIAR CONTA"
        carregando={enviando}
        disabled={!podeEnviar}
        onPress={() => void aoCriar()}
      />

      <Text className="mt-10 text-center font-sans text-help leading-[18.7px] text-ink/38">
        Ao continuar, você aceita os <Text className="text-ink/60">Termos de uso</Text> e a{' '}
        <Text className="text-ink/60">Política de privacidade</Text>.
      </Text>
    </TelaRolavel>
  );
}
