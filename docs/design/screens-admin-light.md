# Spec de telas — PERFIL ADMIN (15–17) e VARIANTES LIGHT (18–19)

Fonte: `c:\Users\Gustavo\Documents\stewer-app\stewer-agenda-app\design\Stewer Gabriel App.dc.html`
Faixas lidas: 505–630 (ADMIN) e 631–764 (LIGHT), mais 86–124 (03 dark) e 171–230 (06 dark) para a comparação.
API de referência: `c:\Users\Gustavo\Documents\stewer-app\stewer-agenda-app\openapi.yaml`

Todos os valores abaixo são **literais do arquivo**. Onde o design usa `var(--x, fallback)` isso está
transcrito como está — não existe `:root` no HTML, então na prática vale sempre o fallback, exceto
quando o script `data-dc-script` do editor sobrescreve `--gold`, `--r`, `--canvas`, `--cInk`,
`--cMuted`, `--frame` no elemento `#sg-board` (isso é chrome do canvas de design, não do app).

---

## 0. Convenções compartilhadas pelos 5 frames

### 0.1 Shell do frame

Todos os frames são `div[data-screen-label]` com:

```
position:relative;width:390px;height:844px;background:<BG>;border:1px solid var(--frame,#242424);border-radius:2px;overflow:hidden;color:<INK>;flex:none
```

| frame | BG | INK |
|---|---|---|
| 15 Dashboard | `#0A0A0A` | `#F1EBE0` |
| 16 Gestão de serviços | `#0A0A0A` | `#F1EBE0` |
| 17 Gestão de equipe | `#0A0A0A` | `#F1EBE0` |
| 18 Home light | `#F1EBE0` | `#0A0A0A` |
| 19 Data e horário light | `#F1EBE0` | `#0A0A0A` |

O `border:1px solid var(--frame,#242424)` e o `border-radius:2px` do contêiner são **moldura do
board de design**, não da tela do app — no app o frame é a viewport.

### 0.2 Status bar (idêntica em todos; só as cores mudam no light)

Wrapper: `height:50px;display:flex;align-items:center;justify-content:space-between;padding:0 24px 0 30px`

- Relógio: `font-size:13px;font-weight:600` — texto literal **`9:41`** (herda `color` do frame)
- Grupo direito: `display:flex;align-items:center;gap:7px`
  - Barras de sinal: `display:flex;align-items:flex-end;gap:2px`
    - dark: `width:3px;height:4px;background:#F1EBE0` / `height:6px` / `height:8px` / `width:3px;height:10px;background:rgba(241,235,224,.35)`
    - light: `width:3px;height:4px;background:#0A0A0A` / `height:6px` / `height:8px` / `width:3px;height:10px;background:rgba(10,10,10,.3)`
  - Bateria dark: `width:22px;height:11px;border:1px solid rgba(241,235,224,.45);border-radius:3px;padding:2px` → filho `width:70%;height:100%;background:#F1EBE0;border-radius:1px`
  - Bateria light: `width:22px;height:11px;border:1px solid rgba(10,10,10,.4);border-radius:3px;padding:2px` → filho `width:70%;height:100%;background:#0A0A0A;border-radius:1px`

**Status bar não é dado de API** — é a status bar do sistema operacional. No app: `expo-status-bar`
com `style="light"` no dark e `style="dark"` no light. Não implementar como componente próprio.

### 0.3 Tab bar (frames 15, 16, 17 — 3 abas; frame 18 — 4 abas; frame 19 — sem tab bar)

Wrapper (dark): `position:absolute;left:0;right:0;bottom:0;background:#0A0A0A;border-top:1px solid rgba(241,235,224,.1)`
Linha de abas: `display:flex;padding:16px 8px 4px`
Cada aba: `flex:1;display:flex;flex-direction:column;align-items:center;gap:7px` contendo

1. indicador: ativo `width:14px;height:1px;background:var(--gold,#C9A96A)`; inativo `width:14px;height:1px` (**sem background — o div existe e ocupa altura, é um spacer; manter para não deslocar o rótulo**)
2. rótulo: ativo `font-size:9px;font-weight:600;letter-spacing:.14em;color:var(--gold,#C9A96A)`; inativo `font-size:9px;font-weight:600;letter-spacing:.14em;color:rgba(241,235,224,.4)`

Home indicator: `width:118px;height:4px;border-radius:99px;background:rgba(241,235,224,.2);margin:10px auto 8px`

**Abas do ADMIN (literal, 3 itens):** `VISÃO GERAL` · `SERVIÇOS` · `EQUIPE`

- 15 → ativa `VISÃO GERAL`
- 16 → ativa `SERVIÇOS`
- 17 → ativa `EQUIPE`

**Abas do CLIENTE (frame 18, 4 itens):** `INÍCIO` · `AGENDAR` · `MEUS HORÁRIOS` · `PERFIL` (ativa `INÍCIO`)

### 0.4 Cabeçalhos de seção do board (não são telas)

- Linha 507: `03 — PERFIL ADMIN` (`font-size:10px;font-weight:600;letter-spacing:.3em;color:var(--gold,#C9A96A)`)
  e `Gestão do ateliê` + span `· 3 telas` (`font-family:'Playfair Display',serif;font-size:30px;color:var(--cInk,#F1EBE0)` / span `color:var(--cMuted,#7A756B)`)
- Linha 633: `04 — VARIANTES LIGHT` e `Modo claro` + span `· 2 telas` (mesmos estilos)
- Etiquetas de frame: `font-size:10px;font-weight:600;letter-spacing:.2em;color:var(--cMuted,#7A756B)` —
  `15 · DASHBOARD`, `16 · GESTÃO DE SERVIÇOS`, `17 · GESTÃO DE EQUIPE`,
  `18 · HOME DO CLIENTE · LIGHT`, `19 · DATA E HORÁRIO · LIGHT`
  Cada etiqueta fica em um wrapper `display:flex;flex-direction:column;gap:14px`; a fileira de frames é
  `display:flex;flex-wrap:wrap;gap:56px;max-width:2200px;align-items:flex-start`.

---

## 1. Frame 15 — `15 Dashboard` (linhas 512–559)

**Label:** `15 Dashboard`

**Propósito:** primeira tela do ADMIN. Painel de leitura (nenhum campo editável) com o resumo da
semana corrente do ateliê: volume de agendamentos por dia, taxa de ocupação, captação de clientes
novos e receita estimada. É a raiz da aba `VISÃO GERAL`.

### 1.1 Árvore completa

