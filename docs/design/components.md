# Stewer Gabriel — Inventário de Componentes

Fonte: `c:/Users/Gustavo/Documents/stewer-app/stewer-agenda-app/design/Stewer Gabriel App.dc.html` (19 frames de 390x844).
Todos os valores abaixo foram copiados **literalmente** do CSS inline. Nada foi arredondado.

## 0. Convenções e tokens

Não existe `:root` no arquivo; as `var()` só aparecem com fallback. Valores reais:

| var | fallback (dark / board) | valor no modo "Marfim" (prop `prancheta`) |
|---|---|---|
| `--canvas` | `#0F0F0F` | `#ECE5D8` — **fundo do board, não é cor de tela** |
| `--gold` | `#C9A96A` | prop `dourado`: `#C9A96A` \| `#D6BC85` \| `#A8894F` \| `#B9B4A6` |
| `--cInk` | `#F1EBE0` | `#141210` |
| `--cMuted` | `#7A756B` | `#6E675C` |
| `--frame` | `#242424` | `#D8CFBD` |
| `--r` | `2px` | prop `cantos`: range 0–10px, step 1 |

Cores de tela (hardcoded nos frames, **não** usam var):

- **Dark** — fundo `#0A0A0A`, tinta `#F1EBE0`, superfícies elevadas `#121110` e `#0E0E0D`.
- **Light** — fundo `#F1EBE0`, tinta `#0A0A0A`, dourado-sobre-claro `#A8894F` (a **borda** dourada continua `var(--gold,#C9A96A)` mesmo no light; só o **texto/preenchimento** dourado vira `#A8894F`).
- Alfas dark sempre sobre `rgba(241,235,224,α)`; alfas light sobre `rgba(10,10,10,α)`.

Fontes:
- `'Playfair Display',serif` — 400/500/600 + italic 400/500. Títulos, nomes de serviço, números grandes e iniciais do avatar.
- `Inter,sans-serif` (herdada de `#sg-board`) — 400/500/600. Toda a UI e todos os labels em caps.

Regra global de link (no `<style>` do helmet, vale para o frame 02):
```css
a{color:#F1EBE0;text-decoration-color:rgba(201,169,106,.6);text-underline-offset:3px}
a:hover{color:#C9A96A}
```

Gutter horizontal de conteúdo: **sempre 28px** nas 19 telas (exceção: o rodapé legal do 02, que usa 36px).

`style-hover` é um atributo do Claude Design (pseudo-`:hover`). Em RN mapeia para o estado `pressed` do `Pressable`. Valores usados: `opacity:.92`, `opacity:.9`, `border-color:rgba(241,235,224,.45)`, `border-color:rgba(241,235,224,.3)`, `border-color:rgba(241,235,224,.4)`.

**Chrome do board (ignorar na implementação):** a "cover plate" (linhas 24–40), os 4 cabeçalhos de seção (`01 — PERFIL CLIENTE` etc.) e as legendas acima de cada frame (`03 · HOME DO CLIENTE`, em `font-size:10px;font-weight:600;letter-spacing:.2em;color:var(--cMuted,#7A756B)`). Não são UI do app.

---

## 1. Índice

| # | Componente | Telas | Ocorrências |
|---|---|---|---|
| 1 | `StatusBar` | todas as 19 | 19 (17 dark + 2 light) |
| 2 | `ScreenFrame` | todas as 19 | 19 |
| 3 | `HomeIndicator` | 03, 08, 09, 10, 12, 13, 15, 16, 17, 18 | 10 |
| 4 | `TabBar` + `TabBarItem` | 03, 08, 09, 10, 12, 13, 15, 16, 17, 18 | 10 barras / 34 itens |
| 5 | `NavHeader` (voltar + eyebrow) | 04, 05, 06, 07, 11, 14, 19 | 7 |
| 6 | `LogoDiamond` | 01, 02 (+ cover plate) | 3 |
| 7 | `DiamondMarker` (losango vazio 7px) | 05 | 1 |
| 8 | `DisplayTitle` / `Wordmark` | 01–19 | ~20 |
| 9 | `Eyebrow` (.26em) | 02, 03, 04, 05, 07, 10, 15, 18 | 7 + 1 light |
| 10 | `SectionLabel` (.24em/.48) | 03, 06, 08, 09, 11, 12, 14 | 11 |
| 11 | `SubMeta` (.2em/.45) | 04, 10, 12, 13, 15, 16, 17 | 20 |
| 12 | `PrimaryButton` | 02, 03, 05, 06, 07, 11 (dark) · 18, 19 (light) | 8 |
| 13 | `GhostButton` | 09, 11 (x2), 12, 14, 16 | 6 |
| 14 | `TextAction` (link em caps) | 03, 07, 11, 14, 16, 17, 18 | ~11 |
| 15 | `SegmentedUnderlineTabs` | 02 | 1 |
| 16 | `TextField` (box + label) | 02 | 2 |
| 17 | `SearchField` + `SearchIcon` | 13 | 1 |
| 18 | `Card` (outline gold / outline neutro / filled) | 03, 05, 07, 08, 11, 12, 14, 17, 18 | 12 |
| 19 | `Divider` (h / v / rule de seção) | 03, 05, 07, 08, 15, 17, 18 + listas | muitas |
| 20 | `ServiceRow` | 04, 16 | 12 |
| 21 | `HistoryRow` | 08, 14 | 9 |
| 22 | `KeyValueRow` / `SettingRow` / `PreferenceRow` | 07, 09, 11, 12 | 11 |
| 23 | `ClientRow` | 13 | 7 |
| 24 | `Avatar` (iniciais) | 09, 13, 14 | 9 |
| 25 | `ProfileHeader` | 09, 14 | 2 |
| 26 | `ImageSlot` | 05, 17 | 2 |
| 27 | `StatusTag` / `StatusDot` | 05, 06, 08, 10, 11, 14, 17, 19 | ~12 |
| 28 | `Calendar` (nav + weekdays + DayCell) | 06, 19 | 2 |
| 29 | `SlotChip` | 06, 19 | 18 |
| 30 | `DayToggleChip` (41x41) | 12 | 7 |
| 31 | `Switch` | 09 | 2 |
| 32 | `TimelineRow` + `BookingBlock`/`AvailableSlot`/`BreakBlock` | 10 | 8 |
| 33 | `DateBadge` (dia/mês empilhado) | 08 | 1 |
| 34 | `StatBlock` | 15 | 3 |
| 35 | `StatTrio` | 11 | 1 |
| 36 | `MiniBarChart` | 15 | 1 |
| 37 | `ProgressBar` | 15 | 1 |
| 38 | `DashedAddCard` | 17 | 1 |
| 39 | `Footnote` / `LegalFootnote` | 02, 05, 07, 16, 17 | 6 |
| 40 | `Glyph` (← ‹ › × +) | 04–07, 10–14, 19 | ~20 |
| 41 | `ScreenBody` (padding de conteúdo) | todas menos 01 | 18 |

---

## 2. Componentes

### 1. `StatusBar` — status bar falsa (9:41 + sinal + bateria)

**Telas:** todas as 19 (19 ocorrências exatas da string do container).

**Dark (17 telas):**
```css
/* container */
height:50px;display:flex;align-items:center;justify-content:space-between;padding:0 24px 0 30px
/* no frame 01 Splash o container tem prefixo extra: */
position:relative;z-index:2;height:50px;display:flex;align-items:center;justify-content:space-between;padding:0 24px 0 30px

/* relógio — texto literal: 9:41 */
font-size:13px;font-weight:600            /* cor herdada do frame: #F1EBE0 */

/* cluster direito */
display:flex;align-items:center;gap:7px

/* grupo de barras de sinal */
display:flex;align-items:flex-end;gap:2px
  barra 1: width:3px;height:4px;background:#F1EBE0
  barra 2: width:3px;height:6px;background:#F1EBE0
  barra 3: width:3px;height:8px;background:#F1EBE0
  barra 4: width:3px;height:10px;background:rgba(241,235,224,.35)   /* a MAIS ALTA é a APAGADA */

/* bateria: casca */
width:22px;height:11px;border:1px solid rgba(241,235,224,.45);border-radius:3px;padding:2px
/* bateria: carga */
width:70%;height:100%;background:#F1EBE0;border-radius:1px
```

**Light (18, 19):** container e relógio idênticos; muda só o preenchimento:
```css
barra 1..3: width:3px;height:{4|6|8}px;background:#0A0A0A
barra 4:    width:3px;height:10px;background:rgba(10,10,10,.3)
casca:      width:22px;height:11px;border:1px solid rgba(10,10,10,.4);border-radius:3px;padding:2px
carga:      width:70%;height:100%;background:#0A0A0A;border-radius:1px
```

**Props RN:** `{ time?: string /* default "9:41" */, theme:'dark'|'light', bars?: 1|2|3|4, batteryPercent?: number /* default 70 */, elevated?: boolean /* z-index:2, só no splash */ }`

**Pegadinhas RN:**
- **Não implemente isso em produção.** É mock de mockup. Use `<StatusBar barStyle="light-content"/>` + `useSafeAreaInsets().top`, e trate os 50px como `paddingTop: insets.top` (50 ≈ 47 do iPhone 13/14 + 3). Só construa o componente para telas de demo/screenshot.
- Se construir: as barras são `View`s, não texto. `alignItems:'flex-end'` no container das barras, senão as 4 alturas alinham pelo topo.
- A carga usa `width:70%` dentro de um box com `padding:2px`. RN é border-box por default, igual ao CSS aqui: `22 − 2(border) − 4(padding) = 16` de content, 70% = 11.2. Se divergir, use `flex:0.7` num wrapper em row.
- `borderRadius:1` numa View de 7px de altura: irrelevante visualmente, mas Android pode ignorar raios < 1dp.

---

### 2. `ScreenFrame` — moldura da tela

**Telas:** todas as 19.

```css
/* dark */
position:relative;width:390px;height:844px;background:#0A0A0A;border:1px solid var(--frame,#242424);border-radius:2px;overflow:hidden;color:#F1EBE0;flex:none
/* light (18, 19) */
position:relative;width:390px;height:844px;background:#F1EBE0;border:1px solid var(--frame,#242424);border-radius:2px;overflow:hidden;color:#0A0A0A;flex:none
```

**Props RN:** `{ theme:'dark'|'light', children }`

**Pegadinhas RN:**
- `width:390px;height:844px`, `border`, `border-radius:2px`, `overflow:hidden` e `flex:none` são **artefatos do board**. Na tela real: `flex:1` + `backgroundColor` do tema. Não replique a borda `#242424` — é a moldura do mockup.
- `color:#F1EBE0` no container **não herda** em RN: `<Text>` só herda de `<Text>` pai. Crie um `<AppText>` que injeta a cor do tema, ou o app sai com texto preto no Android.

---

### 3. `HomeIndicator` — pílula 118x4

**Telas:** 03, 08, 09, 10, 12, 13, 15, 16, 17, 18 (10 ocorrências). Sempre o último filho do container da TabBar.

```css
/* dark */
width:118px;height:4px;border-radius:99px;background:rgba(241,235,224,.2);margin:10px auto 8px
/* light (18) */
width:118px;height:4px;border-radius:99px;background:rgba(10,10,10,.22);margin:10px auto 8px
```

**Props RN:** `{ theme:'dark'|'light' }` — ou nenhuma.

**Pegadinhas RN:**
- O iOS desenha a barra de gesto por conta própria. Não desenhe a sua; troque por `paddingBottom: insets.bottom`. A soma `10 + 4 + 8 = 22px` do design é menor que os 34px de inset do iPhone com notch — revise junto com o `padding:16px 8px 4px` da TabBar.
- `margin:10px auto 8px` → RN não tem `margin:auto` confiável para centrar: use `alignSelf:'center'` + `marginTop:10, marginBottom:8`.
- `borderRadius:99` numa View de 4px: RN faz clamp em `height/2`, resultado visual é a pílula correta.

---

### 4. `TabBar` / `TabBarItem` — tracinho de 14x1px no item ativo

**Telas:** 10 barras. Três conjuntos de itens:
- **Cliente (4 itens)** — 03, 08, 09, 18: `INÍCIO`, `AGENDAR`, `MEUS HORÁRIOS`, `PERFIL`
- **Profissional (3 itens)** — 10, 12, 13: `AGENDA`, `CLIENTES`, `DISPONIBILIDADE`
- **Admin (3 itens)** — 15, 16, 17: `VISÃO GERAL`, `SERVIÇOS`, `EQUIPE`

