/**
 * Os tres estados que toda tela ligada a API precisa ter: carregando, erro e vazio.
 *
 * O design nao desenhou nenhum deles (os 19 frames mostram so o caminho feliz, com dado
 * cheio), entao a linguagem visual aqui e derivada dos tokens: eyebrow em caps + titulo
 * Playfair + acao, exatamente como as secoes das telas.
 */
import { ActivityIndicator, View } from 'react-native';

import { ApiError } from '@/api/errors';
import { cn } from '@/lib/cn';
import { useCores } from '@/theme/theme-context';

import { Botao } from './botao';
import { Corpo, LabelCaps, Titulo } from './texto';

export function Carregando({ className }: { className?: string }) {
  const cores = useCores();
  return (
    <View className={cn('flex-1 items-center justify-center py-16', className)}>
      <ActivityIndicator color={cores.gold} />
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
      {eyebrow ? (
        <LabelCaps papel="secao" compensarTracking>
          {eyebrow}
        </LabelCaps>
      ) : null}
      <Titulo className="text-center text-d-23">{titulo}</Titulo>
      {descricao ? (
        <Corpo className="max-w-[280px] text-center text-meta text-text-meta">{descricao}</Corpo>
      ) : null}
      {acao ? (
        <Botao
          titulo={acao.titulo}
          variante="fantasma"
          onPress={acao.aoTocar}
          className="mt-4 self-stretch"
        />
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
    apiErro?.message ?? (erro instanceof Error ? erro.message : 'Nao foi possivel carregar.');

  const eyebrow =
    apiErro?.kind === 'rede'
      ? 'SEM CONEXÃO'
      : apiErro?.kind === 'permissao'
        ? 'SEM PERMISSÃO'
        : 'ALGO DEU ERRADO';

  return (
    <View className={cn('items-center justify-center gap-3 py-16', className)}>
      <LabelCaps papel="secao" compensarTracking className="text-gold">
        {eyebrow}
      </LabelCaps>
      <Corpo className="max-w-[300px] text-center text-meta text-text-meta">{mensagem}</Corpo>
      {apiErro?.codigo ? (
        <LabelCaps papel="micro" className="text-ink/25">
          {apiErro.codigo}
        </LabelCaps>
      ) : null}
      {aoTentarDeNovo ? (
        <Botao
          titulo="TENTAR DE NOVO"
          variante="fantasma"
          onPress={aoTentarDeNovo}
          className="mt-4 self-stretch"
        />
      ) : null}
    </View>
  );
}