```
frame#15  background:#0A0A0A  color:#F1EBE0
├─ status bar (0.2, dark)
└─ conteúdo  padding:40px 28px 0
   ├─ eyebrow           font-size:9px;font-weight:600;letter-spacing:.26em;color:rgba(241,235,224,.48)
   │                    → "VISÃO GERAL"
   ├─ título            font-family:'Playfair Display',serif;font-size:29px;margin-top:12px
   │                    → "Esta semana"
   ├─ período           font-size:9px;font-weight:600;letter-spacing:.2em;color:rgba(241,235,224,.45);margin-top:14px
   │                    → "31 AGO — 06 SET"      (em-dash U+2014, com espaços)
   │
   ├─ BLOCO 1 (agendamentos + gráfico)
   │  wrapper           margin-top:38px;padding-bottom:30px;border-bottom:1px solid rgba(241,235,224,.1)
   │  └─ linha          display:flex;justify-content:space-between;align-items:flex-end
   │     ├─ esquerda (div sem estilo)
   │     │  ├─ número   font-family:'Playfair Display',serif;font-size:42px;line-height:1   → "32"
   │     │  └─ rótulo   font-size:8.5px;font-weight:600;letter-spacing:.22em;color:rgba(241,235,224,.45);margin-top:12px
   │     │              → "AGENDAMENTOS NA SEMANA"
   │     └─ gráfico     display:flex;align-items:flex-end;gap:9px
   │        7 colunas, cada uma: display:flex;flex-direction:column;align-items:center;gap:8px
   │          barra:  width:18px;height:<H>;background:<BG>
   │          label:  font-size:7.5px;font-weight:600;color:rgba(241,235,224,.35)
   │        ┌────┬────────┬───────────────────────────────┐
   │        │ 1  │ H=26px │ rgba(241,235,224,.16)  → "S"  │
   │        │ 2  │ H=40px │ var(--gold,#C9A96A)    → "T"  │  ← única barra dourada (= hoje, terça)
   │        │ 3  │ H=33px │ rgba(241,235,224,.16)  → "Q"  │
   │        │ 4  │ H=40px │ rgba(241,235,224,.16)  → "Q"  │
   │        │ 5  │ H=47px │ rgba(241,235,224,.16)  → "S"  │  ← maior barra
   │        │ 6  │ H=26px │ rgba(241,235,224,.16)  → "S"  │
   │        │ 7  │ H= 2px │ rgba(241,235,224,.16)  → "D"  │  ← domingo fechado (stub de 2px, não 0)
   │        └────┴────────┴───────────────────────────────┘
   │
   ├─ BLOCO 2 (ocupação)
   │  wrapper           margin-top:30px;padding-bottom:30px;border-bottom:1px solid rgba(241,235,224,.1)
   │  ├─ número         font-family:'Playfair Display',serif;font-size:42px;line-height:1   → "78%"
   │  ├─ rótulo         font-size:8.5px;font-weight:600;letter-spacing:.22em;color:rgba(241,235,224,.45);margin-top:12px
   │  │                 → "TAXA DE OCUPAÇÃO"
   │  └─ trilha         height:2px;background:rgba(241,235,224,.12);margin-top:20px
   │     └─ preenchim.  width:78%;height:100%;background:var(--gold,#C9A96A)
   │
   ├─ BLOCO 3 (clientes novos)
   │  wrapper           margin-top:30px;padding-bottom:30px;border-bottom:1px solid rgba(241,235,224,.1)
   │  └─ linha          display:flex;justify-content:space-between;align-items:flex-end
   │     ├─ esquerda
   │     │  ├─ número   font-family:'Playfair Display',serif;font-size:42px;line-height:1   → "9"
   │     │  └─ rótulo   font-size:8.5px;font-weight:600;letter-spacing:.22em;color:rgba(241,235,224,.45);margin-top:12px
   │     │              → "CLIENTES NOVOS NO MÊS"
   │     └─ delta       font-size:9px;font-weight:600;letter-spacing:.16em;color:var(--gold,#C9A96A);padding-bottom:4px
   │                    → "+3 VS. JULHO"
   │
   └─ BLOCO 4 (receita)
      linha             display:flex;justify-content:space-between;align-items:center;margin-top:28px
      ├─ rótulo         font-size:12.5px;color:rgba(241,235,224,.55)  → "Receita estimada da semana"
      └─ valor          font-family:'Playfair Display',serif;font-size:19px  → "R$ 7.240"
      (SEM border-bottom — é o último bloco)
└─ tab bar (0.3, dark, ativa "VISÃO GERAL")
```

### 1.2 Interativos

Nenhum. O frame 15 é o **único dos cinco sem qualquer `cursor:pointer` e sem qualquer `style-hover`**.
As únicas áreas tocáveis são as 3 abas da tab bar (`SERVIÇOS`, `EQUIPE`).

Consequências para implementação:

- não há seletor de período (o `31 AGO — 06 SET` é texto estático, não um date-range picker);
- não há drill-down: nem o número `32`, nem as barras, nem o `+3 VS. JULHO` navegam para lugar algum;
- não há pull-to-refresh desenhado (adicionar é decisão de implementação, não do design).

### 1.3 Textos literais (transcrição exata)

`9:41` · `VISÃO GERAL` · `Esta semana` · `31 AGO — 06 SET` · `32` · `AGENDAMENTOS NA SEMANA` ·
`S` `T` `Q` `Q` `S` `S` `D` · `78%` · `TAXA DE OCUPAÇÃO` · `9` · `CLIENTES NOVOS NO MÊS` ·
`+3 VS. JULHO` · `Receita estimada da semana` · `R$ 7.240` · `VISÃO GERAL` `SERVIÇOS` `EQUIPE`

### 1.4 Métricas e o que a API **não** consegue calcular

Inventário dos números da tela:

| # | Métrica na tela | Valor no design | Semântica implícita |
|---|---|---|---|
| M1 | Janela de referência | `31 AGO — 06 SET` | semana corrente; o gráfico começa em `S` e termina em `D`, logo **segunda→domingo** (31/ago/2026 é segunda — confere) |
| M2 | Agendamentos na semana | `32` | contagem de agendamentos do ateliê na janela |
| M3 | Distribuição por dia da semana | 7 barras (26/40/33/40/47/26/2 px) | contagem por dia; a barra dourada marca *hoje* (terça) |
| M4 | Taxa de ocupação | `78%` | minutos agendados ÷ minutos disponíveis na janela |
| M5 | Clientes novos no mês | `9` | clientes com `createdAt` dentro do mês corrente |
| M6 | Delta mês anterior | `+3 VS. JULHO` | M5 do mês corrente − M5 do mês comparado |
| M7 | Receita estimada da semana | `R$ 7.240` | soma de `precoCentavos` dos agendamentos da janela |

**Veredito: a API atual não calcula NENHUMA das 7. Não existe um único endpoint de agregação,
relatório, contagem ou soma no `openapi.yaml`** — nada de `/relatorios`, `/dashboard`, `/metricas`,
`/resumo`, `/estatisticas`. Os endpoints existentes devolvem apenas coleções de entidades cruas
(`Agendamento`, `ClienteResumo`, `Servico`, `Profissional`, `Disponibilidade`, `Bloqueio`).

Detalhe do que falta em cada uma:

- **M2, M3, M7 (agendamentos da semana, por dia, receita)** — o único endpoint que devolve
  agendamentos do ponto de vista do estabelecimento é `GET /agendamentos/agenda`, e ele:
  1. aceita **um único dia** (`data`, `YYYY-MM-DD`) — não há `inicio`/`fim`, não há range;
  2. para ADMIN o `profissionalId` é **obrigatório** (`422 — ADMIN chamou sem informar profissionalId`),
     ou seja **o admin não consegue pedir "a agenda do ateliê"**, só a de um profissional por vez.

  Resultado: montar M2/M3/M7 client-side custa **7 × (nº de profissionais) requisições**
  (7 hoje, com 1 profissional; 21 com 3). `Agendamento` traz `precoCentavos`, então M7 é somável
  no cliente — mas o design diz "estimada" sem definir **quais status entram**
  (`AGENDADO`, `CONCLUIDO`, `CANCELADO`, `NAO_COMPARECEU`); essa regra não existe em lugar nenhum.
- **M4 (taxa de ocupação)** — não existe nem numerador nem denominador prontos. Numerador = soma de
  `duracaoMinutos` dos agendamentos da janela (mesmas 7×N chamadas acima). Denominador = minutos da
  grade (`GET /profissionais/{id}/disponibilidade` → `Disponibilidade[]` com `diaSemana`/`horaInicio`/`horaFim`)
  **menos** os bloqueios (`GET /profissionais/{profissionalId}/bloqueios`). Além do custo, a
  **definição de "ocupação" não está especificada** (conta cancelado? conta no-show? bloqueio
  reduz o denominador ou entra como ocupado?).
- **M5 (clientes novos no mês)** — `GET /clientes` devolve `ClienteResumo` **com `createdAt`**, mas
  não aceita filtro de data e é paginado com **tamanho máximo de 100** (`tamanho`, default 20).
  Para contar os do mês é preciso **paginar a base inteira de clientes** e filtrar no cliente —
  cresce sem limite com o cadastro. Não há endpoint de contagem, e a resposta é um **array puro,
  sem metadados de paginação** — o app nem sabe quantas páginas existem, só pode pedir até vir
  menos que `tamanho`.
- **M6 (`+3 VS. JULHO`)** — mesma limitação de M5, dobrada: exige a base inteira e um segundo
  recorte por mês. Também é **ambíguo**: o rótulo nomeia `JULHO` enquanto M5 diz "no mês" e o
  design está em setembro — sugere comparação com **dois meses atrás** ou erro do mock.
  Precisa de decisão de produto.
- **M1 (`31 AGO — 06 SET`)** — puro cálculo de calendário no cliente, sem API. Mas exige fixar o
  início da semana (o gráfico prova segunda-feira) e o fuso: a API entrega `OffsetDateTime` e o
  backend já tem armadilha conhecida de timezone em colunas `time`
  (`quarkus.hibernate-orm.jdbc.timezone=UTC` desloca `time` pelo fuso da JVM).

**Endpoint que precisa ser criado** (sugestão mínima para essa tela virar 1 requisição):

```
GET /relatorios/semana?inicio=YYYY-MM-DD&fim=YYYY-MM-DD        [ADMIN]
  → { inicio, fim, agendamentos, porDiaSemana:[{diaSemana,total}],
      ocupacaoPercentual, receitaEstimadaCentavos,
      clientesNovosNoMes, clientesNovosMesAnterior, mesAnteriorNome }
```

