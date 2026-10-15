/**
 * Tela-espaco-reservado da tab AGENDAR do cliente. Sem frame proprio no design.
 *
 * O `_layout.tsx` das tabs intercepta o `tabPress` de "agendar" e empurra o wizard
 * (frames 04-07, que no design aparecem SEM tab bar), entao este arquivo existe porque
 * o Expo Router precisa de uma tela por rota para o item aparecer na barra com o label
 * literal `AGENDAR` — nao porque o design desenhe algo aqui.
 *
 * Ela so chega a renderizar quando alguem entra por fora do toque na tab: deep link em
 * `/(cliente)/(tabs)/agendar`, reload do dev, restauracao de estado pelo SO. Nesses casos
 * oferece a mesma porta de entrada do frame 03 em vez de uma tela vazia. De proposito NAO
 * navega sozinha: um push automatico brigaria com a interceptacao do `tabPress` e viraria
 * laco de navegacao ao voltar do wizard.
 *
 * Nao consome API — por isso nao tem os estados de carregando/erro/vazio da regra 9.
 */
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Botao } from '@/components/ui/botao';
import { Tela } from '@/components/ui/tela';
import { LabelCaps, Titulo } from '@/components/ui/texto';

export default function AgendarCliente() {
  const router = useRouter();

  return (
    <Tela insetInferior={false}>
      <View className="pt-[44px]">
        <LabelCaps papel="tela">AGENDAR</LabelCaps>
        <Titulo className="mt-3 text-d-31">Escolha o serviço</Titulo>

        <Botao
          className="mt-[42px]"
          titulo="NOVO AGENDAMENTO"
          onPress={() => router.push('/(cliente)/novo-agendamento/servico' as never)}
        />
      </View>
    </Tela>
  );
}
