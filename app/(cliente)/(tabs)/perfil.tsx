/**
 * [09 Perfil do cliente] — tab PERFIL.
 *
 * Layout literal do frame 09: avatar de iniciais 58px + nome Playfair 24 + eyebrow
 * "CLIENTE DESDE MARÇO DE 2024"; secao DADOS PESSOAIS com linhas `padding:19px 0`
 * (rotulo 12.5 ink@.5, valor 13.5 ink@.88); secao PREFERÊNCIAS com toggles 34x18 e a
 * linha "Profissional preferido"; botao fantasma SAIR DA CONTA (`margin-top:44px`).
 *
 * Dados: `useAuth().usuario` (GET /auth/eu). So isso — e e por isso que quase tudo aqui
 * esta desabilitado:
 *
 *   TODO(API): `Usuario` nao tem `createdAt` -> "CLIENTE DESDE" nao tem de onde vir.
 *   TODO(API): nao existe `PUT /auth/eu` (nem `PATCH`) -> e-mail e telefone sao so leitura.
 *   TODO(API): nao existe endpoint de preferencia (lembrete por WhatsApp / e-mail,
 *              profissional preferido). Faltaria algo como
 *              `GET/PUT /auth/eu/preferencias { lembreteWhatsApp, lembreteEmail, profissionalPreferidoId }`.
 *
 * O que E real: SAIR DA CONTA (limpa o SecureStore) e a linha de APARÊNCIA, que nao esta
 * no frame mas e requisito do produto (tema segue o sistema, com toggle manual).
 */
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { Botao } from '@/components/ui/botao';
import { AvatarIniciais } from '@/components/ui/imagem';
import { Interruptor } from '@/components/ui/interruptor';
import { TelaRolavel } from '@/components/ui/tela';
import { LabelCaps, Titulo } from '@/components/ui/texto';
import { useTema } from '@/theme/theme-context';

function LinhaDado({ rotulo, valor }: { rotulo: string; valor: string | undefined }) {
  return (
    <View className="flex-row items-center justify-between gap-4 border-b border-divider py-[19px]">
      <Text className="font-sans text-meta text-ink/50">{rotulo}</Text>
      <Text className="flex-1 text-right font-sans text-body-lg text-text-strong" numberOfLines={1}>
        {valor || '—'}
      </Text>
    </View>
  );
}

function LinhaPreferencia({
  rotulo,
  ligado,
  aoMudar,
  disabled,
}: {
  rotulo: string;
  ligado: boolean;
  aoMudar?: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between border-b border-divider py-[19px]">
      <Text className="font-sans text-body-lg text-text-body">{rotulo}</Text>
      <Interruptor rotulo={rotulo} ligado={ligado} aoMudar={aoMudar} disabled={disabled} />
    </View>
  );
}

export default function PerfilCliente() {
  const router = useRouter();
  const { usuario, sair } = useAuth();
  const { tema, alternarTema, preferencia } = useTema();

  async function aoSair() {
    await sair();
    router.replace('/(auth)/entrar' as never);
  }

  return (
    <TelaRolavel insetInferior={false}>
      <View className="pt-[44px]">
        <View className="flex-row items-center gap-5">
          <AvatarIniciais nome={usuario?.nome} tamanho={58} />
          <View className="flex-1 gap-2">
            <Titulo className="text-d-24" numberOfLines={1}>
              {usuario?.nome ?? ''}
            </Titulo>
            {/* TODO(API): Usuario nao expoe createdAt; "CLIENTE DESDE <mes de ano>" fica sem origem */}
            <LabelCaps papel="micro" className="tracking-button text-text-muted">
              CLIENTE
            </LabelCaps>
          </View>
        </View>

        <LabelCaps papel="secao" className="mt-12">
          DADOS PESSOAIS
        </LabelCaps>
        <View className="mt-[6px]">
          {/* TODO(API): sem PUT /auth/eu, os dados sao so leitura */}
          <LinhaDado rotulo="E-mail" valor={usuario?.email} />
          <LinhaDado rotulo="Telefone" valor={usuario?.telefone} />
        </View>

        <LabelCaps papel="secao" className="mt-10">
          PREFERÊNCIAS
        </LabelCaps>
        <View className="mt-[6px]">
          {/* TODO(API): nao ha endpoint de preferencia de lembrete; os toggles do frame
              ficam desligados e inertes ate existir GET/PUT /auth/eu/preferencias */}
          <LinhaPreferencia rotulo="Lembretes por WhatsApp" ligado={false} disabled />
          <LinhaPreferencia rotulo="Lembrete por e-mail" ligado={false} disabled />
          <View className="flex-row items-center justify-between border-b border-divider py-[19px]">
            <Text className="font-sans text-body-lg text-text-body">Profissional preferido</Text>
            {/* TODO(API): sem campo de profissional preferido no Usuario */}
            <Text className="font-sans text-body-lg text-ink/55">—</Text>
          </View>
          <LinhaPreferencia
            rotulo="Tema escuro"
            ligado={tema === 'dark'}
            aoMudar={() => alternarTema()}
          />
          <Text className="mt-3 font-sans text-help text-ink/38">
            {preferencia === 'sistema'
              ? 'Seguindo a aparência do aparelho.'
              : 'Escolha manual. O app deixa de seguir a aparência do aparelho.'}
          </Text>
        </View>

        <Botao
          className="mt-11"
          variante="fantasma"
          titulo="SAIR DA CONTA"
          onPress={() => void aoSair()}
        />
      </View>
    </TelaRolavel>
  );
}
