# Stewer Gabriel — Mapa de navegação e árvore de rotas (Expo Router)

Fonte: `c:/Users/Gustavo/Documents/stewer-app/stewer-agenda-app/design/Stewer Gabriel App.dc.html`
(19 frames de 390x844, CSS inline, sem `:root`; `support.js` e `image-slot.js` ignorados).
API: `c:/Users/Gustavo/Documents/stewer-app/stewer-agenda-app/openapi.yaml`.
Projeto: `expo-router ~57.0.20`, `expo ~57.0.21`, `@tanstack/react-query ^5.102.8`, `expo-secure-store`, `nativewind`.
A pasta `app/` do projeto está **vazia** hoje — toda a árvore abaixo é a criar.

Todos os valores de CSS abaixo são transcritos **literalmente** do arquivo (nada arredondado) e
todo texto de tela está transcrito **literalmente**, com acentuação.

---

## 1. Inventário: 17 telas únicas em 19 frames

| Frame | `data-screen-label` | Papel | Tab bar? | Cabeçalho / voltar |
|---|---|---|---|---|
| 01 | `01 Splash` | — (pré-sessão) | não | nenhum controle |
| 02 | `02 Acesso` | — (pré-sessão) | não | nenhum controle (abas internas `ENTRAR` / `CRIAR CONTA`) |
| 03 | `03 Home do cliente` | CLIENTE | sim (4) — `INÍCIO` ativa | nenhum |
| 04 | `04 Escolha de serviço` | CLIENTE | **não** | `←` + `PASSO 01 DE 04` |
| 05 | `05 Escolha de profissional` | CLIENTE | **não** | `←` + `PASSO 02 DE 04` |
| 06 | `06 Data e horário` | CLIENTE | **não** | `←` + `PASSO 03 DE 04` |
| 07 | `07 Confirmação` | CLIENTE | **não** | `←` + `PASSO 04 DE 04` |
| 08 | `08 Meus agendamentos` | CLIENTE | sim (4) — `MEUS HORÁRIOS` ativa | nenhum |
| 09 | `09 Perfil do cliente` | CLIENTE | sim (4) — `PERFIL` ativa | nenhum |
| 10 | `10 Agenda do dia` | PROFISSIONAL | sim (3) — `AGENDA` ativa | nenhum (setas `‹` `›` de dia no corpo) |
| 11 | `11 Detalhe do agendamento` | PROFISSIONAL (compartilhável) | **não** | `←` + `AGENDA · HOJE` |
| 12 | `12 Disponibilidade` | PROFISSIONAL (compartilhada c/ ADMIN) | sim (3) — `DISPONIBILIDADE` ativa | nenhum |
| 13 | `13 Lista de clientes` | PROFISSIONAL | sim (3) — `CLIENTES` ativa | nenhum |
| 14 | `14 Ficha do cliente` | PROFISSIONAL (compartilhável c/ ADMIN) | **não** | `←` + `CLIENTES` |
| 15 | `15 Dashboard` | ADMIN | sim (3) — `VISÃO GERAL` ativa | nenhum |
| 16 | `16 Gestão de serviços` | ADMIN | sim (3) — `SERVIÇOS` ativa | nenhum |
| 17 | `17 Gestão de equipe` | ADMIN | sim (3) — `EQUIPE` ativa | nenhum |
| 18 | `18 Home light` | CLIENTE | sim (4) — `INÍCIO` ativa | **variante light do frame 03, não é tela nova** |
| 19 | `19 Data e horário light` | CLIENTE | não | **variante light do frame 06, não é tela nova** (mesmo `PASSO 03 DE 04`) |

Seções do board: linha 44 `01 — PERFIL CLIENTE` / `Jornada do cliente · 9 telas`; linha 329
`02 — PERFIL PROFISSIONAL` / `Painel do visagista · 5 telas`; linha 505 `03 — PERFIL ADMIN` /
`Gestão do ateliê · 3 telas`; linha 631 `04 — VARIANTES LIGHT` / `Modo claro · 2 telas`.

---

## 2. Tab bars — item por item, label exato

O contêiner é idêntico nas três tab bars (dark):

```
position:absolute;left:0;right:0;bottom:0;background:#0A0A0A;border-top:1px solid rgba(241,235,224,.1)
  linha de itens: display:flex;padding:16px 8px 4px
  cada item:      flex:1;display:flex;flex-direction:column;align-items:center;gap:7px
    indicador:    width:14px;height:1px  -> ativo: background:var(--gold,#C9A96A) | inativo: sem background
    label:        font-size:9px;font-weight:600;letter-spacing:.14em
                  ativo:   color:var(--gold,#C9A96A)
                  inativo: color:rgba(241,235,224,.4)
  home indicator: width:118px;height:4px;border-radius:99px;background:rgba(241,235,224,.2);margin:10px auto 8px
```

