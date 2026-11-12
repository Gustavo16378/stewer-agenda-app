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
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { AcaoLinha, Botao } from '@/components/ui/botao';
import { CabecalhoVoltar } from '@/components/ui/cabecalho';
import { AvatarPessoa } from '@/components/ui/imagem';
import { Interruptor } from '@/components/ui/interruptor';
import { TelaRolavel } from '@/components/ui/tela';
import { LabelCaps, Titulo } from '@/components/ui/texto';
import { formatMesAnoLongoCaps } from '@/lib/datetime';
import { escolherFoto, type OrigemDaFoto } from '@/lib/foto';
import { abrirPaginaDoSite } from '@/lib/site';
import { formatTelefone } from '@/lib/telefone';
import { useTema } from '@/theme/theme-context';

import { PreferenciaLembrete } from './preferencia-lembrete';

const PAPEL: Record<string, string> = {
  CLIENTE: 'Cliente',
  PROFISSIONAL: 'Profissional',
  ADMIN: 'Administrador',
};

function LinhaDado({ rotulo, valor }: { rotulo: string; valor: string | undefined }) {
  return (
    <View className="flex-row items-center justify-between gap-4 border-b border-borda/70 py-[18px]">
      <Text className="font-sans text-ui text-texto-3">{rotulo}</Text>
      <Text className="flex-1 text-right font-sans-medium text-ui text-texto" numberOfLines={1}>
        {valor || 'Não informado'}
      </Text>
    </View>
  );
}

function LinhaAcao({ rotulo, aoTocar }: { rotulo: string; aoTocar: () => void }) {
  return (
    <Pressable
      onPress={aoTocar}
      accessibilityRole="button"
      className="flex-row items-center justify-between border-b border-borda/70 py-[18px]"
      style={({ pressed }) => (pressed ? { opacity: 0.6 } : null)}
    >
      <Text className="font-sans-medium text-ui text-texto">{rotulo}</Text>
      <Text className="font-sans text-ds-24 text-texto-3">›</Text>
    </Pressable>
  );
}

/**
 * A foto da conta: tocar abre a galeria (ou a camera, no celular), a foto e recortada
 * em quadrado e reduzida para 512 px antes de subir.
 */
function FotoDaConta() {
  const { usuario, trocarFoto } = useAuth();
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function trocar(origem: OrigemDaFoto) {
    setErro(null);
    setOcupado(true);
    try {
      const base64 = await escolherFoto(origem, { lado: 512, qualidade: 0.8, quadrada: true });
      if (base64) await trocarFoto({ tipoConteudo: 'image/jpeg', conteudoBase64: base64 });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não deu para trocar a foto.');
    } finally {
      setOcupado(false);
    }
  }

  return (
    <View className="items-center gap-2">
      <Pressable
        onPress={() => void trocar('galeria')}
        accessibilityRole="button"
        accessibilityLabel={
          usuario?.fotoVersao ? 'Trocar foto de perfil' : 'Adicionar foto de perfil'
        }
        disabled={ocupado}
        style={({ pressed }) => (pressed ? { opacity: 0.8 } : null)}
      >
        <AvatarPessoa
          usuarioId={usuario?.id}
          fotoVersao={usuario?.fotoVersao}
          nome={usuario?.nome}
          tamanho={72}
        />
        <View className="absolute -bottom-1 -right-1 h-7 w-7 items-center justify-center rounded-full border-2 border-fundo bg-latao">
          {ocupado ? (
            <ActivityIndicator size="small" color="#0c0c0c" />
          ) : (
            <Text className="font-sans-semibold text-ui text-fundo">+</Text>
          )}
        </View>
      </Pressable>
      <View className="flex-row gap-3">
        {Platform.OS === 'web' ? null : (
          <Pressable onPress={() => void trocar('camera')} accessibilityRole="button" hitSlop={8}>
            <Text className="font-sans-medium text-ui-xs text-latao">Câmera</Text>
          </Pressable>
        )}
        {usuario?.fotoVersao ? (
          <Pressable
            onPress={() => void trocarFoto(null)}
            accessibilityRole="button"
            accessibilityLabel="Tirar foto de perfil"
            hitSlop={8}
          >
            <Text className="font-sans-medium text-ui-xs text-texto-3">Tirar</Text>
          </Pressable>
        ) : null}
      </View>
      {erro ? <Text className="font-sans text-ui-xs text-cadeira">{erro}</Text> : null}
    </View>
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
        <View className="flex-row items-start gap-5">
          <FotoDaConta />
          <View className="flex-1 gap-2">
            <Titulo className="text-ds-30" numberOfLines={2}>
              {usuario?.nome ?? ''}
            </Titulo>
            <Text className="font-sans text-ui-sm text-texto-3">
              {PAPEL[usuario?.role ?? ''] ?? ''}
              {desde ? ` desde ${desde.toLowerCase()}` : ''}
            </Text>
          </View>
        </View>

        <LabelCaps papel="secao" className="mt-12">
          Dados pessoais
        </LabelCaps>
        <View className="mt-[6px]">
          <LinhaDado rotulo="E-mail" valor={usuario?.email} />
          <LinhaDado rotulo="Telefone" valor={formatTelefone(usuario?.telefone)} />
          <LinhaAcao rotulo="Editar dados" aoTocar={() => router.push('/conta/dados' as never)} />
          <LinhaAcao rotulo="Trocar senha" aoTocar={() => router.push('/conta/senha' as never)} />
        </View>

        <LabelCaps papel="secao" className="mt-10">
          Preferências
        </LabelCaps>
        <View className="mt-[6px]">
          <PreferenciaLembrete />
          <View className="flex-row items-center justify-between border-b border-borda/70 py-[18px]">
            <Text className="font-sans-medium text-ui text-texto">Tema escuro</Text>
            <Interruptor
              rotulo="Tema escuro"
              ligado={tema === 'dark'}
              aoMudar={() => alternarTema()}
            />
          </View>
          <Text className="mt-3 font-sans text-ui-sm text-texto-3">
            {preferencia === 'sistema'
              ? 'Seguindo a aparência do aparelho.'
              : 'Escolha manual. O app deixa de seguir a aparência do aparelho.'}
          </Text>
        </View>

        <Botao
          className="mt-11"
          variante="fantasma"
          titulo="Sair da conta"
          onPress={() => void aoSair()}
        />

        <View className="mt-8 items-center gap-4">
          {usuario?.role === 'CLIENTE' ? (
            <AcaoLinha
              titulo="Excluir minha conta"
              onPress={() => router.push('/conta/excluir' as never)}
            />
          ) : null}
          <View className="flex-row gap-6">
            <AcaoLinha titulo="Termos" onPress={() => abrirPaginaDoSite('/termos')} />
            <AcaoLinha titulo="Privacidade" onPress={() => abrirPaginaDoSite('/privacidade')} />
          </View>
        </View>
      </View>
    </TelaRolavel>
  );
}
