/** Trocar a senha com a sessao aberta, confirmando a atual. */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { ApiError } from '@/api/errors';
import { useTrocarSenha } from '@/api/hooks';
import { GuardaDePapel } from '@/auth/guarda';
import { Botao } from '@/components/ui/botao';
import { CabecalhoVoltar } from '@/components/ui/cabecalho';
import { Campo } from '@/components/ui/campo';
import { TelaRolavel } from '@/components/ui/tela';
import { LabelCaps, Titulo } from '@/components/ui/texto';

const SENHA_MIN = 8;

function TrocarSenha() {
  const router = useRouter();
  const trocar = useTrocarSenha();
  const [atual, setAtual] = useState('');
  const [nova, setNova] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [feito, setFeito] = useState(false);

  const novaCurta = nova.length > 0 && nova.length < SENHA_MIN;
  const naoBate = confirmacao.length > 0 && confirmacao !== nova;
  const podeEnviar =
    atual.length > 0 && nova.length >= SENHA_MIN && confirmacao === nova && !trocar.isPending;

  const erro = trocar.error instanceof ApiError ? trocar.error : null;

  return (
    <TelaRolavel>
      <CabecalhoVoltar />
      <LabelCaps papel="tela" className="mt-8">
        Conta
      </LabelCaps>
      <Titulo className="mt-3 text-d-27">Trocar senha</Titulo>

      {feito ? (
        <>
          <Text className="mt-8 font-sans text-body-lg text-text-body">
            Senha trocada. Da próxima vez, entre com a senha nova.
          </Text>
          <Botao className="mt-8" titulo="Voltar" onPress={() => router.back()} />
        </>
      ) : (
        <>
          <Campo
            className="mt-9"
            rotulo="Senha atual"
            value={atual}
            onChangeText={setAtual}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            maxLength={72}
            erro={
              erro?.codigo === 'SENHA_ATUAL_INCORRETA' ? 'A senha atual não confere.' : undefined
            }
          />
          <Campo
            className="mt-[22px]"
            rotulo="Senha nova"
            value={nova}
            onChangeText={setNova}
            placeholder="Mínimo de 8 caracteres"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            maxLength={72}
            erro={novaCurta ? 'Use pelo menos 8 caracteres.' : erro?.violacaoDe('novaSenha')}
          />
          <Campo
            className="mt-[22px]"
            rotulo="Repita a senha nova"
            value={confirmacao}
            onChangeText={setConfirmacao}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            maxLength={72}
            erro={naoBate ? 'As duas senhas não estão iguais.' : undefined}
          />
          {erro && !erro.temViolacoes && erro.codigo !== 'SENHA_ATUAL_INCORRETA' ? (
            <Text className="mt-4 font-sans text-help text-red-500">{erro.message}</Text>
          ) : null}
          <Botao
            className="mt-[34px]"
            titulo="Trocar senha"
            carregando={trocar.isPending}
            disabled={!podeEnviar}
            onPress={() =>
              trocar.mutate(
                { senhaAtual: atual, novaSenha: nova },
                { onSuccess: () => setFeito(true) }
              )
            }
          />
        </>
      )}
    </TelaRolavel>
  );
}

/** Direto pelo link ou depois de recarregar: so mostra a tela com a sessao ja restaurada. */
export default function RotaTrocarSenha() {
  return (
    <GuardaDePapel permitidos={['CLIENTE', 'PROFISSIONAL', 'ADMIN']}>
      <TrocarSenha />
    </GuardaDePapel>
  );
}
