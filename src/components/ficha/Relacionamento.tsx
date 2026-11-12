/**
 * O que o Stewer faz hoje para a clientela voltar: quem faz aniversario no mes (com o
 * parabens pronto no WhatsApp) e quem sumiu do proprio ritmo (com o convite pronto).
 * Cada nome abre a ficha.
 */
import { useRouter } from 'expo-router';
import { Linking, Pressable, Text, View } from 'react-native';

import { useAniversariantes, useSumidos } from '@/api/hooks';
import { BotaoAtelie, TituloSecao } from '@/components/atelie/base';
import { Carregando } from '@/components/ui/estados';
import { aniversario, haQuantoTempo, linkWhatsApp, MENSAGENS, ritmo } from '@/lib/carteira';

function Linha({
  nome,
  detalhe,
  telefone,
  mensagem,
  rotuloAcao,
  aoAbrir,
}: {
  nome: string;
  detalhe: string;
  telefone: string | null | undefined;
  mensagem: string;
  rotuloAcao: string;
  aoAbrir: () => void;
}) {
  const link = linkWhatsApp(telefone, mensagem);
  return (
    <View className="flex-row items-center gap-3 border-b border-borda/70 py-3">
      <Pressable
        onPress={aoAbrir}
        accessibilityRole="button"
        accessibilityLabel={`Abrir a ficha de ${nome}`}
        className="flex-1"
      >
        <Text className="font-sans-medium text-ui text-texto">{nome}</Text>
        <Text className="font-sans text-ui-sm text-texto-3">{detalhe}</Text>
      </Pressable>
      {link ? (
        <BotaoAtelie
          variante="texto"
          titulo={rotuloAcao}
          onPress={() => void Linking.openURL(link)}
        />
      ) : null}
    </View>
  );
}

export function Relacionamento() {
  const router = useRouter();
  const aniversariantes = useAniversariantes();
  const sumidos = useSumidos();
  const abrir = (id?: string) => id && router.push(`/cliente/${id}` as never);
  const primeiro = (nome?: string) => (nome ?? '').split(' ')[0] ?? '';

  return (
    <View>
      <TituloSecao className="mt-14">Aniversariantes do mês</TituloSecao>
      {aniversariantes.isLoading ? (
        <Carregando className="py-6" />
      ) : (aniversariantes.data ?? []).length === 0 ? (
        <Text className="mt-4 font-sans text-ui text-texto-3">
          Ninguém este mês. O aniversário entra na ficha de cada cliente.
        </Text>
      ) : (
        <View className="mt-3">
          {(aniversariantes.data ?? []).map((a) => {
            const n = aniversario(a.dataNascimento);
            return (
              <Linha
                key={a.id}
                nome={a.nome ?? ''}
                detalhe={n ? `${n.ehHoje ? 'Hoje' : n.dia}, faz ${n.idade}` : ''}
                telefone={a.telefone}
                mensagem={MENSAGENS.parabens(primeiro(a.nome))}
                rotuloAcao="Dar parabéns"
                aoAbrir={() => abrir(a.id)}
              />
            );
          })}
        </View>
      )}

      <TituloSecao className="mt-14">Sumiram</TituloSecao>
      <Text className="mt-2 font-sans text-ui-sm text-texto-3">
        Passaram do ritmo de sempre e não têm horário marcado.
      </Text>
      {sumidos.isLoading ? (
        <Carregando className="py-6" />
      ) : (sumidos.data ?? []).length === 0 ? (
        <Text className="mt-4 font-sans text-ui text-texto-3">
          Ninguém sumido. A clientela está voltando no ritmo.
        </Text>
      ) : (
        <View className="mt-3">
          {(sumidos.data ?? []).map((c) => (
            <Linha
              key={c.id}
              nome={c.nome ?? ''}
              detalhe={[
                `última visita ${haQuantoTempo(c.diasSemVir) ?? ''}`,
                c.intervaloHabitualDias ? `costumava vir ${ritmo(c.intervaloHabitualDias)}` : null,
              ]
                .filter(Boolean)
                .join(', ')}
              telefone={c.telefone}
              mensagem={MENSAGENS.saudade(primeiro(c.nome))}
              rotuloAcao="Chamar"
              aoAbrir={() => abrir(c.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}
