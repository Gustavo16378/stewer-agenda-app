/**
 * Conta do usuario logado — a mesma para cliente, profissional e admin.
 *
 * Cliente chega pela tab PERFIL (sem voltar). Profissional e admin chegam pela acao
 * CONTA do cabecalho da agenda/painel, e ai ha seta de voltar.
 *
 * Lembrete por WhatsApp saiu da tela: o envio automatico pela API oficial da Meta e
 * pago, e a decisao foi manter o app sem custo. "Profissional preferido" tambem saiu:
 * com um profissional so, ele nao muda nada na reserva.
 */
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { AcaoLinha, Botao } from '@/components/ui/botao';
import { CabecalhoVoltar } from '@/components/ui/cabecalho';
import { AvatarIniciais } from '@/components/ui/imagem';
import { Interruptor } from '@/components/ui/interruptor';
import { TelaRolavel } from '@/components/ui/tela';
import { LabelCaps, Titulo } from '@/components/ui/texto';
import { formatMesAnoLongoCaps } from '@/lib/datetime';
import { abrirPaginaDoSite } from '@/lib/site';
import { formatTelefone } from '@/lib/telefone';
import { useTema } from '@/theme/theme-context';

import { PreferenciaLembrete } from './preferencia-lembrete';

const PAPEL: Record<string, string> = {
  CLIENTE: 'CLIENTE',
  PROFISSIONAL: 'PROFISSIONAL',
  ADMIN: 'ADMINISTRADOR',
};

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

function LinhaAcao({ rotulo, aoTocar }: { rotulo: string; aoTocar: () => void }) {
  return (
    <Pressable
      onPress={aoTocar}
      accessibilityRole="button"
      className="flex-row items-center justify-between border-b border-divider py-[19px]"
      style={({ pressed }) => (pressed ? { opacity: 0.6 } : null)}
    >
      <Text className="font-sans text-body-lg text-text-body">{rotulo}</Text>
      <Text className="font-sans text-icon-sm text-nav-arrow">›</Text>
    </Pressable>
  );
}

export default function Conta({ comVoltar = false }: { comVoltar?: boolean }) {
  const router = useRouter();
  const { usuario, sair } = useAuth();
  const { tema, alternarTema, preferencia } = useTema();

  async function aoSair() {
    await sair();
    router.replace('/(auth)/entrar' as never);
  }

  const desde = usuario?.criadoEm ? formatMesAnoLongoCaps(usuario.criadoEm) : '';

  return (
    <TelaRolavel insetInferior={false}>
      {comVoltar ? <CabecalhoVoltar /> : null}
      <View className={comVoltar ? 'pt-6' : 'pt-[44px]'}>
        <View className="flex-row items-center gap-5">
          <AvatarIniciais nome={usuario?.nome} tamanho={58} />
          <View className="flex-1 gap-2">
            <Titulo className="text-d-24" numberOfLines={2}>
              {usuario?.nome ?? ''}
            </Titulo>
            <LabelCaps papel="micro" className="tracking-button text-text-muted">
              {PAPEL[usuario?.role ?? ''] ?? ''}
              {desde ? ` · DESDE ${desde}` : ''}
            </LabelCaps>
          </View>
        </View>

        <LabelCaps papel="secao" className="mt-12">
          DADOS PESSOAIS
        </LabelCaps>
        <View className="mt-[6px]">
          <LinhaDado rotulo="E-mail" valor={usuario?.email} />
          <LinhaDado rotulo="Telefone" valor={formatTelefone(usuario?.telefone)} />
          <LinhaAcao rotulo="Editar dados" aoTocar={() => router.push('/conta/dados' as never)} />
          <LinhaAcao rotulo="Trocar senha" aoTocar={() => router.push('/conta/senha' as never)} />
        </View>

        <LabelCaps papel="secao" className="mt-10">
          PREFERÊNCIAS
        </LabelCaps>
        <View className="mt-[6px]">
          <PreferenciaLembrete />
          <View className="flex-row items-center justify-between border-b border-divider py-[19px]">
            <Text className="font-sans text-body-lg text-text-body">Tema escuro</Text>
            <Interruptor
              rotulo="Tema escuro"
              ligado={tema === 'dark'}
              aoMudar={() => alternarTema()}
            />
          </View>
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

        <View className="mt-8 items-center gap-4">
          {usuario?.role === 'CLIENTE' ? (
            <AcaoLinha
              titulo="EXCLUIR MINHA CONTA"
              onPress={() => router.push('/conta/excluir' as never)}
            />
          ) : null}
          <View className="flex-row gap-6">
            <AcaoLinha titulo="TERMOS" onPress={() => abrirPaginaDoSite('/termos')} />
            <AcaoLinha titulo="PRIVACIDADE" onPress={() => abrirPaginaDoSite('/privacidade')} />
          </View>
        </View>
      </View>
    </TelaRolavel>
  );
}
