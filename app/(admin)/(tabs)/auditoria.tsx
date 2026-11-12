/**
 * Auditoria (so ADMIN): tudo o que aconteceu no estudio, do mais novo para o mais
 * antigo, com filtro por assunto. Cada linha diz o que mudou, quem fez e quando.
 */
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useAuditoria } from '@/api/hooks';
import { GuardaDePapel } from '@/auth/guarda';
import { BotaoAtelie } from '@/components/atelie/base';
import { LinhaDoTempo } from '@/components/ficha/LinhaDoTempo';
import { CabecalhoVoltar } from '@/components/ui/cabecalho';
import { Carregando, EstadoErro, EstadoVazio } from '@/components/ui/estados';
import { TelaRolavel } from '@/components/ui/tela';
import { FILTROS_AUDITORIA } from '@/lib/carteira';
import { cn } from '@/lib/cn';
import { useLayoutLargo } from '@/lib/responsivo';

function Auditoria() {
  const largo = useLayoutLargo();
  const [filtro, setFiltro] = useState<(typeof FILTROS_AUDITORIA)[number]>(FILTROS_AUDITORIA[0]);
  const consulta = useAuditoria({ entidades: [...filtro.entidades] });
  const eventos = consulta.data?.pages.flat() ?? [];

  return (
    <TelaRolavel>
      {/* no celular a auditoria abre pelo Painel, entao tem o voltar; no menu lateral nao */}
      {largo ? null : <CabecalhoVoltar />}
      <Text
        accessibilityRole="header"
        className={cn('font-display text-ds-38 text-texto', largo ? 'mt-10' : 'mt-8')}
      >
        Auditoria
      </Text>
      <Text className="mt-2 font-sans text-ui text-texto-2">
        Quem marcou, remarcou, cancelou, concluiu e mudou o quê, e quando.
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="-mx-7 mt-6"
        contentContainerClassName="gap-2 px-7"
        accessibilityRole="radiogroup"
        accessibilityLabel="Filtrar por assunto"
      >
        {FILTROS_AUDITORIA.map((f) => {
          const on = f.chave === filtro.chave;
          return (
            <Pressable
              key={f.chave}
              onPress={() => setFiltro(f)}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              className={cn(
                'rounded-full border px-4 py-2',
                on ? 'border-latao bg-latao' : 'border-borda'
              )}
            >
              <Text
                className={cn('font-sans-medium text-ui-sm', on ? 'text-fundo' : 'text-texto-2')}
              >
                {f.rotulo}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View className="mt-8">
        {consulta.isLoading ? (
          <Carregando />
        ) : consulta.error ? (
          <EstadoErro erro={consulta.error} aoTentarDeNovo={() => void consulta.refetch()} />
        ) : eventos.length === 0 ? (
          <EstadoVazio
            titulo="Nada por aqui ainda."
            descricao="As mudanças aparecem assim que acontecem."
          />
        ) : (
          <>
            <LinhaDoTempo eventos={eventos} />
            {consulta.hasNextPage ? (
              <BotaoAtelie
                variante="contorno"
                titulo="Carregar mais"
                carregando={consulta.isFetchingNextPage}
                onPress={() => void consulta.fetchNextPage()}
              />
            ) : null}
          </>
        )}
      </View>
    </TelaRolavel>
  );
}

export default function TelaAuditoria() {
  return (
    <GuardaDePapel permitidos={['ADMIN']}>
      <Auditoria />
    </GuardaDePapel>
  );
}
