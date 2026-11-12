/**
 * Esqueci a senha, em dois passos na mesma tela:
 *   1. e-mail -> a API manda um codigo de 6 digitos (responde igual se a conta nao existir)
 *   2. codigo + senha nova -> a API troca a senha e ja devolve a sessao aberta
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { api, desembrulha } from '@/api/client';
import { TENANT_SLUG } from '@/api/config';
import { ApiError } from '@/api/errors';
import { rotaInicialDoPapel, useAuth } from '@/auth/auth-context';
import { AcaoLinha, Botao } from '@/components/ui/botao';
import { CabecalhoVoltar } from '@/components/ui/cabecalho';
import { Campo } from '@/components/ui/campo';
import { TelaRolavel } from '@/components/ui/tela';
import { LabelCaps, Titulo } from '@/components/ui/texto';

const SENHA_MIN = 8;

function mensagem(erro: ApiError): string {
  if (erro.codigo === 'CODIGO_INVALIDO') return 'Código inválido ou vencido. Peça um código novo.';
  if (erro.codigo === 'MUITAS_TENTATIVAS') return 'Muitas tentativas. Espere alguns minutos.';
  return erro.message;
}

export default function EsqueciSenha() {
  const router = useRouter();
  const { redefinirSenha } = useAuth();
  const params = useLocalSearchParams<{ email?: string }>();

  const [email, setEmail] = useState(params.email ?? '');
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<ApiError | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function pedirCodigo() {
    setErro(null);
    setEnviando(true);
    try {
      await desembrulha(
        api.POST('/auth/senha/esqueci', {
          body: { email: email.trim(), ...(TENANT_SLUG ? { tenantSlug: TENANT_SLUG } : {}) },
        })
      );
      setCodigoEnviado(true);
    } catch (e) {
      setErro(e instanceof ApiError ? e : null);
    } finally {
      setEnviando(false);
    }
  }

  async function trocar() {
    setErro(null);
    setEnviando(true);
    try {
      const usuario = await redefinirSenha({
        email: email.trim(),
        codigo: codigo.trim(),
        novaSenha: senha,
      });
      router.replace(rotaInicialDoPapel(usuario.role) as never);
    } catch (e) {
      setErro(e instanceof ApiError ? e : null);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <TelaRolavel larguraMaxima={440}>
      <CabecalhoVoltar />
      <LabelCaps papel="tela" className="mt-8">
        O ateliê, no seu tempo
      </LabelCaps>
      <Titulo className="mt-[14px] text-d-31">Esqueci a senha.</Titulo>

      {!codigoEnviado ? (
        <>
          <Text className="mt-6 font-sans text-body-lg text-text-body">
            Informe o e-mail da sua conta. Mandamos um código de 6 dígitos para você criar uma senha
            nova.
          </Text>
          <Campo
            className="mt-8"
            rotulo="E-mail"
            value={email}
            onChangeText={setEmail}
            placeholder="seunome@email.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            erro={erro?.violacaoDe('email')}
          />
          {erro && !erro.temViolacoes ? (
            <Text className="mt-4 font-sans text-help text-red-500">{mensagem(erro)}</Text>
          ) : null}
          <Botao
            className="mt-[34px]"
            titulo="Mandar código"
            carregando={enviando}
            disabled={!email.trim() || enviando}
            onPress={() => void pedirCodigo()}
          />
        </>
      ) : (
        <>
          <Text className="mt-6 font-sans text-body-lg text-text-body">
            Se existir uma conta com {email.trim()}, o código chegou lá. Ele vale por 30 minutos.
            Olhe também a caixa de spam.
          </Text>
          <Campo
            className="mt-8"
            rotulo="Código"
            value={codigo}
            onChangeText={(v) => setCodigo(v.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            keyboardType="number-pad"
            autoComplete="one-time-code"
            maxLength={6}
            erro={erro?.violacaoDe('codigo')}
          />
          <Campo
            className="mt-[22px]"
            rotulo="Senha nova"
            value={senha}
            onChangeText={setSenha}
            placeholder="Mínimo de 8 caracteres"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            maxLength={72}
            erro={
              senha.length > 0 && senha.length < SENHA_MIN
                ? 'Use pelo menos 8 caracteres.'
                : erro?.violacaoDe('novaSenha')
            }
          />
          {erro && !erro.temViolacoes ? (
            <Text className="mt-4 font-sans text-help text-red-500">{mensagem(erro)}</Text>
          ) : null}
          <Botao
            className="mt-[34px]"
            titulo="Criar senha nova"
            carregando={enviando}
            disabled={codigo.length !== 6 || senha.length < SENHA_MIN || enviando}
            onPress={() => void trocar()}
          />
          <View className="mt-5 items-center">
            <AcaoLinha titulo="Mandar outro código" onPress={() => void pedirCodigo()} />
          </View>
        </>
      )}
    </TelaRolavel>
  );
}