Enquanto ele não existir, a tela 15 só pode ser entregue com **dados mockados** ou em "modo
degradado" (M2/M3/M7 a partir de 7 chamadas de agenda do único profissional; M4/M5/M6 escondidas).
Registrar como bloqueio, não como detalhe.

### 1.5 Estados

- **Padrão (desenhado):** todos os números presentes.
- **Loading:** não desenhado. Sugestão: skeletons nos 4 blocos preservando as alturas (o número
  Playfair de 42px com `line-height:1` reserva 42px) para não haver salto de layout.
- **Vazio (semana sem agendamentos):** não desenhado. `32` → `0`; gráfico com as 7 barras no stub de
  `2px` (o design já usa 2px para "dia sem nada" no domingo — reaproveitar); `78%` → `0%` com
  `width:0%`; `R$ 7.240` → `R$ 0`.
- **Erro:** não desenhado.
- **Sem permissão:** a tela é ADMIN-only por construção (não há equivalente para PROFISSIONAL);
  a API responde `403` em vários endpoints correlatos.
- **Nota de navegação (lacuna):** a tab bar do ADMIN tem 3 abas e **nenhuma leva a clientes**,
  embora existam os frames 13 `Lista de clientes` e 14 `Ficha do cliente`. Ou o admin acessa
  clientes por um caminho não desenhado, ou 13/14 são exclusivos do perfil PROFISSIONAL.

---

## 2. Frame 16 — `16 Gestão de serviços` (linhas 563–589)

**Label:** `16 Gestão de serviços`

**Propósito:** CRUD do catálogo de serviços do ateliê. Lista todos os serviços com duração e preço,
com entrada para criar um novo e editar cada um. Raiz da aba `SERVIÇOS`.

### 2.1 Árvore completa

```
frame#16  background:#0A0A0A  color:#F1EBE0
├─ status bar (0.2, dark)
└─ conteúdo  padding:40px 28px 0
   ├─ header  display:flex;justify-content:space-between;align-items:flex-end
   │  ├─ título   font-family:'Playfair Display',serif;font-size:29px   → "Serviços"
   │  └─ botão    border:1px solid rgba(241,235,224,.22);border-radius:var(--r,2px);padding:10px 16px;
   │              font-size:9px;font-weight:600;letter-spacing:.18em;color:rgba(241,235,224,.8);
   │              cursor:pointer;margin-bottom:2px
   │              style-hover="border-color:rgba(241,235,224,.45)"
   │              → "NOVO SERVIÇO"
   │
   ├─ lista  margin-top:26px
   │  6 linhas idênticas na estrutura:
   │    linha:  display:flex;justify-content:space-between;align-items:center;padding:22px 0;
   │            border-bottom:1px solid rgba(241,235,224,.1)
   │    ├─ esquerda: display:flex;flex-direction:column;gap:8px
   │    │   ├─ nome:  font-family:'Playfair Display',serif;font-size:19px
   │    │   └─ meta:  font-size:9px;font-weight:600;letter-spacing:.2em;color:rgba(241,235,224,.45)
   │    └─ ação:      font-size:9px;font-weight:600;letter-spacing:.18em;color:rgba(241,235,224,.55);cursor:pointer
   │                  → "EDITAR"   (sem style-hover)
   │
   │    ┌───┬────────────────────────┬────────────────────┐
   │    │ 1 │ Análise de Visagismo   │ 90 MIN · R$ 320    │
   │    │ 2 │ Corte Assinatura       │ 60 MIN · R$ 190    │
   │    │ 3 │ Corte & Barba          │ 90 MIN · R$ 260    │   (no HTML: "Corte &amp; Barba")
   │    │ 4 │ Ritual de Barba        │ 45 MIN · R$ 140    │
   │    │ 5 │ Camuflagem de Fios     │ 60 MIN · R$ 210    │
   │    │ 6 │ Consultoria de Imagem  │ 120 MIN · R$ 480   │
   │    └───┴────────────────────────┴────────────────────┘
   │    (a 6ª linha TAMBÉM tem border-bottom — a lista fecha com régua)
   │
   └─ nota  font-size:11px;color:rgba(241,235,224,.38);margin-top:22px
            → "Serviços inativos não aparecem para os clientes."
└─ tab bar (0.3, dark, ativa "SERVIÇOS")
```

### 2.2 Interativos

| elemento | gesto | hover desenhado | destino / efeito |
|---|---|---|---|
| `NOVO SERVIÇO` | tap | `border-color:rgba(241,235,224,.45)` | abre formulário de criação (**tela não desenhada**) → `POST /servicos` |
| `EDITAR` (×6) | tap | nenhum | abre formulário de edição (**tela não desenhada**) → `PUT /servicos/{id}` |
| abas `VISÃO GERAL`, `EQUIPE` | tap | — | frames 15 e 17 |

Não há: busca, filtro ativo/inativo, reordenação, swipe-to-delete, toggle de ativação.

### 2.3 Textos literais

`9:41` · `Serviços` · `NOVO SERVIÇO` · `Análise de Visagismo` · `90 MIN · R$ 320` ·
`Corte Assinatura` · `60 MIN · R$ 190` · `Corte & Barba` · `90 MIN · R$ 260` · `Ritual de Barba` ·
`45 MIN · R$ 140` · `Camuflagem de Fios` · `60 MIN · R$ 210` · `Consultoria de Imagem` ·
`120 MIN · R$ 480` · `EDITAR` · `Serviços inativos não aparecem para os clientes.` ·
`VISÃO GERAL` `SERVIÇOS` `EQUIPE`

Separador da linha meta: `·` (U+00B7) com um espaço de cada lado. Preço em pt-BR com **ponto** de
milhar (`R$ 320` não tem, mas `R$ 7.240` do frame 15 confirma o padrão) e **sem centavos**.

### 2.4 Dados de API

```
GET /servicos?incluirInativos=true        [ADMIN — o param é ignorado para os demais]
  → Servico[] { id, tenantId, nome, descricao, duracaoMinutos, precoCentavos, ativo, createdAt, updatedAt }
     ordenação garantida pela API: "ordenados por nome"
POST   /servicos            ServicoRequest  → 201 | 403 (só ADMIN) | 409 (nome duplicado) | 400
PUT    /servicos/{id}       ServicoRequest  → 200 | 403 | 404
DELETE /servicos/{id}                       → 204 | 403 | 404   (soft delete)
GET    /servicos/{id}                       → Servico
```

Mapeamento de campo → tela:

- `nome` → título Playfair 19px, **como veio** (nenhum `text-transform` no CSS).
- `duracaoMinutos` + `precoCentavos` → `"{duracaoMinutos} MIN · R$ {precoCentavos/100 pt-BR}"`.
  A caixa alta de `MIN` está **no literal**, não em CSS; formatar na camada de view.
- `descricao` **não aparece na tela** — existe na API e é ignorada aqui.
- `ativo` **não tem representação visual**, apesar da nota de rodapé falar de inativos (ver 2.5).

**Ordenação:** a API ordena por nome; a lista do design **não está em ordem alfabética**
(`Análise`, `Corte Assinatura`, `Corte & Barba`, `Ritual`, `Camuflagem`, `Consultoria`). Ou o mock
ignorou a ordem, ou a tela precisa de ordenação própria não especificada. Seguir a API
(alfabética) é o caminho de menor risco.

### 2.5 Estados

- **Padrão (desenhado):** 6 serviços ativos.
- **Serviço inativo: NÃO DESENHADO — lacuna.** A nota de rodapé promete o conceito
  (`Serviços inativos não aparecem para os clientes.`) mas nenhuma linha tem tratamento de inativo
  (nem opacidade, nem badge, nem `text-decoration`). Como `GET /servicos?incluirInativos=true`
  devolve os inativos misturados, **é obrigatório definir esse estado** antes de implementar.
  Sugestão coerente com o sistema: nome em `rgba(241,235,224,.45)` e badge `INATIVO` reusando
  `font-size:8.5px;font-weight:600;letter-spacing:.18em`.
- **Vazio:** não desenhado (catálogo sem serviços) — a nota de rodapé ficaria órfã.
- **Loading / erro:** não desenhados.
- **Remoção:** `DELETE /servicos/{id}` existe na API mas **não tem affordance na tela**. Ou fica
  dentro do formulário de edição (não desenhado), ou o app não expõe remoção.