Light (frame 18): `background:#F1EBE0`, `border-top:1px solid rgba(10,10,10,.12)`, label ativo
`color:#A8894F` e indicador `background:#A8894F`, label inativo `color:rgba(10,10,10,.45)`,
home indicator `background:rgba(10,10,10,.22)`.

**Não existe ícone em nenhuma tab bar** — só o traço de 14x1px acima do label em caps.

### CLIENTE — 4 itens
`INÍCIO` · `AGENDAR` · `MEUS HORÁRIOS` · `PERFIL`
- frame 03 -> `INÍCIO` ativo
- frame 08 -> `MEUS HORÁRIOS` ativo
- frame 09 -> `PERFIL` ativo
- frame 18 (light) -> `INÍCIO` ativo
- frames 04, 05, 06, 07 -> **sem tab bar** (o wizard é full-bleed)
- Nenhum frame mostra a tab `AGENDAR` ativa: ela abre o wizard, que esconde a barra.

### PROFISSIONAL — 3 itens
`AGENDA` · `CLIENTES` · `DISPONIBILIDADE`
- frame 10 -> `AGENDA` ativo
- frame 13 -> `CLIENTES` ativo
- frame 12 -> `DISPONIBILIDADE` ativo
- frames 11 e 14 -> **sem tab bar** (empilhadas, com `←`)
- **Não há tab de perfil/sair no painel do profissional** — lacuna de design a levantar com o cliente.

### ADMIN — 3 itens
`VISÃO GERAL` · `SERVIÇOS` · `EQUIPE`
- frame 15 -> `VISÃO GERAL` ativo
- frame 16 -> `SERVIÇOS` ativo
- frame 17 -> `EQUIPE` ativo
- **O ADMIN não tem tab de agenda nem de clientes** no design, apesar de a API dar acesso
  (`GET /agendamentos/agenda` exige `profissionalId` para ADMIN; `GET /clientes` é do estabelecimento).

As três barras são **diferentes** em quantidade e em labels: nada é reaproveitável entre papéis
além do componente de barra.

---

## 3. Cabeçalho de voltar (frames 04, 05, 06, 07, 11, 14, 19)

```
linha:  display:flex;justify-content:space-between;align-items:center;padding:20px 28px 0
seta:   "←"  font-size:19px;color:rgba(241,235,224,.75);cursor:pointer   (light: rgba(10,10,10,.7))
label:  font-size:9px;font-weight:600;letter-spacing:.24em;color:rgba(241,235,224,.45)  (light: rgba(10,10,10,.45))
```

Labels à direita, literais: `PASSO 01 DE 04`, `PASSO 02 DE 04`, `PASSO 03 DE 04`,
`PASSO 04 DE 04`, `AGENDA · HOJE` (frame 11), `CLIENTES` (frame 14).

O label do frame 11 (`AGENDA · HOJE`) e do 14 (`CLIENTES`) identifica **de onde a tela veio** — é
um breadcrumb da origem, não um título. Isso importa: a mesma rota `[id]` empilhada a partir de
outra origem deveria mostrar outro label (chegando de 13 -> 14 o label é `CLIENTES`; chegando de
11 -> 14 o design não desenha a variante, mas o breadcrumb deveria dizer a origem real).

---

## 4. Fluxo de agendamento do cliente — o indicador declara **4 passos**

```
03 Home do cliente
  +- [NOVO AGENDAMENTO]  (botão claro #F1EBE0 sobre #0A0A0A, letter-spacing .22em)
       v
     04 Escolha de serviço        PASSO 01 DE 04   "Escolha o serviço"
        toque em uma linha de serviço (cursor:pointer; 6 serviços listados)
       v
     05 Escolha de profissional   PASSO 02 DE 04   "Escolha o profissional"
        card único "Stewer Gabriel" já marcado SELECIONADO -> [CONTINUAR]
        nota literal: "Em breve, novos profissionais do ateliê."
       v
     06 Data e horário            PASSO 03 DE 04   "Data e horário"
        mês "Setembro 2026" com ‹ › ; dia 11 selecionado (borda dourada);
        "HORÁRIOS · SEXTA, 11 SET" ; slot 15:30 selecionado -> [CONTINUAR]
       v
     07 Confirmação               PASSO 04 DE 04   "Confirme os detalhes"
        [CONFIRMAR AGENDAMENTO]   -> sucesso
        [ALTERAR DATA OU HORÁRIO] -> volta ao passo 03 (frame 06)
```

