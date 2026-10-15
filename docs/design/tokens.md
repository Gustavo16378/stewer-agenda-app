# Stewer Gabriel · App de agendamento — Tabela DEFINITIVA de tokens de design

Fonte: `c:/Users/Gustavo/Documents/stewer-app/stewer-agenda-app/design/Stewer Gabriel App.dc.html`
(764 linhas, 19 frames de 390×844 + cover plate). Varredura completa das linhas 22–764.
`support.js` e `image-slot.js` ignorados, conforme instrução.

**Todos os valores abaixo foram extraídos literalmente do CSS inline. Nenhum foi arredondado ou inferido.**

Delimitação exata usada nas contagens:

| Zona | Linhas | O que é |
|---|---|---|
| Cover plate | 22–43 | placa de capa do board (não é tela) |
| Header seção 01 PERFIL CLIENTE | 44–48 | chrome do board |
| **Frames 01–09 (dark)** | 49–328 | telas |
| Header seção 02 PERFIL PROFISSIONAL | 329–333 | chrome do board |
| **Frames 10–14 (dark)** | 334–504 | telas |
| Header seção 03 PERFIL ADMIN | 505–509 | chrome do board |
| **Frames 15–17 (dark)** | 510–630 | telas |
| Header seção 04 VARIANTES LIGHT | 631–635 | chrome do board |
| **Frames 18–19 (light)** | 636–733 | telas |
| Script DC (props/logic) | 740–764 | variantes do board, não da UI |

Fatos globais verificados por grep (zero ocorrências):
`font-style` = 0 · `text-transform` = 0 · `box-shadow` = 0 · `gradient` = 0.
As caps são **texto literalmente em maiúsculas no HTML**, não `text-transform`. O sistema é
inteiramente plano: nenhuma sombra, nenhum gradiente, nenhuma elevação — só filetes de 1px.
Os itálicos de Playfair (`ital,wght@1,400;1,500`) são carregados pelo Google Fonts mas **nunca usados**.

---

## 1. Variáveis CSS (não há `:root`; só fallbacks in-line)

| var() | Fallback | Ocorrências | Papel |
|---|---|---|---|
| `--canvas` | `#0F0F0F` | 1 | fundo do board (prancheta). **NÃO é cor de tela.** |
| `--gold` | `#C9A96A` | 60 (50 dark + 3 light + 7 chrome) | acento dourado da marca |
| `--cMuted` | `#7A756B` | 26 | texto secundário **do chrome do board** (legendas dos frames) |
| `--frame` | `#242424` | 21 | borda do mockup de telefone + regra da capa |
| `--cInk` | `#F1EBE0` | 10 | tinta do chrome do board |
| `--r` | `2px` | 62 | raio padrão |

Script DC (linhas 740–764) — variantes de apresentação do board, **não tokens de app**:

- `dourado` (color, default `#C9A96A`, options `#C9A96A`, `#D6BC85`, `#A8894F`, `#B9B4A6`)
- `cantos` (range 0–10px, step 1, default **2**) → seta `--r`
- `prancheta` (enum `Grafite` | `Marfim`, default `Grafite`)
  - `Grafite`: `--canvas:#0F0F0F` · `--cInk:#F1EBE0` · `--cMuted:#7A756B` · `--frame:#242424`
  - `Marfim`: `--canvas:#ECE5D8` · `--cInk:#141210` · `--cMuted:#6E675C` · `--frame:#D8CFBD`

---

## 2. Cores — TEMA DARK (frames 01–17, linhas 49–328 / 334–504 / 510–630)

### 2.1 Sólidas

| Valor | Usos | Papel semântico |
|---|---|---|
| `#0A0A0A` | 32 | **fundo de tela** (17× no root do frame) · fundo da tab bar (9×) · **texto sobre botão primário** (6×) |
| `#F1EBE0` | 91 | **texto primário** (`color` no root do frame, 17×) · barras de sinal da status bar (51×) · preenchimento da bateria (17×) · **fundo do botão primário** (6×) |
| `#C9A96A` | 50 | **acento dourado**: borda do losango do logo, borda do card "PRÓXIMO AGENDAMENTO", borda do dia selecionado, borda do slot de horário selecionado, borda dos chips de dia ativos, indicador ativo da tab bar (14×1px), texto de status (`CONFIRMADO`, `ATIVO`, `SELECIONADO`, `PRIMEIRA VISITA`), links de ação (`DETALHES`, `REPETIR`, `EDITAR`, `VER FICHA COMPLETA`), dot de "hoje" no calendário (3×3px), barra ativa do gráfico, preenchimento da barra de ocupação, knob do toggle ligado |
| `#121110` | 6 | **superfície elevada** (card sobre o fundo): cards de atendimento da agenda do dia (4×), painel "ANOTAÇÕES DE VISAGISMO" (2×) |
| `#0E0E0D` | 1 | **superfície de intervalo/pausa** (bloco `INTERVALO` na agenda do dia) |
| `#7A756B` | 17 | legenda do frame no board (`01 · SPLASH` …) — **chrome, não token de app** |
| `#242424` | 17 | borda do mockup de telefone — **chrome, não token de app** |

### 2.2 A ESCALA DE OPACIDADE SOBRE `#F1EBE0` — `rgba(241,235,224,α)`

28 degraus distintos. Ordenados por α. `P` = distribuição por propriedade CSS.

| α | Usos | P | Papel semântico exato |
|---|---|---|---|
| `.1` | **53** | bd-bottom 39 · bd-top 9 · border 4 · bg 1 | **divisor / hairline padrão**. `border-bottom` de toda linha de lista; `border-top` da tab bar (9×); borda dos cards de atendimento `#121110`; régua interna do card de equipe |
| `.12` | 8 | bg 5 · border 3 | divisor **dentro** de card (`height:1px`); trilha da barra de ocupação (`height:2px`); divisor vertical (`width:1px`) do bloco de data; borda do chip de dia desligado; borda do botão `CANCELAR` |
| `.14` | 6 | border 5 · bd-bottom 1 | **contorno de card/contêiner** (Confirmação, Detalhe, Bloqueios, Equipe); underline da barra de abas `ENTRAR / CRIAR CONTA` |
| `.16` | 17 | bg 6 · border(solid) 8 · border(dashed) 3 | **contorno de input / chip de horário**; barras inativas do gráfico (`background`); moldura tracejada de slot `DISPONÍVEL` |
| `.18` | 2 | border 2 | contorno dos campos `E-MAIL` e `TELEFONE` (tela 02) |
| `.2` | 17 | bg 9 · border 7 · dashed 1 | **home indicator** (`background`, 118×4px, 9×); anel do avatar 42px na lista de clientes (7×); moldura tracejada "ADICIONAR PROFISSIONAL" |
| `.22` | 7 | border 5 · color 2 | **borda de botão secundário/ghost** (`SAIR DA CONTA`, `REMARCAR`, `ADICIONAR BLOQUEIO`, `NOVO SERVIÇO`, `NOVO AGENDAMENTO PARA ESTE CLIENTE`); texto de horário **indisponível** (`11:00`, `18:30`) |
| `.25` | 12 | color 8 · border 3 · bg 1 | **dia de calendário desabilitado** (8×); anel do avatar grande (58px e 54px) e do toggle desligado; régua de 34×1px do splash |
| `.28` | 2 | color 2 | letra de chip de dia **não atendido** (`D`, `S` em Disponibilidade) |
| `.3` | 11 | color 9 · bg 1 · bd-color 1 | chevron `›` da lista de clientes; rodapé `STEWERGABRIEL.COM`; knob do toggle desligado; texto `INTERVALO`; hover de borda do botão `CANCELAR` |
| `.32` | 3 | color 3 | texto `DISPONÍVEL` (slot vago da agenda) |
| `.35` | **35** | bg 17 · color 18 | **4ª barra de sinal (dim) da status bar** (17×, uma por frame dark); placeholder de input (`seunome@email.com`, `+55 (11) 90000-0000`, `Buscar por nome`); hora na calha de slot vago; chevron `›` de Disponibilidade; letras dos dias no gráfico de barras; `ATUALIZADO EM 14 AGO · STEWER GABRIEL` |
| `.38` | 11 | color 11 | cabeçalho de dias da semana do calendário (`D S T Q Q S S`, 7×); textos legais/rodapé de ajuda (4×) |
| `.4` | **36** | color 35 · bd-color 1 | **label inativo da tab bar** (21×); status `CONCLUÍDO` / `CANCELADO`; duração `60 MIN`; setas `‹` (mês/dia anterior) e `×` (remover bloqueio); aba `CRIAR CONTA`; span de data `· 14 de agosto` |
| `.42` | 10 | color 10 | `ÚLTIMA VISITA · 14 AGO` da lista de clientes (7×); label do botão `CANCELAR`; `Enviaremos um código de confirmação.`; `Cancelamento sem custo até 24 horas antes do horário marcado.` |
| `.45` | **84 (máximo)** | color 60 · border 17+1 · bg 1 · bd-color 5 | **texto secundário / metadados em caps** — o valor mais usado do arquivo. Também: contorno da bateria (`border:1px`, 17×); ícone de busca (`border:1.5px` + haste 5×1.5px); **cor de hover de borda** dos botões ghost (5×) |
| `.48` | 20 | color 20 | **label de seção (eyebrow)** — `DADOS PESSOAIS`, `PREFERÊNCIAS`, `PRÓXIMOS`, `HISTÓRICO`, `HORÁRIOS · SEXTA, 11 SET`, `NOVO AGENDAMENTO`, `VISÃO GERAL`, `AGENDA · HOJE`, `O ATELIÊ, NO SEU TEMPO`, `TERÇA-FEIRA, 1 DE SETEMBRO` |
| `.5` | 14 | color 14 | caps de meta com um passo mais de presença: hora na calha de atendimento agendado; `15:30 · STEWER GABRIEL`; `CORTE ASSINATURA` dentro do card; `REAGENDAR`; `VISAGISTA & CONSULTOR DE IMAGEM` (tela 17); `VISAGISMO & CONSULTORIA DE IMAGEM` (splash) |
| `.55` | 12 | color 12 | ações em caps `EDITAR` / `GERENCIAR`; `HOJE · 09:00 — 10:00`; subtítulo `Fundador do ateliê`; `Stewer Gabriel` (preferido); `Receita estimada da semana`; sinal `+` |
| `.6` | 6 | color 6 | rótulo de linha de formulário (`Início`, `Término`, `Intervalo`); cor de `<a>` nos termos (2×); `ADICIONAR PROFISSIONAL` |
| `.62` | 1 | color 1 | `Stewer Gabriel · Visagista` (12.5px, card de próximo agendamento) |
| `.65` | 1 | color 1 | label do botão `SAIR DA CONTA` |
| `.72` | 1 | color 1 | `SEX, 11 SET · 15:30 — 16:30` (10.5px / 500 / .16em) |
| `.75` | 12 | color 12 | **seta de voltar `←`** (5×) e `›` de avanço; labels `REMARCAR`, `ADICIONAR BLOQUEIO`, `NOVO AGENDAMENTO PARA ESTE CLIENTE`; corpo das anotações (13px / 1.75) |
| `.78` | 1 | color 1 | corpo das anotações da Ficha do cliente (13px / 1.8) |
| `.8` | 22 | color 22 | **número de dia de calendário disponível** (18×); `Corte & Barba` da última visita; label do botão `NOVO SERVIÇO` |
| `.85` | 13 | color 13 | **preço de serviço** `R$ 320` (6×, 13.5px/500); nome de serviço no histórico (14px, 4×); labels de preferência (13.5px, 3×) |
| `.88` | 10 | color 10 | **valor de campo / texto de corpo mais forte**: `Stewer Gabriel`, `Sexta, 11 de setembro`, `15:30 — 16:30` (14.5px); `rafael.duarte@email.com`, `+55 (11) 98244-1157` (13.5px); serviços do histórico da ficha (14px, 5×) |