- **Conflito 409 (nome duplicado):** sem tratamento desenhado — pertence ao formulário ausente.
- **Scroll:** 6 linhas (22px+22px de padding cada) + header + nota ainda cabem nos 844px; com mais
  serviços a lista precisa rolar e a tab bar (`position:absolute;bottom:0`) fica fixa por cima —
  reservar padding inferior ≈ altura da tab bar (16+7+~11+4 + 4+10+8 ≈ 60px) no scroll container.

---

## 3. Frame 17 — `17 Gestão de equipe` (linhas 594–629)

**Label:** `17 Gestão de equipe`

**Propósito:** gestão do quadro de profissionais do ateliê. Hoje mostra um único profissional
(o próprio Stewer) com foto, especialidade, status e resumo da grade, mais o slot de convite de um
novo profissional. Raiz da aba `EQUIPE`.

### 3.1 Árvore completa

```
frame#17  background:#0A0A0A  color:#F1EBE0
├─ status bar (0.2, dark)
└─ conteúdo  padding:40px 28px 0
   ├─ título     font-family:'Playfair Display',serif;font-size:29px   → "Equipe"
   ├─ contagem   font-size:9px;font-weight:600;letter-spacing:.2em;color:rgba(241,235,224,.45);margin-top:14px
   │             → "1 PROFISSIONAL ATIVO"
   │
   ├─ CARD DO PROFISSIONAL
   │  border:1px solid rgba(241,235,224,.14);border-radius:var(--r,2px);margin-top:30px;padding:22px
   │  ├─ topo   display:flex;align-items:center;gap:18px
   │  │  ├─ FOTO  <image-slot id="pro-equipe" shape="rect" placeholder="Foto"
   │  │  │          style="width:64px;height:64px;flex:none">
   │  │  │        → slot de imagem 64×64, retangular (SEM border-radius próprio)
   │  │  ├─ meio  flex:1;display:flex;flex-direction:column;gap:8px
   │  │  │  ├─ nome   font-family:'Playfair Display',serif;font-size:20px   → "Stewer Gabriel"
   │  │  │  └─ espec. font-size:8.5px;font-weight:600;letter-spacing:.2em;color:rgba(241,235,224,.5)
   │  │  │            → "VISAGISTA & CONSULTOR DE IMAGEM"   (HTML: "VISAGISTA &amp; CONSULTOR DE IMAGEM")
   │  │  └─ badge  font-size:8.5px;font-weight:600;letter-spacing:.18em;color:var(--gold,#C9A96A);align-self:flex-start
   │  │            → "ATIVO"
   │  ├─ régua  height:1px;background:rgba(241,235,224,.1);margin:20px 0 16px
   │  └─ base   display:flex;justify-content:space-between;align-items:center
   │     ├─ grade  font-size:8.5px;font-weight:600;letter-spacing:.18em;color:rgba(241,235,224,.45)
   │     │         → "AGENDA · TER — SÁB, 09:00 — 19:00"
   │     └─ ação   font-size:9px;font-weight:600;letter-spacing:.18em;color:rgba(241,235,224,.55);cursor:pointer
   │               → "GERENCIAR"
   │
   ├─ SLOT DE CONVITE (dashed)
   │  border:1px dashed rgba(241,235,224,.2);border-radius:var(--r,2px);padding:26px;margin-top:16px;
   │  display:flex;flex-direction:column;align-items:center;gap:10px;cursor:pointer
   │  style-hover="border-color:rgba(241,235,224,.4)"
   │  ├─ mais    font-size:16px;color:rgba(241,235,224,.55);line-height:1   → "+"
   │  └─ rótulo  font-size:9.5px;font-weight:600;letter-spacing:.22em;color:rgba(241,235,224,.6)
   │             → "ADICIONAR PROFISSIONAL"
   │
   └─ nota  font-size:11px;line-height:1.7;color:rgba(241,235,224,.38);margin-top:20px;text-align:center
            → "O convite dá acesso ao painel do profissional,<br>com agenda e clientes próprios."
            (o <br> é literal e força a quebra exatamente depois da vírgula)
└─ tab bar (0.3, dark, ativa "EQUIPE")
```

### 3.2 Interativos

| elemento | gesto | hover desenhado | destino / efeito |
|---|---|---|---|
| `GERENCIAR` | tap | nenhum | frame **12 Disponibilidade** (grade semanal do profissional) |
| slot `+ ADICIONAR PROFISSIONAL` (todo o bloco dashed) | tap | `border-color:rgba(241,235,224,.4)` | fluxo de convite (**tela não desenhada**) |
| abas `VISÃO GERAL`, `SERVIÇOS` | tap | — | frames 15 e 16 |

O card do profissional **não é tocável como um todo** (não tem `cursor:pointer`); só o `GERENCIAR`.
Não há edição de nome/foto/especialidade nesta tela, nem remoção da equipe.

### 3.3 Textos literais

`9:41` · `Equipe` · `1 PROFISSIONAL ATIVO` · `Foto` (placeholder do slot) · `Stewer Gabriel` ·
`VISAGISTA & CONSULTOR DE IMAGEM` · `ATIVO` · `AGENDA · TER — SÁB, 09:00 — 19:00` · `GERENCIAR` ·
`+` · `ADICIONAR PROFISSIONAL` · `O convite dá acesso ao painel do profissional,` /
`com agenda e clientes próprios.` · `VISÃO GERAL` `SERVIÇOS` `EQUIPE`

Pontuação da linha de agenda, exata: `AGENDA` + ` · ` + `TER` + ` — ` + `SÁB` + `, ` + `09:00` + ` — ` + `19:00`.
Dois em-dashes (U+2014) na mesma string: um separa os dias, o outro as horas.

### 3.4 Dados de API

```
GET    /profissionais?incluirInativos=true      [incluirInativos só vale p/ ADMIN]
   → Profissional[] { id, tenantId, usuarioId, nome, email, telefone, especialidade, bio,
                      fotoUrl, ativo, createdAt, updatedAt }
GET    /profissionais/{id}                      → Profissional
PUT    /profissionais/{id}    ProfissionalRequest
DELETE /profissionais/{id}                      → soft delete (remove da equipe)
POST   /profissionais         ProfissionalRequest { usuarioId obrigatório }
   → 201 | 404 (usuário não existe no estabelecimento) | 409 (o usuário já é profissional)
GET    /profissionais/{profissionalId}/disponibilidade
   → Disponibilidade[] { id, profissionalId, diaSemana (0=domingo…6=sábado), horaInicio, horaFim }
     "ordenada por dia e hora de inicio"
```

Mapeamento:

- `1 PROFISSIONAL ATIVO` ← `profissionais.filter(p => p.ativo).length` + pluralização
  (`1 PROFISSIONAL ATIVO` / `N PROFISSIONAIS ATIVOS` — **a forma plural não está no design**).
- foto 64×64 ← `fotoUrl` (o `image-slot` é do canvas de design; no app é um `Image` com fallback).
  **Não há estado de "sem foto" desenhado** além do placeholder `Foto` do editor.
- `Stewer Gabriel` ← `nome`; `VISAGISTA & CONSULTOR DE IMAGEM` ← `especialidade`.
  **Atenção:** o literal está em caixa alta e **não há `text-transform:uppercase` no CSS**. O campo
  `especialidade` da API é texto livre — aplicar `text-transform:uppercase` na view (ou aceitar que
  o dado venha em caixa alta). Registrar a decisão; hoje é ambíguo.
- `ATIVO` ← `ativo === true`. **O rótulo do estado inativo não está desenhado** (`INATIVO`? cor?).
- `bio`, `email`, `telefone` existem na API e **não aparecem** nesta tela.

**`AGENDA · TER — SÁB, 09:00 — 19:00` é derivado, e a derivação é lossy.** A API devolve N faixas
independentes (`diaSemana`, `horaInicio`, `horaFim`), permitindo horário diferente por dia e
**múltiplas faixas no mesmo dia** (turno partido — o `PUT` só rejeita faixas invertidas ou
sobrepostas, não múltiplas). O design comprime tudo em "intervalo de dias contíguos + uma janela
única". Regra necessária:

1. agrupar faixas por `diaSemana`;
2. se todos os dias com faixa tiverem exatamente a **mesma** `horaInicio`/`horaFim` e formarem
   sequência contígua → render `DIA — DIA, HH:MM — HH:MM`;
3. **caso contrário não existe layout desenhado** — precisa de fallback
   (ex.: `AGENDA · 5 DIAS · VER GRADE`).

Abreviações de dia usadas no design: `TER`, `SÁB` (3 letras, caixa alta, **com acento em SÁB**).
Mapa: 0=`DOM` 1=`SEG` 2=`TER` 3=`QUA` 4=`QUI` 5=`SEX` 6=`SÁB`.

