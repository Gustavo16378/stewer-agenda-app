/**
 * Entrar (redesenho, nov/2026: moldura com a foto do Stewer atendendo, em _moldura.tsx).
 *
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
import { AvisoLegal } from '@/components/ui/aviso-legal';
import { AcaoLinha, Botao } from '@/components/ui/botao';
import { Campo } from '@/components/ui/campo';

import { AbasAcesso } from './_abas';
import { MolduraAcesso } from './_moldura';

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
    <MolduraAcesso titulo="Bem-vindo de volta." subtitulo="Entre para ver e marcar seus horários.">
      <AbasAcesso ativa="entrar" />

      <Campo
        className="mt-8"
        rotulo="E-mail"
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
        className="mt-5"
        rotulo="Senha"
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
        <Text className="mt-4 font-sans text-ui-sm text-cadeira">{erro.message}</Text>
      ) : null}

      <Botao
        className="mt-8"
        titulo="Entrar"
        carregando={enviando}
        disabled={!podeEnviar}
        onPress={() => void aoEntrar()}
      />

      <View className="mt-5 items-center">
        <AcaoLinha
          titulo="Esqueci minha senha"
          onPress={() =>
            router.push({
              pathname: '/(auth)/esqueci-senha',
              params: email.trim() ? { email: email.trim() } : {},
            } as never)
          }
        />
      </View>

      <AvisoLegal />
    </MolduraAcesso>
  );
}
