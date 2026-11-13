/**
 * [15 Dashboard] — tab VISÃO GERAL do ADMIN.
 *
 * Redesenho (nov/2026): abre com o dia do Stewer (retrato, saudacao e o proximo
 * cliente), a lista de hoje, os numeros da semana em quadros, aniversariantes e sumidos,
 * e atalhos para Estudio, Auditoria e o site. O texto abaixo descreve os numeros.
 *
 * Layout literal do frame 15: eyebrow "VISÃO GERAL", titulo Playfair 29 "Esta semana",
 * faixa "31 AGO — 06 SET"; tres blocos separados por divisor (`padding-bottom:30px`):
 *   1. "32" (Playfair 42, lh 1) + AGENDAMENTOS NA SEMANA, com mini grafico de 7 barras de
 *      18px (`gap:9px`, a de hoje dourada, as outras ink@.16) e letras S T Q Q S S D;
 *   2. "78%" + TAXA DE OCUPAÇÃO, barra de 2px (trilha ink@.12, preenchimento dourado);
 *   3. "9" + CLIENTES NOVOS NO MÊS, com "+3 VS. JULHO" dourado;
 * e a linha "Receita estimada da semana" (12.5 ink@.55) com o valor em Playfair 19.
 *
 * NAO EXISTE ENDPOINT DE RELATORIO. Tudo aqui e derivado de endpoints reais, no app:
 *   agenda   <- GET /agendamentos/agenda?data=&profissionalId=  x 7 dias x N profissionais
 *               (para ADMIN o profissionalId e obrigatorio em cada chamada)
 *   grades   <- GET /profissionais/{id}/disponibilidade         (minutos ofertados na semana)
 *   clientes <- GET /clientes (todas as paginas)                (novos no mes, por createdAt)
 * Semana = segunda a domingo, como no design. Contam AGENDADO e CONCLUIDO; cancelado e
 * nao-comparecido ficam fora de tudo (agenda, ocupacao e receita).
 *
 *   TODO(API): um `GET /relatorios/semana?de=&ate=` devolveria isto em uma chamada em
 *   vez de 7xN + paginas de clientes. Num estudio com um profissional sao ~8 chamadas,
 *   cacheadas por 1 minuto; com muitos profissionais o custo cresce linearmente.
 *
 * Nenhum numero aqui e inventado: se a fonte falha, o bloco mostra "—" e o erro.
 *
 * DESVIO: SAIR no cabecalho. O design nao desenhou saida para o ADMIN e este papel
 * nao tem aba de perfil, entao a acao fica na linha do eyebrow, igual a agenda do
 * profissional. Sem ela, quem entra como administrador num aparelho compartilhado
 * fica administrador ate o token vencer.
 */
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, type ReactNode } from 'react';
import { Linking, Pressable, RefreshControl, Text, View } from 'react-native';

import {
  useAgendaDeVariosDias,
  useDisponibilidadesDe,
  useProfissionais,
  useTodosClientes,
} from '@/api/hooks';
import type { Agendamento } from '@/api/types';
import { useAuth } from '@/auth/auth-context';
import { Baixa } from '@/components/agenda/Baixa';
import { NumeroAnimado } from '@/components/atelie/NumeroAnimado';
import { Relacionamento } from '@/components/ficha/Relacionamento';
import { GeometriaDoRosto, MARCAS_RETRATO } from '@/components/marca/Geometria';
import { AtalhoDoPerfil } from '@/components/ui/atalho-perfil';
import { Carregando, EstadoErro } from '@/components/ui/estados';
import { IconeDaAba } from '@/components/ui/icones-abas';
import { TelaRolavel } from '@/components/ui/tela';
import { LabelCaps } from '@/components/ui/texto';
import { FOTOS, SITE_DO_STEWER } from '@/content/atelie';
import { useEstudio } from '@/content/estudio';
import { cn } from '@/lib/cn';
import {
  diaSemanaDe,
  formatHora,
  formatFaixaDiasCaps,
  hojeCalendarDate,
  mesAnterior,
  noMesmoMesLocal,
  nomeMesCaps,
  primeiroNome,
  saudacao,
  semanaDe,
  wallTimeParaMinutos,
  type CalendarDate,
} from '@/lib/datetime';
import { formatCentavosCurto, somaCentavos } from '@/lib/money';
import { useLayoutLargo } from '@/lib/responsivo';
import { useCores } from '@/theme/theme-context';