**`ADICIONAR PROFISSIONAL` não tem API que atenda o texto — lacuna dura.** A nota diz
"O convite dá acesso ao painel do profissional", mas:

- `POST /profissionais` exige `usuarioId` de um **usuário já existente no tenant**;
- **não existe endpoint de convite** (nada de `/convites`, `/invites`);
- **não existe endpoint para listar usuários do tenant** (só `GET /auth/eu`, do próprio token) —
  então a tela não tem como oferecer um seletor de `usuarioId`;
- **não existe endpoint para criar usuário PROFISSIONAL/ADMIN** — `POST /auth/registrar`
  "Cria uma conta de CLIENTE".

Ou seja: hoje só se adiciona profissional se alguém já tiver se registrado como cliente e o admin
souber o UUID dele. **É preciso criar** `POST /convites` (ou `POST /usuarios` com `role`) +
`GET /usuarios` antes de implementar esse slot. Enquanto isso, o slot fica desabilitado ou abre um
input de e-mail que não tem para onde ir.

### 3.5 Estados

- **Padrão (desenhado):** 1 profissional ativo + slot de convite.
- **N profissionais:** não desenhado, mas trivial — repetir o card com `margin-top:16px`
  (o mesmo gap usado entre card e slot dashed) e o slot dashed sempre por último.
- **Profissional inativo:** não desenhado (badge, cor, e se aparece na lista).
- **Sem grade cadastrada** (`disponibilidade` vazia): não desenhado — a linha `AGENDA · …` ficaria
  sem conteúdo. Sugestão: `AGENDA · NÃO CONFIGURADA` com a mesma `color:rgba(241,235,224,.45)`.
- **Loading / erro:** não desenhados.
- **Vazio absoluto (equipe zerada):** não desenhado; `1 PROFISSIONAL ATIVO` viraria
  `0 PROFISSIONAIS ATIVOS` e sobraria só o slot dashed.

---

## 4. Frame 18 — `18 Home light` (linhas 638–673)

**Label:** `18 Home light`

**Propósito:** variante em modo claro da tela **03 Home do cliente**. Mesma estrutura, mesma
tipografia, mesmos espaçamentos, mesmos textos — **só a paleta muda**. Serve de prova de que o
sistema sobrevive invertido e de fonte de verdade para o tema claro.

**Estrutura, textos, espaçamentos, hierarquia e interativos: idênticos ao frame 03.** A única
diferença está na tabela da seção 6.

### 4.1 Árvore com os valores literais do light

```
frame#18  background:#F1EBE0  color:#0A0A0A
├─ status bar (0.2, light)
└─ conteúdo  padding:44px 28px 0
   ├─ data      font-size:9px;font-weight:600;letter-spacing:.26em;color:rgba(10,10,10,.5)
   │            → "TERÇA-FEIRA, 1 DE SETEMBRO"
   ├─ saudação  font-family:'Playfair Display',serif;font-size:31px;margin-top:12px
   │            → "Boa tarde, Rafael."
   ├─ CARD PRÓXIMO AGENDAMENTO
   │  border:1px solid var(--gold,#C9A96A);border-radius:var(--r,2px);padding:26px 24px;margin-top:42px;
   │  display:flex;flex-direction:column;gap:14px;background:rgba(255,255,255,.35)   ← * só no light
   │  ├─ eyebrow  font-size:9px;font-weight:600;letter-spacing:.24em;color:#A8894F
   │  │           → "PRÓXIMO AGENDAMENTO"
   │  ├─ serviço  font-family:'Playfair Display',serif;font-size:23px   → "Corte Assinatura"
   │  ├─ quando   font-size:10.5px;font-weight:500;letter-spacing:.16em;color:rgba(10,10,10,.65)
   │  │           → "SEX, 11 SET · 15:30 — 16:30"
   │  ├─ régua    height:1px;background:rgba(10,10,10,.12);margin-top:6px
   │  └─ base     display:flex;justify-content:space-between;align-items:center;margin-top:2px
   │     ├─ quem  font-size:12.5px;color:rgba(10,10,10,.6)   → "Stewer Gabriel · Visagista"
   │     └─ ações display:flex;gap:20px
   │        ├─ font-size:9px;font-weight:600;letter-spacing:.18em;color:rgba(10,10,10,.5);cursor:pointer  → "REAGENDAR"
   │        └─ font-size:9px;font-weight:600;letter-spacing:.18em;color:#A8894F;cursor:pointer            → "DETALHES"
   ├─ CTA  background:#0A0A0A;color:#F1EBE0;border-radius:var(--r,2px);padding:18px;text-align:center;
   │       font-size:10.5px;font-weight:600;letter-spacing:.22em;margin-top:28px;cursor:pointer
   │       style-hover="opacity:.9"                            ← * .9 no light, .92 no dark
   │       → "NOVO AGENDAMENTO"
   └─ ÚLTIMA VISITA  margin-top:48px
      ├─ eyebrow  font-size:9px;font-weight:600;letter-spacing:.24em;color:rgba(10,10,10,.5)  → "ÚLTIMA VISITA"
      └─ linha    display:flex;justify-content:space-between;align-items:center;margin-top:16px;
                  padding-bottom:18px;border-bottom:1px solid rgba(10,10,10,.12)
         ├─ texto  font-size:13.5px;color:rgba(10,10,10,.8)  → "Corte & Barba"
         │         + span color:rgba(10,10,10,.4)            → "· 14 de agosto"
         └─ ação   font-size:9px;font-weight:600;letter-spacing:.18em;color:#A8894F;cursor:pointer  → "REPETIR"
└─ tab bar light
   wrapper  position:absolute;left:0;right:0;bottom:0;background:#F1EBE0;border-top:1px solid rgba(10,10,10,.12)
   ativa    indicador width:14px;height:1px;background:#A8894F  +  rótulo color:#A8894F   → "INÍCIO"
   inativas rótulo color:rgba(10,10,10,.45)   → "AGENDAR", "MEUS HORÁRIOS", "PERFIL"
   home ind. width:118px;height:4px;border-radius:99px;background:rgba(10,10,10,.22);margin:10px auto 8px
```

### 4.2 Textos literais (idênticos ao frame 03, sem uma vírgula de diferença)

`9:41` · `TERÇA-FEIRA, 1 DE SETEMBRO` · `Boa tarde, Rafael.` · `PRÓXIMO AGENDAMENTO` ·
`Corte Assinatura` · `SEX, 11 SET · 15:30 — 16:30` · `Stewer Gabriel · Visagista` · `REAGENDAR` ·
`DETALHES` · `NOVO AGENDAMENTO` · `ÚLTIMA VISITA` · `Corte & Barba` · `· 14 de agosto` · `REPETIR` ·
`INÍCIO` `AGENDAR` `MEUS HORÁRIOS` `PERFIL`

### 4.3 Interativos (idênticos a 03)

`REAGENDAR` (tap, sem hover) · `DETALHES` (tap, sem hover) · `NOVO AGENDAMENTO`
(tap, hover `opacity:.9`) · `REPETIR` (tap, sem hover) · 3 abas inativas.

### 4.4 Dados de API (idênticos a 03)

```
GET /auth/eu                        → Usuario { nome }  → "Boa tarde, Rafael." (primeiro nome)
GET /agendamentos/meus?periodo=futuros
    → Agendamento[]; o primeiro por `inicio` alimenta o card:
      servicoNome → "Corte Assinatura"
      inicio/fim  → "SEX, 11 SET · 15:30 — 16:30"
      profissionalNome (+ especialidade) → "Stewer Gabriel · Visagista"
GET /agendamentos/meus?periodo=historico
    → o mais recente alimenta ÚLTIMA VISITA: servicoNome + inicio → "· 14 de agosto"
"REPETIR" → pré-preenche o fluxo (servicoId + profissionalId) → POST /agendamentos
"REAGENDAR" → NÃO há endpoint de reagendamento: só PATCH /agendamentos/{id}/status (cancelar)
              + POST /agendamentos (novo). Fluxo composto, não atômico. LACUNA.
```

- A saudação `Boa tarde` é derivada da hora local, não da API.
- `Visagista` no card vs `VISAGISTA & CONSULTOR DE IMAGEM` no frame 17: o card usa uma forma curta
  que **não existe como campo** — `especialidade` é um só. Ou trunca, ou aceita a divergência.

### 4.5 Estados