### 2.3 Ladder dark, forma compacta (28 degraus, na ordem exata)

```
.1  .12  .14  .16  .18  .2  .22  .25  .28  .3  .32  .35  .38  .4  .42  .45  .48
.5  .55  .6  .62  .65  .72  .75  .78  .8  .85  .88
```

---

## 3. Cores — TEMA LIGHT (frames 18–19, linhas 636–733)

### 3.1 Sólidas

| Valor | Usos | Papel semântico |
|---|---|---|
| `#F1EBE0` | 5 | **fundo de tela** (2×, root dos frames) · fundo da tab bar (1×) · **texto sobre botão primário** (2×) |
| `#0A0A0A` | 12 | **texto primário** (`color` no root, 2×) · barras de sinal (6×) · preenchimento da bateria (2×) · **fundo do botão primário** (2×) |
| `#A8894F` | 8 | **acento dourado sobre claro** (texto/ícone): `PRÓXIMO AGENDAMENTO`, `DETALHES`, `REPETIR`, label + indicador ativo da tab bar, dot de "hoje", número do dia selecionado `11`, horário selecionado `15:30` |
| `#C9A96A` | 3 | **acento dourado de BORDA — não muda no light**: borda do card de próximo agendamento, borda do dia selecionado, borda do slot de horário selecionado |
| `rgba(255,255,255,.35)` | 1 | **preenchimento (wash) do card destacado** no light — o único uso de branco puro do arquivo; no dark esse card não tem `background` |
| `#7A756B` / `#242424` | 2 / 2 | chrome do board (legenda + borda do mockup) |

### 3.2 A ESCALA DE OPACIDADE SOBRE `#0A0A0A` — `rgba(10,10,10,α)`

13 degraus distintos.

| α | Usos | P | Papel semântico exato |
|---|---|---|---|
| `.12` | 3 | bg 1 · bd-bottom 1 · bd-top 1 | **divisor / hairline** (equivale ao `.1` do dark): régua interna do card, `border-bottom` da linha de última visita, `border-top` da tab bar |
| `.18` | 6 | border 6 | **contorno de chip de horário** (equivale ao `.16` do dark) |
| `.22` | 1 | bg 1 | **home indicator** |
| `.25` | 10 | color 10 | dia de calendário desabilitado (8×) + horário indisponível `11:00` / `18:30` (2×) |
| `.3` | 2 | bg 2 | 4ª barra de sinal (dim) da status bar |
| `.4` | 11 | color 9 · border 2 | cabeçalho de dias da semana (7×), seta `‹`, span `· 14 de agosto`; **contorno da bateria** (`border`, 2×) |
| `.45` | 4 | color 4 | **label inativo da tab bar** (3×) + `PASSO 03 DE 04` |
| `.5` | 4 | color 4 | **label de seção (eyebrow)**: `TERÇA-FEIRA, 1 DE SETEMBRO`, `ÚLTIMA VISITA`, `HORÁRIOS · SEXTA, 11 SET`, + `REAGENDAR` |
| `.6` | 1 | color 1 | `Stewer Gabriel · Visagista` (12.5px) |
| `.65` | 1 | color 1 | `SEX, 11 SET · 15:30 — 16:30` (10.5px / 500 / .16em) |
| `.7` | 2 | color 2 | seta de voltar `←` e `›` de avanço de mês |
| `.75` | **20** | color 20 | **número de dia de calendário disponível** (todos os 20) |
| `.8` | 1 | color 1 | `Corte & Barba` da última visita (13.5px) |

### 3.3 Ladder light, forma compacta (13 degraus)

```
.12  .18  .22  .25  .3  .4  .45  .5  .6  .65  .7  .75  .8
```

### 3.4 Pares dark ↔ light confirmados frame a frame

Comparando 03 Home ↔ 18 Home light e 06 Data e horário ↔ 19 Data e horário light
(são as mesmas telas, então cada par abaixo é uma correspondência 1:1 observada, não inferida).

| Papel | DARK | LIGHT |
|---|---|---|
| fundo de tela | `#0A0A0A` | `#F1EBE0` |
| texto primário | `#F1EBE0` | `#0A0A0A` |
| fundo botão primário | `#F1EBE0` | `#0A0A0A` |
| texto sobre botão primário | `#0A0A0A` | `#F1EBE0` |
| hover do botão primário | `opacity:.92` | `opacity:.9` |
| acento dourado (texto/ícone) | `#C9A96A` | `#A8894F` |
| acento dourado (borda) | `#C9A96A` | `#C9A96A` *(idêntico)* |
| wash do card destacado | *(sem background)* | `rgba(255,255,255,.35)` |
| divisor / hairline | `rgba(241,235,224,.1)` | `rgba(10,10,10,.12)` |
| divisor interno de card | `rgba(241,235,224,.12)` | `rgba(10,10,10,.12)` |
| contorno de chip de horário | `rgba(241,235,224,.16)` | `rgba(10,10,10,.18)` |
| home indicator | `rgba(241,235,224,.2)` | `rgba(10,10,10,.22)` |
| horário indisponível | `rgba(241,235,224,.22)` | `rgba(10,10,10,.25)` |
| dia de calendário desabilitado | `rgba(241,235,224,.25)` | `rgba(10,10,10,.25)` |
| barra de sinal dim (status bar) | `rgba(241,235,224,.35)` | `rgba(10,10,10,.3)` |
| cabeçalho de dias da semana | `rgba(241,235,224,.38)` | `rgba(10,10,10,.4)` |
| contorno da bateria | `rgba(241,235,224,.45)` | `rgba(10,10,10,.4)` |
| span de data secundária | `rgba(241,235,224,.4)` | `rgba(10,10,10,.4)` |
| label inativo da tab bar | `rgba(241,235,224,.4)` | `rgba(10,10,10,.45)` |
| meta em caps / `PASSO 03 DE 04` | `rgba(241,235,224,.45)` | `rgba(10,10,10,.45)` |
| label de seção (eyebrow) | `rgba(241,235,224,.48)` | `rgba(10,10,10,.5)` |
| ação em caps secundária (`REAGENDAR`) | `rgba(241,235,224,.5)` | `rgba(10,10,10,.5)` |
| texto de meta 12.5px | `rgba(241,235,224,.62)` | `rgba(10,10,10,.6)` |
| linha de data/hora 10.5px/500 | `rgba(241,235,224,.72)` | `rgba(10,10,10,.65)` |
| seta de navegação ativa | `rgba(241,235,224,.75)` | `rgba(10,10,10,.7)` |
| dia de calendário disponível | `rgba(241,235,224,.8)` | `rgba(10,10,10,.75)` |
| corpo de texto forte 13.5px | `rgba(241,235,224,.8)` | `rgba(10,10,10,.8)` |

> Regra observada: no light as opacidades sobem ~2 pontos nos elementos estruturais
> (divisor `.1→.12`, contorno `.16→.18`, indicator `.2→.22`) e **descem** nos textos de
> alto contraste (`.8→.75`, `.75→.7`, `.72→.65`), porque preto sobre marfim rende mais
> contraste por ponto de alfa do que marfim sobre preto.

---

## 4. Tipografia

### 4.1 Famílias

| Uso | Declaração exata | Ocorrências | Pesos carregados |
|---|---|---|---|
| Títulos / números display | `font-family:'Playfair Display',serif` | 66 | 400, 500, 600 + itálico 400, 500 *(itálico nunca usado)* |
| UI, labels em caps, corpo | `font-family:Inter,sans-serif` (declarado 1× no board, herdado por tudo) | 1 | 400, 500, 600 |

### 4.2 Todos os `font-size` do arquivo (32 valores distintos)

