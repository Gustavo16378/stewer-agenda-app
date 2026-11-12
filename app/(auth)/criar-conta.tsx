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
import { AvisoLegal } from '@/components/ui/aviso-legal';
import { Botao } from '@/components/ui/botao';
import { Campo } from '@/components/ui/campo';

import { AbasAcesso } from './_abas';
import { MolduraAcesso } from './_moldura';

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
    <MolduraAcesso
      titulo="Sua primeira vez."
      subtitulo="Crie a conta e marque o horário em menos de um minuto."
    >
      <AbasAcesso ativa="criar-conta" />

      <Campo
        className="mt-8"
        rotulo="Nome"
        value={nome}
        onChangeText={setNome}
        placeholder="Seu nome completo"
        autoCapitalize="words"
        autoComplete="name"
        maxLength={120}
        erro={erro?.violacaoDe('nome')}
      />

      <Campo
        className="mt-5"
        rotulo="E-mail"
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
        className="mt-5"
        rotulo="WhatsApp"
        value={telefone}
        onChangeText={setTelefone}
        placeholder="(63) 9 0000-0000"
        keyboardType="phone-pad"
        autoComplete="tel"
        maxLength={30}
        ajuda="Opcional. Só para o Stewer falar com você sobre o horário."
        erro={erro?.violacaoDe('telefone')}
      />

      <Campo
        className="mt-5"
        rotulo="Senha"
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
        <Text className="mt-4 font-sans text-ui-sm text-cadeira">{erro.message}</Text>
      ) : null}

      <Botao
        className="mt-8"
        titulo="Criar conta"
        carregando={enviando}
        disabled={!podeEnviar}
        onPress={() => void aoCriar()}
      />

      <AvisoLegal />
    </MolduraAcesso>
  );
}