Ativos: 03→INÍCIO · 08→MEUS HORÁRIOS · 09→PERFIL · 10→AGENDA · 12→DISPONIBILIDADE · 13→CLIENTES · 15→VISÃO GERAL · 16→SERVIÇOS · 17→EQUIPE · 18→INÍCIO.

```css
/* container (dark) */
position:absolute;left:0;right:0;bottom:0;background:#0A0A0A;border-top:1px solid rgba(241,235,224,.1)
/* container (light, tela 18) */
position:absolute;left:0;right:0;bottom:0;background:#F1EBE0;border-top:1px solid rgba(10,10,10,.12)

/* linha de itens */
display:flex;padding:16px 8px 4px

/* item (idêntico ativo e inativo) */
flex:1;display:flex;flex-direction:column;align-items:center;gap:7px

/* tracinho ATIVO (dark) */
width:14px;height:1px;background:var(--gold,#C9A96A)
/* tracinho ATIVO (light) */
width:14px;height:1px;background:#A8894F
/* tracinho INATIVO — existe, mas SEM background (espaçador invisível) */
width:14px;height:1px

/* label ATIVO (dark) */
font-size:9px;font-weight:600;letter-spacing:.14em;color:var(--gold,#C9A96A)
/* label ATIVO (light) */
font-size:9px;font-weight:600;letter-spacing:.14em;color:#A8894F
/* label INATIVO (dark) */
font-size:9px;font-weight:600;letter-spacing:.14em;color:rgba(241,235,224,.4)
/* label INATIVO (light) */
font-size:9px;font-weight:600;letter-spacing:.14em;color:rgba(10,10,10,.45)
```

**Props RN:** `{ items: {key:string, label:string}[], activeKey:string, onPress:(key)=>void, theme:'dark'|'light' }`
Sem ícones — a barra é 100% tipográfica.

**Pegadinhas RN:**
- **O tracinho inativo não é opcional.** É uma `View` de 14x1 sem `backgroundColor`, só para manter o baseline dos labels alinhado. Se renderizar condicionalmente (`{active && <View/>}`), os labels inativos sobem 8px (1 + gap 7). Mantenha a View sempre, com `backgroundColor:'transparent'`.
- `letter-spacing:.14em` a 9px = **1.26px** em RN (`letterSpacing` é px absoluto, nunca em). `DISPONIBILIDADE` (15 chars) ocupa ~103px; num item `flex:1` de uma barra de 3 (390 − padding 16) sobram ~124px. Cabe por pouco: `numberOfLines={1}` e `allowFontScaling={false}`.
- `MEUS HORÁRIOS` no layout de 4 itens: 13 chars em ~93px. Muito justo. Considere `adjustsFontSizeToFit` (iOS) ou aceitar 2 linhas e recalcular a altura da barra.
- `border-top:1px` → `borderTopWidth:1` (não `StyleSheet.hairlineWidth`; o design pede 1px cheio).
- Prefira o tab navigator real e replique só o estilo, em vez de `position:'absolute'`.

---

### 5. `NavHeader` — voltar + eyebrow à direita

**Telas:** 04, 05, 06, 07, 11, 14 (dark) e 19 (light).

```css
/* container */
display:flex;justify-content:space-between;align-items:center;padding:20px 28px 0

/* botão voltar (dark) — conteúdo literal: ← */
font-size:19px;color:rgba(241,235,224,.75);cursor:pointer
/* botão voltar (light, tela 19) */
font-size:19px;color:rgba(10,10,10,.7);cursor:pointer

/* eyebrow à direita (dark) */
font-size:9px;font-weight:600;letter-spacing:.24em;color:rgba(241,235,224,.45)
/* eyebrow à direita (light, tela 19) */
font-size:9px;font-weight:600;letter-spacing:.24em;color:rgba(10,10,10,.45)
```

Textos literais do eyebrow: `PASSO 01 DE 04` (04) · `PASSO 02 DE 04` (05) · `PASSO 03 DE 04` (06 e 19) · `PASSO 04 DE 04` (07) · `AGENDA · HOJE` (11) · `CLIENTES` (14).

**Props RN:** `{ onBack:()=>void, eyebrow?:string, theme:'dark'|'light' }`

**Pegadinhas RN:**
- O `←` é U+2190 renderizado como texto, não ícone. No Android o glyph varia conforme a fonte de fallback. O design não define `font-family` nesse div, então herda `Inter` — que **tem** o glyph. Se bundlar Inter, force `fontFamily:'Inter-Regular'` e inclua o bloco de setas no subset; senão troque por SVG.
- Hitbox de ~19x23. Envolva num `Pressable` com `hitSlop={{top:12,bottom:12,left:12,right:12}}`.
- `align-items:center` alinha o `←` com o eyebrow no centro vertical. Em RN as métricas de linha diferem entre o glyph de 19px e o caps de 9px: aplique `includeFontPadding:false` nos dois para o alinhamento bater no Android.

---

### 6. `LogoDiamond` — losango rotate(45deg) com "SG" contra-rotacionado

**Telas:** 01 Splash (58px), 02 Acesso (40px). Terceira instância no cover plate do board (52px) — ignorar.

```css
/* 01 Splash — externo */
width:58px;height:58px;border:1px solid var(--gold,#C9A96A);transform:rotate(45deg);display:flex;align-items:center;justify-content:center;margin-bottom:14px
/* 01 Splash — interno (texto "SG") */
transform:rotate(-45deg);font-family:'Playfair Display',serif;font-size:19px;letter-spacing:.08em

/* 02 Acesso — externo */
width:40px;height:40px;border:1px solid var(--gold,#C9A96A);transform:rotate(45deg);display:flex;align-items:center;justify-content:center;margin:6px 0 42px 8px
/* 02 Acesso — interno ("SG") — ATENÇÃO: sem letter-spacing aqui */
transform:rotate(-45deg);font-family:'Playfair Display',serif;font-size:13px

/* cover plate do board (não é app) — externo */
width:52px;height:52px;border:1px solid var(--gold,#C9A96A);transform:rotate(45deg);display:flex;align-items:center;justify-content:center;flex:none;margin:8px 10px
/* cover plate — interno */
transform:rotate(-45deg);font-family:'Playfair Display',serif;font-size:17px;letter-spacing:.08em;color:var(--cInk,#F1EBE0)
```

A cor do "SG" é herdada (`#F1EBE0` no dark). Não há fill — só a borda dourada de 1px.

**Props RN:** `{ size: 58|40, initials?: string /* "SG" */, fontSize:number, letterSpacing?:number, borderColor?:string }`

**Pegadinhas RN (a mais importante do arquivo):**
- `transform:[{rotate:'45deg'}]` **não afeta o layout**, igual ao CSS. Um quadrado de 58px rotacionado ocupa caixa de 58x58 mas **desenha** 58×√2 ≈ **82.02px** de diagonal — vaza 12.01px de cada lado. No design isso é absorvido pelo `margin-bottom:14px` (splash) e `margin:6px 0 42px 8px` (acesso). Em RN, se um ancestral tiver `overflow:'hidden'` (o `ScreenFrame` tem), **as pontas são cortadas**. Envolva num wrapper de `width:84,height:84,alignItems:'center',justifyContent:'center'` e ponha as margens no wrapper.
- Para o interno use `transform:[{rotate:'-45deg'}]` como único item do array — evita ambiguidade de ordem.
- **Texto dentro de View rotacionada no Android** costuma sair serrilhado/blur (rasteriza antes de rotacionar). Se ficar ruim, não aninhe: renderize o losango (View rotacionada) e o "SG" (Text **não** rotacionado) como irmãos, com o Text em `position:'absolute'` centralizado — elimina a dupla rotação inteira.
- `border:1px` em View rotacionada 45° pode desaparecer no Android em densidades fracionárias. Alternativa robusta: `react-native-svg` com `<Rect transform="rotate(45)"/>` ou um `<Path>` de diamante — resolve rotação, borda e antialiasing de uma vez.
- `letter-spacing:.08em` a 19px = **1.52px**; a 13px **não existe** (o frame 02 omite). Não "padronize" — se for replicar 1:1, mantenha a diferença.
- `letterSpacing` adiciona espaço **depois** do último glyph: "SG" com tracking fica 1.52px à esquerda do centro. Dentro de um losango isso é perceptível. Compense com `paddingLeft:1.52` no Text (mesma técnica que o design usa nos títulos em caps).

---

### 7. `DiamondMarker` — losango vazio 7x7 (marcador de selecionado)

**Telas:** 05.

```css
width:7px;height:7px;border:1px solid var(--gold,#C9A96A);transform:rotate(45deg)
```

**Props RN:** `{ color?: string }`

**Pegadinhas RN:** 7×√2 = **9.9px** de largura visual numa caixa de 7px → vaza 1.45px de cada lado e pode ser cortado pelo `padding:24px` do card ou pelo `overflow:hidden`. Envolva em `width:12,height:12,alignItems:'center',justifyContent:'center'`. Com 1px de borda em 7px de lado o Android pode engolir a borda: prefira `react-native-svg`.

---

### 8. `DisplayTitle` — títulos Playfair

Tamanhos exatos usados, por papel:

| Papel | CSS | Telas |
|---|---|---|
| Título de tela XL | `font-family:'Playfair Display',serif;font-size:31px;font-weight:400;margin-top:14px` | 02 (`Bem-vindo.`) |
| Título de tela XL | `font-family:'Playfair Display',serif;font-size:31px;margin-top:12px` | 03, 18 (`Boa tarde, Rafael.`) |
| Título de tela L | `font-family:'Playfair Display',serif;font-size:29px;margin-top:12px` | 04 (`Escolha o serviço`), 05 (`Escolha o profissional`), 07 (`Confirme os detalhes`), 15 (`Esta semana`) |
| Título de tela L (sem margin) | `font-family:'Playfair Display',serif;font-size:29px` | 06 e 19 (`Data e horário`), 08 (`Meus agendamentos`), 11 (`Rafael Duarte`), 12 (`Disponibilidade`), 13 (`Clientes`), 16 (`Serviços`), 17 (`Equipe`) |
| Título de tela M | `font-family:'Playfair Display',serif;font-size:27px;margin-top:12px` | 10 (`Terça, 1 de setembro`) |
| Nome em header de perfil | `font-family:'Playfair Display',serif;font-size:24px` | 09 (`Rafael Duarte`) |
| Nome em header de perfil | `font-family:'Playfair Display',serif;font-size:25px` | 14 (`Rafael Duarte`) |
| Título de card | `font-family:'Playfair Display',serif;font-size:23px` | 03, 05, 18 |
| Valor destacado em card | `font-family:'Playfair Display',serif;font-size:24px` | 07 (`R$ 190`) |
| Campo destacado em card | `font-family:'Playfair Display',serif;font-size:21px` | 07 (`Corte Assinatura`) |
| Stat inline | `font-family:'Playfair Display',serif;font-size:21px` | 11 (`12`, `Mar 2024`, `14 Ago`) |
| Nome de item de lista | `font-family:'Playfair Display',serif;font-size:19px` | 04, 16 |
| Nome de card compacto | `font-family:'Playfair Display',serif;font-size:20px` | 17 |
| Título de card compacto | `font-family:'Playfair Display',serif;font-size:18px` | 08 (`Corte Assinatura`) |
| Mês do calendário | `font-family:'Playfair Display',serif;font-size:18px` | 06, 19 (`Setembro 2026`) |
| Dia do `DateBadge` | `font-family:'Playfair Display',serif;font-size:26px` | 08 (`11`) |
| Número de KPI | `font-family:'Playfair Display',serif;font-size:42px;line-height:1` | 15 (`32`, `78%`, `9`) |
| Valor monetário inline | `font-family:'Playfair Display',serif;font-size:19px` | 15 (`R$ 7.240`) |
| Iniciais do avatar | `font-family:'Playfair Display',serif;font-size:{19\|17\|14}px` | 09 / 14 / 13 |

Nenhum título Playfair declara `letter-spacing` ou `color` — herdam a tinta do frame e tracking 0.

**Props RN:** `{ size:number, children, italic?:boolean, weight?:400|500|600 }`