- **Padrão (desenhado):** um agendamento futuro + uma última visita.
- **Sem agendamento futuro / sem histórico:** não desenhados (nem aqui nem no 03 dark).
- **Loading / erro:** não desenhados.
- **Alternância de tema:** não há toggle desenhado em nenhuma tela do board (nem no frame 09
  Perfil do cliente). Assumir `useColorScheme()` do sistema; se for para ter toggle, é adição.

---

## 5. Frame 19 — `19 Data e horário light` (linhas 678–763)

**Label:** `19 Data e horário light`

**Propósito:** variante em modo claro da tela **06 Data e horário** (passo 3 de 4 do fluxo de
agendamento): calendário mensal + grade de horários livres + CTA de avanço. Sem tab bar.

**Estrutura, textos, grid, espaçamentos e interativos: idênticos ao frame 06.** Duas diferenças
estruturais (não só de cor) estão marcadas com `*`.

### 5.1 Árvore com os valores literais do light

```
frame#19  background:#F1EBE0  color:#0A0A0A
├─ status bar (0.2, light)
├─ topbar  display:flex;justify-content:space-between;align-items:center;padding:20px 28px 0
│  ├─ voltar  font-size:19px;color:rgba(10,10,10,.7);cursor:pointer   → "←"  (U+2190)
│  └─ passo   font-size:9px;font-weight:600;letter-spacing:.24em;color:rgba(10,10,10,.45)
│             → "PASSO 03 DE 04"
└─ conteúdo  padding:30px 28px 0
   ├─ título  font-family:'Playfair Display',serif;font-size:29px   → "Data e horário"
   ├─ navegação de mês  display:flex;justify-content:space-between;align-items:center;margin-top:26px
   │  ├─ prev  font-size:16px;color:rgba(10,10,10,.4);cursor:pointer;padding:0 6px   → "‹" (U+2039)
   │  │        (mais apagado que o next: mês anterior é o passado)
   │  ├─ mês   font-family:'Playfair Display',serif;font-size:18px   → "Setembro 2026"
   │  └─ next  font-size:16px;color:rgba(10,10,10,.7);cursor:pointer;padding:0 6px   → "›" (U+203A)
   ├─ cabeçalho de semana  display:grid;grid-template-columns:repeat(7,1fr);margin-top:18px
   │  7 células idênticas: text-align:center;font-size:8.5px;font-weight:600;letter-spacing:.14em;
   │                       color:rgba(10,10,10,.4);padding:6px 0
   │  → "D" "S" "T" "Q" "Q" "S" "S"   (semana começa no DOMINGO nesta tela)
   ├─ grade de dias  display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-top:4px
   │  ├─ 2 células vazias (<div></div><div></div>) → 1/set/2026 cai na terça
   │  ├─ HOJE (dia 1)  height:40px;display:flex;flex-direction:column;align-items:center;
   │  │                justify-content:center;gap:3px;font-size:13px      (SEM color → herda #0A0A0A)
   │  │                ├─ <span>1</span>
   │  │                └─ <span> width:3px;height:3px;border-radius:50%;background:#A8894F
   │  ├─ DISPONÍVEL   height:40px;display:flex;align-items:center;justify-content:center;
   │  │                font-size:13px;color:rgba(10,10,10,.75)
   │  │                dias: 2 3 4 5 8 9 10 12 15 16 17 18 19 22 23 24 25 26 29 30
   │  ├─ SELECIONADO (dia 11)  height:40px;display:flex;align-items:center;justify-content:center;
   │  │                font-size:13px;color:#A8894F;border:1px solid var(--gold,#C9A96A);
   │  │                border-radius:var(--r,2px);font-weight:600      ← * font-weight:600 só no light
   │  └─ INDISPONÍVEL height:40px;display:flex;align-items:center;justify-content:center;
   │                   font-size:13px;color:rgba(10,10,10,.25)   (SEM cursor:pointer)
   │                   dias: 6 7 13 14 20 21 27 28   (= todos os sábados e domingos de setembro)
   ├─ eyebrow de horários  font-size:9px;font-weight:600;letter-spacing:.24em;color:rgba(10,10,10,.5);margin-top:26px
   │                       → "HORÁRIOS · SEXTA, 11 SET"
   ├─ grade de horários  display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:16px
   │  ├─ LIVRE       border:1px solid rgba(10,10,10,.18);border-radius:var(--r,2px);padding:13px 0;
   │  │              text-align:center;font-size:12px;font-weight:500;letter-spacing:.08em;cursor:pointer
   │  │              → "09:00" "10:00" "13:30" "14:30" "16:30" "17:30"
   │  ├─ OCUPADO    padding:13px 0;text-align:center;font-size:12px;font-weight:500;
   │  │              letter-spacing:.08em;color:rgba(10,10,10,.25)
   │  │              (SEM border, SEM cursor:pointer)  → "11:00" "18:30"
   │  └─ SELECIONADO border:1px solid var(--gold,#C9A96A);border-radius:var(--r,2px);padding:13px 0;
   │                 text-align:center;font-size:12px;font-weight:600;letter-spacing:.08em;
   │                 color:#A8894F;cursor:pointer      → "15:30"
   └─ CTA  background:#0A0A0A;color:#F1EBE0;border-radius:var(--r,2px);padding:18px;text-align:center;
           font-size:10.5px;font-weight:600;letter-spacing:.22em;margin-top:26px;cursor:pointer
           style-hover="opacity:.9"                    ← * .9 no light, .92 no dark
           → "CONTINUAR"
```

Ordem literal das 9 células de horário na grade 3×3:
`09:00` `10:00` `11:00` / `13:30` `14:30` `15:30` / `16:30` `17:30` `18:30`.

### 5.2 Textos literais

`9:41` · `←` · `PASSO 03 DE 04` · `Data e horário` · `‹` · `Setembro 2026` · `›` ·
`D` `S` `T` `Q` `Q` `S` `S` · `1` … `30` · `HORÁRIOS · SEXTA, 11 SET` ·
`09:00` `10:00` `11:00` `13:30` `14:30` `15:30` `16:30` `17:30` `18:30` · `CONTINUAR`

### 5.3 Interativos

| elemento | gesto | destino / efeito |
|---|---|---|
| `←` | tap | volta ao passo 02 (frame 05 Escolha de profissional) |
| `‹` / `›` | tap | mês anterior / seguinte |
| dia disponível | tap | seleciona a data, recarrega a grade de horários |
| dia 11 (selecionado) | tap | já selecionado |
| dia indisponível (6, 7, 13, 14, 20, 21, 27, 28) | — | **não tocável** (sem `cursor:pointer`) |
| horário livre | tap | seleciona o horário |
| `11:00` / `18:30` | — | **não tocáveis** |
| `CONTINUAR` | tap, hover `opacity:.9` | passo 04 (frame 07 Confirmação) |

Não há hover em dias nem em horários — só no CTA.

### 5.4 Dados de API

```
GET /profissionais/{profissionalId}/horarios-livres?data=YYYY-MM-DD&servicoId=…
  → HorariosLivres { data, profissionalId, servicoId, duracaoMinutos,
                     horarios: HorarioLivre[] { inicio, fim } }
```

- **A grade de horários vem daqui, mas a API devolve apenas os LIVRES.** O design mostra `11:00` e
  `18:30` **em cinza, como ocupados** — para renderizar isso o app precisa do conjunto completo de
  slots teóricos e subtrair. Fontes possíveis: `GET .../disponibilidade` (grade) fatiada por
  `duracaoMinutos` do serviço, menos `horarios`. **É lógica de cliente não especificada** — a
  alternativa é mostrar só os livres, perdendo o cinza do design.
- **Quais dias do mês estão disponíveis (o cinza `.25` do calendário) não tem endpoint.**
  `horarios-livres` é **por dia**; pintar 30 dias exigiria 30 requisições. Derivar de
  `GET /profissionais/{id}/disponibilidade` (dias da semana com faixa) aproxima — e os dias cinzas
  do design são exatamente sábados e domingos, o que **contradiz** a grade `TER — SÁB` do frame 17.
  **Inconsistência do design a resolver.** Bloqueios pontuais
  (`GET /profissionais/{profissionalId}/bloqueios`) também deveriam apagar dias e não há como
  saber quais sem varrer o mês. **Falta** um `GET /profissionais/{id}/dias-disponiveis?mes=YYYY-MM`.
- `HORÁRIOS · SEXTA, 11 SET` ← derivado da data selecionada (`SEXTA` completo aqui, contra `SEX`
  abreviado no card do frame 18 — dois formatos de dia da semana no mesmo sistema).