- O indicador é literalmente `PASSO 01 DE 04` … `PASSO 04 DE 04`: **4 passos**, sendo a
  confirmação contada como passo. Não há tela de sucesso desenhada.
- `←` em cada passo volta um passo; em 04 volta para 03 (a home).
- Sobretítulo repetido em 04, 05 e 07: `NOVO AGENDAMENTO` (o frame 06 **não** tem esse sobretítulo,
  vai direto ao título `Data e horário`).
- O passo 02 é degenerado hoje (um profissional só, já selecionado). Dá para pular automaticamente
  quando `GET /profissionais` devolver 1 item — mas então o indicador mentiria. Recomendo manter os
  4 passos como desenhado e só pré-selecionar.
- Destino após `CONFIRMAR AGENDAMENTO`: o design não desenha sucesso. Proposta:
  `router.dismissTo('/(cliente)/(tabs)/meus-horarios')` + invalidar `['agendamentos','meus']`.

### Outros gatilhos do mesmo fluxo
- 03 `REPETIR` (linha `ÚLTIMA VISITA` -> `Corte & Barba · 14 de agosto`): entra no wizard já com
  serviço e profissional resolvidos => abrir direto em **06** (passo 03) com params.
- 03 `REAGENDAR` (card `PRÓXIMO AGENDAMENTO`): idem, abrir em 06.
- 14 `NOVO AGENDAMENTO PARA ESTE CLIENTE` (profissional/admin): entra em 04. **Sem suporte na API** —
  `POST /agendamentos` é descrito como "Cliente reserva um horario para si". Bloqueio de backend.

---

## 5. Todos os destinos de navegação, tela por tela (texto literal dos controles)

**01 Splash** — sem controles. Rodapé `STEWERGABRIEL.COM`. Marca: losango `SG`,
`STEWER GABRIEL`, `VISAGISMO & CONSULTORIA DE IMAGEM`. -> gate por papel.

**02 Acesso** — abas `ENTRAR` (ativa, `border-bottom:1px solid var(--gold,#C9A96A)`) /
`CRIAR CONTA` (`color:rgba(241,235,224,.4)`). Campos `E-MAIL` (`seunome@email.com`) e
`TELEFONE` (`+55 (11) 90000-0000`). CTA `CONTINUAR`. Abaixo:
`Enviaremos um código de confirmação.` Rodapé com links `Termos de uso` e `Política de privacidade`
(`Ao continuar, você aceita os … e a ….`).
ATENÇÃO — **divergência com a API:** o design não tem campo de senha e promete código de
confirmação (OTP), mas `POST /auth/login` e `POST /auth/registrar` são email/senha e não existe
endpoint de OTP. Também não há tela de "digite o código". Decisão de produto pendente.

**03 Home do cliente** -> `REAGENDAR` (-> 06), `DETALHES` (-> 11 na versão cliente),
`NOVO AGENDAMENTO` (-> 04), `REPETIR` (-> 06). Tabs -> 03 / wizard / 08 / 09.

**04 -> 05 -> 06 -> 07** conforme §4.

**08 Meus agendamentos** — seções `PRÓXIMOS` e `HISTÓRICO`; badges `CONFIRMADO`, `CONCLUÍDO`,
`CANCELADO`. **Nenhuma linha tem `cursor:pointer`** — o design não marca as linhas como tocáveis.
Mesmo assim o cliente precisa chegar ao detalhe (o botão `DETALHES` do frame 03 exige a tela);
recomendo tornar o card de `PRÓXIMOS` tocável -> 11 (versão cliente).

**09 Perfil do cliente** — `DADOS PESSOAIS` (E-mail, Telefone), `PREFERÊNCIAS`
(`Lembretes por WhatsApp` ligado, `Lembrete por e-mail` desligado, `Profissional preferido`),
`SAIR DA CONTA` -> volta a `(auth)`. Nenhuma linha navega para outra tela (toggles in-place).
Nenhum dos três itens de `PREFERÊNCIAS` tem endpoint na API.

**10 Agenda do dia** — `‹` `›` trocam o dia (`AGENDA · HOJE` / `Terça, 1 de setembro`,
`4 ATENDIMENTOS · 09:00 — 19:00`). Cards de atendimento (`background:#121110`, `cursor:pointer`)
-> 11. Blocos `DISPONÍVEL` (borda tracejada) e `INTERVALO` (`background:#0E0E0D`) **não** têm
`cursor:pointer` — não navegam.