**Pegadinhas RN:**
- `fontWeight` **não funciona de forma confiável** com famílias customizadas no Android. Registre arquivos separados e selecione por `fontFamily`: `PlayfairDisplay-Regular/-Medium/-SemiBold/-Italic/-MediumItalic`. O design só usa 400 explicitamente (frame 02) e 400 implícito no resto, mas o `<link>` carrega 400/500/600 + italic 400/500 — registre os 5.
- `line-height:1` não existe como multiplicador em RN: `lineHeight` é px absoluto. Para o KPI de 42px, `lineHeight:42`. Em Playfair (serifada, ascendente alto), `lineHeight === fontSize` **corta o topo dos números no Android**. Use `includeFontPadding:false` e, se ainda cortar, `lineHeight:46` com `marginTop:-4`.
- Nos demais títulos o design **não** define `line-height` — deixe `lineHeight` indefinido em RN para usar a métrica da fonte, senão você aperta os descendentes de "g"/"ç" (`Serviços`, `Confirme`, `Boa tarde`).
- `margin-top:12px`/`14px` medem a partir da **linha de texto** do eyebrow irmão, não de um bloco. RN não tem collapse de margens, então transferem 1:1.

#### 8b. `Wordmark` (splash) — o caso do `padding-left` compensatório

**Tela:** 01.

```css
/* container do splash */
position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px

/* wordmark — texto literal: STEWER GABRIEL */
font-family:'Playfair Display',serif;font-size:20px;letter-spacing:.32em;padding-left:.32em

/* fio */
width:34px;height:1px;background:rgba(241,235,224,.25)

/* tagline — texto literal: VISAGISMO & CONSULTORIA DE IMAGEM */
font-size:9px;font-weight:600;letter-spacing:.3em;color:rgba(241,235,224,.5);padding-left:.3em

/* rodapé — texto literal: STEWERGABRIEL.COM */
position:absolute;bottom:44px;left:0;right:0;text-align:center;font-size:8.5px;font-weight:600;letter-spacing:.3em;color:rgba(241,235,224,.3)
```

**Este é o padrão que a tarefa pediu para observar.** O tracking (em CSS e em RN) adiciona espaço **após o último glyph**, empurrando texto centralizado para a esquerda. O design corrige com `padding-left` do **mesmo valor em em** do `letter-spacing`:
- wordmark: `letter-spacing:.32em` a 20px = **6.4px** → `padding-left:.32em` = **6.4px**
- tagline: `letter-spacing:.3em` a 9px = **2.7px** → `padding-left:.3em` = **2.7px**
- **o rodapé `STEWERGABRIEL.COM` NÃO tem a compensação** (tem `letter-spacing:.3em` a 8.5px = 2.55px e nenhum `padding-left`) — está 1.275px fora de centro. Replique ou corrija conscientemente.

Em RN: `{fontSize:20, letterSpacing:6.4, paddingLeft:6.4}`. Note que o `padding-left` cheio compensa **o dobro** do necessário (o exato seria a metade), mas é o que o design faz — para centro óptico perfeito use `marginRight:-6.4`.

**Props RN do Wordmark:** `{ fontSize:number, trackingEm:number }` — calcule `letterSpacing = fontSize*trackingEm` e `paddingLeft = letterSpacing` internamente.

---

### 9. `Eyebrow` — micro-label de contexto (.26em)

**Telas:** 02, 03, 04, 05, 07, 10, 15 (7 ocorrências) + 18 (light).

```css
/* dark */
font-size:9px;font-weight:600;letter-spacing:.26em;color:rgba(241,235,224,.48)
/* light (18) */
font-size:9px;font-weight:600;letter-spacing:.26em;color:rgba(10,10,10,.5)
```
Textos literais: `O ATELIÊ, NO SEU TEMPO` (02) · `TERÇA-FEIRA, 1 DE SETEMBRO` (03, 18) · `NOVO AGENDAMENTO` (04, 05, 07) · `AGENDA · HOJE` (10) · `VISÃO GERAL` (15).

**Props RN:** `{ children, theme }`. `letterSpacing: 2.34`.

---

### 10. `SectionLabel` — cabeçalho de seção (.24em / .48)

**Telas:** 03, 06, 08, 09, 11, 12, 14 (11 ocorrências).

```css
/* dark — base */
font-size:9px;font-weight:600;letter-spacing:.24em;color:rgba(241,235,224,.48)
/* light (19) */
font-size:9px;font-weight:600;letter-spacing:.24em;color:rgba(10,10,10,.5)
```
`margin-top` por contexto: `26px` (06 `HORÁRIOS · SEXTA, 11 SET`), `38px` (11 `RESUMO DO CLIENTE`), `40px` (09 `PREFERÊNCIAS`, 12 `DIAS DE ATENDIMENTO`, 14 `HISTÓRICO DE VISITAS`), `42px` (08 `PRÓXIMOS`, 12 `HORÁRIO DE TRABALHO`, 12 `BLOQUEIOS PONTUAIS`), `44px` (08 `HISTÓRICO`), `48px` (09 `DADOS PESSOAIS`). No 03/18 (`ÚLTIMA VISITA`) não há margin-top no label — o wrapper tem `margin-top:48px`.

Variante em card (8.5px, alfa .45):
```css
font-size:8.5px;font-weight:600;letter-spacing:.24em;color:rgba(241,235,224,.45)
```
Usada em 07 (`SERVIÇO`, `PROFISSIONAL`, `DATA`, `HORÁRIO`, `VALOR`), 11 (`SERVIÇO`, `VALOR`, `STATUS`, `ANOTAÇÕES DE VISAGISMO`), 14 (`ANOTAÇÕES DE VISAGISMO`).

**Props RN:** `{ children, size?:9|8.5, marginTop?:number, theme }`. `letterSpacing`: 9px→**2.16**, 8.5px→**2.04**.

**Pegadinhas RN:** 10 das 11 ocorrências são alinhadas à esquerda — **não** compense o tracking nessas. Compense apenas nos centralizados (ver §8b).

---

### 11. `SubMeta` — meta em caps (.2em / .45)

**Telas:** 04, 10, 12, 13, 15, 16, 17 (20 ocorrências).

```css
font-size:9px;font-weight:600;letter-spacing:.2em;color:rgba(241,235,224,.45)
```
Textos literais: `90 MIN` / `60 MIN` / `45 MIN` / `120 MIN` (04) · `4 ATENDIMENTOS · 09:00 — 19:00` (10, `margin-top:14px`) · `SEU HORÁRIO PADRÃO DE ATENDIMENTO` (12, `margin-top:14px`) · `48 ATIVOS` (13, `padding-bottom:6px`) · `31 AGO — 06 SET` (15, `margin-top:14px`) · `90 MIN · R$ 320` etc (16) · `1 PROFISSIONAL ATIVO` (17, `margin-top:14px`).

`letterSpacing: 1.8`.

---

### 12. `PrimaryButton` — claro sobre escuro / escuro sobre claro

**Telas dark (6):** 02 `CONTINUAR`, 03 `NOVO AGENDAMENTO`, 05 `CONTINUAR`, 06 `CONTINUAR`, 07 `CONFIRMAR AGENDAMENTO`, 11 `CONCLUIR ATENDIMENTO`.
**Telas light (2):** 18 `NOVO AGENDAMENTO`, 19 `CONTINUAR`.

```css
/* DARK — botão claro sobre fundo escuro */
background:#F1EBE0;color:#0A0A0A;border-radius:var(--r,2px);padding:18px;text-align:center;font-size:10.5px;font-weight:600;letter-spacing:.22em;cursor:pointer
  style-hover="opacity:.92"
  margin-top por tela: 34px (02) · 28px (03) · 28px (05) · 26px (06) · 30px (07) · 34px (11)

/* LIGHT — a inversão exata */
background:#0A0A0A;color:#F1EBE0;border-radius:var(--r,2px);padding:18px;text-align:center;font-size:10.5px;font-weight:600;letter-spacing:.22em;cursor:pointer
  style-hover="opacity:.9"        /* ATENÇÃO: .9 no light, .92 no dark */
  margin-top: 28px (18) · 26px (19)
```

Não há estado `disabled`, `loading` nem variante pequena do PrimaryButton no design.

**Props RN:** `{ label:string, onPress, theme:'dark'|'light', style?:ViewStyle /* p/ marginTop */ }`

**Pegadinhas RN:**
- `padding:18px` uniforme → altura total ≈ 18 + 13 + 18 = 49px. Bom para toque (>44). **Não** fixe `height`: com `allowFontScaling` o texto cresce e estoura.
- `text-align:center` vai no `<Text>` (`textAlign:'center'`), e a View precisa de `alignItems:'center'` ou o Text de `width:'100%'`.
- `letter-spacing:.22em` a 10.5px = **2.31px**. O design **não** compensa o tracking aqui: os labels dos 8 botões estão 1.155px à esquerda do centro. Replique (imperceptível) ou corrija nos 8 de uma vez.
- Hover → `Pressable` com `style={({pressed}) => [base, pressed && {opacity: theme==='dark' ? 0.92 : 0.9}]}` e `android_ripple={null}` para não somar ripple ao fade.
- `border-radius:var(--r,2px)` = **2**. Muito quadrado de propósito; a prop `cantos` do board (0–10) existe justamente para isso ser um token.

---

### 13. `GhostButton` — outline

Cinco variantes. **Nunca** unifique sem parametrizar `borderColor`, `padding`, `letter-spacing` e `color`.

```css
/* A) full-width, tom "quieto" — 09 SAIR DA CONTA */
border:1px solid rgba(241,235,224,.22);border-radius:var(--r,2px);padding:16px;text-align:center;font-size:10px;font-weight:600;letter-spacing:.22em;color:rgba(241,235,224,.65);margin-top:44px;cursor:pointer
  style-hover="border-color:rgba(241,235,224,.45)"

/* B) full-width, padrão — 12 ADICIONAR BLOQUEIO (margin-top:18px) e 14 NOVO AGENDAMENTO PARA ESTE CLIENTE (margin-top:26px) */
border:1px solid rgba(241,235,224,.22);border-radius:var(--r,2px);padding:15px;text-align:center;font-size:10px;font-weight:600;letter-spacing:.22em;color:rgba(241,235,224,.75);cursor:pointer
  style-hover="border-color:rgba(241,235,224,.45)"

/* C) em par, secundário — 11 REMARCAR */
flex:1;border:1px solid rgba(241,235,224,.22);border-radius:var(--r,2px);padding:15px;text-align:center;font-size:10px;font-weight:600;letter-spacing:.2em;color:rgba(241,235,224,.75);cursor:pointer
  style-hover="border-color:rgba(241,235,224,.45)"

/* D) em par, terciário / destrutivo suave — 11 CANCELAR */
flex:1;border:1px solid rgba(241,235,224,.12);border-radius:var(--r,2px);padding:15px;text-align:center;font-size:10px;font-weight:600;letter-spacing:.2em;color:rgba(241,235,224,.42);cursor:pointer
  style-hover="border-color:rgba(241,235,224,.3)"

/* linha que contém C+D */
display:flex;gap:12px;margin-top:12px

/* E) compacto inline — 16 NOVO SERVIÇO */
border:1px solid rgba(241,235,224,.22);border-radius:var(--r,2px);padding:10px 16px;font-size:9px;font-weight:600;letter-spacing:.18em;color:rgba(241,235,224,.8);cursor:pointer;margin-bottom:2px
  style-hover="border-color:rgba(241,235,224,.45)"
```

Não há GhostButton no light mode (nenhuma das 2 telas light tem um).

**Props RN:** `{ label, onPress, variant:'quiet'|'default'|'pair'|'pairMuted'|'compact', flex?:boolean }`

**Pegadinhas RN:**
- Variante E: altura total 10+13+10+2 = 35px — **abaixo do alvo mínimo de 44px**. `hitSlop` vertical de 5–6px.
- No par C+D, `flex:1` nos dois com `gap:12px`: em RN < 0.71 não há `gap`. Use `marginRight:12` no primeiro (não `marginHorizontal:6`, que muda o alinhamento das bordas externas).
- O estado pressed muda **cor de borda**, não opacidade. Implemente com `Pressable` + `pressed && {borderColor:'...'}`; não caia no default de `TouchableOpacity`, que aplica fade no conjunto e diverge do design.

