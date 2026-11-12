/**
 * Os tres estados que toda tela ligada a API precisa ter: carregando, erro e vazio.
 *
 * O design nao desenhou nenhum deles (os 19 frames mostram so o caminho feliz, com dado
 * cheio), entao a linguagem visual aqui e derivada dos tokens: eyebrow em caps + titulo
 * Playfair + acao, exatamente como as secoes das telas.
 */
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { aoAcordarServidor } from '@/api/client';
import { ApiError } from '@/api/errors';
import { cn } from '@/lib/cn';
import { useCores } from '@/theme/theme-context';

import { Botao } from './botao';
import { Corpo, LabelCaps, Titulo } from './texto';

/**
 * A API dorme quando ninguem usa e leva cerca de um minuto para voltar.
 *
 * O client insiste sozinho nesse intervalo, mas sem avisar nada a tela ficaria
 * parada por um minuto e o usuario concluiria que o app travou. Este hook diz
 * quando ha alguma chamada esperando o servidor.
 */
export function useServidorAcordando(): boolean {
  const [acordando, setAcordando] = useState(false);
  useEffect(() => aoAcordarServidor(setAcordando), []);
  return acordando;
}

export function Carregando({ className }: { className?: string }) {
  const cores = useCores();
  const acordando = useServidorAcordando();

  return (
    <View className={cn('flex-1 items-center justify-center gap-4 py-16', className)}>
      <ActivityIndicator color={cores.gold} />
      {acordando ? (
        <Corpo className="max-w-[280px] text-center text-ui-sm text-texto-3">
          Conectando ao servidor. Na primeira vez do dia isso leva alguns segundos.
        </Corpo>
      ) : null}
    </View>
  );
}

export function EstadoVazio({
  eyebrow,
  titulo,
  descricao,
  acao,
  className,
}: {
  eyebrow?: string;
  titulo: string;
  descricao?: string;
  acao?: { titulo: string; aoTocar: () => void };
  className?: string;
}) {
  return (
    <View className={cn('items-center justify-center gap-3 py-16', className)}>
      {/* redesenho: sem rotulo em caixa alta; o losango da marca, o titulo e a direcao */}
      <View className="mb-2 h-3 w-3 rotate-45 border border-latao" />
      {eyebrow ? <LabelCaps papel="secao">{eyebrow}</LabelCaps> : null}
      <Titulo className="text-center text-ds-24">{titulo}</Titulo>
      {descricao ? (
        <Corpo className="max-w-[300px] text-center text-ui text-texto-2">{descricao}</Corpo>
      ) : null}
      {acao ? (
        <Botao titulo={acao.titulo} onPress={acao.aoTocar} className="mt-4 self-stretch" />
      ) : null}
    </View>
  );
}

/**
 * Erro de carregamento. Usa a `mensagem` que a API mandou (`Erro.mensagem`) — e quando
 * o erro veio sem corpo (401/403) ou sem rede, a mensagem sintetizada em src/api/errors.ts.
 */
export function EstadoErro({
  erro,
  aoTentarDeNovo,
  className,
}: {
  erro: unknown;
  aoTentarDeNovo?: () => void;
  className?: string;
}) {
  const apiErro = erro instanceof ApiError ? erro : null;
  const mensagem =
    apiErro?.message ?? (erro instanceof Error ? erro.message : 'Não deu para carregar.');

  const eyebrow =
    apiErro?.kind === 'rede'
      ? 'Sem conexão'
      : apiErro?.kind === 'permissao'
        ? 'Sem permissão'
        : 'Algo deu errado';

  // 502/503/504 depois das tentativas significa que o servidor ainda nao
  // acordou. Dizer "algo deu errado" seria mentira: nada deu errado, e tentar
  // de novo daqui a pouco resolve.
  const aindaAcordando =
    apiErro?.status === 502 || apiErro?.status === 503 || apiErro?.status === 504;

  return (
    <View className={cn('items-center justify-center gap-3 py-16', className)}>
      <View className="mb-2 h-3 w-3 rotate-45 border border-cadeira" />
      <Titulo className="text-center text-ds-24">
        {aindaAcordando ? 'Servidor acordando' : eyebrow}
      </Titulo>
      <Corpo className="max-w-[300px] text-center text-ui text-texto-2">
        {aindaAcordando
          ? 'O servidor estava dormindo e ainda está voltando. Tente de novo em alguns segundos.'
          : mensagem}
      </Corpo>
      {apiErro?.codigo ? (
        <LabelCaps papel="micro" className="text-texto-3/60">
          {apiErro.codigo}
        </LabelCaps>
      ) : null}
      {aoTentarDeNovo ? (
        <Botao
          titulo="Tentar de novo"
          variante="fantasma"
          onPress={aoTentarDeNovo}
          className="mt-4 self-stretch"
        />
      ) : null}
    </View>
  );
}