**11 Detalhe do agendamento** — `←` -> 10. `VER FICHA COMPLETA` -> 14.
`CONCLUIR ATENDIMENTO` (botão primário) -> `PATCH /agendamentos/{id}/status`.
`REMARCAR` e `CANCELAR` (dois botões de contorno lado a lado).
Blocos: `SERVIÇO`/`VALOR`/`STATUS` (`CONFIRMADO`), `RESUMO DO CLIENTE` (`12 VISITAS`,
`Mar 2024 CLIENTE DESDE`, `14 Ago ÚLTIMA VISITA`), `ANOTAÇÕES DE VISAGISMO`.
`REMARCAR` não tem endpoint (não há PATCH de `inicio`): remarcar = cancelar + novo POST.

**12 Disponibilidade** — `DIAS DE ATENDIMENTO` (D S **T Q Q S S** — os 5 últimos com borda
dourada). `HORÁRIO DE TRABALHO`: linhas `Início` `09:00 ›`, `Término` `19:00 ›`,
`Intervalo` `12:30 — 13:30 ›` — as três com `cursor:pointer` e chevron => abrem seletor
(**modal não desenhado**). `BLOQUEIOS PONTUAIS`: dois cards
(`12 de setembro` / `DIA INTEIRO · CONGRESSO DE VISAGISMO`; `25 de setembro` / `A PARTIR DAS 16:00`),
cada um com `×` que remove. `ADICIONAR BLOQUEIO` -> **modal não desenhado**.

**13 Lista de clientes** — `Clientes` / `48 ATIVOS`, busca `Buscar por nome`; 7 linhas com
avatar de iniciais e `›`, todas `cursor:pointer` -> 14.

**14 Ficha do cliente** — `←` -> 13 (label `CLIENTES`). `ANOTAÇÕES DE VISAGISMO` com `EDITAR`
(-> modal não desenhado) e `ATUALIZADO EM 14 AGO · STEWER GABRIEL`. `HISTÓRICO DE VISITAS`
(5 linhas, sem `cursor:pointer` — não navegam). `NOVO AGENDAMENTO PARA ESTE CLIENTE` -> 04.

**15 Dashboard** — `VISÃO GERAL` / `Esta semana` / `31 AGO — 06 SET`; métricas `32`
`AGENDAMENTOS NA SEMANA`, `78%` `TAXA DE OCUPAÇÃO`, `9` `CLIENTES NOVOS NO MÊS` (`+3 VS. JULHO`),
`Receita estimada da semana` `R$ 7.240`. **Nenhum elemento navega** — tela puramente de leitura.
Nenhuma dessas métricas tem endpoint na API.

**16 Gestão de serviços** — `NOVO SERVIÇO` (botão de contorno no cabeçalho) e `EDITAR` por linha
(6 serviços) -> **modal/tela de edição não desenhada**. Nota:
`Serviços inativos não aparecem para os clientes.`

**17 Gestão de equipe** — `Equipe` / `1 PROFISSIONAL ATIVO`; card do profissional com `ATIVO`,
`AGENDA · TER — SÁB, 09:00 — 19:00` e `GERENCIAR` -> **frame 12 com o `profissionalId` do card**
(é aqui que 12 passa a ser compartilhada com o ADMIN). Bloco tracejado `+`
`ADICIONAR PROFISSIONAL` -> **fluxo de convite não desenhado**. Nota literal:
`O convite dá acesso ao painel do profissional,` / `com agenda e clientes próprios.`

**18 / 19** — variantes de tema, não rotas. Mesmos labels, mesmo `PASSO 03 DE 04`, mesma tab bar
de 4 itens. Detalhe exato do light: o dourado de **texto/indicador** vira `#A8894F`, mas as
**bordas** continuam `var(--gold,#C9A96A)` (dia 11 do frame 19: `color:#A8894F` com
`border:1px solid var(--gold,#C9A96A)`; card do frame 18: borda `#C9A96A`, label `#A8894F`).
Botão primário no light inverte: `background:#0A0A0A;color:#F1EBE0`.

---

## 6. Árvore de rotas proposta (`app/`)