const LETRAS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']; // segunda..domingo, como o design

const conta = (a: Agendamento) => a.status === 'AGENDADO' || a.status === 'CONCLUIDO';
const MARFIM = '#F0EBE4';

/**
 * O dia do Stewer: retrato a direita, saudacao e a frase do dia a esquerda. Sempre escuro,
 * como a parede do estudio, nos dois temas: e o unico bloco forte da tela.
 */
function Heroi({ hoje, carregando }: { hoje: Agendamento[]; carregando: boolean }) {
  const { usuario } = useAuth();
  const estudio = useEstudio();
  const largo = useLayoutLargo();
  const retrato = estudio.retratoEnviado ?? FOTOS.retrato;
  const agora = Date.now();
  const proximo = hoje.find((a) => a.status === 'AGENDADO' && Date.parse(a.fim ?? '') > agora);
  const quantos = hoje.length;

  let frase: string;
  if (carregando) frase = 'Olhando a agenda de hoje…';
  else if (quantos === 0) frase = 'Agenda livre hoje.';
  else if (!proximo)
    frase = `${quantos} ${quantos === 1 ? 'atendimento' : 'atendimentos'} hoje, todos feitos.`;
  else
    frase = `${quantos} ${quantos === 1 ? 'atendimento' : 'atendimentos'} hoje. O próximo é às ${formatHora(proximo.inicio)}, com ${primeiroNome(proximo.clienteNome)}.`;

  const altura = largo ? 300 : 260;
  return (
    <View className="mt-6 overflow-hidden rounded-[3px] bg-[#0c0c0c]" style={{ height: altura }}>
      <View
        className="absolute bottom-0 right-0 top-0"
        style={{ width: largo ? altura * 0.9 : '62%' }}
      >
        <Image
          source={retrato.fonte}
          accessibilityLabel={retrato.descricao}
          contentFit="cover"
          contentPosition="top"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          transition={300}
        />
        {estudio.retratoEnviado ? null : <GeometriaDoRosto marcas={MARCAS_RETRATO} atraso={400} />}
        <LinearGradient
          colors={['#0c0c0c', 'rgba(12,12,12,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.6, y: 0 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          pointerEvents="none"
        />
      </View>
      <View className="flex-1 justify-end p-6" style={{ maxWidth: largo ? 460 : '70%' }}>
        <View className="mb-4 h-px w-8 bg-latao" />
        <Text className="font-sans text-ui text-marfim/75">{saudacao()},</Text>
        <Text
          className="font-display text-marfim"
          style={{ fontSize: largo ? 48 : 36, lineHeight: largo ? 54 : 42 }}
          numberOfLines={1}
        >
          {primeiroNome(usuario?.nome) || 'Stewer'}.
        </Text>
        <Text className="mt-3 font-sans text-ui" style={{ color: MARFIM, opacity: 0.85 }}>
          {frase}
        </Text>
      </View>
    </View>
  );
}

/** Os horarios de hoje, em ordem: hora grande, cliente e servico. Toque abre o horario. */
function Hoje({ lista, aoAbrir }: { lista: Agendamento[]; aoAbrir: (id: string) => void }) {
  if (lista.length === 0) return null;
  const agora = Date.now();
  return (
    <View className="mt-10">
      <Text accessibilityRole="header" className="font-display text-ds-24 text-texto">
        Hoje
      </Text>
      <View className="mt-3">
        {lista.slice(0, 6).map((a) => {
          const passou = Date.parse(a.fim ?? '') < agora && a.status !== 'AGENDADO';
          return (
            <View
              key={a.id}
              className={cn(
                'flex-row items-center gap-2 border-b border-borda',
                passou && 'opacity-50'
              )}
            >
              <Pressable
                onPress={() => a.id && aoAbrir(a.id)}
                accessibilityRole="button"
                accessibilityLabel={`${formatHora(a.inicio)}, ${a.clienteNome ?? 'cliente'}, ${a.servicoNome ?? ''}`}
                className="flex-1 flex-row items-center gap-4 py-4"
                style={({ pressed }) => (pressed ? { opacity: 0.6 } : null)}
              >
                <Text className="w-16 font-display text-ds-20 text-latao">
                  {formatHora(a.inicio)}
                </Text>
                <View className="flex-1">
                  <Text className="font-sans-medium text-ui text-texto" numberOfLines={1}>
                    {a.clienteNome}
                  </Text>
                  <Text className="font-sans text-ui-sm text-texto-3" numberOfLines={1}>
                    {a.servicoNome}
                    {a.status === 'CONCLUIDO'
                      ? ', atendido'
                      : a.status === 'NAO_COMPARECEU'
                        ? ', faltou'
                        : ''}
                    {a.primeiraVisita && a.status === 'AGENDADO' ? ', primeira vez' : ''}
                  </Text>
                </View>
              </Pressable>
              {/* deu a hora e ainda esta marcado: a baixa fica ali mesmo */}
              <Baixa item={a} compacto />
            </View>
          );
        })}
      </View>
    </View>
  );
}

/** Um numero da semana num quadro. */
function Quadro({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <View className={cn('p-1', className)}>
      <View className="h-full rounded-[3px] bg-superficie p-5">{children}</View>
    </View>
  );
}

function Atalho({
  titulo,
  texto,
  icone,
  aoTocar,
  rotulo,
  largura,
}: {
  titulo: string;
  texto: string;
  icone: ReactNode;
  aoTocar: () => void;
  rotulo?: string;
  largura: string;
}) {
  return (
    <View className="p-1" style={{ width: largura as `${number}%` }}>
      <Pressable
        onPress={aoTocar}
        accessibilityRole="link"
        accessibilityLabel={rotulo ?? titulo}
        className="h-full gap-3 rounded-[3px] border border-borda p-4"
        style={({ pressed }) => (pressed ? { opacity: 0.75 } : null)}
      >
        {icone}
        <View>
          <Text className="font-sans-semibold text-ui text-texto">{titulo}</Text>
          <Text className="font-sans text-ui-sm text-texto-3">{texto}</Text>
        </View>
      </Pressable>
    </View>
  );
}

export default function VisaoGeral() {
  const router = useRouter();
  const largo = useLayoutLargo();
  const cores = useCores();
  const hoje = hojeCalendarDate();
  const semana = useMemo(() => semanaDe(hoje), [hoje]);
  const agora = new Date();

  const profissionais = useProfissionais(false);
  const ids = useMemo(
    () => (profissionais.data ?? []).map((p) => p.id).filter((x): x is string => !!x),
    [profissionais.data]
  );

  const agenda = useAgendaDeVariosDias(semana, ids);
  const grades = useDisponibilidadesDe(ids);
  const clientes = useTodosClientes();

  // --- 1. agendamentos na semana + barras por dia ---
  const porDia = useMemo(
    () => semana.map((d) => (agenda.porDia.get(d) ?? []).filter(conta)),
    [semana, agenda.porDia]
  );
  const totalSemana = porDia.reduce((n, l) => n + l.length, 0);
  const maxDia = Math.max(1, ...porDia.map((l) => l.length));

  // --- 2. ocupacao: minutos agendados / minutos ofertados pela grade ---
  const ocupacao = useMemo(() => {
    let ofertados = 0;
    for (const dia of semana) {
      const ds = diaSemanaDe(dia);
      for (const grade of grades.grades) {
        for (const f of grade) {
          if (f.diaSemana !== ds) continue;
          const i = wallTimeParaMinutos(f.horaInicio);
          const fim = wallTimeParaMinutos(f.horaFim);
          if (i !== null && fim !== null && fim > i) ofertados += fim - i;
        }
      }
    }
    const usados = porDia.flat().reduce((n, a) => n + (a.duracaoMinutos ?? 0), 0);
    if (ofertados === 0) return null;
    return Math.min(100, Math.round((usados / ofertados) * 100));
  }, [semana, grades.grades, porDia]);

  // --- 3. clientes novos no mes vs. mes anterior ---
  const novos = useMemo(() => {
    const lista = clientes.data ?? [];
    const esteMes = lista.filter((c) => noMesmoMesLocal(c.createdAt, agora)).length;
    const anterior = lista.filter((c) => noMesmoMesLocal(c.createdAt, mesAnterior(agora))).length;
    return { esteMes, anterior, delta: esteMes - anterior };
    // `agora` e recriado a cada render de proposito: o mes muda com o relogio
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientes.data]);

  // --- 4. receita estimada da semana (centavos inteiros) ---
  const receita = somaCentavos(porDia.flat().map((a) => a.precoCentavos));

  const carregando = profissionais.isLoading || agenda.carregando;
  const erro = profissionais.error ?? agenda.erro;
  const refetch = () => {
    void profissionais.refetch();
    agenda.refetch();
    void clientes.refetch();
  };

  const deHoje = useMemo(
    () =>
      [...(agenda.porDia.get(hoje) ?? [])]
        .filter(conta)
        .sort((a, b) => Date.parse(a.inicio ?? '') - Date.parse(b.inicio ?? '')),
    [agenda.porDia, hoje]
  );
  const larguraQuadro = largo ? 'w-1/4' : 'w-1/2';
  const numero = 'font-display text-[44px] leading-[48px] text-texto';
  const legenda = 'mt-2 font-sans text-ui-sm text-texto-3';

  return (
    <TelaRolavel
      insetInferior={false}
      refreshControl={
        <RefreshControl
          refreshing={agenda.carregando && !!agenda.porDia.size}
          onRefresh={refetch}
        />
      }
    >
      <View className="pt-10">
        {/* O perfil (e o sair) na linha de cima: o ADMIN nao tem aba de perfil. */}
        <View className="flex-row items-center justify-between">
          <Text className="font-sans-medium text-ui-sm text-texto-3">Painel</Text>
          <AtalhoDoPerfil aoTocar={() => router.push('/conta' as never)} />
        </View>

        <Heroi hoje={deHoje} carregando={carregando} />
        <Hoje lista={deHoje} aoAbrir={(id) => router.push(`/agendamento/${id}` as never)} />

        <View className="mt-12 flex-row items-end justify-between">
          <Text accessibilityRole="header" className="font-display text-ds-24 text-texto">
            Esta semana
          </Text>
          <LabelCaps papel="meta">
            {formatFaixaDiasCaps(semana[0] ?? hoje, semana[6] ?? hoje)}
          </LabelCaps>
        </View>

        {carregando ? (
          <Carregando className="mt-8" />
        ) : erro ? (
          <EstadoErro className="mt-8" erro={erro} aoTentarDeNovo={refetch} />
        ) : ids.length === 0 ? (
          <Text className="mt-6 font-sans text-ui text-texto-3">
            Sem profissionais ativos: não há agenda para somar. Cadastre a equipe na aba Equipe.
          </Text>
        ) : (
          <View className="mt-4 flex-row flex-wrap" style={{ marginHorizontal: -4 }}>
            {/* 1. agendamentos na semana, com as barras por dia */}
            <Quadro className={larguraQuadro}>
              <NumeroAnimado valor={totalSemana} className={numero} />
              <Text className={legenda}>agendamentos</Text>
              <View className="mt-4 flex-row items-end gap-[6px]">
                {porDia.map((lista, i) => {
                  const dia = semana[i] as CalendarDate;
                  const altura = Math.max(2, Math.round((lista.length / maxDia) * 34));
                  return (
                    <View key={dia} className="items-center gap-1">
                      <View
                        className={cn('w-3', dia === hoje ? 'bg-latao' : 'bg-borda')}
                        style={{ height: altura }}
                        accessibilityLabel={`${lista.length} em ${dia}`}
                      />
                      <Text className="font-sans-semibold text-micro text-texto-3">
                        {LETRAS[i]}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </Quadro>

            {/* 2. taxa de ocupacao */}
            <Quadro className={larguraQuadro}>
              {ocupacao === null ? (
                <Text className={numero}>sem grade</Text>
              ) : (
                <NumeroAnimado valor={ocupacao} sufixo="%" className={numero} />
              )}
              <Text className={legenda}>da agenda ocupada</Text>
              <View className="mt-4 h-[3px] rounded-full bg-borda">
                <View
                  className="h-full rounded-full bg-latao"
                  style={{ width: `${ocupacao ?? 0}%` }}
                />
              </View>
              {grades.erro ? (
                <Text className="mt-3 font-sans text-ui-sm text-cadeira">
                  {grades.erro.message}
                </Text>
              ) : null}
            </Quadro>

            {/* 3. clientes novos no mes */}
            <Quadro className={larguraQuadro}>
              {clientes.data ? (
                <NumeroAnimado valor={novos.esteMes} className={numero} />
              ) : (
                <Text className={numero}>…</Text>
              )}
              <Text className={legenda}>clientes novos no mês</Text>
              {clientes.data ? (
                <Text className="mt-3 font-sans-medium text-ui-sm text-latao">
                  {novos.delta >= 0 ? `+${novos.delta}` : `${novos.delta}`} vs.{' '}
                  {nomeMesCaps(mesAnterior(agora)).toLowerCase()}
                </Text>
              ) : null}
              {clientes.error ? (
                <Text className="mt-3 font-sans text-ui-sm text-cadeira">
                  {clientes.error.message}
                </Text>
              ) : null}
            </Quadro>

            {/* 4. receita estimada */}
            <Quadro className={larguraQuadro}>
              {/* sem centavos e com o R$ pequeno: cabe no quadro mesmo com quatro digitos */}
              <Text className={numero} numberOfLines={1}>
                <Text className="font-display text-ds-20 text-texto-3">R$ </Text>
                {formatCentavosCurto(Math.round(receita / 100) * 100)}
              </Text>
              <Text className={legenda}>receita estimada da semana</Text>
            </Quadro>
          </View>
        )}

        <Relacionamento />

        <Text accessibilityRole="header" className="mt-14 font-display text-ds-24 text-texto">
          Atalhos
        </Text>
        <View className="mt-4 flex-row flex-wrap" style={{ marginHorizontal: -4 }}>
          <Atalho
            largura={largo ? '25%' : '50%'}
            titulo="Financeiro"
            texto="Faturado, a receber e gráficos"
            icone={<IconeDaAba rota="financeiro" cor={cores.gold} />}
            aoTocar={() => router.push('/financeiro' as never)}
            rotulo="Abrir o financeiro"
          />
          <Atalho
            largura={largo ? '25%' : '50%'}
            titulo="Estúdio"
            texto="Retrato, fotos, endereço e contatos"
            icone={<IconeDaAba rota="estudio" cor={cores.gold} />}
            aoTocar={() => router.push('/estudio' as never)}
            rotulo="Abrir o estúdio"
          />
          <Atalho
            largura={largo ? '25%' : '50%'}
            titulo="Auditoria"
            texto="Quem fez o quê e quando"
            icone={<IconeDaAba rota="auditoria" cor={cores.gold} />}
            aoTocar={() => router.push('/auditoria' as never)}
            rotulo="Abrir a auditoria"
          />
          <Atalho
            largura={largo ? '25%' : '50%'}
            titulo="Painel do site"
            texto="Portfólio, cursos e textos"
            icone={<IconeDaAba rota="visao-geral" cor={cores.gold} />}
            aoTocar={() => void Linking.openURL(`${SITE_DO_STEWER}/admin`)}
          />
          <Atalho
            largura={largo ? '25%' : '50%'}
            titulo="Ver o site"
            texto="stewergabriel.com"
            icone={<IconeDaAba rota="inicio" cor={cores.gold} />}
            aoTocar={() => void Linking.openURL(SITE_DO_STEWER)}
          />
          <Atalho
            largura={largo ? '25%' : '50%'}
            titulo="Agenda do mês"
            texto="Semana, mês e escolher data"
            icone={<IconeDaAba rota="agenda" cor={cores.gold} />}
            aoTocar={() => router.push('/agenda' as never)}
          />
        </View>
      </View>
    </TelaRolavel>
  );
}