| px | Usos | Família | Papel |
|---|---|---|---|
| `7.5px` | 7 | Inter 600 | letras dos dias no gráfico de barras do dashboard |
| `8px` | 1 | Inter 600 | `ATUALIZADO EM 14 AGO · STEWER GABRIEL` (menor caps do sistema) |
| `8.5px` | **67** | Inter 600 | micro-caps: status (`CONFIRMADO`, `CONCLUÍDO`, `ATIVO`), duração (`60 MIN`), cabeçalho de dias do calendário, rótulos de campo do card de confirmação, legendas de estatística, swatches da capa |
| `9px` | **108** | Inter 600 | **caps padrão**: labels de seção, metadados, tab bar, ações |
| `9.5px` | 10 | Inter 600 | coluna de data do histórico (`14 AGO`, 9×) + `ADICIONAR PROFISSIONAL` |
| `10px` | 47 | Inter 600 | legenda de frame no board (19×), caps de aba (`ENTRAR`), chips de dia, calha de hora da agenda, labels de botão ghost, número de seção do board |
| `10.5px` | 10 | Inter 600 / 500 | **label do botão primário** (8×, weight 600, `.22em`) + linha `SEX, 11 SET · 15:30 — 16:30` (2×, weight 500, `.16em`) |
| `11px` | 5 | Inter 400 | textos de ajuda/legais |
| `11.5px` | 1 | Inter 400 | `Cancelamento sem custo até 24 horas antes do horário marcado.` |
| `12px` | 23 | Inter 500/600 | **chip de horário** (18×, `.08em`) + preço no histórico da ficha (5×) |
| `12.5px` | 6 | Inter 400 | texto de meta / rótulo de linha de dados |
| `13px` | **85** | Inter 400/600 + Playfair 1× | **número do dia no calendário** (60× nos dois temas) + relógio `9:41` da status bar (19×, weight 600) + rótulos de Disponibilidade (3×) + corpo das anotações (2×) + `SG` do losango da tela 02 (Playfair) |
| `13.5px` | 15 | Inter 400/500 | **corpo de lista / valor de campo**: preços de serviço (6×, weight 500), valores de perfil, labels de preferência, placeholder de busca, `Corte & Barba` |
| `14px` | 36 | Inter 400/500 + Playfair 7× | nome de cliente no card de agenda (weight 500), serviço no histórico, `12 de setembro`; chevron `›` (7×); avatar de 42px em Playfair (7×) |
| `14.5px` | 13 | Inter 400 | nome na lista de clientes (7×), valores do card de confirmação (3×), horários de Disponibilidade (3×) |
| `15px` | 4 | Inter 400 | setas `‹ ›` de dia + `×` de remover bloqueio |
| `16px` | 5 | Inter 400 | setas `‹ ›` de mês (4×) + `+` de adicionar profissional |
| `17px` | 3 | Playfair 2× / Inter 500 1× | `SG` da capa; avatar 54px da ficha; specimen "Inter" da capa |
| `18px` | 3 | Playfair | `Setembro 2026` (2×), `Corte Assinatura` do card de agendamento |
| `19px` | 22 | Playfair 15× / Inter 7× | nome de serviço nas listas (Playfair, 15×) · **seta de voltar `←`** (Inter, 7×) |
| `20px` | 2 | Playfair | wordmark do splash (`.32em`) · `Stewer Gabriel` na tela de equipe |
| `21px` | 4 | Playfair | `Corte Assinatura` (confirmação) + números do resumo do cliente (3×) |
| `22px` | 1 | Playfair | specimen "Playfair Display" da capa |
| `23px` | 3 | Playfair | título do card de próximo agendamento (2×) + nome do profissional (tela 05) |
| `24px` | 2 | Playfair | `R$ 190` da confirmação · `Rafael Duarte` do perfil |
| `25px` | 1 | Playfair | `Rafael Duarte` da ficha do cliente |
| `26px` | 2 | Playfair | wordmark da capa (`.3em`) · dia `11` do card de agendamento |
| `27px` | 1 | Playfair | `Terça, 1 de setembro` (agenda do dia) |
| `29px` | 12 | Playfair | **H1 padrão de tela interna** (Escolha o serviço, Data e horário, Clientes, Serviços, Equipe, Disponibilidade, Esta semana, …) |
| `30px` | 4 | Playfair | títulos das 4 seções do board |
| `31px` | 3 | Playfair | **H1 de boas-vindas / saudação** (`Bem-vindo.`, `Boa tarde, Rafael.` ×2) |
| `42px` | 3 | Playfair | **numeral de estatística** do dashboard (`32`, `78%`, `9`), sempre com `line-height:1` |

Escala Playfair isolada (66 declarações): `13 · 14 · 17 · 18 · 19 · 20 · 21 · 22 · 23 · 24 · 25 · 26 · 27 · 29 · 30 · 31 · 42`
Escala Inter isolada: `7.5 · 8 · 8.5 · 9 · 9.5 · 10 · 10.5 · 11 · 11.5 · 12 · 12.5 · 13 · 13.5 · 14 · 14.5 · 15 · 16 · 19`

### 4.3 `font-weight`

| Valor | Ocorrências explícitas | Nota |
|---|---|---|
| `400` | 1 (explícito, em `Bem-vindo.`) | padrão implícito de todo o corpo e de Playfair |
| `500` | 29 | preços, nome de cliente em card, chips de horário disponíveis, specimen Inter |
| `600` | **270** | **todas as caps** + relógio da status bar + chips de dia + chip de horário selecionado |

### 4.4 `letter-spacing` (13 valores, sempre em `em`)

| Valor | Usos | Onde |
|---|---|---|
| `.08em` | 20 | chips de horário (18×) + `SG` dos losangos (capa 17px, splash 19px) |
| `.1em` | 8 | calha de hora da agenda do dia (10px/600) |
| `.12em` | 3 | legendas dos swatches da capa (8.5px/600) |
| `.14em` | **62** | **labels da tab bar** (9px, 34×) + coluna de data do histórico (9.5px, 9×) + cabeçalho de dias do calendário (8.5px, 14×) + duração `60 MIN` / `PRIMEIRA VISITA` (8.5px) |
| `.16em` | 4 | `15:30 · STEWER GABRIEL` (9px) · `+3 VS. JULHO` (9px) · linha de data/hora do card (10.5px/500, 2×) |
| `.18em` | 41 | ações e status em caps (`EDITAR`, `REAGENDAR`, `CONFIRMADO`, `ÚLTIMA VISITA · 14 AGO`) |
| `.2em` | 46 | legenda de frame do board (10px, 19×) + metadados (`90 MIN`, `48 ATIVOS`, `SET`) + abas + botões ghost |
| `.22em` | 23 | **label do botão primário** (10.5px, 8×) + labels de estatística (8.5px) + botões ghost (10px) + `E-MAIL` / `TELEFONE` (9px) + `DISPONÍVEL` / `INTERVALO` (8.5px) |
| `.24em` | 34 | **label de seção / eyebrow** (9px, 24×) + rótulos de campo do card (8.5px, 10×) |
| `.26em` | 8 | eyebrow "grande" de topo de tela (9px): `TERÇA-FEIRA, 1 DE SETEMBRO`, `NOVO AGENDAMENTO`, `AGENDA · HOJE`, `VISÃO GERAL`, `O ATELIÊ, NO SEU TEMPO` |
| `.28em` | 1 | tagline da capa (10px) |
| `.3em` | 7 | número de seção do board (10px, 4×) + wordmark da capa (26px) + `VISAGISMO & CONSULTORIA DE IMAGEM` do splash (9px) + `STEWERGABRIEL.COM` (8.5px) |
| `.32em` | 1 | wordmark do splash (20px Playfair) |

**Compensação óptica:** texto com tracking grande recebe `padding-left` igual ao tracking para
voltar ao centro — `padding-left:.32em` no wordmark do splash e `padding-left:.3em` no
`VISAGISMO & CONSULTORIA DE IMAGEM`. Único caso de `padding` em `em` do arquivo.

### 4.5 `line-height` (só 5 declarações em todo o arquivo)

| Valor | Usos | Onde |
|---|---|---|
| `1` | 4 | os três numerais de 42px do dashboard + o `+` de 16px de adicionar profissional |
| `1.7` | 3 | textos legais/ajuda de 11px e 11.5px (termos, cancelamento, convite) |
| `1.75` | 1 | corpo das anotações de visagismo, 13px (tela 11) |
| `1.8` | 1 | corpo das anotações de visagismo, 13px (tela 14) |

Todo o resto usa o line-height default do renderizador — **nenhum título tem line-height explícito.**

---

## 5. O PADRÃO "LABEL EM CAPS"

É a assinatura do sistema: **Inter 600, corpo 8–10.5px, tracking .12–.3em, texto já em
maiúsculas no HTML, cor = um degrau da escala de opacidade da tinta.** `font-weight:600`
aparece 270 vezes no arquivo.

### 5.1 Os 5 papéis canônicos (dark → light)

| # | Papel | Especificação exata | Ocorrências | Light |
|---|---|---|---|---|
| **1** | **Label de seção / eyebrow** | `font-size:9px; font-weight:600; letter-spacing:.24em; color:rgba(241,235,224,.48)` | **11** | `letter-spacing:.24em; color:rgba(10,10,10,.5)` (2) |
| **1b** | Eyebrow de topo de tela (variante mais aberta) | `font-size:9px; font-weight:600; letter-spacing:.26em; color:rgba(241,235,224,.48)` | 7 | `.26em; color:rgba(10,10,10,.5)` (1) |
| **2** | **Label da tab bar — inativo** | `font-size:9px; font-weight:600; letter-spacing:.14em; color:rgba(241,235,224,.4)` | **21** | `color:rgba(10,10,10,.45)` (3) |
| **2b** | **Label da tab bar — ativo** | `font-size:9px; font-weight:600; letter-spacing:.14em; color:var(--gold,#C9A96A)` | **9** | `color:#A8894F` (1) |
| **3** | **Metadado em caps** | `font-size:9px; font-weight:600; letter-spacing:.2em; color:rgba(241,235,224,.45)` | **18** | — |
| **4** | **Micro-caps de status / rótulo de campo** | `font-size:8.5px; font-weight:600; letter-spacing:.18em; color:rgba(241,235,224,.42 \| .45 \| .5)`; quando é rótulo de campo dentro de card vira `.24em` + `.45` (10×) | 23 (`.18em`) + 10 (`.24em`) | `8.5px; .14em; rgba(10,10,10,.4)` (7, cabeçalho do calendário) |
| **5** | **Label do botão primário** | `font-size:10.5px; font-weight:600; letter-spacing:.22em; color:#0A0A0A` sobre `background:#F1EBE0` | **8** (6 dark + 2 light) | `color:#F1EBE0` sobre `background:#0A0A0A` |