---

### 14. `TextAction` — link em caps (sem borda)

```css
/* A) dourado .18em — 03 DETALHES, 03 REPETIR, 14 EDITAR */
font-size:9px;font-weight:600;letter-spacing:.18em;color:var(--gold,#C9A96A);cursor:pointer
/* A') com margem — 11 VER FICHA COMPLETA */
font-size:9px;font-weight:600;letter-spacing:.18em;color:var(--gold,#C9A96A);margin-top:14px;cursor:pointer

/* B) apagado .18em / .5 — 03 REAGENDAR */
font-size:9px;font-weight:600;letter-spacing:.18em;color:rgba(241,235,224,.5);cursor:pointer

/* C) neutro .18em / .55 — 16 EDITAR (x6), 17 GERENCIAR */
font-size:9px;font-weight:600;letter-spacing:.18em;color:rgba(241,235,224,.55);cursor:pointer

/* D) centralizado abaixo do PrimaryButton — 07 ALTERAR DATA OU HORÁRIO */
text-align:center;font-size:9px;font-weight:600;letter-spacing:.2em;color:rgba(241,235,224,.45);margin-top:22px;cursor:pointer

/* E) LIGHT (18) */
dourado: font-size:9px;font-weight:600;letter-spacing:.18em;color:#A8894F;cursor:pointer            /* DETALHES, REPETIR */
apagado: font-size:9px;font-weight:600;letter-spacing:.18em;color:rgba(10,10,10,.5);cursor:pointer  /* REAGENDAR */
```
Grupo de dois links no card do 03/18: `display:flex;gap:20px`.

**Props RN:** `{ label, onPress, tone:'gold'|'muted'|'neutral', theme }`. `letterSpacing`: .18em@9px = **1.62**; .2em@9px = **1.8**.

**Pegadinhas RN:** 9px sem padding = hitbox de ~11px de altura. **Sempre** `hitSlop` de 12px vertical, ou `Pressable` com `paddingVertical:10;marginVertical:-10`.

---

### 15. `SegmentedUnderlineTabs` — abas Entrar / Criar conta

**Tela:** 02.

```css
/* track */
display:flex;border-bottom:1px solid rgba(241,235,224,.14);margin-top:40px

/* aba ATIVA — texto literal: ENTRAR */
padding:0 2px 14px;margin-right:34px;font-size:10px;font-weight:600;letter-spacing:.2em;border-bottom:1px solid var(--gold,#C9A96A);margin-bottom:-1px

/* aba INATIVA — texto literal: CRIAR CONTA */
padding:0 2px 14px;font-size:10px;font-weight:600;letter-spacing:.2em;color:rgba(241,235,224,.4)
```
A aba ativa **não** declara `color` — herda `#F1EBE0` cheio.

**Props RN:** `{ tabs:string[], activeIndex:number, onChange:(i)=>void }`

**Pegadinhas RN:**
- `margin-bottom:-1px` na aba ativa é o truque para o underline dourado **cobrir** a linha `.14` do track. Margem negativa funciona em RN e o filho é desenhado depois, então cobre — mas confira no Android, onde o `overflow` do pai pode cortar o 1px que sai.
- Alternativa robusta: track como `View` absoluta de `height:1` atrás e indicador ativo como outra `View` absoluta — elimina a dependência de margem negativa.
- `margin-right:34px` está na aba **ativa**, mas funcionalmente é o espaçamento do **primeiro** item. Trate como `marginRight` do primeiro filho, não do ativo, senão o gap salta ao trocar de aba.

---

### 16. `TextField` — campo com box (não underline)

**Tela:** 02 (2 campos). **O design usa box, não underline** — os únicos underlines do arquivo são as abas (§15) e os separadores de lista.

```css
/* grupo */
display:flex;flex-direction:column;gap:8px;margin-top:36px     /* 1º campo: E-MAIL */
display:flex;flex-direction:column;gap:8px;margin-top:22px     /* 2º campo: TELEFONE */

/* label — textos literais: E-MAIL / TELEFONE */
font-size:9px;font-weight:600;letter-spacing:.22em;color:rgba(241,235,224,.48)

/* box (estado placeholder — o único estado no design) */
border:1px solid rgba(241,235,224,.18);border-radius:var(--r,2px);padding:16px;font-size:14px;color:rgba(241,235,224,.35)
```
Placeholders literais: `seunome@email.com`, `+55 (11) 90000-0000`.
Nota do formulário: `font-size:11px;color:rgba(241,235,224,.42);margin-top:18px;text-align:center` → `Enviaremos um código de confirmação.`

**Não existe no design:** foco, preenchido, erro, desabilitado. Sugestão coerente com o vocabulário: foco = `border-color:var(--gold,#C9A96A)`; preenchido = `color:#F1EBE0`; erro exigiria um vermelho **que não existe na paleta** — levante com o cliente antes.

**Props RN:** `{ label:string, placeholder:string, value:string, onChangeText, keyboardType?, autoCapitalize?, state?:'default'|'focus'|'error'|'disabled' }`

**Pegadinhas RN:**
- `padding:16px` num `TextInput`: no Android o input tem padding interno próprio + `textAlignVertical` default. Zere com `padding:0` no input e ponha o `padding:16` num `View` wrapper com a borda; ou `{padding:16, textAlignVertical:'center', includeFontPadding:false}` e teste — a altura difere ~4px entre iOS e Android se não zerar.
- `placeholderTextColor="rgba(241,235,224,.35)"` — não confie na herança de `color`.
- `keyboardAppearance="dark"` no iOS para combinar com `#0A0A0A`.
- A máscara `+55 (11) 90000-0000` não é nativa: `react-native-mask-input` ou lógica própria.

---

### 17. `SearchField` + `SearchIcon`

**Tela:** 13.

```css
/* container */
display:flex;align-items:center;gap:12px;border:1px solid rgba(241,235,224,.16);border-radius:var(--r,2px);padding:14px 16px;margin-top:28px

/* wrapper do ícone */
position:relative;width:14px;height:14px;flex:none
/* círculo da lupa */
width:10px;height:10px;border:1.5px solid rgba(241,235,224,.45);border-radius:50%
/* cabo da lupa */
position:absolute;right:0;bottom:1px;width:5px;height:1.5px;background:rgba(241,235,224,.45);transform:rotate(45deg)

/* placeholder — texto literal: Buscar por nome */
font-size:13.5px;color:rgba(241,235,224,.35)
```

**Props RN:** `{ placeholder, value, onChangeText, onClear? }`

**Pegadinhas RN:**
- A lupa é composta de duas `View`s (10x10 e 5x1.5). `borderWidth:1.5` e `height:1.5` funcionam, mas em @2x viram 3 físicos e em 1.5x arredondam para 2 — o cabo pode desaparecer ou virar um blob. **Troque por `react-native-svg`** (`<Circle strokeWidth={1.5}/>` + `<Line/>`) ou por um ícone de família (Feather `search`) com a cor `rgba(241,235,224,.45)`.
- `border-radius:50%` → `borderRadius:5` (metade de 10). Percentual em `borderRadius` não é confiável.
- O cabo rotacionado sai ~1.5px do wrapper de 14x14: **não** ponha `overflow:'hidden'` no wrapper.

---

### 18. `Card` — 3 famílias, 8 configurações

#### 18a. `Card` outline **dourado** (destaque)
```css
/* 03 — PRÓXIMO AGENDAMENTO (dark) */
border:1px solid var(--gold,#C9A96A);border-radius:var(--r,2px);padding:26px 24px;margin-top:42px;display:flex;flex-direction:column;gap:14px
/* 18 — o mesmo card no LIGHT: ganha fill translúcido */
border:1px solid var(--gold,#C9A96A);border-radius:var(--r,2px);padding:26px 24px;margin-top:42px;display:flex;flex-direction:column;gap:14px;background:rgba(255,255,255,.35)
/* 05 — card de mídia (sem padding no container, imagem sangra) */
border:1px solid var(--gold,#C9A96A);border-radius:var(--r,2px);margin-top:30px;overflow:hidden
   corpo: padding:24px;display:flex;flex-direction:column;gap:10px
```
Conteúdo do card 03/18: label `font-size:9px;font-weight:600;letter-spacing:.24em;color:var(--gold,#C9A96A)` (light: `color:#A8894F`) → `PRÓXIMO AGENDAMENTO`; título Playfair 23px; horário `font-size:10.5px;font-weight:500;letter-spacing:.16em;color:rgba(241,235,224,.72)` (light: `rgba(10,10,10,.65)`) → `SEX, 11 SET · 15:30 — 16:30`; rodapé `font-size:12.5px;color:rgba(241,235,224,.62)` (light: `rgba(10,10,10,.6)`) → `Stewer Gabriel · Visagista`.

#### 18b. `Card` outline **neutro**
```css
/* 07 — resumo da confirmação */
border:1px solid rgba(241,235,224,.14);border-radius:var(--r,2px);padding:28px 26px;margin-top:32px;display:flex;flex-direction:column;gap:22px
/* 11 — detalhes do agendamento */
border:1px solid rgba(241,235,224,.14);border-radius:var(--r,2px);padding:24px;margin-top:30px;display:flex;flex-direction:column;gap:18px
/* 12 — bloqueio pontual (1º / 2º) */
border:1px solid rgba(241,235,224,.14);border-radius:var(--r,2px);padding:18px 20px;margin-top:16px;display:flex;justify-content:space-between;align-items:center
border:1px solid rgba(241,235,224,.14);border-radius:var(--r,2px);padding:18px 20px;margin-top:10px;display:flex;justify-content:space-between;align-items:center
/* 17 — card da equipe */
border:1px solid rgba(241,235,224,.14);border-radius:var(--r,2px);margin-top:30px;padding:22px
/* 08 — próximo agendamento (alfa .16, mais visível) */
border:1px solid rgba(241,235,224,.16);border-radius:var(--r,2px);padding:20px 22px;margin-top:16px;display:flex;align-items:center;gap:20px
```

#### 18c. `Card` **filled** (superfície elevada)
```css
/* 11 — painel de anotações */
margin-top:34px;padding:20px 22px;background:#121110;border-radius:var(--r,2px)
/* 14 — painel de anotações */
margin-top:34px;padding:22px;background:#121110;border-radius:var(--r,2px)
```
(`#121110` também é o fundo do `BookingBlock` da tela 10 — §32. `#0E0E0D` é exclusivo do `BreakBlock`.)

Conteúdo dos painéis de anotações:
```css
/* corpo — 11 */  font-size:13px;line-height:1.75;color:rgba(241,235,224,.75);margin-top:12px
/* corpo — 14 */  font-size:13px;line-height:1.8;color:rgba(241,235,224,.78);margin-top:14px
/* assinatura — 14 */ font-size:8px;font-weight:600;letter-spacing:.2em;color:rgba(241,235,224,.35);margin-top:16px
```
Literal (14): `Rosto oval alongado, têmporas estreitas. Manter volume e textura no topo; laterais em degradê baixo, contorno natural. Barba delineada curta para equilibrar o terço inferior. Evitar franjas retas.` / `ATUALIZADO EM 14 AGO · STEWER GABRIEL`
Literal (11): `Rosto oval alongado. Manter volume e textura no topo; laterais em degradê baixo, contorno natural.`

**Props RN:** `{ variant:'gold'|'neutral'|'filled', padding:number|[v,h], gap?:number, borderAlpha?:.14|.16, children, theme }`

**Pegadinhas RN:**
- `overflow:hidden` + `borderRadius:2` + `<Image>` (card 05): no Android o clip do filho por raio do pai é inconsistente. Aplique `borderTopLeftRadius/borderTopRightRadius:2` **também na Image** e mantenha `overflow:'hidden'` no pai.
- `line-height:1.75` a 13px = **22.75** absoluto; `1.8` a 13px = **23.4**. Não deixe multiplicador.
- `background:rgba(255,255,255,.35)` sobre `#F1EBE0`: RN aceita a string, mas se você animar `opacity` do card o fill translúcido compõe duas vezes.
- `gap` em coluna (14/22/18/10px) exige RN ≥ 0.71. Sem ele, `React.Children.map` com `index < count-1` (não existe `:last-child` em RN).

---

### 19. `Divider`