```
app/
  _layout.tsx                          Stack raiz (headerShown:false) + QueryClientProvider
                                       + AuthProvider + expo-font (Playfair Display / Inter)
                                       + tema dark/light por tokens
  index.tsx                            [01 Splash] gate: lê token do SecureStore, GET /auth/eu,
                                       <Redirect> por role
  +not-found.tsx

  (auth)/
    _layout.tsx                        Stack
    entrar.tsx                         [02 Acesso · aba ENTRAR]
    criar-conta.tsx                    [02 Acesso · aba CRIAR CONTA]

  (cliente)/
    _layout.tsx                        Stack (protege role CLIENTE)
    (tabs)/
      _layout.tsx                      Tabs — 4 itens, sem ícone
      inicio.tsx                       [03 Home do cliente]           tab INÍCIO
      agendar.tsx                      placeholder da tab AGENDAR (tabPress interceptado)
      meus-horarios.tsx                [08 Meus agendamentos]         tab MEUS HORÁRIOS
      perfil.tsx                       [09 Perfil do cliente]         tab PERFIL
    novo-agendamento/
      _layout.tsx                      Stack (fora das Tabs => sem tab bar, como no design)
      servico.tsx                      [04] PASSO 01 DE 04
      profissional.tsx                 [05] PASSO 02 DE 04
      horario.tsx                      [06] PASSO 03 DE 04
      confirmar.tsx                    [07] PASSO 04 DE 04

  (profissional)/
    _layout.tsx                        Stack (protege role PROFISSIONAL)
    (tabs)/
      _layout.tsx                      Tabs — 3 itens
      agenda.tsx                       [10 Agenda do dia]             tab AGENDA
      clientes.tsx                     [13 Lista de clientes]         tab CLIENTES
      disponibilidade.tsx              [12 Disponibilidade] (próprio) tab DISPONIBILIDADE

  (admin)/
    _layout.tsx                        Stack (protege role ADMIN)
    (tabs)/
      _layout.tsx                      Tabs — 3 itens
      visao-geral.tsx                  [15 Dashboard]                 tab VISÃO GERAL
      servicos.tsx                     [16 Gestão de serviços]        tab SERVIÇOS
      equipe.tsx                       [17 Gestão de equipe]          tab EQUIPE

  # ---- telas empilhadas COMPARTILHADAS (nível raiz: qualquer grupo empilha por cima) ----
  agendamento/
    [id].tsx                           [11 Detalhe do agendamento]  CLIENTE + PROFISSIONAL
  cliente/
    [id].tsx                           [14 Ficha do cliente]        PROFISSIONAL + ADMIN
  profissional/
    [id]/disponibilidade.tsx           [12 Disponibilidade] via ADMIN (17 GERENCIAR)

  # ---- modais (não desenhados; inferidos dos controles) ----
  (modais)/
    _layout.tsx                        Stack com presentation:"modal"
    bloqueio.tsx                       12 ADICIONAR BLOQUEIO
    horario-trabalho.tsx               12 Início / Término / Intervalo (chevron ›)
    servico/[id].tsx                   16 NOVO SERVIÇO ("novo") e EDITAR
    anotacao/[clienteId].tsx           14 EDITAR (ANOTAÇÕES DE VISAGISMO)
    convidar-profissional.tsx          17 ADICIONAR PROFISSIONAL
```

### Por que essa forma
- **`(tabs)` dentro do grupo do papel, e não na raiz.** As três tab bars têm quantidade e labels
  diferentes; um `Tabs` único com telas condicionais vazaria estado entre papéis e complicaria o
  reset ao trocar de conta. Um `Tabs` por papel torna o `_layout` de cada grupo o lugar natural do
  guard de role.
- **Wizard fora das Tabs.** Frames 04–07 não têm tab bar. Deixar `novo-agendamento/` como irmão de
  `(tabs)/` dentro de `(cliente)/` dá full-bleed sem hack de `tabBarStyle:{display:'none'}`.
- **Tab `AGENDAR` como placeholder.** No `(cliente)/(tabs)/_layout.tsx`:
  `<Tabs.Screen name="agendar" listeners={{ tabPress: e => { e.preventDefault();
  router.push('/(cliente)/novo-agendamento/servico'); } }} />`. A tela `agendar.tsx` nunca renderiza
  (pode ser um `<Redirect>` defensivo). Assim o item aparece na barra com o label exato `AGENDAR`
  sem virar uma aba com estado próprio.
- **Compartilhadas na raiz.** `agendamento/[id]` e `cliente/[id]` ficam fora dos grupos de papel
  porque são empilhadas por mais de um papel; na raiz, `router.push('/agendamento/abc')` funciona
  de qualquer grupo e o `←` é `router.back()` para a origem real — que é justamente o que o
  breadcrumb `AGENDA · HOJE` / `CLIENTES` representa (passe-o como param `origem`).