### 5.2 Se você precisar de UMA regra só

```
CAPS = Inter 600 · 9px · letter-spacing .24em · color = ink@.48 (dark) / ink@.50 (light)
```

É o combo mais frequente de label **semântico** (11×) e o que aparece em todas as telas com
estrutura de seção. Os outros quatro papéis são derivações desse: a tab bar aperta o tracking
(`.14em`) e escurece (`.4`); o metadado aperta um pouco (`.2em`) e usa `.45`; o micro-caps
reduz o corpo (`8.5px`); o botão aumenta (`10.5px`) e inverte a cor.

### 5.3 Todos os combos `size / weight / tracking` medidos (28)

| size / weight / tracking | Usos |
|---|---|
| 9 / 600 / .14em | 34 |
| 9 / 600 / .24em | 24 |
| 8.5 / 600 / .18em | 23 |
| 10 / 600 / .2em | 23 *(19 são legenda do board)* |
| 9 / 600 / .2em | 19 |
| 8.5 / 600 / .14em | 19 |
| 9 / 600 / .18em | 17 |
| 12 / 500 / .08em | 16 |
| 8.5 / 600 / .24em | 10 |
| 9.5 / 600 / .14em | 9 |
| 9 / 600 / .26em | 8 |
| 8.5 / 600 / .22em | 8 |
| 10 / 600 / .1em | 8 |
| 10.5 / 600 / .22em | 8 |
| 10 / 600 / .3em | 4 |
| 9 / 600 / .22em | 3 |
| 8.5 / 600 / .2em | 3 |
| 8.5 / 600 / .12em | 3 |
| 10 / 600 / .22em | 3 |
| 9 / 600 / .16em | 2 |
| 12 / 600 / .08em | 2 |
| 10.5 / 500 / .16em | 2 |
| 9 / 600 / .3em | 1 |
| 9.5 / 600 / .22em | 1 |
| 8 / 600 / .2em | 1 |
| 8.5 / 600 / .3em | 1 |
| 10 / 600 / .28em | 1 |
| 10 / 600 / .18em | 1 |

Sem tracking: `13px / 600` = relógio `9:41` (19×) · `10px / 600` = letra de chip de dia (7×).
---

## 6. Raios e larguras de borda

### 6.1 `border-radius` (5 valores, 131 declarações)

| Valor | Usos | Onde |
|---|---|---|
| `var(--r,2px)` | **62** | **o raio do sistema**: botões, cards, inputs, chips de horário, chips de dia, toggle, dia selecionado do calendário, painéis `#121110`, blocos de bloqueio, moldura tracejada |
| `2px` | 19 | literal (não via var) — **borda do mockup de telefone** dos 19 frames |
| `3px` | 19 | **carcaça da bateria** da status bar (1 por frame) |
| `1px` | 19 | **preenchimento da bateria** (1 por frame) |
| `50%` | 12 | avatares circulares (58, 54, 42×7 = 9) + dot de "hoje" do calendário (2) + círculo do ícone de busca (1) |
| `99px` | 10 | **home indicator** (118×4px) |

Ou seja: **um único raio de UI = 2px.** Todo o resto é chrome de iOS (bateria) ou círculo perfeito.
`--r` é ajustável de 0 a 10px pelo painel do Claude Design (prop `cantos`), então 2px deve
virar um token, não um literal espalhado.

### 6.2 Larguras de borda (só 3 valores no arquivo)

| Valor | Usos | Onde |
|---|---|---|
| `1px solid` | 121 | **absolutamente tudo** |
| `1px dashed` | 4 | slot `DISPONÍVEL` da agenda (3× `@.16`) + moldura `ADICIONAR PROFISSIONAL` (1× `@.2`) |
| `1.5px solid` | 1 | círculo do ícone de busca (`rgba(241,235,224,.45)`); a haste do ícone é `height:1.5px` |

Nenhum `2px` de borda. Nenhum `border-width` maior. O design é **hairline-only**.

Lista completa de declarações `border*` distintas (com contagens):

```
39  border-bottom:1px solid rgba(241,235,224,.1)      <- divisor de lista (dark)
20  border:1px solid var(--frame,#242424)             <- mockup de telefone (chrome)
17  border:1px solid var(--gold,#C9A96A)              <- contorno de acento
17  border:1px solid rgba(241,235,224,.45)            <- carcaça da bateria
 9  border-top:1px solid rgba(241,235,224,.1)         <- tab bar (dark)
 8  border:1px solid rgba(241,235,224,.16)            <- input / chip de horário
 7  border:1px solid rgba(241,235,224,.2)             <- anel de avatar 42px
 6  border:1px solid rgba(10,10,10,.18)               <- chip de horário (light)
 5  border:1px solid rgba(241,235,224,.22)            <- botão ghost
 5  border:1px solid rgba(241,235,224,.14)            <- contorno de card
 4  border:1px solid rgba(241,235,224,.1)             <- card de atendimento #121110
 3  border:1px solid rgba(241,235,224,.25)            <- avatar grande / toggle off
 3  border:1px solid rgba(241,235,224,.12)            <- chip de dia off / botão CANCELAR
 3  border:1px dashed rgba(241,235,224,.16)           <- slot DISPONÍVEL
 2  border:1px solid rgba(241,235,224,.18)            <- campo E-MAIL / TELEFONE
 2  border:1px solid rgba(10,10,10,.4)                <- bateria (light)
 1  border:1px dashed rgba(241,235,224,.2)            <- ADICIONAR PROFISSIONAL
 1  border:1.5px solid rgba(241,235,224,.45)          <- ícone de busca
 1  border-top:1px solid rgba(10,10,10,.12)           <- tab bar (light)
 1  border-bottom:1px solid var(--gold,#C9A96A)       <- aba ENTRAR ativa
 1  border-bottom:1px solid var(--frame,#242424)      <- régua da capa (chrome)
 1  border-bottom:1px solid rgba(241,235,224,.14)     <- trilha da barra de abas
 1  border-bottom:1px solid rgba(10,10,10,.12)        <- última visita (light)
```

Truque de alinhamento: a aba ativa usa `border-bottom:1px solid var(--gold)` + `margin-bottom:-1px`
para cobrir exatamente a trilha `@.14` embaixo.

---

## 7. O RITMO DO LAYOUT (paddings, gaps, margens)

### 7.1 Padding lateral da tela — o eixo do sistema

**28px em todas as 19 telas.** Todos os contêineres de conteúdo são `padding:<top> 28px 0`:

| Padding | Usos | Contexto |
|---|---|---|
| `20px 28px 0` | 7 | **linha de navegação de volta** (`←` + `PASSO 0X DE 04`) — sempre 20px abaixo da status bar |
| `30px 28px 0` | 3 | conteúdo após nav (Data e horário, Ficha do cliente, Data e horário light) |
| `34px 28px 0` | 4 | conteúdo após nav (Escolha de serviço, Escolha de profissional, Confirmação, Detalhe) |
| `40px 28px 0` | 6 | conteúdo sem nav, tela de painel (Agenda, Disponibilidade, Clientes, Dashboard, Serviços, Equipe) |
| `44px 28px 0` | 4 | conteúdo sem nav, tela de cliente (Home, Meus agendamentos, Perfil, Home light) |
| `52px 28px 0` | 1 | tela de Acesso (respiro maior antes do logo) |

**Exceção única:** a status bar usa `padding:0 24px 0 30px` (assimétrico: 30px à esquerda para
o relógio, 24px à direita para os ícones). É o único lugar do arquivo que não usa 28px lateral.

Absolutos de rodapé:
- `bottom:44px; left:0; right:0` — rodapé `STEWERGABRIEL.COM` do splash
- `bottom:40px; left:36px; right:36px` — termos de uso da tela de Acesso (**36px**, não 28)

### 7.2 Padding de componente

| Padding | Usos | Componente |
|---|---|---|
| `18px` | 8 | **botão primário** (todos, dark e light) |
| `16px` | 3 | input de texto (E-MAIL, TELEFONE) + botão `SAIR DA CONTA` |
| `15px` | 4 | **botão secundário/ghost** (`REMARCAR`, `CANCELAR`, `ADICIONAR BLOQUEIO`, `NOVO AGENDAMENTO PARA ESTE CLIENTE`) |
| `10px 16px` | 1 | botão ghost pequeno inline (`NOVO SERVIÇO`) |
| `10px` | 4 | bloco de slot vago / intervalo da agenda (`DISPONÍVEL`, `INTERVALO`) |
| `2px` | 19 | carcaça da bateria |
| `0 6px` | 4 | área de toque das setas `‹ ›` de mês |
| `0 2px 14px` | 2 | aba (`ENTRAR`, `CRIAR CONTA`) |

Cards (todos com `border-radius:2px`):