```css
/* A) fio dentro de card (dark) */
height:1px;background:rgba(241,235,224,.12)
   + margin-top:6px   (03)
   + margin-top:8px   (05)
   + sem margem       (07)
/* A') fio dentro de card (dark, alfa .1) */
height:1px;background:rgba(241,235,224,.1);margin:20px 0 16px    (17)
/* A'') light (18) */
height:1px;background:rgba(10,10,10,.12);margin-top:6px

/* B) separador vertical (08) */
width:1px;align-self:stretch;background:rgba(241,235,224,.12)

/* C) separador de lista (o mais comum do arquivo) */
border-bottom:1px solid rgba(241,235,224,.1)
/* C') light (18) */
border-bottom:1px solid rgba(10,10,10,.12)

/* D) régua de seção do dashboard (15) */
padding-bottom:30px;border-bottom:1px solid rgba(241,235,224,.1)

/* E) topo da TabBar */
border-top:1px solid rgba(241,235,224,.1)   /* light: rgba(10,10,10,.12) */
```

**Pegadinhas RN:**
- Prefira a forma **A** (`View` com `height:1` + `backgroundColor`): `borderBottomWidth:1` no Android pode arredondar para 0 em densidade 1.5x; `height:1` + background nunca.
- Não use `StyleSheet.hairlineWidth` (≈0.5 em @2x): o design pede 1px cheio e a diferença é visível nesta paleta de baixo contraste.
- **B** (`align-self:stretch` numa row com `align-items:center`): `alignSelf:'stretch'` sobrescreve o `alignItems` do pai em RN — mas o filho **não** pode ter `height`, senão o stretch é ignorado.

---

### 20. `ServiceRow`

**Telas:** 04 (6 linhas, seleção) e 16 (6 linhas, gestão).

```css
/* 04 — linha */
display:flex;justify-content:space-between;align-items:center;padding:21px 0;border-bottom:1px solid rgba(241,235,224,.1);cursor:pointer
   coluna esquerda: display:flex;flex-direction:column;gap:7px
   título:          font-family:'Playfair Display',serif;font-size:19px
   duração:         font-size:9px;font-weight:600;letter-spacing:.2em;color:rgba(241,235,224,.45)
   preço:           font-size:13.5px;font-weight:500;color:rgba(241,235,224,.85)
   wrapper da lista: margin-top:26px

/* 16 — linha */
display:flex;justify-content:space-between;align-items:center;padding:22px 0;border-bottom:1px solid rgba(241,235,224,.1)
   coluna esquerda: display:flex;flex-direction:column;gap:8px
   título:          font-family:'Playfair Display',serif;font-size:19px
   meta:            font-size:9px;font-weight:600;letter-spacing:.2em;color:rgba(241,235,224,.45)   /* "90 MIN · R$ 320" */
   ação:            font-size:9px;font-weight:600;letter-spacing:.18em;color:rgba(241,235,224,.55);cursor:pointer   /* EDITAR */
   wrapper da lista: margin-top:26px
```
Serviços literais (mesma ordem nas duas telas): `Análise de Visagismo` 90 MIN R$ 320 · `Corte Assinatura` 60 MIN R$ 190 · `Corte & Barba` 90 MIN R$ 260 · `Ritual de Barba` 45 MIN R$ 140 · `Camuflagem de Fios` 60 MIN R$ 210 · `Consultoria de Imagem` 120 MIN R$ 480.

**Nenhuma das 12 linhas tem estado selecionado.** A tela 04 é "escolha o serviço" mas não mostra seleção (ela só aparece em 07, como resumo). Se precisar do estado, o vocabulário sugere borda/texto `var(--gold,#C9A96A)`.

**Props RN:** `{ title:string, meta:string, trailing:{type:'price',value:string}|{type:'action',label:string,onPress}, onPress?, showDivider?:boolean }`

**Pegadinhas RN:**
- O `border-bottom` existe na **última** linha em 04 e 16; em 13 a última **não** tem. Não "conserte" — replique a diferença.
- Em `FlatList`, `ItemSeparatorComponent` não desenha após o último item: use `borderBottomWidth` no próprio item (04/16) e `ItemSeparatorComponent` em 13.
- `Corte &amp; Barba` no HTML → `Corte & Barba` literal em JS/JSX. Não deixe o `&amp;` escapar para a string.

---

### 21. `HistoryRow`

**Telas:** 08 (4 linhas) e 14 (5 linhas).

```css
/* 08 */
display:flex;align-items:center;gap:18px;padding:19px 0;border-bottom:1px solid rgba(241,235,224,.1)
   data:   width:56px;font-size:9.5px;font-weight:600;letter-spacing:.14em;color:rgba(241,235,224,.45);flex:none
   título: flex:1;font-size:14px;color:rgba(241,235,224,.85)
   status: font-size:8.5px;font-weight:600;letter-spacing:.18em;color:rgba(241,235,224,.4)
   /* linha CANCELADA: o mesmo estilo + */ opacity:.45
   wrapper: margin-top:8px

/* 14 */
display:flex;align-items:center;gap:18px;padding:18px 0;border-bottom:1px solid rgba(241,235,224,.1)
   data:   width:56px;font-size:9.5px;font-weight:600;letter-spacing:.14em;color:rgba(241,235,224,.45);flex:none
   título: flex:1;font-size:14px;color:rgba(241,235,224,.88)
   preço:  font-size:12px;color:rgba(241,235,224,.45)
   wrapper: margin-top:8px
```
Status literais: `CONCLUÍDO` (3x em 08), `CANCELADO` (1x, na linha com `opacity:.45`).

**Props RN:** `{ date:string, title:string, trailing:string, tone?:'default'|'cancelled', trailingStyle:'status'|'price' }`

**Pegadinhas RN:**
- `width:56px` na data + `letter-spacing:.14em` a 9.5px (**1.33px**): `14 AGO` ≈ 38px, cabe.
- `opacity:.45` na View da linha cria nova camada de composição. Em listas longas, aplique a opacidade nas cores dos textos em vez da View.
- As diferenças de `padding` (19 vs 18) e de alfa do título (.85 vs .88) entre as duas telas são reais no CSS. Parametrize; não unifique.

---

### 22. `KeyValueRow` / `SettingRow` / `PreferenceRow` / `CardKeyValueRow` / `StackedField`

```css
/* A) KeyValueRow — 09 DADOS PESSOAIS */
display:flex;justify-content:space-between;align-items:center;padding:19px 0;border-bottom:1px solid rgba(241,235,224,.1)
   chave: font-size:12.5px;color:rgba(241,235,224,.5)
   valor: font-size:13.5px;color:rgba(241,235,224,.88)
   wrapper: margin-top:6px

/* B) PreferenceRow — 09 PREFERÊNCIAS */
display:flex;justify-content:space-between;align-items:center;padding:19px 0;border-bottom:1px solid rgba(241,235,224,.1)
   label: font-size:13.5px;color:rgba(241,235,224,.85)
   trailing: <Switch> (§31)  OU  texto: font-size:13.5px;color:rgba(241,235,224,.55)

/* C) SettingRow com chevron — 12 HORÁRIO DE TRABALHO */
display:flex;justify-content:space-between;align-items:center;padding:19px 0;border-bottom:1px solid rgba(241,235,224,.1);cursor:pointer
   label:   font-size:13px;color:rgba(241,235,224,.6)
   grupo:   display:flex;align-items:center;gap:12px
   valor:   font-size:14.5px
   chevron: font-size:14px;color:rgba(241,235,224,.35)      /* › */
   wrapper: margin-top:6px

/* D) CardKeyValueRow (dentro de card, sem divider) — 11 */
display:flex;justify-content:space-between;align-items:center
   chave: font-size:8.5px;font-weight:600;letter-spacing:.24em;color:rgba(241,235,224,.45)
   valor: font-size:14px

/* E) StackedField (label acima) — 07 */
display:flex;flex-direction:column;gap:8px
   label: font-size:8.5px;font-weight:600;letter-spacing:.24em;color:rgba(241,235,224,.45)
   valor: font-size:14.5px;color:rgba(241,235,224,.88)
   valor Playfair (SERVIÇO): font-family:'Playfair Display',serif;font-size:21px
   par lado a lado (DATA/HORÁRIO): display:flex;gap:56px
   total: display:flex;justify-content:space-between;align-items:flex-end
          + valor: font-family:'Playfair Display',serif;font-size:24px
```
Literais em 09: `E-mail` / `rafael.duarte@email.com`, `Telefone` / `+55 (11) 98244-1157`, `Lembretes por WhatsApp`, `Lembrete por e-mail`, `Profissional preferido` / `Stewer Gabriel`.
Em 12: `Início` / `09:00`, `Término` / `19:00`, `Intervalo` / `12:30 — 13:30`.

**Props RN:** `{ label:string, value?:string|ReactNode, trailing?:'chevron'|'switch'|'none', onPress?, variant:'plain'|'setting'|'card'|'stacked' }`

**Pegadinhas RN:**
- **Três tamanhos de label diferentes** para o que parece a mesma coisa: 12.5 / 13 / 13.5px, e três alfas: .5 / .6 / .85. Não normalize.
- O `—` em `12:30 — 13:30` é **em dash** (U+2014) com espaços, não hífen. Copie literal.
- `›` é U+203A, não `>`. Renderiza em Inter; se bundlar subset reduzido, verifique.
- `align-items:flex-end` na linha do total (07) alinha o **bottom da caixa**, não o baseline, e caixas de fontes diferentes têm descendentes diferentes — vai ficar ~2px fora. Se for crítico, use `alignItems:'baseline'` (suportado em RN).

---

### 23. `ClientRow`

**Tela:** 13 (7 linhas).

```css
/* linhas 1..6 */
display:flex;align-items:center;gap:16px;padding:17px 0;border-bottom:1px solid rgba(241,235,224,.1);cursor:pointer
/* linha 7 (última) — SEM border-bottom */
display:flex;align-items:center;gap:16px;padding:17px 0;cursor:pointer

   avatar:  width:42px;height:42px;border:1px solid rgba(241,235,224,.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:14px;flex:none
   coluna:  flex:1;display:flex;flex-direction:column;gap:6px
   nome:    font-size:14.5px
   meta:    font-size:8.5px;font-weight:600;letter-spacing:.18em;color:rgba(241,235,224,.42)
   chevron: font-size:14px;color:rgba(241,235,224,.3)     /* › */
   wrapper da lista: margin-top:14px
```
Literais: `Rafael Duarte` RD 14 AGO · `Henrique Sales` HS 28 AGO · `Bruno Costa` BC 22 AGO · `Otávio Lima` OL 30 JUL · `André Meirelles` AM 12 JUN · `Caio Bittencourt` CB 05 JUN · `Vicente Rocha` VR 28 MAI. Meta sempre `ÚLTIMA VISITA · <data>`.

**Props RN:** `{ initials:string, name:string, meta:string, onPress, showDivider:boolean }`

---

### 24. `Avatar` — círculo com iniciais

**Telas:** 09 (1x 58px), 13 (7x 42px), 14 (1x 54px).

```css
/* 09 */
width:58px;height:58px;border:1px solid rgba(241,235,224,.25);border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:19px;flex:none
/* 14 */
width:54px;height:54px;border:1px solid rgba(241,235,224,.25);border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:17px;flex:none
/* 13 */
width:42px;height:42px;border:1px solid rgba(241,235,224,.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:14px;flex:none
```
Sem fill, sem imagem — só borda + iniciais em Playfair, cor herdada `#F1EBE0`.

**Props RN:** `{ initials:string, size:58|54|42, borderAlpha?:.25|.2 }`

**Pegadinhas RN:**
- `border-radius:50%` → `borderRadius: size/2` (29 / 27 / 21). Percentual não é confiável.
- Iniciais em Playfair centralizadas: `includeFontPadding:false` + `textAlignVertical:'center'` (Android), senão descem ~2px. Serifadas têm ascendente alto e o centro óptico não é o centro da caixa — considere `marginTop:-1`.

---

### 25. `ProfileHeader`

**Telas:** 09, 14.

