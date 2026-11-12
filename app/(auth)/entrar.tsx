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
import { LogoStewer } from '@/components/marca/Logo';
import { AvisoLegal } from '@/components/ui/aviso-legal';
import { AcaoLinha, Botao } from '@/components/ui/botao';
import { Campo } from '@/components/ui/campo';
import { TelaRolavel } from '@/components/ui/tela';
import { LabelCaps, Titulo } from '@/components/ui/texto';
import { useTema } from '@/theme/theme-context';

import { AbasAcesso } from './_abas';

export default function Entrar() {
  const router = useRouter();
  const { tema } = useTema();
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
    <TelaRolavel larguraMaxima={440}>
      {/* margin:6px 0 42px 8px no design */}
      <View className="mb-[42px] ml-2 mt-[6px] self-start">
        <LogoStewer altura={44} cor={tema === 'dark' ? '#f3f3f3' : '#0A0A0A'} />
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

      <View className="mt-[18px] items-center">
        <AcaoLinha
          titulo="ESQUECI MINHA SENHA"
          onPress={() =>
            router.push({
              pathname: '/(auth)/esqueci-senha',
              params: email.trim() ? { email: email.trim() } : {},
            } as never)
          }
        />
      </View>

      <AvisoLegal />
    </TelaRolavel>
  );
}