| Padding | Card |
|---|---|
| `26px 24px` | card "PRÓXIMO AGENDAMENTO" (dark e light) |
| `28px 26px` | card de resumo da Confirmação |
| `26px` | moldura tracejada "ADICIONAR PROFISSIONAL" |
| `24px` | card de detalhes (tela 11) + bloco de texto do card do profissional (tela 05) |
| `22px` | painel de anotações (tela 14) + card de equipe (tela 17) |
| `20px 22px` | card de próximo agendamento da lista (tela 08) + painel de anotações (tela 11) |
| `18px 20px` | card de bloqueio pontual (tela 12) |
| `15px 18px` | card de atendimento da agenda do dia |
| `15px 18px 24px` | card de atendimento **com badge** `PRIMEIRA VISITA` (mais 6px embaixo) |
| `14px 16px` | campo de busca (tela 13) |

### 7.3 Padding vertical de linha de lista (`padding: Npx 0`)

| Valor | Usos | Lista |
|---|---|---|
| `6px 0` | 14 | cabeçalho de dias da semana do calendário |
| `13px 0` | 18 | **chip de horário** |
| `17px 0` | 7 | linha da lista de clientes (tela 13) |
| `18px 0` | 5 | linha do histórico de visitas da ficha (tela 14) |
| `19px 0` | 12 | **linha de dado / histórico / formulário** (telas 08, 09, 12) |
| `21px 0` | 6 | linha da lista de serviços do cliente (tela 04) |
| `22px 0` | 6 | linha da gestão de serviços (tela 16) |

O ritmo cresce com a "densidade informacional": 17px em lista compacta com avatar,
19px em dado tabular, 21–22px em item com título Playfair de 19px.

### 7.4 `gap` (flex/grid)

| Valor | Usos | Onde |
|---|---|---|
| `2px` | 21 | barras de sinal da status bar (19) + **grid de dias do calendário** (2) |
| `3px` | 2 | número do dia + dot de "hoje" |
| `4px` | 1 | dia + mês no bloco de data (tela 08) |
| `6px` | 16 | linha interna de card (nome + serviço), stat do resumo do cliente, item da lista de clientes |
| `7px` | **62** | **grupo de ícones da status bar (19)** + **item da tab bar (indicador → label, 43)** + par título/meta em card |
| `8px` | 26 | **label → valor** em coluna (rótulo em caps + valor); setas `‹ ›` de dia; barra do gráfico → letra |
| `9px` | 2 | chips de dia da semana (Disponibilidade) + barras do gráfico do dashboard |
| `10px` | 5 | **grid de chips de horário** (2) + lista de atendimentos da agenda + bloco de texto do card do profissional + moldura de adicionar |
| `12px` | 10 | eyebrow → título de seção do board; par de botões ghost; valor + chevron; campo de busca |
| `14px` | 21 | **wrapper de frame no board (19)** + gaps internos do card de próximo agendamento (2) |
| `16px` | 15 | calha de hora ↔ card na agenda do dia (8) + item da lista de clientes (7) |
| `18px` | 11 | linha de histórico (data ↔ serviço ↔ valor, 9) + card de equipe (2) |
| `20px` | 6 | avatar ↔ nome (2) + par de ações (`REAGENDAR` / `DETALHES`, 2) + card da tela 08 |
| `22px` | 1 | blocos internos do card de Confirmação |
| `26px` | 1 | blocos do splash |
| `30px` | 1 | logo ↔ wordmark na capa |
| `44px` | 5 | **gap entre seções do board (4)** + stats do resumo do cliente (1) |
| `48px` | 1 | colunas da capa |
| `56px` | 6 | **grid de frames do board (4)** + par DATA/HORÁRIO da Confirmação (1) + colunas da capa (1) |
| `110px` | 1 | gap entre as 4 seções do board |

### 7.5 `margin-top` — o ritmo vertical dentro da tela

| Valor | Usos | Papel |
|---|---|---|
| `2px` | 2 | ajuste fino |
| `4px` | 3 | grid de dias após o cabeçalho da semana |
| `6px` | 6 | **label de seção → primeira linha de lista** (lista sem card) |
| `8px` | 3 | label de seção → lista de histórico |
| `10px` | 1 | segundo card de bloqueio |
| `12px` | **12** | **eyebrow em caps → título Playfair** |
| `14px` | 9 | **título → sublinha em caps** · card → par de botões |
| `16px` | 9 | **label de seção → primeiro card** |
| `18px` | 5 | grid de chips de horário; stats; botão ghost |
| `20px` | 4 | cabeçalho do calendário; texto de ajuda após botão; régua interna |
| `22px` | 3 | ação secundária após botão primário; texto de nota |
| `26px` | 9 | **bloco → bloco dentro da mesma seção** |
| `28px` | 6 | **botão primário após card** · bloco → bloco |
| `30px` | 6 | card grande após título; bloco de estatística |
| `32px` | 1 | card de resumo da Confirmação |
| `34px` | 4 | botão primário; painel de anotações |
| `36px` | 1 | primeiro campo após a barra de abas |
| `38px` | 2 | primeira estatística do dashboard; label de seção |
| `40px` | 4 | **label de seção → seção nova** |
| `42px` | 5 | **card destacado após o título da tela** (Home) · label de seção → seção nova |
| `44px` | 2 | label de seção após lista; botão `SAIR DA CONTA` |
| `48px` | 3 | **maior salto de seção** (`ÚLTIMA VISITA`, `DADOS PESSOAIS`) |

**A escala de ritmo destilada:** `6 → 12 → 14 → 16 → 26/28/30 → 38/40/42/44 → 48`
(micro dentro do bloco · bloco → bloco · seção → seção).

Outras margens:
`margin:10px auto 8px` (10×, home indicator) · `margin:20px 0 16px` (régua do card de equipe) ·
`margin:6px 0 42px 8px` (logo da tela 02) · `margin:8px 10px` (logo da capa) ·
`margin-bottom:14px` (logo do splash) · `margin-right:34px` (espaço entre abas) ·
`margin-bottom:-1px` (aba ativa sobre a trilha) · `padding-bottom:30px` (3×, bloco de estatística) ·
`padding-bottom:18px` (linha de última visita) · `padding-bottom:6px` / `4px` (alinhamento de baseline).

---

## 8. DIMENSÕES FIXAS DE CHROME

### 8.1 O frame de tela

```
width: 390px · height: 844px
background: #0A0A0A (dark) | #F1EBE0 (light)
border: 1px solid var(--frame,#242424)   <- moldura do mockup, NÃO faz parte do app
border-radius: 2px · overflow: hidden · position: relative · flex: none
color: #F1EBE0 (dark) | #0A0A0A (light)
```

### 8.2 Status bar — `height:50px` (idêntica nos 19 frames)

```
height: 50px
display: flex; align-items: center; justify-content: space-between
padding: 0 24px 0 30px

relógio:      "9:41"  font-size:13px; font-weight:600   (sem tracking)
grupo direito: display:flex; align-items:center; gap:7px

  barras de sinal: display:flex; align-items:flex-end; gap:2px
      barra 1: width:3px; height:4px;  background: ink cheia
      barra 2: width:3px; height:6px;  background: ink cheia
      barra 3: width:3px; height:8px;  background: ink cheia
      barra 4: width:3px; height:10px; background: ink@.35 (dark) | ink@.3 (light)

  bateria: width:22px; height:11px
           border:1px solid ink@.45 (dark) | ink@.4 (light)
           border-radius:3px; padding:2px
      fill: width:70%; height:100%; background: ink cheia; border-radius:1px
```

### 8.3 Tab bar — altura calculada ≈ **62px** (estrutura fixa)

```
container: position:absolute; left:0; right:0; bottom:0
           background: #0A0A0A (dark) | #F1EBE0 (light)
           border-top: 1px solid ink@.1 (dark) | ink@.12 (light)

linha de itens: display:flex; padding:16px 8px 4px
  cada item: flex:1; flex-direction:column; align-items:center; gap:7px
     indicador: width:14px; height:1px
                background: var(--gold,#C9A96A) (dark) | #A8894F (light)   <- só o ativo
                inativo = mesma caixa 14×1px SEM background (mantém o alinhamento)
     label: font-size:9px; font-weight:600; letter-spacing:.14em
            ativo   = gold (dark) | #A8894F (light)
            inativo = ink@.4 (dark) | ink@.45 (light)

home indicator: width:118px; height:4px; border-radius:99px
                background: ink@.2 (dark) | ink@.22 (light)
                margin: 10px auto 8px
```

Altura total ≈ 1 (border-top) + 16 + [1 + 7 + ~11 (linha de 9px)] + 4 + 10 + 4 + 8 ≈ **62px**.
Área segura de conteúdo: **50px no topo, ~62px na base** (de 844px → ~732px úteis).

Número de abas por perfil:
- **Cliente (4 abas):** `INÍCIO` · `AGENDAR` · `MEUS HORÁRIOS` · `PERFIL`
- **Profissional (3 abas):** `AGENDA` · `CLIENTES` · `DISPONIBILIDADE`
- **Admin (3 abas):** `VISÃO GERAL` · `SERVIÇOS` · `EQUIPE`

Telas COM tab bar (10): 03, 08, 09, 10, 12, 13, 15, 16, 17, 18.
Telas SEM tab bar (9): 01, 02, 04, 05, 06, 07, 11, 14, 19.

### 8.4 Losango do logo (marca SG) — 3 tamanhos

| Onde | Caixa | Borda | Texto interno | Margem |
|---|---|---|---|---|
| Splash (tela 01) | `58×58px` | `1px solid var(--gold,#C9A96A)` | Playfair `19px`, `letter-spacing:.08em`, rotate(-45deg) | `margin-bottom:14px` |
| Acesso (tela 02) | `40×40px` | idem | Playfair `13px`, sem tracking | `margin:6px 0 42px 8px` |
| Capa do board | `52×52px` | idem | Playfair `17px`, `.08em` | `margin:8px 10px` |