- **Disponibilidade em duas rotas, uma tela.** `src/features/disponibilidade/DisponibilidadeScreen.tsx`
  recebe `profissionalId`; a rota de tab passa o id do próprio usuário (`/auth/eu`), a rota
  `profissional/[id]/disponibilidade` passa o id do card do frame 17. Sem duplicação de UI e sem
  uma tab de disponibilidade no ADMIN (que o design não tem).
- **Labels de tab literais.** `tabBarLabel` deve receber exatamente
  `INÍCIO`, `AGENDAR`, `MEUS HORÁRIOS`, `PERFIL`, `AGENDA`, `CLIENTES`, `DISPONIBILIDADE`,
  `VISÃO GERAL`, `SERVIÇOS`, `EQUIPE` — com acento e em caps, `fontSize:9`, `fontWeight:'600'`,
  `letterSpacing` equivalente a `.14em` (1.26 em 9px). Sem `tabBarIcon`, e o traço de 14x1px
  como indicador customizado dentro do próprio `tabBarLabel`/`tabBarButton`.

### Tabela rota × tela

| Frame | Rota | Tipo | Papel | Compartilhada? |
|---|---|---|---|---|
| 01 | `app/index.tsx` | stack (raiz) | — | — |
| 02 | `app/(auth)/entrar.tsx` | stack | — | — |
| 02 | `app/(auth)/criar-conta.tsx` | stack | — | — |
| 03 | `app/(cliente)/(tabs)/inicio.tsx` | **tab** `INÍCIO` | CLIENTE | não |
| 04 | `app/(cliente)/novo-agendamento/servico.tsx` | stack | CLIENTE | não |
| 05 | `app/(cliente)/novo-agendamento/profissional.tsx` | stack | CLIENTE | não |
| 06 | `app/(cliente)/novo-agendamento/horario.tsx` | stack | CLIENTE | não |
| 07 | `app/(cliente)/novo-agendamento/confirmar.tsx` | stack | CLIENTE | não |
| 08 | `app/(cliente)/(tabs)/meus-horarios.tsx` | **tab** `MEUS HORÁRIOS` | CLIENTE | não |
| 09 | `app/(cliente)/(tabs)/perfil.tsx` | **tab** `PERFIL` | CLIENTE | não |
| 10 | `app/(profissional)/(tabs)/agenda.tsx` | **tab** `AGENDA` | PROFISSIONAL | não |
| 11 | `app/agendamento/[id].tsx` | stack | PROFISSIONAL + CLIENTE | **sim** (ações por papel) |
| 12 | `app/(profissional)/(tabs)/disponibilidade.tsx` | **tab** `DISPONIBILIDADE` | PROFISSIONAL | **sim** (mesma tela) |
| 12 | `app/profissional/[id]/disponibilidade.tsx` | stack | ADMIN | **sim** (mesma tela) |
| 13 | `app/(profissional)/(tabs)/clientes.tsx` | **tab** `CLIENTES` | PROFISSIONAL | não |
| 14 | `app/cliente/[id].tsx` | stack | PROFISSIONAL + ADMIN | **sim** |
| 15 | `app/(admin)/(tabs)/visao-geral.tsx` | **tab** `VISÃO GERAL` | ADMIN | não |
| 16 | `app/(admin)/(tabs)/servicos.tsx` | **tab** `SERVIÇOS` | ADMIN | não |
| 17 | `app/(admin)/(tabs)/equipe.tsx` | **tab** `EQUIPE` | ADMIN | não |
| — | `app/(modais)/bloqueio.tsx` | **modal** | PROFISSIONAL + ADMIN | sim (inferida) |
| — | `app/(modais)/horario-trabalho.tsx` | **modal** | PROFISSIONAL + ADMIN | sim (inferida) |
| — | `app/(modais)/servico/[id].tsx` | **modal** | ADMIN | não (inferida) |
| — | `app/(modais)/anotacao/[clienteId].tsx` | **modal** | PROFISSIONAL | não (inferida) |
| — | `app/(modais)/convidar-profissional.tsx` | **modal** | ADMIN | não (inferida) |
| 18 | (tema) | — | CLIENTE | variante light de 03 |
| 19 | (tema) | — | CLIENTE | variante light de 06 |

### Gate de entrada (frame 01)
`app/index.tsx` renderiza a splash desenhada (losango `SG`, `STEWER GABRIEL`,
`VISAGISMO & CONSULTORIA DE IMAGEM`, `STEWERGABRIEL.COM`) enquanto resolve sessão, e então:

```
sem token               -> <Redirect href="/(auth)/entrar" />
role === 'CLIENTE'      -> <Redirect href="/(cliente)/(tabs)/inicio" />
role === 'PROFISSIONAL' -> <Redirect href="/(profissional)/(tabs)/agenda" />
role === 'ADMIN'        -> <Redirect href="/(admin)/(tabs)/visao-geral" />
```

`SAIR DA CONTA` (09) limpa SecureStore + `queryClient.clear()` + `router.replace('/(auth)/entrar')`.
Cada `_layout.tsx` de grupo de papel repete o guard (defesa em profundidade contra deep link).

---

## 7. Frame 11 sem `GET /agendamentos/{id}` — como alimentar a tela

A API tem `POST /agendamentos`, `GET /agendamentos/agenda?data=`, `GET /agendamentos/meus?periodo=`
e `PATCH /agendamentos/{id}/status`. **Não há GET por id.** Mas os dois GETs de lista devolvem
`Agendamento` **completo**: `id, clienteId, clienteNome, profissionalId, profissionalNome,
servicoId, servicoNome, duracaoMinutos, precoCentavos, inicio, fim, status, observacao, createdAt`
— e o `PATCH .../status` também devolve o objeto atualizado. Ou seja: o item da lista já contém
tudo do cabeçalho e do card `SERVIÇO`/`VALOR`/`STATUS` do frame 11.

O resto do frame 11 **não vem** do agendamento e sim de outros endpoints, com o `clienteId` que o
item já carrega:
- `RESUMO DO CLIENTE` (`12 VISITAS`, `Mar 2024 CLIENTE DESDE`, `14 Ago ÚLTIMA VISITA`) ->
  `GET /clientes/{clienteId}` (`ClienteDetalhe`, "Ficha do cliente com o historico de atendimentos").
- `ANOTAÇÕES DE VISAGISMO` -> `GET /clientes/{clienteId}/anotacoes` (mais nova primeiro).

### Recomendado: cache do TanStack Query, com semeadura + fallback pela lista

Params da rota: **só identificadores curtos**, nunca o objeto.

```
/agendamento/[id]?origem=agenda|meus&dia=2026-09-01
```

1. **Semear no toque da linha.** Em 10 (ou no card de 08 / no `DETALHES` de 03), antes do push:
   `queryClient.setQueryData(['agendamento', item.id], item)`.
2. **Ler com `useQuery` cujo `queryFn` é o fallback, não um GET inexistente.**
   `useQuery({ queryKey:['agendamento', id], queryFn: () => recuperarDaLista(id, origem, dia),
   staleTime: 30_000 })`, onde `recuperarDaLista` garante `['agendamentos','agenda',dia]` (ou
   `['agendamentos','meus',periodo]`) com `queryClient.ensureQueryData(...)` e faz
   `find(a => a.id === id)`; se não achar, erro "agendamento não encontrado" e volta.
3. **Por que o fallback é obrigatório:** cold start por deep link/notificação, reload no dev, e o
   app retomado depois de o SO matar o processo — nesses casos o cache não existe. `origem` e `dia`
   (derivado de `inicio` com `date-fns`, `yyyy-MM-dd`) são exatamente o mínimo para reconstruir a
   query de lista certa.
4. **Depois do `PATCH /agendamentos/{id}/status`** (`CONCLUIR ATENDIMENTO`, `CANCELAR`), escrever a
   resposta em `['agendamento', id]` **e** dentro do array em `['agendamentos','agenda',dia]` /
   `['agendamentos','meus',periodo]` (ou invalidar as duas chaves). Isso é o que evita o card
   `STATUS · CONFIRMADO` ficar velho ao voltar para a agenda.

### Alternativas avaliadas
- **Params serializados (objeto inteiro em JSON na URL): rejeitado.** Dado imutável e opaco:
  depois do `PATCH` o `STATUS` da tela discorda do servidor; datas e acentos viram encoding; o
  histórico do router guarda cópias divergentes do mesmo agendamento; deep link fica ilegível; e no
  Android há limite prático de tamanho de intent/URL. Só serve para um ou dois campos.
- **Store leve (Zustand) como hand-off: não recomendado sozinho.** Funciona no caminho felizinho
  (lista -> detalhe) e é fácil, mas perde deep link e cold start, cria uma segunda fonte de verdade
  ao lado do cache das listas e obriga sincronização manual após mutação. Se for usado, que seja só
  como espelho do cache, nunca como dono do dado.