- `Setembro 2026` ← mês do calendário, capitalizado (`Setembro`, não `SETEMBRO`).
- `PASSO 03 DE 04` ← estado do wizard, não vem da API. Zero-padded (`03`, `04`).
- O ponto dourado no dia 1 = **hoje** (não é seleção — a seleção é o box com borda no dia 11).

### 5.5 Estados

- **Padrão (desenhado):** data 11 selecionada, horário 15:30 selecionado, CTA habilitado.
- **Nada selecionado / CTA desabilitado:** não desenhado. O CTA aparece sempre no mesmo estilo
  cheio; não há variante `disabled` em nenhuma tela do board.
- **Dia sem nenhum horário livre:** não desenhado (a grade 3×3 ficaria vazia).
- **Loading da grade após trocar de dia:** não desenhado.
- **Conflito ao confirmar** (`409 Horário ocupado ou bloqueado`, `422 Horário no passado ou fora da
  grade`): tratado no passo 04, não aqui — mas a mensagem de erro **não existe em nenhum frame**.

---

## 6. TABELA DE EQUIVALÊNCIA DARK → LIGHT (o tema claro)

Regra geral extraída da comparação linha a linha: **não é uma inversão mecânica de alfa.** Os alfas
do light são quase sempre ligeiramente diferentes (texto preto sobre creme precisa de menos
opacidade para o mesmo peso óptico; bordas precisam de mais). Toda linha abaixo é um par literal
encontrado no arquivo.

### 6.1 Base

| token semântico | dark (03/06) | light (18/19) | observação |
|---|---|---|---|
| fundo da tela | `#0A0A0A` | `#F1EBE0` | inversão exata dos dois tons da marca |
| tinta base (`color` do frame) | `#F1EBE0` | `#0A0A0A` | idem |
| moldura do frame | `1px solid var(--frame,#242424)` | `1px solid var(--frame,#242424)` | **não muda** — é chrome do board, não do app |
| radius | `var(--r,2px)` | `var(--r,2px)` | não muda |

### 6.2 Status bar

| elemento | dark | light |
|---|---|---|
| barras de sinal 1–3 (`background`) | `#F1EBE0` | `#0A0A0A` |
| barra de sinal 4 (`background`) | `rgba(241,235,224,.35)` | `rgba(10,10,10,.3)` |
| bateria (`border`) | `1px solid rgba(241,235,224,.45)` | `1px solid rgba(10,10,10,.4)` |
| bateria (preenchimento) | `#F1EBE0` | `#0A0A0A` |

### 6.3 Dourado — **a linha mais importante da tabela**

| uso do dourado | dark | light |
|---|---|---|
| **borda de contêiner** (card do próximo agendamento; box do dia selecionado; box do horário selecionado) | `1px solid var(--gold,#C9A96A)` | `1px solid var(--gold,#C9A96A)` — **NÃO MUDA** |
| **texto** eyebrow `PRÓXIMO AGENDAMENTO` | `var(--gold,#C9A96A)` | `#A8894F` |
| **texto** link `DETALHES` | `var(--gold,#C9A96A)` | `#A8894F` |
| **texto** link `REPETIR` | `var(--gold,#C9A96A)` | `#A8894F` |
| **texto** rótulo da aba ativa | `var(--gold,#C9A96A)` | `#A8894F` |
| **fill** indicador 14×1px da aba ativa | `var(--gold,#C9A96A)` | `#A8894F` |
| **fill** ponto 3×3 de "hoje" no calendário | `var(--gold,#C9A96A)` | `#A8894F` |
| **texto** número do dia selecionado (11) | `var(--gold,#C9A96A)` | `#A8894F` |
| **texto** horário selecionado (15:30) | `var(--gold,#C9A96A)` | `#A8894F` |

Regra: **borda dourada fica `#C9A96A`; dourado tipográfico e marcas sólidas pequenas viram `#A8894F`.**

Consequência técnica: no light o `#A8894F` é **hardcoded** — não passa por `var(--gold)` —, enquanto
a borda continua em `var(--gold,#C9A96A)`. Se o tema claro for implementado com um único token de
dourado, a borda muda de aparência em relação ao design. Modelar **dois tokens**:
`--gold-stroke` (`#C9A96A` nos dois temas) e `--gold-ink` (`#C9A96A` dark / `#A8894F` light).
`#A8894F` é, aliás, uma das opções do prop `dourado` do editor
(`["#C9A96A","#D6BC85","#A8894F","#B9B4A6"]`) — é o mesmo dourado escurecido da paleta.

### 6.4 Texto sobre o fundo da tela

| papel | dark | light | Δ alfa |
|---|---|---|---|
| eyebrow de data (`TERÇA-FEIRA, 1 DE SETEMBRO`) | `rgba(241,235,224,.48)` | `rgba(10,10,10,.5)` | .48 → .5 |
| eyebrow `ÚLTIMA VISITA` | `rgba(241,235,224,.48)` | `rgba(10,10,10,.5)` | .48 → .5 |
| eyebrow `HORÁRIOS · SEXTA, 11 SET` | `rgba(241,235,224,.48)` | `rgba(10,10,10,.5)` | .48 → .5 |
| `PASSO 03 DE 04` | `rgba(241,235,224,.45)` | `rgba(10,10,10,.45)` | **igual** |
| seta voltar `←` | `rgba(241,235,224,.75)` | `rgba(10,10,10,.7)` | .75 → .7 |
| seta de mês ativa `›` | `rgba(241,235,224,.75)` | `rgba(10,10,10,.7)` | .75 → .7 |
| seta de mês apagada `‹` | `rgba(241,235,224,.4)` | `rgba(10,10,10,.4)` | **igual** |
| cabeçalho de semana (`D S T Q Q S S`) | `rgba(241,235,224,.38)` | `rgba(10,10,10,.4)` | .38 → .4 |
| dia disponível do calendário | `rgba(241,235,224,.8)` | `rgba(10,10,10,.75)` | .8 → .75 |
| dia indisponível do calendário | `rgba(241,235,224,.25)` | `rgba(10,10,10,.25)` | **igual** |
| horário ocupado (`11:00`, `18:30`) | `rgba(241,235,224,.22)` | `rgba(10,10,10,.25)` | .22 → .25 |
| item de lista principal (`Corte & Barba`) | `rgba(241,235,224,.8)` | `rgba(10,10,10,.8)` | **igual** |
| item de lista secundário (`· 14 de agosto`) | `rgba(241,235,224,.4)` | `rgba(10,10,10,.4)` | **igual** |
| link neutro (`REAGENDAR`) | `rgba(241,235,224,.5)` | `rgba(10,10,10,.5)` | **igual** |
| rótulo de aba inativa | `rgba(241,235,224,.4)` | `rgba(10,10,10,.45)` | .4 → .45 |
| dia "hoje" (número 1) e títulos Playfair | *(sem `color` — herda)* | *(sem `color` — herda)* | a herança faz o trabalho |

### 6.5 Texto dentro do card dourado

| papel | dark | light | Δ alfa |
|---|---|---|---|
| linha de data/hora (`SEX, 11 SET · 15:30 — 16:30`) | `rgba(241,235,224,.72)` | `rgba(10,10,10,.65)` | .72 → .65 |
| linha de profissional (`Stewer Gabriel · Visagista`) | `rgba(241,235,224,.62)` | `rgba(10,10,10,.6)` | .62 → .6 |
| régua interna do card | `rgba(241,235,224,.12)` | `rgba(10,10,10,.12)` | **igual** |
| **fundo do card** | *(ausente — transparente)* | `rgba(255,255,255,.35)` | **light ADICIONA um fundo** |

O `background:rgba(255,255,255,.35)` do card é a única superfície elevada do tema claro (no dark a
elevação é feita só pela borda dourada). Token novo: `--surface-raised`
(`transparent` dark / `rgba(255,255,255,.35)` light).

### 6.6 Bordas e réguas

| papel | dark | light | Δ alfa |
|---|---|---|---|
| régua de item de lista (`border-bottom` da última visita) | `1px solid rgba(241,235,224,.1)` | `1px solid rgba(10,10,10,.12)` | .1 → .12 |
| `border-top` da tab bar | `1px solid rgba(241,235,224,.1)` | `1px solid rgba(10,10,10,.12)` | .1 → .12 |
| borda de horário livre | `1px solid rgba(241,235,224,.16)` | `1px solid rgba(10,10,10,.18)` | .16 → .18 |

Bordas no light são sistematicamente **mais opacas** que no dark (+.02).

### 6.7 Botão primário (CTA)