Todos: `transform:rotate(45deg)` no losango + `transform:rotate(-45deg)` no texto,
`display:flex; align-items:center; justify-content:center`.
**Mini-losango de seleção:** `7×7px`, `border:1px solid gold`, `rotate(45deg)` (tela 05).

### 8.5 Calendário (telas 06 e 19)

```
cabeçalho:  display:grid; grid-template-columns:repeat(7,1fr); margin-top:18px
  célula:   text-align:center; padding:6px 0
            font-size:8.5px; font-weight:600; letter-spacing:.14em
            color: ink@.38 (dark) | ink@.4 (light)
            textos: D S T Q Q S S

grade:      display:grid; grid-template-columns:repeat(7,1fr); gap:2px; margin-top:4px
  ALTURA DE CÉLULA: height:40px  (fixa; 63 ocorrências de height:40px no arquivo)
  display:flex; align-items:center; justify-content:center; font-size:13px

  dia disponível:   color: ink@.8  (dark) | ink@.75 (light)
  dia indisponível: color: ink@.25 (dark) | ink@.25 (light)
  hoje (dia 1):     flex-direction:column; gap:3px; cor herdada (ink cheia)
                    + dot: width:3px; height:3px; border-radius:50%; background gold | #A8894F
  selecionado (11): border:1px solid var(--gold,#C9A96A); border-radius:var(--r,2px)
                    color: gold (dark) | #A8894F + font-weight:600 (light)
  offset do mês:    2 <div> vazios antes do dia 1
```

### 8.6 Grade de horários (telas 06 e 19)

```
display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-top:16px
chip: padding:13px 0; text-align:center; border-radius:var(--r,2px)
      font-size:12px; letter-spacing:.08em
  disponível:    border:1px solid ink@.16 (dark) | ink@.18 (light); font-weight:500
  selecionado:   border:1px solid var(--gold,#C9A96A); font-weight:600
                 color: gold (dark) | #A8894F (light)
  indisponível:  SEM borda; font-weight:500; color: ink@.22 (dark) | ink@.25 (light)
```

### 8.7 Outras dimensões fixas

| Elemento | Dimensão exata |
|---|---|
| Chip de dia da semana (Disponibilidade) | `41×41px`, `border:1px`, `radius:var(--r,2px)`, `font-size:10px; font-weight:600` |
| Avatar — Perfil do cliente | `58×58px`, `border:1px solid ink@.25`, `border-radius:50%`, Playfair `19px` |
| Avatar — Ficha do cliente | `54×54px`, `border:1px solid ink@.25`, `border-radius:50%`, Playfair `17px` |
| Avatar — Lista de clientes | `42×42px`, `border:1px solid ink@.2`, `border-radius:50%`, Playfair `14px` |
| Foto de equipe (image-slot) | `64×64px`, `shape="rect"` |
| Retrato do profissional (image-slot) | `width:100%; height:330px`, `shape="rect"` |
| Toggle | `34×18px`, `border:1px`, `radius:var(--r,2px)`; knob `width:12px`, `top/bottom/right(ou left):2px` |
| Calha de hora da agenda | `width:44px`; `padding-top:14px` (agendado) / `9px` (vago) |
| Bloco de data (tela 08) | `width:44px`; Playfair `26px` + caps `8.5px/.2em`; divisor vertical `width:1px` esticado, `ink@.12` |
| Coluna de data do histórico | `width:56px`; `9.5px/600/.14em` |
| Gráfico de barras (dashboard) | barras `width:18px`, alturas `26 · 40 · 33 · 40 · 47 · 26 · 2px`, `gap:9px`; letras `7.5px/600` |
| Barra de ocupação | trilha `height:2px` (`ink@.12`), preenchimento `width:78%; height:100%` gold |
| Régua do splash | `34×1px`, `background: ink@.25` |
| Ícone de busca | caixa `14×14px`; círculo `10×10px` `border:1.5px`; haste `5×1.5px` `rotate(45deg)`, `right:0; bottom:1px` |
| Home indicator | `118×4px`, `radius:99px` |
| Divisor de card | `height:1px` (`ink@.12`) ou `height:1px` (`ink@.1`) |

### 8.8 Interação (atributo `style-hover` do Claude Design)

| Valor | Usos | Onde |
|---|---|---|
| `opacity:.92` | 6 | botão primário **dark** |
| `opacity:.9` | 2 | botão primário **light** |
| `border-color:rgba(241,235,224,.45)` | 5 | botão ghost (de `.22` → `.45`) |
| `border-color:rgba(241,235,224,.4)` | 1 | moldura tracejada `ADICIONAR PROFISSIONAL` (de `.2` → `.4`) |
| `border-color:rgba(241,235,224,.3)` | 1 | botão `CANCELAR` (de `.12` → `.3`) |

`opacity:.45` (1×) é estado **cancelado** aplicado na linha inteira do histórico (tela 08).
`cursor:pointer` marca todo elemento interativo. `text-align:center` = 55 usos.

### 8.9 Chrome do BOARD (nunca portar para o app)

```
#sg-board  min-height:100vh; background:var(--canvas,#0F0F0F)
           padding:88px 96px 140px; display:flex; column; gap:110px
           font-family:Inter,sans-serif

cover plate  max-width:2174px; gap:48px; border-bottom:1px solid var(--frame,#242424)
             padding-bottom:48px
   wordmark   Playfair 26px, letter-spacing:.3em, var(--cInk)
   tagline    10px/600/.28em var(--cMuted)   "APP DE AGENDAMENTO · VISAGISMO & CONSULTORIA DE IMAGEM MASCULINA"
   swatches   22×22px; legenda 8.5px/600/.12em  (#0A0A0A, #F1EBE0, #C9A96A)
   specimens  Playfair 22px + Inter 17px/500; legendas 9px/600/.24em
              "DISPLAY · TÍTULOS" / "UI · LABELS EM CAPS"

seção        flex column gap:44px
   número     10px/600/.3em var(--gold)   ("01 — PERFIL CLIENTE" …)
   título     Playfair 30px var(--cInk) + <span> var(--cMuted) ("· 9 telas")
   grid       flex-wrap; gap:56px; max-width:2200px; align-items:flex-start

wrapper de frame  flex column gap:14px
   legenda    10px/600/.2em var(--cMuted)  ("01 · SPLASH" …)
```

---

## 9. MAPEAMENTO PARA NATIVEWIND 4 (Tailwind v3)

### 9.1 Recomendação: variáveis CSS no `global.css` + `colors` apontando para `var()`

**Por que essa é a abordagem certa aqui, e não `dark:` duplicado em cada classe:**

1. **Os pares dark/light não são simétricos.** O divisor é `ink@.1` no dark e `ink@.12` no light;
   o contorno de chip é `.16` → `.18`; o home indicator `.2` → `.22`; e os textos fortes vão
   na direção contrária (`.8` → `.75`). Escrever `border-ink/10 dark:border-ink/12` em 39 lugares
   é onde o sistema quebra. Um token `border-divider` resolve cada par num só lugar.
2. **O dourado tem comportamento condicional:** como **texto** ele muda (`#C9A96A` → `#A8894F`);
   como **borda** ele NÃO muda (`#C9A96A` nos dois). Só dois tokens separados (`gold` e
   `gold-border`) expressam isso sem erro.
3. **O par fundo/tinta é uma inversão pura.** `bg-canvas` + `text-ink` funcionando nos dois temas
   sem `dark:` deixa cada componente escrito uma única vez — é o que mais reduz superfície de bug.
4. `dark:` continua útil pontualmente (ex.: o wash `rgba(255,255,255,.35)` que só existe no light),
   mas como exceção, não como mecanismo base.

**Atenção — dark é o padrão do produto** (17 dos 19 frames). Como o NativeWind aplica a classe
`.dark` só quando o color scheme é dark, ponha **light em `:root`** e **dark em `.dark`**, e force
o esquema padrão no app (`userInterfaceStyle: "dark"` no `app.json` + `colorScheme.set('dark')`).

### 9.2 `global.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ---------- LIGHT (frames 18-19) = :root ---------- */
:root {
  /* canais crus, para as utilidades de alfa (text-ink/45, border-ink/18, ...) */
  --ink-rgb:      10 10 10;      /* #0A0A0A */
  --canvas-rgb:   241 235 224;   /* #F1EBE0 */

  --color-canvas:        #F1EBE0;   /* fundo de tela */
  --color-ink:           #0A0A0A;   /* texto primário */
  --color-ink-inverse:   #F1EBE0;   /* texto sobre botão primário */
  --color-surface:       rgba(255,255,255,.35);  /* wash do card destacado */
  --color-gold:          #A8894F;   /* dourado como TEXTO/ícone */
  --color-gold-border:   #C9A96A;   /* dourado como BORDA - igual nos 2 temas */

  --color-divider:       rgba(10,10,10,.12);
  --color-divider-card:  rgba(10,10,10,.12);
  --color-field-border:  rgba(10,10,10,.18);
  --color-indicator:     rgba(10,10,10,.22);

  --color-text-body:     rgba(10,10,10,.8);
  --color-text-meta:     rgba(10,10,10,.6);
  --color-text-label:    rgba(10,10,10,.5);   /* eyebrow */
  --color-text-muted:    rgba(10,10,10,.45);  /* meta em caps */
  --color-text-dim:      rgba(10,10,10,.45);  /* tab bar inativa */
  --color-text-disabled: rgba(10,10,10,.25);
  --color-day:           rgba(10,10,10,.75);  /* dia de calendário disponível */
  --color-nav-arrow:     rgba(10,10,10,.7);
  --color-accent-line:   rgba(10,10,10,.65);  /* SEX, 11 SET - 10.5px/500/.16em */
  --color-status-dim:    rgba(10,10,10,.3);
  --color-battery:       rgba(10,10,10,.4);
  --color-slot-off:      rgba(10,10,10,.25);
}