```css
/* container (idêntico nas duas) */
display:flex;align-items:center;gap:20px
   coluna: display:flex;flex-direction:column;gap:8px
/* 09 */
   nome: font-family:'Playfair Display',serif;font-size:24px
   meta: font-size:8.5px;font-weight:600;letter-spacing:.22em;color:rgba(241,235,224,.45)   /* CLIENTE DESDE MARÇO DE 2024 */
/* 14 */
   nome: font-family:'Playfair Display',serif;font-size:25px
   meta: font-size:8.5px;font-weight:600;letter-spacing:.2em;color:rgba(241,235,224,.45)    /* DESDE MARÇO DE 2024 · 12 VISITAS */
```

**Props RN:** `{ initials, name, meta, avatarSize, nameSize, metaTracking }`

---

### 26. `ImageSlot`

**Telas:** 05 e 17. Componente do Claude Design (`image-slot.js`) — na implementação vira `<Image>`.

```html
<!-- 05 -->
<image-slot id="pro-retrato" shape="rect" placeholder="Retrato do profissional" style="width:100%;height:330px;display:block"></image-slot>
<!-- 17 -->
<image-slot id="pro-equipe" shape="rect" placeholder="Foto" style="width:64px;height:64px;flex:none"></image-slot>
```

**Props RN:** `{ source:ImageSourcePropType|null, width:number|'100%', height:number, placeholderLabel:string, radius?:number }`

**Pegadinhas RN:**
- `width:'100%'` + `height:330` com `resizeMode:'cover'`. No Android, fonte remota com `width:'100%'` precisa das duas dimensões definidas ou não desenha.
- `64x64` com `flex:none` → `flexShrink:0` (default em RN, mas explicite em rows).
- Estado vazio: use `background:#121110` (a superfície do sistema) + label em `SubMeta` centralizado, em vez de um cinza genérico.

---

### 27. `StatusTag` e `StatusDot`

Não há badge com fill/pill em nenhuma tela — **todo status é texto em caps colorido**.

```css
/* A) gold, alinhado ao topo do card (08 CONFIRMADO, 17 ATIVO) */
font-size:8.5px;font-weight:600;letter-spacing:.18em;color:var(--gold,#C9A96A);align-self:flex-start

/* B) gold em linha de card (11 CONFIRMADO) */
font-size:9px;font-weight:600;letter-spacing:.18em;color:var(--gold,#C9A96A)

/* C) neutro (08 CONCLUÍDO, 08 CANCELADO) */
font-size:8.5px;font-weight:600;letter-spacing:.18em;color:rgba(241,235,224,.4)

/* D) gold, seleção (05 SELECIONADO) */
font-size:9px;font-weight:600;letter-spacing:.2em;color:var(--gold,#C9A96A)

/* E) gold, flag de contexto (10 PRIMEIRA VISITA) */
font-size:8.5px;font-weight:600;letter-spacing:.14em;color:var(--gold,#C9A96A);margin-top:6px

/* F) StatusDot — ponto do "hoje" no calendário */
width:3px;height:3px;border-radius:50%;background:var(--gold,#C9A96A)     /* light (19): background:#A8894F */

/* G) delta positivo (15) */
font-size:9px;font-weight:600;letter-spacing:.16em;color:var(--gold,#C9A96A);padding-bottom:4px   /* "+3 VS. JULHO" */
```
Literais: `CONFIRMADO`, `CONCLUÍDO`, `CANCELADO`, `ATIVO`, `SELECIONADO`, `PRIMEIRA VISITA`, `DISPONÍVEL`, `INTERVALO`.

**Props RN:** `{ label:string, tone:'gold'|'muted', size?:8.5|9, tracking?:number }`

**Pegadinhas RN:**
- `align-self:flex-start` num item de row com `align-items:center`: `alignSelf:'flex-start'` sobrescreve corretamente em RN. É o que faz `CONFIRMADO` (08) e `ATIVO` (17) subirem ao topo.
- `borderRadius:50%` no dot de 3px → `borderRadius:1.5`. Em @3x pode virar um quadradinho — aceitável nesse tamanho, ou SVG.
- **Não existe cor de erro/vermelho na paleta.** `CANCELADO` é só `rgba(241,235,224,.4)` + `opacity:.45` na linha. Um estado de erro real é decisão nova de design.

---

### 28. `Calendar`

**Telas:** 06 (dark) e 19 (light). Setembro 2026, 2 células vazias iniciais, 30 dias.

```css
/* nav do mês */
display:flex;justify-content:space-between;align-items:center;margin-top:26px
   anterior (visualmente desabilitado): font-size:16px;color:rgba(241,235,224,.4);cursor:pointer;padding:0 6px   /* ‹ */
   título:  font-family:'Playfair Display',serif;font-size:18px                                                  /* Setembro 2026 */
   próximo: font-size:16px;color:rgba(241,235,224,.75);cursor:pointer;padding:0 6px                              /* › */

/* cabeçalho de dias da semana */
display:grid;grid-template-columns:repeat(7,1fr);margin-top:18px
   célula: text-align:center;font-size:8.5px;font-weight:600;letter-spacing:.14em;color:rgba(241,235,224,.38);padding:6px 0
   textos: D S T Q Q S S

/* grade de dias */
display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-top:4px
   2 células vazias no início: <div></div><div></div>

/* DayCell — default (dia com vaga) */
height:40px;display:flex;align-items:center;justify-content:center;font-size:13px;color:rgba(241,235,224,.8)
/* DayCell — hoje (dia 1, com dot; cor herdada = #F1EBE0 cheio) */
height:40px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font-size:13px
   + <span style="width:3px;height:3px;border-radius:50%;background:var(--gold,#C9A96A)">
/* DayCell — fechado / indisponível (6,7,13,14,20,21,27,28) */
height:40px;display:flex;align-items:center;justify-content:center;font-size:13px;color:rgba(241,235,224,.25)
/* DayCell — SELECIONADO (dia 11) */
height:40px;display:flex;align-items:center;justify-content:center;font-size:13px;color:var(--gold,#C9A96A);border:1px solid var(--gold,#C9A96A);border-radius:var(--r,2px)
```

**Light (19) — só as cores mudam:**
```css
nav anterior: font-size:16px;color:rgba(10,10,10,.4);cursor:pointer;padding:0 6px
nav próximo:  font-size:16px;color:rgba(10,10,10,.7);cursor:pointer;padding:0 6px
weekday:      ...color:rgba(10,10,10,.4);padding:6px 0
default:      ...color:rgba(10,10,10,.75)
fechado:      ...color:rgba(10,10,10,.25)
hoje (dot):   background:#A8894F
SELECIONADO:  height:40px;display:flex;align-items:center;justify-content:center;font-size:13px;color:#A8894F;border:1px solid var(--gold,#C9A96A);border-radius:var(--r,2px);font-weight:600
              /* ATENÇÃO: no light o dia selecionado ganha font-weight:600; no dark NÃO tem */
```

**Props RN:** `{ month:string, year:number, firstWeekdayOffset:number, days:{n:number, state:'default'|'today'|'closed'|'selected'}[], onSelect:(n)=>void, onPrev, onNext, canPrev:boolean, theme }`

**Pegadinhas RN:**
- **`display:grid` não existe em RN.** Opções: (a) `flexDirection:'row', flexWrap:'wrap'` com células em `width:'14.2857%'` — mas o `gap:2px` é incompatível com percentuais que somam 100%; (b) medir a largura (`390 − 2*28 = 334`) e calcular `cellW = (334 − 6*2)/7 = 45.71` — fracionário, gera gaps irregulares por arredondamento. **Recomendado:** `flexBasis:'14.2857%'` sem gap e mover os 2px para dentro da célula como `margin:1` (soma 2 entre células), aceitando 1px de recuo nas bordas externas.
- A célula "hoje" muda para `flex-direction:column` com `gap:3px`, então **o número sobe ~3px** em relação às outras células. Isso está no design. Replique, ou compense posicionando o dot como sibling absoluto.
- A célula selecionada tem `border:1px` dentro dos mesmos 40px. RN é border-box, então o número não se desloca — igual ao CSS.
- As 2 células vazias são `<div></div>` sem estilo: em RN precisam de `<View style={{width:cellW, height:40}}/>` explícito, senão a grade desalinha.
- `padding:0 6px` nas setas → hitbox ~12x19. Adicione `hitSlop`.
- Dias "fechados" (`.25`) **não têm** `cursor:pointer` — não são clicáveis. Não coloque `onPress`.

---

### 29. `SlotChip` — chip de horário

**Telas:** 06 (9 chips) e 19 (9 chips).

```css
/* grade */
display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:16px

/* ===== DARK (06) ===== */
/* default */
border:1px solid rgba(241,235,224,.16);border-radius:var(--r,2px);padding:13px 0;text-align:center;font-size:12px;font-weight:500;letter-spacing:.08em;cursor:pointer
/* SELECIONADO (15:30) */
border:1px solid var(--gold,#C9A96A);border-radius:var(--r,2px);padding:13px 0;text-align:center;font-size:12px;font-weight:600;letter-spacing:.08em;color:var(--gold,#C9A96A);cursor:pointer
/* DESABILITADO (11:00, 18:30) — sem borda, sem cursor */
padding:13px 0;text-align:center;font-size:12px;font-weight:500;letter-spacing:.08em;color:rgba(241,235,224,.22)

/* ===== LIGHT (19) ===== */
/* default */
border:1px solid rgba(10,10,10,.18);border-radius:var(--r,2px);padding:13px 0;text-align:center;font-size:12px;font-weight:500;letter-spacing:.08em;cursor:pointer
/* SELECIONADO */
border:1px solid var(--gold,#C9A96A);border-radius:var(--r,2px);padding:13px 0;text-align:center;font-size:12px;font-weight:600;letter-spacing:.08em;color:#A8894F;cursor:pointer
/* DESABILITADO */
padding:13px 0;text-align:center;font-size:12px;font-weight:500;letter-spacing:.08em;color:rgba(10,10,10,.25)
```
Horários literais (mesma ordem nas duas telas): `09:00 10:00 11:00 13:30 14:30 15:30 16:30 17:30 18:30`. Desabilitados: 11:00 e 18:30. Selecionado: 15:30.

**Props RN:** `{ time:string, state:'default'|'selected'|'disabled', onPress, theme }`

**Pegadinhas RN (importante):**
- **O chip desabilitado não tem borda**, o que o deixa **2px mais baixo** que os vizinhos. No HTML o `align-items:stretch` do grid mascara isso (as células esticam). Em RN com flex-wrap **não** mascara: o desabilitado fica menor e desalinha a linha. **Correção obrigatória:** `borderWidth:1, borderColor:'transparent'` no desabilitado.
- `repeat(3,1fr);gap:10px` → largura útil `334`; `(334 − 2*10)/3 = 104.67`. Fracionário. Prefira agrupar de 3 em 3 numa row com `flex:1` em cada e `marginRight:10` nos dois primeiros.
- `letter-spacing:.08em` a 12px = **0.96px**. Centralizado sem compensação: `09:00` fica 0.48px à esquerda. Imperceptível.
- `font-weight:500` → `Inter-Medium`; `600` no selecionado → `Inter-SemiBold`. No Android registre as famílias em vez de confiar em `fontWeight`.
- O selecionado **não** tem fill dourado — só borda + texto. Não invente `background:#C9A96A`.

---

### 30. `DayToggleChip` — 41x41 (dias de atendimento)

**Tela:** 12 (7 chips).

```css
/* linha */
display:flex;gap:9px;margin-top:16px

/* OFF (D, S) */
width:41px;height:41px;border:1px solid rgba(241,235,224,.12);border-radius:var(--r,2px);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;color:rgba(241,235,224,.28)

/* ON (T, Q, Q, S, S) — cor herdada = #F1EBE0 cheio */
width:41px;height:41px;border:1px solid var(--gold,#C9A96A);border-radius:var(--r,2px);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600
```
Letras literais na ordem: `D S T Q Q S S`.

**Props RN:** `{ letter:string, on:boolean, onToggle }`

**Pegadinhas RN:**
- 7×41 + 6×9 = **341px**, mas a largura útil é **334px** (390 − 2×28). **O design vaza 7px.** No HTML o `display:flex` sem wrap comprime os filhos (que não têm `flex:none`) para ~40px. Em RN o `width:41` fixo é respeitado com mais rigor e você pode ganhar overflow horizontal. Use `flexShrink:1`, ou `flex:1` + `aspectRatio:1` nos 7 chips, tratando 41px como referência e não como lei.
- Sem gradiente e sem fill: o "on" é só borda dourada + texto em tinta cheia.

---

