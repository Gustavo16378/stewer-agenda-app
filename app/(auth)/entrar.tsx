/**
 * [02 Acesso · aba ENTRAR]
 *
 * DESVIO DO DESIGN, consciente: o frame 02 pede E-MAIL + TELEFONE e promete
 * "Enviaremos um código de confirmação." — ou seja, login por OTP. A API nao tem OTP:
 * `POST /auth/login` recebe `{email, senha, tenantSlug?}` e devolve o JWT na hora.
 * Mantive a linguagem visual do frame (eyebrow, "Bem-vindo.", abas, campos, botao claro)
 * e troquei o campo TELEFONE por SENHA, que e o que a API autentica. A frase do codigo
 * de confirmacao saiu, porque prometeria algo que nao acontece.
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { ApiError } from '@/api/errors';
import { rotaInicialDoPapel, useAuth } from '@/auth/auth-context';
import { Botao } from '@/components/ui/botao';
import { Campo } from '@/components/ui/campo';
import { Losango } from '@/components/ui/losango';
import { TelaRolavel } from '@/components/ui/tela';
import { LabelCaps, Titulo } from '@/components/ui/texto';

import { AbasAcesso } from './_abas';

export default function Entrar() {
  const router = useRouter();
  const { entrar } = useAuth();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<ApiError | null>(null);
  const [enviando, setEnviando] = useState(false);

  const podeEnviar = email.trim().length > 0 && senha.length > 0 && !enviando;

  async function aoEntrar() {
    setErro(null);
    setEnviando(true);
    try {
      const usuario = await entrar(email.trim(), senha);
      router.replace(rotaInicialDoPapel(usuario.role) as never);
    } catch (e) {
      setErro(e instanceof ApiError ? e : null);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <TelaRolavel>
      {/* margin:6px 0 42px 8px no design */}
      <View className="mb-[42px] ml-2 mt-[6px] self-start">
        <Losango tamanho={40} sigla="SG" tamanhoSigla={13} />
      </View>

      <LabelCaps papel="tela">O ATELIÊ, NO SEU TEMPO</LabelCaps>
      <Titulo className="mt-[14px] text-d-31">Bem-vindo.</Titulo>

      <AbasAcesso ativa="entrar" />

      <Campo
        className="mt-9"
        rotulo="E-MAIL"
        value={email}
        onChangeText={setEmail}
        placeholder="seunome@email.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        erro={erro?.violacaoDe('email')}
        returnKeyType="next"
      />

      <Campo
        className="mt-[22px]"
        rotulo="SENHA"
        value={senha}
        onChangeText={setSenha}
        placeholder="••••••••"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        erro={erro?.violacaoDe('senha')}
        returnKeyType="go"
        onSubmitEditing={() => {
          if (podeEnviar) void aoEntrar();
        }}
      />

      {/* erro que nao pertence a campo nenhum (401 de senha errada, rede, 5xx) */}
      {erro && !erro.temViolacoes ? (
        <Text className="mt-4 font-sans text-help text-red-500">{erro.message}</Text>
      ) : null}

      <Botao
        className="mt-[34px]"
        titulo="ENTRAR"
        carregando={enviando}
        disabled={!podeEnviar}
        onPress={() => void aoEntrar()}
      />

      <Text className="mt-[18px] text-center font-sans text-help text-ink/42">
        Use o e-mail e a senha do seu cadastro no ateliê.
      </Text>

      <Text className="mt-10 text-center font-sans text-help leading-[18.7px] text-ink/38">
        Ao continuar, você aceita os <Text className="text-ink/60">Termos de uso</Text> e a{' '}
        <Text className="text-ink/60">Política de privacidade</Text>.
      </Text>
    </TelaRolavel>
  );
}