/* ---------- DARK (frames 01-17) = .dark ---------- */
.dark:root {
  --ink-rgb:      241 235 224;   /* #F1EBE0 */
  --canvas-rgb:   10 10 10;      /* #0A0A0A */

  --color-canvas:        #0A0A0A;
  --color-ink:           #F1EBE0;
  --color-ink-inverse:   #0A0A0A;
  --color-surface:       #121110;   /* card elevado */
  --color-sunken:        #0E0E0D;   /* bloco INTERVALO */
  --color-gold:          #C9A96A;
  --color-gold-border:   #C9A96A;

  --color-divider:       rgba(241,235,224,.1);
  --color-divider-card:  rgba(241,235,224,.12);
  --color-card-border:   rgba(241,235,224,.14);
  --color-field-border:  rgba(241,235,224,.16);
  --color-ghost-border:  rgba(241,235,224,.22);
  --color-ghost-hover:   rgba(241,235,224,.45);
  --color-indicator:     rgba(241,235,224,.2);

  --color-text-strong:   rgba(241,235,224,.88);
  --color-text-body:     rgba(241,235,224,.85);
  --color-text-meta:     rgba(241,235,224,.62);
  --color-text-label:    rgba(241,235,224,.48);
  --color-text-muted:    rgba(241,235,224,.45);
  --color-text-dim:      rgba(241,235,224,.4);
  --color-text-faint:    rgba(241,235,224,.35);  /* placeholder */
  --color-text-disabled: rgba(241,235,224,.25);
  --color-day:           rgba(241,235,224,.8);
  --color-nav-arrow:     rgba(241,235,224,.75);
  --color-accent-line:   rgba(241,235,224,.72);
  --color-status-dim:    rgba(241,235,224,.35);
  --color-battery:       rgba(241,235,224,.45);
  --color-slot-off:      rgba(241,235,224,.22);
}
```

### 9.3 Pares exatos dark/light por token semântico

Os tokens marcados **(extrapolado)** não existem nos frames light — o design só entregou
2 telas claras. Os valores propostos seguem a regra observada em 3.4 (estruturais +2 pontos,
textos de alto contraste −5) e devem ser confirmados com o designer, não tratados como medidos.

| Token | DARK (medido) | LIGHT (medido) |
|---|---|---|
| `canvas` | `#0A0A0A` | `#F1EBE0` |
| `ink` | `#F1EBE0` | `#0A0A0A` |
| `ink-inverse` | `#0A0A0A` | `#F1EBE0` |
| `gold` (texto/ícone) | `#C9A96A` | `#A8894F` |
| `gold-border` | `#C9A96A` | `#C9A96A` |
| `surface` | `#121110` | `rgba(255,255,255,.35)` |
| `divider` | `rgba(241,235,224,.1)` | `rgba(10,10,10,.12)` |
| `divider-card` | `rgba(241,235,224,.12)` | `rgba(10,10,10,.12)` |
| `field-border` | `rgba(241,235,224,.16)` | `rgba(10,10,10,.18)` |
| `indicator` | `rgba(241,235,224,.2)` | `rgba(10,10,10,.22)` |
| `slot-off` | `rgba(241,235,224,.22)` | `rgba(10,10,10,.25)` |
| `text-disabled` | `rgba(241,235,224,.25)` | `rgba(10,10,10,.25)` |
| `status-dim` | `rgba(241,235,224,.35)` | `rgba(10,10,10,.3)` |
| `battery` | `rgba(241,235,224,.45)` | `rgba(10,10,10,.4)` |
| `text-dim` (tab inativa) | `rgba(241,235,224,.4)` | `rgba(10,10,10,.45)` |
| `text-muted` (meta caps) | `rgba(241,235,224,.45)` | `rgba(10,10,10,.45)` |
| `text-label` (eyebrow) | `rgba(241,235,224,.48)` | `rgba(10,10,10,.5)` |
| `text-meta` (12.5px) | `rgba(241,235,224,.62)` | `rgba(10,10,10,.6)` |
| `accent-line` (10.5/500) | `rgba(241,235,224,.72)` | `rgba(10,10,10,.65)` |
| `nav-arrow` | `rgba(241,235,224,.75)` | `rgba(10,10,10,.7)` |
| `day` (dia disponível) | `rgba(241,235,224,.8)` | `rgba(10,10,10,.75)` |
| `text-body` | `rgba(241,235,224,.85)` | `rgba(10,10,10,.8)` |
| `sunken` (INTERVALO) | `#0E0E0D` | **(extrapolado)** `rgba(10,10,10,.04)` |
| `card-border` | `rgba(241,235,224,.14)` | **(extrapolado)** `rgba(10,10,10,.16)` |
| `ghost-border` | `rgba(241,235,224,.22)` | **(extrapolado)** `rgba(10,10,10,.25)` |
| `ghost-hover` | `rgba(241,235,224,.45)` | **(extrapolado)** `rgba(10,10,10,.45)` |
| `text-strong` | `rgba(241,235,224,.88)` | **(extrapolado)** `rgba(10,10,10,.85)` |
| `text-faint` (placeholder) | `rgba(241,235,224,.35)` | **(extrapolado)** `rgba(10,10,10,.38)` |
| `avatar-ring` | `rgba(241,235,224,.2)` / `.25` | **(extrapolado)** `rgba(10,10,10,.22)` / `.28` |