### 31. `Switch` — toggle 34x18 retangular (não pill)

**Tela:** 09 (2 instâncias).

```css
/* ON */
trilha: width:34px;height:18px;border:1px solid var(--gold,#C9A96A);border-radius:var(--r,2px);position:relative
botão:  position:absolute;right:2px;top:2px;bottom:2px;width:12px;background:var(--gold,#C9A96A)

/* OFF */
trilha: width:34px;height:18px;border:1px solid rgba(241,235,224,.25);border-radius:var(--r,2px);position:relative
botão:  position:absolute;left:2px;top:2px;bottom:2px;width:12px;background:rgba(241,235,224,.3)
```
O botão **não tem border-radius** — é um retângulo de 12x12.

**Props RN:** `{ value:boolean, onValueChange }`

**Pegadinhas RN:**
- **Não use o `<Switch>` nativo.** Ele é pill, tem cor de plataforma e no iOS mede 51x31 — nada a ver com esses 34x18 quadrados. Construa com `Pressable` + duas `View`s.
- `top:2px;bottom:2px` define a altura implicitamente. Em RN funciona (`position:'absolute'` com top+bottom e sem height estica), mas `height:12` explícito é mais previsível.
- Alvo 34x18 → pequeno. `hitSlop={{top:13,bottom:13,left:8,right:8}}` para chegar a 44x44.
- Anime com `translateX` de 0→16 (34 − 2 − 12 − 2 de borda = 18 de `left` final) em vez de animar `left`: não dispara layout.

---

### 32. `TimelineRow` + `BookingBlock` / `AvailableSlot` / `BreakBlock`

**Tela:** 10 (8 linhas: 4 atendimentos, 3 disponíveis, 1 intervalo).

```css
/* lista */
display:flex;flex-direction:column;gap:10px;margin-top:28px
/* linha */
display:flex;gap:16px

/* gutter de hora — variante ATENDIMENTO (alfa .5, padding-top 14) */
width:44px;font-size:10px;font-weight:600;letter-spacing:.1em;color:rgba(241,235,224,.5);padding-top:14px;flex:none
/* gutter de hora — variante VAGO/INTERVALO (alfa .35, padding-top 9) */
width:44px;font-size:10px;font-weight:600;letter-spacing:.1em;color:rgba(241,235,224,.35);padding-top:9px;flex:none

/* BookingBlock — padrão */
flex:1;background:#121110;border:1px solid rgba(241,235,224,.1);border-radius:var(--r,2px);padding:15px 18px;display:flex;justify-content:space-between;align-items:center;cursor:pointer
/* BookingBlock — variante alta (com flag PRIMEIRA VISITA) */
flex:1;background:#121110;border:1px solid rgba(241,235,224,.1);border-radius:var(--r,2px);padding:15px 18px 24px;display:flex;justify-content:space-between;align-items:flex-start;cursor:pointer
   coluna:  display:flex;flex-direction:column;gap:6px
   nome:    font-size:14px;font-weight:500
   serviço: font-size:8.5px;font-weight:600;letter-spacing:.18em;color:rgba(241,235,224,.5)
   flag:    font-size:8.5px;font-weight:600;letter-spacing:.14em;color:var(--gold,#C9A96A);margin-top:6px
   duração: font-size:8.5px;font-weight:600;letter-spacing:.14em;color:rgba(241,235,224,.4)

/* AvailableSlot — DASHED, texto literal: DISPONÍVEL */
flex:1;border:1px dashed rgba(241,235,224,.16);border-radius:var(--r,2px);padding:10px;text-align:center;font-size:8.5px;font-weight:600;letter-spacing:.22em;color:rgba(241,235,224,.32)

/* BreakBlock — FILL sem borda, texto literal: INTERVALO */
flex:1;background:#0E0E0D;border-radius:var(--r,2px);padding:10px;text-align:center;font-size:8.5px;font-weight:600;letter-spacing:.22em;color:rgba(241,235,224,.3)
```
Sequência literal: `09:00` Rafael Duarte / CORTE ASSINATURA / 60 MIN · `10:00` DISPONÍVEL · `11:00` Henrique Sales / ANÁLISE DE VISAGISMO / PRIMEIRA VISITA / 90 MIN · `12:30` INTERVALO · `13:30` Bruno Costa / CORTE & BARBA / 90 MIN · `15:00` DISPONÍVEL · `16:30` Otávio Lima / RITUAL DE BARBA / 45 MIN · `17:15` DISPONÍVEL.

**Props RN:** `{ time:string, kind:'booking'|'available'|'break', client?:string, service?:string, duration?:string, flag?:string, onPress? }`

**Pegadinhas RN:**
- O `padding-top` do gutter (14 vs 9) é o que alinha a hora com a **primeira linha de texto** do bloco. Se você mudar padding ou fonte, recalcule. Alternativa: `alignItems:'flex-start'` na row com `paddingTop` calculado.
- **`borderStyle:'dashed'` é pouco confiável no Android em RN:** só funciona com `borderWidth` uniforme e **`borderRadius:0`**; com raio 2 o Android renderiza sólido ou nada. Saídas: (a) `borderRadius:0` no AvailableSlot (perde 2px, quase invisível) ou (b) `react-native-svg` com `<Rect strokeDasharray="4 4" rx="2"/>`. Vale também para o `DashedAddCard` (§38).
- `#121110` e `#0E0E0D` são superfícies distintas e muito próximas do fundo `#0A0A0A` (Δ ~2 e ~4 por canal). Em OLED com dithering podem virar bandas — **não** arredonde para `#111` ou `#0F0F0F`.
- `align-items:flex-start` na variante alta faz `90 MIN` subir ao topo. Se usar `center` por descuido, o card parece errado.

---

### 33. `DateBadge` — dia/mês empilhado

**Tela:** 08.

```css
display:flex;flex-direction:column;align-items:center;gap:4px;width:44px;flex:none
   dia: font-family:'Playfair Display',serif;font-size:26px        /* 11 */
   mês: font-size:8.5px;font-weight:600;letter-spacing:.2em;color:rgba(241,235,224,.45)   /* SET */
```

**Props RN:** `{ day:string, month:string }`

**Pegadinhas RN:** `letter-spacing:.2em` a 8.5px = **1.7px**, centralizado em 44px → `SET` fica 0.85px à esquerda. O design não compensa.

---

### 34. `StatBlock` — KPI do dashboard

**Tela:** 15 (3 blocos).

```css
/* seção — 1º bloco */
margin-top:38px;padding-bottom:30px;border-bottom:1px solid rgba(241,235,224,.1)
/* seção — 2º e 3º blocos */
margin-top:30px;padding-bottom:30px;border-bottom:1px solid rgba(241,235,224,.1)

/* linha com trailing (1º e 3º) */
display:flex;justify-content:space-between;align-items:flex-end

/* número */
font-family:'Playfair Display',serif;font-size:42px;line-height:1
/* label */
font-size:8.5px;font-weight:600;letter-spacing:.22em;color:rgba(241,235,224,.45);margin-top:12px
/* delta (3º bloco) */
font-size:9px;font-weight:600;letter-spacing:.16em;color:var(--gold,#C9A96A);padding-bottom:4px
```
Literais: `32` / `AGENDAMENTOS NA SEMANA` · `78%` / `TAXA DE OCUPAÇÃO` · `9` / `CLIENTES NOVOS NO MÊS` / `+3 VS. JULHO`.
Rodapé: linha `display:flex;justify-content:space-between;align-items:center;margin-top:28px`, com `Receita estimada da semana` (`font-size:12.5px;color:rgba(241,235,224,.55)`) e `R$ 7.240` (`font-family:'Playfair Display',serif;font-size:19px`).

**Props RN:** `{ value:string, label:string, delta?:string, trailing?:ReactNode, isFirst?:boolean }`

**Pegadinhas RN:** ver §8 sobre `line-height:1` a 42px em Playfair no Android. Aqui é crítico: `78%` tem o `%` alto e `9` tem descendente zero — a caixa varia. `includeFontPadding:false` obrigatório.

---

### 35. `StatTrio` — 3 stats inline

**Tela:** 11.

```css
/* linha */
display:flex;gap:44px;margin-top:18px
/* item */
display:flex;flex-direction:column;gap:6px
   valor: font-family:'Playfair Display',serif;font-size:21px
   label: font-size:8.5px;font-weight:600;letter-spacing:.18em;color:rgba(241,235,224,.45)
```
Literais: `12`/`VISITAS` · `Mar 2024`/`CLIENTE DESDE` · `14 Ago`/`ÚLTIMA VISITA`.

**Pegadinhas RN:** `gap:44px` fixo + 3 labels em caps (`CLIENTE DESDE` ≈ 82px) numa largura útil de 334px → 3 labels + 2 gaps de 44 já ultrapassa. No HTML os itens comprimem. Em RN use `justifyContent:'space-between'` sem gap e `flexShrink:1`, ou `flexWrap`. **Candidato a scroll horizontal.**

---

### 36. `MiniBarChart`

**Tela:** 15.

```css
/* linha */
display:flex;align-items:flex-end;gap:9px
/* coluna */
display:flex;flex-direction:column;align-items:center;gap:8px
/* barra normal */
width:18px;height:{26|33|40|47|2}px;background:rgba(241,235,224,.16)
/* barra destacada (T = terça) */
width:18px;height:40px;background:var(--gold,#C9A96A)
/* label */
font-size:7.5px;font-weight:600;color:rgba(241,235,224,.35)
```
Alturas na ordem exata dos labels `S T Q Q S S D`: **26, 40, 33, 40, 47, 26, 2**. A barra dourada é a **segunda** (T, altura 40). A última (D) tem `height:2px` — não é zero.

**Props RN:** `{ bars:{label:string, height:number, highlighted?:boolean}[] }`

**Pegadinhas RN:**
- Sem eixo, sem grid, sem tooltip. Não "melhore" adicionando eixos.
- 7×18 + 6×9 = 180px, cabe folgado no espaço à direita do KPI.
- `height:2` numa View com background renderiza; se arredondar para 0, use `minHeight:2`.
- `align-items:flex-end` no container alinha os **bottoms das colunas** (barra + label), então os labels ficam na mesma linha de base e as barras crescem para cima a partir dela. É esse o efeito — fácil de errar.

---

### 37. `ProgressBar`

**Tela:** 15.

```css
/* trilha */
height:2px;background:rgba(241,235,224,.12);margin-top:20px
/* preenchimento */
width:78%;height:100%;background:var(--gold,#C9A96A)
```
Sem `border-radius`.

**Props RN:** `{ percent:number }`

**Pegadinhas RN:** `height:'100%'` num filho de View de `height:2` funciona; mais simples é `height:2` direto no fill. **Não** adicione `borderRadius` — a linguagem do design é retilínea.

---

### 38. `DashedAddCard`

**Tela:** 17.

```css
border:1px dashed rgba(241,235,224,.2);border-radius:var(--r,2px);padding:26px;margin-top:16px;display:flex;flex-direction:column;align-items:center;gap:10px;cursor:pointer
  style-hover="border-color:rgba(241,235,224,.4)"
   glifo "+": font-size:16px;color:rgba(241,235,224,.55);line-height:1
   label:     font-size:9.5px;font-weight:600;letter-spacing:.22em;color:rgba(241,235,224,.6)   /* ADICIONAR PROFISSIONAL */
```

**Props RN:** `{ label:string, onPress }`

**Pegadinhas RN:** mesmo problema de `borderStyle:'dashed'` + `borderRadius` do §32 — SVG ou `borderRadius:0`. `line-height:1` no `+` de 16px → `lineHeight:16` + `includeFontPadding:false`, senão o `+` desalinha do label no Android.

---

### 39. `Footnote` / `LegalFootnote`