| propriedade | dark | light |
|---|---|---|
| `background` | `#F1EBE0` | `#0A0A0A` |
| `color` | `#0A0A0A` | `#F1EBE0` |
| `style-hover` | `opacity:.92` | `opacity:.9` |
| resto (`border-radius:var(--r,2px);padding:18px;text-align:center;font-size:10.5px;font-weight:600;letter-spacing:.22em`) | igual | igual |

O CTA é **sempre o contraste máximo invertido em relação ao fundo** — creme no dark, preto no light.

### 6.8 Chrome de sistema

| papel | dark | light | Δ |
|---|---|---|---|
| fundo da tab bar | `#0A0A0A` | `#F1EBE0` | = fundo da tela |
| home indicator | `rgba(241,235,224,.2)` | `rgba(10,10,10,.22)` | .2 → .22 |

### 6.9 O que **não** muda entre os temas (verificado linha a linha)

Nenhum valor de `font-size`, `font-weight`, `letter-spacing`, `line-height`, `padding`, `margin`,
`gap`, `width`, `height`, `border-radius`, `grid-template-columns`, `display`, `align-*` ou
`justify-*` difere entre 03↔18 e 06↔19. **O tema claro é 100% uma troca de cores**, com exatamente
três exceções não-cromáticas:

1. `background:rgba(255,255,255,.35)` adicionado ao card do próximo agendamento (18);
2. `font-weight:600` adicionado ao dia selecionado do calendário (19) — no dark o dia 11 não tem `font-weight`;
3. `opacity` do hover do CTA: `.92` → `.9`.

### 6.10 Tokens propostos para o tema (derivados só da tabela acima)

```
                dark                     light
bg              #0A0A0A                  #F1EBE0
ink             #F1EBE0                  #0A0A0A
inkOnBg80       rgba(241,235,224,.8)     rgba(10,10,10,.8)
inkOnBg75       rgba(241,235,224,.75)    rgba(10,10,10,.7)
inkOnBg65       rgba(241,235,224,.72)    rgba(10,10,10,.65)
inkOnBg60       rgba(241,235,224,.62)    rgba(10,10,10,.6)
inkOnBg55       rgba(241,235,224,.55)    (não usado nos frames light)
inkOnBg50       rgba(241,235,224,.5)     rgba(10,10,10,.5)
inkOnBg48       rgba(241,235,224,.48)    rgba(10,10,10,.5)
inkOnBg45       rgba(241,235,224,.45)    rgba(10,10,10,.45)
inkTab          rgba(241,235,224,.4)     rgba(10,10,10,.45)
inkOnBg40       rgba(241,235,224,.4)     rgba(10,10,10,.4)
inkWeek         rgba(241,235,224,.38)    rgba(10,10,10,.4)
inkDisabled     rgba(241,235,224,.25)    rgba(10,10,10,.25)
inkSlotOff      rgba(241,235,224,.22)    rgba(10,10,10,.25)
strokeSlot      rgba(241,235,224,.16)    rgba(10,10,10,.18)
strokeRule      rgba(241,235,224,.1)     rgba(10,10,10,.12)
divider         rgba(241,235,224,.12)    rgba(10,10,10,.12)
homeIndicator   rgba(241,235,224,.2)     rgba(10,10,10,.22)
surfaceRaised   transparent              rgba(255,255,255,.35)
goldStroke      #C9A96A                  #C9A96A
goldInk         #C9A96A                  #A8894F
ctaBg           #F1EBE0                  #0A0A0A
ctaInk          #0A0A0A                  #F1EBE0
ctaHoverOpacity .92                      .9
```

Atenção: `inkOnBg48` e `inkOnBg50` **colapsam no mesmo valor no light** (`rgba(10,10,10,.5)`) mas são
distintos no dark (`.48` vs `.5`) — manter os dois tokens ou aceitar a fusão como decisão
consciente. Idem `inkTab` vs `inkOnBg40`: distintos no light (`.45` vs `.4`), iguais no dark (`.4`).

### 6.11 Valores dark que os frames light **não** cobrem

Os frames 18/19 só cobrem os tokens usados em 03 e 06. Estes valores aparecem nas telas ADMIN (e nas
demais telas dark) e **não têm equivalente light definido em nenhum lugar do design** — precisam ser
inferidos pela regra "+.02 em bordas, ±.02 em textos":

- `rgba(241,235,224,.8)` — texto do botão `NOVO SERVIÇO`
- `rgba(241,235,224,.6)` — rótulo `ADICIONAR PROFISSIONAL`
- `rgba(241,235,224,.55)` — `Receita estimada da semana`, `EDITAR`, `GERENCIAR`, o `+`
- `rgba(241,235,224,.5)` — especialidade no card do profissional
- `rgba(241,235,224,.45)` — rótulos de métrica 8.5px, meta dos serviços, contagem de equipe, linha de agenda
- `rgba(241,235,224,.4)` / `rgba(241,235,224,.45)` — hovers de `border-color`
- `rgba(241,235,224,.38)` — notas de rodapé 11px de 16 e 17
- `rgba(241,235,224,.35)` — labels do gráfico de barras
- `rgba(241,235,224,.22)` — borda do botão `NOVO SERVIÇO`
- `rgba(241,235,224,.2)` — borda dashed do slot de convite
- `rgba(241,235,224,.16)` — barras cinzas do gráfico
- `rgba(241,235,224,.14)` — borda do card do profissional
- `rgba(241,235,224,.12)` — trilha da barra de ocupação
- `rgba(241,235,224,.1)` — réguas dos blocos do dashboard e das linhas de serviço

**As três telas de ADMIN não foram desenhadas em light.** Se o app tem tema claro global, o perfil
ADMIN roda em tema derivado, sem validação visual.

---

## 7. Lacunas consolidadas (o que bloqueia a implementação destas 5 telas)

**API — precisa de endpoint novo**

1. **Agregação para o Dashboard** (frame 15): nenhuma das 7 métricas é calculável por endpoint.
   Criar `GET /relatorios/semana` (ver 1.4). *Bloqueante.*
2. **`GET /agendamentos/agenda` sem `profissionalId` para ADMIN** e/ou com range `inicio`/`fim`:
   hoje o admin não consegue ver o ateliê inteiro, nem um período. *Bloqueante para 15.*
3. **Convite/criação de profissional** (frame 17): `POST /profissionais` exige `usuarioId` e não há
   endpoint de convite nem de listagem de usuários do tenant. *Bloqueante para o slot dashed.*
4. **Dias disponíveis do mês** (frame 19): `GET /profissionais/{id}/dias-disponiveis?mes=YYYY-MM` —
   hoje pintar o calendário exigiria 30 chamadas. *Bloqueante para o cinza dos dias.*
5. **Slots ocupados** (frame 19): `horarios-livres` só devolve livres; o design mostra ocupados em
   cinza. Ou a API devolve todos com um flag, ou a tela perde o cinza.
6. **Reagendamento** (frame 18, `REAGENDAR`): só existe cancelar + criar. Fluxo composto.
7. **Metadados de paginação em `GET /clientes`**: array puro, sem total — impede contagem.

**Design — precisa de decisão ou tela nova**

8. Formulários de **criar/editar serviço** (frame 16) e de **editar profissional** (frame 17).
9. Estado **inativo** de serviço e de profissional (nenhum desenhado, apesar da nota de rodapé).
10. Estados de **loading, erro e vazio** em todas as 5 telas (zero desenhados).
11. **Plurais**: `1 PROFISSIONAL ATIVO` → `N PROFISSIONAIS ATIVOS` não existe.
12. **Fallback de `AGENDA · TER — SÁB, 09:00 — 19:00`** quando a grade não é uniforme/contígua.
13. **Ambiguidade `+3 VS. JULHO`** contra `CLIENTES NOVOS NO MÊS` em setembro — mês errado no mock?
14. **Contradição sábado**: frame 17 diz `TER — SÁB`, frame 19 pinta todos os sábados como indisponíveis.
15. **Dois formatos de dia da semana**: `SEX` (card do 18) vs `SEXTA` (eyebrow do 19).
16. `Visagista` (card do 18) vs `VISAGISTA & CONSULTOR DE IMAGEM` (frame 17) para o mesmo campo.
17. **Ordenação da lista de serviços** divergente da API (que ordena por nome).
18. **Navegação do ADMIN sem acesso a clientes** (tab bar de 3 itens; frames 13/14 sem entrada).
19. **Nenhum toggle de tema desenhado** — o light entra pelo `useColorScheme()` do sistema.
20. **Nenhuma variante `disabled` de CTA** em todo o board.