### 9.4 `tailwind.config.js`

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',            // necessário para o seletor .dark:root do global.css
  theme: {
    extend: {
      colors: {
        // --- pares dark/light via variáveis CSS ---
        canvas:        'var(--color-canvas)',
        surface:       'var(--color-surface)',
        sunken:        'var(--color-sunken)',
        'ink-inverse': 'var(--color-ink-inverse)',
        gold:          'var(--color-gold)',
        'gold-border': 'var(--color-gold-border)',

        divider:       'var(--color-divider)',
        'divider-card':'var(--color-divider-card)',
        'card-border': 'var(--color-card-border)',
        'field-border':'var(--color-field-border)',
        'ghost-border':'var(--color-ghost-border)',
        'ghost-hover': 'var(--color-ghost-hover)',
        indicator:     'var(--color-indicator)',

        'text-strong':  'var(--color-text-strong)',
        'text-body':    'var(--color-text-body)',
        'text-meta':    'var(--color-text-meta)',
        'text-label':   'var(--color-text-label)',
        'text-muted':   'var(--color-text-muted)',
        'text-dim':     'var(--color-text-dim)',
        'text-faint':   'var(--color-text-faint)',
        'text-disabled':'var(--color-text-disabled)',
        day:            'var(--color-day)',
        'nav-arrow':    'var(--color-nav-arrow)',
        'accent-line':  'var(--color-accent-line)',
        'status-dim':   'var(--color-status-dim)',
        battery:        'var(--color-battery)',
        'slot-off':     'var(--color-slot-off)',

        // --- canais crus: habilitam text-ink/48, border-ink/16, bg-ink/20 ---
        ink:      'rgb(var(--ink-rgb) / <alpha-value>)',
        'on-ink': 'rgb(var(--canvas-rgb) / <alpha-value>)',

        // --- literais da marca (não trocam com o tema) ---
        brand: {
          gold:      '#C9A96A',
          goldLight: '#A8894F',
          goldSoft:  '#D6BC85',   // opção do painel DC
          goldMute:  '#B9B4A6',   // opção do painel DC
          ink:       '#F1EBE0',
          black:     '#0A0A0A',
          elevated:  '#121110',
          sunken:    '#0E0E0D',
        },
      },

      // A escala EXATA de alfa do design (28 degraus dark + 13 light).
      // Com ela, `text-ink/48` e `border-ink/16` reproduzem o valor literal do CSS.
      opacity: {
        10: '0.1',  12: '0.12', 14: '0.14', 16: '0.16', 18: '0.18',
        20: '0.2',  22: '0.22', 25: '0.25', 28: '0.28', 30: '0.3',
        32: '0.32', 35: '0.35', 38: '0.38', 40: '0.4',  42: '0.42',
        45: '0.45', 48: '0.48', 50: '0.5',  55: '0.55', 60: '0.6',
        62: '0.62', 65: '0.65', 70: '0.7',  72: '0.72', 75: '0.75',
        78: '0.78', 80: '0.8',  85: '0.85', 88: '0.88',
        90: '0.9',  92: '0.92',             // hover dos botões primários
      },

      fontFamily: {
        // registre as fontes com estes nomes exatos no expo-font
        display: ['PlayfairDisplay_400Regular', 'serif'],
        'display-medium': ['PlayfairDisplay_500Medium', 'serif'],
        'display-semibold': ['PlayfairDisplay_600SemiBold', 'serif'],
        sans: ['Inter_400Regular', 'sans-serif'],
        'sans-medium': ['Inter_500Medium', 'sans-serif'],
        'sans-semibold': ['Inter_600SemiBold', 'sans-serif'],
      },

      fontSize: {
        // --- escala Inter (UI) ---
        'micro':   '7.5px',   // letras do gráfico
        '2xs':     '8px',     // menor caps
        'caps-xs': '8.5px',   // micro-caps (67 usos)
        'caps':    '9px',     // CAPS PADRÃO (108 usos)
        'caps-sm': '9.5px',   // coluna de data do histórico
        'caps-md': '10px',    // aba / chip de dia / calha
        'caps-lg': '10.5px',  // label de botão primário
        'help':    '11px',
        'help-lg': '11.5px',
        'chip':    '12px',    // chip de horário
        'meta':    '12.5px',
        'body':    '13px',    // dia do calendário / relógio / anotações
        'body-lg': '13.5px',  // corpo de lista / valor
        'row':     '14px',
        'row-lg':  '14.5px',  // nome em lista
        'icon-sm': '15px',
        'icon':    '16px',
        'icon-lg': '19px',    // seta de voltar

        // --- escala Playfair (display) ---
        'd-xs':  '13px',
        'd-sm':  '14px',
        'd-17':  '17px',
        'd-18':  '18px',
        'd-19':  '19px',   // nome de serviço em lista
        'd-20':  '20px',
        'd-21':  '21px',
        'd-22':  '22px',
        'd-23':  '23px',   // título de card
        'd-24':  '24px',
        'd-25':  '25px',
        'd-26':  '26px',
        'd-27':  '27px',
        'h1':    '29px',   // H1 de tela interna (12 usos)
        'd-30':  '30px',
        'h1-lg': '31px',   // saudação / boas-vindas
        'stat':  '42px',   // numeral de estatística
      },

      lineHeight: {
        // os 5 únicos line-heights explícitos do design
        stat: '1',      // numeral de 42px
        help: '1.7',    // textos legais de 11 / 11.5px
        note: '1.75',   // anotações (tela 11)
        'note-lg': '1.8', // anotações (tela 14)
      },

      letterSpacing: {
        // valores em em, como no design
        chip:   '.08em',   // chip de horário / SG do losango
        gutter: '.1em',    // calha de hora
        swatch: '.12em',
        tab:    '.14em',   // tab bar / coluna de data / cabeçalho do calendário (62 usos)
        line:   '.16em',
        action: '.18em',   // ações e status em caps (41 usos)
        meta:   '.2em',    // metadados / abas / botão ghost (46 usos)
        btn:    '.22em',   // label de botão primário (23 usos)
        label:  '.24em',   // LABEL DE SEÇÃO - o padrão (34 usos)
        eyebrow:'.26em',   // eyebrow de topo de tela
        tagline:'.28em',
        wordmark:'.3em',
        splash: '.32em',
      },

      spacing: {
        // valores exatos do design, em px
        px:   '1px',   0.5: '2px',  0.75: '3px',
        1:    '4px',   1.5: '6px',  1.75: '7px',
        2:    '8px',   2.25:'9px',  2.5: '10px',
        3:    '12px',  3.25:'13px', 3.5: '14px', 3.75:'15px',
        4:    '16px',  4.25:'17px', 4.5: '18px', 4.75:'19px',
        5:    '20px',  5.25:'21px', 5.5: '22px',
        6:    '24px',  6.5: '26px',
        7:    '28px',                  // <- PADDING LATERAL DA TELA
        7.5:  '30px',  8:   '32px',  8.5: '34px',  9:  '36px',
        9.5:  '38px', 10:   '40px', 10.25:'41px', 10.5:'42px',
        11:   '44px', 11.75:'47px', 12:   '48px',
        12.5: '50px',                  // <- ALTURA DA STATUS BAR
        13:   '52px', 13.5: '54px',
        14:   '56px', 14.5: '58px',
        16:   '64px',
        // dimensões singulares
        'tabbar':    '62px',    // altura calculada da tab bar
        'indicator': '118px',   // largura do home indicator
        'portrait':  '330px',   // altura do retrato do profissional
        'screen-w':  '390px',
        'screen-h':  '844px',
      },

      borderRadius: {
        none: '0px',
        DEFAULT: '2px',   // --r: O raio do sistema (62 usos)
        px:   '1px',      // preenchimento da bateria
        sm:   '2px',
        md:   '3px',      // carcaça da bateria
        pill: '99px',     // home indicator (valor literal do design)
        full: '9999px',
      },

      borderWidth: {
        DEFAULT: '1px',   // 121 usos - o design é hairline-only
        hair: '1px',
        icon: '1.5px',    // só o ícone de busca
      },
    },
  },
  plugins: [],
};
```

### 9.5 Gotchas do NativeWind 4 que afetam este design

1. **`letter-spacing` em `em` é o risco nº1.** No React Native `letterSpacing` é **absoluto (px)**.
   O NativeWind resolve `em` contra o `fontSize` do próprio elemento, então `text-caps tracking-label`
   funciona — **mas só se as duas classes estiverem no MESMO elemento**. Se o `fontSize` vier do pai
   (ou de um `Text` aninhado), o `em` resolve errado e as caps ficam com tracking visivelmente
   diferente. Duas defesas:
   - sempre declarar `text-*` e `tracking-*` juntos no mesmo `<Text>`;
   - ou usar a tabela de px pré-calculada abaixo, que remove a ambiguidade de vez.

   | corpo × tracking | px | onde |
   |---|---|---|
   | 8.5 × .12em | `1.02px` | legenda de swatch |
   | 8.5 × .14em | `1.19px` | cabeçalho do calendário / duração |
   | 8.5 × .18em | `1.53px` | micro-caps de status |
   | 8.5 × .2em | `1.7px` | `SET`, `DESDE MARÇO…` |
   | 8.5 × .22em | `1.87px` | `DISPONÍVEL`, labels de estatística |
   | 8.5 × .24em | `2.04px` | rótulo de campo em card |
   | 8.5 × .3em | `2.55px` | `STEWERGABRIEL.COM` |
   | 9 × .14em | `1.26px` | **label da tab bar** |
   | 9 × .16em | `1.44px` | `15:30 · STEWER GABRIEL` |
   | 9 × .18em | `1.62px` | ações em caps |
   | 9 × .2em | `1.8px` | metadado em caps |
   | 9 × .22em | `1.98px` | `E-MAIL`, `TELEFONE` |
   | 9 × .24em | `2.16px` | **label de seção (o padrão)** |
   | 9 × .26em | `2.34px` | eyebrow de topo de tela |
   | 9 × .3em | `2.7px` | `VISAGISMO & CONSULTORIA DE IMAGEM` |
   | 9.5 × .14em | `1.33px` | coluna de data do histórico |
   | 9.5 × .22em | `2.09px` | `ADICIONAR PROFISSIONAL` |
   | 10 × .1em | `1px` | calha de hora |
   | 10 × .18em | `1.8px` | `NOVO SERVIÇO` |
   | 10 × .2em | `2px` | aba / botão ghost |
   | 10 × .22em | `2.2px` | botão ghost |
   | 10 × .3em | `3px` | número de seção do board |
   | 10.5 × .16em | `1.68px` | `SEX, 11 SET · 15:30 — 16:30` |
   | 10.5 × .22em | `2.31px` | **label do botão primário** |
   | 12 × .08em | `0.96px` | chip de horário |
   | 17 × .08em | `1.36px` | `SG` (capa) |
   | 19 × .08em | `1.52px` | `SG` (splash) |
   | 20 × .32em | `6.4px` | wordmark do splash |
   | 26 × .3em | `7.8px` | wordmark da capa |

2. **`spacing` em px, não em `rem`.** A conversão rem→px do NativeWind depende do `rem` base e
   não bate com uma grade de 28px / 41px / 118px. Declarar tudo em string px (como acima) mantém
   os valores exatos do design.

3. **`<alpha-value>` só funciona com canais crus.** `rgb(var(--ink-rgb) / <alpha-value>)` habilita
   `text-ink/48`. Se você escrever `ink: 'var(--color-ink)'` (valor completo), `text-ink/48`
   **silenciosamente não aplica alfa**. Por isso o config acima tem os dois: `ink` (canais, com alfa)
   e os tokens semânticos (valor completo, sem alfa).

4. **`variables` só resolvem em props de cor.** `borderWidth`, `borderRadius` e `fontSize` via
   `var()` são frágeis no NativeWind 4 — mantenha-os literais (como no config acima). É por isso
   que o `--r` ajustável do Claude Design deve virar `borderRadius.DEFAULT = '2px'` fixo no
   Tailwind, e não uma variável CSS.

5. **Não existe `text-transform` no design.** Escreva o texto em maiúsculas nas strings (com
   acentuação: `INÍCIO`, `MEUS HORÁRIOS`, `VISÃO GERAL`, `SERVIÇOS`, `CONCLUÍDO`, `PRÓXIMOS`,
   `HISTÓRICO`, `PREFERÊNCIAS`, `TERÇA-FEIRA, 1 DE SETEMBRO`, `O ATELIÊ, NO SEU TEMPO`). Se usar
   `uppercase` do Tailwind, `text-transform` no RN não normaliza acento de forma idêntica em
   Android e iOS — prefira a string literal, como o design fez.

6. **`border-radius:50%` não existe no RN.** Os avatares (58, 54, 42px) e o dot de 3px precisam de
   `borderRadius = size/2`: `rounded-full` resolve, desde que a caixa seja quadrada.

7. **Faltam os pares light** de 8 tokens (`card-border`, `ghost-border`, `ghost-hover`, `sunken`,
   `text-strong`, `text-faint`, `avatar-ring`, e o hover tracejado). O design entregou só 2 telas
   claras. Ou você fecha esses valores com o designer antes de codar, ou restringe o light mode
   às telas 18 e 19 até fechar.

### 9.6 Componentes prontos (as 6 classes que constroem 90% das telas)

```jsx
// Label de seção (eyebrow) - o padrão de caps
<Text className="font-sans-semibold text-caps tracking-label text-text-label">
  DADOS PESSOAIS
</Text>

// H1 de tela interna
<Text className="font-display text-h1 text-ink">Escolha o serviço</Text>

// Botão primário
<Pressable className="bg-ink rounded p-[18px] active:opacity-92">
  <Text className="text-center font-sans-semibold text-caps-lg tracking-btn text-ink-inverse">
    CONTINUAR
  </Text>
</Pressable>

// Botão secundário / ghost
<Pressable className="border border-ghost-border rounded p-[15px]">
  <Text className="text-center font-sans-semibold text-caps-md tracking-meta text-nav-arrow">
    ADICIONAR BLOQUEIO
  </Text>
</Pressable>

// Linha de lista com divisor
<View className="flex-row items-center justify-between py-[19px] border-b border-divider">
  ...
</View>

// Tela (padding lateral + safe areas)
<View className="flex-1 bg-canvas px-7 pt-[44px]">…</View>
```