- **Pedir `GET /agendamentos/{id}` ao backend: desejável.** É a solução limpa para deep link
  (`stewer://agendamento/{id}` a partir de push de lembrete). Enquanto não existir, o esquema acima
  é suficiente porque as listas trazem o objeto completo. Registrar como pendência de API.

### Frames 14 e 12 não têm esse problema
`GET /clientes/{id}` existe => `cliente/[id].tsx` só precisa do `id` no param.
`GET /profissionais/{profissionalId}/disponibilidade` e `.../bloqueios` existem =>
`profissional/[id]/disponibilidade` só precisa do `id`.

---

## 8. Grafo de navegação consolidado

```
                    +-------------+
                    | 01 Splash   |  app/index.tsx (gate)
                    +--+-------+--+
              sem token|       |com token -> por role
                       v       v
              +------------+  +----------------------------------------------+
              | 02 Acesso  |  |  CLIENTE          PROFISSIONAL        ADMIN  |
              | ENTRAR /   |->|  03 inicio        10 agenda       15 visão   |
              | CRIAR CONTA|  +----------------------------------------------+
              +------------+

CLIENTE  (tabs: INÍCIO · AGENDAR · MEUS HORÁRIOS · PERFIL)
  03 --NOVO AGENDAMENTO--> 04 --> 05 --> 06 --> 07 --CONFIRMAR AGENDAMENTO--> 08
  03 --REAGENDAR / REPETIR----------------> 06
  07 --ALTERAR DATA OU HORÁRIO--> 06
  03 --DETALHES--> 11 (variante cliente)       08 --(card PRÓXIMOS)--> 11
  09 --SAIR DA CONTA--> 02

PROFISSIONAL  (tabs: AGENDA · CLIENTES · DISPONIBILIDADE)
  10 --(card de atendimento)--> 11 --VER FICHA COMPLETA--> 14
  11 --CONCLUIR ATENDIMENTO / CANCELAR--> PATCH status (permanece; <- volta a 10)
  13 --(linha ›)--> 14 --NOVO AGENDAMENTO PARA ESTE CLIENTE--> 04
  14 --EDITAR--> (modal anotação)
  12 --Início/Término/Intervalo ›--> (modal horário)   12 --ADICIONAR BLOQUEIO--> (modal)

ADMIN  (tabs: VISÃO GERAL · SERVIÇOS · EQUIPE)
  15 (sem navegação)
  16 --NOVO SERVIÇO / EDITAR--> (modal serviço)
  17 --GERENCIAR--> 12 (com profissionalId)   17 --ADICIONAR PROFISSIONAL--> (modal convite)
```

---

## 9. Lacunas de navegação a decidir antes de codificar

1. **02 Acesso promete OTP** (`Enviaremos um código de confirmação.`) e não tem senha, mas a API é
   `POST /auth/login` (email/senha) + `POST /auth/registrar`. Falta a tela do código.
2. **PROFISSIONAL não tem tab de perfil nem `SAIR DA CONTA`**; ADMIN também não. Precisa de um
   caminho de logout para os dois papéis (tab extra, ou ação no cabeçalho).
3. **ADMIN não tem acesso a agenda nem a clientes** pela tab bar desenhada, embora a API permita
   (`/agendamentos/agenda?profissionalId=`, `/clientes`). Chegar ao frame 14 como ADMIN hoje só
   seria possível por deep link.
4. **`REMARCAR` (11) e `REAGENDAR` (03) não têm endpoint** — remarcar = `PATCH status CANCELADO`
   + `POST /agendamentos`. Fluxo de 2 etapas a desenhar.
5. **Sem tela de sucesso** após `CONFIRMAR AGENDAMENTO` e sem confirmação destrutiva antes de
   `CANCELAR` / do `×` de bloqueio.
6. **08 não marca linhas como tocáveis** mas o cliente precisa do detalhe (via `DETALHES` do 03).
7. **`ANOTAÇÕES DE VISAGISMO` e `RESUMO DO CLIENTE` no frame 11** são conteúdo do profissional; se
   `agendamento/[id]` for compartilhada com o CLIENTE, esses blocos devem ser escondidos por papel.
8. **Métricas do 15 e preferências do 09 não têm endpoint** — sem impacto em rotas, mas bloqueiam
   as telas.
9. **`14 NOVO AGENDAMENTO PARA ESTE CLIENTE`** exige agendamento em nome de terceiro, que
   `POST /agendamentos` não suporta ("Cliente reserva um horario para si").