```css
/* 02 — abaixo do PrimaryButton */
font-size:11px;color:rgba(241,235,224,.42);margin-top:18px;text-align:center
   → "Enviaremos um código de confirmação."
/* 05 */
font-size:11px;color:rgba(241,235,224,.38);margin-top:20px;text-align:center
   → "Em breve, novos profissionais do ateliê."
/* 07 */
font-size:11.5px;color:rgba(241,235,224,.42);margin-top:20px;line-height:1.7
   → "Cancelamento sem custo até 24 horas antes do horário marcado."
/* 16 */
font-size:11px;color:rgba(241,235,224,.38);margin-top:22px
   → "Serviços inativos não aparecem para os clientes."
/* 17 — com <br> forçado */
font-size:11px;line-height:1.7;color:rgba(241,235,224,.38);margin-top:20px;text-align:center
   → "O convite dá acesso ao painel do profissional,<br>com agenda e clientes próprios."
/* 02 — legal, fixo no rodapé (gutter de 36px, não 28px) */
position:absolute;bottom:40px;left:36px;right:36px;text-align:center;font-size:11px;line-height:1.7;color:rgba(241,235,224,.38)
   links: <a style="color:rgba(241,235,224,.6)">
   → "Ao continuar, você aceita os Termos de uso e a Política de privacidade."
```

**Pegadinhas RN:**
- `line-height:1.7` a 11px = **18.7**; a 11.5px = **19.55**.
- O `<br>` do 17 → `{'\n'}` no `<Text>`, ou deixe o wrap natural. Com tradução, o `<br>` fixo quebra errado — prefira wrap natural com `textAlign:'center'`.
- Links inline: `<Text onPress>` aninhado herda `fontSize`/`lineHeight` do pai, mas **você precisa** repetir a cor (`rgba(241,235,224,.6)`). Sublinhado: o design usa `text-decoration-color:rgba(201,169,106,.6)` + `text-underline-offset:3px`, e **RN não suporta cor de sublinhado nem offset**. Escolha: `textDecorationLine:'underline'` (cor do texto) ou uma `View` de 1px abaixo com o dourado translúcido.

---

### 40. `Glyph` — setas e sinais como texto

Todos são caracteres, não ícones:

| glifo | codepoint | uso | CSS |
|---|---|---|---|
| `←` | U+2190 | voltar | `font-size:19px;color:rgba(241,235,224,.75)` (light: `rgba(10,10,10,.7)`) |
| `‹` | U+2039 | mês/dia anterior | `font-size:16px;color:rgba(241,235,224,.4);padding:0 6px` (06/19) · `font-size:15px;color:rgba(241,235,224,.4)` (10) |
| `›` | U+203A | mês/dia próximo | `font-size:16px;color:rgba(241,235,224,.75);padding:0 6px` (06/19) · `font-size:15px;color:rgba(241,235,224,.75)` (10) · `font-size:14px;color:rgba(241,235,224,.35)` (12) · `font-size:14px;color:rgba(241,235,224,.3)` (13) |
| `×` | U+00D7 | remover bloqueio | `font-size:15px;color:rgba(241,235,224,.4)` (12) |
| `+` | U+002B | adicionar | `font-size:16px;color:rgba(241,235,224,.55);line-height:1` (17) |

Par de setas do 10: `display:flex;gap:8px;padding-bottom:4px`.

**Pegadinhas RN:** o design **não** define `font-family` nesses glifos → herdam `Inter`. Se você bundlar um subset (latin), U+2190/2039/203A/00D7 podem **não estar** e cair no fallback do sistema, com métricas e peso diferentes. Inclua `latin-ext` + `general punctuation` no subset, ou troque por `react-native-svg`/ícone. Verifique especialmente `←` e `×`.

---

### 41. `ScreenBody` — padding de conteúdo

```css
padding:52px 28px 0    /* 02 */
padding:44px 28px 0    /* 03, 08, 09, 18 */
padding:40px 28px 0    /* 10, 12, 13, 15, 16, 17 */
padding:34px 28px 0    /* 04, 05, 07, 11 */
padding:30px 28px 0    /* 06, 14, 19 */
```
Nas telas com `NavHeader`, o header tem `padding:20px 28px 0` e o body vem depois com o seu próprio padding-top (34 ou 30).
Header com meta à direita (10, 13, 15, 16): `display:flex;justify-content:space-between;align-items:flex-end`.

**Pegadinhas RN:** `padding-bottom:0` significa que o conteúdo passa **por baixo** da TabBar absoluta em 03/08/09/10/12/13/15/16/17/18. Num `ScrollView`, adicione `contentContainerStyle={{paddingBottom: tabBarHeight + insets.bottom}}` senão o último item fica inalcançável. Nenhuma tela reserva espaço para a TabBar — é bug latente do mockup (os frames são estáticos e não rolam).

---

## 3. Tabela de conversão `letter-spacing` (em → px para RN)

`letterSpacing` em React Native é **px absoluto**. Multiplique `fontSize × valor em em`:

| fontSize | em | letterSpacing RN | onde |
|---|---|---|---|
| 7.5 | — | 0 | label do MiniBarChart |
| 8 | .2 | **1.6** | assinatura das anotações (14) |
| 8.5 | .14 | **1.19** | duração/flag do BookingBlock, weekday do calendário |
| 8.5 | .18 | **1.53** | StatusTag, meta de ClientRow, StatTrio |
| 8.5 | .2 | **1.7** | mês do DateBadge, meta do ProfileHeader (14), subtítulo do card 17 |
| 8.5 | .22 | **1.87** | label de StatBlock, meta do ProfileHeader (09) |
| 8.5 | .24 | **2.04** | SectionLabel em card (07, 11, 14) |
| 8.5 | .3 | **2.55** | rodapé do splash |
| 9 | .14 | **1.26** | labels da TabBar |
| 9 | .16 | **1.44** | delta do StatBlock |
| 9 | .18 | **1.62** | TextAction, StatusTag em card |
| 9 | .2 | **1.8** | SubMeta, SELECIONADO, TextAction centralizado |
| 9 | .22 | **1.98** | label de TextField |
| 9 | .24 | **2.16** | SectionLabel, eyebrow do NavHeader |
| 9 | .26 | **2.34** | Eyebrow |
| 9 | .3 | **2.7** | tagline do splash (+ `paddingLeft:2.7`) |
| 9.5 | .14 | **1.33** | data do HistoryRow |
| 9.5 | .22 | **2.09** | label do DashedAddCard |
| 10 | .1 | **1.0** | gutter de hora da timeline |
| 10 | .18 | **1.8** | GhostButton compacto (16) |
| 10 | .2 | **2.0** | tabs do 02, GhostButton em par (11) |
| 10 | .22 | **2.2** | GhostButton full-width (09, 12, 14) |
| 10.5 | .16 | **1.68** | horário no card do 03/18 |
| 10.5 | .22 | **2.31** | PrimaryButton |
| 12 | .08 | **0.96** | SlotChip |
| 17 | .08 | **1.36** | "SG" do cover plate |
| 19 | .08 | **1.52** | "SG" do splash |
| 20 | .32 | **6.4** | wordmark do splash (+ `paddingLeft:6.4`) |

---

## 4. Pegadinhas transversais de React Native

1. **`letterSpacing` é px, não em.** Use a tabela §3. Um `letterSpacing:0.24` (achando que é em) deixa todos os caps do app colados.
2. **Compensação do tracking em texto centralizado.** O tracking vai depois do último glyph, deslocando texto centralizado para a esquerda por `letterSpacing/2`. O design compensa em **dois lugares apenas** (`padding-left:.32em` no wordmark e `padding-left:.3em` na tagline do splash), e usa o valor **inteiro**, não a metade. Nos outros ~40 textos centralizados em caps (PrimaryButton, GhostButton, SlotChip, DISPONÍVEL, INTERVALO, DateBadge, DashedAddCard, rodapé do splash) **não compensa**. Escolha uma política e aplique consistentemente; compensar tudo divergirá do mockup em ~1px por elemento.
3. **`fontWeight` + fonte customizada = quebrado no Android.** Registre `Inter-Regular/-Medium/-SemiBold` e `PlayfairDisplay-Regular/-Medium/-SemiBold/-Italic/-MediumItalic` e selecione por `fontFamily`. Mapeamento: 400→Regular, 500→Medium, 600→SemiBold.
4. **`lineHeight` é px, não multiplicador.** Ocorrências: `1` (42px→42, 16px→16), `1.7` (11px→18.7, 11.5px→19.55), `1.75` (13px→22.75), `1.8` (13px→23.4).
5. **`includeFontPadding:false`** em todo caps ≤ 10px e em todo Playfair com `lineHeight` apertado. Sem isso o Android adiciona padding de fonte e desalinha todos os pares label/valor.
6. **`allowFontScaling={false}`** (ou `maxFontSizeMultiplier={1.1}`) nos micro-labels de 7.5–10px. Com acessibilidade em "grande", `DISPONIBILIDADE` na TabBar e `AGENDAMENTOS NA SEMANA` estouram.
7. **Cor não herda de `View` para `Text`.** O frame define `color:#F1EBE0` uma vez e ~200 textos herdam. Em RN, crie `<T>` com a cor do tema injetada, ou terá texto preto sobre `#0A0A0A`.
8. **`textAlign` vai no `Text`, não na `View`.** Todo `text-align:center` do design está numa `div` com texto direto → em RN vira `<View><Text style={{textAlign:'center'}}>`.
9. **`display:grid` não existe.** Dois grids: calendário `repeat(7,1fr) gap:2px` (§28) e SlotChip `repeat(3,1fr) gap:10px` (§29).
10. **`gap` exige RN ≥ 0.71.** O design usa gap em 40+ lugares (2, 4, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 22, 26, 44, 56px). Em versões antigas, converta para margens no filho com checagem de índice — **não** use `marginHorizontal: gap/2`, que muda os alinhamentos externos.
11. **`borderStyle:'dashed'` + `borderRadius` ≠ 0 é quebrado no Android.** Afeta `AvailableSlot` (§32) e `DashedAddCard` (§38). SVG ou raio 0.
12. **`transform:rotate` não afeta layout.** O losango de 58px desenha 82px; o de 7px desenha 9.9px; o cabo da lupa de 5px desenha 4.6px. Com `overflow:'hidden'` em ancestrais (o `ScreenFrame` tem), as pontas são cortadas. Envolva cada rotacionado num wrapper maior.
13. **Não há gradiente nenhum no arquivo.** Zero `linear-gradient`. Tudo é cor plana, borda de 1px e alfa. Não instale `expo-linear-gradient` "por precaução", e não introduza gradientes — o design é deliberadamente plano.
14. **Hairlines são 1px cheio, não `StyleSheet.hairlineWidth`.** Prefira `View` de `height:1` + `backgroundColor` a `borderBottomWidth` nos separadores (mais previsível no Android).
15. **`border-radius:var(--r,2px)` = 2 em tudo, exceto:** `3px` (casca da bateria), `1px` (carga da bateria), `99px` (home indicator), `50%` (avatares, dots, círculo da lupa). Exponha `radius: 2` como token (a prop `cantos` do board varia 0–10).
16. **Alvos de toque abaixo de 44px** em: `TextAction` (~11px), `Switch` (34x18), `Glyph` de navegação (12–23px), `GhostButton` compacto (35px), `DayToggleChip` (41px). `hitSlop` em todos.
17. **`opacity` no hover ≠ `TouchableOpacity`.** O design usa `.92` (primary dark), `.9` (primary light) e **mudança de borderColor** nos ghosts. Use `Pressable` com função de estilo e `android_ripple={null}`.
18. **Não existem estados de erro, loading, vazio ou desabilitado para formulários e botões** em nenhuma das 19 telas, e não há vermelho na paleta. É lacuna do design, não permissão para inventar — alinhe antes de codar.
19. **Dois tokens de dourado no light:** o **texto** dourado é `#A8894F`, mas a **borda** dourada continua `var(--gold,#C9A96A)` (visível no SlotChip selecionado e no DayCell selecionado do frame 19). Modele como `goldBorder` e `goldText` separados.
20. **Números Playfair com `line-height:1`** (KPI 42px, dia 26px do DateBadge, iniciais dos avatares): teste em Android real, é onde a serifa é cortada.
21. **Entidades HTML:** `&amp;` aparece em `Corte & Barba`, `CORTE & BARBA`, `VISAGISMO & CONSULTORIA DE IMAGEM`, `VISAGISTA & CONSULTOR DE IMAGEM`. Nas strings JS use `&` literal.
22. **`min-height` e `aspect-ratio` não aparecem no arquivo** — não há o risco documentado em `mobile-overflow-aspect-ratio-gotcha`. Mas dois componentes somam largura maior que o gutter útil de 334px e são os candidatos reais a scroll horizontal em RN: `DayToggleChip` (§30, 341px) e `StatTrio` (§35).
